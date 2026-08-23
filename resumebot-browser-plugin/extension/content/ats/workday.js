// workday.js
// Workday adapter. Workday is a React SPA whose dropdowns are
// <button aria-haspopup="listbox"> + a rendered [role=listbox], whose dates
// are three segmented inputs, and whose multi-page flow never changes the
// URL. handles() names the widgets main.js must route here; everything
// else goes through the generic React-safe filler.
(function (root) {
  "use strict";
  function workday() {
    const win = typeof window !== "undefined" ? window : globalThis;

    const selectorMap = {
      "identity.firstName": "input[data-automation-id='legalNameSection_firstName']",
      "identity.lastName": "input[data-automation-id='legalNameSection_lastName']",
      "identity.email": "input[data-automation-id='email']",
      "identity.phone": "input[data-automation-id='phoneNumber']",
      "address.street": "input[data-automation-id='addressSection_addressLine1']",
      "address.city": "input[data-automation-id='addressSection_city']",
      "address.zip": "input[data-automation-id='addressSection_postalCode']",
      "documents.resume.filename": "input[type='file'][data-automation-id='fileUpload']",
      "identity.linkedin": "input[data-automation-id='textField-LINKEDIN']",
      "identity.website": "input[data-automation-id='textField-WEBSITE']"
    };

    function detect(doc) {
      return doc.querySelectorAll("[data-automation-id]").length > 5;
    }

    function automationId(el) {
      return (el && el.getAttribute && el.getAttribute("data-automation-id")) || "";
    }

    // Which elements need Workday-specific handling rather than the generic
    // filler: listbox buttons and segmented date inputs.
    function handles(el) {
      if (!el || !el.tagName) return false;
      const tag = el.tagName.toLowerCase();
      if (tag === "button" && el.getAttribute("aria-haspopup") === "listbox") return true;
      return tag === "input" && /(month|day|year)-input$/i.test(automationId(el));
    }

    function delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    function setValue(el, value, ctx) {
      const filler = ctx && ctx.filler;
      if (filler && filler.setNativeValue) {
        filler.setNativeValue(el, value);
      } else {
        el.value = value;
      }
      const w = el.ownerDocument.defaultView || win;
      el.dispatchEvent(new w.Event("input", { bubbles: true }));
      el.dispatchEvent(new w.Event("change", { bubbles: true }));
      el.dispatchEvent(new w.Event("blur", { bubbles: true }));
    }

    // Listbox button: open, wait for the listbox, click the matching option.
    async function handleListbox(button, value, doc) {
      button.click();
      let listbox = null;
      for (let i = 0; i < 20; i++) {
        listbox = doc.querySelector("[role='listbox']");
        if (listbox) break;
        await delay(100);
      }
      if (!listbox) {
        button.click();
        return false;
      }
      const want = String(value).trim().toLowerCase();
      const option = Array.from(listbox.querySelectorAll("[role='option']"))
        .find(opt => opt.textContent.trim().toLowerCase() === want);
      if (!option) {
        doc.body.click();
        return false;
      }
      option.click();
      await delay(100);
      return true;
    }

    // Segmented date: given any one of the three inputs and an ISO date,
    // fill month/day/year together.
    function fillSegmentedDate(el, isoValue, ctx) {
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(isoValue).trim());
      if (!m) return false;
      const [, year, month, day] = m;
      const id = automationId(el);
      const base = id.replace(/(month|day|year)-input$/i, "");
      const doc = el.ownerDocument;
      const seg = (name) => doc.querySelector(`[data-automation-id='${base}${name}-input']`) ||
        doc.querySelector(`[data-automation-id='${base}${name.toLowerCase()}-input']`);
      const monthEl = /month-input$/i.test(id) ? el : seg("Month");
      const dayEl = /day-input$/i.test(id) ? el : seg("Day");
      const yearEl = /year-input$/i.test(id) ? el : seg("Year");
      if (!monthEl || !dayEl || !yearEl) return false;
      setValue(monthEl, month, ctx);
      setValue(dayEl, day, ctx);
      setValue(yearEl, year, ctx);
      return true;
    }

    async function fillField(el, value, ctx) {
      if (el.tagName.toLowerCase() === "button" && el.getAttribute("aria-haspopup") === "listbox") {
        return handleListbox(el, value, el.ownerDocument);
      }
      if (/(month|day|year)-input$/i.test(automationId(el))) {
        return fillSegmentedDate(el, value, ctx);
      }
      return false;
    }

    // Step changes replace the whole form subtree or move the progress bar.
    function onNavigation(cb) {
      const common = root.ResumeBot && root.ResumeBot.common;
      if (!common || !root.document || !root.document.body) return () => {};
      return common.observeBigChanges(root.document.body, cb, {
        minNodes: 50,
        debounceMs: 500,
        observe: { attributes: true, attributeFilter: ["data-automation-id"] },
        isSignificant: (m) => m.type === "attributes" && automationId(m.target) === "progressBar"
      });
    }

    // Chip-style multi-select (skills): set the text, let the typeahead
    // render, click the match or accept the typed value with Enter.
    async function handleChipInput(input, values, doc, ctx) {
      const list = Array.isArray(values) ? values : [values];
      for (const value of list) {
        setValue(input, value, ctx);
        let suggestions = null;
        for (let i = 0; i < 20; i++) {
          suggestions = doc.querySelector("[role='listbox']");
          if (suggestions) break;
          await delay(100);
        }
        const w = input.ownerDocument.defaultView || win;
        if (suggestions) {
          const want = String(value).trim().toLowerCase();
          const option = Array.from(suggestions.querySelectorAll("[role='option']"))
            .find(opt => opt.textContent.trim().toLowerCase() === want);
          if (option) option.click();
          else input.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
        } else {
          input.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
        }
        await delay(100);
        setValue(input, "", ctx);
      }
      return true;
    }

    // Resume drop-zone: synthetic drop with the same DataTransfer the
    // filler builds for file inputs.
    function handleDropZone(dropZone, fileData, deps) {
      if (!dropZone || !fileData) return false;
      try {
        const { File = win.File, DataTransfer = win.DataTransfer } = deps || {};
        if (!File || !DataTransfer) return false;
        const bytes = Uint8Array.from(atob(fileData.base64), c => c.charCodeAt(0));
        const file = new File([bytes], fileData.filename, { type: fileData.mime });
        const dt = new DataTransfer();
        dt.items.add(file);
        const w = dropZone.ownerDocument.defaultView || win;
        const dropEvent = new w.Event("drop", { bubbles: true, cancelable: true });
        dropEvent.dataTransfer = dt;
        dropZone.dispatchEvent(dropEvent);
        dropZone.dispatchEvent(new w.Event("change", { bubbles: true }));
        return true;
      } catch (e) {
        return false;
      }
    }

    return {
      name: "workday",
      detect,
      handles,
      selectorMap,
      fillDelayMs: 50, // Workday debounces; simultaneous synthetic events trip validation
      fillField,
      onNavigation,
      handleChipInput,
      handleDropZone
    };
  }

  const api = { workday };
  root.ResumeBot = Object.assign(root.ResumeBot || {}, { adapters: Object.assign(root.ResumeBot && root.ResumeBot.adapters || {}, api) });
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
