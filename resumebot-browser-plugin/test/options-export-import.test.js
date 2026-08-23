// test/options-export-import.test.js
const { describe, it, beforeEach, afterEach } = require('node:test');
const { JSDOM } = require('jsdom');
const path = require('path');
const fs = require('fs');

// Load the chrome mock
const chromeMock = require('../test/helpers/chrome-mock.js');

const assert = require('node:assert/strict');
describe('Options Export/Import', () => {
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

    // Mock URL.createObjectURL and URL.revokeObjectURL for blob downloads
    const url = {
      createObjectURL: (blob) => {
        // Return a mock blob URL
        return `mock-blob-url-${Math.random()}`;
      },
      revokeObjectURL: (url) => {
        // Do nothing for mock
      }
    };
    Object.defineProperty(window, 'URL', { value: url, writable: true });

    // Mock alert and confirm
    window.alert = (msg) => {
      // Store the last alert for testing if needed
      window.lastAlert = msg;
      return true;
    };
    window.confirm = (msg) => {
      // For import preview, return true to proceed with import
      window.lastConfirm = msg;
      return true;
    };

    // Load options.js source for later use
    const optionsJsPath = path.join(__dirname, '../extension/options/options.js');
    optionsJsSource = fs.readFileSync(optionsJsPath, 'utf8');
  });

  afterEach(() => {
    // Clean up
    delete global.chrome;
    dom.window.close();
  });

  it('should export profile data as JSON blob', async () => {
    // Set up chrome mock
    global.chrome = chromeMock.createChromeMock();
    window.chrome = global.chrome;

    // Seed some test data
    const profileData = {
      identity: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
      address: { street: '123 Main St', city: 'Anytown', state: 'CA', zip: '12345', country: 'US' },
      work: { authorized: 'yes', sponsorship: 'no', remotePreference: 'remote', salaryExpectation: '100000', startDate: '2026-01-01', noticePeriod: '2 weeks' },
      eeo: { gender: 'Male', race: 'White', veteranStatus: 'No', disabilityStatus: 'No' },
      education: [{ school: 'University', degree: 'BS', field: 'Computer Science', startYear: '2015', endYear: '2019' }],
      employment: [{ company: 'Tech Corp', title: 'Engineer', location: 'Remote', startDate: '2020-01-01', endDate: '', current: true, description: 'Software development' }],
      documents: { resume: { filename: 'resume.pdf', mime: 'application/pdf', base64: 'JVBERi0xLjQKJcfs...' }, coverLetterTemplate: 'Dear {company},' }
    };
    
    const siteRegistryData = {
      atsOverrides: [
        { atsType: 'workday', domainPattern: 'company.myworkdayjobs.com' },
        { atsType: 'greenhouse', domainPattern: 'boards.greenhouse.io/techcorp' }
      ]
    };
    
    const qaMemoryData = {
      entries: [
        {
          key: 'hash1',
          question: 'What is your name?',
          answer: 'My name is John Doe.',
          type: 'text',
          timesUsed: 5,
          firstSeen: { domain: 'example.com', date: '2026-07-20' },
          reviewBeforeFill: true
        },
        {
          key: 'hash2',
          question: 'What is your address?',
          answer: '123 Main St, Anytown, USA',
          type: 'textarea',
          timesUsed: 2,
          firstSeen: { domain: 'test.com', date: '2026-07-21' },
          reviewBeforeFill: false
        }
      ]
    };

    // Mock responses BEFORE eval
    global.chrome.setMessageResponse('getProfile', { success: true, data: profileData });
    global.chrome.setMessageResponse('getSiteRegistry', { success: true, data: siteRegistryData });
    global.chrome.setMessageResponse('qaList', { success: true, data: qaMemoryData });

    // Load options.js directly since jsdom doesn't fetch external <script src>.
    // Call the exported init() directly rather than relying on jsdom's natural
    // DOMContentLoaded auto-fire, which is unreliable under node:test's execution
    // context (confirmed empirically: it never fires here, though it does in a
    // plain script) -- see AGENTS.md.
    window.module = module;
    window.eval(optionsJsSource);
    await module.exports.init();

    // Trigger export
    const exportButton = document.getElementById('export-button');
    exportButton.click();

    // Wait for export operation
    await new Promise(setImmediate);

    // Check that a download link was created and clicked
    const links = document.getElementsByTagName('a');
    let downloadLink = null;
    for (let i = 0; i < links.length; i++) {
      if (links[i].download && links[i].download.includes('resumebot-export')) {
        downloadLink = links[i];
        break;
      }
    }
    assert.ok(downloadLink, 'Export should create a download link');
    
    // Verify the link has the correct href (blob URL)
    assert.ok(downloadLink.href.startsWith('mock-blob-url-'), 'Download link should be a mock blob URL');
    
    // Verify saved message was shown
    const savedMessage = document.getElementById('saved-message');
    assert.strictEqual(savedMessage.style.display, 'block', 'Saved message should be visible during export');
  });

  it('should import profile data and merge correctly', async () => {
    // Set up chrome mock
    global.chrome = chromeMock.createChromeMock();
    window.chrome = global.chrome;

    // Seed existing data in storage
    const existingProfile = {
      identity: { firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' },
      address: { street: '456 Oak Ave', city: 'Othertown', state: 'NY', zip: '67890', country: 'US' },
      work: { authorized: 'no', sponsorship: 'yes', remotePreference: 'on-site', salaryExpectation: '80000', startDate: '2025-06-01', noticePeriod: '4 weeks' },
      eeo: { gender: 'Female', race: 'Black', veteranStatus: 'Yes', disabilityStatus: 'Yes' },
      education: [{ school: 'College', degree: 'BA', field: 'Business', startYear: '2016', endYear: '2020' }],
      employment: [{ company: 'Biz Inc', title: 'Manager', location: 'Office', startDate: '2021-03-15', endDate: '2023-02-28', current: false, description: 'Managed team' }],
      documents: { resume: { filename: 'old-resume.docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', base64: 'UEsDBBQABgAIAAAAIQC...' }, coverLetterTemplate: 'To whom it may concern,' }
    };
    
    const existingSiteRegistry = {
      atsOverrides: [
        { atsType: 'lever', domainPattern: 'jobs.lever.co/bizinc' }
      ]
    };
    
    const existingQAMemory = {
      entries: [
        {
          key: 'existing-hash',
          question: 'Existing question?',
          answer: 'Existing answer.',
          type: 'text',
          timesUsed: 3,
          firstSeen: { domain: 'oldsite.com', date: '2026-06-01' },
          reviewBeforeFill: false
        }
      ]
    };

    // Mock responses for getting existing data
    global.chrome.setMessageResponse('getProfile', { success: true, data: existingProfile });
    global.chrome.setMessageResponse('getSiteRegistry', { success: true, data: existingSiteRegistry });
    global.chrome.setMessageResponse('qaList', { success: true, data: existingQAMemory });

    // Load options.js and initialize
    window.module = module;
    window.eval(optionsJsSource);
    await module.exports.init();

    // Prepare import data
    const importProfile = {
      identity: { firstName: 'John', lastName: 'Doe', email: 'john@example.com', phone: '555-1234' },
      address: { street: '789 Pine Rd', city: 'Newtown', state: 'TX', zip: '11111', country: 'US' },
      work: { authorized: 'yes', sponsorship: 'no', remotePreference: 'hybrid', salaryExpectation: '120000', startDate: '2026-03-01', noticePeriod: '1 week' },
      eeo: { gender: 'Male', race: 'Asian', veteranStatus: 'No', disabilityStatus: 'No' },
      education: [
        { school: 'University A', degree: 'BS', field: 'Math', startYear: '2014', endYear: '2018' },
        { school: 'University B', degree: 'MS', field: 'Physics', startYear: '2018', endYear: '2020' }
      ],
      employment: [
        { company: 'StartupXYZ', title: 'Developer', location: 'Remote', startDate: '2020-06-01', endDate: '2022-05-31', current: false, description: 'Web development' },
        { company: 'CurrentCorp', title: 'Senior Developer', location: 'Hybrid', startDate: '2022-06-01', endDate: '', current: true, description: 'Lead developer' }
      ],
      documents: { resume: { filename: 'new-resume.pdf', mime: 'application/pdf', base64: 'JVBERi0xLjQKJcfs...' }, coverLetterTemplate: 'Hello {company},' }
    };
    
    const importSiteRegistry = {
      atsOverrides: [
        { atsType: 'workday', domainPattern: 'startup.myworkdayjobs.com' },
        { atsType: 'icims', domainPattern: 'careers.currentcorp.icims.com' }
      ]
    };
    
    const importQAMemory = {
      entries: [
        {
          key: 'import-hash1',
          question: 'Imported question 1?',
          answer: 'Imported answer 1.',
          type: 'textarea',
          timesUsed: 7,
          firstSeen: { domain: 'newsite.com', date: '2026-07-22' },
          reviewBeforeFill: true
        },
        {
          key: 'existing-hash', // Same key as existing - should be merged (newer wins)
          question: 'Updated existing question?',
          answer: 'Updated existing answer.',
          type: 'text',
          timesUsed: 10, // Higher timesUsed
          firstSeen: { domain: 'updatedsite.com', date: '2026-07-23' }, // Newer date
          reviewBeforeFill: true
        }
      ]
    };

    const importData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      profile: importProfile,
      siteRegistry: importSiteRegistry,
      qaMemory: importQAMemory
    };

    // Mock responses for setting data (what import will send)
    global.chrome.setMessageResponse('setProfile', { success: true });
    global.chrome.setMessageResponse('setSiteRegistry', { success: true });
    global.chrome.setMessageResponse('qaUpsert', { success: true }); // For each QA entry

    // Trigger import by simulating file selection
    const fileInput = document.getElementById('import-file-input');
    // Create a mock File object
    const file = new File([JSON.stringify(importData)], 'test-profile.json', { type: 'application/json' });
    // Set the file input's files property
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      configurable: true
    });
    
    // Trigger the change event
    fileInput.dispatchEvent(new window.Event('change'));

    // Wait for import operations
    await new Promise(setImmediate);
    await new Promise(setImmediate); // Give time for multiple operations

    // Verify that setProfile was called with merged data
    const messages = global.chrome.getMessages();
    const setProfileMsg = messages.find(msg => msg.action === 'setProfile');
    assert.ok(setProfileMsg, 'setProfile should be called');
    
    // Check that imported profile data was used (not existing)
    assert.strictEqual(setProfileMsg.data.identity.firstName, 'John');
    assert.strictEqual(setProfileMsg.data.identity.lastName, 'Doe');
    assert.strictEqual(setProfileMsg.data.identity.email, 'john@example.com');
    assert.strictEqual(setProfileMsg.data.identity.phone, '555-1234'); // Imported field
    
    // Verify that setSiteRegistry was called
    const setSiteRegistryMsg = messages.find(msg => msg.action === 'setSiteRegistry');
    assert.ok(setSiteRegistryMsg, 'setSiteRegistry should be called');
    
    // All imported QA entries go up in one qaUpsertMany (one read-modify-write)
    const many = messages.filter(msg => msg.action === 'qaUpsertMany');
    assert.strictEqual(many.length, 1, 'Should send one qaUpsertMany');
    const entries = many[0].entries;
    assert.strictEqual(entries.length, 2, 'Should upsert 2 QA entries');
    assert.ok(entries[0].question === 'Imported question 1?' || entries[0].question === 'Updated existing question?');

    // Existing entry carries the imported (updated) values
    const existing = entries.find(e => e.key === 'existing-hash');
    assert.ok(existing, 'Should upsert existing hash with updated values');
    assert.strictEqual(existing.question, 'Updated existing question?');
    assert.strictEqual(existing.answer, 'Updated existing answer.');
    assert.strictEqual(existing.timesUsed, 10);
    assert.strictEqual(existing.firstSeen.date, '2026-07-23');
    assert.strictEqual(existing.reviewBeforeFill, true);
    
    // Verify saved message was shown
    const savedMessage = document.getElementById('saved-message');
    assert.strictEqual(savedMessage.style.display, 'block', 'Saved message should be visible during import');
  });

  it('should reject malformed import file', async () => {
    // Set up chrome mock
    global.chrome = chromeMock.createChromeMock();
    window.chrome = global.chrome;

    // Load options.js and initialize
    window.module = module;
    window.eval(optionsJsSource);
    await module.exports.init();

    // Trigger import with invalid JSON
    const fileInput = document.getElementById('import-file-input');
    const file = new File(['{ invalid json'], 'bad.json', { type: 'application/json' });
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      configurable: true
    });
    
    // Trigger the change event
    fileInput.dispatchEvent(new window.Event('change'));

    // Wait for import operations
    await new Promise(setImmediate);

    // Should show alert about invalid JSON
    // Note: We can't easily test alert() in jsdom, but we can verify no data was sent
    const messages = global.chrome.getMessages();
    const setProfileMsg = messages.find(msg => msg.action === 'setProfile');
    assert.strictEqual(setProfileMsg, undefined, 'setProfile should NOT be called for invalid JSON');
    
    // File input should be reset
    assert.strictEqual(fileInput.value, '', 'File input should be reset after failed import');
  });

  it('should reject import file missing required sections', async () => {
    // Set up chrome mock
    global.chrome = chromeMock.createChromeMock();
    window.chrome = global.chrome;

    // Load options.js and initialize
    window.module = module;
    window.eval(optionsJsSource);
    await module.exports.init();

    // Trigger import with missing sections
    const incompleteData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      profile: { identity: { firstName: 'Test' } }
      // Missing siteRegistry and qaMemory
    };
    
    const fileInput = document.getElementById('import-file-input');
    const file = new File([JSON.stringify(incompleteData)], 'incomplete.json', { type: 'application/json' });
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      configurable: true
    });
    
    // Trigger the change event
    fileInput.dispatchEvent(new window.Event('change'));

    // Wait for import operations
    await new Promise(setImmediate);

    // Should show alert about missing sections
    const messages = global.chrome.getMessages();
    const setProfileMsg = messages.find(msg => msg.action === 'setProfile');
    assert.strictEqual(setProfileMsg, undefined, 'setProfile should NOT be called for incomplete data');
    
    // File input should be reset
    assert.strictEqual(fileInput.value, '', 'File input should be reset after failed import');
  });
});