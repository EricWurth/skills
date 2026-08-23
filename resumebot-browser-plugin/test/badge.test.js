// test/badge.test.js
const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { createChromeMock } = require('../test/helpers/chrome-mock.js');

describe('badge update', () => {
  let chromeMock;
  let setBadgeTextCalledWith;
  let setBadgeBackgroundColorCalledWith;

  beforeEach(() => {
    // Reset module cache for service worker
    delete require.cache[require.resolve('../extension/service-worker.js')];
    
    chromeMock = createChromeMock();
    // Stub the action methods to capture calls
    chromeMock.action.setBadgeText = (details) => {
      setBadgeTextCalledWith = details.text;
    };
    chromeMock.action.setBadgeBackgroundColor = (details) => {
      setBadgeBackgroundColorCalledWith = details.color;
    };
    // Set global chrome for the service worker
    global.chrome = chromeMock;
    // Require the service worker (sets up listeners)
    require('../extension/service-worker.js');
  });

  afterEach(() => {
    // Clean up globals
    delete global.chrome;
  });

  it('on scanResult, sets badge text to field count', async () => {
    // Reset call trackers
    setBadgeTextCalledWith = undefined;
    setBadgeBackgroundColorCalledWith = undefined;

    // Simulate a scanResult message with 5 fields
    const fields = Array.from({length: 5}, (_, i) => ({id: i}));
    await chromeMock._dispatchMessage({
      action: 'scanResult',
      fields
    });

    assert.strictEqual(setBadgeTextCalledWith, '5');
    assert.deepStrictEqual(setBadgeBackgroundColorCalledWith, [0, 255, 0, 128]);
  });

  it('second scanResult updates badge again', async () => {
    // First scan
    await chromeMock._dispatchMessage({
      action: 'scanResult',
      fields: [{}, {}, {}] // 3 fields
    });
    assert.strictEqual(setBadgeTextCalledWith, '3');

    // Second scan
    setBadgeTextCalledWith = undefined;
    await chromeMock._dispatchMessage({
      action: 'scanResult',
      fields: [{}, {}, {}, {}] // 4 fields
    });
    assert.strictEqual(setBadgeTextCalledWith, '4');
  });
});