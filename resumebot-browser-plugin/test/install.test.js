'use strict';

const { test } = require('node:test');
const { execSync } = require('child_process');
const { readFileSync, existsSync } = require('fs');
const { join } = require('path');
const { tmpdir } = require('os');

test('install.sh creates manifest and config correctly', () => {
  // Create a temporary directory to act as HOME
  const tempHome = join(tmpdir(), 'resumebot-test-' + Date.now());
  // Ensure the directory exists
  execSync(`mkdir -p ${tempHome}`);

  // Define test values
  const testExtensionId = 'abcdefghijklmnopqrstuvwxyz123456';
  const testAccountName = 'test@example.com';

  // Determine platform for expected host directory
  const platform = process.platform;
  let expectedHostDir;
  if (platform === 'linux') {
    expectedHostDir = join(tempHome, '.config', 'google-chrome', 'NativeMessagingHosts');
  } else if (platform === 'darwin') {
    expectedHostDir = join(tempHome, 'Library', 'Application Support', 'Google', 'Chrome', 'NativeMessagingHosts');
  } else {
    // Windows is not tested in this headless environment; skip or adapt if needed
    // For the purpose of this test, we assume Linux-like environment (the CI runs on Linux)
    expectedHostDir = join(tempHome, '.config', 'google-chrome', 'NativeMessagingHosts');
  }

  // Set environment variables
  const env = { ...process.env, HOME: tempHome };

  // Run the install script with our test values
  const scriptPath = join(__dirname, '..', 'native-host', 'install.sh');
  execSync(`bash ${scriptPath} ${testExtensionId} ${testAccountName}`, { stdio: 'ignore', env });

  // Check that the manifest file was created
  const manifestPath = join(expectedHostDir, 'com.resumebot.op.json');
  if (!existsSync(manifestPath)) {
    throw new Error(`Manifest not found at ${manifestPath}`);
  }
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  if (manifest.name !== 'com.resumebot.op') {
    throw new Error('Manifest name incorrect');
  }
  if (manifest.description !== 'ResumeBot 1Password host') {
    throw new Error('Manifest description incorrect');
  }
  // The path must be an executable: the generated launcher that pins node's path.
  const expectedHostPath = join(__dirname, '..', 'native-host', 'run-host.sh');
  if (manifest.path !== expectedHostPath) {
    throw new Error(`Manifest path incorrect. Expected ${expectedHostPath}, got ${manifest.path}`);
  }
  const launcher = readFileSync(expectedHostPath, 'utf8');
  if (!launcher.includes('host.js') || !launcher.includes('exec ')) {
    throw new Error('Launcher does not exec host.js');
  }
  if (manifest.type !== 'stdio') {
    throw new Error('Manifest type incorrect');
  }
  const allowedOrigin = `chrome-extension://${testExtensionId}/`;
  if (!manifest.allowed_origins.includes(allowedOrigin)) {
    throw new Error(`Manifest allowed_origins does not contain ${allowedOrigin}`);
  }

  // Check that the config file was created
  const configPath = join(__dirname, '..', 'native-host', 'config.json');
  if (!existsSync(configPath)) {
    throw new Error(`Config not found at ${configPath}`);
  }
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  if (config.accountName !== testAccountName) {
    throw new Error(`Config accountName incorrect. Expected ${testAccountName}, got ${config.accountName}`);
  }

  // Optionally, check that install.sh has no syntax errors (bash -n)
  execSync('bash -n ' + scriptPath, { stdio: 'ignore' });

  // Clean up: remove the temporary directory
  execSync(`rm -rf ${tempHome}`);
});