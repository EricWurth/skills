// lever.js
// Lever adapter. Lever forms are mostly server-rendered with conventional
// inputs; the one quirk is a single full-name field, which the matcher
// resolves through the derived identity.fullName path (common.js DERIVED).
(function (root) {
  "use strict";
  function lever() {
    const selectorMap = {
      "identity.fullName": "input[name='name'], input[id='name'], input[aria-label='Full name'], input[placeholder='Full name']",
      "identity.email": "input[name='email'], input[id='email'], input[aria-label*='Email']",
      "identity.phone": "input[name='phone'], input[id='phone'], input[aria-label*='Phone']",
      "identity.linkedin": "input[name*='LinkedIn'], input[id*='LinkedIn'], input[aria-label*='LinkedIn']",
      "identity.website": "input[name*='website'], input[id*='website'], input[aria-label*='Website']",
      "employment.0.company": "input[name='org'], input[id='org'], input[aria-label*='Current company'], input[aria-label*='Organization']",
      "documents.resume.filename": "input[type='file'][name='resume'], input[type='file'][id='resume'], input[type='file'][aria-label*='Resume']"
    };

    function detect(doc) {
      return !!doc.querySelector(".application-form, .posting-form");
    }

    function onNavigation(cb) {
      const common = root.ResumeBot && root.ResumeBot.common;
      if (!common || !root.document || !root.document.body) return () => {};
      return common.observeBigChanges(root.document.body, cb);
    }

    return { name: "lever", detect, selectorMap, fillDelayMs: 0, onNavigation };
  }

  const api = { lever };
  root.ResumeBot = Object.assign(root.ResumeBot || {}, { adapters: Object.assign(root.ResumeBot && root.ResumeBot.adapters || {}, api) });
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
