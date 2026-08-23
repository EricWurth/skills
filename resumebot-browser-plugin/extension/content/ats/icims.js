// icims.js
// iCIMS ATS adapter. iCIMS renders the application inside an iframe on
// *.icims.com with conventional <input>/<select> controls, so the generic
// React-safe filler does the work; this adapter only contributes a selector
// map for the fields whose names never match the synonym dictionary, plus
// SPA re-scan on step changes.
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

    function handles() {
      return false;
    }

    function fillField(el, value, ctx) {
      if (ctx && ctx.filler && ctx.filler.classify && ctx.filler.fillField) {
        return ctx.filler.fillField(ctx.filler.classify({ input: el }), value, ctx.profile || {}, { delayMs: 50 });
      }
      return false;
    }

    function onNavigation(cb) {
      if (typeof MutationObserver === "undefined" || !root.document || !root.document.body) return () => {};
      let pending = null;
      const observer = new MutationObserver((mutations) => {
        let big = 0;
        for (const m of mutations) big += m.addedNodes.length + m.removedNodes.length;
        if (big < 20) return;
        clearTimeout(pending);
        pending = setTimeout(cb, 300);
      });
      observer.observe(root.document.body, { childList: true, subtree: true });
      return () => observer.disconnect();
    }

    return { name: "icims", detect, handles, selectorMap, fillField, onNavigation };
  }

  const api = { icims };
  root.ResumeBot = Object.assign(root.ResumeBot || {}, { adapters: Object.assign(root.ResumeBot && root.ResumeBot.adapters || {}, api) });
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
