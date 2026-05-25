// server/validation/schemas.js
// Zod schemas — strict mode rejects unknown fields (mass-assignment / pollution).

const { z } = require('zod');

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Please enter a valid email')
  .max(254);

const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters')
  .max(128, 'Password cannot exceed 128 characters');

const nameSchema = z
  .string()
  .trim()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name cannot exceed 50 characters');

const roleEnum = z.enum(['frontend', 'backend', 'data', 'hr']);
const companyTypeEnum = z.enum(['startup', 'mnc']);
const companyEnum = z.enum([
  'google', 'amazon', 'meta', 'microsoft', 'apple',
  'tcs', 'infosys', 'wipro', 'hcl', 'techmahindra',
  'flipkart', 'zoho', 'paytm',
  'startup_general', 'general',
]);
const answerModeEnum = z.enum(['text', 'voice']);

const emotionDataSchema = z.object({
  confidence:      z.number().min(0).max(100).optional(),
  nervousness:     z.number().min(0).max(100).optional(),
  eyeContact:      z.number().min(0).max(1).optional(),
  facePresence:    z.number().min(0).max(1).optional(),
  engagementScore: z.number().min(0).max(10).optional(),
}).strict().optional();

const registerBodySchema = z.object({
  name:     nameSchema,
  email:    emailSchema,
  password: passwordSchema,
}).strict();

const loginBodySchema = z.object({
  email:    emailSchema,
  password: z.string().min(1, 'Password is required').max(128),
}).strict();

const generateQuestionBodySchema = z.object({
  role:            roleEnum,
  companyType:     companyTypeEnum,
  company:         companyEnum,
  askedQuestions:  z.array(z.string().trim().max(500)).max(50).optional().default([]),
}).strict();

const evaluateAnswerBodySchema = z.object({
  role:         roleEnum,
  companyType:  companyTypeEnum,
  company:      companyEnum,
  question:     z.string().trim().min(10).max(2000),
  answer:       z.string().trim().min(1).max(15000),
  answerMode:   answerModeEnum.optional().default('voice'),
  emotionData:  emotionDataSchema,
}).strict();

const historyQuerySchema = z.object({
  page:  z.coerce.number().int().min(1).max(1000).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(5),
}).strict();

module.exports = {
  registerBodySchema,
  loginBodySchema,
  generateQuestionBodySchema,
  evaluateAnswerBodySchema,
  historyQuerySchema,
};
