// server/middleware/errorHandler.js
// Centralized error handling — no stack traces or internal details in production.
// OWASP ASVS 7.4: Errors must not disclose sensitive system information.

const multer = require('multer');
const { logSecurityEvent } = require('../utils/securityLogger');

const isProd = process.env.NODE_ENV === 'production';

// ── 404 handler ───────────────────────────────────────────────────────────────
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success:   false,
    message:   'Resource not found.',
    requestId: req.id,  // Correlate with server logs via X-Request-ID
  });
};

// ── Global error handler ──────────────────────────────────────────────────────
// Receives errors thrown/passed via next(err) anywhere in the app.
const errorHandler = (err, req, res, _next) => {

  // ── CORS rejection ─────────────────────────────────────────────────────────
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'Cross-origin request not allowed.',
    });
  }

  // ── Multer file upload errors ──────────────────────────────────────────────
  // Map multer error codes to friendly messages without leaking internals
  if (err instanceof multer.MulterError) {
    const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    return res.status(status).json({
      success: false,
      message: err.code === 'LIMIT_FILE_SIZE'
        ? 'File too large. Maximum allowed size exceeded.'
        : 'Invalid file upload.',
    });
  }

  // ── Audio MIME/extension rejection (from fileUpload.js fileFilter) ─────────
  if (err.message?.includes('Only audio files')) {
    return res.status(400).json({
      success: false,
      message: 'Only audio files are allowed.',
    });
  }

  // ── Mongoose CastError (invalid ObjectId, wrong type) ─────────────────────
  // SECURITY FIX: Without this, a bad ID like /api/user/NOT_AN_ID would
  // bubble up as a 500 with Mongoose internals. Return 400 instead.
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid resource identifier.',
    });
  }

  // ── Mongoose ValidationError ───────────────────────────────────────────────
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: messages[0] || 'Validation failed.',
    });
  }

  // ── Mongoose duplicate key (unique index violation) ────────────────────────
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'A resource with this value already exists.',
    });
  }

  // ── JWT / auth errors ──────────────────────────────────────────────────────
  if (err.status === 401 || err.name === 'UnauthorizedError') {
    logSecurityEvent('auth_failure', {
      path:      req.path,
      ip:        req.ip,
      requestId: req.id,
    });
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
    });
  }

  // ── Server-side structured log (never sent to client) ─────────────────────
  // SECURITY: Logs the message and stack (dev only) but never req.body
  // because it may contain passwords or sensitive user input.
  console.error('[ERROR]', JSON.stringify({
    requestId: req.id,
    method:    req.method,
    path:      req.path,
    message:   err.message,
    code:      err.code,
    ...(isProd ? {} : { stack: err.stack }),
  }));

  // ── Generic response — never leak internal details in production ───────────
  // OWASP: 500 responses must never reveal framework, ORM, or DB details.
  const status = err.statusCode || err.status || 500;
  res.status(status).json({
    success:   false,
    // Only include the raw message for 4xx (client errors) — these are
    // safe to expose because they describe the client's mistake.
    // 5xx always gets a generic message in production.
    message: isProd
      ? (status < 500 ? (err.clientMessage || err.message || 'Bad request.') : 'Internal server error.')
      : (err.message || 'An error occurred.'),
    requestId: req.id,
    ...(isProd ? {} : { detail: err.message }),
  });
};

module.exports = { notFoundHandler, errorHandler };
