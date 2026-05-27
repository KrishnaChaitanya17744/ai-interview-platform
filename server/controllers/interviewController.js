// server/controllers/interviewController.js

const {
  routeGenerateQuestion,
  routeEvaluateAnswer,
} = require('../config/modelRouter');

const { validateQuestion, isDuplicate } = require('../config/questionValidator');
const Session        = require('../models/Session');
const CompanyDataset = require('../models/CompanyDataset');

const getDatasetQuestion = async (role, company, askedQuestions = []) => {
  try {
    let questions = await CompanyDataset.find({
      role, company, isActive: true,
    }).sort({ qualityScore: -1 });

    if (questions.length < 3) {
      const general = await CompanyDataset.find({
        role, company: 'general', isActive: true,
      }).sort({ qualityScore: -1 });
      questions = [...questions, ...general];
    }

    const available = questions.filter(
      (q) => !isDuplicate(q.question, askedQuestions)
    );

    const pool = available.length > 0 ? available : questions;
    const top  = pool.slice(0, 5);
    const pick = top[Math.floor(Math.random() * top.length)];

    if (pick) {
      await CompanyDataset.findByIdAndUpdate(pick._id, {
        $inc: { usageCount: 1 },
      });
    }

    return pick || null;
  } catch (error) {
    console.error('Dataset fetch error:', error.message);
    return null;
  }
};

// ─────────────────────────────────────────────────────────
// POST /api/interview/generate-question
// ─────────────────────────────────────────────────────────
const generateQuestion = async (req, res) => {
  try {
    const { role, companyType, company, askedQuestions = [] } = req.body;

    if (!role || !companyType || !company) {
      return res.status(400).json({
        success: false,
        message: 'Please provide role, companyType, and company.',
      });
    }

    let finalQuestion = null;
    let source        = '';
    let provider      = '';

    // Try AI (with automatic Gemini → Groq fallback)
    for (let i = 0; i < 2; i++) {
      try {
        console.log(`🤖 AI attempt ${i + 1} [${company} - ${role}]`);

        const { result: aiQuestion, provider: prov } =
          await routeGenerateQuestion(
            role, companyType, company, askedQuestions
          );

        const validation = validateQuestion(aiQuestion, role, company);

        if (validation.isValid && !isDuplicate(aiQuestion, askedQuestions)) {
          finalQuestion = aiQuestion;
          source        = 'ai_generated';
          provider      = prov;
          break;
        }

        console.log(`⚠️ Validation failed: ${validation.reason}`);

      } catch (err) {
        console.error(`AI attempt ${i + 1} error: ${err.message}`);
      }
    }

    // Fallback to dataset
    if (!finalQuestion) {
      console.log('📚 Falling back to dataset...');
      const entry = await getDatasetQuestion(role, company, askedQuestions);

      if (entry) {
        finalQuestion = entry.question;
        source        = `dataset_${entry.source}`;
        provider      = 'dataset';
      }
    }

    if (!finalQuestion) {
      return res.status(500).json({
        success: false,
        message: 'Could not generate a question. Please try again.',
      });
    }

    res.status(200).json({
      success: true,
      question: finalQuestion,
      source,
      provider,
    });

  } catch (error) {
    console.error('Generate question error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while generating question.',
    });
  }
};

// ─────────────────────────────────────────────────────────
// POST /api/interview/evaluate-answer
// ─────────────────────────────────────────────────────────
const evaluateAnswer = async (req, res) => {
  try {
    const {
      question, answer, role, companyType,
      company, answerMode, emotionData,
    } = req.body;

    if (!question || !answer || !role || !companyType || !company) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields.',
      });
    }

    // Evaluate with automatic fallback
    const { result: feedback, provider } = await routeEvaluateAnswer(
      role, companyType, company,
      question, answer, answerMode || 'voice'
    );

    console.log(`📝 Evaluation complete [${provider}]`);

    // Save session
    const session = new Session({
      userId:     req.user._id,
      role, companyType, company,
      question, answer,
      answerMode:   answerMode || 'voice',
      score:        feedback.score,
      strengths:    feedback.strengths,
      improvements: feedback.improvements,
      summary:      feedback.summary,
      emotionData:  emotionData || {
        confidence: 0, nervousness: 0,
        eyeContact: 0, facePresence: 0, engagementScore: 0,
      },
    });

    await session.save();

    res.status(200).json({
      success: true,
      feedback,
      provider, // optional: shows which model evaluated
    });

  } catch (error) {
    console.error('Evaluate answer error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while evaluating answer.',
    });
  }
};

module.exports = { generateQuestion, evaluateAnswer };