// server/controllers/recommendationController.js

const Session = require('../models/Session');
const { generateRecommendations } = require('../config/gemini');
const { logSecurityEvent } = require('../utils/securityLogger');

// ─────────────────────────────────────────────────────────
// GET /api/user/recommendations
// Analyzes user's session history → returns AI recommendations
// ─────────────────────────────────────────────────────────
const getRecommendations = async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch last 10 sessions for this user only (userId is from verified JWT,
    // not from request body — prevents IDOR attacks)
    const sessions = await Session.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select(
        'role company score strengths improvements ' +
        'summary emotionData createdAt answerMode'
      );

    // Need at least 1 session to generate meaningful recommendations
    if (sessions.length === 0) {
      return res.status(200).json({
        success: true,
        hasData: false,
        message: 'Complete at least one interview to get recommendations.',
      });
    }

    // ── Build performance summary for Gemini ──────────────
    const performanceSummary = buildPerformanceSummary(sessions);

    // ── Generate AI recommendations ───────────────────────
    const recommendations = await generateRecommendations(
      performanceSummary,
      req.user.name
    );

    // SECURITY FIX: `rawText` (raw Gemini response) is removed from the
    // API response. It could contain prompt content or reveal AI internals.
    // Only structured, parsed fields are returned to the client.
    const { rawText: _rawText, ...safeRecommendations } = recommendations;

    res.status(200).json({
      success:          true,
      hasData:          true,
      recommendations:  safeRecommendations,
      sessionCount:     sessions.length,
      performanceSummary,
    });

  } catch (error) {
    // Log without PII (no email, no user content)
    console.error('[recommendationController] getRecommendations error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error generating recommendations.',
    });
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/user/history
// Returns user's past sessions for history page
// ─────────────────────────────────────────────────────────
const getSessionHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    // SECURITY FIX: Use Zod-coerced values from req.query (set by validate()
    // middleware) instead of raw query strings. Without this fix, passing
    // page="abc" would result in skip(NaN) — undefined MongoDB behavior.
    // Zod coerces and clamps these to safe integers (min 1, max 1000/50).
    const page  = Number(req.query.page)  || 1;
    const limit = Number(req.query.limit) || 5;

    // Additional safety clamp — defense in depth even after Zod validation
    const safePage  = Math.max(1, Math.min(1000, Math.floor(page)));
    const safeLimit = Math.max(1, Math.min(50,   Math.floor(limit)));
    const skip      = (safePage - 1) * safeLimit;

    const [sessions, total] = await Promise.all([
      Session.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .select(
          'role company score strengths improvements ' +
          'summary question createdAt answerMode emotionData'
        ),
      Session.countDocuments({ userId }),
    ]);

    res.status(200).json({
      success: true,
      sessions,
      pagination: {
        total,
        page:  safePage,
        pages: Math.ceil(total / safeLimit),
        limit: safeLimit,
      },
    });

  } catch (error) {
    console.error('[recommendationController] getSessionHistory error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching session history.',
    });
  }
};

// ─────────────────────────────────────────────────────────
// HELPER: Build a structured performance summary
// This is what gets sent to Gemini for analysis.
// NOTE: This data never contains raw user answers or questions —
// only aggregated metrics, so it is safe to pass to the AI.
// ─────────────────────────────────────────────────────────
const buildPerformanceSummary = (sessions) => {

  // ── Parse scores ──────────────────────────────────────
  const scores = sessions.map((s) => {
    const match = s.score?.match(/(\d+)\/(\d+)/);
    return match ? parseInt(match[1]) : null;
  }).filter(Boolean);

  const avgScore    = scores.length
    ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
    : 'N/A';

  const latestScore   = scores[0] || 0;
  const previousScore = scores[1] || 0;
  const trend =
    scores.length < 2   ? 'insufficient data' :
    latestScore > previousScore ? 'improving' :
    latestScore < previousScore ? 'declining' :
    'stable';

  // ── Count roles practiced ─────────────────────────────
  const roleCount = {};
  sessions.forEach((s) => {
    roleCount[s.role] = (roleCount[s.role] || 0) + 1;
  });

  // ── Count companies practiced ─────────────────────────
  const companyCount = {};
  sessions.forEach((s) => {
    companyCount[s.company] = (companyCount[s.company] || 0) + 1;
  });

  // ── Collect all improvements (weak areas) ─────────────
  const allImprovements = sessions.flatMap((s) => s.improvements || []);
  const improvementFreq = {};
  allImprovements.forEach((imp) => {
    const key = imp.toLowerCase().trim();
    improvementFreq[key] = (improvementFreq[key] || 0) + 1;
  });

  const topWeakAreas = Object.entries(improvementFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([area, count]) => ({ area, count }));

  // ── Collect all strengths ─────────────────────────────
  const allStrengths = sessions.flatMap((s) => s.strengths || []);
  const strengthFreq = {};
  allStrengths.forEach((str) => {
    const key = str.toLowerCase().trim();
    strengthFreq[key] = (strengthFreq[key] || 0) + 1;
  });

  const topStrengths = Object.entries(strengthFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([area]) => area);

  // ── Behavioral metrics average ─────────────────────────
  const emotionSessions = sessions.filter(
    (s) => s.emotionData?.engagementScore > 0
  );

  const avgEngagement = emotionSessions.length
    ? (emotionSessions.reduce(
        (a, s) => a + (s.emotionData.engagementScore || 0), 0
      ) / emotionSessions.length).toFixed(1)
    : null;

  const avgEyeContact = emotionSessions.length
    ? (emotionSessions.reduce(
        (a, s) => a + (s.emotionData.eyeContact || 0), 0
      ) / emotionSessions.length * 100).toFixed(0)
    : null;

  return {
    totalSessions:   sessions.length,
    avgScore,
    latestScore,
    trend,
    scores,
    roleCount,
    companyCount,
    topWeakAreas,
    topStrengths,
    avgEngagement,
    avgEyeContact,
    recentSummaries: sessions
      .slice(0, 3)
      .map((s) => s.summary)
      .filter(Boolean),
  };
};

module.exports = { getRecommendations, getSessionHistory };