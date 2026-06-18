// server/config/groq.js

const Groq = require('groq-sdk');
const parseEvaluation = require('../utils/parseEvaluation');

let groqClient = null;

const getClient = () => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ [Groq] GROQ_API_KEY missing');
    return null;
  }
  if (!groqClient) {
    try {
      groqClient = new Groq({ apiKey });
      console.log('✅ [Groq] Client initialized');
    } catch (err) {
      console.error('❌ [Groq] Init failed:', err.message);
      return null;
    }
  }
  return groqClient;
};

const stripPreamble = (text) => {
  const patterns = [
    /^here\s+is\s+.{0,50}:/i,
    /^sure[!,.]?\s*/i,
    /^certainly[!,.]?\s*/i,
    /^of course[!,.]?\s*/i,
    /^question\s*\d*\s*:/i,
    /^\d+[\.)]\s*/,
    /^interview question\s*:/i,
  ];
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  for (let i = 0; i < lines.length; i++) {
    if (!patterns.some((p) => p.test(lines[i]))) {
      return lines.slice(i).join(' ').trim();
    }
  }
  return text.trim();
};

const generateInterviewQuestionGroq = async (role, companyType, company, askedQuestions = []) => {
  const client = getClient();
  if (!client) throw new Error('Groq client not available');

  const askedList = askedQuestions.length > 0
    ? `\nDo NOT repeat: ${askedQuestions.slice(-5).join(' | ')}`
    : '';

  const res = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: 'You are a technical interviewer. Respond with ONLY the interview question. No preamble, no "Here is a question:", no explanation. Just the question ending with ?',
      },
      {
        role: 'user',
        content: `Generate ONE internship-level ${role} interview question for ${company} (${companyType}).${askedList}`,
      },
    ],
    max_tokens: 300,
    temperature: 0.7,
  });

  let text = res.choices[0]?.message?.content?.trim() || '';
  text = stripPreamble(text);
  if (!text) throw new Error('Groq returned empty question');
  return text;
};

const evaluateInterviewAnswerGroq = async (role, companyType, company, question, answer, answerMode = 'voice') => {
  const client = getClient();
  if (!client) throw new Error('Groq client not available');

  const res = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: 'You are a technical interview evaluator. Respond strictly in the requested format.',
      },
      {
        role: 'user',
        content: `Evaluate this ${role} interview answer for ${company}.

QUESTION: ${question}
ANSWER (${answerMode}): ${answer}

Respond EXACTLY:
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
One paragraph.`,
      },
    ],
    max_tokens: 700,
    temperature: 0.3,
  });

  return parseEvaluation(res.choices[0]?.message?.content?.trim() || '');
};

const generateRecommendationsGroq = async (perf, userName) => {
  const client = getClient();
  if (!client) throw new Error('Groq client not available');

  const res = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: 'You are an expert interview coach. Respond strictly in the requested format.',
      },
      {
        role: 'user',
        content: `Analyze ${userName}'s interview data.

Sessions: ${perf.totalSessions}, Avg: ${perf.avgScore}/10, Trend: ${perf.trend}
Weak areas: ${perf.topWeakAreas.map((w) => `"${w.area}" (${w.count}x)`).join(', ')}

PROGRESS:
2 sentences.

WEAKAREAS:
- area 1
- area 2
- area 3

STRENGTHS:
- strength 1
- strength 2

RECOMMENDATIONS:
- rec 1
- rec 2
- rec 3
- rec 4

STUDYPLAN:
- Day 1-2: topic
- Day 3-4: topic
- Day 5-6: topic
- Day 7: topic

NEXTPRACTICE:
One sentence.

BEHAVIORAL:
One sentence.`,
      },
    ],
    max_tokens: 900,
    temperature: 0.4,
  });

  return parseRecommendations(res.choices[0]?.message?.content?.trim() || '');
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

module.exports = {
  generateInterviewQuestionGroq,
  evaluateInterviewAnswerGroq,
  generateRecommendationsGroq,
};