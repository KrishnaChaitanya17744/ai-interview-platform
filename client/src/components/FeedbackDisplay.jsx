// client/src/components/FeedbackDisplay.jsx

import React, { useState } from 'react';
import RecommendationPanel from './RecommendationPanel';

const companyMeta = {
  google:          { label: 'Google',        domain: 'google.com',       color: '#4285F4' },
  amazon:          { label: 'Amazon',        domain: 'amazon.com',       color: '#FF9900' },
  meta:            { label: 'Meta',          domain: 'meta.com',         color: '#0081FB' },
  microsoft:       { label: 'Microsoft',     domain: 'microsoft.com',    color: '#00A4EF' },
  apple:           { label: 'Apple',         domain: 'apple.com',        color: '#A2AAAD' },
  tcs:             { label: 'TCS',           domain: 'tcs.com',          color: '#0057A8' },
  infosys:         { label: 'Infosys',       domain: 'infosys.com',      color: '#007CC3' },
  wipro:           { label: 'Wipro',         domain: 'wipro.com',        color: '#9B4DCA' },
  hcl:             { label: 'HCL',           domain: 'hcltech.com',      color: '#009F6B' },
  techmahindra:    { label: 'Tech Mahindra', domain: 'techmahindra.com', color: '#E4002B' },
  flipkart:        { label: 'Flipkart',      domain: 'flipkart.com',     color: '#2874F0' },
  zoho:            { label: 'Zoho',          domain: 'zoho.com',         color: '#E2561A' },
  paytm:           { label: 'Paytm',         domain: 'paytm.com',        color: '#00BAF2' },
  startup_general: { label: 'Startup',       domain: null,               color: '#10B981' },
  general:         { label: 'General',       domain: null,               color: '#8B5CF6' },
};

const CompanyLogo = ({ domain, name, color, size = 18 }) => {
  const [failed, setFailed] = useState(false);
  if (!domain || failed) {
    return (
      <div style={{
        width: size, height: size, borderRadius: 4,
        background: color + '22', color, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.55, fontWeight: 800, flexShrink: 0,
      }}>
        {name.charAt(0)}
      </div>
    );
  }
  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
      alt={name}
      style={{ width: size, height: size, objectFit: 'contain', borderRadius: 4, flexShrink: 0 }}
      onError={() => setFailed(true)}
      loading="lazy"
    />
  );
};

const FeedbackDisplay = ({
  feedback,
  company,
  onRetry,
  onNewSession,
  questionsAnswered,
}) => {

  const meta = companyMeta[company] || {
    label: company, domain: null, color: '#667eea',
  };

  const scoreNum = feedback.score
    ? parseInt(feedback.score.split('/')[0], 10)
    : 0;

  const scoreLabel =
    scoreNum >= 8 ? 'Excellent 🌟' :
    scoreNum >= 6 ? 'Good 👍'      :
    scoreNum >= 4 ? 'Needs Work 📚':
    'Keep Practicing 💪';

  return (
    <div className="feedback-display">

      {/* ── Interview Result Card ─────────────────────── */}
      <div className="section-card">
        <div className="feedback-header">
          <div
            className="company-pill"
            style={{ margin: '0 auto var(--space-4)', width: 'fit-content' }}
          >
            <CompanyLogo
              domain={meta.domain}
              name={meta.label}
              color={meta.color}
              size={18}
            />
            <span>{meta.label} Interview Result</span>
          </div>
          <h2>Your Interview Feedback</h2>
        </div>

        {/* Score */}
        <div className="score-card">
          <div className="score-label">Performance Score</div>
          <div className="score-value">{feedback.score}</div>
          <div className="score-sub">{scoreLabel}</div>
        </div>

        {/* Answer mode */}
        <div style={{ textAlign: 'center' }}>
          <div className="answer-mode-tag">
            <span>🎙️</span>
            Voice Response Evaluated
          </div>
        </div>
      </div>

      {/* ── Feedback Panels ───────────────────────────── */}
      <div className="section-card">
        <div className="feedback-grid">

          {/* Strengths */}
          <div className="feedback-panel strengths">
            <div className="feedback-panel-header">
              <span>✅</span>
              <span className="feedback-panel-title">Strengths</span>
            </div>
            <ul>
              {feedback.strengths.map((s, i) => (
                <li key={i}>
                  <span className="feedback-bullet strengths">✓</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>

          {/* Improvements */}
          <div className="feedback-panel improvements">
            <div className="feedback-panel-header">
              <span>🔧</span>
              <span className="feedback-panel-title">Areas to Improve</span>
            </div>
            <ul>
              {feedback.improvements.map((imp, i) => (
                <li key={i}>
                  <span className="feedback-bullet improvements">→</span>
                  {imp}
                </li>
              ))}
            </ul>
          </div>

          {/* Summary */}
          {feedback.summary && (
            <div className="feedback-panel summary">
              <div className="feedback-panel-header">
                <span>💬</span>
                <span className="feedback-panel-title">Summary</span>
              </div>
              <p className="summary-text">{feedback.summary}</p>
            </div>
          )}

        </div>

        {/* Actions */}
        <div className="feedback-actions">
          <button className="retry-btn" onClick={onRetry}>
            <span>↩</span>
            Next Question
          </button>
          <button className="retry-btn primary" onClick={onNewSession}>
            <span>✦</span>
            New Session
          </button>
        </div>

        {questionsAnswered > 1 && (
          <p style={{
            textAlign:  'center',
            marginTop:  'var(--space-4)',
            fontSize:   '0.78rem',
            color:      'var(--color-text-muted)',
          }}>
            {questionsAnswered} questions practiced this session
          </p>
        )}

      </div>

      {/* ── Personalized Recommendations ─────────────── */}
      <RecommendationPanel sessionCount={questionsAnswered} />

    </div>
  );
};

export default FeedbackDisplay;