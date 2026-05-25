// client/src/components/QuestionDisplay.jsx

import React, { useState, useRef } from 'react';
import VoiceInput from './VoiceInput';
import VideoPanel from './VideoPanel';

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

const QuestionDisplay = ({
  question,
  answer,
  onAnswerChange,
  onSubmit,
  loading,
  company,
  questionSource,
  onEmotionData,
}) => {

  const [isRecording, setIsRecording]     = useState(false);
  const [isLocked, setIsLocked]           = useState(false);
  const [analysisReady, setAnalysisReady] = useState(false);

  // ── Live metrics ref — no re-render needed ────────────
  const currentMetricsRef = useRef(null);

  const meta = companyMeta[company] || {
    label: company,
    domain: null,
    color: '#667eea',
  };

  // ── When voice transcript is ready ────────────────────
  const handleTranscriptReady = (text) => {
    onAnswerChange(text);
    setIsLocked(true);

    // Pass final emotion metrics to parent
    if (onEmotionData && currentMetricsRef.current) {
      onEmotionData({
        confidence:  currentMetricsRef.current.eyeContactRatio || 0,
        nervousness: currentMetricsRef.current.headMovementScore || 0,
        eyeContact:  currentMetricsRef.current.eyeContactRatio || 0,
        facePresence: currentMetricsRef.current.facePresence || 0,
        engagementScore: currentMetricsRef.current.engagementScore || 0,
      });
    }
  };

  // ── Handle live metrics from VideoPanel ──────────────
  const handleMetricsUpdate = (metrics) => {
    currentMetricsRef.current = metrics;
  };

  const getSourceLabel = () => {
    if (!questionSource) return null;
    if (questionSource === 'ai_generated') {
      return { label: '✦ AI Generated', type: 'ai' };
    }
    const src = questionSource.replace('dataset_', '');
    return {
      label: `📚 ${src.charAt(0).toUpperCase() + src.slice(1)}`,
      type: 'dataset',
    };
  };

  const sourceInfo = getSourceLabel();

  return (
    <div className="question-display">

      {/* ── Two-column layout on wider screens ────────────── */}
      <div className="interview-layout">

        {/* ── Left Column: Question + Voice ──────────────── */}
        <div className="interview-main">

          {/* Question Card */}
          <div className="section-card">
            <div className="question-meta">
              <div className="company-pill">
                {meta.domain ? (
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${meta.domain}&sz=32`}
                    alt={meta.label}
                    style={{ width: 16, height: 16, borderRadius: 3 }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : null}
                <span>{meta.label} Interview</span>
              </div>
              <div className="difficulty-pill">Internship Level</div>
              {sourceInfo && (
                <div className={`source-badge ${sourceInfo.type}`}>
                  {sourceInfo.label}
                </div>
              )}
            </div>

            <div className="question-box">
              <div className="question-label">
                <span>✦</span>
                Interview Question
              </div>
              <p className="question-text">{question}</p>
            </div>
          </div>

          {/* Voice Response Card */}
          <div className="section-card">
            <div className="voice-section-header">
              <div>
                <div className="voice-section-title">
                  <span>🎙️</span>
                  Voice Response
                </div>
                <div
                  className="voice-section-sub"
                  style={{ marginTop: '4px' }}
                >
                  Speak clearly — answer is transcribed automatically
                </div>
              </div>
              {isLocked && (
                <div className="locked-badge">🔒 Locked</div>
              )}
            </div>

            <VoiceInput
              onTranscriptReady={handleTranscriptReady}
              onRecordingStateChange={setIsRecording}
              isLocked={isLocked}
            />
          </div>

          {/* Submit Button */}
          {isLocked && answer && (
            <button
              className="submit-btn"
              onClick={onSubmit}
              disabled={loading}
            >
              {loading ? (
                <span className="btn-loading">
                  <span className="btn-loading-dot" />
                  <span className="btn-loading-dot" />
                  <span className="btn-loading-dot" />
                </span>
              ) : (
                <>
                  <span>✦</span>
                  Submit for AI Evaluation
                </>
              )}
            </button>
          )}

        </div>

        {/* ── Right Column: Video Panel ───────────────────── */}
        <div className="interview-sidebar">
          <VideoPanel
            isInterviewActive={isRecording || isLocked}
            onMetricsUpdate={handleMetricsUpdate}
            onAnalysisReady={() => setAnalysisReady(true)}
          />

          {/* Tips card */}
          {!isLocked && (
            <div className="interview-tips-card">
              <div className="tips-title">💡 Interview Tips</div>
              <ul className="tips-list">
                <li>Look directly at your camera</li>
                <li>Sit in a well-lit area</li>
                <li>Keep your face centered</li>
                <li>Speak clearly and confidently</li>
                <li>Avoid excessive movement</li>
              </ul>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default QuestionDisplay;