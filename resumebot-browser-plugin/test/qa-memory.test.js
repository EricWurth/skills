const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { createChromeMock } = require('./helpers/chrome-mock.js');

describe('qa-memory store', () => {
  let sw;
  let chromeMock;

  beforeEach(async () => {
    chromeMock = createChromeMock();
    global.chrome = chromeMock;
    delete require.cache[require.resolve('../extension/service-worker.js')];
    sw = require('../extension/service-worker.js');
    await sw.initializeStores();
  });

  afterEach(() => {
    delete global.chrome;
  });

  it('should initialize with default qaMemory structure', async () => {
    const entries = await sw.qaList();
    assert.deepStrictEqual(entries, []);
  });

  it('should upsert an entry and retrieve it by key', async () => {
    const entry = {
      key: 'abc123',
      questionRaw: 'Why do you want to work at Acme?',
      questionNormalized: 'why do you want to work at {company}',
      answer: 'I admire your mission',
      answerType: 'text',
      selectValueAliases: [],
      firstSeen: { domain: 'example.com', ats: 'greenhouse', date: '2026-07-22' },
      timesUsed: 0,
      reviewBeforeFill: false
    };

    await sw.qaUpsert(entry);
    const fetched = await sw.qaGet('abc123');
    assert.deepStrictEqual(fetched, entry);

    // Upsert with same key updates rather than duplicates
    await sw.qaUpsert({ ...entry, answer: 'Updated answer' });
    const entries = await sw.qaList();
    assert.strictEqual(entries.length, 1);
    assert.strictEqual(entries[0].answer, 'Updated answer');
  });

  it('should generate a key from normalized text', async () => {
    const normalize = require('../extension/content/normalize.js');
    const normalized = normalize.normalizeQuestion('Why do you want to work at Acme?',
      { title: 'Software Engineer at Acme - Jobs', URL: 'https://www.acme.com/jobs/123' });
    assert.equal(normalized, 'why do you want to work at {company}');

    const key = await normalize.generateKey(normalized);
    assert.ok(typeof key === 'string' && key.length > 0);
    // Deterministic: same input, same key
    assert.strictEqual(await normalize.generateKey(normalized), key);
  });

  it('should normalize different company names to same string', async () => {
    const normalize = require('../extension/content/normalize.js');

    const docAcme = {
      title: 'Software Engineer at Acme - Jobs',
      URL: 'https://www.acme.com/jobs/123',
      querySelector: (selector) =>
        selector === 'meta[property="og:site_name"]' ? { content: 'Acme Careers' } : null
    };

    const docInitech = {
      title: 'Software Engineer at Initech - Careers',
      URL: 'https://www.initech.com/careers/456',
      querySelector: (selector) =>
        selector === 'meta[property="og:site_name"]' ? { content: 'Initech' } : null
    };

    const norm1 = normalize.normalizeQuestion('Why do you want to work at Acme?', docAcme);
    const norm2 = normalize.normalizeQuestion('Why do you want to work at Initech?', docInitech);

    assert.equal(norm1, norm2);
    assert.equal(norm1, 'why do you want to work at {company}');
  });

  it('should normalize punctuation and case variants to same string', async () => {
    const normalize = require('../extension/content/normalize.js');
    const doc = { title: '', URL: 'https://example.com' };

    const norm1 = normalize.normalizeQuestion('Why do you want to work at {company}?', doc);
    const norm2 = normalize.normalizeQuestion('WHY DO YOU WANT TO WORK AT {company}!', doc);
    const norm3 = normalize.normalizeQuestion('Why do you want to work at {company}', doc);

    assert.equal(norm1, norm2);
    assert.equal(norm2, norm3);
    assert.equal(norm1, 'why do you want to work at {company}');
  });
});
