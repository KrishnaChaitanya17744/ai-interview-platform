// server/routes/interviewRoutes.js

const express = require('express');
const router  = express.Router();

const {
  generateQuestion,
  evaluateAnswer,
} = require('../controllers/interviewController');

const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const {
  generateQuestionBodySchema,
  evaluateAnswerBodySchema,
} = require('../validation/schemas');
const { aiLimiter, apiUserLimiter } = require('../middleware/rateLimiter');

router.use(protect, apiUserLimiter);

router.post(
  '/generate-question',
  aiLimiter,
  validate(generateQuestionBodySchema),
  generateQuestion
);

router.post(
  '/evaluate-answer',
  aiLimiter,
  validate(evaluateAnswerBodySchema),
  evaluateAnswer
);

module.exports = router;
