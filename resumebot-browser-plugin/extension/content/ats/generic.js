// generic.js
// Fallback adapter for unknown sites: no selector map, no widgets. The
// generic React-safe filler does all the work.
(function (root) {
  "use strict";
  function generic() {
    return {
      name: "generic",
      detect: () => false,
      selectorMap: {},
      fillDelayMs: 0,
      onNavigation: (cb) => {
        const common = root.ResumeBot && root.ResumeBot.common;
        if (!common || !root.document || !root.document.body) return () => {};
        return common.observeBigChanges(root.document.body, cb);
      }
    };
  }

  const api = { generic };
  root.ResumeBot = Object.assign(root.ResumeBot || {}, { adapters: Object.assign(root.ResumeBot && root.ResumeBot.adapters || {}, api) });
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
