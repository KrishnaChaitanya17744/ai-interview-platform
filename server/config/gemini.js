// server/config/gemini.js

const { GoogleGenerativeAI } = require('@google/generative-ai');
const parseEvaluation         = require('../utils/parseEvaluation');

let model = null;

const getModel = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ [Gemini] GEMINI_API_KEY missing');
    return null;
  }
  if (!model) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      console.log('✅ [Gemini] Initialized: gemini-2.0-flash');
    } catch (err) {
      console.error('❌ [Gemini] Init failed:', err.message);
      return null;
    }
  }
  return model;
};

const generateInterviewQuestion = async (role, companyType, company, askedQuestions = []) => {
  const m = getModel();
  if (!m) throw new Error('Gemini model not available');

  const askedList = askedQuestions.length > 0
    ? `\nDo NOT repeat these questions:\n${askedQuestions.slice(-5).join('\n')}`
    : '';

  const prompt = `You are a senior ${role} interviewer at ${company}.
Generate ONE internship-level technical interview question for a ${role} developer role at ${company} (${companyType} company).
${askedList}
Return ONLY the question text. No preamble, no explanation, no numbering.`;

  const result = await m.generateContent(prompt);
  const text   = result.response.text().trim();
  if (!text) throw new Error('Gemini returned empty question');
  return text;
};

const evaluateInterviewAnswer = async (role, companyType, company, question, answer, answerMode = 'voice') => {
  const m = getModel();
  if (!m) throw new Error('Gemini model not available');

  const prompt = `You are evaluating a ${role} interview answer for ${company} (${companyType}).

QUESTION: ${question}
CANDIDATE ANSWER (${answerMode}): ${answer}

Evaluate based on: Technical accuracy (40%), Clarity (30%), Concept coverage (30%).

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
One paragraph summary.`;

  const result = await m.generateContent(prompt);
  return parseEvaluation(result.response.text().trim());
};

const generateRecommendations = async (perf, userName) => {
  const m = getModel();
  if (!m) throw new Error('Gemini model not available');

  const prompt = `You are an expert interview coach analyzing ${userName}'s data.

PERFORMANCE:
- Sessions: ${perf.totalSessions}, Avg score: ${perf.avgScore}/10, Trend: ${perf.trend}
- Weak areas: ${perf.topWeakAreas.map((w) => `"${w.area}" (${w.count}x)`).join(', ')}
- Strengths: ${perf.topStrengths.join(', ')}

Respond in EXACTLY this format:
PROGRESS:
2 sentences about performance.

WEAKAREAS:
- area 1
- area 2
- area 3

STRENGTHS:
- strength 1
- strength 2

RECOMMENDATIONS:
- recommendation 1
- recommendation 2
- recommendation 3
- recommendation 4

STUDYPLAN:
- Day 1-2: topic
- Day 3-4: topic
- Day 5-6: topic
- Day 7: topic

NEXTPRACTICE:
One sentence recommendation.

BEHAVIORAL:
One sentence about presence.`;

  const result = await m.generateContent(prompt);
  return parseRecommendations(result.response.text().trim());
};

const parseRecommendations = (text) => {
  const extract = (label, next) => {
    const m = text.match(new RegExp(`${label}:\\s*([\\s\\S]*?)(?=${next}:|$)`, 'i'));
    return m ? m[1].trim() : '';
  };
  const list = (raw) =>
    raw.split('\n').map((l) => l.replace(/^[-*•]\s*/, '').trim()).filter(Boolean);
  return {
    progress:        extract('PROGRESS',        'WEAKAREAS'),
    weakAreas:       list(extract('WEAKAREAS',      'STRENGTHS')),
    strengths:       list(extract('STRENGTHS',      'RECOMMENDATIONS')),
    recommendations: list(extract('RECOMMENDATIONS','STUDYPLAN')),
    studyPlan:       list(extract('STUDYPLAN',      'NEXTPRACTICE')),
    nextPractice:    extract('NEXTPRACTICE',     'BEHAVIORAL').trim(),
    behavioral:      extract('BEHAVIORAL',       '___END___').trim(),
  };
};

module.exports = { generateInterviewQuestion, evaluateInterviewAnswer, generateRecommendations };