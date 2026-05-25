// server/controllers/interviewController.js

const {
  generateInterviewQuestion,
  evaluateInterviewAnswer,
} = require('../config/gemini');

const { validateQuestion, isDuplicate } = require('../config/questionValidator');
const Session        = require('../models/Session');
const CompanyDataset = require('../models/CompanyDataset');
const { stripHtmlTags } = require('../utils/sanitize');

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

const generateQuestion = async (req, res) => {
  try {
    const { role, companyType, company, askedQuestions } = req.body;

    const sanitizedAsked = askedQuestions.map((q) => stripHtmlTags(q, 500));

    let finalQuestion = null;
    let source        = '';
    const MAX_TRIES   = 2;

    for (let i = 0; i < MAX_TRIES; i++) {
      try {
        console.log(`AI attempt ${i + 1} [${company} - ${role}]`);

        const aiQuestion = await generateInterviewQuestion(
          role, companyType, company, sanitizedAsked
        );

        const validation = validateQuestion(aiQuestion, role, company);

        if (validation.isValid && !isDuplicate(aiQuestion, sanitizedAsked)) {
          finalQuestion = stripHtmlTags(aiQuestion, 500);
          source        = 'ai_generated';
          break;
        }

        console.log(`Validation failed: ${validation.reason}`);
      } catch (err) {
        console.error(`AI attempt ${i + 1} error:`, err.message);
      }
    }

    if (!finalQuestion) {
      console.log('Falling back to dataset...');
      const entry = await getDatasetQuestion(role, company, sanitizedAsked);

      if (entry) {
        finalQuestion = stripHtmlTags(entry.question, 500);
        source        = `dataset_${entry.source}`;
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
    });
  } catch (error) {
    console.error('Generate question error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while generating question.',
    });
  }
};

const evaluateAnswer = async (req, res) => {
  try {
    const {
      question, answer, role, companyType,
      company, answerMode, emotionData,
    } = req.body;

    const safeQuestion = stripHtmlTags(question, 2000);
    const safeAnswer   = stripHtmlTags(answer, 15000);

    const feedback = await evaluateInterviewAnswer(
      role, companyType, company,
      safeQuestion, safeAnswer, answerMode || 'voice'
    );

    const session = new Session({
      userId:     req.user._id,
      role,
      companyType,
      company,
      question:   safeQuestion,
      answer:     safeAnswer,
      answerMode: answerMode || 'voice',
      score:       feedback.score,
      strengths:   feedback.strengths,
      improvements: feedback.improvements,
      summary:     feedback.summary,
      emotionData: emotionData || {
        confidence:      0,
        nervousness:     0,
        eyeContact:      0,
        facePresence:    0,
        engagementScore: 0,
      },
    });

    await session.save();
    console.log(`Session saved for user: ${req.user.email}`);

    res.status(200).json({
      success: true,
      feedback,
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
