// server/config/gemini.js

const { GoogleGenerativeAI } = require('@google/generative-ai');

let model = null;

const getModel = () => {
  if (!process.env.GEMINI_API_KEY?.trim()) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  if (!model) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }
  return model;
};

// Company style descriptions
const companyStyles = {
  google:          'Google (focuses on problem-solving, algorithms, system design, scalability, and clean code)',
  meta:            'Meta/Facebook (focuses on product thinking, React ecosystem, data structures, and scale)',
  amazon:          'Amazon (focuses on leadership principles, AWS services, and customer-centric thinking)',
  tcs:             'TCS (focuses on core CS fundamentals, communication skills, and process-oriented thinking)',
  infosys:         'Infosys (focuses on basic programming, aptitude reasoning, and structured thinking)',
  wipro:           'Wipro (focuses on core technical skills, teamwork, and adaptability)',
  startup_general: 'a fast-paced startup (focuses on versatility, ownership, quick delivery, and full-stack thinking)',
};

// ─────────────────────────────────────────────────────────
// FUNCTION 1: Generate Question via Gemini AI
// ─────────────────────────────────────────────────────────
const generateInterviewQuestion = async (
  role,
  companyType,
  company,
  askedQuestions = []
) => {

  const avoidContext = askedQuestions.length > 0
    ? `\nIMPORTANT: Do NOT ask about these already covered topics: 
       ${askedQuestions.slice(-3).join('; ')}`
    : '';

  const prompt = `
    You are a senior technical interviewer at ${companyStyles[company] || companyStyles.startup_general}.
    
    Generate exactly ONE internship/fresher-level interview question for 
    a ${role} developer applying to ${company.toUpperCase()}.
    
    Requirements:
    - The question MUST be relevant to ${role} development
    - Keep it at internship/fresher difficulty level
    - Make it specific to ${company.toUpperCase()} interview style
    - The question must be clear, complete, and answerable
    - Do NOT include the answer
    - Do NOT number the question
    - Do NOT add any preamble or explanation
    - Return ONLY the question text ending with ?
    ${avoidContext}
  `;

  const result = await getModel().generateContent(prompt);
  const question = result.response.text().trim();
  return question;
};

// ─────────────────────────────────────────────────────────
// FUNCTION 2: Evaluate Answer
// ─────────────────────────────────────────────────────────
const evaluateInterviewAnswer = async (
  role,
  companyType,
  company,
  question,
  answer,
  answerMode = 'voice'
) => {

  const modeContext = answerMode === 'voice'
    ? 'The candidate answered verbally (voice transcription provided). Evaluate both content and communication clarity.'
    : 'The candidate provided a written answer.';

  const prompt = `
    You are an experienced technical interviewer at ${companyStyles[company] || companyStyles.startup_general}.
    ${modeContext}

    Interview question:
    "${question}"

    Candidate's answer:
    "${answer}"

    Evaluate and respond in this EXACT format only:

    Score: X/10

    Strengths:
    - strength 1
    - strength 2

    Improvements:
    - improvement 1
    - improvement 2

    Summary:
    Write 2 sentences summarizing overall performance.

    Evaluation Criteria:
    - Technical accuracy (40%)
    - Clarity and communication (30%)
    - Concept coverage and depth (30%)
    - Standard: ${company.toUpperCase()} internship level expectations
  `;

  const result = await getModel().generateContent(prompt);
  const feedbackText = result.response.text();

  const scoreMatch = feedbackText.match(/Score:\s*(\d+\/\d+)/);
  const score = scoreMatch ? scoreMatch[1] : 'N/A';

  const strengthsMatch = feedbackText.match(
    /Strengths:\s*([\s\S]*?)(?=Improvements:|$)/
  );
  const strengths = strengthsMatch
    ? strengthsMatch[1].split('\n')
        .map((s) => s.replace(/^[-*•]\s*/, '').trim())
        .filter((s) => s.length > 0)
    : [];

  const improvementsMatch = feedbackText.match(
    /Improvements:\s*([\s\S]*?)(?=Summary:|$)/
  );
  const improvements = improvementsMatch
    ? improvementsMatch[1].split('\n')
        .map((s) => s.replace(/^[-*•]\s*/, '').trim())
        .filter((s) => s.length > 0)
    : [];

  const summaryMatch = feedbackText.match(/Summary:\s*([\s\S]*?)$/);
  const summary = summaryMatch ? summaryMatch[1].trim() : '';

  return { score, strengths, improvements, summary, rawFeedback: feedbackText };
};

// ─────────────────────────────────────────────────────────
// FUNCTION 3: Generate Personalized Recommendations
// ─────────────────────────────────────────────────────────
const generateRecommendations = async (perf, userName) => {

  const prompt = `
    You are an expert interview coach analyzing ${userName}'s interview practice data.

    PERFORMANCE DATA:
    - Total sessions completed: ${perf.totalSessions}
    - Average score: ${perf.avgScore}/10
    - Latest score: ${perf.latestScore}/10
    - Performance trend: ${perf.trend}
    - Scores history (latest first): ${perf.scores.join(', ')}
    - Roles practiced: ${JSON.stringify(perf.roleCount)}
    - Companies practiced: ${JSON.stringify(perf.companyCount)}
    - Top weak areas (by frequency): ${perf.topWeakAreas.map((w) => `"${w.area}" (appeared ${w.count} times)`).join(', ')}
    - Top strengths: ${perf.topStrengths.join(', ')}
    - Average engagement score: ${perf.avgEngagement || 'N/A'}/10
    - Average eye contact: ${perf.avgEyeContact || 'N/A'}%
    - Recent session summaries: ${perf.recentSummaries.join(' | ')}

    Based on this data, generate a detailed personalized improvement plan.
    Respond in EXACTLY this format with NO extra text:

    PROGRESS:
    Write 2 sentences about their current performance level and trend. Be encouraging but honest.

    WEAKAREAS:
    - specific weak area 1 based on the data
    - specific weak area 2 based on the data
    - specific weak area 3 based on the data

    STRENGTHS:
    - specific strength 1
    - specific strength 2

    RECOMMENDATIONS:
    - actionable recommendation 1 with specific resource or technique
    - actionable recommendation 2 with specific resource or technique
    - actionable recommendation 3 with specific resource or technique
    - actionable recommendation 4 with specific resource or technique

    STUDYPLAN:
    - Day 1-2: specific topic to study
    - Day 3-4: specific topic to study
    - Day 5-6: specific topic to practice
    - Day 7: specific mock interview focus

    NEXTPRACTICE:
    Recommend exactly one role and one company they should practice next with a one-sentence reason.

    BEHAVIORAL:
    One sentence of feedback about their interview presence based on engagement and eye contact data.
  `;

  const result = await getModel().generateContent(prompt);
  const text   = result.response.text();

  const extract = (label, nextLabel) => {
    const regex = new RegExp(
      `${label}:\\s*([\\s\\S]*?)(?=${nextLabel}:|$)`, 'i'
    );
    const match = text.match(regex);
    return match ? match[1].trim() : '';
  };

  const parseList = (raw) =>
    raw
      .split('\n')
      .map((l) => l.replace(/^[-*•]\s*/, '').trim())
      .filter(Boolean);

  return {
    progress:        extract('PROGRESS',         'WEAKAREAS'),
    weakAreas:       parseList(extract('WEAKAREAS',      'STRENGTHS')),
    strengths:       parseList(extract('STRENGTHS',      'RECOMMENDATIONS')),
    recommendations: parseList(extract('RECOMMENDATIONS','STUDYPLAN')),
    studyPlan:       parseList(extract('STUDYPLAN',      'NEXTPRACTICE')),
    nextPractice:    extract('NEXTPRACTICE',      'BEHAVIORAL').trim(),
    behavioral:      extract('BEHAVIORAL',        '___END___').trim(),
    rawText:         text,
  };
};

module.exports = {
  generateInterviewQuestion,
  evaluateInterviewAnswer,
  generateRecommendations,
};