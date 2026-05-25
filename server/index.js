// server/index.js

const express    = require('express');
const cors       = require('cors');
const dotenv     = require('dotenv');
const connectDB  = require('./config/db');

dotenv.config();
connectDB();

const app = express();


app.use(cors({
  origin: [
    'http://localhost:5173',                              // local dev
    'https://ai-interview-platform.vercel.app',          // Vercel (update after deploy)
    /\.vercel\.app$/,                                    // any Vercel preview URL
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
  res.json({
    message: '🚀 AI Interview Platform API',
    status:  'running',
    version: '2.0.0',
  });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({
    success: false,
    message: 'Internal server error.',
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});