const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

// Mock chrome.storage.local for testing
class MockStorage {
  constructor() {
    this.data = new Map();
  }
  
  async get(keys) {
    if (typeof keys === 'string') {
      return { [keys]: this.data.get(keys) };
    }
    const result = {};
    for (const key of keys) {
      result[key] = this.data.get(key);
    }
    return result;
  }
  
  async set(obj) {
    for (const [key, value] of Object.entries(obj)) {
      this.data.set(key, value);
    }
  }
}

// Mock chrome for testing
const mockChrome = {
  storage: {
    local: new MockStorage()
  }
};

// Define the functions we need to test
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

function mergeProfileWithDefaults(storedProfile) {
  if (!storedProfile) {
    return getDefaultProfile();
  }
  
  const defaultProfile = {
    identity: { firstName: '', lastName: '', email: '', phone: '', linkedin: '', website: '' },
    address: { street: '', city: '', state: '', zip: '', country: 'US' },
    work: { authorized: '', sponsorship: '', remotePreference: '', salaryExpectation: '', startDate: '', noticePeriod: '' },
    eeo: { gender: '', race: '', veteranStatus: '', disabilityStatus: '' },
    education: [{ school: '', degree: '', field: '', startYear: '', endYear: '' }],
    employment: [{ company: '', title: '', location: '', startDate: '', endDate: '', current: false, description: '' }],
    documents: { resume: { filename: '', mime: '', base64: '' }, coverLetterTemplate: '' }
  };
  
  // Start with defaults
  const merged = JSON.parse(JSON.stringify(defaultProfile)); // Deep clone
  
  // Override with stored values, preserving unknown keys
  for (const key in storedProfile) {
    if (key in merged && typeof storedProfile[key] === 'object' && storedProfile[key] !== null && !Array.isArray(storedProfile[key])) {
      // For nested objects, merge recursively
      merged[key] = { ...merged[key], ...storedProfile[key] };
    } else {
      // For primitives, arrays, or unknown keys, use stored value
      merged[key] = storedProfile[key];
    }
  }
  
  return merged;
}

// Mock getStore function that applies schema-defaulting merge for profile
async function mockGetStore(storeName) {
  const items = await mockChrome.storage.local.get(storeName);
  let data = items[storeName];
  
  // Apply schema-defaulting merge for profile store
  if (storeName === 'profile') {
    data = mergeProfileWithDefaults(data);
  }
  
  return data;
}

describe('profile store', () => {
  let store;
  
  beforeEach(async () => {
    // Reset mock storage before each test
    mockChrome.storage.local.data.clear();
    
    // Initialize default profile
    const defaultProfile = getDefaultProfile();
    await mockChrome.storage.local.set({ profile: defaultProfile });
    store = mockChrome.storage.local;
  });
  
  it('should load default profile when none exists', async () => {
    // Clear storage to simulate first run
    await mockChrome.storage.local.data.clear();
    
    const result = await mockGetStore('profile');
    assert.deepStrictEqual(result, getDefaultProfile());
  });
  
  it('should merge partial profile with defaults (schema-defaulting merge)', async () => {
    // Simulate a partial profile (like what might come from options form)
    const partialProfile = {
      identity: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
      address: { street: '123 Main St', city: 'Anytown' },
      work: { authorized: 'yes', salaryExpectation: '$100k' },
      education: [
        { school: 'MIT', degree: 'BS', field: 'Computer Science', startYear: '2015', endYear: '2019' }
      ]
    };
    
    // Save the partial profile
    await mockChrome.storage.local.set({ profile: partialProfile });
    
    // Get the merged profile
    const result = await mockGetStore('profile');
    
    // Verify that specified values are preserved
    assert.strictEqual(result.identity.firstName, 'John');
    assert.strictEqual(result.identity.lastName, 'Doe');
    assert.strictEqual(result.identity.email, 'john@example.com');
    assert.strictEqual(result.address.street, '123 Main St');
    assert.strictEqual(result.address.city, 'Anytown');
    assert.strictEqual(result.work.authorized, 'yes');
    assert.strictEqual(result.work.salaryExpectation, '$100k');
    assert.strictEqual(result.education[0].school, 'MIT');
    assert.strictEqual(result.education[0].degree, 'BS');
    assert.strictEqual(result.education[0].field, 'Computer Science');
    assert.strictEqual(result.education[0].startYear, '2015');
    assert.strictEqual(result.education[0].endYear, '2019');
    
    // Verify that unspecified fields get defaults
    assert.strictEqual(result.identity.phone, '');
    assert.strictEqual(result.identity.linkedin, '');
    assert.strictEqual(result.identity.website, '');
    assert.strictEqual(result.address.state, '');
    assert.strictEqual(result.address.zip, '');
    assert.strictEqual(result.address.country, 'US'); // default country
    assert.strictEqual(result.work.sponsorship, '');
    assert.strictEqual(result.work.remotePreference, '');
    assert.strictEqual(result.work.startDate, '');
    assert.strictEqual(result.work.noticePeriod, '');
    assert.strictEqual(result.eeo.gender, '');
    assert.strictEqual(result.eeo.race, '');
    assert.strictEqual(result.eeo.veteranStatus, '');
    assert.strictEqual(result.eeo.disabilityStatus, '');
    // Employment should get default array
    assert(Array.isArray(result.employment));
    assert.strictEqual(result.employment.length, 1);
    assert.strictEqual(result.employment[0].company, '');
    assert.strictEqual(result.employment[0].title, '');
    assert.strictEqual(result.employment[0].location, '');
    assert.strictEqual(result.employment[0].startDate, '');
    assert.strictEqual(result.employment[0].endDate, '');
    assert.strictEqual(result.employment[0].current, false);
    assert.strictEqual(result.employment[0].description, '');
    // Documents should get default values
    assert.strictEqual(result.documents.resume.filename, '');
    assert.strictEqual(result.documents.resume.mime, '');
    assert.strictEqual(result.documents.resume.base64, '');
    assert.strictEqual(result.documents.coverLetterTemplate, '');
  });
  
  it('should preserve unknown keys (forward compatibility)', async () => {
    // Simulate a profile with a future field that we don't know about yet
    const profileWithFutureField = {
      identity: { firstName: 'Jane', lastName: 'Smith' },
      // Some future field that current version doesn't handle
      futureField: 'some value',
      anotherFutureField: { nested: 'data' },
      address: { street: '456 Oak Ave' },
      work: { authorized: 'no' }
    };
    
    await mockChrome.storage.local.set({ profile: profileWithFutureField });
    
    const result = await mockGetStore('profile');
    
    // Verify known fields are preserved
    assert.strictEqual(result.identity.firstName, 'Jane');
    assert.strictEqual(result.identity.lastName, 'Smith');
    assert.strictEqual(result.address.street, '456 Oak Ave');
    assert.strictEqual(result.work.authorized, 'no');
    
    // Verify unknown fields are preserved (forward compatibility)
    assert.strictEqual(result.futureField, 'some value');
    assert.deepStrictEqual(result.anotherFutureField, { nested: 'data' });
    
    // Verify unspecified known fields get defaults
    assert.strictEqual(result.identity.email, '');
    assert.strictEqual(result.identity.phone, '');
    assert.strictEqual(result.address.city, '');
    assert.strictEqual(result.address.state, '');
    assert.strictEqual(result.address.zip, '');
    assert.strictEqual(result.address.country, 'US');
  });
  
  it('should handle empty education and employment arrays correctly', async () => {
      // Test with explicitly empty arrays
      const profileWithEmptyArrays = {
        identity: { firstName: 'Test', lastName: 'User' },
        education: [],  // Empty array
        employment: []  // Empty array
      };
      
      await mockChrome.storage.local.set({ profile: profileWithEmptyArrays });
      
      const result = await mockGetStore('profile');
      
      // Verify arrays remain empty (they should be preserved as-is)
      assert(Array.isArray(result.education));
      assert.strictEqual(result.education.length, 0);
      assert(Array.isArray(result.employment));
      assert.strictEqual(result.employment.length, 0);
      
      // Verify other fields work correctly
      assert.strictEqual(result.identity.firstName, 'Test');
      assert.strictEqual(result.identity.lastName, 'User');
    });
});