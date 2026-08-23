// test/capture.test.js
// The capture panel is given its data (profile, qa-memory) and a persist
// callback by the orchestrator; it never touches chrome.* itself. These
// tests drive it the same way.
const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

function loadFresh(modulePath) {
  delete require.cache[require.resolve(modulePath)];
  return require(modulePath);
}

const PROFILE = {
  identity: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
  work: { authorized: 'yes', sponsorship: 'no' },
  eeo: { gender: '', race: '', veteranStatus: '', disabilityStatus: '' }
};

describe('capture.js', () => {
  let dom, window, document, captureApi, saved;

  function field(html, extra) {
    document.body.insertAdjacentHTML('beforeend', html);
    const input = document.body.lastElementChild;
    const f = Object.assign({ label: 'Question', type: input.type || '', tag: input.tagName.toLowerCase(), attributes: {}, visible: true }, extra || {});
    Object.defineProperty(f, 'input', { value: input, enumerable: false });
    return f;
  }

  function persist(entries) { saved.push(...entries); return Promise.resolve(); }

  beforeEach(() => {
    dom = new JSDOM('<!DOCTYPE html><html><head><title>Engineer at Acme</title></head><body></body></html>', { url: 'https://boards.greenhouse.io/acme/jobs/1', pretendToBeVisual: true });
    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;
    global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
    saved = [];
    // Load the chain the way the manifest does, so capture finds its peers
    // on window.ResumeBot rather than through require fallbacks.
    for (const m of ['common', 'normalize', 'filler', 'capture']) loadFresh(`../extension/content/${m}.js`);
    captureApi = window.ResumeBot.capture;
  });

  afterEach(() => {
    delete global.window;
    delete global.document;
    delete global.requestAnimationFrame;
  });

  it('returns without a panel when nothing is unmatched', async () => {
    const f = field('<input type="text" id="fn">', { label: 'First Name' });
    const r = await captureApi.capture([f], [{ profilePath: 'identity.firstName', tier: 1 }], { profile: PROFILE, qaMemory: { entries: [] }, persist });
    assert.equal(r.shown, false);
    assert.equal(document.getElementById(captureApi.CONTAINER_ID), null);
  });

  it('surfaces an EEO field whose profile value is empty, flagged', async () => {
    const f = field('<input type="text" id="g">', { label: 'Gender' });
    const r = await captureApi.capture([f], [{ profilePath: 'eeo.gender', tier: 1 }], { profile: PROFILE, qaMemory: { entries: [] }, persist });
    assert.equal(r.rows, 1);
    assert.ok(r.panel.querySelector('.eeo-flag'));
  });

  it('never lists password fields or hidden inputs', async () => {
    const pw = field('<input type="password" id="pw">', { label: 'Password' });
    const hidden = field('<input type="text" id="hp">', { label: 'Leave blank', visible: false });
    const real = field('<input type="text" id="q">', { label: 'Custom Question' });
    const r = await captureApi.capture([pw, hidden, real], [null, null, null], { profile: PROFILE, qaMemory: { entries: [] }, persist });
    assert.equal(r.rows, 1);
    assert.equal(r.panel.querySelector('.field-label').textContent, 'Custom Question');
  });

  it('renders the panel with label, type, answer control, save toggle and submit', async () => {
    const f = field('<input type="text" id="q">', { label: 'Custom Question' });
    const r = await captureApi.capture([f], [null], { profile: PROFILE, qaMemory: { entries: [] }, persist });
    const container = document.getElementById(captureApi.CONTAINER_ID);
    assert.ok(container && container.parentElement === document.body);
    assert.equal(container.shadowRoot, null, 'closed root is not re-exposed');
    const panel = r.panel;
    assert.equal(panel.querySelector('.header h2').textContent, 'Review unmatched fields');
    assert.equal(panel.querySelector('.field-label').textContent, 'Custom Question');
    assert.equal(panel.querySelector('.field-type').textContent, 'text');
    const control = panel.querySelector('.answer-control');
    assert.equal(control.tagName.toLowerCase(), 'input');
    assert.equal(control.type, 'text');
    const toggle = panel.querySelector('.toggle-container input[type=checkbox]');
    assert.equal(toggle.checked, true);
    assert.equal(panel.querySelector('.toggle-container span').textContent, 'Save to memory');
    assert.equal(panel.querySelector('.submit-btn').textContent, 'Save and fill');
  });

  it('offers a select with a blank option plus the original options', async () => {
    const f = field('<select id="auth"><option value="">Select</option><option value="yes">Yes</option><option value="no">No</option></select>', { label: 'Are you authorized to work?' });
    const r = await captureApi.capture([f], [null], { profile: PROFILE, qaMemory: { entries: [] }, persist });
    const control = r.panel.querySelector('.answer-control');
    assert.equal(control.tagName.toLowerCase(), 'select');
    assert.equal(control.options.length, 4);
    assert.equal(control.options[0].textContent, '-- Please select --');
    assert.equal(control.options[2].value, 'yes');
  });

  it('collapses a radio group into one row with its options', async () => {
    const a = field('<input type="radio" name="r" value="Yes">', { label: 'Relocate?', groupName: 'r', value: 'Yes', optionLabel: 'Yes' });
    const b = field('<input type="radio" name="r" value="No">', { label: 'Relocate?', groupName: 'r', value: 'No', optionLabel: 'No' });
    const r = await captureApi.capture([a, b], [null, null], { profile: PROFILE, qaMemory: { entries: [] }, persist });
    assert.equal(r.rows, 1);
    const control = r.panel.querySelector('.answer-control');
    assert.equal(control.tagName.toLowerCase(), 'select');
    assert.deepEqual(Array.from(control.options).map(o => o.value), ['', 'Yes', 'No']);
  });

  it('an untouched checkbox is no answer: nothing saved, nothing filled', async () => {
    const f = field('<input type="checkbox" id="agree">', { label: 'I agree to the terms' });
    const r = await captureApi.capture([f], [null], { profile: PROFILE, qaMemory: { entries: [] }, persist });
    assert.equal(r.panel.querySelector('.answer-control').type, 'checkbox');
    assert.equal(captureApi.readAnswer(r.panel.querySelector('.answer-control')), '');
    r.panel.querySelector('.submit-btn').click();
    await new Promise(res => setTimeout(res, 20));
    assert.equal(saved.length, 0);
    assert.equal(document.getElementById('agree').checked, false);
  });

  it('submit persists normalized entries through the callback and fills the page', async () => {
    const f = field('<textarea id="why"></textarea>', { label: 'Why do you want to work at Acme?' });
    const long = field('<textarea id="essay"></textarea>', { label: 'Tell us about yourself' });
    const r = await captureApi.capture([f, long], [null, null], { profile: PROFILE, qaMemory: { entries: [] }, persist, ats: 'greenhouse' });
    const controls = r.panel.querySelectorAll('.answer-control');
    controls[0].value = 'Because.';
    controls[1].value = 'x'.repeat(250);
    let done = null;
    r.panel.querySelector('.submit-btn').click();
    await new Promise(res => setTimeout(res, 50));
    assert.equal(saved.length, 2);
    assert.equal(saved[0].questionNormalized, 'why do you want to work at {company}');
    assert.match(saved[0].key, /^[0-9a-f]{40}$/);
    assert.equal(saved[0].firstSeen.ats, 'greenhouse');
    assert.equal(saved[0].reviewBeforeFill, false);
    assert.equal(saved[1].reviewBeforeFill, true, 'long free text defaults to review');
    assert.equal(document.getElementById('why').value, 'Because.');
  });

  it('review rows fill on confirm and report their keys; unticked ones are left alone', async () => {
    const a = field('<textarea id="a"></textarea>', { label: 'Q A' });
    const b = field('<textarea id="b"></textarea>', { label: 'Q B' });
    const entries = [
      { key: 'ka', questionNormalized: 'q a', answer: 'stored A', reviewBeforeFill: true },
      { key: 'kb', questionNormalized: 'q b', answer: 'stored B', reviewBeforeFill: true }
    ];
    const review = [
      { index: 0, match: { qaKey: 'ka', answer: 'stored A' }, value: 'stored A' },
      { index: 1, match: { qaKey: 'kb', answer: 'stored B' }, value: 'stored B' }
    ];
    let result = null;
    const r = await captureApi.capture([a, b], [{ qaKey: 'ka' }, { qaKey: 'kb' }], { profile: PROFILE, qaMemory: { entries }, review, persist, onDone: (res) => { result = res; } });
    assert.equal(r.rows, 2);
    const rows = r.panel.querySelectorAll('.field-row');
    rows[1].querySelector('.toggle-container input').checked = false;
    r.panel.querySelector('.submit-btn').click();
    await new Promise(res => setTimeout(res, 50));
    assert.equal(document.getElementById('a').value, 'stored A');
    assert.equal(document.getElementById('b').value, '');
    assert.deepEqual(result.reviewed, ['ka']);
    assert.equal(saved.length, 0, 'unchanged stored answer is not rewritten');
  });

  it('records the right-clicked element for the remap menu', () => {
    captureApi.initContextMenu();
    const el = document.createElement('input');
    document.body.appendChild(el);
    el.dispatchEvent(new window.MouseEvent('contextmenu', { bubbles: true }));
    assert.equal(captureApi.getLastContextTarget(), el);
  });
});
