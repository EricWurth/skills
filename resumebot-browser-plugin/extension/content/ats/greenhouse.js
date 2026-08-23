// greenhouse.js
// Greenhouse ATS adapter
(function (root) {
  "use strict";
  function greenhouse() {
    // Selector map: profilePath or qaIntent -> CSS selector
    const selectorMap = {
      // Basic info
      "identity.firstName": "input[name='first_name'], input[id='first_name'], input[aria-label*='First Name']",
      "identity.lastName": "input[name='last_name'], input[id='last_name'], input[aria-label*='Last Name']",
      "identity.email": "input[name='email'], input[id='email'], input[aria-label*='Email']",
      "identity.phone": "input[name='phone'], input[id='phone'], input[aria-label*='Phone']",
      // Resume upload
      "documents.resume.filename": "input[type='file'][name='resume'], input[type='file'][id='resume'], input[type='file'][aria-label*='Resume']",
      // Custom questions (LinkedIn, website)
      "identity.linkedin": "input[name*='LinkedIn'], input[id*='LinkedIn'], input[aria-label*='LinkedIn']",
      "identity.website": "input[name*='website'], input[id*='website'], input[aria-label*='Website']",
      // Education (if present)
      "education.0.school": "input[name*='school'], input[id*='school'], input[aria-label*='School']",
      "education.0.degree": "input[name*='degree'], input[id*='degree'], input[aria-label*='Degree']",
      "education.0.field": "input[name*='field'], input[id*='field'], input[aria-label*='Field of Study']",
    };

    // Detect if we are in a Greenhouse form
    function detect(doc) {
      // Already detected by detectATS, but we can do a second check for safety
      return !!doc.querySelector("#grnhse_app, iframe[src*='grnhse.com']");
    }

    // Fill a field with a value
    function fillField(el, value, ctx) {
      // We'll use the filler from the context (ctx.filler) if available, otherwise fallback
      if (ctx && ctx.filler && typeof ctx.filler.fill === 'function') {
        return ctx.filler.fill(el, value);
      }
      // Fallback: native setter and dispatch events (as in filler.js)
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      if (setter && el.tagName.toLowerCase() === 'input' && ['text', 'email', 'tel', 'url'].includes(el.type)) {
        setter.call(el, value);
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
        el.dispatchEvent(new Event("blur", { bubbles: true }));
        return true;
      }
      // For textarea
      if (el.tagName.toLowerCase() === 'textarea') {
        el.value = value;
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
        el.dispatchEvent(new Event("blur", { bubbles: true }));
        return true;
      }
      // For select
      if (el.tagName.toLowerCase() === 'select') {
        // We'll try to set by value and then by text
        const optionByValue = Array.from(el.options).find(o => o.value === value);
        if (optionByValue) {
          el.value = value;
          el.dispatchEvent(new Event("change", { bubbles: true }));
          return true;
        }
        const optionByText = Array.from(el.options).find(o => o.text.trim() === value);
        if (optionByText) {
          el.value = optionByText.value;
          el.dispatchEvent(new Event("change", { bubbles: true }));
          return true;
        }
        return false;
      }
      // For file input, we expect the ctx to have a file to attach
      if (el.type === 'file' && ctx && ctx.fileData) {
        // We'll use the filler's attachFile if available
        if (ctx.filler && typeof ctx.filler.attachFile === 'function') {
          return ctx.filler.attachFile(el, ctx.fileData, {
            File: window.File,
            DataTransfer: window.DataTransfer
          });
        }
        // Fallback: create File and DataTransfer
        try {
          const file = new window.File([ctx.fileData.bytes], ctx.fileData.filename, { type: ctx.fileData.mime });
          const dt = new window.DataTransfer();
          dt.items.add(file);
          el.files = dt.files;
          el.dispatchEvent(new Event("change", { bubbles: true }));
          return true;
        } catch (e) {
          console.error('Failed to attach file:', e);
          return false;
        }
      }
      return false;
    }

    // Handle navigation (SPA) for Greenhouse
    function onNavigation(cb) {
      // Greenhouse uses iframes, but the main page might not change.
      // We'll observe the iframe for changes.
      const observer = new MutationObserver((mutations) => {
        cb();
      });
      const iframe = document.querySelector("iframe[src*='grnhse.com']");
      if (iframe) {
        observer.observe(iframe.contentDocument || iframe.contentWindow.document, {
          childList: true,
          subtree: true
        });
      }
      // Return a disconnect function
      return () => observer.disconnect();
    }

    return {
      name: 'greenhouse',
      detect,
      selectorMap,
      fillField,
      onNavigation
    };
  }

  const api = { greenhouse };
  root.ResumeBot = Object.assign(root.ResumeBot || {}, { adapters: Object.assign(root.ResumeBot && root.ResumeBot.adapters || {}, api) });
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);