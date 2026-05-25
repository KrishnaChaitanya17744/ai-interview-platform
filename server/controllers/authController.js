// server/controllers/authController.js

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { setAuthCookie, clearAuthCookie } = require('../utils/authCookie');
const { logSecurityEvent } = require('../utils/securityLogger');
const { sanitizeString } = require('../utils/sanitize');

const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      algorithm: 'HS256',
    }
  );
};

const sendAuthSuccess = (res, statusCode, message, user, token) => {
  setAuthCookie(res, token);
  res.status(statusCode).json({
    success: true,
    message,
    token,
    user: {
      _id:       user._id,
      name:      user.name,
      email:     user.email,
      createdAt: user.createdAt,
    },
  });
};

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    const user = await User.create({
      name:     sanitizeString(name, 50),
      email,
      password,
    });

    const token = generateToken(user._id);
    console.log(`New user registered: ${user.email}`);
    sendAuthSuccess(res, 201, 'Account created successfully.', user, token);
  } catch (error) {
    console.error('Register error:', error.message);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: messages[0],
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during registration.',
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      logSecurityEvent('failed_login', { email, ip: req.ip, reason: 'unknown_user' });
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      logSecurityEvent('failed_login', { email, ip: req.ip, reason: 'bad_password' });
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const token = generateToken(user._id);
    console.log(`User logged in: ${user.email}`);
    sendAuthSuccess(res, 200, 'Login successful.', user, token);
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error during login.',
    });
  }
};

const logout = (_req, res) => {
  clearAuthCookie(res);
  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    res.status(200).json({
      success: true,
      user: {
        _id:       user._id,
        name:      user.name,
        email:     user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Profile error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error fetching profile.',
    });
  }
};

module.exports = { register, login, logout, getProfile };
