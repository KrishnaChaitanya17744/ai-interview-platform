// server/utils/securityLogger.js
// Structured security events — never logs passwords, tokens, or API keys.

const REDACT_PATTERNS = [
  /password/i,
  /token/i,
  /authorization/i,
  /api[_-]?key/i,
  /secret/i,
  /bearer\s+\S+/i,
];

const redactObject = (obj, depth = 0) => {
  if (depth > 5 || obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map((v) => redactObject(v, depth + 1));

  const out = {};
  for (const [key, value] of Object.entries(obj)) {
    if (REDACT_PATTERNS.some((p) => p.test(key))) {
      out[key] = '[REDACTED]';
    } else if (typeof value === 'object') {
      out[key] = redactObject(value, depth + 1);
    } else {
      out[key] = value;
    }
  }
  return out;
};

const logSecurityEvent = (event, meta = {}) => {
  const entry = {
    ts:      new Date().toISOString(),
    event,
    ...redactObject(meta),
  };
  console.warn('[SECURITY]', JSON.stringify(entry));
};

module.exports = { logSecurityEvent, redactObject };
