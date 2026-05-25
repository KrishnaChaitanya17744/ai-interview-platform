// client/src/services/api.js

const BASE_URL  = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const INT_URL   = `${BASE_URL}/interview`;
const AUDIO_URL = `${BASE_URL}/audio`;
const AUTH_URL  = `${BASE_URL}/auth`;
const USER_URL  = `${BASE_URL}/user`;

const getToken = () => localStorage.getItem('authToken');

const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`,
});

// ── AUTH ──────────────────────────────────────────────
export const registerUser = async (name, email, password) => {
  const res = await fetch(`${AUTH_URL}/register`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ name, email, password }),
  });
  return res.json();
};

export const loginUser = async (email, password) => {
  const res = await fetch(`${AUTH_URL}/login`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ email, password }),
  });
  return res.json();
};

export const getProfile = async () => {
  const res = await fetch(`${AUTH_URL}/profile`, {
    method:  'GET',
    headers: authHeaders(),
  });
  return res.json();
};

// ── INTERVIEW ─────────────────────────────────────────
export const generateQuestion = async (
  role, companyType, company, askedQuestions = []
) => {
  const res = await fetch(`${INT_URL}/generate-question`, {
    method:  'POST',
    headers: authHeaders(),
    body:    JSON.stringify({ role, companyType, company, askedQuestions }),
  });
  return res.json();
};

export const evaluateAnswer = async (
  role, companyType, company,
  question, answer, answerMode, emotionData
) => {
  const res = await fetch(`${INT_URL}/evaluate-answer`, {
    method:  'POST',
    headers: authHeaders(),
    body:    JSON.stringify({
      role, companyType, company,
      question, answer, answerMode,
      emotionData: emotionData || {
        confidence: 0, nervousness: 0,
        eyeContact: 0, facePresence: 0, engagementScore: 0,
      },
    }),
  });
  return res.json();
};

// ── AUDIO ─────────────────────────────────────────────
export const transcribeAudio = async (
  audioBlob, mimeType = 'audio/webm'
) => {
  const ext = mimeType.includes('mp4') ? 'mp4'
            : mimeType.includes('ogg')  ? 'ogg'
            : 'webm';

  const formData = new FormData();
  formData.append('audio', audioBlob, `recording.${ext}`);

  try {
    const res = await fetch(`${AUDIO_URL}/transcribe`, {
      method:  'POST',
      headers: { 'Authorization': `Bearer ${getToken()}` },
      body:    formData,
    });
    return res.json();
  } catch (err) {
    return { success: false, error: err.message };
  }
};

// ── RECOMMENDATIONS ───────────────────────────────────
export const getRecommendations = async () => {
  const res = await fetch(`${USER_URL}/recommendations`, {
    method:  'GET',
    headers: authHeaders(),
  });
  return res.json();
};

// ── SESSION HISTORY ───────────────────────────────────
export const getSessionHistory = async (page = 1, limit = 5) => {
  const res = await fetch(
    `${USER_URL}/history?page=${page}&limit=${limit}`,
    {
      method:  'GET',
      headers: authHeaders(),
    }
  );
  return res.json();
};