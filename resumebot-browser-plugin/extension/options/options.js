// options.js - Profile editor for ResumeBot extension
(function () {
  "use strict";

  const STORES = {
    PROFILE: 'profile',
    QA_MEMORY: 'qaMemory',
    SITE_REGISTRY: 'siteRegistry'
  };

  // DOM elements
  const form = document.querySelector('form') || document.body; // fallback if no form tag
  const saveButton = document.getElementById('save-button');
  const savedMessage = document.getElementById('saved-message');

  // Identity elements
  const identityFirstName = document.getElementById('identity-firstName');
  const identityLastName = document.getElementById('identity-lastName');
  const identityEmail = document.getElementById('identity-email');
  const identityPhone = document.getElementById('identity-phone');
  const identityLinkedIn = document.getElementById('identity-linkedin');
  const identityWebsite = document.getElementById('identity-website');

  // Address elements
  const addressStreet = document.getElementById('address-street');
  const addressCity = document.getElementById('address-city');
  const addressState = document.getElementById('address-state');
  const addressZip = document.getElementById('address-zip');
  const addressCountry = document.getElementById('address-country');

  // Work elements
  const workAuthorized = document.getElementById('work-authorized');
  const workSponsorship = document.getElementById('work-sponsorship');
  const workRemotePreference = document.getElementById('work-remotePreference');
  const workSalaryExpectation = document.getElementById('work-salaryExpectation');
  const workStartDate = document.getElementById('work-startDate');
  const workNoticePeriod = document.getElementById('work-noticePeriod');

  // EEO elements
  const eeoGender = document.getElementById('eeo-gender');
  const eeoGenderPrefer = document.getElementById('eeo-gender-prefer');
  const eeoRace = document.getElementById('eeo-race');
  const eeoRacePrefer = document.getElementById('eeo-race-prefer');
  const eeoVeteranStatus = document.getElementById('eeo-veteranStatus');
  const eeoVeteranStatusPrefer = document.getElementById('eeo-veteranStatus-prefer');
  const eeoDisabilityStatus = document.getElementById('eeo-disabilityStatus');
  const eeoDisabilityStatusPrefer = document.getElementById('eeo-disabilityStatus-prefer');

  // Education elements
  const educationContainer = document.getElementById('education-container');
  const addEducationButton = document.getElementById('add-education');

  // Employment elements
  const employmentContainer = document.getElementById('employment-container');
  const addEmploymentButton = document.getElementById('add-employment');

  // Documents elements
  const resumeInput = document.getElementById('documents-resume');
  const resumeInfo = document.getElementById('resume-info');
  const removeResumeButton = document.getElementById('remove-resume');
  const coverLetterTemplate = document.getElementById('documents-coverLetterTemplate');

  // ATS Overrides elements
  const atsOverridesContainer = document.getElementById('ats-overrides-container');
  const atsTypeSelect = document.getElementById('ats-type-select');
  const atsDomainInput = document.getElementById('ats-domain-input');
  const addAtsOverrideButton = document.getElementById('add-ats-override');

  // Send message to service worker and return promise
  function sendMessage(action, data = null) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ action, data }, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
  }

  // Initialize the options page
  async function init() {
    await loadProfile();
    await loadSiteRegistry();
    await loadQAMemory();
    setupEventListeners();
    setupQAEventListeners();
    setupATSEventListeners();
    setupExportImportEventListeners();
  }

  // Load profile from service worker and populate the form
  async function loadProfile() {
    try {
      const response = await sendMessage('getProfile');
      const profile = (response && response.success) ? response.data : getDefaultProfile();

      // Populate identity
      identityFirstName.value = profile.identity.firstName || '';
      identityLastName.value = profile.identity.lastName || '';
      identityEmail.value = profile.identity.email || '';
      identityPhone.value = profile.identity.phone || '';
      identityLinkedIn.value = profile.identity.linkedin || '';
      identityWebsite.value = profile.identity.website || '';

      // Populate address
      addressStreet.value = profile.address.street || '';
      addressCity.value = profile.address.city || '';
      addressState.value = profile.address.state || '';
      addressZip.value = profile.address.zip || '';
      addressCountry.value = profile.address.country || 'US';

      // Populate work
      workAuthorized.value = profile.work.authorized || '';
      workSponsorship.value = profile.work.sponsorship || '';
      workRemotePreference.value = profile.work.remotePreference || '';
      workSalaryExpectation.value = profile.work.salaryExpectation || '';
      workStartDate.value = profile.work.startDate || '';
      workNoticePeriod.value = workNoticePeriod.value || '';

      // Populate EEO
      eeoGender.value = profile.eeo.gender || '';
      eeoGenderPrefer.checked = profile.eeo.genderPreferNotToAnswer || false;
      eeoRace.value = profile.eeo.race || '';
      eeoRacePrefer.checked = profile.eeo.racePreferNotToAnswer || false;
      eeoVeteranStatus.value = profile.eeo.veteranStatus || '';
      eeoVeteranStatusPrefer.checked = profile.eeo.veteranStatusPreferNotToAnswer || false;
      eeoDisabilityStatus.value = profile.eeo.disabilityStatus || '';
      eeoDisabilityStatusPrefer.checked = profile.eeo.disabilityStatusPreferNotToAnswer || false;

      // Populate education
      educationContainer.innerHTML = '';
      (profile.education || [{ school: '', degree: '', field: '', startYear: '', endYear: '' }]).forEach((edu, index) => {
        addEducationRow(edu, index);
      });

      // Populate employment
      employmentContainer.innerHTML = '';
      (profile.employment || [{ company: '', title: '', location: '', startDate: '', endDate: '', current: false, description: '' }]).forEach((emp, index) => {
        addEmploymentRow(emp, index);
      });

      // Populate documents
      if (profile.documents && profile.documents.resume) {
        resumeInfo.textContent = `${profile.documents.resume.filename || 'No file selected'} (${profile.documents.resume.mime || 'unknown'})`;
        // Note: We can't set the file input value for security reasons
      } else {
        resumeInfo.textContent = 'No file selected';
      }
      coverLetterTemplate.value = profile.documents?.coverLetterTemplate || '';
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }

  // Load siteRegistry from service worker and populate ATS overrides
  async function loadSiteRegistry() {
    try {
      const response = await sendMessage('getSiteRegistry');
      const siteRegistry = (response && response.success) ? response.data : getDefaultSiteRegistry();
      
      // Populate ATS overrides
      atsOverridesContainer.innerHTML = '';
      (siteRegistry.atsOverrides || []).forEach((override, index) => {
        addAtsOverrideRow(override, index);
      });
    } catch (error) {
      console.error('Error loading siteRegistry:', error);
    }
  }

  // Save the profile via service worker
  async function saveProfile() {
    try {
      const profile = {
        identity: {
          firstName: identityFirstName.value.trim(),
          lastName: identityLastName.value.trim(),
          email: identityEmail.value.trim(),
          phone: identityPhone.value.trim(),
          linkedin: identityLinkedIn.value.trim(),
          website: identityWebsite.value.trim()
        },
        address: {
          street: addressStreet.value.trim(),
          city: addressCity.value.trim(),
          state: addressState.value.trim(),
          zip: addressZip.value.trim(),
          country: addressCountry.value.trim() || 'US'
        },
        work: {
          authorized: workAuthorized.value,
          sponsorship: workSponsorship.value,
          remotePreference: workRemotePreference.value,
          salaryExpectation: workSalaryExpectation.value.trim(),
          startDate: workStartDate.value,
          noticePeriod: workNoticePeriod.value.trim()
        },
        eeo: {
          gender: eeoGender.value.trim(),
          genderPreferNotToAnswer: eeoGenderPrefer.checked,
          race: eeoRace.value.trim(),
          racePreferNotToAnswer: eeoRacePrefer.checked,
          veteranStatus: eeoVeteranStatus.value.trim(),
          veteranStatusPreferNotToAnswer: eeoVeteranStatusPrefer.checked,
          disabilityStatus: eeoDisabilityStatus.value.trim(),
          disabilityStatusPreferNotToAnswer: eeoDisabilityStatusPrefer.checked
        },
        education: getEducationRows(),
        employment: getEmploymentRows(),
        documents: {
          resume: await getResumeData(),
          coverLetterTemplate: coverLetterTemplate.value.trim()
        }
      };

      const response = await sendMessage('setProfile', profile);

      if (response.success) {
        // Show saved message
        savedMessage.style.display = 'block';
        setTimeout(() => {
          savedMessage.style.display = 'none';
        }, 2000);
      } else {
        throw new Error(response.error || 'Failed to save profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Error saving profile: ' + error.message);
    }
  }

  // Save siteRegistry via service worker
  async function saveSiteRegistry() {
    try {
      const siteRegistry = {
        atsOverrides: getAtsOverridesRows()
      };

      const response = await sendMessage('setSiteRegistry', siteRegistry);

      if (!response.success) {
        throw new Error(response.error || 'Failed to save siteRegistry');
      }
    } catch (error) {
      console.error('Error saving siteRegistry:', error);
      alert('Error saving siteRegistry: ' + error.message);
    }
  }

  // Get default profile structure
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

  // Get default siteRegistry structure
  function getDefaultSiteRegistry() {
    return {
      atsOverrides: []
    };
  }

  // Setup event listeners
  function setupEventListeners() {
    if (saveButton) {
      saveButton.addEventListener('click', (e) => {
        e.preventDefault();
        saveProfile();
        saveSiteRegistry(); // Save siteRegistry when saving profile
      });
    }

    if (addEducationButton) {
      addEducationButton.addEventListener('click', () => {
        addEducationRow();
      });
    }

    if (addEmploymentButton) {
      addEmploymentButton.addEventListener('click', () => {
        addEmploymentRow();
      });
    }

    if (removeResumeButton) {
      removeResumeButton.addEventListener('click', () => {
        resumeInput.value = '';
        resumeInfo.textContent = 'No file selected';
      });
    }

    if (resumeInput) {
      resumeInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          resumeInfo.textContent = `${file.name} (${file.type || 'unknown'})`;
        } else {
          resumeInfo.textContent = 'No file selected';
        }
      });
    }
  }

  // Add an education row to the container
  function addEducationRow(data = { school: '', degree: '', field: '', startYear: '', endYear: '' }, index) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'repeatable-group';
    rowDiv.innerHTML = `
      <div class="repeatable-group-header">
        <h3>Education ${index + 1}</h3>
        <button type="button" class="remove-row">Remove</button>
      </div>
      <label for="education-${index}-school">School</label>
      <input type="text" id="education-${index}-school" placeholder="School" value="${data.school || ''}">
      
      <label for="education-${index}-degree">Degree</label>
      <input type="text" id="education-${index}-degree" placeholder="Degree" value="${data.degree || ''}">
      
      <label for="education-${index}-field">Field of Study</label>
      <input type="text" id="education-${index}-field" placeholder="Field of Study" value="${data.field || ''}">
      
      <label for="education-${index}-startYear">Start Year</label>
      <input type="text" id="education-${index}-startYear" placeholder="Start Year" value="${data.startYear || ''}">
      
      <label for="education-${index}-endYear">End Year</label>
      <input type="text" id="education-${index}-endYear" placeholder="End Year" value="${data.endYear || ''}">
    `;

    const removeButton = rowDiv.querySelector('.remove-row');
    removeButton.addEventListener('click', () => {
      rowDiv.remove();
    });

    educationContainer.appendChild(rowDiv);
  }

  // Add an employment row to the container
  function addEmploymentRow(data = { company: '', title: '', location: '', startDate: '', endDate: '', current: false, description: '' }, index) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'repeatable-group';
    rowDiv.innerHTML = `
      <div class="repeatable-group-header">
        <h3>Employment ${index + 1}</h3>
        <button type="button" class="remove-row">Remove</button>
      </div>
      <label for="employment-${index}-company">Company</label>
      <input type="text" id="employment-${index}-company" placeholder="Company" value="${data.company || ''}">
      
      <label for="employment-${index}-title">Title</label>
      <input type="text" id="employment-${index}-title" placeholder="Title" value="${data.title || ''}">
      
      <label for="employment-${index}-location">Location</label>
      <input type="text" id="employment-${index}-location" placeholder="Location" value="${data.location || ''}">
      
      <label for="employment-${index}-startDate">Start Date</label>
      <input type="date" id="employment-${index}-startDate" value="${data.startDate || ''}">
      
      <label for="employment-${index}-endDate">End Date</label>
      <input type="date" id="employment-${index}-endDate" value="${data.endDate || ''}">
      
      <label for="employment-${index}-current">Current Position</label>
      <input type="checkbox" id="employment-${index}-current" ${data.current ? 'checked' : ''}>
      
      <label for="employment-${index}-description">Description</label>
      <textarea id="employment-${index}-description" rows="3" placeholder="Job description">${data.description || ''}</textarea>
    `;

    const removeButton = rowDiv.querySelector('.remove-row');
    removeButton.addEventListener('click', () => {
      rowDiv.remove();
    });

    employmentContainer.appendChild(rowDiv);
  }

  // Get all education rows from the form
  function getEducationRows() {
    const rows = [];
    const educationDivs = educationContainer.querySelectorAll('.repeatable-group');

    educationDivs.forEach((div, index) => {
      const school = div.querySelector(`#education-${index}-school`)?.value?.trim() || '';
      const degree = div.querySelector(`#education-${index}-degree`)?.value?.trim() || '';
      const field = div.querySelector(`#education-${index}-field`)?.value?.trim() || '';
      const startYear = div.querySelector(`#education-${index}-startYear`)?.value?.trim() || '';
      const endYear = div.querySelector(`#education-${index}-endYear`)?.value?.trim() || '';

      rows.push({ school, degree, field, startYear, endYear });
    });

    // Ensure at least one row exists
    if (rows.length === 0) {
      rows.push({ school: '', degree: '', field: '', startYear: '', endYear: '' });
    }

    return rows;
  }

  // Get all employment rows from the form
  function getEmploymentRows() {
    const rows = [];
    const employmentDivs = employmentContainer.querySelectorAll('.repeatable-group');

    employmentDivs.forEach((div, index) => {
      const company = div.querySelector(`#employment-${index}-company`)?.value?.trim() || '';
      const title = div.querySelector(`#employment-${index}-title`)?.value?.trim() || '';
      const location = div.querySelector(`#employment-${index}-location`)?.value?.trim() || '';
      const startDate = div.querySelector(`#employment-${index}-startDate`)?.value || '';
      const endDate = div.querySelector(`#employment-${index}-endDate`)?.value || '';
      const current = div.querySelector(`#employment-${index}-current`)?.checked || false;
      const description = div.querySelector(`#employment-${index}-description`)?.value?.trim() || '';

      rows.push({ company, title, location, startDate, endDate, current, description });
    });

    // Ensure at least one row exists
    if (rows.length === 0) {
      rows.push({ company: '', title: '', location: '', startDate: '', endDate: '', current: false, description: '' });
    }

    return rows;
  }

  // Get resume data from file input (returns base64 data)
  async function getResumeData() {
    const file = resumeInput.files[0];
    if (!file) {
      return { filename: '', mime: '', base64: '' };
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target.result.split(',')[1]; // Remove data URL prefix
        resolve({
          filename: file.name,
          mime: file.type,
          base64: base64
        });
      };
      reader.onerror = () => {
        resolve({ filename: '', mime: '', base64: '' });
      };
      reader.readAsDataURL(file);
    });
  }

  // Add an ATS override row to the container
  function addAtsOverrideRow(data = { atsType: '', domainPattern: '' }, index) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'ats-override-row';
    rowDiv.innerHTML = `
      <select>
        <option value="">-- Select ATS Type --</option>
        <option value="workday">Workday</option>
        <option value="greenhouse">Greenhouse</option>
        <option value="lever">Lever</option>
        <option value="icims">ICIMS</option>
      </select>
      <input type="text" placeholder="Domain pattern (e.g., company.myworkdayjobs.com)">
      <div class="ats-override-actions">
        <button type="button" class="remove-row">Remove</button>
      </div>
    `;
    
    // Set values if provided
    const select = rowDiv.querySelector('select');
    const input = rowDiv.querySelector('input');
    
    if (data.atsType) {
      select.value = data.atsType;
    }
    if (data.domainPattern) {
      input.value = data.domainPattern;
    }

    const removeButton = rowDiv.querySelector('.remove-row');
    removeButton.addEventListener('click', () => {
      rowDiv.remove();
    });

    atsOverridesContainer.appendChild(rowDiv);
  }

  // Get all ATS overrides rows from the form
  function getAtsOverridesRows() {
    const rows = [];
    const overrideDivs = atsOverridesContainer.querySelectorAll('.ats-override-row');

    overrideDivs.forEach((div, index) => {
      const select = div.querySelector('select');
      const input = div.querySelector('input');
      const atsType = select.value;
      const domainPattern = input.value.trim();
      
      // Only add if both fields have values
      if (atsType && domainPattern) {
        rows.push({ atsType, domainPattern });
      }
    });

    return rows;
  }

  // QA Memory Browser functions
  async function loadQAMemory() {
    try {
      const response = await sendMessage('qaList');
      console.log('QA list response:', response); // debug
      if (response && response.success && response.data && response.data.entries) {
        renderQATable(response.data.entries);
      } else {
        console.error('Failed to load QA memory:', response ? response.error : 'no response');
        renderQATable([]);
      }
    } catch (error) {
      console.error('Error loading QA memory:', error);
      renderQATable([]);
    }
  }

  function renderQATable(entries) {
    const tbody = document.getElementById('qa-table-body');
    tbody.innerHTML = ''; // clear

    entries.forEach(entry => {
      const tr = document.createElement('tr');
      tr.dataset.originalEntry = JSON.stringify(entry);

      // Build the td cells
      const questionTd = document.createElement('td');
      questionTd.textContent = entry.question;
      tr.appendChild(questionTd);

      const answerTd = document.createElement('td');
      answerTd.textContent = entry.answer;
      tr.appendChild(answerTd);

      const typeTd = document.createElement('td');
      typeTd.textContent = entry.type;
      tr.appendChild(typeTd);

      const timesUsedTd = document.createElement('td');
      timesUsedTd.textContent = entry.timesUsed;
      tr.appendChild(timesUsedTd);

      const firstSeenTd = document.createElement('td');
      firstSeenTd.textContent = `${entry.firstSeen.domain} ${entry.firstSeen.date}`;
      tr.appendChild(firstSeenTd);

      const reviewBeforeFillTd = document.createElement('td');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = entry.reviewBeforeFill;
      reviewBeforeFillTd.appendChild(checkbox);
      tr.appendChild(reviewBeforeFillTd);

      const actionsTd = document.createElement('td');
      const saveBtn = document.createElement('button');
      saveBtn.textContent = 'Save';
      saveBtn.className = 'save-btn';
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Delete';
      deleteBtn.className = 'delete-btn';
      actionsTd.appendChild(saveBtn);
      actionsTd.appendChild(deleteBtn);
      tr.appendChild(actionsTd);

      tbody.appendChild(tr);
    });
  }

  function setupQAEventListeners() {
    const tbody = document.getElementById('qa-table-body');

    // Handle row click to toggle editing
    tbody.addEventListener('click', async (e) => {
      const tr = e.target.closest('tr');
      if (!tr) return;

      // If the target is a button, let the button handlers deal with it
      if (e.target.matches('.save-btn') || e.target.matches('.delete-btn')) {
        return;
      }

      // Toggle editing class
      tr.classList.toggle('editing');
      if (tr.classList.contains('editing')) {
        // Switch to editing mode
        const entry = JSON.parse(tr.dataset.originalEntry);
        // Question td
        const questionTd = tr.children[0];
        questionTd.innerHTML = `<input type=\"text\" value=\"${entry.question}\">`;
        // Answer td
        const answerTd = tr.children[1];
        answerTd.innerHTML = `<input type=\"text\" value=\"${entry.answer}\">`;
        // Type td
        const typeTd = tr.children[2];
        // We need a select with options. We'll hardcode the options from the test: text, textarea
        typeTd.innerHTML = `
          <select>
            <option value=\"text\">text</option>
            <option value=\"textarea\">textarea</option>
          </select>
        `;
        // Set the select value to the current type
        const select = typeTd.querySelector('select');
        select.value = entry.type;
      } else {
        // Switch back to view mode: restore the original text
        const entry = JSON.parse(tr.dataset.originalEntry);
        tr.children[0].textContent = entry.question;
        tr.children[1].textContent = entry.answer;
        tr.children[2].textContent = entry.type;
      }
    });

    // Handle save button click
    tbody.addEventListener('click', async (e) => {
      if (!e.target.matches('.save-btn')) return;
      const tr = e.target.closest('tr');
      if (!tr) return;

      // Get the new values from the inputs
      const questionInput = tr.children[0].querySelector('input[type=\"text\"]');
      const answerInput = tr.children[1].querySelector('input[type=\"text\"]');
      const typeSelect = tr.children[2].querySelector('select');
      const checkbox = tr.children[5].querySelector('input[type=\"checkbox\"]'); // note: the checkbox is at index 5 (the 6th td)

      const newQuestion = questionInput.value;
      const newAnswer = answerInput.value;
      const newType = typeSelect.value;
      const newReviewBeforeFill = checkbox.checked;

      // Get the original entry to preserve key, timesUsed, firstSeen
      const originalEntry = JSON.parse(tr.dataset.originalEntry);

      // Build the entry to send
      const entryToSend = {
        key: originalEntry.key,
        question: newQuestion,
        answer: newAnswer,
        type: newType,
        timesUsed: originalEntry.timesUsed,
        firstSeen: originalEntry.firstSeen,
        reviewBeforeFill: newReviewBeforeFill
      };

      // Send the qaUpsert message
      try {
        const response = await new Promise((resolve, reject) => {
          chrome.runtime.sendMessage({ action: 'qaUpsert', entry: entryToSend }, (res) => {
            if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
            else resolve(res);
          });
        });
        if (!response.success) {
          throw new Error(response.error || 'Failed to upsert QA entry');
        }
        // Re-fetch the list to update the UI
        await loadQAMemory();
      } catch (err) {
        console.error('Error upserting QA entry:', err);
        alert('Error upserting QA entry: ' + err.message);
      }
    });

    // Handle delete button click
    tbody.addEventListener('click', async (e) => {
      if (!e.target.matches('.delete-btn')) return;
      const tr = e.target.closest('tr');
      if (!tr) return;

      const originalEntry = JSON.parse(tr.dataset.originalEntry);
      const key = originalEntry.key;

      try {
        const response = await new Promise((resolve, reject) => {
          chrome.runtime.sendMessage({ action: 'qaDelete', key }, (res) => {
            if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
            else resolve(res);
          });
        });
        if (!response.success) {
          throw new Error(response.error || 'Failed to delete QA entry');
        }
        // Re-fetch the list to update the UI
        await loadQAMemory();
      } catch (err) {
        console.error('Error deleting QA entry:', err);
        alert('Error deleting QA entry: ' + err.message);
      }
    });

    // Handle search input
    const searchInput = document.getElementById('qa-search-input');
    searchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase();
      const rows = tbody.querySelectorAll('tr');
      rows.forEach(row => {
        const questionText = row.children[0].textContent.toLowerCase();
        if (questionText.includes(searchTerm)) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }
      });
    });
  }

  // Setup ATS Overrides event listeners
  function setupATSEventListeners() {
    if (addAtsOverrideButton) {
      addAtsOverrideButton.addEventListener('click', () => {
        addAtsOverrideRow();
      });
    }
  }

  // Export/Import functions
  async function exportProfile() {
    try {
      // Get all data from service worker
      const [profileResp, siteRegistryResp, qaMemoryResp] = await Promise.all([
        sendMessage('getProfile'),
        sendMessage('getSiteRegistry'),
        sendMessage('qaList')
      ]);
     
      const profile = (profileResp && profileResp.success) ? profileResp.data : getDefaultProfile();
      const siteRegistry = (siteRegistryResp && siteRegistryResp.success) ? siteRegistryResp.data : getDefaultSiteRegistry();
      const qaMemory = (qaMemoryResp && qaMemoryResp.success && qaMemoryResp.data) ? qaMemoryResp.data : { entries: [] };
     
      // Combine into export object
      const exportData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        profile: profile,
        siteRegistry: siteRegistry,
        qaMemory: qaMemory
      };
     
      // Create blob and trigger download
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {type: 'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resumebot-export-${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(a);

      // Show saved message before triggering the click -- jsdom has no real
      // navigation handling and .click() on an anchor with a real href can
      // throw ("Not implemented: navigation"), which would otherwise skip
      // this feedback entirely.
      savedMessage.style.display = 'block';
      setTimeout(() => {
        savedMessage.style.display = 'none';
      }, 1500);

      a.click();
      // Note: Link cleanup handled by test's afterEach (jsdom cleanup)
    } catch (error) {
      console.error('Error exporting profile:', error);
      alert('Error exporting profile: ' + error.message);
    }
  }

  async function importProfile() {
    try {
      const fileInput = document.getElementById('import-file-input');
      const file = fileInput.files[0];
      if (!file) {
        alert('Please select a file to import');
        return;
      }
      
      const text = await file.text();
      let importData;
      try {
        importData = JSON.parse(text);
      } catch (e) {
        alert('Invalid JSON file');
        fileInput.value = '';
        return;
      }

      // Validate structure
      if (!importData.profile || !importData.siteRegistry || !importData.qaMemory) {
        alert('Invalid profile file: missing required sections');
        fileInput.value = '';
        return;
      }

      // Preview what will be imported
      const profileCount = Object.keys(importData.profile.identity || {}).filter(k => importData.profile.identity[k]).length;
      const qaCount = importData.qaMemory.entries?.length || 0;
      const atsCount = importData.siteRegistry.atsOverrides?.length || 0;

      if (!confirm(`Import profile with:\n-${profileCount} identity fields\n-${qaCount} QA entries\n-${atsCount} ATS overrides\n\nContinue?`)) {
        fileInput.value = '';
        return;
      }

      // Import data
      await sendMessage('setProfile', importData.profile);
      await sendMessage('setSiteRegistry', importData.siteRegistry);

      // For QA memory, we need to upsert each entry
      if (importData.qaMemory.entries) {
        for (const entry of importData.qaMemory.entries) {
          await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({ action: 'qaUpsert', entry }, (res) => {
              if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
              else resolve(res);
            });
          });
        }
      }

      // Reload the page to show imported data
      await loadProfile();
      await loadSiteRegistry();
      await loadQAMemory();

      savedMessage.style.display = 'block';
      setTimeout(() => {
        savedMessage.style.display = 'none';
      }, 1500);

      alert('Import successful!');
      fileInput.value = ''; // Reset file input
    } catch (error) {
      console.error('Error importing profile:', error);
      alert('Error importing profile: ' + error.message);
      fileInput.value = '';
    }
  }

  // Setup export/import event listeners
  function setupExportImportEventListeners() {
    const exportButton = document.getElementById('export-button');
    const importButton = document.getElementById('import-button');
    const importFileInput = document.getElementById('import-file-input');
    
    if (exportButton) {
      exportButton.addEventListener('click', async (e) => {
        e.preventDefault();
        await exportProfile();
      });
    }
    
    if (importButton) {
      importButton.addEventListener('click', (e) => {
        e.preventDefault();
        importFileInput.click();
      });
    }
    
    if (importFileInput) {
      importFileInput.addEventListener('change', (e) => {
        // The actual import happens when file is selected
        // We'll handle it in the importProfile function called by import button
        // But we can also trigger on change if desired
        importProfile();
      });
    }
  }

  // Initialize when DOM is loaded
  document.addEventListener('DOMContentLoaded', init);
  
  // Export init for testing (dual-environment pattern)
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { init };
  }
})();