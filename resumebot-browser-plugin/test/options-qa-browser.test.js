// test/options-qa-browser.test.js
const { describe, it, beforeEach, afterEach } = require('node:test');
const { JSDOM } = require('jsdom');
const path = require('path');
const fs = require('fs');

// Load the chrome mock
const chromeMock = require('../test/helpers/chrome-mock.js');

const assert = require('node:assert/strict');
describe('Options QA Memory Browser', () => {
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
  });

  afterEach(() => {
    // Clean up
    delete global.chrome;
    dom.window.close();
  });

  it('should render QA memory entries in the table', async () => {
    // Set up chrome mock
    global.chrome = chromeMock.createChromeMock();
    window.chrome = global.chrome;

    // Seed 2-3 qa-memory entries via the chrome mock's storage
    const qaMemoryEntries = [
      {
        key: 'hash1',
        question: 'What is your name?',
        answer: 'My name is John Doe.',
        type: 'text',
        timesUsed: 5,
        firstSeen: {
          domain: 'example.com',
          date: '2026-07-20'
        },
        reviewBeforeFill: true
      },
      {
        key: 'hash2',
        question: 'What is your address?',
        answer: '123 Main St, Anytown, USA',
        type: 'textarea',
        timesUsed: 2,
        firstSeen: {
          domain: 'test.com',
          date: '2026-07-21'
        },
        reviewBeforeFill: false
      }
    ];

    // Mock the qaList response BEFORE eval
    global.chrome.setMessageResponse('qaList', {
      success: true,
      data: {
        entries: qaMemoryEntries
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

    // Check that rows appear with correct text
    const tableBody = document.getElementById('qa-table-body');
    const rows = tableBody.querySelectorAll('tr');

    // Should have 2 rows (one per entry)
    assert.strictEqual(rows.length, 2);

    // Check first row
    const firstRowCells = rows[0].querySelectorAll('td');
    assert.strictEqual(firstRowCells[0].textContent, 'What is your name?'); // Question
    assert.strictEqual(firstRowCells[1].textContent, 'My name is John Doe.'); // Answer Preview
    assert.strictEqual(firstRowCells[2].textContent, 'text'); // Type
    assert.strictEqual(firstRowCells[3].textContent, '5'); // Times Used
    assert.strictEqual(firstRowCells[4].textContent, 'example.com 2026-07-20'); // First Seen
    assert.strictEqual(firstRowCells[5].querySelector('input[type="checkbox"]').checked, true); // Review Before Fill

    // Check second row
    const secondRowCells = rows[1].querySelectorAll('td');
    assert.strictEqual(secondRowCells[0].textContent, 'What is your address?'); // Question
    assert.strictEqual(secondRowCells[1].textContent, '123 Main St, Anytown, USA'); // Answer Preview
    assert.strictEqual(secondRowCells[2].textContent, 'textarea'); // Type
    assert.strictEqual(secondRowCells[3].textContent, '2'); // Times Used
    assert.strictEqual(secondRowCells[4].textContent, 'test.com 2026-07-21'); // First Seen
    assert.strictEqual(secondRowCells[5].querySelector('input[type="checkbox"]').checked, false); // Review Before Fill
  });

  it('should allow editing a QA memory entry', async () => {
    // Set up chrome mock
    global.chrome = chromeMock.createChromeMock();
    window.chrome = global.chrome;

    // Seed a qa-memory entry
    const qaMemoryEntries = [
      {
        key: 'hash1',
        question: 'What is your name?',
        answer: 'My name is John Doe.',
        type: 'text',
        timesUsed: 5,
        firstSeen: {
          domain: 'example.com',
          date: '2026-07-20'
        },
        reviewBeforeFill: true
      }
    ];

    // Mock the qaList response BEFORE eval
    global.chrome.setMessageResponse('qaList', {
      success: true,
      data: {
        entries: qaMemoryEntries
      }
    });

    // Mock the qaUpsert response
    global.chrome.setMessageResponse('qaUpsert', {
      success: true
    });

    // Load options.js directly since jsdom doesn't fetch external <script src>.
    // Call the exported init() directly rather than relying on jsdom's natural
    // DOMContentLoaded auto-fire, which is unreliable under node:test's execution
    // context (confirmed empirically: it never fires here, though it does in a
    // plain script) -- see AGENTS.md.
    window.module = module;
    window.eval(optionsJsSource);
    await module.exports.init();

    // Click the first row to enter edit mode
    const firstRow = document.getElementById('qa-table-body').querySelector('tr');
    firstRow.click();

    // Wait for edit mode to activate
    await new Promise(setImmediate);

    // Check that the row has the editing class
    assert.strictEqual(firstRow.classList.contains('editing'), true);

    // Find the input fields in the row
    const inputs = firstRow.querySelectorAll('input[type="text"], select');
    const checkbox = firstRow.querySelector('input[type="checkbox"]');

    // Modify the values
    inputs[0].value = 'What is your full name?';
    inputs[1].value = 'John';
    inputs[2].value = 'textarea';
    checkbox.checked = false;

    // Click the save button
    const saveBtn = firstRow.querySelector('.save-btn');
    saveBtn.click();

    // Wait for the save operation
    await new Promise(setImmediate);

    // Check that qaUpsert was called with correct data
    const messages = global.chrome.getMessages();
    const qaUpsertMsg = messages.find(msg => msg.action === 'qaUpsert');
    assert.ok(qaUpsertMsg);
    assert.strictEqual(qaUpsertMsg.entry.question, 'What is your full name?');
    assert.strictEqual(qaUpsertMsg.entry.answer, 'John');
    assert.strictEqual(qaUpsertMsg.entry.type, 'textarea');
    assert.strictEqual(qaUpsertMsg.entry.timesUsed, 5);
    assert.strictEqual(qaUpsertMsg.entry.firstSeen.domain, 'example.com');
    assert.strictEqual(qaUpsertMsg.entry.firstSeen.date, '2026-07-20');
    assert.strictEqual(qaUpsertMsg.entry.reviewBeforeFill, false);
  });

  it('should allow deleting a QA memory entry', async () => {
    // Set up chrome mock
    global.chrome = chromeMock.createChromeMock();
    window.chrome = global.chrome;

    // Seed a qa-memory entry
    const qaMemoryEntries = [
      {
        key: 'hash1',
        question: 'What is your name?',
        answer: 'My name is John Doe.',
        type: 'text',
        timesUsed: 5,
        firstSeen: {
          domain: 'example.com',
          date: '2026-07-20'
        },
        reviewBeforeFill: true
      }
    ];

    // Mock the qaList response BEFORE eval
    global.chrome.setMessageResponse('qaList', {
      success: true,
      data: {
        entries: qaMemoryEntries
      }
    });

    // Mock the qaDelete response
    global.chrome.setMessageResponse('qaDelete', {
      success: true
    });

    // Load options.js directly since jsdom doesn't fetch external <script src>.
    // Call the exported init() directly rather than relying on jsdom's natural
    // DOMContentLoaded auto-fire, which is unreliable under node:test's execution
    // context (confirmed empirically: it never fires here, though it does in a
    // plain script) -- see AGENTS.md.
    window.module = module;
    window.eval(optionsJsSource);
    await module.exports.init();

    // Click the delete button
    const deleteBtn = document.getElementById('qa-table-body').querySelector('.delete-btn');
    deleteBtn.click();

    // Wait for the delete operation
    await new Promise(setImmediate);

    // Check that qaDelete was called with correct key
    const messages = global.chrome.getMessages();
    const qaDeleteMsg = messages.find(msg => msg.action === 'qaDelete');
    assert.ok(qaDeleteMsg);
    assert.strictEqual(qaDeleteMsg.key, 'hash1');
  });

  it('should filter rows by question text', async () => {
    // Set up chrome mock
    global.chrome = chromeMock.createChromeMock();
    window.chrome = global.chrome;

    // Seed 2 qa-memory entries
    const qaMemoryEntries = [
      {
        key: 'hash1',
        question: 'What is your name?',
        answer: 'My name is John Doe.',
        type: 'text',
        timesUsed: 5,
        firstSeen: {
          domain: 'example.com',
          date: '2026-07-20'
        },
        reviewBeforeFill: true
      },
      {
        key: 'hash2',
        question: 'What is your quest?',
        answer: 'To seek the Holy Grail.',
        type: 'text',
        timesUsed: 3,
        firstSeen: {
          domain: 'test.com',
          date: '2026-07-21'
        },
        reviewBeforeFill: false
      }
    ];

    // Mock the qaList response BEFORE eval
    global.chrome.setMessageResponse('qaList', {
      success: true,
      data: {
        entries: qaMemoryEntries
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

    // Check initial state - should have 2 rows
    let tableBody = document.getElementById('qa-table-body');
    let rows = tableBody.querySelectorAll('tr');
    assert.strictEqual(rows.length, 2);

    // Type in search input
    const searchInput = document.getElementById('qa-search-input');
    searchInput.value = 'name';

    // Trigger input event
    searchInput.dispatchEvent(new window.Event('input'));

    // Wait for filtering
    await new Promise(setImmediate);

    // Check that only matching rows remain
    tableBody = document.getElementById('qa-table-body');
    rows = [...tableBody.querySelectorAll('tr')].filter(r => r.style.display !== 'none');
    assert.strictEqual(rows.length, 1);
    assert.strictEqual(rows[0].querySelector('td').textContent, 'What is your name?');

    // Clear search
    searchInput.value = '';
    searchInput.dispatchEvent(new window.Event('input'));

    // Wait for filtering
    await new Promise(setImmediate);

    // Check that all rows reappear
    tableBody = document.getElementById('qa-table-body');
    rows = [...tableBody.querySelectorAll('tr')].filter(r => r.style.display !== 'none');
    assert.strictEqual(rows.length, 2);
  });
});