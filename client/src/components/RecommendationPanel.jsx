// client/src/components/RecommendationPanel.jsx

import React, { useState, useEffect } from 'react';
import { getRecommendations } from '../services/api';

// ── Score Trend Badge ─────────────────────────────────────
const TrendBadge = ({ trend }) => {
  const config = {
    improving:          { icon: '📈', color: '#34d399', bg: 'rgba(52,211,153,0.1)',  label: 'Improving'  },
    declining:          { icon: '📉', color: '#f87171', bg: 'rgba(248,113,113,0.1)', label: 'Needs Work' },
    stable:             { icon: '➡️', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  label: 'Stable'     },
    'insufficient data':{ icon: '🆕', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', label: 'New User'   },
  };
  const c = config[trend] || config['stable'];

  return (
    <span style={{
      display:      'inline-flex',
      alignItems:   'center',
      gap:          '5px',
      padding:      '3px 10px',
      borderRadius: 'var(--radius-full)',
      background:   c.bg,
      color:        c.color,
      fontSize:     '0.75rem',
      fontWeight:   700,
      border:       `1px solid ${c.color}33`,
    }}>
      {c.icon} {c.label}
    </span>
  );
};

// ── Section Block ─────────────────────────────────────────
const Section = ({ icon, title, color, children }) => (
  <div className="rec-section">
    <div className="rec-section-header">
      <span>{icon}</span>
      <span className="rec-section-title" style={{ color }}>
        {title}
      </span>
    </div>
    {children}
  </div>
);

// ── List ──────────────────────────────────────────────────
const RecList = ({ items, color }) => (
  <ul className="rec-list">
    {items.map((item, i) => (
      <li key={i} className="rec-list-item">
        <span
          className="rec-list-dot"
          style={{ background: color, boxShadow: `0 0 6px ${color}66` }}
        />
        {item}
      </li>
    ))}
  </ul>
);

// ── Study Plan Day ────────────────────────────────────────
const StudyDayItem = ({ item, index }) => {
  const colors = ['#4f6ef7','#a78bfa','#34d399','#fbbf24'];
  const color  = colors[index % colors.length];

  const parts = item.split(':');
  const day   = parts[0]?.trim();
  const topic = parts.slice(1).join(':').trim();

  return (
    <div className="study-day-item">
      <div className="study-day-badge" style={{ background: color + '22', color, borderColor: color + '44' }}>
        {day}
      </div>
      <span className="study-day-topic">{topic || item}</span>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────
const RecommendationPanel = ({ sessionCount }) => {

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [open,    setOpen]    = useState(false);

  useEffect(() => {
    // Auto-load if user has sessions
    if (sessionCount >= 1) {
      loadRecommendations();
    }
  }, [sessionCount]);

  const loadRecommendations = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getRecommendations();
      if (result.success) {
        setData(result);
        setOpen(true);
      } else {
        setError(result.message || 'Could not load recommendations.');
      }
    } catch {
      setError('Connection error loading recommendations.');
    }
    setLoading(false);
  };

  // ── Loading state ─────────────────────────────────────
  if (loading) {
    return (
      <div className="rec-panel">
        <div className="rec-loading">
          <div className="rec-loading-spinner" />
          <div>
            <p className="rec-loading-title">
              🧠 Analyzing your performance...
            </p>
            <p className="rec-loading-sub">
              Gemini AI is generating your personalized study plan
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── No data ───────────────────────────────────────────
  if (!data || !data.hasData) {
    return null;
  }

  const { recommendations: rec, performanceSummary: perf } = data;

  return (
    <div className="rec-panel">

      {/* ── Header ───────────────────────────────────── */}
      <div
        className="rec-header"
        onClick={() => setOpen(!open)}
      >
        <div className="rec-header-left">
          <span className="rec-header-icon">🎯</span>
          <div>
            <h3 className="rec-header-title">
              Personalized Recommendations
            </h3>
            <p className="rec-header-sub">
              Based on your last {data.sessionCount} session
              {data.sessionCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="rec-header-right">
          <TrendBadge trend={perf.trend} />
          <span className="rec-toggle">{open ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────── */}
      {open && rec && (
        <div className="rec-content">

          {/* ── Stats Row ─────────────────────────────── */}
          <div className="rec-stats-row">
            <div className="rec-stat">
              <div className="rec-stat-value">
                {perf.avgScore}
                <span className="rec-stat-unit">/10</span>
              </div>
              <div className="rec-stat-label">Avg Score</div>
            </div>
            <div className="rec-stat">
              <div className="rec-stat-value">
                {perf.totalSessions}
              </div>
              <div className="rec-stat-label">Sessions</div>
            </div>
            {perf.avgEngagement && (
              <div className="rec-stat">
                <div className="rec-stat-value">
                  {perf.avgEngagement}
                  <span className="rec-stat-unit">/10</span>
                </div>
                <div className="rec-stat-label">Engagement</div>
              </div>
            )}
            {perf.avgEyeContact && (
              <div className="rec-stat">
                <div className="rec-stat-value">
                  {perf.avgEyeContact}
                  <span className="rec-stat-unit">%</span>
                </div>
                <div className="rec-stat-label">Eye Contact</div>
              </div>
            )}
          </div>

          {/* ── Progress Summary ──────────────────────── */}
          {rec.progress && (
            <div className="rec-progress-text">
              <span className="rec-progress-icon">📊</span>
              <p>{rec.progress}</p>
            </div>
          )}

          {/* ── Two-column layout ─────────────────────── */}
          <div className="rec-two-col">

            {/* Weak Areas */}
            {rec.weakAreas?.length > 0 && (
              <Section icon="⚠️" title="Areas to Improve" color="#f87171">
                <RecList items={rec.weakAreas} color="#f87171" />
              </Section>
            )}

            {/* Strengths */}
            {rec.strengths?.length > 0 && (
              <Section icon="✅" title="Your Strengths" color="#34d399">
                <RecList items={rec.strengths} color="#34d399" />
              </Section>
            )}

          </div>

          {/* ── Recommendations ───────────────────────── */}
          {rec.recommendations?.length > 0 && (
            <Section icon="💡" title="What to Study Next" color="#4f6ef7">
              <RecList items={rec.recommendations} color="#4f6ef7" />
            </Section>
          )}

          {/* ── 7-Day Study Plan ──────────────────────── */}
          {rec.studyPlan?.length > 0 && (
            <Section icon="📅" title="7-Day Study Plan" color="#a78bfa">
              <div className="study-plan-grid">
                {rec.studyPlan.map((day, i) => (
                  <StudyDayItem key={i} item={day} index={i} />
                ))}
              </div>
            </Section>
          )}

          {/* ── Bottom Row ────────────────────────────── */}
          <div className="rec-bottom-row">

            {/* Next Practice */}
            {rec.nextPractice && (
              <div className="rec-next-practice">
                <div className="rec-next-icon">🎯</div>
                <div>
                  <div className="rec-next-label">Recommended Next</div>
                  <div className="rec-next-text">{rec.nextPractice}</div>
                </div>
              </div>
            )}

            {/* Behavioral Feedback */}
            {rec.behavioral && (
              <div className="rec-behavioral">
                <div className="rec-next-icon">📹</div>
                <div>
                  <div className="rec-next-label">Interview Presence</div>
                  <div className="rec-next-text">{rec.behavioral}</div>
                </div>
              </div>
            )}

          </div>

          {/* Refresh button */}
          <button
            className="rec-refresh-btn"
            onClick={loadRecommendations}
          >
            🔄 Refresh Recommendations
          </button>

        </div>
      )}

    </div>
  );
};

export default RecommendationPanel;