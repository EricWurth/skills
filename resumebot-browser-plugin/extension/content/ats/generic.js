// generic.js
// Generic ATS adapter (no-op passthrough to tiers 1-2)
(function (root) {
  "use strict";
  function generic() {
    return {
      name: 'generic',
      detect: () => false,
      selectorMap: {},
      fillField: (el, value, ctx) => {
        // No-op: let tiers 1-2 handle filling
      },
      onNavigation: (cb) => {
        // No-op, return a disconnect function
        return () => {};
      }
    };
  }

  const api = { generic };
  root.ResumeBot = Object.assign(root.ResumeBot || {}, { adapters: Object.assign(root.ResumeBot && root.ResumeBot.adapters || {}, api) });
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);