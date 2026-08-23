// service-worker.js
// Message router, storage for the three stores (profile, qa-memory,
// site-registry) in chrome.storage.local, tab/frame fan-out for scan + fill,
// toolbar badge, keyboard command, context menu, and the 1Password native
// messaging bridge. See MESSAGE-CONTRACT.md for every action's shape.

// Shared vocabulary (ATS table, EEO rules, account-creation heuristic) is
// the same file the content scripts load first.
const common = (typeof importScripts === "function")
  ? (importScripts("content/common.js"), self.ResumeBot.common)
  : require("./content/common.js");

const STORES = {
  PROFILE: 'profile',
  QA_MEMORY: 'qaMemory',
  SITE_REGISTRY: 'siteRegistry'
};

const NATIVE_HOST = 'com.resumebot.op';
const CONTENT_SCRIPTS = [
  'content/common.js',
  'content/normalize.js',
  'content/scanner.js',
  'content/matcher.js',
  'content/filler.js',
  'content/capture.js',
  'content/ats/detect.js',
  'content/ats/generic.js',
  'content/ats/workday.js',
  'content/ats/greenhouse.js',
  'content/ats/lever.js',
  'content/ats/icims.js',
  'content/main.js'
];

/**
 * Get the default profile structure.
 * @returns {any} - Default profile object
 */
function getDefaultProfile() {
  return {
    identity: { firstName: '', lastName: '', email: '', phone: '', linkedin: '', website: '' },
    address: { street: '', city: '', state: '', zip: '', country: 'US' },
    work: { authorized: '', sponsorship: '', remotePreference: '', salaryExpectation: '', startDate: '', noticePeriod: '' },
    eeo: { gender: '', race: '', veteranStatus: '', disabilityStatus: '' },
    education: [{ school: '', degree: '', field: '', startYear: '', endYear: '' }],
    employment: [{ company: '', title: '', location: '', startDate: '', endDate: '', current: false, description: '' }],
    documents: { resume: { filename: '', mime: '', base64: '' }, coverLetterTemplate: '' }
  };
}

function getDefaultSiteRegistry() {
  return { domains: {}, atsOverrides: [], fieldOverrides: {} };
}

/**
 * Initialize default stores if they don't exist.
 */
async function initializeStores() {
  const defaults = {};
  defaults[STORES.PROFILE] = getDefaultProfile();
  defaults[STORES.QA_MEMORY] = { entries: [] };
  defaults[STORES.SITE_REGISTRY] = getDefaultSiteRegistry();

  const items = await chrome.storage.local.get(Object.keys(defaults));
  const toSet = {};
  for (const key in defaults) {
    if (!items[key]) {
      toSet[key] = defaults[key];
    }
  }
  if (Object.keys(toSet).length > 0) {
    await chrome.storage.local.set(toSet);
  }
}

/**
 * Merge a stored profile with default values, preserving unknown keys.
 * @param {any} storedProfile - The profile retrieved from storage
 * @returns {any} - Profile with missing keys filled with defaults
 */
function mergeProfileWithDefaults(storedProfile) {
  if (!storedProfile) {
    return getDefaultProfile();
  }
  const merged = getDefaultProfile();
  for (const key in storedProfile) {
    if (key in merged && typeof storedProfile[key] === 'object' && storedProfile[key] !== null && !Array.isArray(storedProfile[key])) {
      merged[key] = { ...merged[key], ...storedProfile[key] };
    } else {
      merged[key] = storedProfile[key];
    }
  }
  return merged;
}

/**
 * Get a store from chrome.storage.local.
 * For the profile store, applies schema-defaulting merge.
 * @param {string} storeName - One of STORES
 * @returns {Promise<any>}
 */
async function getStore(storeName) {
  const items = await chrome.storage.local.get(storeName);
  let data = items[storeName];

  if (storeName === STORES.PROFILE) {
    data = mergeProfileWithDefaults(data);
  } else if (storeName === STORES.SITE_REGISTRY) {
    data = { ...getDefaultSiteRegistry(), ...(data || {}) };
  } else if (storeName === STORES.QA_MEMORY) {
    data = data && Array.isArray(data.entries) ? data : { entries: [] };
  }

  return data;
}

/**
 * Set a store in chrome.storage.local.
 * @param {string} storeName - One of STORES
 * @param {any} data
 * @returns {Promise<void>}
 */
async function setStore(storeName, data) {
  const obj = {};
  obj[storeName] = data;
  await chrome.storage.local.set(obj);
}

// --- qa-memory -------------------------------------------------------------

async function qaGet(key) {
  const qaMemory = await getStore(STORES.QA_MEMORY);
  return qaMemory.entries.find(entry => entry.key === key) || null;
}

async function qaUpsert(entry) {
  const qaMemory = await getStore(STORES.QA_MEMORY);
  const existingIndex = qaMemory.entries.findIndex(e => e.key === entry.key);
  if (existingIndex >= 0) {
    qaMemory.entries[existingIndex] = entry;
  } else {
    qaMemory.entries.push(entry);
  }
  await setStore(STORES.QA_MEMORY, qaMemory);
}

// Capture panel submits several answers at once; one read-modify-write.
async function qaUpsertMany(entries) {
  if (!Array.isArray(entries) || entries.length === 0) return;
  const qaMemory = await getStore(STORES.QA_MEMORY);
  for (const entry of entries) {
    if (!entry || !entry.key) continue;
    const i = qaMemory.entries.findIndex(e => e.key === entry.key);
    if (i >= 0) qaMemory.entries[i] = entry; else qaMemory.entries.push(entry);
  }
  await setStore(STORES.QA_MEMORY, qaMemory);
}

async function qaList() {
  const qaMemory = await getStore(STORES.QA_MEMORY);
  return qaMemory.entries;
}

async function qaDelete(key) {
  const qaMemory = await getStore(STORES.QA_MEMORY);
  qaMemory.entries = qaMemory.entries.filter(entry => entry.key !== key);
  await setStore(STORES.QA_MEMORY, qaMemory);
}

/**
 * Increment timesUsed for a QA memory entry and optionally update reviewBeforeFill
 * @param {string} key - The normalized question hash
 * @param {boolean} wasReviewed - Whether the entry was reviewed before filling
 * @returns {Promise<void>}
 */
async function incrementTimesUsed(key, wasReviewed = false) {
  const qaMemory = await getStore(STORES.QA_MEMORY);
  const entryIndex = qaMemory.entries.findIndex(entry => entry.key === key);
  if (entryIndex < 0) return;
  const entry = qaMemory.entries[entryIndex];
  entry.timesUsed = (entry.timesUsed || 0) + 1;
  // A reviewed long answer has now been seen once; silent fill from here on.
  if (wasReviewed) {
    entry.reviewBeforeFill = false;
  }
  await setStore(STORES.QA_MEMORY, qaMemory);
}

// Remember which option text satisfied a select on some ATS so the same
// answer resolves on the next one without a second look.
async function qaAddAlias(key, alias) {
  if (!alias) return;
  const qaMemory = await getStore(STORES.QA_MEMORY);
  const entry = qaMemory.entries.find(e => e.key === key);
  if (!entry) return;
  entry.selectValueAliases = entry.selectValueAliases || [];
  if (!entry.selectValueAliases.includes(alias)) {
    entry.selectValueAliases.push(alias);
    await setStore(STORES.QA_MEMORY, qaMemory);
  }
}

async function getSiteRegistry() {
  return await getStore(STORES.SITE_REGISTRY);
}

// Merge at the top level: a caller that only knows about one key (Options
// edits atsOverrides) must not wipe domains or fieldOverrides.
async function setSiteRegistry(data) {
  const current = await getStore(STORES.SITE_REGISTRY);
  await setStore(STORES.SITE_REGISTRY, { ...current, ...(data || {}) });
}

// --- 1Password native messaging ---------------------------------------------

const NATIVE_TIMEOUT_MS = 60000; // DesktopAuth shows a prompt the user has to approve; give them a minute.

function sendNativeMessage(message, timeoutMs = NATIVE_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    let port;
    try {
      port = chrome.runtime.connectNative(NATIVE_HOST);
    } catch (e) {
      return reject(new Error('Native host unavailable: ' + e.message));
    }
    let settled = false;
    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      try { port.disconnect(); } catch (e) { /* ignore */ }
      reject(new Error('Native host timeout'));
    }, timeoutMs);

    port.onMessage.addListener((response) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      try { port.disconnect(); } catch (e) { /* ignore */ }
      if (response && response.error === 'locked') {
        reject({ locked: true });
      } else if (response && response.error) {
        reject(new Error(response.error));
      } else {
        resolve(response);
      }
    });

    port.onDisconnect.addListener(() => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      const why = chrome.runtime.lastError ? chrome.runtime.lastError.message : 'Native host disconnected';
      reject(new Error(why));
    });

    port.postMessage(message);
  });
}

// The host only tells us "locked" when asked; remember the last answer so
// the popup can show "approve in 1Password" before the next click.
let nativeLocked = false;

function nativeResult(promise) {
  return promise
    .then(response => { nativeLocked = false; return { success: true, ...response }; })
    .catch(error => {
      if (error && error.locked) { nativeLocked = true; return { success: true, locked: true }; }
      return { success: false, error: error && error.message || String(error) };
    });
}

function check1PasswordCredential(domain) {
  return nativeResult(sendNativeMessage({ cmd: 'check', domain }));
}

function create1PasswordCredential(domain, username, title) {
  return nativeResult(sendNativeMessage({ cmd: 'create', domain, username, title }));
}

function get1PasswordCredential(itemId) {
  return nativeResult(sendNativeMessage({ cmd: 'get', itemId }));
}

// --- Tabs and frames -----------------------------------------------------------

function activeTab() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => resolve(tabs && tabs[0] ? tabs[0] : null));
  });
}

function frameIdsFor(tabId) {
  return new Promise((resolve) => {
    if (!chrome.webNavigation || !chrome.webNavigation.getAllFrames) return resolve([0]);
    try {
      chrome.webNavigation.getAllFrames({ tabId }, (frames) => {
        if (chrome.runtime.lastError || !frames || frames.length === 0) return resolve([0]);
        resolve(frames.map(f => f.frameId));
      });
    } catch (e) {
      resolve([0]);
    }
  });
}

// Send to one frame; resolve null when no content script answers (frame
// without our script, about:blank ad frames, etc.).
function sendToFrame(tabId, frameId, message) {
  return new Promise((resolve) => {
    const cb = (response) => {
      if (chrome.runtime.lastError) return resolve(null);
      resolve(response === undefined ? null : response);
    };
    try {
      if (frameId === undefined) chrome.tabs.sendMessage(tabId, message, cb);
      else chrome.tabs.sendMessage(tabId, message, { frameId }, cb);
    } catch (e) {
      resolve(null);
    }
  });
}

async function broadcast(tabId, message) {
  const ids = await frameIdsFor(tabId);
  const results = await Promise.all(ids.map(id => sendToFrame(tabId, id, message).then(r => ({ frameId: id, response: r }))));
  return results.filter(r => r.response);
}

function hostnameOf(url) {
  try { return new URL(url).hostname.toLowerCase(); } catch (e) { return ''; }
}

const atsFromHostname = common.atsFromHostname;

// --- Badge --------------------------------------------------------------------------
// Each frame reports its own count; the badge shows the tab's total.
const frameCounts = new Map(); // tabId -> Map(frameId -> count)

function updateBadge(tabId, frameId, count) {
  let total = count;
  if (tabId !== undefined) {
    const perFrame = frameCounts.get(tabId) || new Map();
    perFrame.set(frameId === undefined ? 0 : frameId, count);
    frameCounts.set(tabId, perFrame);
    total = Array.from(perFrame.values()).reduce((a, b) => a + b, 0);
  }
  const details = { text: total > 0 ? String(total) : '' };
  if (tabId !== undefined) details.tabId = tabId;
  try {
    chrome.action.setBadgeText(details);
    chrome.action.setBadgeBackgroundColor({ color: [0, 255, 0, 128], ...(tabId !== undefined ? { tabId } : {}) });
  } catch (e) { /* ignore */ }
}

if (chrome.tabs && chrome.tabs.onRemoved) {
  chrome.tabs.onRemoved.addListener((tabId) => frameCounts.delete(tabId));
}

// --- Scan / fill / status / login orchestration --------------------------------------

// Track last scan result for popup status
let lastScanResult = {
  ats: null,
  fieldCount: 0,
  matchCount: 0,
  timestamp: null
};

async function scanActiveTab() {
  const tab = await activeTab();
  if (!tab) return { success: false, error: 'No active tab' };
  const [profile, qaMemory, siteRegistry] = await Promise.all([
    getStore(STORES.PROFILE), getStore(STORES.QA_MEMORY), getStore(STORES.SITE_REGISTRY)
  ]);
  // Matching needs to know a resume exists, not its bytes; don't clone
  // hundreds of KB into every frame.
  const lean = { ...profile, documents: { ...(profile.documents || {}), resume: { ...((profile.documents || {}).resume || {}), base64: (profile.documents && profile.documents.resume && profile.documents.resume.base64) ? '1' : '' } } };
  const results = await broadcast(tab.id, {
    action: 'scanAndMatchFromContent',
    profile: lean,
    qaMemory: qaMemory.entries,
    siteRegistry
  });
  if (results.length === 0) {
    return { success: false, error: 'No content script on this page. Grant access for this site first.' };
  }
  const fields = [];
  const matches = [];
  let ats = null;
  for (const { response } of results) {
    if (!response || !response.success) continue;
    fields.push(...(response.fields || []));
    matches.push(...(response.matches || []));
    ats = ats || response.ats || null;
  }
  ats = ats || atsFromHostname(hostnameOf(tab.url));
  lastScanResult = { ats, fieldCount: fields.length, matchCount: matches.filter(Boolean).length, timestamp: Date.now() };
  for (const { frameId, response } of results) {
    if (response && response.success) updateBadge(tab.id, frameId, (response.fields || []).length);
  }
  return { success: true, fields, matches, ats };
}

async function fillActiveTab() {
  const tab = await activeTab();
  if (!tab) return { success: false, error: 'No active tab' };
  const results = await broadcast(tab.id, { action: 'fillFromContent' });
  if (results.length === 0) {
    return { success: false, error: 'No content script on this page. Grant access for this site first.' };
  }
  const sum = { fieldCount: 0, matchCount: 0, attempted: 0, filled: 0, captured: 0 };
  let ats = null;
  for (const { response } of results) {
    if (!response || !response.success) continue;
    for (const k of Object.keys(sum)) sum[k] += response[k] || 0;
    ats = ats || response.ats || null;
  }
  ats = ats || atsFromHostname(hostnameOf(tab.url));
  lastScanResult = { ats, fieldCount: sum.fieldCount, matchCount: sum.matchCount, timestamp: Date.now() };
  const hostname = hostnameOf(tab.url);
  if (hostname) {
    const reg = await getSiteRegistry();
    reg.domains[hostname] = { ...(reg.domains[hostname] || {}), ats: ats || (reg.domains[hostname] || {}).ats || null, lastApplied: new Date().toISOString() };
    await setSiteRegistry(reg);
  }
  return { success: true, ...sum, ats };
}

function emptyStatus() {
  return {
    ats: lastScanResult.ats,
    lastScan: { fieldCount: lastScanResult.fieldCount, matchCount: lastScanResult.matchCount },
    credentialStatus: { hasCredential: false, locked: false },
    needsPermission: false,
    page: null
  };
}

async function getStatus() {
  const tab = await activeTab();
  const status = emptyStatus();
  if (!tab) return { success: true, status };

  // tabs[0].url can be empty (e.g. a tab the extension can't read the URL
  // of yet) -- treat that as "no site" rather than crash.
  let url = null;
  try { url = tab.url ? new URL(tab.url) : null; } catch (e) { url = null; }
  const hostname = url ? url.hostname.toLowerCase() : '';
  const isKnownAts = common.isKnownAtsHost(hostname);

  // Known ATS domains are auto-granted via manifest.json's required
  // host_permissions. Everything else needs an actual check:
  // chrome.permissions.contains() must be CALLED (it returns a Promise when
  // no callback is passed), not just referenced.
  let hasPermission = isKnownAts;
  if (!isKnownAts && url && /^https?:$/.test(url.protocol) && chrome.permissions && chrome.permissions.contains) {
    try { hasPermission = await chrome.permissions.contains({ origins: [`${url.origin}/*`] }); } catch (e) { hasPermission = false; }
  }

  try {
    const siteRegistry = await getSiteRegistry();
    const site = siteRegistry.domains && siteRegistry.domains[hostname];
    status.credentialStatus = { hasCredential: !!(site && site.hasCredential), locked: nativeLocked };
  } catch (e) { /* keep defaults */ }
  status.needsPermission = !hasPermission && !isKnownAts;
  status.ats = status.ats || atsFromHostname(hostname);

  // Page shape (account creation? password field?) from the top frame, if our
  // content script is there.
  const page = await sendToFrame(tab.id, 0, { action: 'pageInfo' });
  if (page && page.success) {
    status.page = { isAccountCreation: !!page.isAccountCreation, hasPasswordField: !!page.hasPasswordField, hasUsernameField: !!page.hasUsernameField };
    status.ats = page.ats || status.ats;
  }
  return { success: true, status };
}

// Popup: "Create login in 1Password". Creates the item (the 1Password app
// shows its own approval prompt), fills email + generated password into the
// page, and records the domain. The password lives only in this call.
async function createLoginForActiveTab(title) {
  const tab = await activeTab();
  if (!tab) return { success: false, error: 'No active tab' };
  const hostname = hostnameOf(tab.url);
  if (!hostname) return { success: false, error: 'No site' };
  const profile = await getStore(STORES.PROFILE);
  const username = profile.identity && profile.identity.email;
  if (!username) return { success: false, error: 'Set your email in Options first' };

  const created = await create1PasswordCredential(hostname, username, title || `${hostname} (job application)`);
  if (!created.success || created.locked) return created;

  const fills = await broadcast(tab.id, { action: 'fillCredentials', username, password: created.password, hostname });
  const filled = fills.reduce((n, r) => n + ((r.response && r.response.filled) || 0), 0);

  const reg = await getSiteRegistry();
  reg.domains[hostname] = {
    ...(reg.domains[hostname] || {}),
    ats: (reg.domains[hostname] || {}).ats || atsFromHostname(hostname),
    hasCredential: true,
    opItemId: created.itemId,
    lastApplied: (reg.domains[hostname] || {}).lastApplied || ''
  };
  await setSiteRegistry(reg);
  return { success: true, itemId: created.itemId, filled };
}

// Popup: "Fill login from 1Password" on a site we created a login for.
async function fillLoginForActiveTab() {
  const tab = await activeTab();
  if (!tab) return { success: false, error: 'No active tab' };
  const hostname = hostnameOf(tab.url);
  const reg = await getSiteRegistry();
  let site = reg.domains[hostname];
  if (!site || !site.opItemId) {
    // Maybe 1Password already has one (created by hand, or on another machine).
    const check = await check1PasswordCredential(hostname);
    if (!check.success || check.locked) return check;
    if (!check.exists) return { success: false, error: 'No saved login for this site' };
    site = { ...(site || {}), hasCredential: true, opItemId: check.itemId, ats: atsFromHostname(hostname) };
    reg.domains[hostname] = site;
    await setSiteRegistry(reg);
  }
  const cred = await get1PasswordCredential(site.opItemId);
  if (!cred.success || cred.locked) return cred;
  const fills = await broadcast(tab.id, { action: 'fillCredentials', username: cred.username, password: cred.password, hostname });
  const filled = fills.reduce((n, r) => n + ((r.response && r.response.filled) || 0), 0);
  return { success: true, filled };
}

// Popup: "Grant access on this site" for non-ATS domains. The popup asks
// for the permission (must happen from a user gesture there); we inject.
async function injectContentScripts(tabId) {
  const tab = tabId !== undefined ? { id: tabId } : await activeTab();
  if (!tab) return { success: false, error: 'No active tab' };
  if (!chrome.scripting || !chrome.scripting.executeScript) return { success: false, error: 'scripting API unavailable' };
  try {
    await chrome.scripting.executeScript({ target: { tabId: tab.id, allFrames: true }, files: CONTENT_SCRIPTS });
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// --- Message router ------------------------------------------------------------------

function reply(sendResponse, promise) {
  promise
    .then(result => sendResponse(result))
    .catch(err => sendResponse({ success: false, error: err && err.message || String(err) }));
  return true;
}

function ok(sendResponse, promise, wrap) {
  return reply(sendResponse, promise.then(data => (wrap ? wrap(data) : { success: true })));
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { action } = message || {};
  switch (action) {
    // stores
    case 'getProfile':
      return ok(sendResponse, getStore(STORES.PROFILE), data => ({ success: true, data }));
    case 'setProfile':
      return ok(sendResponse, setStore(STORES.PROFILE, message.data));
    case 'qaGet':
      return ok(sendResponse, qaGet(message.key), data => ({ success: true, data }));
    case 'qaUpsert':
      return ok(sendResponse, qaUpsert(message.entry));
    case 'qaUpsertMany':
      return ok(sendResponse, qaUpsertMany(message.entries));
    case 'qaList':
      return ok(sendResponse, qaList(), data => ({ success: true, data: { entries: data } }));
    case 'qaDelete':
      return ok(sendResponse, qaDelete(message.key));
    case 'incrementTimesUsed':
      return ok(sendResponse, incrementTimesUsed(message.key, message.wasReviewed));
    case 'qaAddAlias':
      return ok(sendResponse, qaAddAlias(message.key, message.alias));
    case 'getSiteRegistry':
      return ok(sendResponse, getStore(STORES.SITE_REGISTRY), data => ({ success: true, data }));
    case 'setSiteRegistry':
      return ok(sendResponse, setSiteRegistry(message.data));

    // 1Password primitives
    case 'check1PasswordCredential':
      return reply(sendResponse, check1PasswordCredential(message.domain));
    case 'create1PasswordCredential':
      return reply(sendResponse, create1PasswordCredential(message.domain, message.username, message.title));
    case 'get1PasswordCredential':
      return reply(sendResponse, get1PasswordCredential(message.itemId));

    // page orchestration
    case 'scan':
      return reply(sendResponse, scanActiveTab());
    case 'fill':
      return reply(sendResponse, fillActiveTab());
    case 'getStatus':
      return reply(sendResponse, getStatus());
    case 'createLogin':
      return reply(sendResponse, createLoginForActiveTab(message.title));
    case 'fillLogin':
      return reply(sendResponse, fillLoginForActiveTab());
    case 'injectContentScripts':
      return reply(sendResponse, injectContentScripts(message.tabId));

    // content script -> badge
    case 'scanResult': {
      const count = typeof message.count === 'number' ? message.count
        : Array.isArray(message.fields) ? message.fields.length : 0;
      const tabId = sender && sender.tab ? sender.tab.id : undefined;
      updateBadge(tabId, sender ? sender.frameId : undefined, count);
      if (message.ats && (!sender || !sender.frameId)) lastScanResult.ats = message.ats;
      sendResponse({ success: true });
      return false;
    }

    default:
      sendResponse({ success: false, error: 'Unknown action' });
      return false;
  }
});

// Keyboard shortcut (manifest "commands": fill)
if (chrome.commands && chrome.commands.onCommand) {
  chrome.commands.onCommand.addListener((command) => {
    if (command === 'fill') fillActiveTab().catch(console.error);
  });
}

// Context menu: "Remap this field" on any editable element. The content
// script in the clicked frame remembers the right-click target.
const REMAP_MENU_ID = 'resumebot-remap-field';
if (chrome.runtime.onInstalled) {
  chrome.runtime.onInstalled.addListener(() => {
    if (!chrome.contextMenus || !chrome.contextMenus.create) return;
    try {
      chrome.contextMenus.create({ id: REMAP_MENU_ID, title: 'ResumeBot: remap this field', contexts: ['editable'] }, () => void chrome.runtime.lastError);
    } catch (e) { /* ignore */ }
  });
}
if (chrome.contextMenus && chrome.contextMenus.onClicked) {
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId !== REMAP_MENU_ID || !tab) return;
    sendToFrame(tab.id, info.frameId || 0, { action: 'remapField' }).catch(() => {});
  });
}

// Initialize stores on startup.
initializeStores().catch(console.error);

// Node test hook (AGENTS.md dual-environment pattern)
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    initializeStores,
    getStore,
    setStore,
    getDefaultProfile,
    mergeProfileWithDefaults,
    qaGet,
    qaUpsert,
    qaList,
    qaDelete,
    incrementTimesUsed,
    qaAddAlias,
    qaUpsertMany,
    setSiteRegistry,
    sendNativeMessage,
    check1PasswordCredential,
    create1PasswordCredential,
    get1PasswordCredential,
    atsFromHostname,
    updateBadge
  };
}
