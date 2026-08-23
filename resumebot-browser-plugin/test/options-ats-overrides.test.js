// test/options-ats-overrides.test.js
const { describe, it, beforeEach, afterEach } = require('node:test');
const { JSDOM } = require('jsdom');
const path = require('path');
const fs = require('fs');

// Load the chrome mock
const chromeMock = require('../test/helpers/chrome-mock.js');

const assert = require('node:assert/strict');
describe('Options ATS Overrides', () => {
  let dom;
  let window;
  let document;
  let optionsJsSource;

  beforeEach(() => {
    // Set up jsdom with the options.html
    const htmlPath = path.join(__dirname, '../extension/options/options.html');
    const html = fs.readFileSync(htmlPath, 'utf8');
    dom = new JSDOM(html, { runScripts: 'dangerously' });
    window = dom.window;
    document = window.document;

    // Load options.js source for later use
    const optionsJsPath = path.join(__dirname, '../extension/options/options.js');
    optionsJsSource = fs.readFileSync(optionsJsPath, 'utf8');

    // Mock the qaList response to avoid errors (since init calls loadQAMemory)
    global.chrome = chromeMock.createChromeMock();
    window.chrome = global.chrome;
    global.chrome.setMessageResponse('qaList', {
      success: true,
      data: {
        entries: []
      }
    });
  });

  afterEach(() => {
    // Clean up
    delete global.chrome;
    dom.window.close();
  });

  it('should render ATS overrides from siteRegistry', async () => {
    // Set up chrome mock (already done in beforeEach, but we need to set the specific response)
    global.chrome.setMessageResponse('getSiteRegistry', {
      success: true,
      data: {
        atsOverrides: [
          { atsType: 'workday', domainPattern: 'company1.myworkdayjobs.com' },
          { atsType: 'greenhouse', domainPattern: 'company2.greenhouse.io' }
        ]
      }
    });

    // Load options.js directly since jsdom doesn't fetch external <script src>.
    // Call the exported init() directly rather than relying on jsdom's natural
    // DOMContentLoaded auto-fire, which is unreliable under node:test's execution
    // context (confirmed empirically: it never fires here, though it does in a
    // plain script) -- see AGENTS.md.
    window.module = module;
    window.eval(optionsJsSource);
    await module.exports.init();

    // Check that rows appear with correct values
    const overrideDivs = document.getElementById('ats-overrides-container').querySelectorAll('.ats-override-row');
    assert.strictEqual(overrideDivs.length, 2);

    // Check first row
    const firstSelect = overrideDivs[0].querySelector('select');
    const firstInput = overrideDivs[0].querySelector('input[type="text"]');
    assert.strictEqual(firstSelect.value, 'workday');
    assert.strictEqual(firstInput.value, 'company1.myworkdayjobs.com');

    // Check second row
    const secondSelect = overrideDivs[1].querySelector('select');
    const secondInput = overrideDivs[1].querySelector('input[type="text"]');
    assert.strictEqual(secondSelect.value, 'greenhouse');
    assert.strictEqual(secondInput.value, 'company2.greenhouse.io');
  });

  it('should allow adding a new ATS override and saving', async () => {
    // Set up chrome mock
    global.chrome.setMessageResponse('getSiteRegistry', {
      success: true,
      data: {
        atsOverrides: []
      }
    });

    // Mock the setSiteRegistry response (for when we save)
    global.chrome.setMessageResponse('setSiteRegistry', {
      success: true
    });

    // Load options.js
    window.module = module;
    window.eval(optionsJsSource);
    await module.exports.init();

    // Click the add button (which adds a blank row)
    const addButton = document.getElementById('add-ats-override');
    addButton.click();

    // Wait for the row to be added
    await new Promise(setImmediate);

    // Check that a blank row was added
    let overrideDivs = document.getElementById('ats-overrides-container').querySelectorAll('.ats-override-row');
    assert.strictEqual(overrideDivs.length, 1);

    // Fill in the blank row's inputs
    const rowSelect = overrideDivs[0].querySelector('select');
    const rowInput = overrideDivs[0].querySelector('input[type="text"]');
    rowSelect.value = 'lever';
    rowInput.value = 'company3.lever.co';

    // Click the save button (which triggers saveProfile and saveSiteRegistry)
    const saveButton = document.getElementById('save-button');
    saveButton.click();

    // Wait for the save operation
    await new Promise(setImmediate);

    // Check that setSiteRegistry was called with the correct data
    const messages = global.chrome.getMessages();
    const setSiteRegistryMsg = messages.find(msg => msg.action === 'setSiteRegistry');
    assert.ok(setSiteRegistryMsg);
    assert.strictEqual(setSiteRegistryMsg.data.atsOverrides.length, 1);
    assert.strictEqual(setSiteRegistryMsg.data.atsOverrides[0].atsType, 'lever');
    assert.strictEqual(setSiteRegistryMsg.data.atsOverrides[0].domainPattern, 'company3.lever.co');
  });

  it('should allow deleting an ATS override', async () => {
    // Set up chrome mock
    global.chrome.setMessageResponse('getSiteRegistry', {
      success: true,
      data: {
        atsOverrides: [
          { atsType: 'icims', domainPattern: 'company4.icims.com' }
        ]
      }
    });

    // Mock the setSiteRegistry response (for when we save after delete)
    global.chrome.setMessageResponse('setSiteRegistry', {
      success: true
    });

    // Load options.js
    window.module = module;
    window.eval(optionsJsSource);
    await module.exports.init();

    // Check initial state: 1 row
    let overrideDivs = document.getElementById('ats-overrides-container').querySelectorAll('.ats-override-row');
    assert.strictEqual(overrideDivs.length, 1);

    // Click the remove button in the row
    const removeButton = overrideDivs[0].querySelector('.remove-row');
    removeButton.click();

    // Wait for the remove operation
    await new Promise(setImmediate);

    // Check that the row is removed
    overrideDivs = document.getElementById('ats-overrides-container').querySelectorAll('.ats-override-row');
    assert.strictEqual(overrideDivs.length, 0);

    // Click the save button to persist the deletion
    const saveButton = document.getElementById('save-button');
    saveButton.click();

    // Wait for the save operation
    await new Promise(setImmediate);

    // Check that setSiteRegistry was called with an empty array
    const messages = global.chrome.getMessages();
    const setSiteRegistryMsg = messages.find(msg => msg.action === 'setSiteRegistry');
    assert.ok(setSiteRegistryMsg);
    assert.strictEqual(setSiteRegistryMsg.data.atsOverrides.length, 0);
  });
});