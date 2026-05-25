// client/src/components/VoiceInput.jsx

import React, {
  useState, useRef, useEffect, memo,
} from 'react';
import { transcribeAudio } from '../services/api';

const MIN_SPEAKING_DURATION = 15;
const SILENCE_TIMEOUT       = 8;
const MAX_RECORDING_TIME    = 180;
const WAVEFORM_BARS         = 14;

// ── Waveform — isolated, renders exactly once ─────────────
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

// ── Timer — isolated, renders once ───────────────────────
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

  const [phase, setPhase]                       = useState('idle');
  const [silenceCountdown, setSilenceCountdown] = useState(null);
  const [transcript, setTranscript]             = useState('');
  const [transcribeMethod, setTranscribeMethod] = useState('');
  const [error, setError]                       = useState('');
  const [status, setStatus]                     = useState('');
  const [canStop, setCanStop]                   = useState(false);

  // Shared with sub-components
  const analyserRef      = useRef(null);
  const isRecordingRef   = useRef(false);
  const recordingTimeRef = useRef(0);

  // Internal
  const mediaRecorderRef     = useRef(null);
  const audioChunksRef       = useRef([]);
  const streamRef            = useRef(null);
  const recognitionRef       = useRef(null);
  const browserTranscriptRef = useRef('');
  const recordingTimerRef    = useRef(null);
  const maxTimerRef          = useRef(null);
  const audioContextRef      = useRef(null);
  const mimeTypeRef          = useRef('audio/webm');

  // Silence detection
  const silenceActiveRef   = useRef(false);
  const silenceRafRef      = useRef(null);
  const isSpeakingRef      = useRef(false);
  const silenceStartRef    = useRef(null);
  const lastCountdownRef   = useRef(null);
  const stoppedRef         = useRef(false);

  // ── Adaptive threshold calibration ───────────────────
  // Measures noise floor in first 2s then sets threshold
  // relative to actual speaking volume
  const noiseFloorRef       = useRef(0);
  const calibrationSamples  = useRef([]);
  const isCalibrated        = useRef(false);
  const speakingPeakRef     = useRef(0); // track peak speaking volume
  // Dynamic threshold: set after first speech detected
  const dynamicThresholdRef = useRef(20); // default fallback

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

  const startRecording = async () => {
    setError('');
    setTranscript('');
    setStatus('');
    setSilenceCountdown(null);
    setCanStop(false);
    stoppedRef.current = false;

    audioChunksRef.current       = [];
    browserTranscriptRef.current = '';
    recordingTimeRef.current     = 0;
    isSpeakingRef.current        = false;
    silenceStartRef.current      = null;
    lastCountdownRef.current     = null;
    noiseFloorRef.current        = 0;
    calibrationSamples.current   = [];
    isCalibrated.current         = false;
    speakingPeakRef.current      = 0;
    dynamicThresholdRef.current  = 20; // reset to default

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
      analyser.smoothingTimeConstant = 0.5; // Less smoothing for faster response
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

      // Timer
      recordingTimerRef.current = setInterval(() => {
        recordingTimeRef.current += 1;
        if (recordingTimeRef.current === MIN_SPEAKING_DURATION) {
          setCanStop(true);
        }
      }, 1000);

      startSilenceLoop();

      maxTimerRef.current = setTimeout(() => {
        triggerStop('max_time');
      }, MAX_RECORDING_TIME * 1000);

    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setError('❌ Microphone denied. Allow microphone access in Chrome.');
      } else {
        setError(`❌ Microphone error: ${err.message}`);
      }
    }
  };

  // ─────────────────────────────────────────────────────
  // ADAPTIVE SILENCE DETECTION
  //
  // How it works:
  // Phase 1 — Calibration (first 2 seconds):
  //   Measure noise floor (ambient mic level when silent)
  //   Status shows "Calibrating..."
  //
  // Phase 2 — Speaking detection:
  //   avg > (noiseFloor * 3) = speaking
  //   Track peak speaking volume
  //
  // Phase 3 — Silence detection:
  //   isSpeakingRef = true AND avg < dynamicThreshold
  //   dynamicThreshold = max(noiseFloor * 2, speakingPeak * 0.25)
  //   This means: you need to drop to 25% of your speaking volume
  //   before it counts as silence
  //
  // This completely eliminates the fixed threshold problem
  // ─────────────────────────────────────────────────────
  const startSilenceLoop = () => {
    const dataArray = new Uint8Array(64);
    const CALIBRATION_FRAMES = 30; // ~2s at 15fps

    const loop = () => {
      if (!silenceActiveRef.current) {
        console.log('🔇 Silence loop exited');
        return;
      }

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
      if (!isCalibrated.current) {
        calibrationSamples.current.push(avg);

        if (calibrationSamples.current.length >= CALIBRATION_FRAMES) {
          // Sort and take median (ignore spikes)
          const sorted = [...calibrationSamples.current].sort((a, b) => a - b);
          const median = sorted[Math.floor(sorted.length / 2)];
          noiseFloorRef.current = median;

          // Initial dynamic threshold: 3x noise floor
          // Must be at least 15 to avoid false triggers
          dynamicThresholdRef.current = Math.max(15, median * 3);
          isCalibrated.current        = true;

          console.log(
            `🎙️ Calibrated: noise floor=${median.toFixed(1)}, ` +
            `silence threshold=${dynamicThresholdRef.current.toFixed(1)}`
          );

          setStatus('🎙️ Listening... Speak your answer');
        }

        silenceRafRef.current = requestAnimationFrame(loop);
        return;
      }

      // ── Phase 2 & 3: Speaking + silence detection ──
      const threshold = dynamicThresholdRef.current;
      const isSpeaking = avg > threshold;

      if (isSpeaking) {
        isSpeakingRef.current  = true;
        silenceStartRef.current = null;

        // Track peak volume to refine threshold
        if (avg > speakingPeakRef.current) {
          speakingPeakRef.current = avg;
          // Update threshold: must drop to 30% of speaking peak
          const newThreshold = Math.max(
            dynamicThresholdRef.current,
            speakingPeakRef.current * 0.30
          );
          dynamicThresholdRef.current = newThreshold;
        }

        if (lastCountdownRef.current !== null) {
          lastCountdownRef.current = null;
          setSilenceCountdown(null);
        }

      } else if (
        isSpeakingRef.current &&
        recordingTimeRef.current >= MIN_SPEAKING_DURATION
      ) {
        // Silence after confirmed speaking
        if (!silenceStartRef.current) {
          silenceStartRef.current = Date.now();
          console.log(
            `🔇 Silence started | avg=${avg.toFixed(1)} ` +
            `threshold=${threshold.toFixed(1)}`
          );
        }

        const elapsed   = (Date.now() - silenceStartRef.current) / 1000;
        const remaining = SILENCE_TIMEOUT - elapsed;

        if (remaining <= 0) {
          console.log(`✅ ${SILENCE_TIMEOUT}s silence — auto stopping`);
          silenceActiveRef.current = false;
          triggerStop('silence');
          return;
        }

        const countInt = Math.ceil(remaining);
        if (countInt !== lastCountdownRef.current) {
          lastCountdownRef.current = countInt;
          setSilenceCountdown(countInt);
        }

      } else if (!isSpeakingRef.current) {
        silenceStartRef.current = null;
        if (lastCountdownRef.current !== null) {
          lastCountdownRef.current = null;
          setSilenceCountdown(null);
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

    console.log(`⏹️ triggerStop: ${reason}`);

    silenceActiveRef.current = false;
    isRecordingRef.current   = false;

    cancelAnimationFrame(silenceRafRef.current);
    clearInterval(recordingTimerRef.current);
    clearTimeout(maxTimerRef.current);
    setSilenceCountdown(null);
    setCanStop(false);

    streamRef.current?.getTracks().forEach((t) => t.stop());
    try { recognitionRef.current?.stop(); } catch {}

    // Null analyser BEFORE closing context
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
      setError(`⚠️ Speak for at least ${MIN_SPEAKING_DURATION} seconds first.`);
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
      console.log(`📦 Audio: ${blob.size} bytes`);

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
    console.log(`🔒 Locked [${method}]`);
  };

  return (
    <div className="voice-input">

      {/* ── IDLE ───────────────────────────────────────── */}
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
            <span className="voice-rule-tag">⏱️ Max {MAX_RECORDING_TIME / 60} min</span>
            <span className="voice-rule-tag">🔇 Auto-stops after {SILENCE_TIMEOUT}s silence</span>
            <span className="voice-rule-tag">🔒 One attempt only</span>
          </div>
        </div>
      )}

      {/* ── RECORDING ──────────────────────────────────── */}
      {phase === 'recording' && (
        <div className="voice-recording">

          <Waveform
            analyserRef={analyserRef}
            isActiveRef={isRecordingRef}
          />

          <RecordingTimer
            timeRef={recordingTimeRef}
            maxTime={MAX_RECORDING_TIME}
          />

          <p className="recording-live-status">{status}</p>

          {silenceCountdown !== null && (
            <div className="silence-warning">
              🔇 Silence detected — stopping in {silenceCountdown}s
            </div>
          )}

          {!canStop && (
            <p className="min-time-hint">
              Speak for at least {MIN_SPEAKING_DURATION}s before manual stop
            </p>
          )}

          {canStop && (
            <button className="record-stop-btn" onClick={handleManualStop}>
              ⏹️ Done Speaking
            </button>
          )}

        </div>
      )}

      {/* ── PROCESSING ─────────────────────────────────── */}
      {phase === 'processing' && (
        <div className="voice-processing">
          <div className="processing-ring">
            <div className="processing-ring-circle" />
          </div>
          <p className="processing-text">{status}</p>
          <p className="processing-sub">Please wait...</p>
        </div>
      )}

      {/* ── DONE ───────────────────────────────────────── */}
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

      {/* ── ERROR ──────────────────────────────────────── */}
      {error && (
        <div className="voice-error-box">
          <p>{error}</p>
          {phase === 'idle' && (
            <button
              className="record-start-btn"
              onClick={() => { setError(''); stoppedRef.current = false; }}
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