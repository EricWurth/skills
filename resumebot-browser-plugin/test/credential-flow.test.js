// test/credential-flow.test.js
// 1Password flow pieces that live in the extension: the account-creation
// heuristic, the allowPassword hard rail in the filler, the site-registry
// round trip, and sendNativeMessage's locked / timeout surfacing.
const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const { createChromeMock } = require('./helpers/chrome-mock');

function loadFresh(modulePath) {
  delete require.cache[require.resolve(modulePath)];
  return require(modulePath);
}

function scanHtml(html) {
  const dom = new JSDOM(`<!DOCTYPE html><html><body>${html}</body></html>`, { url: 'http://localhost' });
  const scanner = loadFresh('../extension/content/scanner.js');
  return scanner.scanFields(dom.window.document, { isVisible: () => true });
}

describe('Credential Flow', () => {
  let chrome;
  let serviceWorker;

  beforeEach(() => {
    chrome = createChromeMock();
    global.chrome = chrome;
    serviceWorker = loadFresh('../extension/service-worker.js');
  });

  afterEach(() => {
    delete global.chrome;
  });

  describe('account-creation page heuristic', () => {
    it('should detect password + confirm-password fields', () => {
      const fields = scanHtml(`
        <form>
          <input type="password" id="password" />
          <input type="password" id="confirm-password" />
          <button type="submit">Submit</button>
        </form>`);
      assert.strictEqual(serviceWorker.isAccountCreationPage(fields), true);
    });

    it('should detect form text with account creation keywords', () => {
      const fields = scanHtml(`
        <form>
          <label for="email">Email Address</label>
          <input type="email" id="email" />
          <label for="password">Create Account Password</label>
          <input type="password" id="password" />
          <button type="submit">Sign Up</button>
        </form>`);
      assert.strictEqual(serviceWorker.isAccountCreationPage(fields), true);
    });

    it('should not detect plain login forms', () => {
      const fields = scanHtml(`
        <form>
          <label for="email">Email</label>
          <input type="email" id="email" />
          <label for="password">Password</label>
          <input type="password" id="password" />
          <button type="submit">Log In</button>
        </form>`);
      assert.strictEqual(serviceWorker.isAccountCreationPage(fields), false);
    });
  });

  describe('allowPassword flag enforcement', () => {
    function passwordField() {
      const dom = new JSDOM('<!DOCTYPE html><html><body><input type="password" id="test-password" /></body></html>', { url: 'http://localhost' });
      global.window = dom.window;
      global.document = dom.window.document;
      const filler = loadFresh('../extension/content/filler.js');
      const input = dom.window.document.getElementById('test-password');
      return { filler, input, fieldInfo: filler.classify({ input }) };
    }

    afterEach(() => {
      delete global.window;
      delete global.document;
    });

    it('should refuse password fields without allowPassword flag', async () => {
      const { filler, input, fieldInfo } = passwordField();
      const result = await filler.fillField(fieldInfo, 'test123', {});
      assert.strictEqual(result, false);
      assert.strictEqual(input.value, '');
    });

    it('should accept password fields with allowPassword flag from 1Password flow', async () => {
      const { filler, input, fieldInfo } = passwordField();
      const result = await filler.fillField(fieldInfo, 'test123', {}, { allowPassword: true });
      assert.strictEqual(result, true);
      assert.strictEqual(input.value, 'test123');
    });
  });

  describe('site-registry round-trip', () => {
    it('should write and read hasCredential state', async () => {
      const first = await chrome._dispatchMessage({ action: 'getSiteRegistry' });
      assert.strictEqual(first.success, true);
      assert.deepStrictEqual(first.data.domains, {});

      const testDomain = 'example.com';
      const testData = {
        domains: {
          [testDomain]: {
            hasCredential: true,
            opItemId: 'test-item-id',
            ats: 'workday',
            lastApplied: new Date().toISOString()
          }
        }
      };
      const set = await chrome._dispatchMessage({ action: 'setSiteRegistry', data: testData });
      assert.strictEqual(set.success, true);

      const second = await chrome._dispatchMessage({ action: 'getSiteRegistry' });
      assert.strictEqual(second.success, true);
      assert.deepStrictEqual(second.data.domains[testDomain], testData.domains[testDomain]);
      // Defaults are layered under whatever was stored.
      assert.deepStrictEqual(second.data.atsOverrides, []);
      assert.deepStrictEqual(second.data.fieldOverrides, {});
    });
  });

  describe('native-port timeout and locked state', () => {
    it('should surface "locked" state vs error correctly', async () => {
      chrome.runtime.connectNative = () => ({
        onMessage: { addListener: (cb) => setTimeout(() => cb({ error: 'locked' }), 10) },
        onDisconnect: { addListener: () => {} },
        postMessage: () => {},
        disconnect: () => {}
      });
      await assert.rejects(serviceWorker.sendNativeMessage({ cmd: 'test' }), (error) => error.locked === true);
    });

    it('should handle timeout correctly', async () => {
      chrome.runtime.connectNative = () => ({
        onMessage: { addListener: () => {} },
        onDisconnect: { addListener: () => {} },
        postMessage: () => {},
        disconnect: () => {}
      });
      await assert.rejects(serviceWorker.sendNativeMessage({ cmd: 'test' }, 50), (error) => /timeout/i.test(error.message));
    });

    it('maps a locked host to { success: true, locked: true } for the popup', async () => {
      chrome.runtime.connectNative = () => ({
        onMessage: { addListener: (cb) => setTimeout(() => cb({ error: 'locked' }), 5) },
        onDisconnect: { addListener: () => {} },
        postMessage: () => {},
        disconnect: () => {}
      });
      const r = await serviceWorker.check1PasswordCredential('example.com');
      assert.deepStrictEqual(r, { success: true, locked: true });
    });
  });
});
