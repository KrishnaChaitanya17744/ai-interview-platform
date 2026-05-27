// client/src/pages/DashboardPage.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, Link }          from 'react-router-dom';
import { useAuth }                    from '../context/AuthContext';
import { getSessionHistory, getRecommendations } from '../services/api';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell,
} from 'recharts';
import '../dashboard.css';

// ── Helpers ───────────────────────────────────────────────
const parseScore = (scoreStr) => {
  if (!scoreStr) return null;
  const match = scoreStr.match(/(\d+)\/(\d+)/);
  return match ? parseInt(match[1]) : null;
};

const formatDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short',
  });
};

const COMPANY_COLORS = {
  google: '#4285F4', amazon: '#FF9900', meta: '#0081FB',
  microsoft: '#00A4EF', apple: '#A2AAAD', tcs: '#0057A8',
  infosys: '#007CC3', wipro: '#9B4DCA', flipkart: '#2874F0',
  zoho: '#E2561A', paytm: '#00BAF2', hcl: '#009F6B',
  techmahindra: '#E4002B', startup_general: '#10B981',
  general: '#8B5CF6',
};

const ROLE_LABELS = {
  frontend: 'Frontend', backend: 'Backend',
  data: 'Data Science', hr: 'HR Round',
};

// ── Stat Card ─────────────────────────────────────────────
const StatCard = ({ icon, label, value, sub, color }) => (
  <div className="dash-stat-card">
    <div className="dash-stat-icon" style={{ color }}>{icon}</div>
    <div className="dash-stat-body">
      <div className="dash-stat-value" style={{ color }}>{value}</div>
      <div className="dash-stat-label">{label}</div>
      {sub && <div className="dash-stat-sub">{sub}</div>}
    </div>
  </div>
);

// ── Custom Tooltip ────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="dash-tooltip">
      <p className="dash-tooltip-label">{label}</p>
      <p className="dash-tooltip-value">{payload[0].value}/10</p>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// MAIN DASHBOARD PAGE
// ─────────────────────────────────────────────────────────
const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate          = useNavigate();

  const [sessions,  setSessions]  = useState([]);
  const [recData,   setRecData]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [histRes, recRes] = await Promise.all([
        getSessionHistory(1, 50),   // last 50 sessions
        getRecommendations(),
      ]);

      if (histRes.success) setSessions(histRes.sessions || []);
      if (recRes.success && recRes.hasData) setRecData(recRes);

    } catch (e) {
      setError('Failed to load dashboard data.');
    }
    setLoading(false);
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  // ── Derived stats ──────────────────────────────────────
  const scores = sessions
    .map((s) => parseScore(s.score))
    .filter(Boolean);

  const avgScore     = scores.length
    ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
    : '—';
  const bestScore    = scores.length ? Math.max(...scores) : '—';
  const totalSessions = sessions.length;

  // Score trend data (last 10)
  const trendData = sessions
    .slice(0, 10)
    .reverse()
    .map((s, i) => ({
      name:  formatDate(s.createdAt),
      score: parseScore(s.score) || 0,
    }));

  // Company distribution
  const companyCount = {};
  sessions.forEach((s) => {
    const label = s.company?.replace('_', ' ');
    companyCount[label] = (companyCount[label] || 0) + 1;
  });
  const companyData = Object.entries(companyCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name, count }));

  // Best company (highest avg score)
  const companyScores = {};
  sessions.forEach((s) => {
    const c = s.company;
    const sc = parseScore(s.score);
    if (!sc) return;
    if (!companyScores[c]) companyScores[c] = [];
    companyScores[c].push(sc);
  });
  const bestCompany = Object.entries(companyScores)
    .map(([c, arr]) => ({
      company: c,
      avg: arr.reduce((a, b) => a + b, 0) / arr.length,
    }))
    .sort((a, b) => b.avg - a.avg)[0]?.company?.replace('_', ' ') || '—';

  // Avg engagement
  const engagements = sessions
    .map((s) => s.emotionData?.engagementScore)
    .filter(Boolean);
  const avgEngagement = engagements.length
    ? (engagements.reduce((a, b) => a + b, 0) / engagements.length).toFixed(1)
    : '—';

  // ── Render ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="dash-loading">
        <div className="dash-loading-spinner" />
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dash-page">

      {/* ── Top Nav ──────────────────────────────────── */}
      <nav className="dash-nav">
        <div className="dash-nav-brand">
          <span className="dash-nav-icon">🤖</span>
          <span className="dash-nav-name">InterviewAI</span>
        </div>

        <div className="dash-nav-links">
          <Link to="/dashboard" className="dash-nav-link active">
            Dashboard
          </Link>
          <Link to="/interview" className="dash-nav-link">
            Practice
          </Link>
        </div>

        <div className="dash-nav-right">
          <span className="dash-nav-user">👋 {user?.name}</span>
          <button className="dash-nav-logout" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </nav>

      {/* ── Content ──────────────────────────────────── */}
      <main className="dash-main">

        {/* Header */}
        <div className="dash-page-header">
          <div>
            <h1 className="dash-page-title">
              Welcome back, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="dash-page-sub">
              Here's your interview performance overview
            </p>
          </div>
          <Link to="/interview" className="dash-start-btn">
            ✦ Start Practice
          </Link>
        </div>

        {/* No sessions state */}
        {totalSessions === 0 && (
          <div className="dash-empty">
            <div className="dash-empty-icon">🎯</div>
            <h2>No sessions yet</h2>
            <p>Complete your first interview to see analytics here.</p>
            <Link to="/interview" className="dash-start-btn">
              Start Your First Interview
            </Link>
          </div>
        )}

        {totalSessions > 0 && (
          <>
            {/* ── Stat Cards ─────────────────────────── */}
            <div className="dash-stats-grid">
              <StatCard
                icon="📊" label="Total Sessions"
                value={totalSessions} color="#4f6ef7"
              />
              <StatCard
                icon="⭐" label="Average Score"
                value={`${avgScore}/10`} color="#fbbf24"
              />
              <StatCard
                icon="🏆" label="Best Score"
                value={`${bestScore}/10`} color="#34d399"
              />
              <StatCard
                icon="📹" label="Avg Engagement"
                value={avgEngagement !== '—' ? `${avgEngagement}/10` : '—'}
                color="#a78bfa"
                sub="behavioral"
              />
            </div>

            {/* ── Charts Row ─────────────────────────── */}
            <div className="dash-charts-row">

              {/* Score Trend */}
              <div className="dash-card">
                <h3 className="dash-card-title">📈 Score Trend</h3>
                <p className="dash-card-sub">Last {trendData.length} sessions</p>
                <div className="dash-chart-wrapper">
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={trendData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.05)"
                      />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[0, 10]}
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        width={20}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#4f6ef7"
                        strokeWidth={2.5}
                        dot={{ fill: '#4f6ef7', r: 4 }}
                        activeDot={{ r: 6, fill: '#a78bfa' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Company Distribution */}
              <div className="dash-card">
                <h3 className="dash-card-title">🏢 Practice Distribution</h3>
                <p className="dash-card-sub">Sessions by company</p>
                <div className="dash-chart-wrapper">
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={companyData} barSize={28}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.05)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: '#64748b', fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        width={20}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: '#1c1f29',
                          border: '1px solid #2a2d3a',
                          borderRadius: '8px',
                          color: '#e2e8f0',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {companyData.map((entry, i) => (
                          <Cell
                            key={i}
                            fill={
                              COMPANY_COLORS[entry.name.toLowerCase().replace(' ', '')] ||
                              '#4f6ef7'
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* ── Recent Sessions ─────────────────────── */}
            <div className="dash-card">
              <h3 className="dash-card-title">🕐 Recent Sessions</h3>
              <p className="dash-card-sub">
                Your last {Math.min(sessions.length, 8)} interviews
              </p>
              <div className="dash-table-wrapper">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>Role</th>
                      <th>Score</th>
                      <th>Engagement</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.slice(0, 8).map((s, i) => {
                      const sc = parseScore(s.score);
                      const scoreColor =
                        sc >= 8 ? '#34d399' :
                        sc >= 6 ? '#fbbf24' :
                        sc >= 4 ? '#fb923c' : '#f87171';

                      return (
                        <tr key={i}>
                          <td>
                            <div className="dash-company-cell">
                              <img
                                src={`https://www.google.com/s2/favicons?domain=${
                                  s.company?.replace('_general', '.com').replace('_', '') + '.com'
                                }&sz=32`}
                                alt=""
                                className="dash-company-logo"
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                              <span>
                                {s.company?.replace('_', ' ') || '—'}
                              </span>
                            </div>
                          </td>
                          <td>
                            <span className="dash-role-badge">
                              {ROLE_LABELS[s.role] || s.role}
                            </span>
                          </td>
                          <td>
                            <span
                              className="dash-score-badge"
                              style={{ color: scoreColor, borderColor: scoreColor + '44', background: scoreColor + '11' }}
                            >
                              {s.score || '—'}
                            </span>
                          </td>
                          <td className="dash-engagement-cell">
                            {s.emotionData?.engagementScore
                              ? `${s.emotionData.engagementScore.toFixed(1)}/10`
                              : '—'}
                          </td>
                          <td className="dash-date-cell">
                            {formatDate(s.createdAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Bottom Row ──────────────────────────── */}
            <div className="dash-bottom-row">

              {/* Weak Areas */}
              {recData?.performanceSummary?.topWeakAreas?.length > 0 && (
                <div className="dash-card">
                  <h3 className="dash-card-title">⚠️ Top Weak Areas</h3>
                  <p className="dash-card-sub">Based on AI feedback across sessions</p>
                  <div className="dash-weak-list">
                    {recData.performanceSummary.topWeakAreas
                      .slice(0, 5)
                      .map((w, i) => (
                        <div key={i} className="dash-weak-item">
                          <div className="dash-weak-bar-track">
                            <div
                              className="dash-weak-bar-fill"
                              style={{
                                width: `${Math.min(100, (w.count / sessions.length) * 100 * 2)}%`,
                              }}
                            />
                          </div>
                          <span className="dash-weak-text">{w.area}</span>
                          <span className="dash-weak-count">
                            ×{w.count}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Behavioral Summary */}
              <div className="dash-card">
                <h3 className="dash-card-title">📹 Behavioral Summary</h3>
                <p className="dash-card-sub">Average across all sessions</p>
                <div className="dash-behavioral-grid">
                  {[
                    {
                      label: 'Eye Contact',
                      icon: '👁️',
                      value: sessions.filter(s => s.emotionData?.eyeContact).length > 0
                        ? `${(sessions.reduce((a, s) => a + (s.emotionData?.eyeContact || 0), 0) / sessions.filter(s => s.emotionData?.eyeContact).length * 100).toFixed(0)}%`
                        : '—',
                      color: '#4f6ef7',
                    },
                    {
                      label: 'Engagement',
                      icon: '🔥',
                      value: avgEngagement !== '—' ? `${avgEngagement}/10` : '—',
                      color: '#fbbf24',
                    },
                    {
                      label: 'Face Presence',
                      icon: '👤',
                      value: sessions.filter(s => s.emotionData?.facePresence).length > 0
                        ? `${(sessions.reduce((a, s) => a + (s.emotionData?.facePresence || 0), 0) / sessions.filter(s => s.emotionData?.facePresence).length * 100).toFixed(0)}%`
                        : '—',
                      color: '#34d399',
                    },
                    {
                      label: 'Best Company',
                      icon: '🏆',
                      value: bestCompany,
                      color: '#a78bfa',
                    },
                  ].map((m, i) => (
                    <div key={i} className="dash-behavioral-item">
                      <span className="dash-behavioral-icon">{m.icon}</span>
                      <span
                        className="dash-behavioral-value"
                        style={{ color: m.color }}
                      >
                        {m.value}
                      </span>
                      <span className="dash-behavioral-label">{m.label}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </>
        )}

      </main>
    </div>
  );
};

export default DashboardPage;