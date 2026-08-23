// scanner.js
// Field discovery (DOM + shadow DOM + iframes)
(function (root) {
  "use strict";

  function isVisible(el, opts) {
    // Allow test override
    if (opts && opts.isVisible) {
      return opts.isVisible(el);
    }
    // Default visibility check: offsetParent !== null || getClientRects().length > 0, plus not aria-hidden
    return (el.offsetParent !== null || el.getClientRects().length > 0) && el.getAttribute('aria-hidden') !== 'true';
  }

  function scanFields(doc, opts) {
    // opts may include { isVisible: function, frameUrl: string } for testing
    const fields = [];

    const walk = (node) => {
      if (node.nodeType === 1) { // Node.ELEMENT_NODE
        if (isFillableField(node)) {
          const fieldInfo = extractFieldInfo(node, doc, opts);
          if (fieldInfo) {
            fields.push(fieldInfo);
          }
        }
        if (node.shadowRoot) {
          walk(node.shadowRoot);
        }
      }
      node.childNodes.forEach(walk);
    };

    walk(doc);
    return fields;
  }

  function isFillableField(el) {
    const tag = el.tagName.toLowerCase();
    const type = el.type && el.type.toLowerCase();

    if (tag === 'input') {
      const excludedTypes = ['hidden', 'submit', 'button', 'reset', 'image'];
      return !excludedTypes.includes(type);
    }

    if (tag === 'textarea' || tag === 'select') {
      return true;
    }

    if (el.isContentEditable) {
      return true;
    }

    // Workday-style fake dropdowns: a <button> that opens a listbox.
    if (tag === 'button' && el.getAttribute('aria-haspopup') === 'listbox') {
      return true;
    }

    const role = el.getAttribute('role');
    if (role) {
      const ariaRoles = ['combobox', 'listbox', 'radio', 'checkbox'];
      return ariaRoles.includes(role);
    }

    return false;
  }

  function extractFieldInfo(el, doc, opts) {
    // Get frame URL from opts, or try doc properties, or fallback to empty string
    let frameUrl = '';
    if (opts && opts.frameUrl) {
      frameUrl = opts.frameUrl;
    } else if (doc.URL) {
      frameUrl = doc.URL;
    } else if (doc.documentURI) {
      frameUrl = doc.documentURI;
    }
    
    const selectorPath = buildSelectorPath(el);
    const tag = el.tagName.toLowerCase();
    const type = el.type && el.type.toLowerCase() || '';

    const { label, labelSource } = resolveLabel(el, doc);

    const attributes = {
      name: el.name || '',
      id: el.id || '',
      autocomplete: el.autocomplete || '',
      'data-automation-id': el.getAttribute('data-automation-id') || ''
    };

    const visible = api.isVisible(el, opts);
    const required = el.hasAttribute('required');

    const info = {
      frameUrl,
      selectorPath,
      tag,
      type,
      label,
      labelSource,
      attributes,
      visible,
      required
    };

    // Option lists let the matcher/capture panel reason about choices without
    // touching the DOM again. Radios carry their own value + option label.
    if (tag === 'select' && el.options) {
      info.options = Array.from(el.options).map(o => ({ value: o.value, text: (o.textContent || '').trim() }));
    }
    if (type === 'radio' || type === 'checkbox') {
      info.value = el.value || '';
      info.checked = !!el.checked;
      info.groupName = el.name || '';
      const own = ownOptionLabel(el, doc);
      if (own) info.optionLabel = own;
    }
    if (tag === 'button') {
      info.currentText = (el.textContent || '').trim();
    }

    // The live element rides along as a NON-enumerable property: the fill
    // pipeline needs it, but structured-clone (chrome.runtime messaging)
    // only copies enumerable props, so the report stays serialisable.
    Object.defineProperty(info, 'input', { value: el, enumerable: false, configurable: true, writable: true });

    return info;
  }

  // For a radio/checkbox, the text of its own label (as opposed to the group
  // question, which resolveLabel finds via fieldset/legend or preceding text).
  function ownOptionLabel(el, doc) {
    if (el.id) {
      const l = doc.querySelector(`label[for="${el.id}"]`);
      if (l && l.textContent.trim()) return l.textContent.trim();
    }
    let parent = el.parentNode;
    while (parent && parent.nodeType === 1) {
      if (parent.tagName.toLowerCase() === 'label') return parent.textContent.trim();
      parent = parent.parentNode;
    }
    const aria = el.getAttribute('aria-label');
    if (aria && aria.trim()) return aria.trim();
    return '';
  }

  function buildSelectorPath(el) {
    if (el.id) {
      return `#${el.id}`;
    }
    if (el.getAttribute('data-automation-id')) {
      return `[data-automation-id="${el.getAttribute('data-automation-id')}"]`;
    }
    if (el.name) {
      return `${el.tagName.toLowerCase()}[name="${el.name}"]`;
    }
    // Fallback to a simple path (not guaranteed unique but works for testing)
    // We'll build a path using tag names and nth-of-type (simplified)
    const path = [];
    let curr = el;
    while (curr.parentNode && curr.parentNode.nodeType !== 9) { // Node.DOCUMENT_NODE
      let sibCount = 0;
      let sib = curr.previousSibling;
      while (sib) {
        if (sib.nodeType === 1 && sib.tagName === curr.tagName) { // Node.ELEMENT_NODE
          sibCount++;
        }
        sib = sib.previousSibling;
      }
      path.unshift(`${curr.tagName.toLowerCase()}:nth-of-type(${sibCount + 1})`);
      curr = curr.parentNode;
    }
    return path.join(' > ');
  }

  function resolveLabel(el, doc) {
    // 0. radios/checkboxes: the question is the group's legend or aria-labelled
    //    container, not the option's own label (that lives in optionLabel).
    const elType = (el.type || '').toLowerCase();
    if (elType === 'radio' || elType === 'checkbox') {
      let p = el.parentNode;
      while (p && p.nodeType === 1) {
        const t = p.tagName.toLowerCase();
        if (t === 'fieldset') {
          const legend = p.querySelector('legend');
          if (legend && legend.textContent.trim()) {
            return { label: legend.textContent.trim(), labelSource: 'legend' };
          }
        }
        if (p.getAttribute('role') === 'radiogroup' || p.getAttribute('role') === 'group') {
          const al = p.getAttribute('aria-label');
          if (al && al.trim()) return { label: al.trim(), labelSource: 'group-aria-label' };
          const lb = p.getAttribute('aria-labelledby');
          if (lb) {
            const txt = lb.split(/\s+/).map(id => { const e = doc.getElementById(id); return e ? e.textContent.trim() : ''; }).join(' ').trim();
            if (txt) return { label: txt, labelSource: 'group-aria-labelledby' };
          }
        }
        if (t === 'form') break;
        p = p.parentNode;
      }
    }

    // 1. <label for=id>
    if (el.id) {
      const labelEl = doc.querySelector(`label[for="${el.id}"]`);
      if (labelEl && labelEl.textContent.trim() !== '') {
        return { label: labelEl.textContent.trim(), labelSource: 'label-for' };
      }
    }

    // 2. aria-label
    const ariaLabel = el.getAttribute('aria-label');
    if (ariaLabel && ariaLabel.trim() !== '') {
      return { label: ariaLabel.trim(), labelSource: 'aria-label' };
    }

    // 3. aria-labelledby
    const labelledBy = el.getAttribute('aria-labelledby');
    if (labelledBy) {
      const ids = labelledBy.split(/\s+/);
      let labelText = '';
      for (const id of ids) {
        const labelledEl = doc.getElementById(id);
        if (labelledEl) {
          labelText += labelledEl.textContent + ' ';
        }
      }
      labelText = labelText.trim();
      if (labelText !== '') {
        return { label: labelText, labelSource: 'aria-labelledby' };
      }
    }

    // 4. wrapping <label>
    let parent = el.parentNode;
    while (parent && parent.nodeType === 1) { // Node.ELEMENT_NODE
      if (parent.tagName.toLowerCase() === 'label') {
        return { label: parent.textContent.trim(), labelSource: 'wrapping-label' };
      }
      parent = parent.parentNode;
    }

    // 5. placeholder
    // For select elements, check first option for placeholder-like text
    let placeholder = el.placeholder;
    if (el.tagName.toLowerCase() === 'select' && el.options.length > 0) {
        const firstOption = el.options[0];
        // If first option has empty value and non-empty text, treat as placeholder
        if (firstOption.value === '' && firstOption.textContent.trim() !== '') {
            placeholder = firstOption.textContent.trim();
        }
    }
    if (placeholder && placeholder.trim() !== '') {
        return { label: placeholder.trim(), labelSource: 'placeholder' };
    }

    // 6. nearest preceding text node / heading within the same form-group container.
    let precedingText = '';
    let current = el.previousSibling;
    while (current) {
      if (current.nodeType === 3) { // Node.TEXT_NODE
        const text = current.textContent.trim();
        if (text !== '') {
          precedingText = text + ' ' + precedingText;
        }
      } else if (current.nodeType === 1) { // Node.ELEMENT_NODE
        const tag = current.tagName.toLowerCase();
        if (/^h[1-6]$/.test(tag)) {
          precedingText = current.textContent.trim() + ' ' + precedingText;
          break;
        }
        if (tag === 'form' || tag === 'fieldset' || (current.classList && current.classList.contains('form-group'))) {
          break;
        }
        const text = current.textContent.trim();
        if (text !== '') {
          precedingText = text + ' ' + precedingText;
        }
      }
      current = current.previousSibling;
    }

    precedingText = precedingText.trim();
    if (precedingText !== '') {
      return { label: precedingText, labelSource: 'preceding-text' };
    }

    return { label: '', labelSource: 'none' };
  }

  const api = {
    scanFields,
    isVisible,
    scanAndReport
  };

  root.ResumeBot = Object.assign(root.ResumeBot || {}, { scanner: api });

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  // Scan and report to the service worker (badge count). main.js calls this;
  // kept on the API for adapters that want to trigger a re-count.
  function scanAndReport() {
    const fields = api.scanFields(document, { frameUrl: document.URL });
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      try { chrome.runtime.sendMessage({ action: 'scanResult', fields: fields.map(f => ({ label: f.label, type: f.type })) }, () => void chrome.runtime.lastError); } catch (e) { /* ignore */ }
    }
    return fields;
  }

  // Raw field report for the service worker / tests. Matching + filling
  // live in main.js (scanAndMatchFromContent, fillFromContent).
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message && message.action === 'scanFromContent') {
        const fields = api.scanFields(document, { frameUrl: document.URL });
        sendResponse({ success: true, fields });
        return true;
      }
      return false;
    });
  }
})(typeof window !== "undefined" ? window : globalThis);
