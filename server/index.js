// server/index.js

const express    = require('express');
const cors       = require('cors');
const dotenv     = require('dotenv');
const connectDB  = require('./config/db');

dotenv.config();

const app = express();

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://ai-interview-platform-delta-ten.vercel.app',
    /\.vercel\.app$/,
  ],
  methods:     ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Routes ─────────────────────────────────────────────
const authRoutes           = require('./routes/authRoutes');
const interviewRoutes      = require('./routes/interviewRoutes');
const audioRoutes          = require('./routes/audioRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');

app.use('/api/auth',      authRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/audio',     audioRoutes);
app.use('/api/user',      recommendationRoutes);

app.get('/', (req, res) => {
  res.json({ message: '🚀 AI Interview Platform API', status: 'running' });
});

// ── Startup check endpoint ─────────────────────────────
app.get('/api/health', async (req, res) => {
  try {
    const CompanyDataset = require('./models/CompanyDataset');
    const Session        = require('./models/Session');
    const User           = require('./models/User');

    const [datasetCount, sessionCount, userCount] = await Promise.all([
      CompanyDataset.countDocuments({ isActive: true }),
      Session.countDocuments(),
      User.countDocuments(),
    ]);

    res.json({
      status:        'ok',
      database:      'connected',
      datasetCount,
      sessionCount,
      userCount,
      env: {
        gemini:    !!process.env.GEMINI_API_KEY,
        groq:      !!process.env.GROQ_API_KEY,
        openai:    !!process.env.OPENAI_API_KEY,
        jwt:       !!process.env.JWT_SECRET,
        mongoUri:  !!process.env.MONGO_URI,
      },
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

// ── Connect DB then start server ───────────────────────
const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
  });

  // Show startup diagnostics
  try {
    const CompanyDataset = require('./models/CompanyDataset');
    const count = await CompanyDataset.countDocuments({ isActive: true });

    if (count === 0) {
      console.log('');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('⚠️  CompanyDataset is EMPTY!');
      console.log('⚠️  Run this command to fix it:');
      console.log('    node database/seedData.js');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');
    } else {
      console.log(`✅ Dataset ready: ${count} questions loaded`);
    }

    console.log(`${process.env.GEMINI_API_KEY ? '✅' : '❌'} Gemini API key: ${process.env.GEMINI_API_KEY ? 'present' : 'MISSING'}`);
    console.log(`${process.env.GROQ_API_KEY   ? '✅' : '❌'} Groq API key:   ${process.env.GROQ_API_KEY   ? 'present' : 'MISSING'}`);
    console.log(`${process.env.OPENAI_API_KEY ? '✅' : '❌'} OpenAI API key: ${process.env.OPENAI_API_KEY ? 'present' : 'MISSING'}`);
    console.log(`${process.env.JWT_SECRET     ? '✅' : '❌'} JWT secret:     ${process.env.JWT_SECRET     ? 'present' : 'MISSING'}`);
    console.log(`${process.env.MONGO_URI      ? '✅' : '❌'} Mongo URI:      ${process.env.MONGO_URI      ? 'present' : 'MISSING'}`);

  } catch (e) {
    console.log('Could not check dataset:', e.message);
  }
});