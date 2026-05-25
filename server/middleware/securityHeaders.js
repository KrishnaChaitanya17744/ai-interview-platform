// server/middleware/securityHeaders.js
// Helmet + CORS + body hardening.
// Implements: HSTS, CSP, X-Frame-Options, X-Content-Type-Options,
//             Referrer-Policy, CORS allowlist, HPP, NoSQL sanitization.

const helmet = require('helmet');
const cors   = require('cors');
const hpp    = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');

// ── Parse allowed CORS origins from environment ───────────────────────────────
// CORS_ORIGINS is a comma-separated list of fully-qualified URLs.
// Example: CORS_ORIGINS=https://app.example.com,https://staging.example.com
const parseOrigins = () => {
  const raw = process.env.CORS_ORIGINS || 'http://localhost:5173';
  return raw.split(',').map((o) => o.trim()).filter(Boolean);
};

// ── CORS: explicit allowlist, no wildcard ─────────────────────────────────────
// SECURITY: Requests with no Origin header (e.g., server-to-server curl) are
// blocked in production to prevent SSRF-style abuse. In development the check
// is relaxed so tools like Postman still work.
const corsMiddleware = cors({
  origin: (origin, callback) => {
    const allowed = parseOrigins();
    const isProd  = process.env.NODE_ENV === 'production';

    // Block no-Origin requests in production (server-to-server calls should
    // use service tokens, not cookie-based auth anyway)
    if (!origin) {
      return isProd
        ? callback(new Error('Not allowed by CORS'))
        : callback(null, true);
    }

    if (allowed.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  methods:             ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders:      ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID'],
  credentials:         true,           // Allow cookies (HttpOnly auth cookie)
  optionsSuccessStatus: 204,
});

// ── Helmet: comprehensive security headers ────────────────────────────────────
// Each directive explained below. See https://helmetjs.github.io/ for full docs.
const helmetMiddleware = helmet({
  // ── Content Security Policy ─────────────────────────────────────────────────
  // Restricts which resources the browser is permitted to load.
  // 'unsafe-inline' is retained for styleSrc because we use inline styles in
  // React components; removing it would require nonce-based CSP which needs
  // SSR or a custom Vite plugin. This is a known trade-off (documented risk).
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'"],
      styleSrc:    ["'self'", "'unsafe-inline'"], // See note above
      imgSrc:      ["'self'", 'data:', 'https:'],
      // connectSrc: only allow calls back to the API origin — not open-ended
      connectSrc:  ["'self'", ...parseOrigins()],
      frameSrc:    ["'none'"],   // Prevent clickjacking via iframe
      objectSrc:   ["'none'"],   // Block Flash/plugins
      baseUri:     ["'self'"],   // Prevent base-tag injection
      formAction:  ["'self'"],   // Prevent form hijacking
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
    // Remove null directives (upgradeInsecureRequests is null in dev)
    reportOnly: false,
  },

  // ── HSTS ───────────────────────────────────────────────────────────────────
  // Only active in production. Tells browsers to always use HTTPS for 1 year.
  hsts: process.env.NODE_ENV === 'production'
    ? { maxAge: 31536000, includeSubDomains: true, preload: true }
    : false,

  // ── Referrer Policy ────────────────────────────────────────────────────────
  // 'strict-origin-when-cross-origin' prevents leaking full URL in Referer
  // header to third parties while still sending origin on same-site requests.
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },

  // ── X-Content-Type-Options ─────────────────────────────────────────────────
  // Prevents MIME-type sniffing (default enabled by helmet, explicit here)
  noSniff: true,

  // ── X-Frame-Options ────────────────────────────────────────────────────────
  // Redundant with CSP frameSrc 'none' but kept for older browser compat
  frameguard: { action: 'deny' },

  // Disable crossOriginEmbedderPolicy — we serve API only (no embedded docs)
  crossOriginEmbedderPolicy: false,
});

// ── Remove X-Powered-By header ────────────────────────────────────────────────
// Prevents server fingerprinting (Express version disclosure)
const hidePoweredBy = (_req, res, next) => {
  res.removeHeader('X-Powered-By');
  next();
};

// ── Body size limits ──────────────────────────────────────────────────────────
// SECURITY: Reduced from 2mb to 500kb. This is an API that receives short
// JSON payloads — 500kb is still generous enough for a 15,000-char answer.
// File uploads use multipart (handled by multer with its own limit).
// Override via JSON_BODY_LIMIT env var if a legitimate use case requires more.
const bodyParserLimits = {
  jsonLimit: process.env.JSON_BODY_LIMIT || '500kb',
};

module.exports = {
  corsMiddleware,
  helmetMiddleware,
  // ── HPP: HTTP Parameter Pollution protection ──────────────────────────────
  // Strips duplicate query/body params (e.g., ?id=1&id=2 → id=1)
  hppMiddleware: hpp(),
  // ── express-mongo-sanitize: NoSQL injection prevention ───────────────────
  // Replaces keys starting with $ or containing . in req.body/query/params.
  mongoSanitizeMiddleware: mongoSanitize({
    replaceWith: '_',   // Replace dangerous chars instead of removing keys
    onSanitize: ({ req, key }) => {
      if (process.env.NODE_ENV !== 'test') {
        // Warn but don't log the value — it may contain injection payload
        console.warn(`[SECURITY] NoSQL injection attempt sanitized: key="${key}" path="${req.method} ${req.path}"`);
      }
    },
  }),
  hidePoweredBy,
  bodyParserLimits,
};
