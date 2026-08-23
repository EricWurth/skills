const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const scanner = require('../extension/content/scanner.js');
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

describe('scanner with fixture file', () => {
  let dom;
  let doc;

  beforeEach(() => {
    // Load the test fixture from file
    const fixturePath = path.join(__dirname, 'fixtures', 'scanner-test.html');
    const html = fs.readFileSync(fixturePath, 'utf8');
    
    dom = new JSDOM(html, { runScripts: "dangerously" });
    doc = dom.window.document;

    // Set up shadow root for testing (since the fixture has a shadow host)
    const shadowHost = doc.getElementById('shadow-host');
    const shadowRoot = shadowHost.attachShadow({ mode: 'open' });
    const shadowInput = doc.createElement('input');
    shadowInput.type = 'text';
    shadowInput.name = 'shadowField';
    shadowInput.placeholder = 'Shadow Input';
    shadowRoot.appendChild(shadowInput);
  });

  it('scanner finds all fillable fields from fixture file', () => {
    // Provide a visibility override for jsdom (since offsetParent is always null)
    // Also provide a frameUrl for testing
    const fields = scanner.scanFields(doc, { isVisible: () => true, frameUrl: 'http://test.example.com' });

    // Should find: firstName, lastName, email, email2, department, bio, gender (3 radios), startDate, shadowField
    // That's 1 + 1 + 1 + 1 + 1 + 1 + 3 + 1 + 1 = 11 fields
    assert.strictEqual(fields.length, 11);

    // Check specific fields
    const firstNameField = fields.find(f => f.attributes.name === 'firstName');
    assert.ok(firstNameField);
    assert.strictEqual(firstNameField.label, 'First Name:');
    assert.strictEqual(firstNameField.labelSource, 'label-for');
    assert.strictEqual(firstNameField.frameUrl, 'http://test.example.com');

    const lastNameField = fields.find(f => f.attributes.name === 'lastName');
    assert.ok(lastNameField);
    assert.strictEqual(lastNameField.label, 'Last Name:');
    assert.strictEqual(lastNameField.labelSource, 'wrapping-label');
    assert.strictEqual(lastNameField.frameUrl, 'http://test.example.com');

    const emailField = fields.find(f => f.attributes.name === 'email');
    assert.ok(emailField);
    assert.strictEqual(emailField.label, 'Email Address');
    assert.strictEqual(emailField.labelSource, 'aria-label');
    assert.strictEqual(emailField.frameUrl, 'http://test.example.com');

    const email2Field = fields.find(f => f.attributes.name === 'email2');
    assert.ok(email2Field);
    assert.strictEqual(email2Field.label, 'Email:');
    assert.strictEqual(email2Field.labelSource, 'aria-labelledby');
    assert.strictEqual(email2Field.frameUrl, 'http://test.example.com');

    const departmentField = fields.find(f => f.attributes.name === 'department');
    assert.ok(departmentField);
    assert.strictEqual(departmentField.tag, 'select');
    assert.strictEqual(departmentField.label, 'Select Department');
    assert.strictEqual(departmentField.labelSource, 'placeholder');
    assert.strictEqual(departmentField.frameUrl, 'http://test.example.com');

    const bioField = fields.find(f => f.attributes.name === 'bio');
    assert.ok(bioField);
    assert.strictEqual(bioField.tag, 'textarea');
    assert.strictEqual(bioField.label, 'Tell us about yourself');
    assert.strictEqual(bioField.labelSource, 'placeholder');
    assert.strictEqual(bioField.frameUrl, 'http://test.example.com');

    const genderFields = fields.filter(f => f.attributes.name === 'gender');
    assert.strictEqual(genderFields.length, 3);
    genderFields.forEach((field, index) => {
      // The group's question is the legend; each radio's own text is optionLabel.
      assert.strictEqual(field.labelSource, 'legend');
      assert.strictEqual(field.label, 'Gender');
      assert.ok(field.optionLabel, 'radio keeps its own option text');
      assert.strictEqual(field.groupName, 'gender');
      assert.strictEqual(field.frameUrl, 'http://test.example.com');
    });

    const startDateField = fields.find(f => f.attributes.name === 'startDate');
    assert.ok(startDateField);
    assert.strictEqual(startDateField.label, 'Preferred Start Date:');
    assert.strictEqual(startDateField.labelSource, 'preceding-text');
    assert.strictEqual(startDateField.frameUrl, 'http://test.example.com');

    const shadowField = fields.find(f => f.attributes.name === 'shadowField');
    assert.ok(shadowField);
    assert.strictEqual(shadowField.label, 'Shadow Input');
    assert.strictEqual(shadowField.labelSource, 'placeholder');
    assert.strictEqual(shadowField.frameUrl, 'http://test.example.com');
  });
});