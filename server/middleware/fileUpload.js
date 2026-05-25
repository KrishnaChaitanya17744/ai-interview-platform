// server/middleware/fileUpload.js
// Secure multer: MIME + extension allowlist, size cap, sanitized filenames, no path traversal.

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { sanitizeFilename } = require('../utils/sanitize');

const uploadDir = path.resolve(__dirname, '../uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const ALLOWED_MIME = new Set([
  'audio/webm',
  'audio/ogg',
  'audio/mpeg',
  'audio/mp4',
  'audio/wav',
  'audio/x-wav',
  'audio/mp3',
]);

const ALLOWED_EXT = new Set(['.webm', '.ogg', '.mp3', '.mp4', '.wav', '.mpeg']);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safeBase = sanitizeFilename(file.originalname).replace(/\.[^.]+$/, '');
    const ext = path.extname(sanitizeFilename(file.originalname)).toLowerCase();
    const useExt = ALLOWED_EXT.has(ext) ? ext : '.webm';
    const unique = `audio_${Date.now()}_${crypto.randomBytes(8).toString('hex')}${useExt}`;
    cb(null, unique);
  },
});

const fileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname || '').toLowerCase();
  const mimeOk = ALLOWED_MIME.has(file.mimetype);
  const extOk = ALLOWED_EXT.has(ext);

  if (mimeOk && extOk) {
    return cb(null, true);
  }
  cb(new Error('Only audio files are allowed!'), false);
};

const audioUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_AUDIO_UPLOAD_BYTES || String(25 * 1024 * 1024), 10),
    files:    1,
  },
});

module.exports = { audioUpload, uploadDir };
