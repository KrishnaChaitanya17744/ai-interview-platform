// server/config/groq.js
// Groq API — Free tier: 14,400 req/day
// Fallback when Gemini quota exceeded or unavailable

const Groq = require('groq-sdk');

let groqClient = null;

// ── Lazy init ─────────────────────────────────────────────
const getGroqClient = () => {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    console.error('❌ [Groq] GROQ_API_KEY is missing from environment');
    return null;
  }

  if (!groqClient) {
    try {
      groqClient = new Groq({ apiKey });
      console.log('✅ [Groq] Client initialized');
    } catch (err) {
      console.error('❌ [Groq] Initialization failed:', err.message);
      groqClient = null;
    }
  }

  return groqClient;
};

// ─────────────────────────────────────────────────────────
// FUNCTION 1: Generate Interview Question
// ─────────────────────────────────────────────────────────
const generateInterviewQuestionGroq = async (
  role, companyType, company, askedQuestions = []
) => {
  const client = getGroqClient();
  if (!client) throw new Error('Groq client not available');

  const askedList = askedQuestions.length > 0
    ? `\nDo NOT repeat these questions:\n${askedQuestions.slice(-5).join('\n')}`
    : '';

  // System prompt separates instruction from content
  // Prevents preamble like "Here is a question:"
  const response = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content:
          'You are a technical interviewer. When asked to generate an interview question, ' +
          'you respond with ONLY the question text itself. ' +
          'No preamble, no "Here is a question:", no explanation, no numbering. ' +
          'Just the question ending with a question mark.',
      },
      {
        role: 'user',
        content:
          `Generate ONE internship-level technical interview question for a ` +
          `${role} developer role at ${company} (${companyType} company).` +
          askedList,
      },
    ],
    max_tokens:  300,
    temperature: 0.7,
  });

  let text = response.choices[0]?.message?.content?.trim() || '';

  // Strip any preamble Llama still adds despite instructions
  text = stripPreamble(text);

  if (!text) throw new Error('Groq returned empty question');
  return text;
};

// ─────────────────────────────────────────────────────────
// FUNCTION 2: Evaluate Interview Answer
// ─────────────────────────────────────────────────────────
const evaluateInterviewAnswerGroq = async (
  role, companyType, company,
  question, answer, answerMode = 'voice'
) => {
  const client = getGroqClient();
  if (!client) throw new Error('Groq client not available');

  const response = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content:
          'You are a technical interview evaluator. ' +
          'Respond strictly in the requested format with no extra commentary.',
      },
      {
        role: 'user',
        content: `Evaluate this ${role} interview answer for ${company} (${companyType}).

QUESTION: ${question}

CANDIDATE ANSWER (${answerMode} response): ${answer}

Scoring criteria:
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
One paragraph summary of the answer quality.`,
      },
    ],
    max_tokens:  700,
    temperature: 0.3,
  });

  const text = response.choices[0]?.message?.content?.trim() || '';
  return parseEvaluationResponse(text);
};

// ─────────────────────────────────────────────────────────
// FUNCTION 3: Generate Recommendations
// ─────────────────────────────────────────────────────────
const generateRecommendationsGroq = async (perf, userName) => {
  const client = getGroqClient();
  if (!client) throw new Error('Groq client not available');

  const response = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content:
          'You are an expert interview coach. ' +
          'Respond strictly in the requested format with no extra commentary.',
      },
      {
        role: 'user',
        content: `Analyze ${userName}'s interview practice data and generate a personalized improvement plan.

PERFORMANCE DATA:
- Total sessions: ${perf.totalSessions}
- Average score: ${perf.avgScore}/10
- Latest score: ${perf.latestScore}/10
- Trend: ${perf.trend}
- Scores (latest first): ${perf.scores.join(', ')}
- Roles practiced: ${JSON.stringify(perf.roleCount)}
- Companies practiced: ${JSON.stringify(perf.companyCount)}
- Top weak areas: ${perf.topWeakAreas.map((w) => `"${w.area}" (${w.count} times)`).join(', ')}
- Top strengths: ${perf.topStrengths.join(', ')}
- Avg engagement: ${perf.avgEngagement || 'N/A'}/10
- Avg eye contact: ${perf.avgEyeContact || 'N/A'}%

Respond in EXACTLY this format:
PROGRESS:
2 sentences about current performance and trend.

WEAKAREAS:
- weak area 1
- weak area 2
- weak area 3

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
One sentence recommending next role and company.

BEHAVIORAL:
One sentence about interview presence.`,
      },
    ],
    max_tokens:  900,
    temperature: 0.4,
  });

  const text = response.choices[0]?.message?.content?.trim() || '';
  return parseRecommendationResponse(text);
};

// ─────────────────────────────────────────────────────────
// STRIP PREAMBLE
// Removes lines like "Here is a question:" that LLMs add
// despite being told not to
// ─────────────────────────────────────────────────────────
const stripPreamble = (text) => {
  const preamblePatterns = [
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
    const line = lines[i];
    const isPreamble = preamblePatterns.some((p) => p.test(line));

    if (!isPreamble) {
      // This line looks like the actual question
      return lines.slice(i).join(' ').trim();
    }
  }

  return text.trim();
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
  generateInterviewQuestionGroq,
  evaluateInterviewAnswerGroq,
  generateRecommendationsGroq,
};