// server/config/env.js
// Validates required environment variables at startup.
// Fail-fast in production — if critical vars are missing, the process exits
// rather than running with broken/insecure configuration (OWASP ASVS 14.1.1).

// ── Always required — app cannot function without these ───────────────────────
const REQUIRED_ALWAYS = ['MONGO_URI', 'JWT_SECRET'];

// ── Required in production — warn in dev, fatal in prod ───────────────────────
// OPENAI_API_KEY added: without it the whisper transcription silently fails
// and users get no feedback about why voice mode doesn't work.
const REQUIRED_PRODUCTION = ['GEMINI_API_KEY', 'OPENAI_API_KEY'];

// ── JWT secret strength validation ────────────────────────────────────────────
// SECURITY: A JWT signed with a weak/short secret can be brute-forced offline
// if any signed token is captured. 48+ chars of random entropy is the minimum
// for HS256 to be meaningful.
// Generate a strong secret: openssl rand -base64 48
const validateJwtSecret = (secret) => {
  // Hard minimum: 48 characters (increased from 32)
  if (!secret || secret.length < 48) {
    throw new Error(
      'JWT_SECRET must be at least 48 characters. ' +
      'Generate with: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'base64\'))"'
    );
  }

  // Pattern-based weak-secret detection
  const weakPatterns = [
    'your_jwt_secret', 'changeme', 'secret', 'a8f3k9x2',
    'password', '123456', 'jwt_secret', 'mysecret',
  ];
  const isWeak = weakPatterns.some((w) => secret.toLowerCase().includes(w));
  if (isWeak) {
    // Fatal in production — only warn in development
    const msg = '⚠️  JWT_SECRET looks like a placeholder or weak value. Use a cryptographically random secret in production.';
    if (process.env.NODE_ENV === 'production') {
      console.error(`❌ ${msg}`);
      process.exit(1);
    }
    console.warn(msg);
  }
};

// ── CORS origins validation ────────────────────────────────────────────────────
// In production, CORS_ORIGINS must be set to real HTTPS origins.
// Leaving it as the dev default (localhost) in production is a misconfiguration.
const validateCorsOrigins = () => {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) return;

  const origins = process.env.CORS_ORIGINS || '';
  if (!origins.trim() || origins.includes('localhost')) {
    console.error(
      '❌ CORS_ORIGINS must be set to production HTTPS origins. ' +
      'localhost is not permitted in production.'
    );
    process.exit(1);
  }
};

// ── Main validation entry point — called once before routes are wired ─────────
const validateEnv = () => {
  const isProd = process.env.NODE_ENV === 'production';

  // Warn if NODE_ENV is not explicitly set (defaults to undefined, not 'development')
  if (!process.env.NODE_ENV) {
    console.warn('⚠️  NODE_ENV is not set. Defaulting to development mode. Set NODE_ENV=production for deployment.');
  }

  // ── Check always-required vars ─────────────────────────────────────────────
  const missing = [];
  for (const key of REQUIRED_ALWAYS) {
    if (!process.env[key]?.trim()) missing.push(key);
  }

  // ── Check production-required vars ────────────────────────────────────────
  if (isProd) {
    for (const key of REQUIRED_PRODUCTION) {
      if (!process.env[key]?.trim()) missing.push(key);
    }
  }

  if (missing.length > 0) {
    const msg = `Missing required environment variables: ${missing.join(', ')}. See server/.env.example`;
    if (isProd) {
      console.error(`❌ ${msg}`);
      process.exit(1);
    }
    console.warn(`⚠️  ${msg}`);
  }

  // ── Validate JWT secret strength ───────────────────────────────────────────
  if (process.env.JWT_SECRET) {
    try {
      validateJwtSecret(process.env.JWT_SECRET);
    } catch (err) {
      if (isProd) {
        console.error(`❌ ${err.message}`);
        process.exit(1);
      }
      console.warn(`⚠️  ${err.message}`);
    }
  }

  // ── Detect placeholder API keys in production ──────────────────────────────
  // Prevents accidentally deploying with example/template values
  if (isProd) {
    const placeholders = [
      ['OPENAI_API_KEY',  'your_openai_key_here'],
      ['GEMINI_API_KEY',  'your_gemini_key_here'],
      ['MONGO_URI',       'mongodb+srv://USER:PASSWORD'],
    ];
    for (const [key, placeholder] of placeholders) {
      if (process.env[key]?.includes(placeholder)) {
        console.error(`❌ ${key} still contains placeholder value. Replace before deploying.`);
        process.exit(1);
      }
    }
  }

  // ── Validate CORS origins for production ───────────────────────────────────
  validateCorsOrigins();

  if (isProd) {
    console.log('✅ Environment validation passed.');
  }
};

module.exports = { validateEnv };
