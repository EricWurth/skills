// popup.js
(function (root) {
  "use strict";

  function send(message) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) return resolve({ success: false, error: chrome.runtime.lastError.message });
        resolve(response);
      });
    });
  }

  function activeTab() {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => resolve(tabs && tabs[0] ? tabs[0] : null));
    });
  }

  async function init() {
    const fillBtn = document.getElementById('fillBtn');
    const grantBtn = document.getElementById('grantBtn');
    const scanBtn = document.getElementById('scanBtn');
    const optionsBtn = document.getElementById('optionsBtn');
    const createLoginBtn = document.getElementById('createLoginBtn');
    const fillLoginBtn = document.getElementById('fillLoginBtn');
    const loginSection = document.getElementById('login-section');
    const loginHint = document.getElementById('login-hint');
    const atsDiv = document.getElementById('ats');
    const scanStatusDiv = document.getElementById('scan-status');
    const credentialStatusDiv = document.getElementById('credential-status');

    function show(el, on) { if (el) el.style.display = on ? 'block' : 'none'; }

    // Update status display
    function updateStatus(status) {
      if (!status) return;
      atsDiv.textContent = `ATS: ${status.ats || 'not detected'}`;

      if (status.lastScan !== undefined) {
        const { fieldCount, matchCount } = status.lastScan;
        scanStatusDiv.textContent = `Last scan: ${fieldCount} fields, ${matchCount} matched`;
      }

      if (status.credentialStatus !== undefined) {
        if (status.credentialStatus.hasCredential) {
          credentialStatusDiv.textContent = '1Password: Found credential';
          credentialStatusDiv.style.color = 'green';
        } else if (status.credentialStatus.locked) {
          credentialStatusDiv.textContent = '1Password: approve in 1Password';
          credentialStatusDiv.style.color = 'orange';
        } else {
          credentialStatusDiv.textContent = '1Password: No credential';
          credentialStatusDiv.style.color = '#a00';
        }
      }

      if (status.needsPermission !== undefined) {
        show(grantBtn, !!status.needsPermission);
      }

      // 1Password actions only make sense when the page has a password field.
      const page = status.page || null;
      const hasPw = !!(page && page.hasPasswordField);
      show(loginSection, hasPw);
      if (hasPw) {
        const hasCred = !!(status.credentialStatus && status.credentialStatus.hasCredential);
        show(createLoginBtn, !hasCred);
        show(fillLoginBtn, hasCred);
        if (loginHint) {
          loginHint.textContent = hasCred
            ? 'Fills the saved username + password for this site.'
            : (page.isAccountCreation
              ? 'Looks like account creation: 1Password will generate a password and fill it here.'
              : 'Creates a 1Password login for this site and fills it.');
        }
      }
    }

    function showResult(result, verb) {
      if (result && result.success) {
        if (result.locked) {
          credentialStatusDiv.textContent = '1Password: approve in 1Password, then retry';
          credentialStatusDiv.style.color = 'orange';
          return;
        }
        scanStatusDiv.textContent = `${verb}: ${result.filled !== undefined ? result.filled + ' filled' : 'done'}`;
      } else {
        scanStatusDiv.textContent = `${verb} failed${result && result.error ? ': ' + result.error : ''}`;
      }
    }

    fillBtn.addEventListener('click', async () => {
      scanStatusDiv.textContent = 'Filling...';
      const response = await send({ action: 'fill' });
      if (response && response.success) {
        const parts = [`${response.filled || 0} filled`];
        if (response.captured) parts.push(`${response.captured} to review on the page`);
        scanStatusDiv.textContent = `Fill complete: ${parts.join(', ')}`;
      } else {
        scanStatusDiv.textContent = `Fill failed${response && response.error ? ': ' + response.error : ''}`;
      }
    });

    scanBtn.addEventListener('click', async () => {
      scanStatusDiv.textContent = 'Scanning...';
      const response = await send({ action: 'scan' });
      if (response && response.success) {
        const fieldCount = response.fields ? response.fields.length : 0;
        const matchCount = response.matches ? response.matches.filter(m => m !== null).length : 0;
        scanStatusDiv.textContent = `Scan complete - ${fieldCount} fields found, ${matchCount} matched`;
        if (response.ats) atsDiv.textContent = `ATS: ${response.ats}`;
      } else {
        scanStatusDiv.textContent = `Scan failed${response && response.error ? ': ' + response.error : ''}`;
      }
    });

    optionsBtn.addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });

    if (createLoginBtn) {
      createLoginBtn.addEventListener('click', async () => {
        scanStatusDiv.textContent = 'Waiting for 1Password...';
        const r = await send({ action: 'createLogin' });
        showResult(r, 'Create login');
        if (r && r.success && !r.locked) {
          const s = await send({ action: 'getStatus' });
          if (s && s.success) updateStatus(s.status);
        }
      });
    }

    if (fillLoginBtn) {
      fillLoginBtn.addEventListener('click', async () => {
        scanStatusDiv.textContent = 'Waiting for 1Password...';
        const r = await send({ action: 'fillLogin' });
        showResult(r, 'Fill login');
      });
    }

    grantBtn.addEventListener('click', async () => {
      // The permission must be requested from this user gesture, for the
      // TAB's origin (not the popup's own chrome-extension:// origin).
      const tab = await activeTab();
      let origin = null;
      try { origin = tab && tab.url ? new URL(tab.url).origin : null; } catch (e) { origin = null; }
      if (!origin || !/^https?:/.test(origin)) {
        scanStatusDiv.textContent = 'Cannot grant access on this page';
        return;
      }
      chrome.permissions.request({ origins: [origin + '/*'] }, async (granted) => {
        if (!granted) {
          scanStatusDiv.textContent = 'Permission denied';
          return;
        }
        const inj = await send({ action: 'injectContentScripts', tabId: tab.id });
        if (!inj || !inj.success) {
          scanStatusDiv.textContent = `Could not load on this page${inj && inj.error ? ': ' + inj.error : ''}`;
          return;
        }
        show(grantBtn, false);
        const response = await send({ action: 'scan' });
        if (response && response.success) {
          const fieldCount = response.fields ? response.fields.length : 0;
          const matchCount = response.matches ? response.matches.filter(m => m !== null).length : 0;
          scanStatusDiv.textContent = `Scan complete - ${fieldCount} fields found, ${matchCount} matched`;
        }
      });
    });

    // Initialize status
    const response = await send({ action: 'getStatus' });
    if (response && response.success) {
      updateStatus(response.status);
    }
  }

  // For Chrome environment: auto-initialize on DOMContentLoaded
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    document.addEventListener('DOMContentLoaded', init);
  }

  // For Node/test environment: export init function
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { init };
  }
})(typeof window !== "undefined" ? window : globalThis);
