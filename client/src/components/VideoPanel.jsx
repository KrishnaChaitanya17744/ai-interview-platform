// client/src/components/VideoPanel.jsx

import React, {
  useRef, useState, useEffect, useCallback,
} from 'react';
import { webcamManager } from '../services/WebcamManager';
import { faceAnalyzer }  from '../services/FaceAnalyzer';

// ── MetricBar — renders once, DOM-only updates ────────────
const MetricBar = ({ barRef, valRef, label, icon }) => (
  <div className="metric-bar-item">
    <div className="metric-bar-header">
      <span className="metric-bar-icon">{icon}</span>
      <span className="metric-bar-label">{label}</span>
      <span className="metric-bar-value" ref={valRef}>0%</span>
    </div>
    <div className="metric-bar-track">
      <div
        ref={barRef}
        className="metric-bar-fill"
        style={{ width: '0%', transition: 'width 0.5s ease' }}
      />
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────
// MAIN VIDEO PANEL
//
// KEY FIX: Face detection starts as soon as camera + AI
// are ready — NOT when interview starts.
//
// isInterviewActive only controls:
//   - REC badge visibility
//   - Session metrics panel visibility
//   - Metrics reset on new session start
// ─────────────────────────────────────────────────────────
const VideoPanel = ({
  isInterviewActive,
  onMetricsUpdate,
  onAnalysisReady,
}) => {

  const [camState, setCamState] = useState('idle');
  const [aiState,  setAiState]  = useState('idle');
  const [camError, setCamError] = useState('');
  const [aiError,  setAiError]  = useState('');

  const videoRef = useRef(null);

  // Overlay refs
  const faceBadgeRef = useRef(null);
  const recBadgeRef  = useRef(null);
  const aiBadgeRef   = useRef(null);
  const faceYesNoRef = useRef(null);

  // Signal dot refs
  const dotFaceRef   = useRef(null);
  const dotEyeRef    = useRef(null);
  const dotSmileRef  = useRef(null);
  const dotStableRef = useRef(null);
  const engBadgeRef  = useRef(null);

  // Metric bar refs
  const barEyeRef    = useRef(null); const valEyeRef    = useRef(null);
  const barStableRef = useRef(null); const valStableRef = useRef(null);
  const barSmileRef  = useRef(null); const valSmileRef  = useRef(null);
  const engScoreRef  = useRef(null);

  const metricsBoxRef   = useRef(null);
  const prevFaceRef     = useRef(null);

  // Stable callback ref — never changes reference
  // Prevents handleFrame from recreating on parent re-renders
  const onMetricsUpdateRef = useRef(onMetricsUpdate);
  useEffect(() => {
    onMetricsUpdateRef.current = onMetricsUpdate;
  }, [onMetricsUpdate]);

  const throttleRef = useRef(0);

  // ── Mount: start camera ───────────────────────────────
  useEffect(() => {
    initCam();
    return () => {
      faceAnalyzer.stopAnalysis();
      webcamManager.stop();
    };
  }, []);

  // ── When camera + AI both ready → start face detection ─
  // This runs REGARDLESS of isInterviewActive
  // Face badge updates from the moment camera is on
  useEffect(() => {
    if (camState === 'active' && aiState === 'ready') {
      console.log('🎬 Starting face detection (camera + AI ready)');
      faceAnalyzer.startAnalysis(videoRef.current, handleFrame);
    }
  }, [camState, aiState]);

  // ── isInterviewActive controls REC badge + metrics ────
  useEffect(() => {
    if (isInterviewActive) {
      // Reset session metrics when interview starts
      faceAnalyzer.resetMetrics();

      // Show metrics panel + REC badge
      if (metricsBoxRef.current) {
        metricsBoxRef.current.style.display = 'flex';
      }
      if (recBadgeRef.current) {
        recBadgeRef.current.style.display = 'flex';
      }

    } else {
      // Hide metrics panel + REC badge
      // Keep face detection RUNNING (badge still updates)
      if (metricsBoxRef.current) {
        metricsBoxRef.current.style.display = 'none';
      }
      if (recBadgeRef.current) {
        recBadgeRef.current.style.display = 'none';
      }
    }
  }, [isInterviewActive]);

  // ── Init camera ───────────────────────────────────────
  const initCam = async () => {
    setCamState('loading');
    webcamManager.attach(videoRef.current);
    const res = await webcamManager.start();

    if (!res.success) {
      setCamState('error');
      setCamError(res.error);
      return;
    }

    setCamState('active');
    initAI();
  };

  // ── Init AI ───────────────────────────────────────────
  const initAI = async () => {
    setAiState('loading');
    if (aiBadgeRef.current) aiBadgeRef.current.style.display = 'flex';

    const res = await faceAnalyzer.initialize();

    if (aiBadgeRef.current) aiBadgeRef.current.style.display = 'none';

    if (!res.success) {
      setAiState('error');
      setAiError(res.error);
      return;
    }

    setAiState('ready');
    if (onAnalysisReady) onAnalysisReady();
  };

  // ─────────────────────────────────────────────────────
  // HANDLE FRAME — called 15x/sec
  // All DOM updates. Zero React re-renders.
  // Uses stable ref for parent callback.
  // ─────────────────────────────────────────────────────
  const handleFrame = useCallback((data) => {
    const face    = data.faceDetected;
    const smooth  = data.smoothed  || {};
    const session = data.session   || {};

    // ── Face badge — update only on change ────────────
    if (face !== prevFaceRef.current) {
      prevFaceRef.current = face;

      if (faceBadgeRef.current) {
        faceBadgeRef.current.textContent       = face ? '✓ Face Detected' : '⚠ No Face';
        faceBadgeRef.current.style.color       = face ? '#34d399' : '#f87171';
        faceBadgeRef.current.style.borderColor = face ? '#34d399' : '#f87171';
      }

      if (faceYesNoRef.current) {
        faceYesNoRef.current.textContent           = face ? 'YES' : 'NO';
        faceYesNoRef.current.style.color           = face ? '#34d399' : '#f87171';
        faceYesNoRef.current.style.background      = face
          ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)';
        faceYesNoRef.current.style.borderColor     = face
          ? 'rgba(52,211,153,0.3)'  : 'rgba(248,113,113,0.3)';
      }
    }

    // ── Signal dots ───────────────────────────────────
    setDot(dotFaceRef,   smooth.face   > 0.3, '#34d399');
    setDot(dotEyeRef,    smooth.eye    > 0.5, '#4f6ef7');
    setDot(dotSmileRef,  smooth.smile  > 0.3, '#fbbf24');
    setDot(dotStableRef, smooth.stable > 0.5, '#a78bfa');

    // ── Engagement badge ──────────────────────────────
    if (engBadgeRef.current) {
      const lvl = face ? (data.engagementLevel || 'low') : 'low';
      const c = {
        high:   ['#34d39922', '#34d399', '#34d39944'],
        medium: ['#fbbf2422', '#fbbf24', '#fbbf2444'],
        low:    ['#f8717122', '#f87171', '#f8717144'],
      }[lvl] || ['#f8717122', '#f87171', '#f8717144'];

      engBadgeRef.current.textContent         = lvl.toUpperCase();
      engBadgeRef.current.style.background    = c[0];
      engBadgeRef.current.style.color         = c[1];
      engBadgeRef.current.style.border        = `1px solid ${c[2]}`;
    }

    // ── Metric bars — session accumulated % ──────────
    setBar(barEyeRef,    valEyeRef,
      session.eyeContactRatio || 0,
      'linear-gradient(90deg,#4f6ef7,#a78bfa)');

    setBar(barStableRef, valStableRef,
      session.headStability   || 0,
      'linear-gradient(90deg,#fbbf24,#f59e0b)');

    setBar(barSmileRef,  valSmileRef,
      session.smileRatio      || 0,
      'linear-gradient(90deg,#f9a8d4,#ec4899)');

    // ── Engagement score ──────────────────────────────
    if (engScoreRef.current) {
      engScoreRef.current.textContent =
        `${(session.engagementScore || 0).toFixed(1)}/10`;
    }

    // ── Parent callback — 2x/sec via stable ref ───────
    const now = Date.now();
    if (now - throttleRef.current > 500 && session.totalFrames > 0) {
      throttleRef.current = now;
      if (onMetricsUpdateRef.current) {
        onMetricsUpdateRef.current(session);
      }
    }
  }, []); // ← Empty deps — stable forever, uses refs internally

  // ── DOM helpers ───────────────────────────────────────
  function setDot(ref, active, color) {
    if (!ref.current) return;
    ref.current.style.background = active ? color : 'var(--color-border)';
    ref.current.style.boxShadow  = active ? `0 0 6px ${color}` : 'none';
  }

  function setBar(bRef, vRef, ratio, gradient) {
    const pct = Math.round(Math.max(0, Math.min(1, ratio)) * 100);
    if (bRef.current) {
      bRef.current.style.width      = `${pct}%`;
      bRef.current.style.background = gradient;
    }
    if (vRef.current) vRef.current.textContent = `${pct}%`;
  }

  const retry = () => {
    faceAnalyzer.stopAnalysis();
    webcamManager.stop();
    prevFaceRef.current = null;
    setCamState('idle');
    setAiState('idle');
    setCamError('');
    setAiError('');
    setTimeout(initCam, 300);
  };

  // ── RENDER ─────────────────────────────────────────────
  return (
    <div className="video-panel">

      {/* ── Camera ───────────────────────────────────── */}
      <div className="video-container">
        <video
          ref={videoRef}
          autoPlay playsInline muted
          className="video-feed"
          style={{
            display:   camState === 'active' ? 'block' : 'none',
            transform: 'scaleX(-1)',
          }}
        />

        {camState === 'loading' && (
          <div className="video-placeholder">
            <div className="video-placeholder-icon">📷</div>
            <p>Requesting camera...</p>
          </div>
        )}

        {camState === 'error' && (
          <div className="video-placeholder video-error">
            <div className="video-placeholder-icon">🚫</div>
            <p>{camError}</p>
            <button className="video-retry-btn" onClick={retry}>
              Try Again
            </button>
          </div>
        )}

        {camState === 'idle' && (
          <div className="video-placeholder">
            <div className="video-placeholder-icon">📷</div>
            <p>Initializing...</p>
          </div>
        )}

        {/* Overlays — only when camera active */}
        {camState === 'active' && (
          <>
            {/* REC badge — only when interview active */}
            <div
              ref={recBadgeRef}
              className="video-rec-badge"
              style={{ display: 'none' }}
            >
              <span className="rec-dot" />REC
            </div>

            {/* Face badge — ALWAYS visible when camera on */}
            <div
              ref={faceBadgeRef}
              className="video-face-badge"
              style={{ borderColor: '#f87171', color: '#f87171' }}
            >
              ⚠ No Face
            </div>

            {/* AI loading badge */}
            <div
              ref={aiBadgeRef}
              className="video-ai-badge"
              style={{ display: aiState === 'loading' ? 'flex' : 'none' }}
            >
              <div className="ai-loading-dot" />AI Loading...
            </div>
          </>
        )}
      </div>

      {/* AI error */}
      {aiState === 'error' && (
        <div className="video-ai-warning">⚠️ {aiError}</div>
      )}

      {/* ── Signal row — always visible when camera on ── */}
      {camState === 'active' && (
        <div className="video-status-row">
          {[
            [dotFaceRef,   'In Frame'],
            [dotEyeRef,    'Eye Contact'],
            [dotSmileRef,  'Smiling'],
            [dotStableRef, 'Stable'],
          ].map(([ref, label]) => (
            <div key={label} className="status-dot-item">
              <div
                ref={ref}
                className="status-dot"
                style={{ background: 'var(--color-border)' }}
              />
              <span className="status-dot-label">{label}</span>
            </div>
          ))}

          <div
            ref={engBadgeRef}
            style={{
              marginLeft:    'auto',
              padding:       '2px 8px',
              borderRadius:  'var(--radius-full)',
              fontSize:      '0.65rem',
              fontWeight:    800,
              letterSpacing: '0.08em',
              background:    '#f8717122',
              color:         '#f87171',
              border:        '1px solid #f8717144',
            }}
          >
            LOW
          </div>
        </div>
      )}

      {/* ── Session metrics — only when interview active ── */}
      <div
        ref={metricsBoxRef}
        className="video-metrics"
        style={{ display: 'none', flexDirection: 'column' }}
      >
        <div className="video-metrics-title">Session Analysis</div>

        {/* Face Presence — YES/NO */}
        <div className="metric-bar-item">
          <div className="metric-bar-header">
            <span className="metric-bar-icon">👤</span>
            <span className="metric-bar-label">Face Present</span>
            <span
              ref={faceYesNoRef}
              style={{
                fontSize:      '0.72rem',
                fontWeight:    700,
                padding:       '2px 10px',
                borderRadius:  'var(--radius-full)',
                border:        '1px solid',
                fontFamily:    'var(--font-mono)',
                transition:    'all 0.3s ease',
                background:    'rgba(248,113,113,0.12)',
                color:         '#f87171',
                borderColor:   'rgba(248,113,113,0.3)',
              }}
            >
              NO
            </span>
          </div>
        </div>

        <MetricBar
          barRef={barEyeRef}    valRef={valEyeRef}
          label="Eye Contact"   icon="👁️"
        />
        <MetricBar
          barRef={barStableRef} valRef={valStableRef}
          label="Head Stability" icon="🧍"
        />
        <MetricBar
          barRef={barSmileRef}  valRef={valSmileRef}
          label="Smile Rate"    icon="🙂"
        />

        <div className="engagement-score-row">
          <span className="engagement-score-label">Session Engagement</span>
          <span ref={engScoreRef} className="engagement-score-value">
            0.0/10
          </span>
        </div>
      </div>

    </div>
  );
};

export default VideoPanel;