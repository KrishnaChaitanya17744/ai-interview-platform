// server/routes/authRoutes.js

const express = require('express');
const router  = express.Router();

const { register, login, logout, getProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const {
  registerBodySchema,
  loginBodySchema,
} = require('../validation/schemas');
const {
  authLimiter,
  registerLimiter,
  apiUserLimiter,
} = require('../middleware/rateLimiter');

router.post('/register', registerLimiter, validate(registerBodySchema), register);
router.post('/login',    authLimiter,     validate(loginBodySchema),    login);
router.post('/logout',   logout);

router.get('/profile', protect, apiUserLimiter, getProfile);

module.exports = router;
