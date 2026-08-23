// test/filler.test.js
const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const sinon = require('sinon');

// Create a DOM for testing
function createDom(html = '<input type="text">') {
  return new JSDOM(`
    <!DOCTYPE html>
    <html>
      <body>
        ${html}
      </body>
    </html>
  `, { 
    url: 'http://localhost',
    pretendToBeVisual: true 
  });
}

describe('filler.js', () => {
  let dom;
  let fillerApi;
  
  beforeEach(() => {
    // Reset module cache
    delete require.cache[require.resolve('../extension/content/filler.js')];
    
    // Create fresh DOM and properly set up globals like scanner test does
    dom = createDom();
    
    // THIS IS THE KEY: JSDOM needs to attach to global scope for the module to access window/document
    global.window = dom.window;
    global.document = dom.window.document;
    
    // NOW require the filler module - it will use the globals we just set
    fillerApi = require('../extension/content/filler.js');
    
    // Also set up ResumeBot on window as the content script would
    window.ResumeBot = window.ResumeBot || {};
    window.ResumeBot.filler = fillerApi;
  });
  
  afterEach(() => {
    // Clean up globals
    delete global.window;
    delete global.document;
    
    // Clean up
    dom.window.close();
  });
  
  describe('text inputs', () => {
    it('uses native setter and fires events in order for text inputs', () => {
      // Create a controlled input spy
      const input = document.createElement('input');
      input.type = 'text';
      document.body.appendChild(input);
      
      // Mock the prototype descriptor to spy on setter
      const setterSpy = sinon.spy();
      Object.defineProperty(window.HTMLInputElement.prototype, 'value', {
        set: setterSpy,
        configurable: true
      });
      
      // Fill the field
      fillerApi.fillAll([
        { 
          input: input, 
          value: 'test value',
          tag: 'INPUT',
          type: 'text'
        }
      ], {});
      
      // Expect native setter to have been called
      assert.ok(setterSpy.calledWith('test value'));
      
      // Restore original descriptor
      delete window.HTMLInputElement.prototype.value;
    });
  });
  
  describe('select elements', () => {
    it('matches option by value', () => {
      const select = document.createElement('select');
      select.innerHTML = `
        <option value="">--Select--</option>
        <option value="yes">Yes</option>
        <option value="no">No</option>
      `;
      document.body.appendChild(select);
      
      fillerApi.fillAll([
        { 
          input: select, 
          value: 'yes',
          tag: 'SELECT',
          type: 'select-one'
        }
      ], {});
      
      assert.strictEqual(select.value, 'yes');
    });
    
    it('matches option by visible text (case-insensitive)', () => {
      const select = document.createElement('select');
      select.innerHTML = `
        <option value="">--Select--</option>
        <option value="yes">Yes</option>
        <option value="no">No</option>
      `;
      document.body.appendChild(select);
      
      fillerApi.fillAll([
        { 
          input: select, 
          value: 'YES', // uppercase
          tag: 'SELECT',
          type: 'select-one'
        }
      ], {});
      
      assert.strictEqual(select.value, 'yes');
    });
  });
  
  describe('checkboxes and radios', () => {
    it('clicks the input for checkboxes', () => {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      document.body.appendChild(checkbox);
      
      const clickSpy = sinon.spy(checkbox, 'click');
      
      fillerApi.fillAll([
        { 
          input: checkbox, 
          value: true,
          tag: 'INPUT',
          type: 'checkbox'
        }
      ], {});
      
      assert.ok(clickSpy.calledOnce);
      
      clickSpy.restore();
    });
    
    it('clicks the label when input is visually hidden', () => {
      const label = document.createElement('label');
      label.textContent = 'Option 1';
      document.body.appendChild(label);
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.style.opacity = '0'; // visually hidden
      label.appendChild(checkbox);
      
      const labelClickSpy = sinon.spy(label, 'click');
      
      fillerApi.fillAll([
        { 
          input: checkbox, 
          value: true,
          tag: 'INPUT',
          type: 'checkbox'
        }
      ], {});
      
      assert.ok(labelClickSpy.calledOnce);
      
      labelClickSpy.restore();
    });
  });
  
  describe('date inputs', () => {
    // ATS date fields are usually text inputs whose placeholder names the
    // format; real <input type="date"> only accepts ISO per the HTML spec.
    it('formats date for MM/DD/YYYY format from placeholder', async () => {
      const input = document.createElement('input');
      input.type = 'text';
      input.placeholder = 'MM/DD/YYYY';
      document.body.appendChild(input);

      await fillerApi.fillAll([
        { input: input, value: '2026-07-22', tag: 'INPUT', type: 'text' }
      ], {}, { delayMs: 0 });

      assert.strictEqual(input.value, '07/22/2026');
    });

    it('formats date for DD/MM/YYYY format from placeholder', async () => {
      const input = document.createElement('input');
      input.type = 'text';
      input.placeholder = 'DD/MM/YYYY';
      document.body.appendChild(input);

      await fillerApi.fillAll([
        { input: input, value: '2026-07-22', tag: 'INPUT', type: 'text' }
      ], {}, { delayMs: 0 });

      assert.strictEqual(input.value, '22/07/2026');
    });

    it('fills native date inputs with ISO regardless of placeholder', async () => {
      const input = document.createElement('input');
      input.type = 'date';
      input.placeholder = 'MM/DD/YYYY';
      document.body.appendChild(input);

      await fillerApi.fillAll([
        { input: input, value: '2026-07-22', tag: 'INPUT', type: 'date' }
      ], {}, { delayMs: 0 });

      assert.strictEqual(input.value, '2026-07-22');
    });
  });
  
  describe('file inputs', () => {
    it('attaches file via DataTransfer (mocked)', async () => {
      const input = document.createElement('input');
      input.type = 'file';
      document.body.appendChild(input);

      const events = [];
      input.addEventListener('change', (e) => events.push(e.type));

      // Counting stubs injected through the deps seam (jsdom has no DataTransfer)
      let dtCalls = 0;
      let fileCalls = 0;
      const added = [];
      function MockDataTransfer() {
        dtCalls++;
        this.items = { add: (f) => added.push(f) };
        this.files = [];
      }
      function MockFile(bits, name, opts) {
        fileCalls++;
        this.name = name;
        this.type = opts && opts.type;
      }

      await fillerApi.fillAll([
        {
          input: input,
          value: {
            base64: 'dGVzdCBmaWxl', // "test file" base64
            filename: 'test.txt',
            mime: 'text/plain'
          },
          tag: 'INPUT',
          type: 'file'
        }
      ], {}, { delayMs: 0, deps: { DataTransfer: MockDataTransfer, File: MockFile } });

      assert.strictEqual(dtCalls, 1);
      assert.strictEqual(fileCalls, 1);
      assert.strictEqual(added.length, 1);
      assert.strictEqual(added[0].name, 'test.txt');
      assert.deepStrictEqual(events, ['change']);
    });
  });
  
  describe('hard rails', () => {
    it('never fills password fields', () => {
      const input = document.createElement('input');
      input.type = 'password';
      document.body.appendChild(input);
     
      const setterSpy = sinon.spy();
      Object.defineProperty(window.HTMLInputElement.prototype, 'value', {
        set: setterSpy,
        configurable: true
      });
     
      fillerApi.fillAll([
        {
          input: input,
          value: 'secret',
          tag: 'INPUT',
          type: 'password'
        }
      ], {});
     
      assert.ok(!setterSpy.called);
     
      // Restore original descriptor
      delete window.HTMLInputElement.prototype.value;
    });
  });
  
  describe('sequential fill with delay', () => {
    it('waits between fields', async () => {
      const input1 = document.createElement('input');
      input1.type = 'text';
      document.body.appendChild(input1);

      const input2 = document.createElement('input');
      input2.type = 'text';
      document.body.appendChild(input2);

      // Track order via the input events the filler dispatches — no
      // monkey-patching of module internals (closures make that a no-op).
      const fillOrder = [];
      input1.addEventListener('input', () => fillOrder.push(1));
      input2.addEventListener('input', () => fillOrder.push(2));

      const start = Date.now();
      await fillerApi.fillAll([
        { input: input1, value: 'first', tag: 'INPUT', type: 'text' },
        { input: input2, value: 'second', tag: 'INPUT', type: 'text' }
      ], {}, { delayMs: 10 });

      assert.deepStrictEqual(fillOrder, [1, 2]);
      assert.strictEqual(input1.value, 'first');
      assert.strictEqual(input2.value, 'second');
      // Two fields with a 10ms gap each — at least ~15ms must have elapsed
      assert.ok(Date.now() - start >= 15);
    });
  });
  
  // Test the attachFile helper directly
  describe('attachFile helper', () => {
    it('creates File and DataTransfer objects correctly', () => {
      const input = document.createElement('input');
      input.type = 'file';
      document.body.appendChild(input);

      const events = [];
      input.addEventListener('change', (e) => events.push(e.type));

      let dtCalls = 0;
      const added = [];
      const fileArgs = [];
      function MockDataTransfer() {
        dtCalls++;
        this.items = { add: (f) => added.push(f) };
        this.files = [];
      }
      function MockFile(bits, name, opts) {
        fileArgs.push({ name, type: opts && opts.type, byteLength: bits[0].length });
        this.name = name;
      }

      fillerApi.attachFile(input, {
        base64: 'dGVzdCBmaWxl', // "test file" base64
        filename: 'test.txt',
        mime: 'text/plain'
      }, {
        DataTransfer: MockDataTransfer,
        File: MockFile
      });

      assert.strictEqual(dtCalls, 1);
      assert.strictEqual(fileArgs.length, 1);
      assert.strictEqual(fileArgs[0].name, 'test.txt');
      assert.strictEqual(fileArgs[0].type, 'text/plain');
      assert.strictEqual(fileArgs[0].byteLength, 9); // "test file" decoded
      assert.strictEqual(added.length, 1);
      assert.deepStrictEqual(events, ['change']);
    });
  });
});