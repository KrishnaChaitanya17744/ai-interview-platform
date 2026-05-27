// server/config/questionValidator.js

// ── Role keyword lists ────────────────────────────────────
const ROLE_KEYWORDS = {
  frontend: [
    'react', 'javascript', 'css', 'html', 'dom', 'component',
    'hook', 'state', 'props', 'rendering', 'browser', 'api',
    'redux', 'typescript', 'responsive', 'webpack', 'vite',
    'performance', 'accessibility', 'ui', 'event', 'async',
    'promise', 'fetch', 'rest', 'web', 'frontend', 'client',
    'layout', 'flexbox', 'grid', 'animation', 'optimization',
  ],
  backend: [
    'node', 'express', 'api', 'database', 'server', 'rest',
    'http', 'authentication', 'jwt', 'sql', 'nosql', 'mongodb',
    'postgres', 'caching', 'redis', 'middleware', 'microservice',
    'scalability', 'security', 'endpoint', 'request', 'response',
    'backend', 'performance', 'indexing', 'query', 'data',
    'architecture', 'deployment', 'docker', 'cloud', 'async',
  ],
  data: [
    'python', 'machine learning', 'model', 'dataset', 'algorithm',
    'neural', 'feature', 'regression', 'classification', 'pandas',
    'numpy', 'tensorflow', 'pytorch', 'data', 'analysis', 'sql',
    'visualization', 'statistics', 'training', 'overfitting',
    'accuracy', 'preprocessing', 'clustering', 'prediction',
    'deep learning', 'ai', 'nlp', 'computer vision',
  ],
  hr: [
    'team', 'challenge', 'conflict', 'leadership', 'goal',
    'strength', 'weakness', 'experience', 'project', 'failure',
    'success', 'motivation', 'communication', 'problem', 'work',
    'colleague', 'manager', 'deadline', 'priority', 'feedback',
    'growth', 'learn', 'contribute', 'situation', 'describe',
    'example', 'time', 'tell me', 'how do you', 'what would',
  ],
};

const BLACKLIST = [
  "i'll", "i will", "sure!", "certainly!", "of course",
  "here's a question", "here is a question", "here's an interview",
  "as requested", "as an interviewer", "i'd be happy",
  "let me give you", "i'm going to", "i am going to",
];

// ─────────────────────────────────────────────────────────
// VALIDATE QUESTION
// Returns { isValid: bool, reason: string }
// ─────────────────────────────────────────────────────────
const validateQuestion = (question, role, company) => {
  if (!question || typeof question !== 'string') {
    return { isValid: false, reason: 'Empty or invalid question' };
  }

  const q       = question.trim();
  const qLower  = q.toLowerCase();

  // ── 1. Length check ─────────────────────────────────────
  if (q.length < 15) {
    return { isValid: false, reason: `Too short: ${q.length} chars` };
  }

  if (q.length > 600) {
    return { isValid: false, reason: `Too long: ${q.length} chars` };
  }

  // ── 2. Blacklist check ───────────────────────────────────
  for (const phrase of BLACKLIST) {
    if (qLower.includes(phrase)) {
      return {
        isValid: false,
        reason:  `Contains blacklisted phrase: "${phrase}"`,
      };
    }
  }

  // ── 3. Must look like a question or instruction ──────────
  // Accepts: ends with ? OR starts with a question/action word
  // This is intentionally lenient for both Gemini and Groq output
  const endsWithQuestion = q.endsWith('?');
  const questionStarters = [
    'what', 'how', 'why', 'when', 'where', 'who', 'which',
    'explain', 'describe', 'design', 'implement', 'write',
    'can you', 'could you', 'tell me', 'walk me', 'imagine',
    'suppose', 'given', 'you are', 'your', 'if you',
    'compare', 'differentiate', 'discuss', 'define',
  ];
  const startsLikeQuestion = questionStarters.some((s) =>
    qLower.startsWith(s)
  );

  if (!endsWithQuestion && !startsLikeQuestion) {
    return {
      isValid: false,
      reason:  'Does not appear to be a question or instruction',
    };
  }

  // ── 4. Role keyword relevance ────────────────────────────
  // Only check if role has defined keywords
  const keywords = ROLE_KEYWORDS[role];
  if (keywords) {
    const matches = keywords.filter((kw) => qLower.includes(kw));

    // Only 2 keywords required — lenient enough for general questions
    if (matches.length < 2) {
      // HR questions often don't have technical keywords — be more lenient
      if (role === 'hr' && q.length > 30) {
        return { isValid: true, reason: 'HR question accepted' };
      }
      return {
        isValid: false,
        reason:  `Low role relevance (${matches.length} keywords matched for ${role})`,
      };
    }
  }

  return { isValid: true, reason: 'Passed all checks' };
};

// ─────────────────────────────────────────────────────────
// IS DUPLICATE
// Jaccard similarity > 0.6 = duplicate
// ─────────────────────────────────────────────────────────
const isDuplicate = (question, askedQuestions) => {
  if (!askedQuestions || askedQuestions.length === 0) return false;

  const wordsA = new Set(
    question.toLowerCase().split(/\W+/).filter((w) => w.length > 3)
  );

  for (const asked of askedQuestions) {
    const wordsB = new Set(
      asked.toLowerCase().split(/\W+/).filter((w) => w.length > 3)
    );

    const intersection = new Set([...wordsA].filter((w) => wordsB.has(w)));
    const union        = new Set([...wordsA, ...wordsB]);

    if (union.size === 0) continue;

    const similarity = intersection.size / union.size;

    if (similarity > 0.6) {
      console.log(`Duplicate detected (similarity: ${similarity.toFixed(2)})`);
      return true;
    }
  }

  return false;
};

module.exports = { validateQuestion, isDuplicate };