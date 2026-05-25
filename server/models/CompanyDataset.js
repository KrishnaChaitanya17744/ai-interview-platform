// server/models/CompanyDataset.js

const mongoose = require('mongoose');

const companyDatasetSchema = new mongoose.Schema(
  {
    company: {
  type: String,
  required: true,
  enum: [
    'google', 'amazon', 'meta', 'microsoft', 'apple',
    'tcs', 'infosys', 'wipro', 'hcl', 'techmahindra',
    'flipkart', 'zoho', 'paytm',
    'startup_general', 'general'
  ],
},
    role: {
      type: String,
      required: true,
      enum: ['frontend', 'backend', 'data', 'hr'],
    },

    question: {
      type: String,
      required: true,
    },

    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },

    // Where this question came from
    source: {
      type: String,
      enum: [
        'geeksforgeeks',
        'leetcode',
        'glassdoor',
        'kaggle',
        'curated',
      ],
      default: 'curated',
    },

    // Topic tags for better filtering
    tags: {
      type: [String],
      default: [],
    },

    // Quality score (1-10) based on relevance
    qualityScore: {
      type: Number,
      default: 8,
      min: 1,
      max: 10,
    },

    // How many times this question was used
    usageCount: {
      type: Number,
      default: 0,
    },

    // Is this question active/available?
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Index for faster queries
companyDatasetSchema.index({ company: 1, role: 1 });
companyDatasetSchema.index({ role: 1, difficulty: 1 });

const CompanyDataset = mongoose.model('CompanyDataset', companyDatasetSchema);
module.exports = CompanyDataset;