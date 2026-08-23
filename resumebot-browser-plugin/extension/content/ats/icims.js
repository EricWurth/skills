// icims.js
// iCIMS adapter. The application renders inside an iframe on *.icims.com
// with conventional controls, so the generic filler does the work; this
// adapter contributes a selector map for names that never match the
// synonym dictionary, plus step re-scan.
(function (root) {
  "use strict";
  function icims() {
    const selectorMap = {
      "identity.firstName": "input[name*='firstname' i], input[id*='firstname' i]",
      "identity.lastName": "input[name*='lastname' i], input[id*='lastname' i]",
      "identity.email": "input[name*='email' i][type='email'], input[name*='email' i][type='text']",
      "identity.phone": "input[name*='phone' i]",
      "address.street": "input[name*='addressstreet' i], input[name*='address1' i]",
      "address.city": "input[name*='addresscity' i]",
      "address.state": "select[name*='addressstate' i], input[name*='addressstate' i]",
      "address.zip": "input[name*='addresszip' i], input[name*='postal' i]",
      "documents.resume.filename": "input[type='file'][name*='resume' i], input[type='file'][id*='resume' i]"
    };

    function detect(doc) {
      return !!doc.querySelector(".icims-widget, #icimsContent, [class*='iCIMS'], form[action*='icims']");
    }

    function onNavigation(cb) {
      const common = root.ResumeBot && root.ResumeBot.common;
      if (!common || !root.document || !root.document.body) return () => {};
      return common.observeBigChanges(root.document.body, cb);
    }

    return { name: "icims", detect, selectorMap, fillDelayMs: 0, onNavigation };
  }

  const api = { icims };
  root.ResumeBot = Object.assign(root.ResumeBot || {}, { adapters: Object.assign(root.ResumeBot && root.ResumeBot.adapters || {}, api) });
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
