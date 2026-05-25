// server/routes/audioRoutes.js

const express = require('express');
const router = express.Router();
const fs = require('fs');
const { transcribeAudio } = require('../config/whisper');
const { protect } = require('../middleware/authMiddleware');
const { audioUpload } = require('../middleware/fileUpload');
const { uploadLimiter } = require('../middleware/rateLimiter');

router.use(protect, uploadLimiter);

router.post('/transcribe', audioUpload.single('audio'), async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No audio file uploaded',
    });
  }

  const audioFilePath = req.file.path;

  try {
    console.log('Transcribing audio with Whisper...');
    const result = await transcribeAudio(audioFilePath);

    if (fs.existsSync(audioFilePath)) {
      fs.unlinkSync(audioFilePath);
    }

    if (result.success) {
      return res.status(200).json({
        success: true,
        transcript: result.transcript,
      });
    }

    return res.status(503).json({
      success: false,
      message: 'Transcription service unavailable. Use browser fallback.',
    });
  } catch (error) {
    if (fs.existsSync(audioFilePath)) {
      fs.unlinkSync(audioFilePath);
    }
    next(error);
  }
});

module.exports = router;
