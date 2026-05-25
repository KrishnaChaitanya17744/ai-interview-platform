// server/models/Session.js

const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    // ── Link session to authenticated user ─────────────────
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'User ID is required'],
      index:    true, // Fast lookup by user
    },

    role: {
      type:     String,
      required: true,
      enum:     ['frontend', 'backend', 'data', 'hr'],
    },

    companyType: {
      type:     String,
      required: true,
      enum:     ['startup', 'mnc'],
    },

    company: {
      type:     String,
      required: true,
      enum: [
        'google', 'amazon', 'meta', 'microsoft', 'apple',
        'tcs', 'infosys', 'wipro', 'hcl', 'techmahindra',
        'flipkart', 'zoho', 'paytm',
        'startup_general', 'general',
      ],
    },

    question:    { type: String, required: true },
    answer:      { type: String, default: '' },
    answerMode:  { type: String, enum: ['text', 'voice'], default: 'voice' },

    score:        { type: String },
    strengths:    { type: [String], default: [] },
    improvements: { type: [String], default: [] },
    summary:      { type: String, default: '' },

    emotionData: {
      confidence:      { type: Number, default: 0 },
      nervousness:     { type: Number, default: 0 },
      eyeContact:      { type: Number, default: 0 },
      facePresence:    { type: Number, default: 0 },
      engagementScore: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

const Session = mongoose.model('Session', sessionSchema);
module.exports = Session;