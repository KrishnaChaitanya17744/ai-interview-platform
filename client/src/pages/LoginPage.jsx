// client/src/pages/LoginPage.jsx

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginUser } from '../services/api';
import '../auth.css';

const LoginPage = () => {

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);

  const { login }    = useAuth();
  const navigate     = useNavigate();
  const location     = useLocation();

  // Redirect to where user came from, or interview page
  const from = location.state?.from?.pathname || '/interview';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);

    try {
      const data = await loginUser(email.trim(), password);

      if (data.success) {
        login(data.user, data.token);
        navigate(from, { replace: true });
      } else {
        setError(data.message || 'Invalid email or password.');
      }
    } catch {
      setError('Connection error. Please check your internet.');
    }

    setLoading(false);
  };

  return (
    <div className="auth-page">

      {/* ── Left Panel — Branding ─────────────────────── */}
      <div className="auth-left">
        <div className="auth-brand">
          <div className="auth-brand-icon">🤖</div>
          <h1 className="auth-brand-name">InterviewAI</h1>
          <p className="auth-brand-tagline">
            Practice interviews like a pro
          </p>
        </div>

        <div className="auth-features">
          {[
            { icon: '🎯', text: 'Company-specific questions' },
            { icon: '🎙️', text: 'Voice-based responses'     },
            { icon: '🧠', text: 'AI-powered feedback'       },
            { icon: '📹', text: 'Behavioral analysis'       },
          ].map((f) => (
            <div key={f.text} className="auth-feature-item">
              <span className="auth-feature-icon">{f.icon}</span>
              <span>{f.text}</span>
            </div>
          ))}
        </div>

        <div className="auth-left-footer">
          Trusted by students preparing for top companies
        </div>
      </div>

      {/* ── Right Panel — Form ────────────────────────── */}
      <div className="auth-right">
        <div className="auth-form-wrapper">

          {/* Header */}
          <div className="auth-form-header">
            <h2 className="auth-form-title">Welcome back</h2>
            <p className="auth-form-subtitle">
              Sign in to continue your interview practice
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="auth-error">
              <span>⚠</span>
              {error}
            </div>
          )}

          {/* Form */}
          <form className="auth-form" onSubmit={handleSubmit}>

            {/* Email */}
            <div className="auth-field">
              <label className="auth-label" htmlFor="email">
                Email address
              </label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">✉</span>
                <input
                  id="email"
                  type="email"
                  className="auth-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div className="auth-field">
              <label className="auth-label" htmlFor="password">
                Password
              </label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">🔒</span>
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  className="auth-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="auth-toggle-pass"
                  onClick={() => setShowPass(!showPass)}
                  tabIndex={-1}
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <span className="auth-btn-loading">
                  <span className="auth-spinner" />
                  Signing in...
                </span>
              ) : (
                'Sign In →'
              )}
            </button>

          </form>

          {/* Divider */}
          <div className="auth-divider">
            <span>Don't have an account?</span>
          </div>

          {/* Register link */}
          <Link to="/register" className="auth-switch-btn">
            Create a free account
          </Link>

          {/* Footer */}
          <p className="auth-footer-note">
            By signing in, you agree to our terms and privacy policy.
          </p>

        </div>
      </div>

    </div>
  );
};

export default LoginPage;