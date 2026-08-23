// capture.js
// Unmatched-field capture overlay: the "ask once" half of the product.
// After a fill pass, every field that did not match (plus EEO fields with no
// profile value, plus qa-memory answers flagged reviewBeforeFill) is listed
// here. Submitting fills the fields AND persists the answers to qa-memory so
// the next application on any ATS can answer them silently.
//
// This module owns no storage: the orchestrator hands it the profile and
// qa-memory it already loaded and a `persist` callback, and gets back what
// was filled, saved and reviewed.
(function (root) {
  "use strict";

  const CONTAINER_ID = "resumebot-capture-container";
  const LONG_ANSWER = 200; // chars; longer free text defaults to review-before-fill

  function common() {
    return (root.ResumeBot && root.ResumeBot.common) ||
      (typeof require === "function" ? require("./common.js") : null);
  }
  function filler() {
    return (root.ResumeBot && root.ResumeBot.filler) ||
      (typeof require === "function" ? require("./filler.js") : null);
  }
  function normalize() {
    return (root.ResumeBot && root.ResumeBot.normalize) ||
      (typeof require === "function" ? require("./normalize.js") : null);
  }

  // Collect which fields need a human. Radios are grouped by name so a
  // yes/no question is one row, not two. Password fields never get a row
  // (the only password path is the 1Password flow) and hidden inputs are
  // honeypots or collapsed steps.
  function collectRows(fields, matchResults, profile, review) {
    const c = common();
    const f = filler();
    const rows = [];
    const seenGroups = new Map();

    fields.forEach((field, index) => {
      if (field.type === "password" || field.visible === false) return;
      const match = matchResults[index];
      const cls = f.classify({ input: field.input, tag: field.tag, type: field.type });
      let reason = null;

      if (!match) {
        reason = "unmatched";
      } else if (match.profilePath && c.isEeoEmpty(profile, match.profilePath)) {
        reason = "eeo";
      }
      if (!reason) return;

      if (cls.isRadioType && field.groupName) {
        const option = { value: field.value || "", text: field.optionLabel || field.value || "" };
        const existing = seenGroups.get(field.groupName);
        if (existing) {
          existing.groupFields.push({ field, index });
          existing.options.push(option);
          return;
        }
        const row = { field, index, match, cls, reason, groupFields: [{ field, index }], options: [option] };
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
      rows.push({ field, index: r.index, match: r.match, cls: f.classify({ input: field.input, tag: field.tag, type: field.type }), reason: "review", prefill: r.value });
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

  function buildAnswerControl(row, doc) {
    const { field, cls } = row;
    let control;
    if (row.groupFields || cls.isSelectType) {
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
    } else if (cls.isCheckboxType) {
      control = doc.createElement("input");
      control.type = "checkbox";
    } else if (cls.tag === "textarea" || (typeof row.prefill === "string" && row.prefill.length > 80)) {
      control = doc.createElement("textarea");
      control.rows = 4;
    } else if (cls.isDateType) {
      control = doc.createElement("input");
      control.type = "text";
      control.placeholder = "YYYY-MM-DD";
    } else if (cls.isFileType) {
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

  // An untouched control is "no answer", never a value to persist. A
  // checkbox therefore only answers when it is ticked.
  function readAnswer(control) {
    if (!control || control.disabled) return "";
    if (control.type === "checkbox") return control.checked ? "true" : "";
    return String(control.value || "").trim();
  }

  // --- Main entry --------------------------------------------------------------

  /**
   * Show the capture panel.
   * @param {Array} fields        scanner fields (with non-enumerable `input`)
   * @param {Array} matchResults  matcher output aligned with fields
   * @param {Object} opts
   * @param {Object} opts.profile   the profile (for the EEO rule)
   * @param {Object} opts.qaMemory  { entries } as loaded for this fill pass
   * @param {Array}  [opts.review]  [{ index, match, value }] answers to confirm before filling
   * @param {string} [opts.ats]     detected ATS name (for firstSeen)
   * @param {string} [opts.domain]  hostname (for firstSeen)
   * @param {Function} opts.persist  async (entries) => void; upserts the given qa entries
   * @param {Function} [opts.onDone] called with { filled, saved, reviewed } after submit
   */
  async function capture(fields, matchResults, opts) {
    opts = opts || {};
    const doc = root.document;
    const profile = opts.profile || {};
    const qaMemory = opts.qaMemory || { entries: [] };
    const domain = opts.domain || (root.location ? root.location.hostname : "");
    const ats = opts.ats || "";

    const rows = collectRows(fields, matchResults || [], profile, opts.review);
    if (rows.length === 0) return { shown: false, rows: 0 };

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
    // Closed root: the page cannot reach our controls and the scanner
    // cannot mistake them for form fields. Kept in a local only.
    const shadow = container.attachShadow({ mode: "closed" });

    const style = doc.createElement("style");
    style.textContent = STYLE;
    shadow.appendChild(style);

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
    shadow.appendChild(header);

    const fieldsContainer = doc.createElement("div");
    fieldsContainer.className = "fields";
    shadow.appendChild(fieldsContainer);

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
        note.textContent = "Not guessed. Answer here once, or set it in Options.";
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
    shadow.appendChild(footer);

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
        const result = await submit(rowEls, { qaMemory, domain, ats, doc, persist: opts.persist });
        close();
        if (typeof opts.onDone === "function") opts.onDone(result);
      } catch (err) {
        console.error("[capture] submit error:", err);
        submitBtn.disabled = false;
        submitBtn.textContent = "Save and fill";
      }
    });

    // Test hook: lets a test drive the panel without the closed root.
    return { shown: true, rows: rows.length, panel: shadow };
  }

  // Persist answers + fill the page. Split out so it has no UI state of its own.
  async function submit(rowEls, ctx) {
    const f = filler();
    const n = normalize();
    const fills = [];
    const entriesToSave = [];
    const reviewed = [];
    const today = new Date().toISOString().split("T")[0];

    for (const { row, control, toggleInput } of rowEls) {
      const value = readAnswer(control);
      const save = toggleInput.checked;
      if (value === "") continue;

      if (row.reason === "review") {
        if (!save) continue; // "Use this answer" unticked: leave the field alone
        reviewed.push(row.match.qaKey);
        // The user may have edited the stored answer: persist the edit.
        const existing = (ctx.qaMemory.entries || []).find(e => e.key === row.match.qaKey);
        if (existing && existing.answer !== value) {
          entriesToSave.push({ ...existing, answer: value });
        }
      } else if (save) {
        const questionRaw = row.field.label || "";
        const questionNormalized = n.normalizeQuestion(questionRaw, ctx.doc);
        if (questionNormalized) {
          const key = await n.generateKey(questionNormalized);
          const answerType = row.groupFields ? "radio"
            : row.cls.isSelectType ? "select"
            : row.cls.isCheckboxType ? "checkbox"
            : row.cls.isFileType ? "file"
            : row.cls.isDateType ? "date" : "text";
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

    if (entriesToSave.length > 0 && typeof ctx.persist === "function") {
      await ctx.persist(entriesToSave);
    }

    let filled = 0;
    if (fills.length > 0 && f && f.fillAll) {
      const results = await f.fillAll(fills, {}, { delayMs: 0 });
      filled = results.filter(Boolean).length;
    }

    return { filled, saved: entriesToSave.length, reviewed };
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

  const api = {
    capture,
    collectRows,
    readAnswer,
    initContextMenu,
    getLastContextTarget,
    CONTAINER_ID,
    LONG_ANSWER
  };

  root.ResumeBot = Object.assign(root.ResumeBot || {}, { capture: api });
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
