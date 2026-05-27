// server/config/gemini.js
// Lazy initialization — model created on first call, not at import
// Prevents null model from failed startup initialization

const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;
let model = null;

// ── Lazy init — called before every API request ───────────
// If GEMINI_API_KEY is missing, logs clearly and returns null
const getModel = () => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error('❌ [Gemini] GEMINI_API_KEY is missing from environment');
    return null;
  }

  // Re-initialize if not yet done
  if (!model) {
    try {
      genAI = new GoogleGenerativeAI(apiKey);
      model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      console.log('✅ [Gemini] Model initialized: gemini-2.0-flash');
    } catch (err) {
      console.error('❌ [Gemini] Initialization failed:', err.message);
      model = null;
      return null;
    }
  }

  return model;
};

// ─────────────────────────────────────────────────────────
// FUNCTION 1: Generate Interview Question
// ─────────────────────────────────────────────────────────
const generateInterviewQuestion = async (
  role, companyType, company, askedQuestions = []
) => {
  const m = getModel();
  if (!m) throw new Error('Gemini model not available');

  const askedList = askedQuestions.length > 0
    ? `\nDo NOT repeat these questions:\n${askedQuestions.slice(-5).join('\n')}`
    : '';

  const prompt = `You are a senior ${role} interviewer at ${company}.
Generate ONE internship-level technical interview question for a ${role} developer role at ${company} (${companyType} company).
The question should test practical knowledge appropriate for an internship candidate.
${askedList}
Return ONLY the question text. No preamble, no explanation, no numbering, no "Here is a question:" prefix.`;

  const result = await m.generateContent(prompt);
  const text   = result.response.text().trim();

  if (!text) throw new Error('Gemini returned empty question');
  return text;
};

// ─────────────────────────────────────────────────────────
// FUNCTION 2: Evaluate Interview Answer
// ─────────────────────────────────────────────────────────
const evaluateInterviewAnswer = async (
  role, companyType, company,
  question, answer, answerMode = 'voice'
) => {
  const m = getModel();
  if (!m) throw new Error('Gemini model not available');

  const prompt = `You are evaluating a ${role} interview answer for ${company} (${companyType}).

QUESTION: ${question}

CANDIDATE ANSWER (${answerMode} response): ${answer}

Evaluate based on:
- Technical accuracy (40%)
- Clarity and structure (30%)
- Concept coverage (30%)

Respond in EXACTLY this format:
SCORE: X/10
STRENGTHS:
- strength 1
- strength 2
- strength 3
IMPROVEMENTS:
- improvement 1
- improvement 2
- improvement 3
SUMMARY:
One paragraph summary of the answer quality.`;

  const result = await m.generateContent(prompt);
  const text   = result.response.text().trim();

  return parseEvaluationResponse(text);
};

// ─────────────────────────────────────────────────────────
// FUNCTION 3: Generate Recommendations
// ─────────────────────────────────────────────────────────
const generateRecommendations = async (perf, userName) => {
  const m = getModel();
  if (!m) throw new Error('Gemini model not available');

  const prompt = `You are an expert interview coach analyzing ${userName}'s interview practice data.

PERFORMANCE DATA:
- Total sessions: ${perf.totalSessions}
- Average score: ${perf.avgScore}/10
- Latest score: ${perf.latestScore}/10
- Trend: ${perf.trend}
- Scores history (latest first): ${perf.scores.join(', ')}
- Roles practiced: ${JSON.stringify(perf.roleCount)}
- Companies practiced: ${JSON.stringify(perf.companyCount)}
- Top weak areas: ${perf.topWeakAreas.map((w) => `"${w.area}" (${w.count} times)`).join(', ')}
- Top strengths: ${perf.topStrengths.join(', ')}
- Avg engagement: ${perf.avgEngagement || 'N/A'}/10
- Avg eye contact: ${perf.avgEyeContact || 'N/A'}%

Respond in EXACTLY this format with NO extra text:

PROGRESS:
Write 2 sentences about their current performance level and trend.

WEAKAREAS:
- specific weak area 1
- specific weak area 2
- specific weak area 3

STRENGTHS:
- specific strength 1
- specific strength 2

RECOMMENDATIONS:
- actionable recommendation 1
- actionable recommendation 2
- actionable recommendation 3
- actionable recommendation 4

STUDYPLAN:
- Day 1-2: specific topic
- Day 3-4: specific topic
- Day 5-6: specific topic
- Day 7: mock interview focus

NEXTPRACTICE:
One sentence recommending next role and company with reason.

BEHAVIORAL:
One sentence about interview presence based on engagement and eye contact.`;

  const result = await m.generateContent(prompt);
  const text   = result.response.text().trim();

  return parseRecommendationResponse(text);
};

// ─────────────────────────────────────────────────────────
// SHARED PARSERS
// ─────────────────────────────────────────────────────────
const parseEvaluationResponse = (text) => {
  const extract = (label, nextLabel) => {
    const regex = new RegExp(
      `${label}:\\s*([\\s\\S]*?)(?=${nextLabel}:|$)`, 'i'
    );
    const match = text.match(regex);
    return match ? match[1].trim() : '';
  };

  const parseList = (raw) =>
    raw.split('\n')
      .map((l) => l.replace(/^[-*•\d.]\s*/, '').trim())
      .filter(Boolean);

  const scoreRaw   = extract('SCORE', 'STRENGTHS');
  const scoreMatch = scoreRaw.match(/(\d+)/);
  const score      = scoreMatch ? `${scoreMatch[1]}/10` : '6/10';

  return {
    score,
    strengths:    parseList(extract('STRENGTHS',    'IMPROVEMENTS')),
    improvements: parseList(extract('IMPROVEMENTS', 'SUMMARY')),
    summary:      extract('SUMMARY', '___END___'),
  };
};

const parseRecommendationResponse = (text) => {
  const extract = (label, nextLabel) => {
    const regex = new RegExp(
      `${label}:\\s*([\\s\\S]*?)(?=${nextLabel}:|$)`, 'i'
    );
    const match = text.match(regex);
    return match ? match[1].trim() : '';
  };

  const parseList = (raw) =>
    raw.split('\n')
      .map((l) => l.replace(/^[-*•]\s*/, '').trim())
      .filter(Boolean);

  return {
    progress:        extract('PROGRESS',        'WEAKAREAS'),
    weakAreas:       parseList(extract('WEAKAREAS',      'STRENGTHS')),
    strengths:       parseList(extract('STRENGTHS',      'RECOMMENDATIONS')),
    recommendations: parseList(extract('RECOMMENDATIONS','STUDYPLAN')),
    studyPlan:       parseList(extract('STUDYPLAN',      'NEXTPRACTICE')),
    nextPractice:    extract('NEXTPRACTICE',     'BEHAVIORAL').trim(),
    behavioral:      extract('BEHAVIORAL',       '___END___').trim(),
  };
};

module.exports = {
  generateInterviewQuestion,
  evaluateInterviewAnswer,
  generateRecommendations,
};