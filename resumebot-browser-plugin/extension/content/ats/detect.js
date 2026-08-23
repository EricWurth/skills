// detect.js
// ATS fingerprinting
(function (root) {
  "use strict";
  function detectATS(doc) {
    const urlFromDoc = (doc.defaultView && doc.defaultView.location && doc.defaultView.location.href) || doc.URL || "";

    // URL patterns
    if (urlFromDoc.includes("myworkdayjobs.com")) {
      return { ats: "workday", confidence: 0.9 };
    }
    if (urlFromDoc.includes("greenhouse.io") || urlFromDoc.includes("boards.greenhouse.io")) {
      return { ats: "greenhouse", confidence: 0.9 };
    }
    if (urlFromDoc.includes("jobs.lever.co")) {
      return { ats: "lever", confidence: 0.9 };
    }
    if (urlFromDoc.includes("icims.com")) {
      return { ats: "icims", confidence: 0.9 };
    }

    // DOM-signature fallbacks
    // Greenhouse: #grnhse_app or grnhse iframe
    if (doc.querySelector("#grnhse_app") || doc.querySelector("iframe[src*='grnhse.com']")) {
      return { ats: "greenhouse", confidence: 0.7 };
    }
    // Lever: .application-form or .posting-form classes
    if (doc.querySelector(".application-form, .posting-form")) {
      return { ats: "lever", confidence: 0.7 };
    }
    // Workday: [data-automation-id] density (we can count them)
    const workdayAttrs = doc.querySelectorAll("[data-automation-id]");
    if (workdayAttrs.length > 5) {
      return { ats: "workday", confidence: 0.7 };
    }
    // iCIMS: maybe look for specific class or id
    if (doc.querySelector(".icims-widget, #icimsContent")) {
      return { ats: "icims", confidence: 0.7 };
    }

    return null;
  }

  const api = { detectATS };
  root.ResumeBot = Object.assign(root.ResumeBot || {}, { detect: api });
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);