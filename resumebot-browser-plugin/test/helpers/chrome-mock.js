// Shared chrome.* mock for all tests (see AGENTS.md — never write a second one).
// storage.local is backed by a Map; runtime.onMessage captures listeners so
// tests can drive the service worker's message handler directly.

// Test-specific message response mocking
const messageResponses = new Map();

/**
 * Set a mock response for a specific chrome.runtime.sendMessage action
 * @param {string} action - The action to mock (e.g., 'getStatus', 'scan')
 * @param {*} response - The response object to return
 */
function setMessageResponse(action, response) {
  console.log('[chrome-mock] Setting mock for action:', action, 'response:', response);
  messageResponses.set(action, { success: true, ...response });
}

function createChromeMock() {
  const store = new Map();
  const messageListeners = [];
  // For test inspection of sent messages
  const sentMessages = [];

  const chrome = {
    storage: {
      local: {
        async get(keys) {
          const result = {};
          const wanted =
            keys == null ? [...store.keys()] :
            Array.isArray(keys) ? keys :
            typeof keys === "object" ? Object.keys(keys) : [keys];
          for (const key of wanted) {
            if (store.has(key)) result[key] = store.get(key);
            else if (typeof keys === "object" && !Array.isArray(keys) && keys != null) {
              result[key] = keys[key]; // default value form
            }
          }
          return result;
        },
        async set(items) {
          for (const [k, v] of Object.entries(items)) store.set(k, v);
        },
        async remove(keys) {
          for (const k of Array.isArray(keys) ? keys : [keys]) store.delete(k);
        },
        async clear() {
          store.clear();
        }
      }
    },
    runtime: {
      lastError: null,
      onMessage: {
        addListener(fn) { messageListeners.push(fn); }
      },
      onMessageExternal: {
        addListener() {}
      },
      onInstalled: {
        addListener() {}
      },
      sendMessage(message, callback) {
        // Record the message for test inspection
        sentMessages.push(Object.assign({}, message));
        // Check if we have a mock response for this action
        const mock = messageResponses.get(message.action);
        console.log('[chrome-mock] sendMessage: action=', message.action, 'mock=', mock);
        if (mock) {
          if (callback) {
            console.log('[chrome-mock] Calling callback with mock:', mock);
            callback(mock);
          }
        } else {
          // Fall back to the registered listeners. Mirror Chrome: a listener
          // that returns true answers later via sendResponse; the first
          // response wins; no listener -> undefined.
          let done = false;
          const respond = (response) => {
            if (done) return;
            done = true;
            if (callback) callback(response);
          };
          let async = false;
          for (const listener of messageListeners) {
            const r = listener(message, {}, respond);
            if (r === true) async = true;
            if (done) break;
          }
          if (!done && !async) respond(undefined);
        }
      }
    },
    tabs: {
      query(_info, cb) { cb([]); },
      sendMessage(_tabId, _msg, cb) { if (cb) cb(undefined); }
    },
    contextMenus: {
      create() {},
      onClicked: { addListener() {} }
    },
    commands: {
      onCommand: { addListener() {} }
    },
    action: {
      setBadgeText() {},
      setBadgeBackgroundColor() {}
    },
    // Test helpers (not part of the chrome API)
    _store: store,
    _messageListeners: messageListeners,
    _dispatchMessage(message, sender) {
      return new Promise((resolve) => {
        let resolved = false;
        const respond = (response) => { if (!resolved) { resolved = true; resolve(response); } };
        let async = false;
        for (const listener of messageListeners) {
          const r = listener(message, sender || {}, respond);
          if (r === true) async = true;
          if (resolved) break;
        }
        if (!resolved && !async) resolve(undefined);
      });
    },
    // Test-specific helper methods
    setMessageResponse(action, response) {
      console.log('[chrome-mock] Instance setMessageResponse: action=', action, 'response=', response);
      messageResponses.set(action, { success: true, ...response });
    },
    getMessages() {
      return sentMessages;
    },
    clearMessages() {
      sentMessages.length = 0;
    }
  };

  return chrome;
}

module.exports = { createChromeMock };