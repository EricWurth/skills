// greenhouse.js
// Greenhouse adapter. Boards render plain inputs/selects (React-controlled),
// so the generic filler handles values; this adapter contributes the
// selector map and step re-scan. The application form usually lives in a
// cross-origin grnhse.com iframe, where our own content script instance
// runs; each frame observes its own document.
(function (root) {
  "use strict";
  function greenhouse() {
    const selectorMap = {
      "identity.firstName": "input[name='first_name'], input[id='first_name'], input[aria-label*='First Name']",
      "identity.lastName": "input[name='last_name'], input[id='last_name'], input[aria-label*='Last Name']",
      "identity.email": "input[name='email'], input[id='email'], input[aria-label*='Email']",
      "identity.phone": "input[name='phone'], input[id='phone'], input[aria-label*='Phone']",
      "documents.resume.filename": "input[type='file'][name='resume'], input[type='file'][id='resume'], input[type='file'][aria-label*='Resume']",
      "identity.linkedin": "input[name*='LinkedIn'], input[id*='LinkedIn'], input[aria-label*='LinkedIn']",
      "identity.website": "input[name*='website'], input[id*='website'], input[aria-label*='Website']",
      "education.0.school": "input[name*='school'], input[id*='school'], input[aria-label*='School']",
      "education.0.degree": "input[name*='degree'], input[id*='degree'], input[aria-label*='Degree']",
      "education.0.field": "input[name*='field'], input[id*='field'], input[aria-label*='Field of Study']"
    };

    function detect(doc) {
      return !!doc.querySelector("#grnhse_app, iframe[src*='grnhse.com']");
    }

    function onNavigation(cb) {
      const common = root.ResumeBot && root.ResumeBot.common;
      if (!common || !root.document || !root.document.body) return () => {};
      return common.observeBigChanges(root.document.body, cb);
    }

    return { name: "greenhouse", detect, selectorMap, fillDelayMs: 0, onNavigation };
  }

  const api = { greenhouse };
  root.ResumeBot = Object.assign(root.ResumeBot || {}, { adapters: Object.assign(root.ResumeBot && root.ResumeBot.adapters || {}, api) });
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
