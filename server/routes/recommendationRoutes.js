// server/routes/recommendationRoutes.js

const express = require('express');
const router  = express.Router();

const {
  getRecommendations,
  getSessionHistory,
} = require('../controllers/recommendationController');

const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const { historyQuerySchema } = require('../validation/schemas');
const { aiLimiter, apiUserLimiter } = require('../middleware/rateLimiter');

router.use(protect, apiUserLimiter);

router.get('/recommendations', aiLimiter, getRecommendations);
router.get('/history', validate(historyQuerySchema, 'query'), getSessionHistory);

module.exports = router;
