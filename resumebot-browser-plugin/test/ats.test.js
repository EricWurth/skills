// ats.test.js - ATS detection and adapter tests
import { describe, it, beforeEach, afterEach } from 'node:test';
import { strict as assert } from 'assert';
import { JSDOM } from 'jsdom';
import sinon from 'sinon';

// Load modules
import detectModule from '../extension/content/ats/detect.js';
import greenhouseAdapter from '../extension/content/ats/greenhouse.js';
import leverAdapter from '../extension/content/ats/lever.js';
import genericAdapter from '../extension/content/ats/generic.js';

// Set up File and DataTransfer constructors for each test
    beforeEach(() => {
        global.File = class File {
            constructor(bits, name, opts) {
                this.name = name;
                this.type = opts && opts.type;
            }
        };
        global.DataTransfer = class DataTransfer {
            constructor() {
                self.items = { add: () => {} };
                self.files = [];
            }
        };
    });

// Clean up after each test
afterEach(() => {
  if (global.dom) global.dom.window.close();
  delete global.window;
  delete global.document;
});

describe('ATS Detection', () => {
  it('should detect Workday from URL', () => {
    global.dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { 
      url: 'https://company.myworkdayjobs.com/job/123',
      pretendToBeVisual: true 
    });
    global.window = global.dom.window;
    global.document = global.dom.window.document;
    global.window.File = global.File;
    global.window.DataTransfer = global.DataTransfer;
    window.ResumeBot = window.ResumeBot || {};

    const result = detectModule.detectATS(global.document);
    assert.deepStrictEqual(result, { ats: 'workday', confidence: 0.9 });
  });

  it('should detect Greenhouse from URL', () => {
    global.dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { 
      url: 'https://boards.greenhouse.io/company/job/123',
      pretendToBeVisual: true 
    });
    global.window = global.dom.window;
    global.document = global.dom.window.document;
    global.window.File = global.File;
    global.window.DataTransfer = global.DataTransfer;
    window.ResumeBot = window.ResumeBot || {};

    const result = detectModule.detectATS(global.document);
    assert.deepStrictEqual(result, { ats: 'greenhouse', confidence: 0.9 });
  });

  it('should detect Lever from URL', () => {
    global.dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { 
      url: 'https://jobs.lever.co/company/123',
      pretendToBeVisual: true 
    });
    global.window = global.dom.window;
    global.document = global.dom.window.document;
    global.window.File = global.File;
    global.window.DataTransfer = global.DataTransfer;
    window.ResumeBot = window.ResumeBot || {};

    const result = detectModule.detectATS(global.document);
    assert.deepStrictEqual(result, { ats: 'lever', confidence: 0.9 });
  });

  it('should detect iCIMS from URL', () => {
    global.dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { 
      url: 'https://company.icims.com/jobs/123',
      pretendToBeVisual: true 
    });
    global.window = global.dom.window;
    global.document = global.dom.window.document;
    global.window.File = global.File;
    global.window.DataTransfer = global.DataTransfer;
    window.ResumeBot = window.ResumeBot || {};

    const result = detectModule.detectATS(global.document);
    assert.deepStrictEqual(result, { ats: 'icims', confidence: 0.9 });
  });

  it('should detect Greenhouse from DOM signature', () => {
    global.dom = new JSDOM('<!DOCTYPE html><html><body><div id="grnhse_app"></div></body></html>', { 
      url: 'https://company.com/careers',
      pretendToBeVisual: true 
    });
    global.window = global.dom.window;
    global.document = global.dom.window.document;
    global.window.File = global.File;
    global.window.DataTransfer = global.DataTransfer;
    window.ResumeBot = window.ResumeBot || {};

    const result = detectModule.detectATS(global.document);
    assert.deepStrictEqual(result, { ats: 'greenhouse', confidence: 0.7 });
  });

  it('should detect Lever from DOM signature', () => {
    global.dom = new JSDOM('<!DOCTYPE html><html><body><div class="application-form"></div></body></html>', { 
      url: 'https://company.com/careers',
      pretendToBeVisual: true 
    });
    global.window = global.dom.window;
    global.document = global.dom.window.document;
    global.window.File = global.File;
    global.window.DataTransfer = global.DataTransfer;
    window.ResumeBot = window.ResumeBot || {};

    const result = detectModule.detectATS(global.document);
    assert.deepStrictEqual(result, { ats: 'lever', confidence: 0.7 });
  });

  it('should detect Workday from DOM signature', () => {
    const workdayFields = Array.from({ length: 6 }, (_, i) => `<div data-automation-id="field-${i}"></div>`).join('');
    global.dom = new JSDOM(`<!DOCTYPE html><html><body>${workdayFields}</body></html>`, { 
      url: 'https://company.com/careers',
      pretendToBeVisual: true 
    });
    global.window = global.dom.window;
    global.document = global.dom.window.document;
    global.window.File = global.File;
    global.window.DataTransfer = global.DataTransfer;
    window.ResumeBot = window.ResumeBot || {};

    const result = detectModule.detectATS(global.document);
    assert.deepStrictEqual(result, { ats: 'workday', confidence: 0.7 });
  });

  it('should detect iCIMS from DOM signature', () => {
    global.dom = new JSDOM('<!DOCTYPE html><html><body><div class="icims-widget"></div></body></html>', { 
      url: 'https://company.com/careers',
      pretendToBeVisual: true 
    });
    global.window = global.dom.window;
    global.document = global.dom.window.document;
    global.window.File = global.File;
    global.window.DataTransfer = global.DataTransfer;
    window.ResumeBot = window.ResumeBot || {};

    const result = detectModule.detectATS(global.document);
    assert.deepStrictEqual(result, { ats: 'icims', confidence: 0.7 });
  });

  it('should return null for unknown ATS', () => {
    global.dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { 
      url: 'https://unknown-ats.com/jobs',
      pretendToBeVisual: true 
    });
    global.window = global.dom.window;
    global.document = global.dom.window.document;
    global.window.File = global.File;
    global.window.DataTransfer = global.DataTransfer;
    window.ResumeBot = window.ResumeBot || {};

    const result = detectModule.detectATS(global.document);
    assert.strictEqual(result, null);
  });
});

describe('Greenhouse Adapter', () => {
  it('should have correct name', () => {
    const adapter = greenhouseAdapter.greenhouse();
    assert.strictEqual(adapter.name, 'greenhouse');
  });

  it('should detect Greenhouse form', () => {
    global.dom = new JSDOM('<!DOCTYPE html><html><body><div id="grnhse_app"></div></body></html>', { 
      url: 'http://localhost',
      pretendToBeVisual: true 
    });
    global.window = global.dom.window;
    global.document = global.dom.window.document;
    global.window.File = global.File;
    global.window.DataTransfer = global.DataTransfer;
    window.ResumeBot = window.ResumeBot || {};
    const adapter = greenhouseAdapter.greenhouse();
    assert.strictEqual(adapter.detect(global.document), true);
  });

  it('should return false for non-Greenhouse form', () => {
    global.dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { 
      url: 'http://localhost',
      pretendToBeVisual: true 
    });
    global.window = global.dom.window;
    global.document = global.dom.window.document;
    global.window.File = global.File;
    global.window.DataTransfer = global.DataTransfer;
    window.ResumeBot = window.ResumeBot || {};
    const adapter = greenhouseAdapter.greenhouse();
    assert.strictEqual(adapter.detect(global.document), false);
  });

  it('should have selector map with expected keys', () => {
    const adapter = greenhouseAdapter.greenhouse();
    assert.ok(adapter.selectorMap.hasOwnProperty('identity.firstName'));
    assert.ok(adapter.selectorMap.hasOwnProperty('identity.lastName'));
    assert.ok(adapter.selectorMap.hasOwnProperty('identity.email'));
    assert.ok(adapter.selectorMap.hasOwnProperty('identity.phone'));
    assert.ok(adapter.selectorMap.hasOwnProperty('documents.resume.filename'));
    assert.ok(adapter.selectorMap.hasOwnProperty('identity.linkedin'));
    assert.ok(adapter.selectorMap.hasOwnProperty('identity.website'));
    assert.ok(adapter.selectorMap.hasOwnProperty('education.0.school'));
    assert.ok(adapter.selectorMap.hasOwnProperty('education.0.degree'));
    assert.ok(adapter.selectorMap.hasOwnProperty('education.0.field'));
  });
});

describe('Lever Adapter', () => {
  it('should have correct name', () => {
    const adapter = leverAdapter.lever();
    assert.strictEqual(adapter.name, 'lever');
  });

  it('should detect Lever form', () => {
    global.dom = new JSDOM('<!DOCTYPE html><html><body><div class="application-form"></div></body></html>', { 
      url: 'http://localhost',
      pretendToBeVisual: true 
    });
    global.window = global.dom.window;
    global.document = global.dom.window.document;
    global.window.File = global.File;
    global.window.DataTransfer = global.DataTransfer;
    window.ResumeBot = window.ResumeBot || {};
    const adapter = leverAdapter.lever();
    assert.strictEqual(adapter.detect(global.document), true);
  });

  it('should return false for non-Lever form', () => {
    global.dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { 
      url: 'http://localhost',
      pretendToBeVisual: true 
    });
    global.window = global.dom.window;
    global.document = global.dom.window.document;
    global.window.File = global.File;
    global.window.DataTransfer = global.DataTransfer;
    window.ResumeBot = window.ResumeBot || {};
    const adapter = leverAdapter.lever();
    assert.strictEqual(adapter.detect(global.document), false);
  });

  it('should have selector map with expected keys', () => {
    const adapter = leverAdapter.lever();
    assert.ok(adapter.selectorMap.hasOwnProperty('identity.firstName'));
    assert.ok(adapter.selectorMap.hasOwnProperty('identity.lastName'));
    assert.ok(adapter.selectorMap.hasOwnProperty('identity.email'));
    assert.ok(adapter.selectorMap.hasOwnProperty('identity.phone'));
    assert.ok(adapter.selectorMap.hasOwnProperty('documents.resume.filename'));
    assert.ok(adapter.selectorMap.hasOwnProperty('identity.linkedin'));
    assert.ok(adapter.selectorMap.hasOwnProperty('identity.website'));
    assert.ok(adapter.selectorMap.hasOwnProperty('work.org'));

    // Lever special case: firstName and lastName should be null (handled specially)
    assert.strictEqual(adapter.selectorMap['identity.firstName'], null);
    assert.strictEqual(adapter.selectorMap['identity.lastName'], null);
  });
});

describe('Generic Adapter', () => {
  it('should have correct name', () => {
    const adapter = genericAdapter.generic();
    assert.strictEqual(adapter.name, 'generic');
  });

  it('should always return false for detect', () => {
    const adapter = genericAdapter.generic();
    assert.strictEqual(adapter.detect(), false);
  });

  it('should have empty selector map', () => {
    const adapter = genericAdapter.generic();
    assert.deepStrictEqual(adapter.selectorMap, {});
  });

  it('should have no-op fillField', () => {
    const adapter = genericAdapter.generic();
    assert.strictEqual(typeof adapter.fillField, 'function');
    // Should not throw when called
    assert.doesNotThrow(() => adapter.fillField(null, 'test', {}));
  });

  it('should have no-op onNavigation', () => {
    const adapter = genericAdapter.generic();
    assert.strictEqual(typeof adapter.onNavigation, 'function');
    // Should return a function
    const disconnect = adapter.onNavigation(() => {});
    assert.strictEqual(typeof disconnect, 'function');
  });
});

describe('Resume Injection', () => {
  it('should handle file input in Greenhouse adapter', () => {
    global.dom = new JSDOM(`<!DOCTYPE html><html><body>
      <div id="grnhse_app">
        <input type="file" name="resume" />
      </div>
    </body></html>`, { 
      url: 'http://localhost',
      pretendToBeVisual: true 
    });
    global.window = global.dom.window;
    global.document = global.dom.window.document;
    global.window.File = global.File;
    global.window.DataTransfer = global.DataTransfer;
    window.ResumeBot = window.ResumeBot || {};
    const adapter = greenhouseAdapter.greenhouse();
    const fileInput = global.document.querySelector('input[type="file"][name="resume"]');

    const ctx = {
      fileData: {
        filename: 'resume.pdf',
        mime: 'application/pdf',
        bytes: [1, 2, 3, 4]
      },
      filler: {
        attachFile: (input, fileData, deps) => {
          // Verify it was called with correct parameters
          assert.strictEqual(input, fileInput);
          assert.strictEqual(fileData.filename, 'resume.pdf');
          assert.strictEqual(fileData.mime, 'application/pdf');
          assert.ok(deps.File);
          assert.ok(deps.DataTransfer);
          return true;
        }
      }
    };

    const result = adapter.fillField(fileInput, '', ctx);
    assert.strictEqual(result, true);
  });

  it('should handle file input in Lever adapter', () => {
    global.dom = new JSDOM(`<!DOCTYPE html><html><body>
      <div class="application-form">
        <input type="file" id="resume" />
      </div>
    </body></html>`, { 
      url: 'http://localhost',
      pretendToBeVisual: true 
    });
    global.window = global.dom.window;
    global.document = global.dom.window.document;
    global.window.File = global.File;
    global.window.DataTransfer = global.DataTransfer;
    window.ResumeBot = window.ResumeBot || {};
    const adapter = leverAdapter.lever();
    const fileInput = global.document.querySelector('input[type="file"][id="resume"]');

    const ctx = {
      fileData: {
        filename: 'cv.pdf',
        mime: 'application/pdf',
        bytes: [5, 6, 7, 8]
      },
      filler: {
        attachFile: (input, fileData, deps) => {
          assert.strictEqual(input, fileInput);
          assert.strictEqual(fileData.filename, 'cv.pdf');
          assert.strictEqual(fileData.mime, 'application/pdf');
          assert.ok(deps.File);
          assert.ok(deps.DataTransfer);
          return true;
        }
      }
    };

    const result = adapter.fillField(fileInput, '', ctx);
    assert.strictEqual(result, true);
  });
});