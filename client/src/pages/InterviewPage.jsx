// client/src/pages/InterviewPage.jsx

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import RoleSelector   from '../components/RoleSelector';
import QuestionDisplay from '../components/QuestionDisplay';
import FeedbackDisplay from '../components/FeedbackDisplay';
import { generateQuestion, evaluateAnswer } from '../services/api';
import { useNavigate, Link } from 'react-router-dom';

const InterviewPage = () => {

  const { user, logout }  = useAuth();
  const navigate          = useNavigate();

  const [role, setRole]               = useState('');
  const [company, setCompany]         = useState('');
  const [companyType, setCompanyType] = useState('');
  const [question, setQuestion]       = useState('');
  const [answer, setAnswer]           = useState('');
  const [feedback, setFeedback]       = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [step, setStep]               = useState('select');

  // Track asked questions to avoid duplicates
  const [askedQuestions, setAskedQuestions] = useState([]);
  const [questionSource, setQuestionSource] = useState('');

  // Emotion data from VideoPanel
  const [emotionData, setEmotionData] = useState({
    confidence:      0,
    nervousness:     0,
    eyeContact:      0,
    facePresence:    0,
    engagementScore: 0,
  });

  // ── Logout handler ────────────────────────────────────
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // ── Company selection ─────────────────────────────────
  const handleCompanyChange = (selectedCompany, selectedType) => {
    setCompany(selectedCompany);
    setCompanyType(selectedType);
  };

  // ── Generate Question ─────────────────────────────────
  const handleGenerateQuestion = async () => {
    if (!role || !company) {
      setError('Please select both a role and a company to continue.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const data = await generateQuestion(
        role, companyType, company, askedQuestions
      );
      if (data.success) {
        setQuestion(data.question);
        setQuestionSource(data.source || '');
        setAnswer('');
        setEmotionData({
          confidence:      0,
          nervousness:     0,
          eyeContact:      0,
          facePresence:    0,
          engagementScore: 0,
        });
        setStep('question');
        setAskedQuestions((prev) => [...prev, data.question]);
      } else {
        // Session expired — redirect to login
        if (data.message?.includes('token') ||
            data.message?.includes('Access denied')) {
          logout();
          navigate('/login');
          return;
        }
        setError('Failed to generate a question. Please try again.');
      }
    } catch (err) {
      setError('Connection error. Please check your server is running.');
    }
    setLoading(false);
  };

  // ── Submit Answer ─────────────────────────────────────
  const handleSubmitAnswer = async () => {
    if (!answer.trim()) return;
    setError('');
    setLoading(true);
    try {
      const data = await evaluateAnswer(
        role, companyType, company,
        question, answer, 'voice',
        emotionData
      );
      if (data.success) {
        setFeedback({ ...data.feedback, emotionData });
        setStep('feedback');
      } else {
        if (data.message?.includes('token') ||
            data.message?.includes('Access denied')) {
          logout();
          navigate('/login');
          return;
        }
        setError('Failed to evaluate your answer. Please try again.');
      }
    } catch (err) {
      setError('Connection error. Please check your server is running.');
    }
    setLoading(false);
  };

  // ── Retry — keeps session history ─────────────────────
  const handleRetry = () => {
    setQuestion('');
    setAnswer('');
    setFeedback(null);
    setError('');
    setQuestionSource('');
    setStep('select');
  };

  // ── New Session — resets everything ───────────────────
  const handleNewSession = () => {
    setRole('');
    setCompany('');
    setCompanyType('');
    setQuestion('');
    setAnswer('');
    setFeedback(null);
    setError('');
    setStep('select');
    setAskedQuestions([]);
    setQuestionSource('');
  };

  return (
    <div className="interview-page">

      {/* ── Header ─────────────────────────────────────── */}
      <header className="site-header">
        <div className="header-eyebrow">
          <span className="header-eyebrow-dot"></span>
          AI-Powered Interview Prep
        </div>
        <h1>
          Practice Interviews<br />
          <span>Like a Pro</span>
        </h1>
        <p>
          Company-specific questions, voice responses,
          and instant AI feedback — built for serious candidates.
        </p>

        {/* User info + navigation + logout */}
{user && (
  <div className="header-user-bar">
    <span className="header-user-name">
      👋 {user.name}
    </span>
    <Link to="/dashboard" className="header-dashboard-link">
      ← Dashboard
    </Link>
    <button
      className="header-logout-btn"
      onClick={handleLogout}
    >
      Sign Out
    </button>
  </div>
)}
      </header>

      {/* ── Step Indicator ─────────────────────────────── */}
      <nav className="steps-indicator" aria-label="Progress">
        {[
          { key: 'select',   label: 'Select Role',    num: '1' },
          { key: 'question', label: 'Answer Question', num: '2' },
          { key: 'feedback', label: 'View Feedback',   num: '3' },
        ].map((s, i) => (
          <React.Fragment key={s.key}>
            <div className={`step-item ${step === s.key ? 'active' : ''}`}>
              <span className="step-number">{s.num}</span>
              {s.label}
            </div>
            {i < 2 && <span className="step-divider">·</span>}
          </React.Fragment>
        ))}
      </nav>

      {/* ── Session Info ───────────────────────────────── */}
      {askedQuestions.length > 0 && step === 'select' && (
        <div className="session-info">
          <span>
            <strong>{askedQuestions.length}</strong> question
            {askedQuestions.length !== 1 ? 's' : ''} answered
            this session
          </span>
          <button className="new-session-btn" onClick={handleNewSession}>
            New Session
          </button>
        </div>
      )}

      {/* ── Error ──────────────────────────────────────── */}
      {error && (
        <div className="error-message" role="alert">
          <span>⚠</span>
          {error}
        </div>
      )}

      {/* ── Step 1: Select Role & Company ──────────────── */}
      {step === 'select' && (
        <>
          <RoleSelector
            role={role}
            company={company}
            onRoleChange={setRole}
            onCompanyChange={handleCompanyChange}
          />
          <div className="generate-section">
            <button
              className="generate-btn"
              onClick={handleGenerateQuestion}
              disabled={loading || !role || !company}
            >
              {loading ? (
                <span className="btn-loading">
                  <span className="btn-loading-dot" />
                  <span className="btn-loading-dot" />
                  <span className="btn-loading-dot" />
                </span>
              ) : (
                <>
                  <span className="btn-icon">✦</span>
                  Generate Interview Question
                </>
              )}
            </button>
          </div>
        </>
      )}

      {/* ── Step 2: Answer Question ─────────────────────── */}
      {step === 'question' && (
        <QuestionDisplay
          question={question}
          answer={answer}
          onAnswerChange={setAnswer}
          onSubmit={handleSubmitAnswer}
          loading={loading}
          company={company}
          questionSource={questionSource}
          onEmotionData={setEmotionData}
        />
      )}

      {/* ── Step 3: View Feedback ───────────────────────── */}
      {step === 'feedback' && (
        <FeedbackDisplay
          feedback={feedback}
          company={company}
          onRetry={handleRetry}
          onNewSession={handleNewSession}
          questionsAnswered={askedQuestions.length}
        />
      )}

    </div>
  );
};

export default InterviewPage;