// server/utils/sanitize.js
// Strips prototype-pollution keys and normalizes user-controlled strings.

const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Deep-clone plain objects/arrays while dropping dangerous keys (prototype pollution).
 */
const stripDangerousKeys = (value) => {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) {
    return value.map(stripDangerousKeys);
  }
  if (typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (DANGEROUS_KEYS.has(k)) continue;
      out[k] = stripDangerousKeys(v);
    }
    return out;
  }
  return value;
};

/**
 * Trim and collapse whitespace; remove null bytes (log injection / parser issues).
 */
const sanitizeString = (str, maxLen = 10000) => {
  if (typeof str !== 'string') return str;
  return str
    .replace(/\0/g, '')
    .trim()
    .slice(0, maxLen);
};

/**
 * Sanitize a filename for safe disk storage (path traversal prevention).
 */
const sanitizeFilename = (originalName) => {
  const base = String(originalName || 'file')
    .replace(/[/\\]/g, '')
    .replace(/\.\./g, '')
    .replace(/[^\w.\-]/g, '_')
    .slice(0, 100);
  return base || 'file';
};

/** Remove HTML tags from user text (defense-in-depth for stored / AI-bound content). */
const stripHtmlTags = (str, maxLen = 10000) => {
  const s = sanitizeString(str, maxLen);
  return s.replace(/<[^>]*>/g, '');
};

module.exports = {
  stripDangerousKeys,
  sanitizeString,
  sanitizeFilename,
  stripHtmlTags,
};
