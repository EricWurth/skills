// test/popup.test.js
const { describe, it, beforeEach, afterEach } = require('node:test');
const { JSDOM } = require('jsdom');
const path = require('path');

// Load the chrome mock
const chromeMock = require('../test/helpers/chrome-mock.js');

const assert = require('node:assert/strict');
describe('Popup', () => {
  let dom;
  let window;
  let document;

  beforeEach(() => {
    // Set up jsdom with the popup.html
    const htmlPath = path.join(__dirname, '../extension/popup/popup.html');
    const html = require('fs').readFileSync(htmlPath, 'utf8');
    dom = new JSDOM(html, { runScripts: 'dangerously' });
    window = dom.window;
    document = window.document;

    // Set up chrome mock
    global.chrome = chromeMock.createChromeMock();
    window.chrome = global.chrome;
    // For the dual-environment pattern in popup.js, we need to bridge window.module to node's module
    window.module = module;
  });

  afterEach(() => {
    // Clean up
    delete global.chrome;
    dom.window.close();
  });

  it('should display status elements when getStatus is called', async () => {
    // Load popup.js and get the init function
    const popupJsPath = path.join(__dirname, '../extension/popup/popup.js');
    const popupJsSource = require('fs').readFileSync(popupJsPath, 'utf8');
    window.eval(popupJsSource);

    // Mock the getStatus response
    global.chrome.setMessageResponse('getStatus', {
      success: true,
      status: {
        ats: 'workday',
        lastScan: {
          fieldCount: 5,
          matchCount: 3
        },
        credentialStatus: {
        hasCredential: true
        },
        needsPermission: false
      }
    });

    // Initialize the popup by calling the exported init function
    await module.exports.init();
    await new Promise(setImmediate);

    // Check the status elements
    assert.strictEqual(document.getElementById('ats').textContent, 'ATS: workday');
    assert.strictEqual(document.getElementById('scan-status').textContent, 'Last scan: 5 fields, 3 matched');
    assert.strictEqual(document.getElementById('credential-status').textContent, '1Password: Found credential');
    assert.strictEqual(document.getElementById('credential-status').style.color, 'green');
    assert.strictEqual(document.getElementById('grantBtn').style.display, 'none');
  });

  it('should show grant button when needsPermission is true', async () => {
    // Load popup.js and get the init function
    const popupJsPath = path.join(__dirname, '../extension/popup/popup.js');
    const popupJsSource = require('fs').readFileSync(popupJsPath, 'utf8');
    window.eval(popupJsSource);

    global.chrome.setMessageResponse('getStatus', {
      success: true,
      status: {
        ats: null,
        lastScan: {
          fieldCount: 0,
          matchCount: 0
        },
        credentialStatus: {
        hasCredential: false
        },
        needsPermission: true
      }
    });

    await module.exports.init();
    await new Promise(setImmediate);

    assert.strictEqual(document.getElementById('grantBtn').style.display, 'block');
  });

  it('should send fill message when Fill button is clicked', async () => {
    // Load popup.js and get the init function
    const popupJsPath = path.join(__dirname, '../extension/popup/popup.js');
    const popupJsSource = require('fs').readFileSync(popupJsPath, 'utf8');
    window.eval(popupJsSource);

    // Mock getStatus for initialization
    global.chrome.setMessageResponse('getStatus', {
      success: true,
      status: {
        ats: 'workday',
        lastScan: {
          fieldCount: 5,
          matchCount: 3
        },
        credentialStatus: {
        hasCredential: true
        },
        needsPermission: false
      }
    });

    await module.exports.init();
    await new Promise(setImmediate);
    global.chrome.clearMessages(); // init()'s own getStatus call shouldn't count below

    // Click the Fill button
    const fillBtn = document.getElementById('fillBtn');
    fillBtn.click();

    // Check that a message with action: 'fill' was sent
    const messages = global.chrome.getMessages();
    assert.strictEqual(messages.length, 1);
    assert.deepStrictEqual(messages[0], { action: 'fill' });
  });

  it('should update status after a scan', async () => {
    // Load popup.js and get the init function
    const popupJsPath = path.join(__dirname, '../extension/popup/popup.js');
    const popupJsSource = require('fs').readFileSync(popupJsPath, 'utf8');
    window.eval(popupJsSource);

    // Mock getStatus for initialization
    global.chrome.setMessageResponse('getStatus', {
      success: true,
      status: {
        ats: null,
        lastScan: {
          fieldCount: 0,
          matchCount: 0
        },
        credentialStatus: {
        hasCredential: false
        },
        needsPermission: false
      }
    });

    await module.exports.init();
    await new Promise(setImmediate);

    // Mock scan response
    global.chrome.setMessageResponse('scan', {
      success: true,
      fields: [{ id: 1 }, { id: 2 }], // 2 fields
      matches: [{ fieldId: 1, value: 'test' }, null] // 1 match
    });

    // Click the Scan button
    const scanBtn = document.getElementById('scanBtn');
    scanBtn.click();

    // Wait for the scan response
    await new Promise(setImmediate);

    // Check the status updated
    assert.strictEqual(document.getElementById('scan-status').textContent, 'Scan complete - 2 fields found, 1 matched');
  });
});