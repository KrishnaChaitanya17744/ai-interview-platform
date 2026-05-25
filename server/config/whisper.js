// server/config/whisper.js

const OpenAI = require('openai');
const fs = require('fs');

let openaiClient = null;

const getOpenAI = () => {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 30000,
    });
  }
  return openaiClient;
};

const transcribeAudio = async (audioFilePath) => {
  if (!process.env.OPENAI_API_KEY ||
      process.env.OPENAI_API_KEY === 'your_openai_key_here') {
    console.log('No OpenAI API key — using browser fallback');
    return { success: false, error: 'No API key' };
  }

  try {
    const openai = getOpenAI();
    const audioStream = fs.createReadStream(audioFilePath);

    const transcription = await openai.audio.transcriptions.create({
      file: audioStream,
      model: 'whisper-1',
      language: 'en',
      response_format: 'json',
    });

    return { success: true, transcript: transcription.text };
  } catch (error) {
    console.error('Whisper API Error:', {
      status: error.status,
      message: error.message,
    });

    return { success: false, error: 'transcription_failed' };
  }
};

module.exports = { transcribeAudio };
