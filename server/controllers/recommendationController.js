// server/controllers/recommendationController.js

const Session = require('../models/Session');
const { routeRecommendations } = require('../config/modelRouter');

// ─────────────────────────────────────────────────────────
// GET /api/user/recommendations
// ─────────────────────────────────────────────────────────
const getRecommendations = async (req, res) => {
  try {
    const userId = req.user._id;

    const sessions = await Session.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select(
        'role company score strengths improvements ' +
        'summary emotionData createdAt answerMode'
      );

    if (sessions.length === 0) {
      return res.status(200).json({
        success: true,
        hasData:  false,
        message:  'Complete at least one interview to get recommendations.',
      });
    }

    const performanceSummary = buildPerformanceSummary(sessions);

    const { result: recommendations } = await routeRecommendations(
      performanceSummary,
      req.user.name
    );

    res.status(200).json({
      success:         true,
      hasData:         true,
      recommendations,
      sessionCount:    sessions.length,
      performanceSummary,
    });

  } catch (error) {
    console.error('Recommendations error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error generating recommendations.',
    });
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/user/history
// ─────────────────────────────────────────────────────────
const getSessionHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const page   = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit  = Math.max(1, parseInt(req.query.limit, 10) || 10);
    const skip   = (page - 1) * limit;

    // Filters
    const filter = { userId };
    if (req.query.company) filter.company = req.query.company;
    if (req.query.role)    filter.role    = req.query.role;

    const [sessions, total] = await Promise.all([
      Session.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select(
          'role company score strengths improvements ' +
          'summary question answer createdAt answerMode emotionData'
          // ↑ answer added for detail view
        ),
      Session.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      sessions,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    });

  } catch (error) {
    console.error('Session history error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching session history.',
    });
  }
};

// ─────────────────────────────────────────────────────────
// BUILD PERFORMANCE SUMMARY
// ─────────────────────────────────────────────────────────
const buildPerformanceSummary = (sessions) => {
  const scores = sessions.map((s) => {
    const match = s.score?.match(/(\d+)\/(\d+)/);
    return match ? parseInt(match[1]) : null;
  }).filter(Boolean);

  const avgScore      = scores.length
    ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
    : 'N/A';
  const latestScore   = scores[0]  || 0;
  const previousScore = scores[1]  || 0;
  const trend         =
    scores.length < 2   ? 'insufficient data' :
    latestScore > previousScore ? 'improving' :
    latestScore < previousScore ? 'declining' :
    'stable';

  const roleCount = {};
  sessions.forEach((s) => {
    roleCount[s.role] = (roleCount[s.role] || 0) + 1;
  });

  const companyCount = {};
  sessions.forEach((s) => {
    companyCount[s.company] = (companyCount[s.company] || 0) + 1;
  });

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
    totalSessions: sessions.length,
    avgScore, latestScore, trend, scores,
    roleCount, companyCount,
    topWeakAreas, topStrengths,
    avgEngagement, avgEyeContact,
    recentSummaries: sessions.slice(0, 3).map((s) => s.summary).filter(Boolean),
  };
};

module.exports = { getRecommendations, getSessionHistory };