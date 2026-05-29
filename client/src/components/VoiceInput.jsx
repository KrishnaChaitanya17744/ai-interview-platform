// client/src/components/VoiceInput.jsx

import React, {
  useState, useRef, useEffect, memo,
} from 'react';
import { transcribeAudio } from '../services/api';

const MIN_SPEAKING_DURATION = 15;
const SILENCE_TIMEOUT       = 8;
const MAX_RECORDING_TIME    = 180;
const WAVEFORM_BARS         = 14;

// ─────────────────────────────────────────────────────────
// WAVEFORM — isolated, renders exactly once
// ─────────────────────────────────────────────────────────
const Waveform = memo(({ analyserRef, isActiveRef }) => {
  const barsRef = useRef([]);
  const rafRef  = useRef(null);

  useEffect(() => {
    const data = new Uint8Array(64);

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);

      if (!isActiveRef.current || !analyserRef.current) {
        barsRef.current.forEach((b, i) => {
          if (!b) return;
          b.style.height  = `${4 + Math.sin(Date.now() / 600 + i * 0.4) * 2}px`;
          b.style.opacity = '0.2';
        });
        return;
      }

      try {
        analyserRef.current.getByteFrequencyData(data);
      } catch { return; }

      const avg    = data.reduce((a, b) => a + b, 0) / data.length;
      const active = avg > 5;

      barsRef.current.forEach((b, i) => {
        if (!b) return;
        const h = active
          ? Math.max(6, (avg / 128) *
              (44 + Math.sin(i * 0.9 + Date.now() / 180) * 18))
          : 4 + Math.sin(Date.now() / 500 + i * 0.5) * 2;
        b.style.height  = `${h}px`;
        b.style.opacity = active ? '1' : '0.2';
      });
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div className="waveform">
      {[...Array(WAVEFORM_BARS)].map((_, i) => (
        <div
          key={i}
          ref={(el) => (barsRef.current[i] = el)}
          className="waveform-bar"
          style={{ height: '4px', opacity: '0.2' }}
        />
      ))}
    </div>
  );
});
Waveform.displayName = 'Waveform';

// ─────────────────────────────────────────────────────────
// RECORDING TIMER — isolated, renders once
// ─────────────────────────────────────────────────────────
const RecordingTimer = memo(({ timeRef, maxTime }) => {
  const displayRef = useRef(null);

  useEffect(() => {
    const iv = setInterval(() => {
      if (!displayRef.current) return;
      const s   = timeRef.current || 0;
      const m   = Math.floor(s / 60).toString().padStart(2, '0');
      const sec = (s % 60).toString().padStart(2, '0');
      displayRef.current.textContent = `${m}:${sec}`;
    }, 250);
    return () => clearInterval(iv);
  }, []);

  const mm = Math.floor(maxTime / 60).toString().padStart(2, '0');
  const ss = (maxTime % 60).toString().padStart(2, '0');

  return (
    <div className="recording-timer">
      <span className="recording-dot" />
      <span className="timer-display" ref={displayRef}>00:00</span>
      <span className="timer-max">/ {mm}:{ss}</span>
    </div>
  );
});
RecordingTimer.displayName = 'RecordingTimer';

// ─────────────────────────────────────────────────────────
// MAIN VOICE INPUT
// ─────────────────────────────────────────────────────────
const VoiceInput = ({ onTranscriptReady, onRecordingStateChange, isLocked }) => {

  // ── Minimal state — phase changes only ───────────────
  const [phase,           setPhase]           = useState('idle');
  const [error,           setError]           = useState('');
  const [status,          setStatus]          = useState('');
  const [transcript,      setTranscript]      = useState('');
  const [transcribeMethod,setTranscribeMethod]= useState('');

  // ── Shared with sub-components ────────────────────────
  const analyserRef      = useRef(null);
  const isRecordingRef   = useRef(false);
  const recordingTimeRef = useRef(0);

  // ── Silence warning DOM refs ──────────────────────────
  const silenceWarningRef     = useRef(null);  // the wrapper div
  const silenceCountdownRef   = useRef(null);  // the number span ← FIX

  // ── Manual stop button DOM ref ────────────────────────
  const canStopBtnRef   = useRef(null);
  const minTimeHintRef  = useRef(null);

  // ── Internal recording refs ───────────────────────────
  const mediaRecorderRef     = useRef(null);
  const audioChunksRef       = useRef([]);
  const streamRef            = useRef(null);
  const recognitionRef       = useRef(null);
  const browserTranscriptRef = useRef('');
  const recordingTimerRef    = useRef(null);
  const maxTimerRef          = useRef(null);
  const audioContextRef      = useRef(null);
  const mimeTypeRef          = useRef('audio/webm');

  // ── Silence detection refs ────────────────────────────
  const silenceActiveRef      = useRef(false);
  const silenceRafRef         = useRef(null);
  const isSpeakingRef         = useRef(false);
  const silenceStartRef       = useRef(null);
  const lastCountdownRef      = useRef(null);
  const stoppedRef            = useRef(false);

  // ── Adaptive threshold refs ───────────────────────────
  const noiseFloorRef         = useRef(0);
  const calibrationSamples    = useRef([]);
  const isCalibratedRef       = useRef(false);
  const speakingPeakRef       = useRef(0);
  const dynamicThresholdRef   = useRef(20);

  useEffect(() => { return () => cleanupAll(); }, []);

  const cleanupAll = () => {
    silenceActiveRef.current = false;
    isRecordingRef.current   = false;
    cancelAnimationFrame(silenceRafRef.current);
    clearInterval(recordingTimerRef.current);
    clearTimeout(maxTimerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    try { recognitionRef.current?.stop(); } catch {}
    analyserRef.current = null;
    if (audioContextRef.current?.state !== 'closed') {
      audioContextRef.current?.close().catch(() => {});
    }
  };

  // ── Silence warning helpers ───────────────────────────
  // FIX: Use silenceCountdownRef directly instead of querySelector
  const showSilenceWarning = (seconds) => {
    if (silenceWarningRef.current) {
      silenceWarningRef.current.style.display = 'flex';
    }
    if (silenceCountdownRef.current) {
      silenceCountdownRef.current.textContent = seconds;
    }
  };

  const hideSilenceWarning = () => {
    if (silenceWarningRef.current) {
      silenceWarningRef.current.style.display = 'none';
    }
    if (silenceCountdownRef.current) {
      silenceCountdownRef.current.textContent = SILENCE_TIMEOUT;
    }
  };

  // ── Manual stop button helpers ────────────────────────
  const showCanStopBtn = () => {
    if (canStopBtnRef.current)  canStopBtnRef.current.style.display  = 'flex';
    if (minTimeHintRef.current) minTimeHintRef.current.style.display = 'none';
  };

  const startRecording = async () => {
    setError('');
    setTranscript('');
    setStatus('');
    stoppedRef.current = false;

    // Reset all refs
    audioChunksRef.current       = [];
    browserTranscriptRef.current = '';
    recordingTimeRef.current     = 0;
    isSpeakingRef.current        = false;
    silenceStartRef.current      = null;
    lastCountdownRef.current     = null;
    noiseFloorRef.current        = 0;
    calibrationSamples.current   = [];
    isCalibratedRef.current      = false;
    speakingPeakRef.current      = 0;
    dynamicThresholdRef.current  = 20;

    // Reset DOM state
    hideSilenceWarning();
    if (canStopBtnRef.current)  canStopBtnRef.current.style.display  = 'none';
    if (minTimeHintRef.current) minTimeHintRef.current.style.display = 'block';

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate:       16000,
        },
      });
      streamRef.current = stream;

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx      = new AudioCtx();
      audioContextRef.current = ctx;

      const source   = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize               = 256;
      analyser.smoothingTimeConstant = 0.5;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mimeType =
        MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' :
        MediaRecorder.isTypeSupported('audio/webm')             ? 'audio/webm' :
        MediaRecorder.isTypeSupported('audio/mp4')              ? 'audio/mp4'  :
        'audio/ogg';
      mimeTypeRef.current = mimeType;

      const mr = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mr;
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mr.onstop = () => processAudio();
      mr.start(500);

      startBrowserSpeech();
      isRecordingRef.current   = true;
      silenceActiveRef.current = true;

      setPhase('recording');
      onRecordingStateChange(true);
      setStatus('🎙️ Calibrating... Start speaking');

      recordingTimerRef.current = setInterval(() => {
        recordingTimeRef.current += 1;
        if (recordingTimeRef.current === MIN_SPEAKING_DURATION) {
          showCanStopBtn();
        }
      }, 1000);

      startSilenceLoop();

      maxTimerRef.current = setTimeout(() => {
        triggerStop('max_time');
      }, MAX_RECORDING_TIME * 1000);

    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setError('❌ Microphone denied. Please allow microphone in Chrome.');
      } else {
        setError(`❌ Microphone error: ${err.message}`);
      }
    }
  };

  // ─────────────────────────────────────────────────────
  // SILENCE DETECTION — Zero setState during countdown
  // showSilenceWarning() / hideSilenceWarning() = DOM only
  // ─────────────────────────────────────────────────────
  const startSilenceLoop = () => {
    const dataArray          = new Uint8Array(64);
    const CALIBRATION_FRAMES = 30;

    const loop = () => {
      if (!silenceActiveRef.current) return;

      let avg = 0;

      try {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        }
      } catch {
        silenceActiveRef.current = false;
        return;
      }

      // ── Phase 1: Calibrate noise floor ──────────────
      if (!isCalibratedRef.current) {
        calibrationSamples.current.push(avg);

        if (calibrationSamples.current.length >= CALIBRATION_FRAMES) {
          const sorted  = [...calibrationSamples.current].sort((a, b) => a - b);
          const median  = sorted[Math.floor(sorted.length / 2)];
          noiseFloorRef.current       = median;
          dynamicThresholdRef.current = Math.max(15, median * 3);
          isCalibratedRef.current     = true;
          setStatus('🎙️ Listening... Speak your answer');
        }

        if (silenceActiveRef.current) {
          silenceRafRef.current = requestAnimationFrame(loop);
        }
        return;
      }

      // ── Phase 2: Speaking / silence detection ────────
      const threshold  = dynamicThresholdRef.current;
      const isSpeaking = avg > threshold;

      if (isSpeaking) {
        isSpeakingRef.current   = true;
        silenceStartRef.current = null;

        if (avg > speakingPeakRef.current) {
          speakingPeakRef.current     = avg;
          dynamicThresholdRef.current = Math.max(
            dynamicThresholdRef.current,
            speakingPeakRef.current * 0.30
          );
        }

        if (lastCountdownRef.current !== null) {
          lastCountdownRef.current = null;
          hideSilenceWarning();
        }

      } else if (
        isSpeakingRef.current &&
        recordingTimeRef.current >= MIN_SPEAKING_DURATION
      ) {
        if (!silenceStartRef.current) {
          silenceStartRef.current = Date.now();
        }

        const elapsed   = (Date.now() - silenceStartRef.current) / 1000;
        const remaining = SILENCE_TIMEOUT - elapsed;

        if (remaining <= 0) {
          silenceActiveRef.current = false;
          triggerStop('silence');
          return;
        }

        // ── KEY FIX: use ref directly, not querySelector ─
        const countInt = Math.ceil(remaining);
        if (countInt !== lastCountdownRef.current) {
          lastCountdownRef.current = countInt;
          showSilenceWarning(countInt);
        }

      } else {
        silenceStartRef.current = null;
        if (lastCountdownRef.current !== null) {
          lastCountdownRef.current = null;
          hideSilenceWarning();
        }
      }

      if (silenceActiveRef.current) {
        silenceRafRef.current = requestAnimationFrame(loop);
      }
    };

    silenceRafRef.current = requestAnimationFrame(loop);
  };

  const triggerStop = (reason) => {
    if (stoppedRef.current) return;
    stoppedRef.current = true;

    silenceActiveRef.current = false;
    isRecordingRef.current   = false;

    cancelAnimationFrame(silenceRafRef.current);
    clearInterval(recordingTimerRef.current);
    clearTimeout(maxTimerRef.current);

    hideSilenceWarning();
    if (canStopBtnRef.current)  canStopBtnRef.current.style.display  = 'none';
    if (minTimeHintRef.current) minTimeHintRef.current.style.display = 'none';

    streamRef.current?.getTracks().forEach((t) => t.stop());
    try { recognitionRef.current?.stop(); } catch {}

    analyserRef.current = null;
    if (audioContextRef.current?.state !== 'closed') {
      audioContextRef.current?.close().catch(() => {});
    }

    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    onRecordingStateChange(false);
    setPhase('processing');

    const msg =
      reason === 'silence'  ? '🔇 Silence detected — transcribing...'  :
      reason === 'max_time' ? '⏱️ Time limit reached — transcribing...' :
                              '⏹️ Processing your answer...';
    setStatus(msg);
  };

  const handleManualStop = () => {
    if (recordingTimeRef.current < MIN_SPEAKING_DURATION) {
      setError(`⚠️ Please speak for at least ${MIN_SPEAKING_DURATION} seconds first.`);
      return;
    }
    triggerStop('manual');
  };

  const startBrowserSpeech = () => {
    if (
      !('webkitSpeechRecognition' in window) &&
      !('SpeechRecognition' in window)
    ) return;

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const r  = new SR();
    recognitionRef.current = r;

    r.continuous      = true;
    r.interimResults  = true;
    r.lang            = 'en-US';
    r.maxAlternatives = 1;

    r.onresult = (e) => {
      let text = '';
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) text += e.results[i][0].transcript + ' ';
      }
      if (text.trim()) browserTranscriptRef.current = text.trim();
    };

    r.onerror = () => {};
    try { r.start(); } catch {}
  };

  const processAudio = async () => {
    try {
      const blob = new Blob(audioChunksRef.current, {
        type: mimeTypeRef.current,
      });

      if (blob.size < 1000) {
        setError('⚠️ Recording too short. Please speak for at least 3 seconds.');
        setPhase('idle');
        setStatus('');
        stoppedRef.current = false;
        return;
      }

      setStatus('🤖 Transcribing with Whisper AI...');
      const result = await transcribeAudio(blob, mimeTypeRef.current);

      if (result.success && result.transcript?.trim()) {
        finalize(result.transcript.trim(), 'whisper');
        return;
      }

      setStatus('🌐 Using browser transcription...');
      if (browserTranscriptRef.current?.trim()) {
        finalize(browserTranscriptRef.current.trim(), 'browser');
        return;
      }

      setError('❌ Could not transcribe audio. Please try again.');
      setPhase('idle');
      setStatus('');
      stoppedRef.current = false;

    } catch {
      if (browserTranscriptRef.current?.trim()) {
        finalize(browserTranscriptRef.current.trim(), 'browser');
      } else {
        setError('❌ Transcription failed. Please try again.');
        setPhase('idle');
        setStatus('');
        stoppedRef.current = false;
      }
    }
  };

  const finalize = (text, method) => {
    setTranscript(text);
    setTranscribeMethod(method);
    setPhase('done');
    setStatus('');
    onTranscriptReady(text);
    onRecordingStateChange(false);
  };

  // ── RENDER ─────────────────────────────────────────────
  return (
    <div className="voice-input">

      {/* ── IDLE ─────────────────────────────────────── */}
      {phase === 'idle' && !isLocked && (
        <div className="voice-idle">
          <div className="voice-idle-icon">🎙️</div>
          <p className="voice-instruction">
            Press the button and speak your complete answer.
            Recording stops automatically after {SILENCE_TIMEOUT} seconds of silence.
          </p>
          <button className="record-start-btn" onClick={startRecording}>
            🎙️ Start Recording
          </button>
          <div className="voice-rules">
            <span className="voice-rule-tag">
              ⏱️ Max {MAX_RECORDING_TIME / 60} min
            </span>
            <span className="voice-rule-tag">
              🔇 Auto-stops after {SILENCE_TIMEOUT}s silence
            </span>
            <span className="voice-rule-tag">
              🔒 One attempt only
            </span>
          </div>
        </div>
      )}

      {/* ── RECORDING ────────────────────────────────── */}
      {phase === 'recording' && (
        <div className="voice-recording">

          {/* Waveform — renders once */}
          <Waveform
            analyserRef={analyserRef}
            isActiveRef={isRecordingRef}
          />

          {/* Timer — renders once */}
          <RecordingTimer
            timeRef={recordingTimeRef}
            maxTime={MAX_RECORDING_TIME}
          />

          {/* Status — changes at most twice per session */}
          <p className="recording-live-status">{status}</p>

          {/*
            Silence warning — hidden by default
            showSilenceWarning(n) sets display:flex + updates
            silenceCountdownRef.current directly
            ZERO re-renders during countdown
          */}
          <div
            ref={silenceWarningRef}
            className="silence-warning"
            style={{ display: 'none' }}
          >
            🔇 Silence detected — stopping in{' '}
            <strong
              ref={silenceCountdownRef}
              style={{ margin: '0 3px' }}
            >
              {SILENCE_TIMEOUT}
            </strong>s
          </div>

          {/* Min time hint — hidden via DOM when threshold reached */}
          <p
            ref={minTimeHintRef}
            className="min-time-hint"
          >
            Speak for at least {MIN_SPEAKING_DURATION}s before manual stop
          </p>

          {/* Done Speaking button — shown via DOM */}
          <button
            ref={canStopBtnRef}
            className="record-stop-btn"
            onClick={handleManualStop}
            style={{ display: 'none' }}
          >
            ⏹️ Done Speaking
          </button>

        </div>
      )}

      {/* ── PROCESSING ───────────────────────────────── */}
      {phase === 'processing' && (
        <div className="voice-processing">
          <div className="processing-ring">
            <div className="processing-ring-circle" />
          </div>
          <p className="processing-text">{status}</p>
          <p className="processing-sub">Please wait...</p>
        </div>
      )}

      {/* ── DONE ─────────────────────────────────────── */}
      {phase === 'done' && (
        <div className="voice-done">
          <div className="locked-header">
            <div className="locked-badge">🔒 Response Locked</div>
            <div className="transcript-method-badge">
              {transcribeMethod === 'whisper'
                ? '🤖 OpenAI Whisper'
                : '🌐 Browser API'}
            </div>
          </div>
          <div className="locked-transcript">
            <p>{transcript}</p>
          </div>
          <div className="locked-hint">
            ✅ Answer recorded. Click submit to evaluate.
          </div>
        </div>
      )}

      {/* ── ERROR ────────────────────────────────────── */}
      {error && (
        <div className="voice-error-box">
          <p>{error}</p>
          {phase === 'idle' && (
            <button
              className="record-start-btn"
              onClick={() => {
                setError('');
                stoppedRef.current = false;
              }}
              style={{ fontSize: '0.85rem', padding: '8px 20px' }}
            >
              Try Again
            </button>
          )}
        </div>
      )}

    </div>
  );
};

export default VoiceInput;