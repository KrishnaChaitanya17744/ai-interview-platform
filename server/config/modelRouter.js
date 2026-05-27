// server/config/modelRouter.js
// Routes AI calls: Gemini primary → Groq fallback
// Both providers use lazy initialization

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

// ── Detect quota / rate limit errors ─────────────────────
const isQuotaError = (err) => {
  const msg = err?.message?.toLowerCase() || '';
  return (
    msg.includes('429') ||
    msg.includes('quota') ||
    msg.includes('resource_exhausted') ||
    msg.includes('too many requests') ||
    msg.includes('rate limit')
  );
};

// ── Detect initialization errors ─────────────────────────
const isInitError = (err) => {
  const msg = err?.message?.toLowerCase() || '';
  return (
    msg.includes('not available') ||
    msg.includes('null') ||
    msg.includes('undefined') ||
    msg.includes('missing')
  );
};

// ─────────────────────────────────────────────────────────
// GENERATE QUESTION
// ─────────────────────────────────────────────────────────
const routeGenerateQuestion = async (
  role, companyType, company, askedQuestions
) => {
  // Try Gemini
  try {
    const result = await generateInterviewQuestion(
      role, companyType, company, askedQuestions
    );
    console.log(`✅ Question generated [Gemini]`);
    return { result, provider: 'gemini' };

  } catch (err) {
    if (isQuotaError(err)) {
      console.warn(`⚠️ Gemini quota — routing to Groq`);
    } else if (isInitError(err)) {
      console.warn(`⚠️ Gemini not initialized — routing to Groq`);
    } else {
      console.error(`Gemini question error: ${err.message}`);
    }
  }

  // Fallback to Groq
  try {
    const result = await generateInterviewQuestionGroq(
      role, companyType, company, askedQuestions
    );
    console.log(`✅ Question generated [Groq]`);
    return { result, provider: 'groq' };

  } catch (err) {
    console.error(`Groq question error: ${err.message}`);
    throw new Error('All AI providers failed for question generation.');
  }
};

// ─────────────────────────────────────────────────────────
// EVALUATE ANSWER
// ─────────────────────────────────────────────────────────
const routeEvaluateAnswer = async (
  role, companyType, company,
  question, answer, answerMode
) => {
  // Try Gemini
  try {
    const result = await evaluateInterviewAnswer(
      role, companyType, company,
      question, answer, answerMode
    );
    console.log(`✅ Answer evaluated [Gemini]`);
    return { result, provider: 'gemini' };

  } catch (err) {
    if (isQuotaError(err)) {
      console.warn(`⚠️ Gemini quota — routing to Groq`);
    } else if (isInitError(err)) {
      console.warn(`⚠️ Gemini not initialized — routing to Groq`);
    } else {
      console.error(`Gemini eval error: ${err.message}`);
    }
  }

  // Fallback to Groq
  try {
    const result = await evaluateInterviewAnswerGroq(
      role, companyType, company,
      question, answer, answerMode
    );
    console.log(`✅ Answer evaluated [Groq]`);
    return { result, provider: 'groq' };

  } catch (err) {
    console.error(`Groq eval error: ${err.message}`);
    throw new Error('All AI providers failed for evaluation.');
  }
};

// ─────────────────────────────────────────────────────────
// GENERATE RECOMMENDATIONS
// ─────────────────────────────────────────────────────────
const routeRecommendations = async (perf, userName) => {
  // Try Gemini
  try {
    const result = await generateRecommendations(perf, userName);
    console.log(`✅ Recommendations generated [Gemini]`);
    return { result, provider: 'gemini' };

  } catch (err) {
    if (isQuotaError(err)) {
      console.warn(`⚠️ Gemini quota — routing to Groq`);
    } else if (isInitError(err)) {
      console.warn(`⚠️ Gemini not initialized — routing to Groq`);
    } else {
      console.error(`Gemini rec error: ${err.message}`);
    }
  }

  // Fallback to Groq
  try {
    const result = await generateRecommendationsGroq(perf, userName);
    console.log(`✅ Recommendations generated [Groq]`);
    return { result, provider: 'groq' };

  } catch (err) {
    console.error(`Groq rec error: ${err.message}`);
    throw new Error('All AI providers failed for recommendations.');
  }
};

module.exports = {
  routeGenerateQuestion,
  routeEvaluateAnswer,
  routeRecommendations,
};