#!/usr/bin/env node
"use strict";
// ResumeBot 1Password native messaging host.
//
// Chrome starts this process on demand and speaks JSON over stdio with a
// 4-byte little-endian length prefix per message. We wrap the 1Password
// JavaScript SDK (@1password/sdk) with desktop-app authentication
// (DesktopAuth): the 1Password app shows its own approval prompt, sessions
// are time-bound, and no long-lived credential ever exists here.
//
// Commands (see ../extension/MESSAGE-CONTRACT.md):
//   {cmd:"check",  domain}                      -> {exists, itemId?}
//   {cmd:"create", domain, username, title}     -> {itemId, password}
//   {cmd:"get",    itemId}                      -> {username, password}
// A locked/unauthorized SDK state is reported as {error:"locked"}.
//
// Security rails: secrets transit memory only, are never written to disk,
// and never appear in logs (stderr logs command names, not arguments).

const { createOpClient, SDK } = require("./opClient");
const { Buffer } = require("buffer");
const fs = require("fs");
const path = require("path");

let client = null;
let config = { accountName: "", vaultId: "" };

function loadConfig() {
  const configPath = path.join(__dirname, "config.json");
  if (fs.existsSync(configPath)) {
    try {
      config = { ...config, ...JSON.parse(fs.readFileSync(configPath, "utf8")) };
    } catch (e) {
      console.error(`[host] config.json unreadable: ${e.message}`);
    }
  }
  return config;
}

async function getClient() {
  if (!client) {
    if (!config.accountName) {
      throw new Error("1Password account name not configured (native-host/config.json)");
    }
    client = await createOpClient(config.accountName);
  }
  return client;
}

// The SDK signals a locked app / expired desktop session with dedicated
// error classes; older mocks and future versions may use names instead.
function isLocked(error) {
  if (!error) return false;
  const name = error.name || (error.constructor && error.constructor.name) || "";
  if (/Locked|Unauthorized|SessionExpired|DesktopSessionExpired/i.test(name)) return true;
  const msg = String(error.message || "");
  return /locked|unauthori[sz]ed|session (has )?expired|not authenticated/i.test(msg);
}

// --- stdio framing -----------------------------------------------------------

let buffer = Buffer.alloc(0);
let waitingFor = null;
let resolveFn = null;
let rejectFn = null;
let ended = false;

process.stdin.on("data", (chunk) => {
  buffer = Buffer.concat([buffer, chunk]);
  tryResolve();
});
process.stdin.on("end", () => {
  ended = true;
  tryResolve();
});
process.stdin.resume();

function tryResolve() {
  if (resolveFn === null) return;
  if (buffer.length >= waitingFor) {
    const b = buffer.slice(0, waitingFor);
    buffer = buffer.slice(waitingFor);
    const res = resolveFn;
    resolveFn = rejectFn = null;
    waitingFor = null;
    res(b);
  } else if (ended) {
    const res = resolveFn;
    resolveFn = rejectFn = null;
    waitingFor = null;
    res(Buffer.alloc(0));
  }
}

function readBytesExact(n) {
  if (buffer.length >= n) {
    const b = buffer.slice(0, n);
    buffer = buffer.slice(n);
    return Promise.resolve(b);
  }
  if (ended) return Promise.resolve(Buffer.alloc(0));
  return new Promise((resolve, reject) => {
    resolveFn = resolve;
    rejectFn = reject;
    waitingFor = n;
  });
}

// Returns the parsed message, `null` on EOF, or `{ malformed: true }` when a
// frame could not be parsed (we answer with an error and keep serving).
async function readMessage() {
  const lengthBuf = await readBytesExact(4);
  if (lengthBuf.length < 4) return null; // EOF
  const length = lengthBuf.readUInt32LE(0);
  if (length > 1024 * 1024) {
    // Chrome caps host->browser at 1MB; anything larger is not a real frame.
    buffer = Buffer.alloc(0);
    return { malformed: true };
  }
  const bodyBuf = await readBytesExact(length);
  if (bodyBuf.length < length) return null; // EOF mid-frame
  try {
    return JSON.parse(bodyBuf.toString("utf8"));
  } catch (e) {
    return { malformed: true };
  }
}

function writeMessage(message) {
  const payload = Buffer.from(JSON.stringify(message));
  const length = Buffer.alloc(4);
  length.writeUInt32LE(payload.length, 0);
  process.stdout.write(Buffer.concat([length, payload]));
}

// --- vault / item helpers ------------------------------------------------------

async function resolveVaultId(op) {
  if (config.vaultId) return config.vaultId;
  const vaults = await op.vaults.list();
  if (!vaults || vaults.length === 0) throw new Error("No vaults visible to this integration");
  // Prefer a personal/private vault, else the first one.
  const personal = vaults.find(v => /personal|private/i.test(v.title || "") || /Personal|Private/i.test(String(v.vaultType || "")));
  return (personal || vaults[0]).id;
}

function websiteMatches(websites, domain) {
  const d = String(domain || "").toLowerCase();
  return (websites || []).some(site => {
    const url = String(site.url || "").toLowerCase();
    const label = String(site.label || "").toLowerCase();
    return url.includes(d) || label.includes(d);
  });
}

// --- command handlers ------------------------------------------------------------

async function handleCheck(domain) {
  if (!domain) return { error: "bad_request" };
  try {
    const op = await getClient();
    const vaultId = await resolveVaultId(op);
    const items = await op.items.list(vaultId);
    const login = (items || []).find(item =>
      String(item.category) === SDK.ItemCategory.Login && websiteMatches(item.websites, domain));
    return login ? { exists: true, itemId: String(login.id) } : { exists: false };
  } catch (error) {
    if (isLocked(error)) return { error: "locked" };
    throw error;
  }
}

async function handleCreate(domain, username, title) {
  if (!domain || !username) return { error: "bad_request" };
  try {
    const op = await getClient();
    const vaultId = await resolveVaultId(op);

    const generated = SDK.Secrets.generatePassword({
      type: "Random",
      parameters: { length: 32, includeDigits: true, includeSymbols: true }
    });
    const password = typeof generated === "string" ? generated : generated.password;

    const item = await op.items.create({
      title: title || `Login for ${domain}`,
      category: SDK.ItemCategory.Login,
      vaultId,
      fields: [
        { id: "username", title: "username", fieldType: SDK.ItemFieldType.Text, value: username },
        { id: "password", title: "password", fieldType: SDK.ItemFieldType.Concealed, value: password }
      ],
      websites: [{ url: `https://${domain}`, label: "website", autofillBehavior: SDK.AutofillBehavior.AnywhereOnWebsite }],
      tags: ["resumebot"]
    });

    // The password goes back exactly once, for the extension to type into
    // the registration form. Nothing here keeps it.
    return { itemId: String(item.id), password };
  } catch (error) {
    if (isLocked(error)) return { error: "locked" };
    throw error;
  }
}

async function handleGet(itemId) {
  if (!itemId) return { error: "bad_request" };
  try {
    const op = await getClient();
    const vaultId = await resolveVaultId(op);
    const item = await op.items.get(vaultId, itemId);
    const fields = item.fields || [];
    const byId = (id) => fields.find(f => f.id === id || f.designation === id);
    const byType = (type) => fields.find(f => f.fieldType === type);
    const usernameField = byId("username") || byType(SDK.ItemFieldType.Text) || byType(SDK.ItemFieldType.Email);
    const passwordField = byId("password") || byType(SDK.ItemFieldType.Concealed);
    if (!usernameField || !passwordField) {
      return { error: "no_credentials_on_item" };
    }
    return { username: usernameField.value, password: passwordField.value };
  } catch (error) {
    if (isLocked(error)) return { error: "locked" };
    throw error;
  }
}

// --- main loop ----------------------------------------------------------------------

async function main() {
  loadConfig();
  console.error("[host] starting");

  while (true) {
    let message;
    try {
      message = await readMessage();
    } catch (error) {
      console.error(`[host] read error: ${error.message}`);
      break;
    }
    if (message === null) {
      console.error("[host] EOF, exiting");
      break;
    }
    if (message.malformed) {
      console.error("[host] malformed frame");
      writeMessage({ error: "malformed_message" });
      continue;
    }

    const cmd = message && message.cmd;
    console.error(`[host] cmd: ${cmd}`); // never the arguments
    let response;
    try {
      switch (cmd) {
        case "check":
          response = await handleCheck(message.domain);
          break;
        case "create":
          response = await handleCreate(message.domain, message.username, message.title);
          break;
        case "get":
          response = await handleGet(message.itemId);
          break;
        default:
          response = { error: "unknown_cmd" };
      }
    } catch (error) {
      console.error(`[host] ${cmd} failed: ${error && error.name ? error.name : "Error"}`);
      response = { error: "internal_error" };
    }
    writeMessage(response);
  }
}

main().catch(error => {
  console.error(`[host] fatal: ${error.message}`);
  process.exit(1);
});
