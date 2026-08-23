// main.js
// Content-script orchestrator. Loads last (see manifest.json) and wires the
// other modules into the actual product loop:
//
//   detect ATS -> scan fields -> match (override/adapter/attr/label/qa-memory)
//   -> fill what we know -> capture what we don't -> persist -> repeat.
//
// Everything here runs once per frame (all_frames: true), so a Greenhouse
// form inside an iframe fills from inside that iframe. The service worker
// addresses frames individually and aggregates the counts. This is the
// only content module that talks to chrome.* (besides common.sendMessage).
(function (root) {
  "use strict";

  const NS = root.ResumeBot || (root.ResumeBot = {});
  const C = NS.common;

  const state = {
    ats: null,
    adapter: null,
    synonyms: null
  };

  // --- Context -------------------------------------------------------------

  async function loadContext() {
    const [p, q, s] = await Promise.all([
      C.sendMessage({ action: "getProfile" }),
      C.sendMessage({ action: "qaList" }),
      C.sendMessage({ action: "getSiteRegistry" })
    ]);
    return {
      profile: (p && p.success && p.data) || {},
      qaMemory: { entries: (q && q.success && q.data && q.data.entries) || [] },
      siteRegistry: (s && s.success && s.data) || { domains: {}, atsOverrides: [], fieldOverrides: {} }
    };
  }

  // synonyms.json is the editable source of the Tier-1 dictionary; the copy
  // inside matcher.js is the fallback if the fetch fails.
  async function loadSynonyms() {
    if (state.synonyms) return state.synonyms;
    try {
      if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.getURL && typeof fetch === "function") {
        const res = await fetch(chrome.runtime.getURL("content/synonyms.json"));
        if (res.ok) state.synonyms = await res.json();
      }
    } catch (e) {
      /* fall through to built-in */
    }
    return state.synonyms;
  }

  // --- ATS detection -----------------------------------------------------------

  function hostnameMatches(hostname, pattern) {
    if (!pattern) return false;
    const p = String(pattern).toLowerCase().replace(/^\*\./, "");
    return hostname === p || hostname.endsWith("." + p) || hostname.includes(p);
  }

  function detectAts(siteRegistry) {
    const hostname = (root.location && root.location.hostname || "").toLowerCase();
    const overrides = (siteRegistry && Array.isArray(siteRegistry.atsOverrides)) ? siteRegistry.atsOverrides : [];
    for (const o of overrides) {
      if (o && o.atsType && hostnameMatches(hostname, o.domainPattern)) return o.atsType;
    }
    const det = NS.detect && NS.detect.detectATS ? NS.detect.detectATS(root.document) : null;
    return det ? det.ats : null;
  }

  function adapterFor(ats) {
    const reg = NS.adapters || {};
    const factory = (ats && reg[ats]) || reg.generic;
    if (!factory) return null;
    try { return factory(); } catch (e) { return null; }
  }

  // --- Scan + match ------------------------------------------------------------

  function scan() {
    const fields = NS.scanner.scanFields(root.document, { frameUrl: root.document.URL });
    for (const f of fields) {
      if (f.label) f.questionNormalized = NS.normalize.normalizeQuestion(f.label, root.document);
    }
    return fields;
  }

  function adapterTier0(fields, adapter) {
    const tier0 = new Array(fields.length).fill(null);
    if (!adapter || !adapter.selectorMap) return tier0;
    for (const [profilePath, selector] of Object.entries(adapter.selectorMap)) {
      if (!selector) continue;
      let els;
      try { els = Array.from(root.document.querySelectorAll(selector)); } catch (e) { continue; }
      if (els.length === 0) continue;
      fields.forEach((f, i) => {
        if (!tier0[i] && f.input && els.includes(f.input)) tier0[i] = profilePath;
      });
    }
    return tier0;
  }

  async function match(fields, ctx) {
    const synonyms = await loadSynonyms();
    const overrides = (ctx.siteRegistry && ctx.siteRegistry.fieldOverrides && ctx.siteRegistry.fieldOverrides[state.ats || "generic"]) || {};
    const tier0 = adapterTier0(fields, state.adapter);
    return NS.matcher.matchFields(fields, ctx.profile, ctx.qaMemory, { synonyms, overrides, tier0 });
  }

  async function scanAndMatch(ctx) {
    const fields = scan();
    const matches = await match(fields, ctx);
    return { fields, matches };
  }

  // --- Value resolution -----------------------------------------------------------

  function resolveValue(m, profile) {
    if (!m) return null;
    if (m.qaKey) return m.answer;
    const path = m.profilePath;
    if (!path) return null;
    if (path.indexOf("documents.resume") === 0) {
      const r = C.getNested(profile, "documents.resume");
      return r && r.base64 ? r : null;
    }
    if (C.DERIVED[path]) return C.DERIVED[path](profile) || null;
    if (C.isEeoPath(path)) return C.eeoValue(profile, path) || null;
    let v = C.getNested(profile, path);
    if (typeof v === "boolean") v = v ? "yes" : "no";
    if (v === undefined || v === null) return null;
    return v;
  }

  function aliasesFor(m, value) {
    const list = (m && m.selectValueAliases) ? m.selectValueAliases.slice() : [];
    if (m && m.profilePath && C.isEeoPath(m.profilePath) && value === C.EEO_DECLINE_ALIASES[0]) {
      list.push(...C.EEO_DECLINE_ALIASES);
    }
    return list;
  }

  // --- Fill ------------------------------------------------------------------------

  function fillDelay() {
    const a = state.adapter;
    return a && typeof a.fillDelayMs === "number" ? a.fillDelayMs : 50;
  }

  async function fillOne(field, value, ctx) {
    const el = field.input;
    if (!el) return false;
    const adapter = state.adapter;
    if (adapter && typeof adapter.handles === "function" && adapter.handles(el)) {
      const fileData = value && typeof value === "object" && value.base64 ? value : null;
      return adapter.fillField(el, fileData ? fileData.filename : value, { filler: NS.filler, profile: ctx.profile, fileData });
    }
    const info = NS.filler.classify({ input: el, tag: field.tag, type: field.type });
    return NS.filler.fillField(info, value, ctx.profile, { delayMs: fillDelay(), aliases: ctx.aliases });
  }

  async function persistEntries(entries) {
    if (!entries || entries.length === 0) return;
    await C.sendMessage({ action: "qaUpsertMany", entries });
  }

  async function fillPage() {
    // The DOM walk does not depend on the stores; overlap them.
    const ctxPromise = loadContext();
    const fields = scan();
    const ctx = await ctxPromise;
    const matches = await match(fields, ctx);

    const review = [];
    let filled = 0;
    let attempted = 0;
    const writes = [];

    for (let i = 0; i < fields.length; i++) {
      const field = fields[i];
      const m = matches[i];
      if (!m) continue;
      if (field.visible === false) continue; // hidden inputs are honeypots or collapsed steps
      if (field.type === "password") continue; // hard rail: only the 1Password flow fills these

      const value = resolveValue(m, ctx.profile);
      if (value === null || value === "") continue; // empty EEO lands in the capture panel, never guessed

      if (m.qaKey && m.reviewBeforeFill) {
        review.push({ index: i, match: m, value });
        continue;
      }

      attempted++;
      let ok = false;
      try {
        ok = await fillOne(field, value, { profile: ctx.profile, aliases: aliasesFor(m, value) });
      } catch (e) {
        console.error("[resumebot] fill error", field.label, e);
      }
      if (ok) {
        filled++;
        if (m.qaKey) {
          writes.push(C.sendMessage({ action: "incrementTimesUsed", key: m.qaKey, wasReviewed: false }).catch(() => {}));
          if (typeof ok === "object" && ok.aliasUsed) {
            writes.push(C.sendMessage({ action: "qaAddAlias", key: m.qaKey, alias: ok.aliasUsed }).catch(() => {}));
          }
        }
      }
    }
    // Let the service worker land these before the capture panel can write.
    await Promise.all(writes);

    let captured = 0;
    if (NS.capture && NS.capture.capture) {
      const r = await NS.capture.capture(fields, matches, {
        profile: ctx.profile,
        qaMemory: ctx.qaMemory,
        review,
        ats: state.ats,
        domain: root.location.hostname,
        persist: persistEntries,
        onDone: (res) => {
          for (const key of (res && res.reviewed) || []) {
            C.sendMessage({ action: "incrementTimesUsed", key, wasReviewed: true }).catch(() => {});
          }
        }
      });
      captured = (r && r.rows) || 0;
    }

    const matchCount = matches.filter(Boolean).length;
    return { fieldCount: fields.length, matchCount, attempted, filled, captured, ats: state.ats };
  }

  // --- Credentials (1Password flow) --------------------------------------------------

  function findCredentialInputs() {
    const doc = root.document;
    const usable = (el) => el && !el.disabled && el.type !== "hidden";
    const passwords = Array.from(doc.querySelectorAll("input[type='password']")).filter(usable);
    const userSel = "input[type='email'], input[autocomplete='username'], input[autocomplete='email'], input[name*='user' i], input[name*='email' i], input[id*='user' i], input[id*='email' i]";
    const users = Array.from(doc.querySelectorAll(userSel)).filter(usable);
    return { passwords, username: users[0] || null };
  }

  // Only the frame whose origin is the site the credential belongs to gets
  // it; a third-party iframe with a login form on the same page does not.
  function frameMatchesHost(hostname) {
    if (!hostname) return false;
    const here = (root.location && root.location.hostname || "").toLowerCase();
    const want = String(hostname).toLowerCase();
    return here === want || here.endsWith("." + want) || want.endsWith("." + here);
  }

  async function fillCredentials(username, password, hostname) {
    if (hostname && !frameMatchesHost(hostname)) return { filled: 0, passwordFields: 0, skipped: "origin" };
    const { passwords, username: userEl } = findCredentialInputs();
    let count = 0;
    if (userEl && username) {
      const info = NS.filler.classify({ input: userEl });
      if (await NS.filler.fillField(info, username, {}, { delayMs: fillDelay() })) count++;
    }
    for (const pw of passwords) {
      const info = NS.filler.classify({ input: pw });
      info.type = "password";
      if (await NS.filler.fillField(info, password, {}, { allowPassword: true, delayMs: fillDelay() })) count++;
    }
    return { filled: count, passwordFields: passwords.length };
  }

  function pageInfo() {
    const fields = scan();
    const { passwords, username } = findCredentialInputs();
    return {
      ats: state.ats,
      hostname: root.location.hostname,
      fieldCount: fields.length,
      hasPasswordField: passwords.length > 0,
      hasUsernameField: !!username,
      isAccountCreation: C.isAccountCreationPage(fields)
    };
  }

  // --- Remap ("ResumeBot: remap this field") ------------------------------------------

  async function remapField() {
    const target = NS.capture && NS.capture.getLastContextTarget ? NS.capture.getLastContextTarget() : null;
    if (!target || !target.matches || !target.matches("input, textarea, select, [contenteditable], button[aria-haspopup='listbox']")) {
      return { success: false, error: "Right-click a form field first" };
    }
    const ctx = await loadContext();
    const fields = scan();
    const idx = fields.findIndex(f => f.input === target);
    if (idx < 0) return { success: false, error: "That element is not a fillable field" };
    const field = fields[idx];
    const key = NS.matcher.fieldKey(field);
    if (!key) return { success: false, error: "Field has no stable identity to remap" };

    const choice = await showRemapPicker(field, ctx);
    if (!choice) return { success: false, error: "cancelled" };

    const reg = ctx.siteRegistry || {};
    reg.fieldOverrides = reg.fieldOverrides || {};
    const atsKey = state.ats || "generic";
    reg.fieldOverrides[atsKey] = reg.fieldOverrides[atsKey] || {};
    reg.fieldOverrides[atsKey][key] = choice;
    await C.sendMessage({ action: "setSiteRegistry", data: reg });

    // Fill it right away with the new mapping so the correction is visible.
    const m = typeof choice === "string"
      ? { profilePath: choice }
      : (() => { const e = ctx.qaMemory.entries.find(x => x.key === choice.qaKey); return e ? { qaKey: e.key, answer: e.answer, selectValueAliases: e.selectValueAliases } : null; })();
    const value = resolveValue(m, ctx.profile);
    let filled = false;
    if (value !== null && value !== "") {
      filled = !!(await fillOne(field, value, { profile: ctx.profile, aliases: aliasesFor(m, value) }));
    }
    return { success: true, key, ats: atsKey, choice, filled };
  }

  function showRemapPicker(field, ctx) {
    const doc = root.document;
    return new Promise((resolve) => {
      const old = doc.getElementById("resumebot-remap");
      if (old) old.remove();
      const box = doc.createElement("div");
      box.id = "resumebot-remap";
      Object.assign(box.style, {
        position: "fixed", top: "16px", right: "16px", width: "320px", maxHeight: "80vh", overflowY: "auto",
        background: "#fff", border: "1px solid #ccc", borderRadius: "6px", boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
        zIndex: "2147483647", padding: "12px", font: "13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: "#222"
      });
      const h = doc.createElement("div");
      h.style.fontWeight = "600";
      h.style.marginBottom = "8px";
      h.textContent = `Remap "${field.label || field.attributes.name || field.attributes.id || "field"}" to:`;
      box.appendChild(h);

      const sel = doc.createElement("select");
      sel.style.width = "100%";
      sel.style.padding = "6px";
      const og1 = doc.createElement("optgroup");
      og1.label = "Profile";
      const paths = new Set([...Object.keys((NS.matcher && NS.matcher.SYNONYMS) || {}), ...Object.keys(C.DERIVED)]);
      for (const p of Array.from(paths).sort()) {
        const o = doc.createElement("option");
        o.value = "profile:" + p;
        o.textContent = p;
        og1.appendChild(o);
      }
      sel.appendChild(og1);
      const entries = (ctx.qaMemory && ctx.qaMemory.entries) || [];
      if (entries.length) {
        const og2 = doc.createElement("optgroup");
        og2.label = "Saved answers";
        for (const e of entries) {
          const o = doc.createElement("option");
          o.value = "qa:" + e.key;
          o.textContent = (e.questionRaw || e.questionNormalized || e.key).slice(0, 80);
          og2.appendChild(o);
        }
        sel.appendChild(og2);
      }
      box.appendChild(sel);

      const row = doc.createElement("div");
      row.style.marginTop = "10px";
      row.style.display = "flex";
      row.style.gap = "8px";
      const ok = doc.createElement("button");
      ok.textContent = "Save mapping";
      const cancel = doc.createElement("button");
      cancel.textContent = "Cancel";
      row.appendChild(ok);
      row.appendChild(cancel);
      box.appendChild(row);
      doc.body.appendChild(box);

      ok.addEventListener("click", () => {
        const v = sel.value || "";
        box.remove();
        if (v.indexOf("profile:") === 0) resolve(v.slice(8));
        else if (v.indexOf("qa:") === 0) resolve({ qaKey: v.slice(3) });
        else resolve(null);
      });
      cancel.addEventListener("click", () => { box.remove(); resolve(null); });
    });
  }

  // --- Badge / navigation --------------------------------------------------------------

  let reportTimer = null;
  function reportBadge() {
    clearTimeout(reportTimer);
    reportTimer = setTimeout(() => {
      try {
        const fields = NS.scanner.scanFields(root.document, { frameUrl: root.document.URL });
        C.sendMessage({ action: "scanResult", count: fields.length, ats: state.ats }).catch(() => {});
      } catch (e) { /* ignore */ }
    }, 150);
  }

  async function init() {
    if (typeof chrome === "undefined" || !chrome.runtime || !chrome.runtime.onMessage) return;

    let siteRegistry = null;
    try {
      const s = await C.sendMessage({ action: "getSiteRegistry" });
      siteRegistry = s && s.success ? s.data : null;
    } catch (e) { /* service worker may be asleep; detection still works from the URL */ }

    state.ats = detectAts(siteRegistry);
    state.adapter = adapterFor(state.ats);

    if (NS.capture && NS.capture.initContextMenu) NS.capture.initContextMenu();

    reportBadge();
    if (state.adapter && typeof state.adapter.onNavigation === "function") {
      try { state.adapter.onNavigation(reportBadge); } catch (e) { /* ignore */ }
    }
  }

  function handleMessage(message, sender, sendResponse) {
    const action = message && message.action;
    const respond = (p) => p.then(sendResponse).catch(err => sendResponse({ success: false, error: err && err.message || String(err) }));

    switch (action) {
      case "scanFromContent":
        try { sendResponse({ success: true, fields: scan() }); } catch (e) { sendResponse({ success: false, error: e.message }); }
        return false;
      case "scanAndMatchFromContent": {
        const ctx = {
          profile: message.profile || {},
          qaMemory: { entries: Array.isArray(message.qaMemory) ? message.qaMemory : (message.qaMemory && message.qaMemory.entries) || [] },
          siteRegistry: message.siteRegistry || null
        };
        respond(scanAndMatch(ctx).then(({ fields, matches }) => ({ success: true, fields, matches, ats: state.ats })));
        return true;
      }
      case "fillFromContent":
        respond(fillPage().then(r => ({ success: true, ...r })));
        return true;
      case "fillCredentials":
        respond(fillCredentials(message.username, message.password, message.hostname).then(r => ({ success: true, ...r })));
        return true;
      case "pageInfo":
        try { sendResponse({ success: true, ...pageInfo() }); } catch (e) { sendResponse({ success: false, error: e.message }); }
        return false;
      case "remapField":
        respond(remapField());
        return true;
      default:
        return false;
    }
  }

  const api = { init, handleMessage, loadContext, scan, scanAndMatch, fillPage, fillCredentials, pageInfo, remapField, resolveValue, adapterTier0, detectAts, frameMatchesHost, state };
  root.ResumeBot = Object.assign(root.ResumeBot || {}, { main: api });
  if (typeof module !== "undefined" && module.exports) module.exports = api;

  if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage && !(typeof module !== "undefined" && module.exports)) {
    chrome.runtime.onMessage.addListener(handleMessage);
    if (root.document.readyState === "loading") {
      root.document.addEventListener("DOMContentLoaded", () => { init(); });
    } else {
      init();
    }
  }
})(typeof window !== "undefined" ? window : globalThis);
