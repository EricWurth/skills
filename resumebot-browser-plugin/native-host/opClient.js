"use strict";
// Thin wrapper around @1password/sdk so host.js can be exercised without a
// 1Password app. With RESUMEBOT_TEST_MODE=true the SDK is never loaded and
// a mock client is returned instead; the MOCK_* environment variables let
// tests script its responses (see test/native-host.test.js).

const TEST_MODE = process.env.RESUMEBOT_TEST_MODE === "true";

// SDK enums + static helpers used by host.js. In test mode they are
// string-literal stand-ins with the same values the real SDK uses.
let SDK;
if (TEST_MODE) {
  SDK = {
    ItemCategory: { Login: "Login" },
    ItemFieldType: { Text: "Text", Concealed: "Concealed", Email: "Email" },
    AutofillBehavior: { AnywhereOnWebsite: "AnywhereOnWebsite" },
    Secrets: {
      generatePassword() {
        const v = process.env.MOCK_GENERATE_PASSWORD;
        if (v && v.startsWith("reject:")) {
          const err = new Error("generatePassword rejected");
          err.name = v.substring(7);
          throw err;
        }
        return { password: v || "mockpass" };
      }
    }
  };
} else {
  SDK = require("@1password/sdk");
}

function rejectWith(name) {
  const err = new Error(name);
  err.name = name;
  return Promise.reject(err);
}

function parseEnv(name, fallback) {
  const v = process.env[name];
  if (!v) return { value: fallback };
  if (v.startsWith("reject:")) return { reject: v.substring(7) };
  try { return { value: JSON.parse(v) }; } catch (e) { return { value: fallback }; }
}

function createMockClient() {
  const list = parseEnv("MOCK_LIST", []);
  const create = parseEnv("MOCK_CREATE_RESOLVE", { id: "mock-item" });
  const get = parseEnv("MOCK_GET_RESOLVE", {
    id: "mock-item",
    fields: [
      { id: "username", fieldType: "Text", value: "mockuser" },
      { id: "password", fieldType: "Concealed", value: "mockpass" }
    ]
  });
  return {
    vaults: {
      list: () => Promise.resolve([{ id: "mock-vault", title: "Personal", vaultType: "Personal" }])
    },
    items: {
      list: () => list.reject ? rejectWith(list.reject) : Promise.resolve(list.value),
      create: () => create.reject ? rejectWith(create.reject) : Promise.resolve(create.value),
      get: () => get.reject ? rejectWith(get.reject) : Promise.resolve(get.value)
    }
  };
}

/**
 * Creates a 1Password client authenticated through the desktop app.
 * @param {string} accountName - account name as shown in the 1Password app sidebar (or account UUID)
 * @returns {Promise<Object>} SDK client (or a mock in test mode)
 */
function createOpClient(accountName) {
  if (TEST_MODE) return Promise.resolve(createMockClient());
  return SDK.createClient({
    auth: new SDK.DesktopAuth(accountName),
    integrationName: "ResumeBot Browser Plugin",
    integrationVersion: "1.1.0"
  });
}

module.exports = { createOpClient, SDK };
