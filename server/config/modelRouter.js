// server/config/modelRouter.js

const {
  generateInterviewQuestion,
  evaluateInterviewAnswer,
  generateRecommendations,
} = require('./gemini');

const {
  generateInterviewQuestionGroq,
  evaluateInterviewAnswerGroq,
  generateRecommendationsGroq,
} = require('./groq');

const isQuotaError = (err) => {
  const msg = (err?.message || '').toLowerCase();
  return msg.includes('429') ||
         msg.includes('quota') ||
         msg.includes('resource_exhausted') ||
         msg.includes('too many requests') ||
         msg.includes('rate limit');
};

const tryGemini = async (fn, label) => {
  try {
    const result = await fn();
    console.log(`✅ ${label} [Gemini]`);
    return { result, provider: 'gemini' };
  } catch (err) {
    if (isQuotaError(err)) {
      console.warn(`⚠️ Gemini quota → Groq [${label}]`);
    } else {
      console.warn(`⚠️ Gemini failed → Groq [${label}]: ${err.message}`);
    }
    return null;
  }
};

const tryGroq = async (fn, label) => {
  try {
    const result = await fn();
    console.log(`✅ ${label} [Groq]`);
    return { result, provider: 'groq' };
  } catch (err) {
    console.error(`❌ Groq failed [${label}]: ${err.message}`);
    return null;
  }
};

const routeGenerateQuestion = async (role, companyType, company, askedQuestions) => {
  const gemini = await tryGemini(
    () => generateInterviewQuestion(role, companyType, company, askedQuestions),
    'Question'
  );
  if (gemini) return gemini;

  const groq = await tryGroq(
    () => generateInterviewQuestionGroq(role, companyType, company, askedQuestions),
    'Question'
  );
  if (groq) return groq;

  throw new Error('All AI providers failed for question generation');
};

const routeEvaluateAnswer = async (role, companyType, company, question, answer, answerMode) => {
  const gemini = await tryGemini(
    () => evaluateInterviewAnswer(role, companyType, company, question, answer, answerMode),
    'Evaluation'
  );
  if (gemini) return gemini;

  const groq = await tryGroq(
    () => evaluateInterviewAnswerGroq(role, companyType, company, question, answer, answerMode),
    'Evaluation'
  );
  if (groq) return groq;

  throw new Error('All AI providers failed for evaluation');
};

const routeRecommendations = async (perf, userName) => {
  const gemini = await tryGemini(
    () => generateRecommendations(perf, userName),
    'Recommendations'
  );
  if (gemini) return gemini;

  const groq = await tryGroq(
    () => generateRecommendationsGroq(perf, userName),
    'Recommendations'
  );
  if (groq) return groq;

  throw new Error('All AI providers failed for recommendations');
};

module.exports = { routeGenerateQuestion, routeEvaluateAnswer, routeRecommendations };