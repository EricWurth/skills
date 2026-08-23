import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import scanner from '../extension/content/scanner.js';
import { JSDOM } from 'jsdom';

describe('scanner', () => {
  let dom;
  let doc;

  beforeEach(() => {
    // Load the test fixture
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
          <title>Scanner Test Fixture</title>
      </head>
      <body>
          <form id="test-form">
              <!-- labeled input (label-for) -->
              <label for="first-name">First Name:</label>
              <input type="text" id="first-name" name="firstName">
              
              <!-- labeled input (wrapping) -->
              <label>Last Name: <input type="text" name="lastName"></label>
              
              <!-- aria-label field -->
              <input type="email" aria-label="Email Address" name="email">
              
              <!-- aria-labelledby field -->
              <div id="phone-label">Phone Number:</div>
              <input type="tel" aria-labelledby="phone-label" name="phone">
              
              <!-- select -->
              <label for="country">Country:</label>
              <select id="country" name="country">
                  <option value="">Select country</option>
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
              </select>
              
              <!-- textarea -->
              <label for="bio">Bio:</label>
              <textarea id="bio" name="bio"></textarea>
              
              <!-- radios in a fieldset with legend -->
              <fieldset>
                  <legend>Gender:</legend>
                  <label><input type="radio" name="gender" value="male"> Male</label>
                  <label><input type="radio" name="gender" value="female"> Female</label>
                  <label><input type="radio" name="gender" value="other"> Other</label>
              </fieldset>
              
              <!-- open shadow root containing an input -->
              <div id="shadow-host"></div>
              
              <!-- unlabeled input following a text node -->
              <span>Favorite Color: </span>
              <input type="text" name="favoriteColor">
              
              <!-- hidden input (should be ignored) -->
              <input type="hidden" name="hiddenField" value="hidden">
              
              <!-- submit button (should be ignored) -->
              <button type="submit">Submit</button>
          </form>
      </body>
      </html>
    `;
    
    dom = new JSDOM(html, { runScripts: "dangerously" });
    doc = dom.window.document;
    
    // Set up shadow root for testing
    const shadowHost = doc.getElementById('shadow-host');
    const shadowRoot = shadowHost.attachShadow({ mode: 'open' });
    const shadowInput = doc.createElement('input');
    shadowInput.type = 'text';
    shadowInput.name = 'shadowField';
    shadowInput.placeholder = 'Shadow Input';
    shadowRoot.appendChild(shadowInput);
  });

  it('scanner finds all fillable fields', () => {
    // Provide a visibility override for jsdom (since offsetParent is always null)
    // Also provide a frameUrl for testing
    const fields = scanner.scanFields(doc, { isVisible: () => true, frameUrl: 'http://test.example.com' });
    
    // Should find: firstName, lastName, email, phone, country, bio, gender (3 radios), favoriteColor, shadowField
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
    
    const phoneField = fields.find(f => f.attributes.name === 'phone');
    assert.ok(phoneField);
    assert.strictEqual(phoneField.label, 'Phone Number:');
    assert.strictEqual(phoneField.labelSource, 'aria-labelledby');
    assert.strictEqual(phoneField.frameUrl, 'http://test.example.com');
    
    const countryField = fields.find(f => f.attributes.name === 'country');
    assert.ok(countryField);
    assert.strictEqual(countryField.tag, 'select');
    assert.strictEqual(countryField.label, 'Country:');
    assert.strictEqual(countryField.labelSource, 'label-for');
    assert.strictEqual(countryField.frameUrl, 'http://test.example.com');
    
    const bioField = fields.find(f => f.attributes.name === 'bio');
    assert.ok(bioField);
    assert.strictEqual(bioField.tag, 'textarea');
    assert.strictEqual(bioField.label, 'Bio:');
    assert.strictEqual(bioField.labelSource, 'label-for');
    assert.strictEqual(bioField.frameUrl, 'http://test.example.com');
    
    const genderFields = fields.filter(f => f.attributes.name === 'gender');
    assert.strictEqual(genderFields.length, 3);
    genderFields.forEach((field, index) => {
      // The group's question is the legend; each radio's own text is optionLabel.
      assert.strictEqual(field.labelSource, 'legend');
      assert.strictEqual(field.label, 'Gender:');
      assert.ok(field.optionLabel, 'radio keeps its own option text');
      assert.strictEqual(field.groupName, 'gender');
      assert.strictEqual(field.frameUrl, 'http://test.example.com');
    });
    
    const favoriteColorField = fields.find(f => f.attributes.name === 'favoriteColor');
    assert.ok(favoriteColorField);
    assert.strictEqual(favoriteColorField.label, 'Favorite Color:');
    assert.strictEqual(favoriteColorField.labelSource, 'preceding-text');
    assert.strictEqual(favoriteColorField.frameUrl, 'http://test.example.com');
    
    const shadowField = fields.find(f => f.attributes.name === 'shadowField');
    assert.ok(shadowField);
    assert.strictEqual(shadowField.label, 'Shadow Input');
    assert.strictEqual(shadowField.labelSource, 'placeholder');
    assert.strictEqual(shadowField.frameUrl, 'http://test.example.com');
    
    // Hidden input and submit button should NOT be found
    const hiddenField = fields.find(f => f.attributes.name === 'hiddenField');
    assert.strictEqual(hiddenField, undefined);
    
    const submitButton = fields.find(f => f.tag === 'button' && f.type === 'submit');
    assert.strictEqual(submitButton, undefined);
  });

  it('isVisible function works correctly', () => {
    // Test with default implementation (jsdom will have offsetParent null)
    const el = doc.createElement('div');
    assert.strictEqual(scanner.isVisible(el), false); // offsetParent is null
    
    // Test with override
    assert.strictEqual(scanner.isVisible(el, { isVisible: () => true }), true);
    assert.strictEqual(scanner.isVisible(el, { isVisible: () => false }), false);
  });
});