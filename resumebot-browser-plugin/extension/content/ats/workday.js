// workday.js
// Workday ATS adapter
(function (root) {
  "use strict";
  function workday() {
    // Window of the page we run in (jsdom in tests, the tab in Chrome).
    const global = typeof window !== 'undefined' ? window : globalThis;

    // Selector map: profilePath or qaIntent -> CSS selector
    const selectorMap = {
      // Basic info
      "identity.firstName": "input[data-automation-id='legalNameSection_firstName']",
      "identity.lastName": "input[data-automation-id='legalNameSection_lastName']",
      "identity.email": "input[data-automation-id='email']",
      "identity.phone": "input[data-automation-id='phoneNumber']",
      // Resume upload
      "documents.resume.filename": "input[type='file'][data-automation-id='fileUpload']",
      // Custom questions (LinkedIn, website)
      "identity.linkedin": "input[data-automation-id='textField-LINKEDIN']",
      "identity.website": "input[data-automation-id='textField-WEBSITE']",
    };

    // Detect if we are in a Workday form
    function detect(doc) {
      // Already detected by detectATS, but we can do a second check for safety
      return doc.querySelectorAll("[data-automation-id]").length > 5;
    }

    // Fill a field with a value (fallback for non-widget fields)
    function fillField(el, value, ctx) {
      // We'll use the filler from the context (ctx.filler) if available, otherwise fallback
      if (ctx && ctx.filler && typeof ctx.filler.fill === 'function') {
        return ctx.filler.fill(el, value);
      }
      // Fallback: native setter and dispatch events (as in filler.js)
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      if (setter && el.tagName.toLowerCase() === 'input' && ['text', 'email', 'tel', 'url'].includes(el.type)) {
        setter.call(el, value);
        el.dispatchEvent(new global.Event("input", { bubbles: true }));
        el.dispatchEvent(new global.Event("change", { bubbles: true }));
        el.dispatchEvent(new global.Event("blur", { bubbles: true }));
        return true;
      }
      // For textarea
      if (el.tagName.toLowerCase() === 'textarea') {
        el.value = value;
        el.dispatchEvent(new global.Event("input", { bubbles: true }));
        el.dispatchEvent(new global.Event("change", { bubbles: true }));
        el.dispatchEvent(new global.Event("blur", { bubbles: true }));
        return true;
      }
      // For select
      if (el.tagName.toLowerCase() === 'select') {
        // We'll try to set by value and then by text
        const optionByValue = Array.from(el.options).find(o => o.value === value);
        if (optionByValue) {
          el.value = value;
          el.dispatchEvent(new global.Event("change", { bubbles: true }));
          return true;
        }
        const optionByText = Array.from(el.options).find(o => o.text.trim() === value);
        if (optionByText) {
          el.value = optionByText.value;
          el.dispatchEvent(new global.Event("change", { bubbles: true }));
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
          el.dispatchEvent(new global.Event("change", { bubbles: true }));
          return true;
        } catch (e) {
          console.error('Failed to attach file:', e);
          return false;
        }
      }
      return false;
    }

    // Which elements need Workday-specific handling rather than the generic
    // React-safe filler: listbox buttons and segmented date inputs.
    function handles(el) {
      if (!el || !el.tagName) return false;
      const tag = el.tagName.toLowerCase();
      if (tag === 'button' && el.getAttribute('aria-haspopup') === 'listbox') return true;
      const id = (el.getAttribute && el.getAttribute('data-automation-id') || '').toLowerCase();
      return tag === 'input' && /(month|day|year)-input$/.test(id);
    }

    // Handle Workday-specific interactions: fake dropdowns and segmented dates
    async function handleWorkdaySpecifics(doc, ctx) {
      // This function is kept for compatibility but the main logic is in fillFieldWidget
    }

    // Delay helper for Workday debounce
    function delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Handle a listbox button: click to open, wait for listbox, click matching option, verify
    async function handleListbox(button, value, doc) {
      // Click to open the listbox
      button.click();

      // Wait for the listbox to appear (dynamic insertion)
      let listbox = null;
      for (let i = 0; i < 20; i++) { // Poll for up to 2 seconds
        listbox = doc.querySelector('[role="listbox"]');
        if (listbox) break;
        await delay(100);
      }

      if (!listbox) {
        // Listbox didn't appear, close any open dropdown and return false
        button.click(); // Try to close
        return false;
      }

      // Find the option whose text matches the value (case-insensitive)
      const option = Array.from(listbox.querySelectorAll('[role="option"]'))
        .find(opt => opt.textContent.trim().toLowerCase() === value.trim().toLowerCase());

      if (!option) {
        // Option not found, close listbox and return false
        document.body.click(); // click away to close
        return false;
      }

      option.click();
      // Small delay for Workday debounce
      await delay(100);
      // Verify the button's text updated (optional)
      // We could check if button.textContent includes the selected value, but we'll assume success
      return true;
    }

    // Override fillField to handle Workday widgets
    async function fillFieldWidget(el, value, ctx) {
      // Check if it's a listbox button
      if (el.tagName.toLowerCase() === 'button' && el.getAttribute('aria-haspopup') === 'listbox') {
        return await handleListbox(el, value, el.ownerDocument);
      }

      // Check if it's a date segment input and the value looks like an ISO date
      if (el.tagName.toLowerCase() === 'input' && (el.type === 'text' || el.type === '')) {
        const automationId = el.getAttribute('data-automation-id');
        if (automationId) {
          const lowerId = automationId.toLowerCase();
          let suffixMatch = null;
          let part = ''; // 'Month', 'Day', or 'Year'
          if (lowerId.endsWith('month-input')) {
            suffixMatch = 'month-input';
            part = 'Month';
          } else if (lowerId.endsWith('day-input')) {
            suffixMatch = 'day-input';
            part = 'Day';
          } else if (lowerId.endsWith('year-input')) {
            suffixMatch = 'year-input';
            part = 'Year';
          }

          if (suffixMatch && typeof value === 'string' && /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value)) {
            const parts = value.split('-');
            if (parts.length !== 3) {
              // Not a valid ISO date after all, fall through
              return fillField(el, value, ctx);
            }
            const [yearStr, monthStr, dayStr] = parts;

            // Determine which segment this is and set all three
            let monthInputEl, dayInputEl, yearInputEl;
            const baseId = automationId.slice(0, automationId.length - suffixMatch.length);
            if (part === 'Month') {
              monthInputEl = el;
              dayInputEl = el.ownerDocument.querySelector(`[data-automation-id='${baseId}Day-input']`);
              yearInputEl = el.ownerDocument.querySelector(`[data-automation-id='${baseId}Year-input']`);
            } else if (part === 'Day') {
              monthInputEl = el.ownerDocument.querySelector(`[data-automation-id='${baseId}Month-input']`);
              dayInputEl = el;
              yearInputEl = el.ownerDocument.querySelector(`[data-automation-id='${baseId}Year-input']`);
            } else if (part === 'Year') {
              monthInputEl = el.ownerDocument.querySelector(`[data-automation-id='${baseId}Month-input']`);
              dayInputEl = el.ownerDocument.querySelector(`[data-automation-id='${baseId}Day-input']`);
              yearInputEl = el;
            }

            if (!monthInputEl || !dayInputEl || !yearInputEl) {
              // Couldn't find all three inputs, fall through
              return fillField(el, value, ctx);
            }

            // Found everything, now fill the inputs
            monthInputEl.value = monthStr;
            dayInputEl.value = dayStr;
            yearInputEl.value = yearStr;
            // Dispatch events to ensure the values are registered (following filler.js pattern)
            const win = el.ownerDocument.defaultView || window;
            [monthInputEl, dayInputEl, yearInputEl].forEach(inputEl => {
              inputEl.dispatchEvent(new win.Event("input", { bubbles: true }));
              inputEl.dispatchEvent(new win.Event("change", { bubbles: true }));
              inputEl.dispatchEvent(new win.Event("blur", { bubbles: true }));
            });
            return true;
          }
        }
      }

      // Fallback to regular fillField
      return fillField(el, value, ctx);
    }

    // Handle navigation (SPA) for Workday
    function onNavigation(cb) {
      // Workday often uses iframes and dynamic content updates
      let lastMutationTime = 0;
      const debounceMs = 500; // Debounce mutations
      const observer = new MutationObserver((mutations) => {
        const now = Date.now();
        // Debounce rapid mutations
        if (now - lastMutationTime < debounceMs) {
          return;
        }
        lastMutationTime = now;

        // Check for significant DOM changes that indicate a step transition
        let significantChange = false;
        let totalRemovedNodes = 0;
        let totalAddedNodes = 0;

        for (const mutation of mutations) {
          // Count removed nodes
          totalRemovedNodes += mutation.removedNodes.length;
          // Count added nodes
          totalAddedNodes += mutation.addedNodes.length;

          // Check for progressBar changes (step indicator)
          if (mutation.type === 'attributes' && mutation.attributeName === 'data-automation-id' && mutation.target.getAttribute('data-automation-id') === 'progressBar') {
            significantChange = true;
            break;
          }
        }

        // Consider it a significant change if there's substantial node replacement
        if (!significantChange && (totalRemovedNodes > 50 || totalAddedNodes > 50)) {
          significantChange = true;
        }

        if (significantChange) {
          // Re-scan and report the new fillable count for the badge
          if (window.ResumeBot && window.ResumeBot.scanner && typeof window.ResumeBot.scanner.scanAndReport === 'function') {
            window.ResumeBot.scanner.scanAndReport();
          }
          cb(); // Callback to re-run scan and report new fillable count
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['data-automation-id']
      });

      // Return a disconnect function
      return () => observer.disconnect();
    }

    // Handle chip-style multi-select inputs (skills, etc.)
    async function handleChipInput(input, values, doc) {
      // Values should be an array of strings
      if (!Array.isArray(values)) {
        values = [values];
      }

      for (const value of values) {
        // Type the value
        input.value = '';
        input.dispatchEvent(new global.Event('input', { bubbles: true }));
        
        // Type character by character to trigger suggestions
        for (let i = 0; i < value.length; i++) {
          input.value += value[i];
          input.dispatchEvent(new global.Event('input', { bubbles: true }));
          await delay(50); // Small delay between keystrokes
        }

        // Wait for suggestion list to appear
        let suggestionList = null;
        for (let i = 0; i < 20; i++) { // Poll for up to 2 seconds
          suggestionList = doc.querySelector('[role="listbox"]'); // Workday uses listbox for suggestions too
          if (suggestionList) break;
          await delay(100);
        }

        if (!suggestionList) {
          // No suggestion list found, continue to next value
          continue;
        }

        // Find the option whose text matches the value (case-insensitive)
        const option = Array.from(suggestionList.querySelectorAll('[role="option"]'))
          .find(opt => opt.textContent.trim().toLowerCase() === value.trim().toLowerCase());

        if (option) {
          option.click();
          // Small delay for Workday debounce
          await delay(100);
        } else {
          // Option not found, press Enter to accept the typed value
          input.dispatchEvent(new global.Event('keydown', { key: 'Enter', bubbles: true }));
          await delay(100);
        }

        // Clear the input for next chip (if it's a multi-select that clears after selection)
        // Some Workday chips clear automatically, some don't - we'll try to clear it
        input.value = '';
        input.dispatchEvent(new global.Event('input', { bubbles: true }));
      }

      return true;
    }

    // Handle resume drop-zone: dispatch synthetic drop event
    function handleDropZone(dropZone, fileData, deps) {
      if (!dropZone || !fileData) return false;

      try {
        // Create File and DataTransfer objects (same as in filler.attachFile)
        const { File = window.File, DataTransfer = window.DataTransfer } = deps;
        if (!File || !DataTransfer) {
          console.error('File or DataTransfer constructor not available');
          return false;
        }

        const { base64, filename, mime } = fileData;
        const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
        const file = new File([bytes], filename, { type: mime });
        const dt = new DataTransfer();
        dt.items.add(file);

        // Create and dispatch drop event
        const dropEvent = new global.Event('drop', {
          bubbles: true,
          cancelable: true
        });
        // Assign the DataTransfer to the event
        dropEvent.dataTransfer = dt;

        // Dispatch the drop event on the drop zone
        dropZone.dispatchEvent(dropEvent);
        
        // Also dispatch a change event for good measure
        dropZone.dispatchEvent(new global.Event('change', { bubbles: true }));
        
        return true;
      } catch (e) {
        console.error('Failed to handle drop zone:', e);
        return false;
      }
    }

    return {
      name: 'workday',
      detect,
      handles,
      selectorMap,
      fillField: fillFieldWidget, // Use our widget-aware fillField
      handleWorkdaySpecifics,
      onNavigation,
      handleChipInput,
      handleDropZone
    };
  }

  const api = { workday };
  root.ResumeBot = Object.assign(root.ResumeBot || {}, { adapters: Object.assign(root.ResumeBot && root.ResumeBot.adapters || {}, api) });
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);