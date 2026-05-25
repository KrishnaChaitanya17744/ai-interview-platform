// server/config/questionValidator.js

// ─────────────────────────────────────────────────────────
// Validates whether a generated question meets
// quality standards before serving to the user
// ─────────────────────────────────────────────────────────

// Minimum question length
const MIN_LENGTH = 20;
const MAX_LENGTH = 500;

// Keywords that indicate off-topic or low quality
const BLACKLIST_PATTERNS = [
  /as an ai/i,
  /i cannot/i,
  /i am unable/i,
  /i don't know/i,
  /please provide/i,
  /\[insert/i,
  /\[your/i,
  /undefined/i,
  /error/i,
  /sorry/i,
];

// Role-specific keywords that SHOULD appear
const ROLE_KEYWORDS = {
  frontend: [
    'html', 'css', 'javascript', 'react', 'vue', 'angular',
    'dom', 'browser', 'ui', 'component', 'web', 'frontend',
    'responsive', 'layout', 'style', 'typescript', 'api',
    'performance', 'render', 'hook', 'state', 'event',
    'accessibility', 'animation', 'design',
  ],
  backend: [
    'api', 'server', 'database', 'node', 'express', 'sql',
    'nosql', 'mongodb', 'rest', 'http', 'authentication',
    'authorization', 'middleware', 'query', 'endpoint',
    'microservice', 'cache', 'security', 'backend', 'scale',
    'architecture', 'deployment', 'docker',
  ],
  data: [
    'data', 'model', 'algorithm', 'machine learning', 'python',
    'pandas', 'numpy', 'statistics', 'analysis', 'dataset',
    'training', 'feature', 'accuracy', 'neural', 'prediction',
    'classification', 'regression', 'clustering', 'sql', 'query',
    'visualization', 'distribution',
  ],
  hr: [
    'team', 'experience', 'situation', 'challenge', 'leadership',
    'communication', 'conflict', 'goal', 'strength', 'weakness',
    'motivat', 'career', 'work', 'project', 'pressure',
    'deadline', 'adapt', 'learn', 'collaborat', 'feedback',
  ],
};

// ─────────────────────────────────────────────────────────
// VALIDATE QUESTION
// Returns { isValid, reason, score }
// ─────────────────────────────────────────────────────────
const validateQuestion = (question, role, company) => {

  // ── Check 1: Length ────────────────────────────────────
  if (!question || question.length < MIN_LENGTH) {
    return {
      isValid: false,
      reason: 'Question too short',
      score: 0,
    };
  }

  if (question.length > MAX_LENGTH) {
    return {
      isValid: false,
      reason: 'Question too long',
      score: 0,
    };
  }

  // ── Check 2: Blacklist patterns ────────────────────────
  for (const pattern of BLACKLIST_PATTERNS) {
    if (pattern.test(question)) {
      return {
        isValid: false,
        reason: `Contains invalid pattern: ${pattern}`,
        score: 0,
      };
    }
  }

  // ── Check 3: Must end properly ─────────────────────────
  const endsWithPunctuation = /[?.!]$/.test(question.trim());
  if (!endsWithPunctuation) {
    return {
      isValid: false,
      reason: 'Question does not end with proper punctuation',
      score: 0,
    };
  }

  // ── Check 4: Role relevance score ─────────────────────
  const keywords = ROLE_KEYWORDS[role] || [];
  const lowerQuestion = question.toLowerCase();

  const matchedKeywords = keywords.filter((kw) =>
    lowerQuestion.includes(kw.toLowerCase())
  );

  const relevanceScore = Math.min(
    10,
    Math.round((matchedKeywords.length / Math.max(keywords.length * 0.15, 1)) * 10)
  );

  // ── Check 5: Must have minimum relevance ──────────────
  if (relevanceScore < 3) {
    return {
      isValid: false,
      reason: `Low relevance score: ${relevanceScore}/10 for role: ${role}`,
      score: relevanceScore,
    };
  }

  // ── Check 6: Must be a question ───────────────────────
  const hasQuestionIndicator =
    question.includes('?') ||
    /^(what|how|why|explain|describe|tell|when|which|compare|define)/i
      .test(question.trim());

  if (!hasQuestionIndicator) {
    return {
      isValid: false,
      reason: 'Does not appear to be a question',
      score: relevanceScore,
    };
  }

  return {
    isValid: true,
    reason: 'Passed all validation checks',
    score: relevanceScore,
  };
};

// ─────────────────────────────────────────────────────────
// CHECK FOR DUPLICATES
// Returns true if question is too similar to asked ones
// ─────────────────────────────────────────────────────────
const isDuplicate = (newQuestion, askedQuestions = []) => {
  if (!askedQuestions.length) return false;

  const normalize = (str) =>
    str.toLowerCase()
       .replace(/[^a-z0-9\s]/g, '')
       .split(' ')
       .filter(Boolean)
       .join(' ');

  const newNorm = normalize(newQuestion);
  const newWords = new Set(newNorm.split(' '));

  for (const asked of askedQuestions) {
    const askedNorm = normalize(asked);
    const askedWords = new Set(askedNorm.split(' '));

    // Calculate word overlap (Jaccard similarity)
    const intersection = new Set(
      [...newWords].filter((w) => askedWords.has(w))
    );
    const union = new Set([...newWords, ...askedWords]);
    const similarity = intersection.size / union.size;

    // If more than 60% similar → duplicate
    if (similarity > 0.6) {
      return true;
    }
  }

  return false;
};

module.exports = { validateQuestion, isDuplicate };