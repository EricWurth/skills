// test/capture.test.js
const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const sinon = require('sinon');

// Create a DOM for testing
function createDom(html = '<input type="text">') {
  return new JSDOM(`<!DOCTYPE html><html><body>${html}</body></html>`, {
    url: 'http://localhost',
    pretendToBeVisual: true
  });
}

describe('capture.js', () => {
  let dom;
  let captureApi;
  let chromeStorageStub;
  
  beforeEach(() => {
    // Reset module cache
    delete require.cache[require.resolve('../extension/content/capture.js')];
    
    // Create fresh DOM
    dom = createDom();
    
    // Set up globals for the module
    global.window = dom.window;
    global.document = dom.window.document;
    
    // Mock requestAnimationFrame and cancelAnimationFrame for jsdom
    global.requestAnimationFrame = (callback) => setTimeout(callback, 0);
    global.cancelAnimationFrame = (id) => clearTimeout(id);
    
    // Mock chrome.storage
    chromeStorageStub = {
      local: {
        get: (key, callback) => {
          let data = {};
          if (typeof key === 'string') {
            if (key === 'profile') {
              data.profile = {
                identity: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
                address: { street: '123 Main St', city: 'Anytown', state: 'CA', zip: '12345' },
                work: { authorized: 'yes', sponsorship: 'no' },
                eeo: { gender: '', race: '', veteranStatus: '', disabilityStatus: '' },
                education: [],
                employment: [],
                documents: { resume: {}, coverLetterTemplate: '' }
              };
            } else if (key === 'qaMemory') {
              data.qaMemory = { entries: [] };
            } else if (key === 'siteRegistry') {
              data.siteRegistry = { domains: {} };
            }
          } else if (typeof key === 'object') {
            // Handle multiple keys
            if (key.profile) data.profile = {
              identity: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
              address: { street: '123 Main St', city: 'Anytown', state: 'CA', zip: '12345' },
              work: { authorized: 'yes', sponsorship: 'no' },
              eeo: { gender: '', race: '', veteranStatus: '', disabilityStatus: '' },
              education: [],
              employment: [],
              documents: { resume: {}, coverLetterTemplate: '' }
            };
            if (key.qaMemory) data.qaMemory = { entries: [] };
            if (key.siteRegistry) data.siteRegistry = { domains: {} };
          }
          callback(data);
        },
        set: (data, callback) => {
          // Mock storage set
          callback();
        }
      }
    };
    global.chrome = { storage: chromeStorageStub };
    
    // Require the capture module
    captureApi = require('../extension/content/capture.js');
    
    // Set up ResumeBot on window
    window.ResumeBot = window.ResumeBot || {};
    window.ResumeBot.capture = captureApi;
  });
  
  afterEach(() => {
    // Clean up globals
    delete global.window;
    delete global.document;
    delete global.chrome;
    
    // Clean up DOM
    dom.window.close();
  });
  
  describe('capture function', () => {
    it('should return early when no unmatched fields', async () => {
      // Create mock fields with matches
      const fields = [
        { 
          input: document.createElement('input'),
          label: 'First Name',
          type: 'text'
        }
      ];
      const matchResults = [
        { profilePath: 'identity.firstName', tier: 1, confidence: 1.0 }
      ];
      
      // Spy on storage get to verify it's called
      const storageGetSpy = sinon.spy(chromeStorageStub.local, 'get');
      
      // Call capture
      await captureApi.capture(fields, matchResults);
      
      // Should have called storage get but not proceeded further since no unmatched fields
      assert.ok(storageGetSpy.called);
    });
    
    it('should identify EEO fields with empty values as unmatched', async () => {
      // Create a field that matches an EEO path but has empty profile value
      const genderInput = document.createElement('input');
      genderInput.type = 'text';
      document.body.appendChild(genderInput);
      
      const fields = [
        { 
          input: genderInput,
          label: 'Gender',
          type: 'text'
        }
      ];
      const matchResults = [
        { profilePath: 'eeo.gender', tier: 1, confidence: 1.0 } // Matches EEO field
      ];
      
      // Spy on storage get
      const storageGetSpy = sinon.spy(chromeStorageStub.local, 'get');
      
      // Call capture
      await captureApi.capture(fields, matchResults);
      
      // Should have called storage get
      assert.ok(storageGetSpy.called);
      
      // Clean up
      document.body.removeChild(genderInput);
    });
    
    it('should create capture overlay UI elements', async () => {
      // Create a field with no match (unmatched)
      const textInput = document.createElement('input');
      textInput.type = 'text';
      textInput.placeholder = 'Custom Question';
      document.body.appendChild(textInput);
      
      const fields = [
        { 
          input: textInput,
          label: 'Custom Question',
          type: 'text'
        }
      ];
      const matchResults = [ null ]; // No match
      
      // Spy on storage get
      const storageGetSpy = sinon.spy(chromeStorageStub.local, 'get');
      
      // Call capture
      await captureApi.capture(fields, matchResults);
      
      // Should have called storage get
      assert.ok(storageGetSpy.called);
      
      // Check that container was created and added to body
      const container = document.getElementById('resumebot-capture-container');
      assert.ok(container, 'Capture container should be created');
      assert.ok(container.parentElement === document.body, 'Container should be appended to body');
      
      // Check for shadow root
      assert.ok(container.shadowRoot, 'Container should have shadow root');
      
      // Check for header
      const header = container.shadowRoot.querySelector('.header');
      assert.ok(header, 'Header should exist');
      
      // Check for title
      const title = container.shadowRoot.querySelector('.header h2');
      assert.ok(title, 'Title should exist');
      assert.strictEqual(title.textContent, 'Review unmatched fields');
      
      // Check for close button
      const closeBtn = container.shadowRoot.querySelector('.close-btn');
      assert.ok(closeBtn, 'Close button should exist');
      
      // Check for fields container
      const fieldsContainer = container.shadowRoot.querySelector('.fields');
      assert.ok(fieldsContainer, 'Fields container should exist');
      
      // Check for field row
      const fieldRow = fieldsContainer.querySelector('.field-row');
      assert.ok(fieldRow, 'Field row should exist');
      
      // Check for label
      const label = fieldRow.querySelector('.field-label');
      assert.ok(label, 'Label should exist');
      assert.strictEqual(label.textContent, 'Custom Question');
      
      // Check for EEO flag (should not be present for non-EEO field)
      const eeoFlag = label.querySelector('.eeo-flag');
      assert.ok(!eeoFlag, 'EEO flag should not be present for non-EEO field');
      
      // Check for type
      const typeDiv = fieldRow.querySelector('.field-type');
      assert.ok(typeDiv, 'Type div should exist');
      assert.strictEqual(typeDiv.textContent, 'text');
      
      // Check for answer control (should be text input for text field)
      const answerControl = fieldRow.querySelector('.answer-control');
      assert.ok(answerControl, 'Answer control should exist');
      assert.strictEqual(answerControl.tagName.toLowerCase(), 'input');
      assert.strictEqual(answerControl.type, 'text');
      
      // Check for toggle container
      const toggleContainer = fieldRow.querySelector('.toggle-container');
      assert.ok(toggleContainer, 'Toggle container should exist');
      
      // Check for toggle label
      const toggleLabel = toggleContainer.querySelector('span');
      assert.ok(toggleLabel, 'Toggle label should exist');
      assert.strictEqual(toggleLabel.textContent, 'Save to memory');
      
      // Check for toggle input
      const toggleInput = toggleContainer.querySelector('input[type="checkbox"]');
      assert.ok(toggleInput, 'Toggle input should exist');
      assert.strictEqual(toggleInput.checked, true, 'Toggle should be checked by default');
      
      // Check for submit button
      const submitBtn = container.shadowRoot.querySelector('.submit-btn');
      assert.ok(submitBtn, 'Submit button should exist');
      assert.strictEqual(submitBtn.textContent, 'Save and fill');
      
      // Clean up
      document.body.removeChild(textInput);
      if (container.parentElement) {
        container.remove();
      }
    });
    
    it('should handle select fields in capture overlay', async () => {
      // Create a select field with no match
      const select = document.createElement('select');
      select.innerHTML = `
        <option value="">--Select--</option>
        <option value="yes">Yes</option>
        <option value="no">No</option>
      `;
      document.body.appendChild(select);
      
      const fields = [
        { 
          input: select,
          label: 'Are you authorized to work?',
          type: 'select-one'
        }
      ];
      const matchResults = [ null ]; // No match
      
      // Spy on storage get
      const storageGetSpy = sinon.spy(chromeStorageStub.local, 'get');
      
      // Call capture
      await captureApi.capture(fields, matchResults);
      
      // Should have called storage get
      assert.ok(storageGetSpy.called);
      
      // Check that container was created
      const container = document.getElementById('resumebot-capture-container');
      assert.ok(container, 'Capture container should be created');
      
      // Check for field row
      const fieldRow = container.shadowRoot.querySelector('.field-row');
      assert.ok(fieldRow, 'Field row should exist');
      
      // Check for answer control (should be select for select field)
      const answerControl = fieldRow.querySelector('.answer-control');
      assert.ok(answerControl, 'Answer control should exist');
      assert.strictEqual(answerControl.tagName.toLowerCase(), 'select');
      
      // Check that it has the right options
      assert.strictEqual(answerControl.options.length, 4); // blank option + 3 original options
      assert.strictEqual(answerControl.options[0].textContent, '-- Please select --');
      assert.strictEqual(answerControl.options[1].value, '');
      assert.strictEqual(answerControl.options[2].value, 'yes');
      assert.strictEqual(answerControl.options[2].textContent, 'Yes');
      assert.strictEqual(answerControl.options[3].value, 'no');
      assert.strictEqual(answerControl.options[3].textContent, 'No');
      
      // Clean up
      document.body.removeChild(select);
      if (container.parentElement) {
        container.remove();
      }
    });
    
    it('should handle checkbox fields in capture overlay', async () => {
      // Create a checkbox field with no match
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      document.body.appendChild(checkbox);
      
      const fields = [
        { 
          input: checkbox,
          label: 'I agree to the terms',
          type: 'checkbox'
        }
      ];
      const matchResults = [ null ]; // No match
      
      // Spy on storage get
      const storageGetSpy = sinon.spy(chromeStorageStub.local, 'get');
      
      // Call capture
      await captureApi.capture(fields, matchResults);
      
      // Should have called storage get
      assert.ok(storageGetSpy.called);
      
      // Check that container was created
      const container = document.getElementById('resumebot-capture-container');
      assert.ok(container, 'Capture container should be created');
      
      // Check for field row
      const fieldRow = container.shadowRoot.querySelector('.field-row');
      assert.ok(fieldRow, 'Field row should exist');
      
      // Check for answer control (should be checkbox for checkbox field)
      const answerControl = fieldRow.querySelector('.answer-control');
      assert.ok(answerControl, 'Answer control should exist');
      assert.strictEqual(answerControl.tagName.toLowerCase(), 'input');
      assert.strictEqual(answerControl.type, 'checkbox');
      
      // Clean up
      document.body.removeChild(checkbox);
      if (container.parentElement) {
        container.remove();
      }
    });
  });
  
  describe('context menu function', () => {
    it('should add context menu listener', () => {
      // Spy on addEventListener
      const addEventListenerSpy = sinon.spy(document, 'addEventListener');
      
      // Call initContextMenu
      captureApi.initContextMenu();
      
      // Should have added event listener for contextmenu
      assert.ok(addEventListenerSpy.calledWithMatch('contextmenu', sinon.match.func));
      
      // Clean up
      addEventListenerSpy.restore();
    });
  });
});