// detect.js
// ATS fingerprinting: URL first, DOM signature as fallback. The table of
// platforms lives in common.js so the service worker and the adapters read
// the same one.
(function (root) {
  "use strict";
  function table() {
    return (root.ResumeBot && root.ResumeBot.common && root.ResumeBot.common.ATS) ||
      (typeof require === "function" ? require("../common.js").ATS : []);
  }

  function detectATS(doc) {
    const url = (doc.defaultView && doc.defaultView.location && doc.defaultView.location.href) || doc.URL || "";
    let hostname = "";
    try { hostname = new URL(url).hostname.toLowerCase(); } catch (e) { hostname = String(url).toLowerCase(); }
    for (const row of table()) {
      if (row.hosts.some(h => hostname.includes(h))) return { ats: row.name, confidence: 0.9 };
    }
    for (const row of table()) {
      try {
        if (row.dom && row.dom(doc)) return { ats: row.name, confidence: 0.7 };
      } catch (e) { /* ignore */ }
    }
    return null;
  }

  const api = { detectATS };
  root.ResumeBot = Object.assign(root.ResumeBot || {}, { detect: api });
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
