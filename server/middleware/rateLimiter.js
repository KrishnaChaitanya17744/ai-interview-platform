// server/middleware/rateLimiter.js
// IP-based and user-based rate limits with 429 + Retry-After metadata.
//
// SECURITY FIX: `ipKeyGenerator` was removed from express-rate-limit v7+.
// We now use `req.ip` directly with a simple prefix helper. This fixes a
// silent runtime crash where ALL rate limiting was disabled.

const { rateLimit } = require('express-rate-limit');
const { logSecurityEvent } = require('../utils/securityLogger');

const isProd = process.env.NODE_ENV === 'production';

// ── Graceful 429 handler — returns Retry-After + structured metadata ──────────
const rateLimitHandler = (req, res, _next, options) => {
  // Compute seconds remaining in the current window
  const retryAfterSec = Math.ceil(options.windowMs / 1000);

  // Log security event (no PII — only IP and path)
  logSecurityEvent('rate_limit_exceeded', {
    ip:     req.ip,
    path:   req.path,
    userId: req.user?._id?.toString(),
    limit:  options.max,
  });

  // RFC 6585 — Retry-After header tells clients when to retry
  res.set('Retry-After', String(retryAfterSec));
  res.status(429).json({
    success:    false,
    message:    'Too many requests. Please try again later.',
    retryAfter: retryAfterSec,
    limit:      options.max,
    windowMs:   options.windowMs,
  });
};

// ── Shared base options ────────────────────────────────────────────────────────
const baseOptions = {
  standardHeaders: true,   // Emit RateLimit-* response headers (RFC draft)
  legacyHeaders:   false,  // Disable deprecated X-RateLimit-* headers
  handler:         rateLimitHandler,
  // Never rate-limit preflight OPTIONS requests
  skip: (req) => req.method === 'OPTIONS',
};

// ── Safe IP key helper — uses req.ip (Express normalizes this) ────────────────
// SECURITY: Using req.ip is safe when trust proxy is configured in index.js.
// We prefix with a namespace string to prevent key collisions across limiters.
const ipKey = (req, prefix = '') => `${prefix}${req.ip || 'unknown'}`;

// ── Global ceiling: burst protection for ALL routes ───────────────────────────
// 300 req / 15 min per IP in production; relaxed for development
const globalLimiter = rateLimit({
  ...baseOptions,
  windowMs:     15 * 60 * 1000,
  max:          isProd ? 300 : 1000,
  keyGenerator: (req) => ipKey(req, 'global:'),
});

// ── Auth routes: login brute-force prevention ─────────────────────────────────
// 10 attempts / 15 min per IP in production (covers credential stuffing)
const authLimiter = rateLimit({
  ...baseOptions,
  windowMs:     15 * 60 * 1000,
  max:          isProd ? 10 : 50,
  keyGenerator: (req) => ipKey(req, 'auth:'),
});

// ── Registration: prevents mass account creation ──────────────────────────────
// 5 registrations / hour per IP in production
const registerLimiter = rateLimit({
  ...baseOptions,
  windowMs:     60 * 60 * 1000,
  max:          isProd ? 5 : 30,
  keyGenerator: (req) => ipKey(req, 'register:'),
});

// ── OTP routes (reserved for future use) ──────────────────────────────────────
// Very strict: 5 OTP requests / 15 min per IP
const otpLimiter = rateLimit({
  ...baseOptions,
  windowMs:     15 * 60 * 1000,
  max:          5,
  keyGenerator: (req) => ipKey(req, 'otp:'),
});

// ── Password reset (reserved for future use) ──────────────────────────────────
// 3 reset attempts / hour per IP
const passwordResetLimiter = rateLimit({
  ...baseOptions,
  windowMs:     60 * 60 * 1000,
  max:          3,
  keyGenerator: (req) => ipKey(req, 'reset:'),
});

// ── AI / generation endpoints: prevent abuse of paid AI API ──────────────────
// Keyed per authenticated user (userId) when available, falls back to IP.
// 40 AI calls / hour per user in production.
const aiLimiter = rateLimit({
  ...baseOptions,
  windowMs: 60 * 60 * 1000,
  max:      isProd ? 40 : 200,
  keyGenerator: (req) =>
    req.user?._id
      ? `ai:user:${req.user._id}`
      : ipKey(req, 'ai:'),
});

// ── File upload endpoints: prevent disk exhaustion ────────────────────────────
// Keyed per user when available, falls back to IP.
// 30 uploads / hour per user in production.
const uploadLimiter = rateLimit({
  ...baseOptions,
  windowMs: 60 * 60 * 1000,
  max:      isProd ? 30 : 100,
  keyGenerator: (req) =>
    req.user?._id
      ? `upload:user:${req.user._id}`
      : ipKey(req, 'upload:'),
});

// ── General authenticated API endpoints ───────────────────────────────────────
// Keyed per user to prevent one account from hammering the API.
// 200 req / 15 min per user in production.
const apiUserLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  max:      isProd ? 200 : 500,
  keyGenerator: (req) =>
    req.user?._id
      ? `api:user:${req.user._id}`
      : ipKey(req, 'api:'),
});

module.exports = {
  globalLimiter,
  authLimiter,
  registerLimiter,
  otpLimiter,
  passwordResetLimiter,
  aiLimiter,
  uploadLimiter,
  apiUserLimiter,
};
