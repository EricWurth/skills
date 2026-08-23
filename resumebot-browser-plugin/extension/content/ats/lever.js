// lever.js
// Lever ATS adapter
(function (root) {
  "use strict";
  function lever() {
    // Selector map: profilePath or qaIntent -> CSS selector
    const selectorMap = {
      // Basic info - Lever uses a single full-name field
      "identity.firstName": null, // Will be handled specially in fillField
      "identity.lastName": null,  // Will be handled specially in fillField
      "identity.email": "input[name='email'], input[id='email'], input[aria-label*='Email']",
      "identity.phone": "input[name='phone'], input[id='phone'], input[aria-label*='Phone']",
      // Custom fields
      "identity.linkedin": "input[name*='LinkedIn'], input[id*='LinkedIn'], input[aria-label*='LinkedIn']",
      "identity.website": "input[name*='website'], input[id*='website'], input[aria-label*='Website']",
      "work.org": "input[name*='Organization'], input[id*='Organization'], input[aria-label*='Organization']",
      // Resume upload
      "documents.resume.filename": "input[type='file'][name='resume'], input[type='file'][id='resume'], input[type='file'][aria-label*='Resume']",
    };

    // Detect if we are in a Lever form
    function detect(doc) {
      // Already detected by detectATS, but we can do a second check for safety
      return !!doc.querySelector(".application-form, .posting-form");
    }

    // Fill a field with a value
    function fillField(el, value, ctx) {
      // Handle special case for firstName + lastName -> single full-name field
      if (el.name === 'name' || el.id === 'name' || (el.name && el.name.includes('name')) || (el.id && el.id.includes('name'))) {
        // This is likely the single full-name field in Lever
        // We need to get firstName and lastName from ctx or profile
        const firstName = ctx && ctx.profile && ctx.profile.identity ? ctx.profile.identity.firstName : '';
        const lastName = ctx && ctx.profile && ctx.profile.identity ? ctx.profile.identity.lastName : '';
        const fullName = `${firstName} ${lastName}`.trim();
        
        if (fullName) {
          // We'll use the filler from the context if available
          if (ctx && ctx.filler && typeof ctx.filler.fill === 'function') {
            return ctx.filler.fill(el, fullName);
          }
          // Fallback: native setter and dispatch events
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
          if (setter && el.tagName.toLowerCase() === 'input' && el.type === 'text') {
            setter.call(el, fullName);
            el.dispatchEvent(new Event("input", { bubbles: true }));
            el.dispatchEvent(new Event("change", { bubbles: true }));
            el.dispatchEvent(new Event("blur", { bubbles: true }));
            return true;
          }
        }
        return false;
      }

      // For other fields, use standard filling
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

    // Handle navigation (SPA) for Lever
    function onNavigation(cb) {
      // Lever is mostly server-rendered, but we'll observe for SPA-like changes
      const observer = new MutationObserver((mutations) => {
        cb();
      });
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      // Return a disconnect function
      return () => observer.disconnect();
    }

    return {
      name: 'lever',
      detect,
      selectorMap,
      fillField,
      onNavigation
    };
  }

  const api = { lever };
  root.ResumeBot = Object.assign(root.ResumeBot || {}, { adapters: Object.assign(root.ResumeBot && root.ResumeBot.adapters || {}, api) });
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);