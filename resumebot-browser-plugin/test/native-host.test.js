'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('assert').strict;
const { spawn } = require('child_process');
const { Buffer } = require('buffer');

// Helper to create a length-prefixed message as per Chrome native messaging spec
function createLengthPrefixedMessage(obj) {
  const payload = Buffer.from(JSON.stringify(obj));
  const length = Buffer.alloc(4);
  length.writeUInt32LE(payload.length, 0);
  return Buffer.concat([length, payload]);
}

// Helper to parse a length-prefixed message from stdout
function parseLengthPrefixedMessage(buffer) {
  if (buffer.length < 4) {
    return null;
  }
  const length = buffer.readUInt32LE(0);
  if (buffer.length < 4 + length) {
    return null;
  }
  const payload = buffer.slice(4, 4 + length);
  return JSON.parse(payload.toString());
}

describe('Native Host', () => {
  let hostProcess;
  let stdoutBuffer = Buffer.alloc(0);
  let stderrBuffer = Buffer.alloc(0);

  afterEach(() => {
    if (hostProcess) {
      hostProcess.kill();
      hostProcess = null;
    }
    stdoutBuffer = Buffer.alloc(0);
    stderrBuffer = Buffer.alloc(0);
  });

  function startHost() {
    hostProcess = spawn('node', ['../native-host/host.js'], {
      cwd: __dirname,
      env: {
        ...process.env,
        RESUMEBOT_TEST_MODE: 'true',
      },
    });

    // Collect stdout and stderr
    hostProcess.stdout.on('data', (chunk) => {
      stdoutBuffer = Buffer.concat([stdoutBuffer, chunk]);
    });

    hostProcess.stderr.on('data', (chunk) => {
      stderrBuffer = Buffer.concat([stderrBuffer, chunk]);
    });

    return new Promise((resolve, reject) => {
      hostProcess.on('error', (err) => {
        reject(err);
      });

      // Wait for process to be ready (simple timeout for now)
      setTimeout(() => {
        resolve({ stdoutBuffer, stderrBuffer });
      }, 1000);
    });
  }

  function sendMessage(message) {
    return new Promise((resolve) => {
      const msgBuf = createLengthPrefixedMessage(message);
      hostProcess.stdin.write(msgBuf);

      // Collect response
      let responseBuffer = Buffer.alloc(0);

      const timeout = setTimeout(() => {
        hostProcess.stdin.pause();
        resolve(parseLengthPrefixedMessage(responseBuffer));
      }, 5000);

      hostProcess.stdout.on('data', (chunk) => {
        responseBuffer = Buffer.concat([responseBuffer, chunk]);

        // Try to parse a complete message
        const parsed = parseLengthPrefixedMessage(responseBuffer);
        if (parsed !== null) {
          clearTimeout(timeout);
          hostProcess.stdin.pause();
          resolve(parsed);
        }
      });
    });
  }

  describe('check command', () => {
    it('should return exists=false when no matching login item', async () => {
      // Clear any mock env vars that might interfere
      delete process.env.MOCK_LIST;
      await startHost();

      const response = await sendMessage({ cmd: 'check', domain: 'example.com' });

      assert.deepStrictEqual(response, { exists: false });
    });

    it('should return exists=true and itemId when matching login item found', async () => {
      // Set mock to return a list with one matching item
      process.env.MOCK_LIST = JSON.stringify([
        {
          id: 'item123',
          category: 'Login',
          websites: [{ label: 'website', url: 'https://example.com', autofillBehavior: 'AnywhereOnWebsite' }]
        }
      ]);
      await startHost();

      const response = await sendMessage({ cmd: 'check', domain: 'example.com' });

      assert.deepStrictEqual(response, { exists: true, itemId: 'item123' });
      // Clean up
      delete process.env.MOCK_LIST;
    });
  });

  describe('create command', () => {
    it('should create a login item and return itemId and password', async () => {
      // Set up mocks
      process.env.MOCK_GENERATE_PASSWORD = 'GeneratedPass123!';
      process.env.MOCK_CREATE_RESOLVE = JSON.stringify({ id: 'item456' });
      await startHost();

      const response = await sendMessage({
        cmd: 'create',
        domain: 'example.com',
        username: 'testuser',
        title: 'Test Login'
      });

      assert.deepStrictEqual(response, {
        itemId: 'item456',
        password: 'GeneratedPass123!'
      });
      // Clean up
      delete process.env.MOCK_GENERATE_PASSWORD;
      delete process.env.MOCK_CREATE_RESOLVE;
    });

    it('should return locked error when SDK throws LockedError during create', async () => {
      // Set up mocks
      process.env.MOCK_GENERATE_PASSWORD = 'pass';
      process.env.MOCK_CREATE_RESOLVE = 'reject:LockedError';
      await startHost();

      const response = await sendMessage({
        cmd: 'create',
        domain: 'example.com',
        username: 'testuser'
      });

      assert.deepStrictEqual(response, { error: 'locked' });
      // Clean up
      delete process.env.MOCK_GENERATE_PASSWORD;
      delete process.env.MOCK_CREATE_RESOLVE;
    });
  });

  describe('get command', () => {
    it('should return username and password from item', async () => {
      // Set up mock
      process.env.MOCK_GET_RESOLVE = JSON.stringify({
        id: 'item789',
        fields: [
          { id: 'username', title: 'username', fieldType: 'Text', value: 'testuser' },
          { id: 'password', title: 'password', fieldType: 'Concealed', value: 'testpass' },
          { id: 'notesPlain', title: 'notes', fieldType: 'Text', value: 'some notes' }
        ]
      });
      await startHost();

      const response = await sendMessage({ cmd: 'get', itemId: 'item789' });

      assert.deepStrictEqual(response, {
        username: 'testuser',
        password: 'testpass'
      });
      // Clean up
      delete process.env.MOCK_GET_RESOLVE;
    });

    it('should return locked error when SDK throws LockedError during get', async () => {
      // Set up mock
      process.env.MOCK_GET_RESOLVE = 'reject:LockedError';
      await startHost();

      const response = await sendMessage({ cmd: 'get', itemId: 'item789' });

      assert.deepStrictEqual(response, { error: 'locked' });
      // Clean up
      delete process.env.MOCK_GET_RESOLVE;
    });
  });

  describe('unknown command', () => {
    it('should return unknown_cmd error', async () => {
      await startHost();

      const response = await sendMessage({ cmd: 'unknown', foo: 'bar' });

      assert.deepStrictEqual(response, { error: 'unknown_cmd' });
    });
  });

  describe('malformed frame handling', () => {
    it('should not crash on malformed input', async () => {
      const { stdoutBuffer } = await startHost();

      // Send garbage data that's not length-prefixed JSON
      hostProcess.stdin.write('not a valid message');

      // Give it a moment to process, then check it's still alive
      await new Promise(resolve => setTimeout(resolve, 100));

      // Process should still be running
      const exitCode = hostProcess.exitCode;
      assert.strictEqual(exitCode, null); // null means still running

      // Clean up
      hostProcess.kill();
    });
  });
});