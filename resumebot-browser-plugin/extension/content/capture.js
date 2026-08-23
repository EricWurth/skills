// capture.js
// Unmatched-field capture overlay: the "ask once" half of the product.
// After a fill pass, every field that did not match (plus EEO fields with no
// profile value, plus qa-memory answers flagged reviewBeforeFill) is listed
// here. Submitting fills the fields AND persists the answers to qa-memory so
// the next application on any ATS can answer them silently.
(function (root) {
  "use strict";

  const CONTAINER_ID = "resumebot-capture-container";
  const EEO_PATHS = ["eeo.gender", "eeo.race", "eeo.veteranStatus", "eeo.disabilityStatus"];
  const LONG_ANSWER = 200; // chars; longer free text defaults to review-before-fill

  // --- Small helpers -------------------------------------------------------

  function getNestedValue(obj, path) {
    if (!obj || !path) return undefined;
    let cur = obj;
    for (const part of path.split(".")) {
      if (cur === undefined || cur === null) return undefined;
      cur = cur[part];
    }
    return cur;
  }

  function storageGet(key, fallback) {
    return new Promise((resolve) => {
      try {
        const r = chrome.storage.local.get(key, (data) => resolve((data && data[key]) || fallback));
        if (r && typeof r.then === "function") r.then((data) => resolve((data && data[key]) || fallback));
      } catch (e) {
        resolve(fallback);
      }
    });
  }

  function storageSet(obj) {
    return new Promise((resolve) => {
      try {
        const r = chrome.storage.local.set(obj, () => resolve());
        if (r && typeof r.then === "function") r.then(() => resolve());
      } catch (e) {
        resolve();
      }
    });
  }

  // Fallbacks keep this module loadable on its own in tests; in the
  // extension, normalize.js and filler.js always load first.
  function normalizeQuestion(text, doc) {
    const n = root.ResumeBot && root.ResumeBot.normalize;
    if (n && n.normalizeQuestion) return n.normalizeQuestion(text, doc);
    return String(text || "").toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
  }

  async function generateKey(normalized) {
    const n = root.ResumeBot && root.ResumeBot.normalize;
    if (n && n.generateKey) return n.generateKey(normalized);
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
      hash = ((hash << 5) - hash) + normalized.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  function classifyField(field) {
    const input = field.input;
    const tag = String(field.tag || (input && input.tagName) || "").toLowerCase();
    let type = String(field.type || (input && input.type) || "").toLowerCase();
    if (tag === "select") type = "select";
    const filler = root.ResumeBot && root.ResumeBot.filler;
    const isTextDate = tag === "input" && ["text", ""].includes(type) && !!input &&
      !!(filler && filler.detectExplicitDateFormat && filler.detectExplicitDateFormat(input));
    return {
      tag,
      type,
      isText: tag === "input" && ["text", "email", "tel", "url", "search", "number", ""].includes(type) && !isTextDate,
      isTextarea: tag === "textarea",
      isSelect: tag === "select",
      isCheckbox: type === "checkbox",
      isRadio: type === "radio",
      isFile: type === "file",
      isDate: type === "date" || isTextDate
    };
  }

  // Collect which fields need a human. Radios are grouped by name so a
  // yes/no question is one row, not two.
  function collectRows(fields, matchResults, profile, review) {
    const rows = [];
    const seenGroups = new Map();

    fields.forEach((field, index) => {
      const match = matchResults[index];
      const cls = classifyField(field);
      let reason = null;

      if (!match) {
        reason = "unmatched";
      } else if (match.profilePath && EEO_PATHS.includes(match.profilePath)) {
        const v = getNestedValue(profile, match.profilePath);
        if (v === "" || v === null || v === undefined) reason = "eeo";
      }
      if (!reason) return;

      if (cls.isRadio && field.groupName) {
        const existing = seenGroups.get(field.groupName);
        if (existing) {
          existing.groupFields.push({ field, index });
          existing.options.push({ value: field.value || "", text: field.optionLabel || field.value || "" });
          return;
        }
        const row = { field, index, match, cls, reason, groupFields: [{ field, index }],
          options: [{ value: field.value || "", text: field.optionLabel || field.value || "" }] };
        seenGroups.set(field.groupName, row);
        rows.push(row);
        return;
      }

      rows.push({ field, index, match, cls, reason });
    });

    // Review rows: matched qa-memory answers the user asked to glance at.
    for (const r of review || []) {
      const field = fields[r.index];
      if (!field) continue;
      rows.push({ field, index: r.index, match: r.match, cls: classifyField(field), reason: "review", prefill: r.value });
    }

    return rows;
  }

  // --- UI --------------------------------------------------------------------

  const STYLE = `
      :host { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
      .header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid #eee; background: #f8f9fa; }
      .header h2 { margin: 0; font-size: 16px; color: #333; }
      .close-btn { background: none; border: none; font-size: 20px; cursor: pointer; padding: 0; line-height: 1; color: #666; }
      .close-btn:hover { color: #333; }
      .fields { padding: 16px; }
      .field-row { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px dashed #eee; }
      .field-row:last-child { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }
      .field-label { font-weight: 600; font-size: 14px; color: #333; }
      .field-type { font-size: 12px; color: #666; text-transform: capitalize; }
      .eeo-flag, .review-flag { color: #333; font-size: 10px; padding: 2px 6px; border-radius: 3px; margin-left: 8px; }
      .eeo-flag { background: #ffeb3b; }
      .review-flag { background: #c8e6c9; }
      .answer-control { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; box-sizing: border-box; }
      .answer-control:focus { outline: none; border-color: #4a90e2; box-shadow: 0 0 0 2px rgba(74,144,226,0.2); }
      .note { font-size: 12px; color: #777; }
      .toggle-container { display: flex; align-items: center; gap: 8px; margin-top: 8px; font-size: 14px; color: #555; }
      .toggle-container input[type="checkbox"] { width: 16px; height: 16px; }
      .submit-btn { background: #4a90e2; color: white; border: none; padding: 10px 16px; border-radius: 4px; cursor: pointer; font-size: 14px; width: 100%; margin-top: 20px; }
      .submit-btn:hover { background: #3a7bc8; }
      .submit-btn:disabled { background: #ccc; cursor: not-allowed; }
      .footer { padding: 0 16px 16px; }
  `;

  function makeShadow(container) {
    const ponyfill = {
      querySelector: (s) => container.querySelector(s),
      querySelectorAll: (s) => container.querySelectorAll(s),
      getElementById: (id) => container.querySelector("#" + id),
      appendChild: (c) => container.appendChild(c),
      removeChild: (c) => container.removeChild(c)
    };
    let shadowRoot = null;
    if (typeof container.attachShadow === "function") {
      try { shadowRoot = container.attachShadow({ mode: "closed" }); } catch (e) { shadowRoot = null; }
    }
    if (!shadowRoot) shadowRoot = ponyfill;
    Object.defineProperty(container, "shadowRoot", { value: shadowRoot, configurable: true });
    return shadowRoot;
  }

  function buildAnswerControl(row, doc) {
    const { field, cls } = row;
    let control;
    if (row.groupFields || cls.isSelect) {
      control = doc.createElement("select");
      const options = row.groupFields ? row.options
        : (field.options || (field.input && field.input.options ? Array.from(field.input.options).map(o => ({ value: o.value, text: o.textContent })) : []));
      const blank = doc.createElement("option");
      blank.value = "";
      blank.textContent = "-- Please select --";
      control.appendChild(blank);
      for (const o of options) {
        const opt = doc.createElement("option");
        opt.value = o.value;
        opt.textContent = o.text;
        control.appendChild(opt);
      }
    } else if (cls.isCheckbox) {
      control = doc.createElement("input");
      control.type = "checkbox";
    } else if (cls.isTextarea || (typeof row.prefill === "string" && row.prefill.length > 80)) {
      control = doc.createElement("textarea");
      control.rows = 4;
    } else if (cls.isDate) {
      control = doc.createElement("input");
      control.type = "text";
      control.placeholder = "YYYY-MM-DD";
    } else if (cls.isFile) {
      control = doc.createElement("input");
      control.type = "text";
      control.placeholder = "Set your resume in Options to fill this";
      control.disabled = true;
    } else {
      control = doc.createElement("input");
      control.type = "text";
      control.placeholder = "Type your answer";
    }
    control.className = "answer-control";
    if (row.prefill !== undefined && control.type !== "checkbox") control.value = row.prefill;
    return control;
  }

  function readAnswer(control) {
    if (!control) return "";
    if (control.type === "checkbox") return control.checked ? "true" : "false";
    if (control.disabled) return "";
    return String(control.value || "").trim();
  }

  // --- Main entry --------------------------------------------------------------

  /**
   * Show the capture panel.
   * @param {Array} fields        scanner fields (with non-enumerable `input`)
   * @param {Array} matchResults  matcher output aligned with fields
   * @param {Object} [opts]
   * @param {Array}  [opts.review]  [{ index, match, value }] answers to confirm before filling
   * @param {string} [opts.ats]     detected ATS name (for firstSeen)
   * @param {Function} [opts.onDone] called with { filled, saved } after submit
   */
  async function capture(fields, matchResults, opts) {
    opts = opts || {};
    const doc = root.document;
    const [profile, qaMemory, siteRegistry] = await Promise.all([
      storageGet("profile", {}),
      storageGet("qaMemory", { entries: [] }),
      storageGet("siteRegistry", { domains: {} })
    ]);

    const domain = root.location ? root.location.hostname : "";
    const siteInfo = (siteRegistry.domains || {})[domain] || {};
    const ats = opts.ats || siteInfo.ats || "";

    const rows = collectRows(fields, matchResults || [], profile, opts.review);
    if (rows.length === 0) return { shown: false };

    // Replace any earlier panel
    const old = doc.getElementById(CONTAINER_ID);
    if (old) old.remove();

    const container = doc.createElement("div");
    container.id = CONTAINER_ID;
    Object.assign(container.style, {
      position: "fixed", top: "0", right: "-400px", width: "350px", maxHeight: "90vh",
      background: "white", borderLeft: "1px solid #ddd", boxShadow: "-2px 0 5px rgba(0,0,0,0.2)",
      zIndex: "2147483647", transition: "right 0.3s ease-out", overflowY: "auto",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    });
    const shadowRoot = makeShadow(container);

    const style = doc.createElement("style");
    style.textContent = STYLE;
    shadowRoot.appendChild(style);

    const header = doc.createElement("div");
    header.className = "header";
    const title = doc.createElement("h2");
    title.textContent = "Review unmatched fields";
    const closeBtn = doc.createElement("button");
    closeBtn.className = "close-btn";
    closeBtn.innerHTML = "&times;";
    closeBtn.title = "Close";
    header.appendChild(title);
    header.appendChild(closeBtn);
    shadowRoot.appendChild(header);

    const fieldsContainer = doc.createElement("div");
    fieldsContainer.className = "fields";
    shadowRoot.appendChild(fieldsContainer);

    const rowEls = [];
    rows.forEach((row) => {
      const el = doc.createElement("div");
      el.className = "field-row";

      const label = doc.createElement("div");
      label.className = "field-label";
      label.textContent = row.field.label || "(no label)";
      if (row.reason === "eeo") {
        const flag = doc.createElement("span");
        flag.className = "eeo-flag";
        flag.textContent = "EEO";
        label.appendChild(flag);
      }
      if (row.reason === "review") {
        const flag = doc.createElement("span");
        flag.className = "review-flag";
        flag.textContent = "stored answer";
        label.appendChild(flag);
      }
      el.appendChild(label);

      const typeDiv = doc.createElement("div");
      typeDiv.className = "field-type";
      typeDiv.textContent = row.groupFields ? "radio" : (row.field.type || row.cls.tag || "text");
      el.appendChild(typeDiv);

      const control = buildAnswerControl(row, doc);
      el.appendChild(control);

      if (row.reason === "eeo") {
        const note = doc.createElement("div");
        note.className = "note";
        note.textContent = "Not guessed. Set it in Options to fill silently next time.";
        el.appendChild(note);
      }

      const toggleContainer = doc.createElement("div");
      toggleContainer.className = "toggle-container";
      const toggleInput = doc.createElement("input");
      toggleInput.type = "checkbox";
      toggleInput.checked = true;
      const toggleLabel = doc.createElement("span");
      toggleLabel.textContent = row.reason === "review" ? "Use this answer" : "Save to memory";
      toggleContainer.appendChild(toggleInput);
      toggleContainer.appendChild(toggleLabel);
      el.appendChild(toggleContainer);

      fieldsContainer.appendChild(el);
      rowEls.push({ row, el, control, toggleInput });
    });

    const footer = doc.createElement("div");
    footer.className = "footer";
    const submitBtn = doc.createElement("button");
    submitBtn.className = "submit-btn";
    submitBtn.textContent = "Save and fill";
    footer.appendChild(submitBtn);
    shadowRoot.appendChild(footer);

    doc.body.appendChild(container);
    const raf = root.requestAnimationFrame || ((cb) => setTimeout(cb, 0));
    raf(() => { container.style.right = "0"; });

    function close() {
      container.style.right = "-400px";
      setTimeout(() => container.remove(), 350);
    }
    closeBtn.addEventListener("click", close);

    submitBtn.addEventListener("click", async () => {
      submitBtn.disabled = true;
      submitBtn.textContent = "Saving...";
      try {
        const result = await submit(rowEls, fields, { qaMemory, domain, ats, doc });
        close();
        if (typeof opts.onDone === "function") opts.onDone(result);
      } catch (err) {
        console.error("[capture] submit error:", err);
        submitBtn.disabled = false;
        submitBtn.textContent = "Save and fill";
      }
    });

    return { shown: true, rows: rows.length };
  }

  // Persist answers + fill the page. Split out so it has no UI state of its own.
  async function submit(rowEls, fields, ctx) {
    const filler = root.ResumeBot && root.ResumeBot.filler;
    const fills = [];
    const entriesToSave = [];
    const currentEntries = Array.isArray(ctx.qaMemory.entries) ? ctx.qaMemory.entries.slice() : [];
    const today = new Date().toISOString().split("T")[0];

    for (const { row, control, toggleInput } of rowEls) {
      const value = readAnswer(control);
      const save = toggleInput.checked;
      if (value === "") continue;

      if (row.reason === "review") {
        if (!save) continue; // "Use this answer" unticked: leave the field alone
        // The user may have edited the stored answer: persist the edit.
        const existing = currentEntries.find(e => e.key === row.match.qaKey);
        if (existing && existing.answer !== value) {
          existing.answer = value;
          entriesToSave.push(existing);
        }
      } else if (save) {
        const questionRaw = row.field.label || "";
        const questionNormalized = normalizeQuestion(questionRaw, ctx.doc);
        if (questionNormalized) {
          const key = await generateKey(questionNormalized);
          const answerType = row.groupFields ? "radio"
            : row.cls.isSelect ? "select"
            : row.cls.isCheckbox ? "checkbox"
            : row.cls.isFile ? "file"
            : row.cls.isDate ? "date" : "text";
          entriesToSave.push({
            key,
            questionRaw,
            questionNormalized,
            answer: value,
            answerType,
            selectValueAliases: [],
            firstSeen: { domain: ctx.domain, ats: ctx.ats, date: today },
            timesUsed: 0,
            reviewBeforeFill: answerType === "text" && value.length > LONG_ANSWER
          });
        }
      }

      if (row.groupFields) {
        for (const { field } of row.groupFields) {
          fills.push({ input: field.input, tag: "input", type: "radio", value });
        }
      } else {
        fills.push({ input: row.field.input, tag: row.cls.tag, type: row.cls.type, value });
      }
    }

    if (entriesToSave.length > 0) {
      const merged = currentEntries.slice();
      for (const entry of entriesToSave) {
        const i = merged.findIndex(e => e.key === entry.key);
        if (i >= 0) merged[i] = entry; else merged.push(entry);
      }
      await storageSet({ qaMemory: { entries: merged } });
    }

    let filled = 0;
    if (fills.length > 0) {
      if (filler && filler.fillAll) {
        const results = await filler.fillAll(fills, {}, { delayMs: 50 });
        filled = results.filter(Boolean).length;
      } else {
        for (const f of fills) {
          if (!f.input) continue;
          if (f.input.tagName === "SELECT" || f.input.tagName === "INPUT" || f.input.tagName === "TEXTAREA") {
            f.input.value = f.value;
            f.input.dispatchEvent(new root.Event("input", { bubbles: true }));
            f.input.dispatchEvent(new root.Event("change", { bubbles: true }));
            filled++;
          }
        }
      }
    }

    return { filled, saved: entriesToSave.length };
  }

  // --- Remap support -----------------------------------------------------------
  // The real context-menu item is registered by the service worker
  // (chrome.contextMenus, contexts: ["editable"]). All the content script
  // needs is to remember which element was right-clicked so the
  // "remapField" message can act on it.
  let lastContextTarget = null;

  function initContextMenu() {
    root.document.addEventListener("contextmenu", (e) => {
      lastContextTarget = e.target || null;
    }, true);
  }

  function getLastContextTarget() {
    return lastContextTarget;
  }

  // --- Export API ---
  const api = {
    capture,
    collectRows,
    initContextMenu,
    getLastContextTarget,
    LONG_ANSWER
  };

  root.ResumeBot = Object.assign(root.ResumeBot || {}, { capture: api });
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
