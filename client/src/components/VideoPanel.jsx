// client/src/components/VideoPanel.jsx

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { webcamManager } from '../services/WebcamManager';
import { faceAnalyzer }  from '../services/FaceAnalyzer';

const MetricBar = ({ barRef, valRef, label, icon }) => (
  <div className="metric-bar-item">
    <div className="metric-bar-header">
      <span className="metric-bar-icon">{icon}</span>
      <span className="metric-bar-label">{label}</span>
      <span className="metric-bar-value" ref={valRef}>0%</span>
    </div>
    <div className="metric-bar-track">
      <div ref={barRef} className="metric-bar-fill"
        style={{ width: '0%', transition: 'width 0.5s ease' }} />
    </div>
  </div>
);

const VideoPanel = ({ isInterviewActive, onMetricsUpdate, onAnalysisReady }) => {

  const [camState, setCamState] = useState('idle');
  const [aiState,  setAiState]  = useState('idle');
  const [camError, setCamError] = useState('');
  const [aiError,  setAiError]  = useState('');

  const videoRef     = useRef(null);
  const faceBadgeRef = useRef(null);
  const recBadgeRef  = useRef(null);
  const aiBadgeRef   = useRef(null);
  const faceYesNoRef = useRef(null);

  const dotFaceRef   = useRef(null);
  const dotEyeRef    = useRef(null);
  const dotSmileRef  = useRef(null);
  const dotStableRef = useRef(null);
  const engBadgeRef  = useRef(null);

  const barEyeRef    = useRef(null); const valEyeRef    = useRef(null);
  const barStableRef = useRef(null); const valStableRef = useRef(null);
  const barSmileRef  = useRef(null); const valSmileRef  = useRef(null);
  const engScoreRef  = useRef(null);
  const metricsBoxRef = useRef(null);

  const throttleRef  = useRef(0);
  const prevFaceRef  = useRef(null);

  useEffect(() => {
    initCam();
    return () => { faceAnalyzer.stopAnalysis(); webcamManager.stop(); };
  }, []);

  useEffect(() => {
    if (isInterviewActive && camState === 'active' && aiState === 'ready') {
      faceAnalyzer.resetMetrics();
      faceAnalyzer.startAnalysis(videoRef.current, onFrame);
      if (metricsBoxRef.current) metricsBoxRef.current.style.display = 'flex';
      if (recBadgeRef.current)   recBadgeRef.current.style.display   = 'flex';
    } else if (!isInterviewActive) {
      faceAnalyzer.stopAnalysis();
      if (metricsBoxRef.current) metricsBoxRef.current.style.display = 'none';
      if (recBadgeRef.current)   recBadgeRef.current.style.display   = 'none';
    }
  }, [isInterviewActive, camState, aiState]);

  const initCam = async () => {
    setCamState('loading');
    webcamManager.attach(videoRef.current);
    const r = await webcamManager.start();
    if (!r.success) { setCamState('error'); setCamError(r.error); return; }
    setCamState('active');
    initAI();
  };

  const initAI = async () => {
    setAiState('loading');
    if (aiBadgeRef.current) aiBadgeRef.current.style.display = 'flex';
    const r = await faceAnalyzer.initialize();
    if (aiBadgeRef.current) aiBadgeRef.current.style.display = 'none';
    if (!r.success) { setAiState('error'); setAiError(r.error); return; }
    setAiState('ready');
    if (onAnalysisReady) onAnalysisReady();
  };

  // ─────────────────────────────────────────────────────
  // onFrame — called 15x/sec, all DOM updates
  //
  // BARS show data.display (sliding window ratios)
  // These respond quickly:
  //   Face absent → drops to 0 in 10 seconds
  //   Face present → rises within 2-3 seconds
  //
  // DOTS show data.live (instant boolean from window avg)
  //
  // ENGAGEMENT SCORE shows session lifetime data
  // ─────────────────────────────────────────────────────
  const onFrame = useCallback((data) => {
    const face    = data.faceDetected;
    const live    = data.live    || {};
    const display = data.display || {};   // sliding window 0-1 ratios
    const session = data.session || {};   // lifetime ratios

    // Face badge — only on change
    if (face !== prevFaceRef.current) {
      prevFaceRef.current = face;

      if (faceBadgeRef.current) {
        faceBadgeRef.current.textContent       = face ? '✓ Face Detected' : '⚠ No Face';
        faceBadgeRef.current.style.color       = face ? '#34d399' : '#f87171';
        faceBadgeRef.current.style.borderColor = face ? '#34d399' : '#f87171';
      }
      if (faceYesNoRef.current) {
        faceYesNoRef.current.textContent       = face ? 'YES' : 'NO';
        faceYesNoRef.current.style.color       = face ? '#34d399' : '#f87171';
        faceYesNoRef.current.style.background  = face
          ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)';
        faceYesNoRef.current.style.borderColor = face
          ? 'rgba(52,211,153,0.3)'  : 'rgba(248,113,113,0.3)';
      }
    }

    // Signal dots — from live (instant response)
    dot(dotFaceRef,   live.face,   '#34d399');
    dot(dotEyeRef,    live.eye,    '#4f6ef7');
    dot(dotSmileRef,  live.smile,  '#fbbf24');
    dot(dotStableRef, live.stable, '#a78bfa');

    // Engagement badge — from live
    if (engBadgeRef.current) {
      const lvl = face ? (data.engagement || 'low') : 'low';
      const c = {
        high:   ['#34d39922', '#34d399', '#34d39944'],
        medium: ['#fbbf2422', '#fbbf24', '#fbbf2444'],
        low:    ['#f8717122', '#f87171', '#f8717144'],
      }[lvl];
      engBadgeRef.current.textContent         = lvl.toUpperCase();
      engBadgeRef.current.style.background    = c[0];
      engBadgeRef.current.style.color         = c[1];
      engBadgeRef.current.style.border        = `1px solid ${c[2]}`;
    }

    // ── Bars use SLIDING WINDOW (display) ─────────────────
    // Decreases visibly within seconds when face absent
    bar(barEyeRef,    valEyeRef,    display.eye    || 0, 'linear-gradient(90deg,#4f6ef7,#a78bfa)');
    bar(barStableRef, valStableRef, display.stable || 0, 'linear-gradient(90deg,#fbbf24,#f59e0b)');
    bar(barSmileRef,  valSmileRef,  display.smile  || 0, 'linear-gradient(90deg,#f9a8d4,#ec4899)');

    // Engagement score — from session lifetime (overall performance)
    if (engScoreRef.current) {
      engScoreRef.current.textContent =
        `${(session.engagementScore || 0).toFixed(1)}/10`;
    }

    // Parent callback 2x/sec — send session data
    const now = Date.now();
    if (now - throttleRef.current > 500 && session.totalFrames > 0) {
      throttleRef.current = now;
      if (onMetricsUpdate) onMetricsUpdate(session);
    }
  }, [onMetricsUpdate]);

  function dot(ref, active, color) {
    if (!ref.current) return;
    ref.current.style.background = active ? color : 'var(--color-border)';
    ref.current.style.boxShadow  = active ? `0 0 6px ${color}` : 'none';
  }

  function bar(bRef, vRef, ratio, gradient) {
    const pct = Math.round(Math.max(0, Math.min(1, ratio)) * 100);
    if (bRef.current) {
      bRef.current.style.width      = `${pct}%`;
      bRef.current.style.background = gradient;
    }
    if (vRef.current) vRef.current.textContent = `${pct}%`;
  }

  const retry = () => {
    webcamManager.stop();
    faceAnalyzer.stopAnalysis();
    prevFaceRef.current = null;
    setCamState('idle'); setAiState('idle');
    setCamError('');     setAiError('');
    setTimeout(initCam, 300);
  };

  return (
    <div className="video-panel">

      {/* Camera */}
      <div className="video-container">
        <video ref={videoRef} autoPlay playsInline muted className="video-feed"
          style={{ display: camState === 'active' ? 'block' : 'none', transform: 'scaleX(-1)' }} />

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
            <button className="video-retry-btn" onClick={retry}>Try Again</button>
          </div>
        )}
        {camState === 'idle' && (
          <div className="video-placeholder">
            <div className="video-placeholder-icon">📷</div>
            <p>Initializing...</p>
          </div>
        )}

        {camState === 'active' && (
          <>
            <div ref={recBadgeRef} className="video-rec-badge" style={{ display: 'none' }}>
              <span className="rec-dot" />REC
            </div>
            <div ref={faceBadgeRef} className="video-face-badge"
              style={{ borderColor: '#f87171', color: '#f87171' }}>
              ⚠ No Face
            </div>
            <div ref={aiBadgeRef} className="video-ai-badge"
              style={{ display: aiState === 'loading' ? 'flex' : 'none' }}>
              <div className="ai-loading-dot" />AI Loading...
            </div>
          </>
        )}
      </div>

      {aiState === 'error' && (
        <div className="video-ai-warning">⚠️ {aiError}</div>
      )}

      {/* Signal row */}
      {camState === 'active' && (
        <div className="video-status-row">
          {[
            [dotFaceRef,   'In Frame'],
            [dotEyeRef,    'Eye Contact'],
            [dotSmileRef,  'Smiling'],
            [dotStableRef, 'Stable'],
          ].map(([ref, label]) => (
            <div key={label} className="status-dot-item">
              <div ref={ref} className="status-dot"
                style={{ background: 'var(--color-border)' }} />
              <span className="status-dot-label">{label}</span>
            </div>
          ))}
          <div ref={engBadgeRef} style={{
            marginLeft: 'auto', padding: '2px 8px',
            borderRadius: 'var(--radius-full)', fontSize: '0.65rem',
            fontWeight: 800, letterSpacing: '0.08em',
            background: '#f8717122', color: '#f87171',
            border: '1px solid #f8717144',
          }}>LOW</div>
        </div>
      )}

      {/* Session analysis */}
      <div ref={metricsBoxRef} className="video-metrics"
        style={{ display: 'none', flexDirection: 'column' }}>

        <div className="video-metrics-title">Session Analysis</div>

        {/* Face — YES/NO */}
        <div className="metric-bar-item">
          <div className="metric-bar-header">
            <span className="metric-bar-icon">👤</span>
            <span className="metric-bar-label">Face Present</span>
            <span ref={faceYesNoRef} style={{
              fontSize: '0.72rem', fontWeight: 700,
              padding: '2px 10px', borderRadius: 'var(--radius-full)',
              border: '1px solid', fontFamily: 'var(--font-mono)',
              transition: 'all 0.3s ease',
              background: 'rgba(248,113,113,0.12)',
              color: '#f87171', borderColor: 'rgba(248,113,113,0.3)',
            }}>NO</span>
          </div>
        </div>

        <MetricBar barRef={barEyeRef}    valRef={valEyeRef}    label="Eye Contact"    icon="👁️" />
        <MetricBar barRef={barStableRef} valRef={valStableRef} label="Head Stability" icon="🧍" />
        <MetricBar barRef={barSmileRef}  valRef={valSmileRef}  label="Smile Rate"     icon="🙂" />

        <div className="engagement-score-row">
          <span className="engagement-score-label">Session Engagement</span>
          <span ref={engScoreRef} className="engagement-score-value">0.0/10</span>
        </div>

      </div>
    </div>
  );
};

export default VideoPanel;
