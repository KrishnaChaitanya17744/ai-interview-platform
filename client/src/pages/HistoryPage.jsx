// client/src/pages/HistoryPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth }           from '../context/AuthContext';
import '../history.css';

const ROLE_LABELS = {
  frontend: 'Frontend',
  backend:  'Backend',
  data:     'Data Science',
  hr:       'HR Round',
};

const COMPANY_LIST = [
  'google','amazon','meta','microsoft','apple',
  'tcs','infosys','wipro','hcl','techmahindra',
  'flipkart','zoho','paytm','startup_general','general',
];

const getScoreColor = (scoreStr) => {
  if (!scoreStr) return { color: '#64748b', bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.2)' };
  const n = parseInt(scoreStr);
  if (n >= 8) return { color: '#34d399', bg: 'rgba(52,211,153,0.1)',   border: 'rgba(52,211,153,0.25)'   };
  if (n >= 6) return { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',   border: 'rgba(251,191,36,0.25)'   };
  if (n >= 4) return { color: '#fb923c', bg: 'rgba(251,146,60,0.1)',   border: 'rgba(251,146,60,0.25)'   };
  return             { color: '#f87171', bg: 'rgba(248,113,113,0.1)',  border: 'rgba(248,113,113,0.25)'  };
};

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  });

// ── Company Logo ──────────────────────────────────────────
const CompanyLogo = ({ company, size = 20 }) => {
  const [failed, setFailed] = useState(false);
  const domainMap = {
    google: 'google.com', amazon: 'amazon.com', meta: 'meta.com',
    microsoft: 'microsoft.com', apple: 'apple.com', tcs: 'tcs.com',
    infosys: 'infosys.com', wipro: 'wipro.com', hcl: 'hcltech.com',
    techmahindra: 'techmahindra.com', flipkart: 'flipkart.com',
    zoho: 'zoho.com', paytm: 'paytm.com',
  };
  const domain = domainMap[company];

  if (!domain || failed) {
    return (
      <div
        style={{
          width: size, height: size,
          borderRadius: 4,
          background: 'rgba(79,110,247,0.15)',
          color: '#4f6ef7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size * 0.5,
          fontWeight: 800,
          flexShrink: 0,
        }}
      >
        {(company || '?').charAt(0).toUpperCase()}
      </div>
    );
  }
  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
      alt={company}
      style={{
        width: size, height: size,
        borderRadius: 3,
        objectFit: 'contain',
        flexShrink: 0,
      }}
      onError={() => setFailed(true)}
    />
  );
};

// ── Session Detail Modal ──────────────────────────────────
const SessionDetail = ({ session, onClose }) => {
  if (!session) return null;

  const sc    = getScoreColor(session.score);
  const score = parseInt(session.score) || 0;
  const label =
    score >= 8 ? 'Excellent 🌟' :
    score >= 6 ? 'Good 👍'      :
    score >= 4 ? 'Needs Work 📚':
    'Keep Practicing 💪';

  return (
    <div className="hist-overlay" onClick={onClose}>
      <div className="hist-panel" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="hist-panel-header">
          <div className="hist-panel-meta">
            <CompanyLogo company={session.company} size={24} />
            <span className="hist-panel-company">
              {(session.company || '').replace('_', ' ')}
            </span>
            <span className="hist-panel-role">
              {ROLE_LABELS[session.role] || session.role}
            </span>
          </div>
          <span className="hist-panel-date">
            {formatDate(session.createdAt)} · {formatTime(session.createdAt)}
          </span>
          <button className="hist-panel-close" onClick={onClose}>✕</button>
        </div>

        {/* Score */}
        <div
          className="hist-panel-score"
          style={{ background: sc.bg, borderColor: sc.border }}
        >
          <div className="hist-panel-score-num" style={{ color: sc.color }}>
            {session.score || '—'}
          </div>
          <div className="hist-panel-score-label">{label}</div>
        </div>

        {/* Question */}
        <div className="hist-panel-section">
          <div className="hist-panel-section-title">📌 Interview Question</div>
          <div className="hist-panel-question">
            {session.question || 'Question not recorded'}
          </div>
        </div>

        {/* Answer */}
        {session.answer && (
          <div className="hist-panel-section">
            <div className="hist-panel-section-title">
              🎙️ Your Answer
              <span className="hist-panel-badge">
                {session.answerMode === 'voice' ? '🎤 Voice' : '⌨️ Text'}
              </span>
            </div>
            <div className="hist-panel-answer">{session.answer}</div>
          </div>
        )}

        {/* Strengths + Improvements */}
        <div className="hist-panel-two-col">
          <div className="hist-panel-section">
            <div
              className="hist-panel-section-title"
              style={{ color: '#34d399' }}
            >
              ✅ Strengths
            </div>
            <ul className="hist-panel-list">
              {(session.strengths || []).length > 0
                ? (session.strengths || []).map((s, i) => (
                    <li key={i} className="hist-panel-list-item">
                      <span
                        className="hist-panel-dot"
                        style={{ background: '#34d399' }}
                      />
                      {s}
                    </li>
                  ))
                : <li className="hist-panel-empty">No data</li>
              }
            </ul>
          </div>

          <div className="hist-panel-section">
            <div
              className="hist-panel-section-title"
              style={{ color: '#f87171' }}
            >
              🔧 Improvements
            </div>
            <ul className="hist-panel-list">
              {(session.improvements || []).length > 0
                ? (session.improvements || []).map((s, i) => (
                    <li key={i} className="hist-panel-list-item">
                      <span
                        className="hist-panel-dot"
                        style={{ background: '#f87171' }}
                      />
                      {s}
                    </li>
                  ))
                : <li className="hist-panel-empty">No data</li>
              }
            </ul>
          </div>
        </div>

        {/* Summary */}
        {session.summary && (
          <div className="hist-panel-section">
            <div className="hist-panel-section-title">💬 AI Summary</div>
            <div className="hist-panel-summary">{session.summary}</div>
          </div>
        )}

        {/* Behavioral */}
        {session.emotionData?.engagementScore > 0 && (
          <div className="hist-panel-section">
            <div className="hist-panel-section-title">📹 Behavioral Metrics</div>
            <div className="hist-behavioral-grid">
              {[
                {
                  label: 'Engagement',
                  value: `${(session.emotionData.engagementScore || 0).toFixed(1)}/10`,
                  color: '#4f6ef7',
                },
                {
                  label: 'Eye Contact',
                  value: session.emotionData.eyeContact
                    ? `${(session.emotionData.eyeContact * 100).toFixed(0)}%`
                    : '—',
                  color: '#34d399',
                },
                {
                  label: 'Face Presence',
                  value: session.emotionData.facePresence
                    ? `${(session.emotionData.facePresence * 100).toFixed(0)}%`
                    : '—',
                  color: '#fbbf24',
                },
              ].map((m) => (
                <div key={m.label} className="hist-behavioral-item">
                  <div
                    className="hist-behavioral-value"
                    style={{ color: m.color }}
                  >
                    {m.value}
                  </div>
                  <div className="hist-behavioral-label">{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// MAIN HISTORY PAGE
// ─────────────────────────────────────────────────────────
const HistoryPage = () => {
  const { user, logout }         = useAuth();
  const navigate                  = useNavigate();
  const [sessions,   setSessions] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading,    setLoading]  = useState(true);
  const [selected,   setSelected] = useState(null);
  const [filterCompany, setFilterCompany] = useState('');
  const [filterRole,    setFilterRole]    = useState('');

  const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const fetchSessions = useCallback(async (page = 1, company = '', role = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 10 });
      if (company) params.append('company', company);
      if (role)    params.append('role',    role);

      const token = localStorage.getItem('authToken');
      const res   = await fetch(`${API}/user/history?${params}`, {
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();

      if (data.success) {
        setSessions(data.sessions || []);
        setPagination(data.pagination || { total: 0, page: 1, pages: 1 });
      } else {
        const message = data?.message?.toString() || '';
        if (message.toLowerCase().includes('token') || message.includes('Access denied')) {
          logout();
          navigate('/login');
          return;
        }
      }
    } catch (e) {
      console.error('History fetch error:', e.message);
    }
    setLoading(false);
  }, [API]);

  useEffect(() => {
    fetchSessions(1, filterCompany, filterRole);
  }, [fetchSessions, filterCompany, filterRole]);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="hist-page">

      {/* Nav */}
      <nav className="dash-nav">
        <div className="dash-nav-brand">
          <span className="dash-nav-icon">🤖</span>
          <span className="dash-nav-name">InterviewAI</span>
        </div>
        <div className="dash-nav-links">
          <Link to="/dashboard" className="dash-nav-link">Dashboard</Link>
          <Link to="/history"   className="dash-nav-link active">History</Link>
          <Link to="/interview" className="dash-nav-link">Practice</Link>
        </div>
        <div className="dash-nav-right">
          <span className="dash-nav-user">👋 {user?.name}</span>
          <button className="dash-nav-logout" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </nav>

      {/* Main */}
      <main className="hist-main">

        {/* Header */}
        <div className="hist-page-header">
          <div>
            <h1 className="hist-page-title">Interview History</h1>
            <p className="hist-page-sub">
              {pagination.total} session{pagination.total !== 1 ? 's' : ''} total
            </p>
          </div>
          <Link to="/interview" className="dash-start-btn">✦ New Session</Link>
        </div>

        {/* Filters */}
        <div className="hist-filters">
          <select
            className="hist-filter-select"
            value={filterCompany}
            onChange={(e) => setFilterCompany(e.target.value)}
          >
            <option value="">All Companies</option>
            {COMPANY_LIST.map((c) => (
              <option key={c} value={c}>
                {c.replace('_', ' ')}
              </option>
            ))}
          </select>

          <select
            className="hist-filter-select"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="">All Roles</option>
            {Object.entries(ROLE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>

          {(filterCompany || filterRole) && (
            <button
              className="hist-filter-clear"
              onClick={() => {
                setFilterCompany('');
                setFilterRole('');
              }}
            >
              ✕ Clear filters
            </button>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="hist-loading">
            <div className="dash-loading-spinner" />
            <p>Loading sessions...</p>
          </div>
        )}

        {/* Empty */}
        {!loading && sessions.length === 0 && (
          <div className="hist-empty">
            <div className="hist-empty-icon">📭</div>
            <h2>No sessions found</h2>
            <p>
              {filterCompany || filterRole
                ? 'Try clearing your filters.'
                : 'Complete your first interview to see history here.'}
            </p>
            <Link to="/interview" className="dash-start-btn">
              Start Practicing
            </Link>
          </div>
        )}

        {/* List */}
        {!loading && sessions.length > 0 && (
          <>
            <div className="hist-list">
              {sessions.map((session, i) => {
                const sc = getScoreColor(session.score);
                return (
                  <div
                    key={session._id || i}
                    className="hist-session-card"
                    onClick={() => setSelected(session)}
                  >
                    <div className="hist-card-left">
                      <CompanyLogo company={session.company} size={36} />
                      <div className="hist-card-info">
                        <div className="hist-card-company">
                          {(session.company || '').replace('_', ' ')}
                        </div>
                        <div className="hist-card-role">
                          {ROLE_LABELS[session.role] || session.role}
                          <span className="hist-card-dot">·</span>
                          {formatDate(session.createdAt)}
                        </div>
                      </div>
                    </div>

                    <div className="hist-card-question">
                      {session.question
                        ? session.question.length > 90
                          ? session.question.slice(0, 90) + '...'
                          : session.question
                        : 'Question not available'}
                    </div>

                    <div className="hist-card-right">
                      <div
                        className="hist-score-badge"
                        style={{
                          color:       sc.color,
                          background:  sc.bg,
                          borderColor: sc.border,
                        }}
                      >
                        {session.score || '—'}
                      </div>
                      <span className="hist-card-chevron">›</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="hist-pagination">
                <button
                  className="hist-page-btn"
                  disabled={pagination.page <= 1}
                  onClick={() =>
                    fetchSessions(pagination.page - 1, filterCompany, filterRole)
                  }
                >
                  ← Prev
                </button>
                <span className="hist-page-info">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  className="hist-page-btn"
                  disabled={pagination.page >= pagination.pages}
                  onClick={() =>
                    fetchSessions(pagination.page + 1, filterCompany, filterRole)
                  }
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}

      </main>

      {/* Detail modal */}
      {selected && (
        <SessionDetail
          session={selected}
          onClose={() => setSelected(null)}
        />
      )}

    </div>
  );
};

export default HistoryPage;