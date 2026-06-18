// server/controllers/interviewController.js

const { routeGenerateQuestion, routeEvaluateAnswer } = require('../config/modelRouter');
const { validateQuestion, isDuplicate }               = require('../config/questionValidator');
const Session        = require('../models/Session');
const CompanyDataset = require('../models/CompanyDataset');

// ── Hardcoded emergency questions ────────────────────────
// Used when ALL other sources fail
// Ensures the app NEVER returns an error to the user
const EMERGENCY_QUESTIONS = {
  frontend: [
    'What is the difference between var, let, and const in JavaScript? When would you use each?',
    'Explain the concept of closures in JavaScript with an example.',
    'What is the virtual DOM in React and how does it improve performance?',
    'How does CSS specificity work? Explain with examples.',
    'What is the difference between synchronous and asynchronous JavaScript?',
  ],
  backend: [
    'What is the difference between SQL and NoSQL databases? When would you choose one over the other?',
    'Explain REST API principles and what makes an API RESTful.',
    'What is middleware in Express.js and how does it work?',
    'How does JWT authentication work? Explain the token lifecycle.',
    'What is the event loop in Node.js and how does it handle asynchronous operations?',
  ],
  data: [
    'What is the difference between supervised and unsupervised learning?',
    'Explain overfitting and underfitting. How do you handle them?',
    'What is the difference between a list and a tuple in Python?',
    'Explain the concept of cross-validation in machine learning.',
    'What is pandas and how is it used in data analysis?',
  ],
  hr: [
    'Tell me about yourself and why you are interested in this role.',
    'Describe a challenging situation you faced and how you resolved it.',
    'Where do you see yourself in 5 years?',
    'What are your greatest strengths and areas for improvement?',
    'Why do you want to work at this company specifically?',
  ],
};

const getEmergencyQuestion = (role, askedQuestions) => {
  const questions = EMERGENCY_QUESTIONS[role] || EMERGENCY_QUESTIONS.hr;
  const available  = questions.filter((q) => !isDuplicate(q, askedQuestions));
  const pool       = available.length > 0 ? available : questions;
  return pool[Math.floor(Math.random() * pool.length)];
};

// ── Dataset fallback ──────────────────────────────────────
const getDatasetQuestion = async (role, company, askedQuestions = []) => {
  try {
    const totalCount = await CompanyDataset.countDocuments({ isActive: true });
    console.log(`📚 Dataset total documents: ${totalCount}`);

    if (totalCount === 0) {
      console.warn('⚠️ CompanyDataset is EMPTY — run: node database/seedData.js');
      return null;
    }

    let questions = await CompanyDataset.find({
      role, company, isActive: true,
    }).sort({ qualityScore: -1 });

    console.log(`📚 Company-specific: ${questions.length} found [${company} - ${role}]`);

    if (questions.length < 3) {
      const general = await CompanyDataset.find({
        role, company: 'general', isActive: true,
      }).sort({ qualityScore: -1 });
      console.log(`📚 General pool: ${general.length} found`);
      questions = [...questions, ...general];
    }

    const available = questions.filter((q) => !isDuplicate(q.question, askedQuestions));
    const pool      = available.length > 0 ? available : questions;

    if (pool.length === 0) {
      console.warn('⚠️ No usable dataset questions found');
      return null;
    }

    const top  = pool.slice(0, 5);
    const pick = top[Math.floor(Math.random() * top.length)];

    if (pick) {
      await CompanyDataset.findByIdAndUpdate(pick._id, { $inc: { usageCount: 1 } });
      console.log(`✅ Dataset question selected: "${pick.question.slice(0, 60)}..."`);
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

    console.log(`\n🎯 Generate question: role=${role}, company=${company}, companyType=${companyType}`);

    if (!role || !companyType || !company) {
      return res.status(400).json({
        success: false,
        message: 'Please provide role, companyType, and company.',
      });
    }

    let finalQuestion = null;
    let source        = '';
    let provider      = '';

    // ── Attempt 1: AI via router (Gemini → Groq auto-fallback) ──
    for (let i = 0; i < 2; i++) {
      try {
        console.log(`🤖 AI attempt ${i + 1}`);

        const { result: aiQuestion, provider: prov } =
          await routeGenerateQuestion(role, companyType, company, askedQuestions);

        console.log(`AI returned [${prov}]: "${aiQuestion?.slice(0, 80)}"`);

        const validation = validateQuestion(aiQuestion, role, company);
        console.log(`Validation: ${validation.isValid ? '✅ PASS' : `❌ FAIL — ${validation.reason}`}`);

        if (validation.isValid && !isDuplicate(aiQuestion, askedQuestions)) {
          finalQuestion = aiQuestion;
          source        = 'ai_generated';
          provider      = prov;
          break;
        }

        // If validation fails, still use it rather than nothing
        if (i === 1 && !finalQuestion && aiQuestion && aiQuestion.length > 15) {
          console.log('⚠️ Using AI question despite validation failure (attempt 2)');
          finalQuestion = aiQuestion;
          source        = 'ai_generated';
          provider      = prov;
        }

      } catch (err) {
        console.error(`❌ AI attempt ${i + 1} error: ${err.message}`);
      }
    }

    // ── Attempt 2: Dataset ────────────────────────────────
    if (!finalQuestion) {
      console.log('📚 Trying dataset...');
      const entry = await getDatasetQuestion(role, company, askedQuestions);
      if (entry) {
        finalQuestion = entry.question;
        source        = `dataset_${entry.source || 'curated'}`;
        provider      = 'dataset';
      }
    }

    // ── Attempt 3: Emergency hardcoded questions ──────────
    if (!finalQuestion) {
      console.log('🆘 Using emergency hardcoded question');
      finalQuestion = getEmergencyQuestion(role, askedQuestions);
      source        = 'emergency_fallback';
      provider      = 'hardcoded';
    }

    // This should NEVER be reached now
    if (!finalQuestion) {
      return res.status(500).json({
        success: false,
        message: 'Could not generate a question. Please try again.',
      });
    }

    console.log(`✅ Question ready [${provider}/${source}]\n`);

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

    console.log(`\n📝 Evaluate answer: role=${role}, company=${company}`);

    if (!question || !answer || !role || !companyType || !company) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields.',
      });
    }

    const { result: feedback, provider } = await routeEvaluateAnswer(
      role, companyType, company,
      question, answer, answerMode || 'voice'
    );

    console.log(`✅ Evaluation complete [${provider}]`);

    const session = new Session({
      userId:       req.user._id,
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
    console.log(`💾 Session saved [${req.user.email}]\n`);

    res.status(200).json({ success: true, feedback, provider });

  } catch (error) {
    console.error('Evaluate answer error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while evaluating answer.',
    });
  }
};

module.exports = { generateQuestion, evaluateAnswer };