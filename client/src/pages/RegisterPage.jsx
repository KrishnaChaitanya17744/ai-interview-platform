// client/src/pages/RegisterPage.jsx

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { registerUser } from '../services/api';
import '../auth.css';

const RegisterPage = () => {

  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);

  const { login } = useAuth();
  const navigate  = useNavigate();

  // Password strength
  const getStrength = (p) => {
    if (!p)        return { level: 0, label: '',        color: 'transparent' };
    if (p.length < 6) return { level: 1, label: 'Too short', color: '#f87171' };
    let score = 0;
    if (p.length >= 8)          score++;
    if (/[A-Z]/.test(p))        score++;
    if (/[0-9]/.test(p))        score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    if (score <= 1) return { level: 2, label: 'Weak',   color: '#f87171' };
    if (score === 2) return { level: 3, label: 'Fair',   color: '#fbbf24' };
    if (score === 3) return { level: 4, label: 'Good',   color: '#60a5fa' };
    return             { level: 5, label: 'Strong', color: '#34d399' };
  };

  const strength = getStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate
    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const data = await registerUser(
        name.trim(), email.trim(), password
      );

      if (data.success) {
        login(data.user, data.token);
        navigate('/interview', { replace: true });
      } else {
        setError(data.message || 'Registration failed. Please try again.');
      }
    } catch {
      setError('Connection error. Please check your internet.');
    }

    setLoading(false);
  };

  return (
    <div className="auth-page">

      {/* ── Left Panel ───────────────────────────────── */}
      <div className="auth-left">
        <div className="auth-brand">
          <div className="auth-brand-icon">🤖</div>
          <h1 className="auth-brand-name">InterviewAI</h1>
          <p className="auth-brand-tagline">
            Your AI-powered interview coach
          </p>
        </div>

        <div className="auth-steps">
          <p className="auth-steps-title">Get started in 3 steps</p>
          {[
            { num: '01', text: 'Create your free account'  },
            { num: '02', text: 'Choose a company and role' },
            { num: '03', text: 'Practice and get feedback' },
          ].map((s) => (
            <div key={s.num} className="auth-step-item">
              <span className="auth-step-num">{s.num}</span>
              <span>{s.text}</span>
            </div>
          ))}
        </div>

        <div className="auth-left-footer">
          Free to use — no credit card required
        </div>
      </div>

      {/* ── Right Panel ──────────────────────────────── */}
      <div className="auth-right">
        <div className="auth-form-wrapper">

          <div className="auth-form-header">
            <h2 className="auth-form-title">Create account</h2>
            <p className="auth-form-subtitle">
              Start practicing interviews for free today
            </p>
          </div>

          {error && (
            <div className="auth-error">
              <span>⚠</span>
              {error}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>

            {/* Full Name */}
            <div className="auth-field">
              <label className="auth-label" htmlFor="name">
                Full name
              </label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">👤</span>
                <input
                  id="name"
                  type="text"
                  className="auth-input"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  autoFocus
                />
              </div>
            </div>

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
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
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

              {/* Password strength bar */}
              {password && (
                <div className="auth-strength">
                  <div className="auth-strength-bars">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="auth-strength-bar"
                        style={{
                          background: i <= strength.level
                            ? strength.color
                            : 'var(--color-border)',
                        }}
                      />
                    ))}
                  </div>
                  <span
                    className="auth-strength-label"
                    style={{ color: strength.color }}
                  >
                    {strength.label}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="auth-field">
              <label className="auth-label" htmlFor="confirm">
                Confirm password
              </label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">
                  {confirm && confirm === password ? '✅' : '🔒'}
                </span>
                <input
                  id="confirm"
                  type={showPass ? 'text' : 'password'}
                  className="auth-input"
                  placeholder="Repeat your password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  style={{
                    borderColor: confirm
                      ? confirm === password
                        ? 'rgba(52,211,153,0.4)'
                        : 'rgba(248,113,113,0.4)'
                      : undefined,
                  }}
                />
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
                  Creating account...
                </span>
              ) : (
                'Create Free Account →'
              )}
            </button>

          </form>

          <div className="auth-divider">
            <span>Already have an account?</span>
          </div>

          <Link to="/login" className="auth-switch-btn">
            Sign in instead
          </Link>

          <p className="auth-footer-note">
            By creating an account, you agree to our terms and privacy policy.
          </p>

        </div>
      </div>

    </div>
  );
};

export default RegisterPage;