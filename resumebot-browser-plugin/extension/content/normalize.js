// normalize.js - question normalization pipeline
(function (root) {
  "use strict";

  // Function to detect company name from document
  function detectCompanyName(doc) {
    if (!doc) return "";
    
    // Try og:site_name meta tag first
    const ogSiteName = doc.querySelector('meta[property="og:site_name"]');
    if (ogSiteName && ogSiteName.content) {
      return ogSiteName.content.trim();
    }
    
    // Try document.title
    if (doc.title && doc.title.trim()) {
      // Extract company name from title (common patterns)
      const title = doc.title.trim();
      // Remove common job posting suffixes
      const cleanedTitle = title
        .replace(/ - Job.*$/i, "")
        .replace(/ - Careers.*$/i, "")
        .replace(/ - Jobs.*$/i, "")
        .replace(/ \| .*$/i, "")
        .trim();
      
      if (cleanedTitle) {
        return cleanedTitle;
      }
    }
    
    // Fallback to hostname
    try {
      const hostname = new URL(doc.URL).hostname;
      // Remove www. and TLD to get company name
      const companyFromHost = hostname
        .replace(/^www\./, "")
        .split(".")[0];
      if (companyFromHost && companyFromHost.length > 1) {
        return companyFromHost;
      }
    } catch (e) {
      // Ignore URL parsing errors
    }
    
    return "";
  }

  // All the names the current page might use for the company: og:site_name
  // (as-is, minus boilerplate words, first token), the "at Acme" pattern in
  // the title, and the hostname base. Individual candidates are what actually
  // appear inside question text — og:site_name alone ("Acme Careers") rarely does.
  function companyCandidates(doc) {
    const out = [];
    const push = (s) => {
      if (s && s.trim().length > 1) out.push(s.trim());
    };
    if (!doc) return out;

    const og = typeof doc.querySelector === "function"
      ? doc.querySelector('meta[property="og:site_name"]')
      : null;
    if (og && og.content) {
      const name = og.content.trim();
      push(name);
      push(name.replace(/\b(careers?|jobs?|hiring|recruiting|inc|llc|ltd|corp(?:oration)?|co)\b\.?/gi, ""));
      push(name.split(/\s+/)[0]);
    }

    if (doc.title) {
      const atMatch = doc.title.match(/\bat\s+([A-Z][\w&.'-]*(?:\s+[A-Z][\w&.'-]*)*)/);
      if (atMatch) push(atMatch[1]);
    }

    try {
      const hostname = new URL(doc.URL).hostname.replace(/^www\./, "");
      push(hostname.split(".")[0]);
    } catch (e) {
      // Ignore URL parsing errors
    }

    return out;
  }

  // Candidates compiled once per (document, title, URL): a scan calls
  // normalizeQuestion once per field and the page identity does not change
  // between fields.
  const candidateCache = new WeakMap();
  function compiledCandidates(doc) {
    if (!doc || typeof doc !== "object") return [];
    const stamp = (doc.title || "") + "|" + (doc.URL || "");
    const hit = candidateCache.get(doc);
    if (hit && hit.stamp === stamp) return hit.list;
    const list = companyCandidates(doc)
      .map((c) => c.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim())
      .filter((c) => c.length > 1)
      .sort((a, b) => b.length - a.length)
      .map((c) => new RegExp("\\b" + c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "g"));
    candidateCache.set(doc, { stamp, list });
    return list;
  }

  // Normalization pipeline: lowercase → strip punctuation → replace company names → collapse whitespace
  function normalizeQuestion(questionText, doc) {
    if (!questionText) return "";

    // Lowercase, then strip punctuation — keep alphanumerics, whitespace, and
    // braces (so an already-normalized "{company}" survives a second pass).
    let normalized = questionText.toLowerCase();
    normalized = normalized.replace(/[^a-z0-9\s{}]/g, "");

    // Replace detected company names, longest candidate first, whole words only.
    for (const re of compiledCandidates(doc)) {
      re.lastIndex = 0;
      normalized = normalized.replace(re, "{company}");
    }

    // Collapse whitespace
    normalized = normalized.replace(/\s+/g, " ").trim();

    return normalized;
  }

  // Pure-JS SHA-1 (hex) for environments without SubtleCrypto. Keys must be
  // identical everywhere, so the fallback is a real SHA-1, not a toy hash.
  function sha1Hex(str) {
    const utf8 = unescape(encodeURIComponent(str));
    const msgLen = utf8.length;
    const words = [];
    for (let i = 0; i < msgLen; i++) words[i >> 2] |= (utf8.charCodeAt(i) & 0xff) << (24 - (i % 4) * 8);
    words[msgLen >> 2] |= 0x80 << (24 - (msgLen % 4) * 8);
    const totalWords = (((msgLen + 8) >> 6) + 1) * 16;
    words[totalWords - 1] = (msgLen * 8) >>> 0;
    words[totalWords - 2] = Math.floor((msgLen * 8) / 0x100000000);
    for (let i = 0; i < totalWords; i++) words[i] = words[i] | 0;
    let h0 = 0x67452301, h1 = 0xEFCDAB89, h2 = 0x98BADCFE, h3 = 0x10325476, h4 = 0xC3D2E1F0;
    const w = new Array(80);
    const rotl = (n, b) => ((n << b) | (n >>> (32 - b))) >>> 0;
    for (let i = 0; i < totalWords; i += 16) {
      for (let t = 0; t < 16; t++) w[t] = words[i + t] >>> 0;
      for (let t = 16; t < 80; t++) w[t] = rotl(w[t - 3] ^ w[t - 8] ^ w[t - 14] ^ w[t - 16], 1);
      let a = h0, b = h1, c = h2, d = h3, e = h4;
      for (let t = 0; t < 80; t++) {
        let f, k;
        if (t < 20) { f = (b & c) | (~b & d); k = 0x5A827999; }
        else if (t < 40) { f = b ^ c ^ d; k = 0x6ED9EBA1; }
        else if (t < 60) { f = (b & c) | (b & d) | (c & d); k = 0x8F1BBCDC; }
        else { f = b ^ c ^ d; k = 0xCA62C1D6; }
        const temp = (rotl(a, 5) + (f >>> 0) + e + k + w[t]) >>> 0;
        e = d; d = c; c = rotl(b, 30); b = a; a = temp;
      }
      h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0; h4 = (h4 + e) >>> 0;
    }
    return [h0, h1, h2, h3, h4].map(x => x.toString(16).padStart(8, "0")).join("");
  }

  // qa-memory key: SHA-1 of the normalized question text.
  async function generateKey(normalizedText) {
    const text = String(normalizedText == null ? "" : normalizedText);
    const c = (typeof crypto !== "undefined" && crypto.subtle) ? crypto
      : (typeof globalThis !== "undefined" && globalThis.crypto && globalThis.crypto.subtle) ? globalThis.crypto : null;
    if (c) {
      try {
        const data = new TextEncoder().encode(text);
        const hashBuffer = await c.subtle.digest("SHA-1", data);
        return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
      } catch (e) {
        /* fall through */
      }
    }
    return sha1Hex(text);
  }

  // Export API
  const api = {
    normalizeQuestion,
    generateKey,
    sha1Hex,
    detectCompanyName,
    companyCandidates
  };
  
  root.ResumeBot = Object.assign(root.ResumeBot || {}, { normalize: api });
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);