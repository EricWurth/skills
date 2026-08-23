// matcher.js
// matching pipeline (tiers 1-3)
(function (root) {
  "use strict";

  // --- Synonyms dictionary (Tier 1) ---
  // This is the content of extension/content/synonyms.json
  const SYNONYMS = {
    "identity.firstName": [
      "fname",
      "first_name",
      "firstname",
      "first-name",
      "givenname",
      "given-name",
      "legalname--firstname",
      "given name",
      "legal first name"
    ],
    "identity.lastName": [
      "lname",
      "last_name",
      "lastname",
      "last-name",
      "surname",
      "familyname",
      "family-name",
      "legalname--lastname",
      "family name",
      "legal last name"
    ],
    "identity.fullName": [
      "fullname",
      "full-name",
      "full_name",
      "your-name",
      "yourname",
      "applicant-name",
      "candidate-name"
    ],
    "identity.email": [
      "email",
      "e-mail",
      "emailaddress",
      "email-address"
    ],
    "identity.phone": [
      "phone",
      "telephone",
      "tel",
      "telephone-number",
      "phone-number",
      "mobile",
      "cell",
      "cellphone"
    ],
    "identity.linkedin": [
      "linkedin",
      "linkedin-url",
      "linkedinprofile",
      "linkedin profile"
    ],
    "identity.website": [
      "website",
      "personal-website",
      "website-url",
      "homepage",
      "personal website"
    ],
    "address.street": [
      "street",
      "street-address",
      "addressline1",
      "address-line-1",
      "addrline1",
      "addr line 1",
      "address1",
      "address line 1"
    ],
    "address.addressline2": [
      "addressline2",
      "address-line-2",
      "addrline2",
      "addr line 2",
      "address2",
      "address line 2",
      "address-line-2",
      "street address 2"
    ],
    "address.city": [
      "city",
      "town",
      "locality",
      "municipality"
    ],
    "address.state": [
      "state",
      "province",
      "region",
      "stateprovince",
      "state-province"
    ],
    "address.zip": [
      "zip",
      "zipcode",
      "zip-code",
      "postalcode",
      "postal-code",
      "postcode"
    ],
    "address.country": [
      "country",
      "countrycode",
      "country-code",
      "nation"
    ],
    "work.authorized": [
      "authorized",
      "workauthorized",
      "work-authorized",
      "eligible",
      "eligibility",
      "workeligibility",
      "work-eligibility",
      "authorizedtowork",
      "authorized-to-work",
      "workauthorization",
      "work-authorization"
    ],
    "work.sponsorship": [
      "sponsorship",
      "visasponsorship",
      "visa-sponsorship",
      "requiresponsorship",
      "requires-sponsorship",
      "sponsorshiprequired",
      "sponsorship-required",
      "h1b",
      "h1-b",
      "h1bvisa",
      "h1b visa"
    ],
    "work.remotePreference": [
      "remote",
      "remotepreference",
      "remote-preference",
      "remotework",
      "remote-work",
      "telecommute",
      "telecommuting",
      "workfromhome",
      "work-from-home",
      "remote"
    ],
    "work.salaryExpectation": [
      "salary",
      "salaryexpectation",
      "salary-expectation",
      "expectedsalary",
      "expected-salary",
      "compensation",
      "compensationexpectation",
      "compensation-expectation",
      "salaryrange",
      "salary-range"
    ],
    "work.startDate": [
      "startdate",
      "start-date",
      "dateavailable",
      "date-available",
      "availablefrom",
      "available-from",
      "start",
      "availability"
    ],
    "work.noticePeriod": [
      "notice",
      "noticeperiod",
      "notice-period",
      "noticeperiod",
      "notice-period",
      "terminationnotice",
      "termination-notice"
    ],
    "eeo.gender": [
      "gender",
      "sex",
      "genderidentity",
      "gender-identity"
    ],
    "eeo.race": [
      "race",
      "ethnicity",
      "ethnicorigin",
      "ethnic-origin",
      "racialbackground",
      "racial-background"
    ],
    "eeo.veteranStatus": [
      "veteran",
      "veteranstatus",
      "veteran-status",
      "militaryservice",
      "military-service",
      "protectedveteran",
      "protected-veteran"
    ],
    "eeo.disabilityStatus": [
      "disability",
      "disabilitystatus",
      "disability-status",
      "disability",
      "handicap",
      "disabled"
    ],
    "education.0.school": [
      "school",
      "schoolname",
      "school-name",
      "institution",
      "college",
      "university"
    ],
    "education.0.degree": [
      "degree",
      "degreetype",
      "degree-type",
      "educationlevel",
      "education-level"
    ],
    "education.0.field": [
      "field",
      "fieldofstudy",
      "field-of-study",
      "major",
      "majors",
      "subject",
      "courseofstudy",
      "course-of-study"
    ],
    "education.0.startYear": [
      "startyear",
      "start-year",
      "fromyear",
      "from-year",
      "startdate",
      "start-date"
    ],
    "education.0.endYear": [
      "endyear",
      "end-year",
      "yearto",
      "year-to",
      "enddate",
      "end-date"
    ],
    "employment.0.company": [
      "company",
      "companyname",
      "company-name",
      "employer",
      "employername",
      "employer-name",
      "organization"
    ],
    "employment.0.title": [
      "title",
      "jobtitle",
      "job-title",
      "position",
      "jobposition",
      "job-position",
      "role",
      "designation"
    ],
    "employment.0.location": [
      "location",
      "joblocation",
      "job-location",
      "worklocation",
      "work-location",
      "place",
      "citystate"
    ],
    "employment.0.startDate": [
      "startdate",
      "start-date",
      "fromdate",
      "from-date",
      "start",
      "begin"
    ],
    "employment.0.endDate": [
      "enddate",
      "end-date",
      "todate",
      "to-date",
      "end",
      "finish"
    ],
    "employment.0.current": [
      "current",
      "currentlyemployed",
      "currently-employed",
      "present",
      "stillworking",
      "still-working"
    ],
    "employment.0.description": [
      "description",
      "jobdescription",
      "job-description",
      "responsibilities",
      "duties",
      "workexperience",
      "work-experience"
    ],
    "documents.resume.filename": [
      "resume",
      "cv",
      "curriculumvitae",
      "curriculum-vitae",
      "resumefile",
      "cvfile"
    ],
    "documents.coverLetterTemplate": [
      "coverletter",
      "cover-letter",
      "coverlettertemplate",
      "cover-letter-template",
      "coverletterdoc",
      "cover-letter-doc"
    ]
  };

  // --- Labels map (Tier 2, part A) ---
  const LABELS_MAP = {
    "identity.firstName": ["first name", "given name", "legal first name"],
    "identity.lastName": ["last name", "family name", "legal last name"],
    "identity.fullName": ["full name", "your name"],
    "identity.email": ["email address", "e-mail"],
    "identity.phone": ["phone number", "telephone number", "mobile number"],
    "identity.linkedin": ["LinkedIn profile", "LinkedIn URL"],
    "identity.website": ["personal website", "website URL"],
    "address.street": ["street address", "address line 1"],
    "address.addressline2": ["address line 2"],
    "address.city": ["city", "town"],
    "address.state": ["state", "province"],
    "address.zip": ["ZIP code", "postal code"],
    "address.country": ["country"],
    "work.authorized": ["work authorized", "eligibility to work", "authorized to work", "legally authorized to work in the united states", "are you legally authorized to work in the united states", "are you authorized to work in the country where this job is located"],
    "work.sponsorship": ["visa sponsorship", "requires sponsorship", "require sponsorship", "will you now or in the future require sponsorship", "will you now or in the future require sponsorship for employment visa status", "do you require sponsorship"],
    "work.remotePreference": ["remote work preference", "telecommuting"],
    "work.salaryExpectation": ["salary expectation", "expected compensation"],
    "work.startDate": ["start date", "date available"],
    "work.noticePeriod": ["notice period", "termination notice"],
    "eeo.gender": ["gender"],
    "eeo.race": ["race", "ethnicity"],
    "eeo.veteranStatus": ["veteran status", "military service"],
    "eeo.disabilityStatus": ["disability status"],
    "education.0.school": ["school name"],
    "education.0.degree": ["degree type"],
    "education.0.field": ["field of study", "major"],
    "education.0.startYear": ["start year"],
    "education.0.endYear": ["end year"],
    "employment.0.company": ["company name", "employer"],
    "employment.0.title": ["job title", "position"],
    "employment.0.location": ["job location"],
    "employment.0.startDate": ["start date"],
    "employment.0.endDate": ["end date"],
    "employment.0.current": ["currently employed"],
    "employment.0.description": ["job description", "responsibilities"],
    "documents.resume.filename": ["resume file"],
    "documents.coverLetterTemplate": ["cover letter template"]
  };

  // --- Helper functions ---
  function common() {
    return (root.ResumeBot && root.ResumeBot.common) ||
      (typeof require === "function" ? require("./common.js") : null);
  }

  function normalizeString(str) {
    if (!str) return "";
    return str.toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function tokenSet(str) {
    const normalized = normalizeString(str);
    return normalized ? new Set(normalized.split(/\s+/)) : new Set();
  }

  function tokenSetOverlapRatio(set1, set2) {
    if (set1.size === 0 && set2.size === 0) return 1.0;
    let intersection = 0;
    for (const x of set1) if (set2.has(x)) intersection++;
    const union = set1.size + set2.size - intersection;
    return union === 0 ? 0 : intersection / union;
  }

  // Split an attribute value into lowercase word tokens: camelCase, kebab,
  // snake and "--" all become boundaries. "legalName--firstName" ->
  // ["legal","name","first","name"].
  function attrTokens(value) {
    if (!value) return [];
    return String(value)
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean);
  }

  // Tokenized view of an attribute value, computed once per value.
  function attrView(value) {
    const tokens = attrTokens(value);
    const boundaries = new Set([0]);
    let acc = 0;
    for (const t of tokens) { acc += t.length; boundaries.add(acc); }
    return { joined: tokens.join(""), boundaries };
  }

  // A synonym matches an attribute when it equals the attribute (1.0), or
  // equals a contiguous run of the attribute's tokens (0.9). The old
  // "substring in either direction" rule matched `end` inside `gender`
  // and `tel` inside `hotel`; token boundaries stop that.
  function viewMatchesSyn(view, syn) {
    if (!syn || !view.joined) return 0;
    if (view.joined === syn) return 1.0;
    if (syn.length < 4) return 0;
    let idx = view.joined.indexOf(syn);
    while (idx !== -1) {
      if (view.boundaries.has(idx) && view.boundaries.has(idx + syn.length)) return 0.9;
      idx = view.joined.indexOf(syn, idx + 1);
    }
    return 0;
  }

  function attrMatchesSynonym(attrValue, synonym) {
    return viewMatchesSyn(attrView(attrValue), attrTokens(synonym).join(""));
  }

  // Pre-tokenized dictionaries, cached per dictionary object so the
  // synonym list is tokenized once per page, not once per field.
  const dictCache = new WeakMap();
  function compiledSynonyms(dict) {
    let c = dictCache.get(dict);
    if (!c) {
      c = [];
      for (const [profilePath, syns] of Object.entries(dict)) {
        for (const synonym of syns) c.push({ profilePath, syn: attrTokens(synonym).join("") });
      }
      dictCache.set(dict, c);
    }
    return c;
  }
  const LABEL_TOKENS = Object.entries(LABELS_MAP).map(([profilePath, labels]) =>
    ({ profilePath, sets: labels.map(tokenSet) }));

  // Stable identity for a field on a given ATS, used by the remap override
  // map. Prefers the most specific attribute, falls back to the label.
  function fieldKey(field) {
    const a = field.attributes || {};
    const raw = a["data-automation-id"] || a.id || a.name || field.label || "";
    return String(raw).trim().toLowerCase();
  }

  function isResumePath(p) {
    return typeof p === "string" && p.indexOf("documents.resume") === 0;
  }

  function qaMatch(entry, confidence, tier, source) {
    return {
      qaKey: entry.key,
      tier: tier,
      confidence: confidence,
      source: source,
      answer: entry.answer,
      answerType: entry.answerType,
      selectValueAliases: entry.selectValueAliases || [],
      reviewBeforeFill: !!entry.reviewBeforeFill
    };
  }

  // qa-memory lookup for a field: exact normalized question, then fuzzy.
  function qaLookup(field, labelSet, qa) {
    if (field.questionNormalized) {
      const exact = qa.entries.find(e => e.questionNormalized && e.questionNormalized === field.questionNormalized);
      if (exact) return qaMatch(exact, 1.0, 2, "qa-memory");
    }
    let best = null;
    for (let i = 0; i < qa.entries.length; i++) {
      const ratio = tokenSetOverlapRatio(labelSet, qa.sets[i]);
      if (ratio >= 0.75 && (!best || ratio > best.confidence)) best = qaMatch(qa.entries[i], ratio, 2, "qa-memory");
    }
    return best;
  }

  // --- Main matching function ---
  /**
   * Match scanned fields against profile and qa-memory. First match wins:
   * override map -> adapter selector map -> attributes -> labels/qa-memory.
   * An EEO field whose profile value is empty falls through to qa-memory so
   * a "decline to self-identify" captured once is reused, never guessed.
   * @param {Array<Object>} fields - Array of field objects from scanner.scanFields
   * @param {Object} profile - The user's profile object
   * @param {Object} qaMemory - The qa-memory object ({ entries: [...] })
   * @param {Object} [opts]
   * @param {Object} [opts.synonyms]   - attribute synonym dictionary (defaults to the built-in one)
   * @param {Object} [opts.overrides]  - per-ATS remap map: fieldKey -> profilePath | { qaKey }
   * @param {Array}  [opts.tier0]      - adapter matches aligned with `fields`: profilePath | null
   * @returns {Array<Object|null>} Array of match results (null if no match)
   */
  function matchFields(fields, profile, qaMemory, opts) {
    if (!fields || !Array.isArray(fields)) return [];
    opts = opts || {};
    const synonyms = compiledSynonyms(opts.synonyms || SYNONYMS);
    const overrides = opts.overrides || {};
    const tier0 = Array.isArray(opts.tier0) ? opts.tier0 : [];
    const entries = qaMemory && Array.isArray(qaMemory.entries) ? qaMemory.entries : [];
    const qa = { entries, sets: entries.map(e => tokenSet(e.questionNormalized || "")) };
    const c = common();

    const results = [];

    for (let i = 0; i < fields.length; i++) {
      const field = fields[i];
      const isFile = field.type === "file";
      const labelSet = field.label ? tokenSet(field.label) : new Set();
      let match = null;

      // --- Tier 0a: user remap override for this ATS (always wins) ---
      const key = fieldKey(field);
      if (key && Object.prototype.hasOwnProperty.call(overrides, key)) {
        const target = overrides[key];
        if (target && typeof target === "object" && target.qaKey) {
          const entry = entries.find(e => e.key === target.qaKey);
          if (entry) match = qaMatch(entry, 1.0, 0, "override");
        } else if (typeof target === "string" && target) {
          match = { profilePath: target, tier: 0, confidence: 1.0, source: "override" };
        }
      }

      // --- Tier 0b: ATS adapter selector map ---
      if (!match && tier0[i]) {
        match = { profilePath: tier0[i], tier: 0, confidence: 1.0, source: "adapter" };
      }

      // --- Tier 1: attribute matching ---
      if (!match) {
        const attrs = field.attributes || {};
        const attributesToCheck = [attrs.autocomplete, attrs.name, attrs.id, attrs["data-automation-id"]];
        let best = null;
        for (const attrValue of attributesToCheck) {
          if (!attrValue) continue;
          const view = attrView(attrValue);
          for (const { profilePath, syn } of synonyms) {
            if (isResumePath(profilePath) !== isFile) continue;
            const score = viewMatchesSyn(view, syn);
            if (score > 0 && (!best || score > best.confidence)) {
              best = { profilePath, tier: 1, confidence: score, source: "attribute" };
              if (score === 1.0) break;
            }
          }
          if (best && best.confidence === 1.0) break;
        }
        match = best;
      }

      // --- Tier 2: label matching ---
      if (!match && labelSet.size > 0) {
        // 2a. qa-memory, exact normalized question (the "ask once" loop)
        if (field.questionNormalized) {
          const exact = entries.find(e => e.questionNormalized && e.questionNormalized === field.questionNormalized);
          if (exact) match = qaMatch(exact, 1.0, 2, "qa-memory");
        }

        // 2b. profile label map
        if (!match && !isFile) {
          for (const { profilePath, sets } of LABEL_TOKENS) {
            if (isResumePath(profilePath)) continue;
            for (const set of sets) {
              const ratio = tokenSetOverlapRatio(labelSet, set);
              if (ratio >= 0.75) {
                match = { profilePath, tier: 2, confidence: ratio, source: "label" };
                break;
              }
            }
            if (match) break;
          }
        }
        if (!match && isFile && /\b(resume|cv|curriculum)\b/i.test(field.label)) {
          match = { profilePath: "documents.resume.filename", tier: 2, confidence: 0.8, source: "label" };
        }

        // 2c. qa-memory, fuzzy
        if (!match) match = qaLookup(field, labelSet, qa);
      }

      // --- EEO with no profile answer: a captured answer beats "ask again" ---
      if (match && match.profilePath && c && c.isEeoEmpty(profile, match.profilePath)) {
        const fromMemory = qaLookup(field, labelSet, qa);
        if (fromMemory) match = fromMemory;
      }

      results.push(match);
    }

    return results;
  }

  // --- Export ---
  const api = {
    matchFields,
    fieldKey,
    attrTokens,
    attrMatchesSynonym,
    tokenSet,
    tokenSetOverlapRatio,
    SYNONYMS,
    LABELS_MAP
  };
  root.ResumeBot = Object.assign(root.ResumeBot || {}, { matcher: api });
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
