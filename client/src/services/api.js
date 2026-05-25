// client/src/services/api.js

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const INT_URL   = `${BASE_URL}/interview`;
const AUDIO_URL = `${BASE_URL}/audio`;
const AUTH_URL  = `${BASE_URL}/auth`;
const USER_URL  = `${BASE_URL}/user`;

const fetchOptions = { credentials: 'include' };

const getToken = () => localStorage.getItem('authToken');

const authHeaders = () => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

const parseJsonResponse = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (res.status === 429) {
    const retry = data.retryAfter ?? res.headers.get('Retry-After');
    return {
      success: false,
      message: data.message || 'Too many requests. Please wait and try again.',
      retryAfter: retry,
    };
  }
  return data;
};

export const registerUser = async (name, email, password) => {
  const res = await fetch(`${AUTH_URL}/register`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ name, email, password }),
    ...fetchOptions,
  });
  return parseJsonResponse(res);
};

export const loginUser = async (email, password) => {
  const res = await fetch(`${AUTH_URL}/login`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ email, password }),
    ...fetchOptions,
  });
  return parseJsonResponse(res);
};

export const logoutUser = async () => {
  const res = await fetch(`${AUTH_URL}/logout`, {
    method:  'POST',
    headers: authHeaders(),
    ...fetchOptions,
  });
  return parseJsonResponse(res);
};

export const getProfile = async () => {
  const res = await fetch(`${AUTH_URL}/profile`, {
    method:  'GET',
    headers: authHeaders(),
    ...fetchOptions,
  });
  return parseJsonResponse(res);
};

export const generateQuestion = async (
  role, companyType, company, askedQuestions = []
) => {
  const res = await fetch(`${INT_URL}/generate-question`, {
    method:  'POST',
    headers: authHeaders(),
    body:    JSON.stringify({ role, companyType, company, askedQuestions }),
    ...fetchOptions,
  });
  return parseJsonResponse(res);
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
    ...fetchOptions,
  });
  return parseJsonResponse(res);
};

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
      headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : {},
      body:    formData,
      ...fetchOptions,
    });
    return parseJsonResponse(res);
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const getRecommendations = async () => {
  const res = await fetch(`${USER_URL}/recommendations`, {
    method:  'GET',
    headers: authHeaders(),
    ...fetchOptions,
  });
  return parseJsonResponse(res);
};

export const getSessionHistory = async (page = 1, limit = 5) => {
  const res = await fetch(
    `${USER_URL}/history?page=${page}&limit=${limit}`,
    {
      method:  'GET',
      headers: authHeaders(),
      ...fetchOptions,
    }
  );
  return parseJsonResponse(res);
};
