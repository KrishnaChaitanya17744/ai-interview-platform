// server/middleware/requestId.js
// Stamps every request with a unique X-Request-ID header.
// Used for log correlation and incident response tracing (OWASP ASVS 7.4.1).
// The ID is attached to req.id AND echoed back in the response header.

const crypto = require('crypto');

/**
 * Generates a short, URL-safe unique ID.
 * Format: <timestamp-hex>-<8 random bytes hex>
 * Example: "1900abcd-a1b2c3d4e5f6a7b8"
 */
const generateRequestId = () => {
  const ts = Date.now().toString(16);
  const rand = crypto.randomBytes(8).toString('hex');
  return `${ts}-${rand}`;
};

/**
 * Express middleware: attaches req.id and X-Request-ID response header.
 * If the incoming request already has X-Request-ID (from a trusted proxy or
 * load balancer), it is accepted only if it matches a safe pattern to prevent
 * header injection. Otherwise a fresh ID is generated.
 */
const requestIdMiddleware = (req, res, next) => {
  const incomingId = req.headers['x-request-id'];

  // Accept forwarded ID only if it looks safe (alphanumeric + dashes, max 64 chars)
  const safePattern = /^[a-zA-Z0-9\-_]{1,64}$/;
  const requestId =
    incomingId && safePattern.test(incomingId)
      ? incomingId
      : generateRequestId();

  // Attach to request for use in error handlers and loggers
  req.id = requestId;

  // Echo back so clients can correlate their requests with server logs
  res.setHeader('X-Request-ID', requestId);

  next();
};

module.exports = { requestIdMiddleware, generateRequestId };
