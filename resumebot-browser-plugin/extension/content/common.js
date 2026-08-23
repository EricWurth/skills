// common.js
// Shared vocabulary for every other module: the ATS table, profile-path
// helpers, EEO rules, the account-creation heuristic, and the navigation
// observer adapters use. Loads first in the manifest and is importScripts'd
// by the service worker, so a fact lives here once.
(function (root) {
  "use strict";

  // One row per supported platform. hosts: hostname substrings (manifest
  // host_permissions and the popup's permission check derive from these);
  // dom: fallback fingerprint when the URL is unhelpful (embedded boards).
  const ATS = [
    { name: "workday",    hosts: ["myworkdayjobs.com"],
      dom: (doc) => doc.querySelectorAll("[data-automation-id]").length > 5 },
    { name: "greenhouse", hosts: ["greenhouse.io"],
      dom: (doc) => !!doc.querySelector("#grnhse_app, iframe[src*='grnhse.com']") },
    { name: "lever",      hosts: ["lever.co"],
      dom: (doc) => !!doc.querySelector(".application-form, .posting-form") },
    { name: "icims",      hosts: ["icims.com"],
      dom: (doc) => !!doc.querySelector(".icims-widget, #icimsContent, [class*='iCIMS'], form[action*='icims']") }
  ];

  function atsFromHostname(hostname) {
    const h = String(hostname || "").toLowerCase();
    if (!h) return null;
    const row = ATS.find(a => a.hosts.some(host => h === host || h.endsWith("." + host) || h.includes(host)));
    return row ? row.name : null;
  }

  function isKnownAtsHost(hostname) {
    return atsFromHostname(hostname) !== null;
  }

  // --- profile paths -----------------------------------------------------------

  function getNested(obj, path) {
    if (!obj || !path) return undefined;
    let cur = obj;
    for (const part of String(path).split(".")) {
      if (cur === undefined || cur === null) return undefined;
      cur = cur[part];
    }
    return cur;
  }

  const EEO_PATHS = ["eeo.gender", "eeo.race", "eeo.veteranStatus", "eeo.disabilityStatus"];

  // What an EEO answer "decline" looks like on forms, for alias matching.
  const EEO_DECLINE_ALIASES = [
    "decline to self-identify", "decline to self identify", "i decline to self-identify",
    "prefer not to answer", "prefer not to say", "i prefer not to answer", "i do not wish to answer",
    "i don't wish to answer", "do not wish to disclose", "decline", "choose not to disclose"
  ];

  function isEeoPath(path) {
    return EEO_PATHS.includes(path);
  }

  // Empty means "never guess": surface it, don't fill it. A ticked
  // "prefer not to answer" in Options counts as an answer.
  function eeoValue(profile, path) {
    if (!isEeoPath(path)) return undefined;
    const v = getNested(profile, path);
    if (v !== "" && v !== null && v !== undefined) return v;
    const prefer = getNested(profile, path + "PreferNotToAnswer");
    return prefer ? EEO_DECLINE_ALIASES[0] : "";
  }

  function isEeoEmpty(profile, path) {
    return isEeoPath(path) && eeoValue(profile, path) === "";
  }

  // Profile paths that are computed rather than stored. Adding one here is
  // the whole change: the matcher's remap picker and resolveValue read it.
  const DERIVED = {
    "identity.fullName": (p) => [getNested(p, "identity.firstName"), getNested(p, "identity.lastName")].filter(Boolean).join(" ")
  };

  // --- page heuristics -----------------------------------------------------------

  const ACCOUNT_CREATION = [/create.{0,20}account/i, /sign.{0,5}up/i, /register/i];

  function isAccountCreationPage(fields) {
    if (!fields || !Array.isArray(fields)) return false;
    if (fields.filter(f => f.type === "password").length >= 2) return true;
    const text = fields.map(f => f.label || "").join(" ");
    return ACCOUNT_CREATION.some(re => re.test(text));
  }

  // --- navigation observer -----------------------------------------------------------
  // SPA step changes replace whole subtrees; keystrokes touch a node or two.
  // Fire only on the former, trailing-debounced so the new step has rendered.
  function observeBigChanges(target, cb, opts) {
    const minNodes = (opts && opts.minNodes) || 20;
    const debounceMs = (opts && opts.debounceMs) || 300;
    const extra = (opts && opts.isSignificant) || null;
    if (typeof MutationObserver === "undefined" || !target) return () => {};
    let pending = null;
    const observer = new MutationObserver((mutations) => {
      let nodes = 0;
      let hit = false;
      for (const m of mutations) {
        nodes += m.addedNodes.length + m.removedNodes.length;
        if (extra && extra(m)) { hit = true; break; }
      }
      if (!hit && nodes < minNodes) return;
      clearTimeout(pending);
      pending = setTimeout(cb, debounceMs);
    });
    observer.observe(target, Object.assign({ childList: true, subtree: true }, (opts && opts.observe) || {}));
    return () => { clearTimeout(pending); observer.disconnect(); };
  }

  // --- messaging -----------------------------------------------------------
  // Promise wrapper over chrome.runtime.sendMessage; the one copy.
  function sendMessage(message) {
    return new Promise((resolve, reject) => {
      try {
        chrome.runtime.sendMessage(message, (response) => {
          if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
          resolve(response);
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  const api = {
    ATS, atsFromHostname, isKnownAtsHost,
    getNested, EEO_PATHS, EEO_DECLINE_ALIASES, isEeoPath, eeoValue, isEeoEmpty, DERIVED,
    isAccountCreationPage, observeBigChanges, sendMessage
  };
  root.ResumeBot = Object.assign(root.ResumeBot || {}, { common: api });
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : (typeof self !== "undefined" ? self : globalThis));
