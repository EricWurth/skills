// filler.js
// value injection engine
(function (root) {
  "use strict";

  // Helper to check if an element is visually hidden
  function isVisuallyHidden(el) {
    if (!el) return false;
    const win = (el.ownerDocument && el.ownerDocument.defaultView) || root;
    const style = win.getComputedStyle(el);
    return (
      style.opacity === "0" ||
      style.width === "0px" ||
      style.height === "0px" ||
      el.classList.contains("sr-only") ||
      el.classList.contains("visually-hidden")
    );
  }

  // Helper to find associated label for checkbox/radio
  function getAssociatedLabel(input) {
    const doc = input.ownerDocument || document;
    if (input.id) {
      const label = doc.querySelector(`label[for="${input.id}"]`);
      if (label) return label;
    }
    // Check if wrapped in label
    let parent = input.parentNode;
    while (parent && parent.nodeType === 1) {
      if (parent.tagName.toLowerCase() === "label") return parent;
      parent = parent.parentNode;
    }
    return null;
  }

  // Helper to delay for Workday debounce constraint
  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Detect date format from placeholder or pattern
  // Returns the explicit format signalled by placeholder/pattern, or null when
  // there is no signal. Placeholders usually carry the literal token
  // ("MM/DD/YYYY"), patterns carry a digit regex — check both.
  function detectExplicitDateFormat(input) {
    if (!input || typeof input.getAttribute !== "function") return null;
    const hints = [input.placeholder || "", input.getAttribute("pattern") || ""];
    for (const hint of hints) {
      const h = hint.toUpperCase();
      if (h.includes("YYYY-MM-DD") || /\d{4}-\d{2}-\d{2}/.test(hint)) return "YYYY-MM-DD";
      if (h.includes("DD/MM/YYYY")) return "DD/MM/YYYY";
      if (h.includes("MM/DD/YYYY") || /\d{2}\/\d{2}\/\d{4}/.test(hint)) return "MM/DD/YYYY";
    }
    return null;
  }

  function detectDateFormat(input) {
    // Default to US order when nothing is signalled
    return detectExplicitDateFormat(input) || "MM/DD/YYYY";
  }

  // Format ISO date to target format
  function formatDate(isoString, format) {
    // Bare ISO dates are calendar dates — parse the string directly. Going
    // through Date() would interpret them as UTC midnight and shift the day
    // for any user west of Greenwich.
    let year, month, day;
    const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(isoString).trim());
    if (isoMatch) {
      [, year, month, day] = isoMatch;
    } else {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return "";
      year = date.getFullYear();
      month = String(date.getMonth() + 1).padStart(2, "0");
      day = String(date.getDate()).padStart(2, "0");
    }

    switch (format) {
      case "YYYY-MM-DD":
        return `${year}-${month}-${day}`;
      case "MM/DD/YYYY":
        return `${month}/${day}/${year}`;
      case "DD/MM/YYYY":
        return `${day}/${month}/${year}`;
      default:
        return `${month}/${day}/${year}`; // default to MM/DD/YYYY
    }
  }

  // File attachment helper for jsdom compatibility
  function attachFile(input, fileData, deps = {}) {
    const { DataTransfer = root.DataTransfer, File = root.File } = deps;

    if (!DataTransfer || !File) {
      throw new Error("DataTransfer and File constructors required for file attachment");
    }

    const { base64, filename, mime } = fileData;
    const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    const file = new File([bytes], filename, { type: mime });
    const dt = new DataTransfer();
    dt.items.add(file);

    try {
      input.files = dt.files;
    } catch (e) {
      // jsdom workaround: input.files is read-only, so we dispatch change event directly
      // In real Chrome, the above line works
    }

    input.dispatchEvent(new root.Event("change", { bubbles: true }));
  }

  // React tracks `value` through its own property descriptor on the
  // instance; only the *prototype* setter reaches the real DOM value without
  // React swallowing the change. Pick the prototype that matches the element
  // — calling HTMLInputElement's setter on a <textarea> throws.
  function setNativeValue(el, value) {
    const win = (el.ownerDocument && el.ownerDocument.defaultView) || root;
    const tag = el.tagName.toLowerCase();
    const proto = tag === "textarea" ? win.HTMLTextAreaElement.prototype
      : tag === "select" ? win.HTMLSelectElement.prototype
      : win.HTMLInputElement.prototype;
    const desc = Object.getOwnPropertyDescriptor(proto, "value");
    if (desc && desc.set) {
      desc.set.call(el, value);
    } else {
      el.value = value;
    }
  }

  function fireValueEvents(el) {
    el.dispatchEvent(new root.Event("input", { bubbles: true }));
    el.dispatchEvent(new root.Event("change", { bubbles: true }));
    el.dispatchEvent(new root.Event("blur", { bubbles: true }));
  }

  // Truthy spellings a yes/no answer can take on a form.
  const TRUE_WORDS = ["yes", "y", "true", "1", "on", "checked"];
  const FALSE_WORDS = ["no", "n", "false", "0", "off", "unchecked"];

  function norm(s) {
    return String(s == null ? "" : s).trim().toLowerCase();
  }

  // Does a radio/checkbox option (value + its own label) mean `value`?
  function optionMatches(input, value, aliases) {
    if (value === true) return true;
    const want = norm(value);
    if (!want) return false;
    const candidates = [norm(input.value)];
    const label = getAssociatedLabel(input);
    if (label) candidates.push(norm(label.textContent));
    const aria = input.getAttribute && input.getAttribute("aria-label");
    if (aria) candidates.push(norm(aria));
    const wants = [want, ...(aliases || []).map(norm)];
    if (TRUE_WORDS.includes(want)) wants.push(...TRUE_WORDS);
    if (FALSE_WORDS.includes(want)) wants.push(...FALSE_WORDS);
    return candidates.some(c => c && wants.includes(c));
  }

  // Fill a single field
  async function fillField(fieldInfo, value, profile, options = {}) {
    const { input, type, isTextType, isSelectType, isCheckboxType, isRadioType, isFileType, isDateType } = fieldInfo;
    const { allowPassword = false } = options;

    // Hard rails: never fill password fields unless explicitly allowed via the 1Password flow
    if (type === "password" && !allowPassword) return false;

    // Hard rails: never fill EEO-mapped fields when profile value is empty
    // This is enforced by the caller (main.js) based on field mapping.

    let result = true;

    if (isTextType || (type === "password" && allowPassword)) {
      setNativeValue(input, value);
      fireValueEvents(input);

    } else if (isSelectType) {
      // Native selects: match option by value, then by text, then by alias list
      const opts = Array.from(input.options);
      const want = norm(value);
      let chosen = opts.find(o => o.value === value) || opts.find(o => norm(o.value) === want);
      if (!chosen) chosen = opts.find(o => norm(o.textContent) === want);
      let aliasUsed = null;
      if (!chosen) {
        for (const alias of options.aliases || []) {
          const a = norm(alias);
          chosen = opts.find(o => norm(o.textContent) === a || norm(o.value) === a);
          if (chosen) { aliasUsed = alias; break; }
        }
      }
      if (!chosen && TRUE_WORDS.includes(want)) chosen = opts.find(o => TRUE_WORDS.includes(norm(o.textContent)) || TRUE_WORDS.includes(norm(o.value)));
      if (!chosen && FALSE_WORDS.includes(want)) chosen = opts.find(o => FALSE_WORDS.includes(norm(o.textContent)) || FALSE_WORDS.includes(norm(o.value)));
      if (!chosen) return false;

      setNativeValue(input, chosen.value);
      fireValueEvents(input);
      if (aliasUsed) result = { success: true, aliasUsed };

    } else if (isCheckboxType || isRadioType) {
      // Radios/checkboxes: click() the input, or its label when visually
      // hidden. Only click when this option actually means `value` — a
      // yes/no radio group produces two matches for the same question and
      // clicking both would always leave the last one selected.
      if (!optionMatches(input, value, options.aliases)) return false;
      const wantChecked = !FALSE_WORDS.includes(norm(value)) || norm(input.value) === norm(value);
      if (input.checked === wantChecked && isCheckboxType) return true;
      if (input.checked && isRadioType) return true;
      const clickTarget = isVisuallyHidden(input) ? (getAssociatedLabel(input) || input) : input;
      clickTarget.click();

    } else if (isFileType) {
      // File inputs: build File from base64 → DataTransfer → input.files → change event
      // Expects value to be { base64, filename, mime }
      if (value && typeof value === "object" && value.base64) {
        attachFile(input, value, options.deps);
      } else {
        console.error("Invalid file data for file input");
        return false;
      }

    } else if (isDateType) {
      // Dates: accept ISO string internally. Real <input type="date"> only
      // accepts ISO per spec (browsers reject anything else); text inputs
      // posing as dates get the format signalled by placeholder/pattern.
      const dateFormat = input.type === "date" ? "YYYY-MM-DD" : detectDateFormat(input);
      const formattedValue = formatDate(value, dateFormat);
      if (!formattedValue) return false;
      setNativeValue(input, formattedValue);
      fireValueEvents(input);

    } else if (input.isContentEditable) {
      input.focus && input.focus();
      input.textContent = String(value);
      input.dispatchEvent(new root.Event("input", { bubbles: true }));
      input.dispatchEvent(new root.Event("blur", { bubbles: true }));

    } else {
      return false;
    }

    // Wait for Workday debounce constraint
    if (options.delayMs > 0) {
      await delay(options.delayMs);
    }

    return result;
  }

  // Classify a scanner field (or a bare { input, tag, type }) for fillField.
  function classify(match) {
    const input = match.input;
    const tag = (match.tag || (input && input.tagName) || "").toLowerCase();
    const type = (match.type || (input && input.type) || "").toLowerCase();
    // A text input whose placeholder/pattern names a date format is a date
    // field in disguise (the common ATS pattern) — route it to the date branch.
    const isTextDateField =
      tag === "input" && ["text", ""].includes(type) &&
      !!input && !!detectExplicitDateFormat(input);

    return {
      input,
      tag,
      type,
      isTextType: (tag === "textarea") ||
        (tag === "input" && ["text", "email", "tel", "url", "search", "number", ""].includes(type) && !isTextDateField),
      isSelectType: tag === "select",
      isCheckboxType: type === "checkbox",
      isRadioType: type === "radio",
      isFileType: type === "file",
      isDateType: type === "date" || isTextDateField
    };
  }

  // Sequential fill orchestration. Each match: { input, tag, type, value,
  // aliases? }. Returns per-match results in order.
  async function fillAll(matches, profile, options = {}) {
    const delayMs = options.delayMs !== undefined ? options.delayMs : 50;
    const results = [];

    for (const match of matches) {
      // Skip if not applicable
      if (!match || !match.input || match.input.disabled) { results.push(false); continue; }

      const fieldInfo = classify(match);
      const value = match.value;

      if (value !== undefined && value !== null && value !== "") {
        try {
          results.push(await fillField(fieldInfo, value, profile, { delayMs, ...options, aliases: match.aliases || options.aliases }));
        } catch (e) {
          console.error("[filler] fill failed:", e);
          results.push(false);
        }
      } else {
        results.push(false);
      }
    }
    return results;
  }

  // Export API
  const api = {
    fillAll,
    fillField,
    classify,
    setNativeValue,
    // Exposed for testing
    attachFile,
    detectDateFormat,
    detectExplicitDateFormat,
    formatDate
  };

  root.ResumeBot = Object.assign(root.ResumeBot || {}, { filler: api });
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
