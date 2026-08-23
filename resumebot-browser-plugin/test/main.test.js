// test/main.test.js
// The product loop end to end: scan -> match -> fill what we know -> capture
// what we don't -> the captured answer fills silently next time.
const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const { createChromeMock } = require('./helpers/chrome-mock');

const CONTENT = [
  'normalize.js', 'scanner.js', 'matcher.js', 'filler.js', 'capture.js',
  'ats/detect.js', 'ats/generic.js', 'ats/workday.js', 'ats/greenhouse.js', 'ats/lever.js', 'ats/icims.js',
  'main.js'
];

function loadContentScripts(window) {
  // Same order as manifest.json; `module` is left undefined so each file
  // takes the browser branch and hangs off window.ResumeBot.
  for (const f of CONTENT) {
    const src = fs.readFileSync(path.join(__dirname, '../extension/content', f), 'utf8');
    window.eval(src);
  }
  return window.ResumeBot;
}

const PROFILE = {
  identity: { firstName: 'Jordan', lastName: 'Okafor', email: 'jordan@example.com', phone: '555-0100', linkedin: 'https://linkedin.com/in/jordan', website: '' },
  address: { street: '1 Main St', city: 'Springfield', state: 'IL', zip: '62701', country: 'US' },
  work: { authorized: 'yes', sponsorship: 'no', remotePreference: '', salaryExpectation: '', startDate: '2026-09-01', noticePeriod: '' },
  eeo: { gender: '', race: '', veteranStatus: '', disabilityStatus: '' },
  education: [], employment: [],
  documents: { resume: { filename: '', mime: '', base64: '' }, coverLetterTemplate: '' }
};

const FORM = `
  <form>
    <label for="first_name">First Name</label><input id="first_name" name="first_name" type="text">
    <label for="last_name">Last Name</label><input id="last_name" name="last_name" type="text">
    <label for="email">Email</label><input id="email" name="email" type="email">
    <label for="cover">Why do you want to work at Acme?</label><textarea id="cover" name="question_1"></textarea>
    <fieldset>
      <legend>Are you legally authorized to work in the United States?</legend>
      <label><input type="radio" name="auth" value="Yes"> Yes</label>
      <label><input type="radio" name="auth" value="No"> No</label>
    </fieldset>
    <label for="gender">Gender</label>
    <select id="gender" name="gender"><option value="">Select</option><option value="m">Male</option><option value="f">Female</option></select>
    <label for="pw">Password</label><input id="pw" type="password">
  </form>`;

function makePage(html, url) {
  const dom = new JSDOM(`<!DOCTYPE html><html><head><title>Engineer at Acme</title></head><body>${html}</body></html>`,
    { url: url || 'https://boards.greenhouse.io/acme/jobs/1', runScripts: 'outside-only', pretendToBeVisual: true });
  const window = dom.window;
  const chrome = createChromeMock();
  window.chrome = chrome;
  return { dom, window, chrome };
}

function seedStores(chrome, extra) {
  chrome._store.set('profile', JSON.parse(JSON.stringify(PROFILE)));
  chrome._store.set('qaMemory', { entries: (extra && extra.entries) || [] });
  chrome._store.set('siteRegistry', Object.assign({ domains: {}, atsOverrides: [], fieldOverrides: {} }, (extra && extra.siteRegistry) || {}));
}

describe('main.js orchestrator', () => {
  let page, NS, sw;

  // Seed BEFORE loading the service worker: its initializeStores() writes
  // defaults for any store it finds empty, and would clobber a later seed.
  async function bootServiceWorker(chrome, extra) {
    seedStores(chrome, extra);
    global.chrome = chrome;
    delete require.cache[require.resolve('../extension/service-worker.js')];
    const mod = require('../extension/service-worker.js');
    await new Promise(r => setTimeout(r, 0));
    return mod;
  }

  beforeEach(async () => {
    page = makePage(FORM);
    sw = await bootServiceWorker(page.chrome);
    NS = loadContentScripts(page.window);
    // jsdom never reports layout; make every field visible.
    NS.scanner.isVisible = () => true;
  });

  afterEach(() => {
    delete global.chrome;
  });

  it('detects the ATS from the URL and picks the adapter', async () => {
    await NS.main.init();
    assert.equal(NS.main.state.ats, 'greenhouse');
    assert.equal(NS.main.state.adapter.name, 'greenhouse');
  });

  it('matches profile fields, radio groups and leaves empty EEO + password alone', async () => {
    await NS.main.init();
    const r = await NS.main.fillPage();
    const doc = page.window.document;

    assert.equal(doc.getElementById('first_name').value, 'Jordan');
    assert.equal(doc.getElementById('last_name').value, 'Okafor');
    assert.equal(doc.getElementById('email').value, 'jordan@example.com');

    // Only the "Yes" radio is clicked for work.authorized = "yes".
    const radios = doc.querySelectorAll('input[name="auth"]');
    assert.equal(radios[0].checked, true);
    assert.equal(radios[1].checked, false);

    // EEO unset -> untouched; password -> untouched.
    assert.equal(doc.getElementById('gender').value, '');
    assert.equal(doc.getElementById('pw').value, '');

    assert.ok(r.filled >= 4, `filled ${r.filled}`);
    // Capture panel shown for the custom question + the EEO field.
    assert.ok(r.captured >= 2, `captured ${r.captured}`);
    assert.ok(doc.getElementById('resumebot-capture-container'));
  });

  it('a captured answer is stored normalized and fills silently on the next company', async () => {
    await NS.main.init();
    await NS.main.fillPage();
    const doc = page.window.document;
    const panel = doc.getElementById('resumebot-capture-container');
    const rows = panel.shadowRoot.querySelectorAll('.field-row');
    const coverRow = Array.from(rows).find(r => r.querySelector('.field-label').textContent.includes('Why do you want'));
    assert.ok(coverRow, 'custom question is in the capture panel');
    coverRow.querySelector('.answer-control').value = 'Because the mission matters.';
    panel.shadowRoot.querySelector('.submit-btn').click();
    await new Promise(r => setTimeout(r, 200));

    assert.equal(doc.getElementById('cover').value, 'Because the mission matters.');
    const saved = page.chrome._store.get('qaMemory').entries;
    assert.equal(saved.length, 1);
    assert.equal(saved[0].questionNormalized, 'why do you want to work at {company}');
    assert.equal(saved[0].answerType, 'text');
    assert.equal(saved[0].reviewBeforeFill, false);
    assert.match(saved[0].key, /^[0-9a-f]{40}$/, 'sha-1 key');

    // Second company, same question, different name -> fills with no human.
    const page2 = makePage(FORM.replace('at Acme', 'at Initech'), 'https://jobs.lever.co/initech/123');
    await bootServiceWorker(page2.chrome, { entries: saved });
    page2.window.document.title = 'Engineer at Initech';
    const NS2 = loadContentScripts(page2.window);
    NS2.scanner.isVisible = () => true;
    await NS2.main.init();
    assert.equal(NS2.main.state.ats, 'lever');
    await NS2.main.fillPage();
    assert.equal(page2.window.document.getElementById('cover').value, 'Because the mission matters.');
    const used = page2.chrome._store.get('qaMemory').entries[0].timesUsed;
    assert.equal(used, 1);
  });

  it('long stored answers are offered for review instead of silently filled', async () => {
    const long = 'x'.repeat(250);
    await bootServiceWorker(page.chrome, { entries: [{
      key: 'k1', questionRaw: 'Why do you want to work at Acme?', questionNormalized: 'why do you want to work at {company}',
      answer: long, answerType: 'text', selectValueAliases: [], firstSeen: {}, timesUsed: 0, reviewBeforeFill: true
    }] });
    await NS.main.init();
    await NS.main.fillPage();
    const doc = page.window.document;
    assert.equal(doc.getElementById('cover').value, '', 'not filled silently');
    const panel = doc.getElementById('resumebot-capture-container');
    const review = Array.from(panel.shadowRoot.querySelectorAll('.field-row')).find(r => r.querySelector('.review-flag'));
    assert.ok(review, 'review row present');
    assert.equal(review.querySelector('.answer-control').value, long);
  });

  it('a remap override wins over every other tier', async () => {
    await bootServiceWorker(page.chrome, { siteRegistry: { fieldOverrides: { greenhouse: { cover: 'identity.linkedin' } } } });
    await NS.main.init();
    await NS.main.fillPage();
    assert.equal(page.window.document.getElementById('cover').value, 'https://linkedin.com/in/jordan');
  });

  it('adapter selector maps supply tier-0 matches', async () => {
    const p = makePage(`<form><input data-automation-id="legalNameSection_firstName" type="text"><input data-automation-id="email" type="text"></form>`,
      'https://acme.wd5.myworkdayjobs.com/en-US/careers/job/1');
    await bootServiceWorker(p.chrome);
    const N = loadContentScripts(p.window);
    N.scanner.isVisible = () => true;
    await N.main.init();
    assert.equal(N.main.state.ats, 'workday');
    const ctx = { profile: PROFILE, qaMemory: { entries: [] }, siteRegistry: {} };
    const { matches } = await N.main.scanAndMatch(ctx);
    assert.equal(matches[0].tier, 0);
    assert.equal(matches[0].profilePath, 'identity.firstName');
    await N.main.fillPage();
    assert.equal(p.window.document.querySelector('[data-automation-id="legalNameSection_firstName"]').value, 'Jordan');
  });

  it('fillCredentials fills the username and password fields only with the 1Password flow', async () => {
    await NS.main.init();
    const r = await NS.main.fillCredentials('jordan@example.com', 'S3cret!');
    assert.equal(page.window.document.getElementById('pw').value, 'S3cret!');
    assert.equal(page.window.document.getElementById('email').value, 'jordan@example.com');
    assert.equal(r.passwordFields, 1);
  });

  it('pageInfo reports password presence and account-creation shape', async () => {
    await NS.main.init();
    const info = NS.main.pageInfo();
    assert.equal(info.hasPasswordField, true);
    assert.equal(info.isAccountCreation, false);
    assert.equal(info.ats, 'greenhouse');
  });
});
