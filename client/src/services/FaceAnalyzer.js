// client/src/services/FaceAnalyzer.js

import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

const L = {
  NOSE_TIP:          1,
  LEFT_EYE_INNER:    133, LEFT_EYE_OUTER:    33,
  LEFT_EYE_TOP:      159, LEFT_EYE_BOTTOM:   145,
  RIGHT_EYE_INNER:   362, RIGHT_EYE_OUTER:   263,
  RIGHT_EYE_TOP:     386, RIGHT_EYE_BOTTOM:  374,
  LEFT_IRIS_CENTER:  468, RIGHT_IRIS_CENTER: 473,
  MOUTH_LEFT:        61,  MOUTH_RIGHT:       291,
  LEFT_CHEEK:        234, RIGHT_CHEEK:       454,
};

const CFG = {
  EAR_OPEN:    0.15,
  YAW_MAX:     25,
  PITCH_MAX:   22,
  IRIS_MAX:    0.40,
  MOV_STABLE:  0.040,
  SMILE_BS:    0.20,
  SMILE_GEO:   0.42,

  // ── Sliding window = 10 seconds @ 15fps = 150 frames ──
  // Bars reflect last 10s of behavior
  // Face absent 10s → bar drops to 0
  // Face present 3s → bar rises visibly
  WINDOW: 150,
};

class FaceAnalyzer {
  constructor() {
    this.landmarker    = null;
    this.isInitialized = false;
    this.isRunning     = false;
    this.rafId         = null;
    this.lastTs        = -1;
    this.onFrame       = null;
    this.prevNose      = null;

    // ── Sliding windows (last 150 frames = 10s) ───────────
    // Each slot is 0 or 1
    // Average of window = current metric %
    this.win = {
      eye:    [],   // 1 = eye contact this frame
      smile:  [],   // 1 = smiling this frame
      stable: [],   // 1 = head stable this frame
      face:   [],   // 1 = face detected this frame
    };

    // ── Lifetime accumulators (for session summary only) ──
    this.life = this._zeroLife();
  }

  async initialize() {
    if (this.isInitialized) return { success: true };

    for (const delegate of ['GPU', 'CPU']) {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.12/wasm'
        );
        this.landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate,
          },
          runningMode:                       'VIDEO',
          numFaces:                           1,
          minFaceDetectionConfidence:         0.4,
          minFacePresenceConfidence:          0.4,
          minTrackingConfidence:              0.4,
          outputFaceBlendshapes:              true,
          outputFacialTransformationMatrixes: true,
        });
        this.isInitialized = true;
        console.log(`✅ MediaPipe [${delegate}]`);
        return { success: true };
      } catch (e) {
        console.warn(`⚠️ ${delegate}:`, e.message);
      }
    }
    return { success: false, error: 'Face detection failed.' };
  }

  startAnalysis(videoEl, onFrame) {
    if (!this.isInitialized || !videoEl) return;
    this.isRunning = true;
    this.onFrame   = onFrame;
    this.prevNose  = null;
    this.lastTs    = -1;
    this.win       = { eye: [], smile: [], stable: [], face: [] };
    this.life      = this._zeroLife();
    this._loop(videoEl);
  }

  stopAnalysis() {
    this.isRunning = false;
    if (this.rafId) { cancelAnimationFrame(this.rafId); this.rafId = null; }
  }

  _loop(videoEl) {
    const tick = () => {
      if (!this.isRunning) return;
      const now = performance.now();
      if (videoEl.readyState >= 2 && videoEl.videoWidth > 0 && now - this.lastTs > 66) {
        this.lastTs = now;
        try {
          const r = this.landmarker.detectForVideo(videoEl, now);
          if (this.onFrame) this.onFrame(this._process(r));
        } catch (_) {}
      }
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  _process(results) {
    this.life.total++;

    const hasLM = results?.faceLandmarks?.length > 0
      && results.faceLandmarks[0].length > 400;

    // ── NO FACE ───────────────────────────────────────────
    if (!hasLM) {
      // Push 0 to ALL windows every frame
      // Old 1s slide out, new 0s slide in
      // → values decrease at rate: 1 value per frame
      // → fully 0 after WINDOW frames (10 seconds)
      this._slide('face',   0);
      this._slide('eye',    0);
      this._slide('smile',  0);
      this._slide('stable', 0);
      this.prevNose = null;

      const w = this._windowRatios();

      return {
        faceDetected: false,
        live: { face: false, eye: false, smile: false, stable: false },
        engagement: 'low',
        // Window-based display values
        display: w,
        // Lifetime session summary
        session: this._sessionSummary(),
      };
    }

    // ── FACE DETECTED ─────────────────────────────────────
    const lm     = results.faceLandmarks[0];
    const blends = results.faceBlendshapes?.[0]?.categories || [];
    const mats   = results.facialTransformationMatrixes;

    this._slide('face', 1);
    this.life.face++;

    // Eye openness
    const lOpen = this._ear(lm, 'left')  > CFG.EAR_OPEN;
    const rOpen = this._ear(lm, 'right') > CFG.EAR_OPEN;

    // Head pose
    const pose = this._pose(mats);

    // Eye contact
    const eyeOn = lOpen && rOpen && this._gaze(lm, blends, pose, lOpen, rOpen);
    this._slide('eye', eyeOn ? 1 : 0);

    // Stability
    const mov    = this._mov(lm);
    const stable = mov < CFG.MOV_STABLE;
    this._slide('stable', stable ? 1 : 0);

    // Smile
    const smiling = this._smile(lm, blends);
    this._slide('smile', smiling ? 1 : 0);

    // Lifetime accumulators
    if (eyeOn)   this.life.eye++;
    if (smiling) this.life.smile++;
    if (stable)  this.life.stable++;

    // Window ratios for display
    const w = this._windowRatios();

    const engagement = this._eng(
      w.eye    > 0.5,
      w.smile  > 0.3,
      w.stable > 0.5,
      pose
    );

    return {
      faceDetected: true,
      live: {
        face:   true,
        eye:    w.eye    > 0.5,
        smile:  w.smile  > 0.3,
        stable: w.stable > 0.5,
      },
      engagement,
      display: w,
      session: this._sessionSummary(),
    };
  }

  // ── Slide value into window ────────────────────────────
  // Push new value, drop oldest if window full
  // This is what makes values decrease when face is absent
  _slide(key, val) {
    const w = this.win[key];
    w.push(val);
    if (w.length > CFG.WINDOW) w.shift();
  }

  // ── Get window average (0.0 - 1.0) ───────────────────
  _winAvg(key) {
    const w = this.win[key];
    if (!w.length) return 0;
    return w.reduce((a, v) => a + v, 0) / w.length;
  }

  // ── All window ratios ─────────────────────────────────
  _windowRatios() {
    return {
      face:   this._winAvg('face'),
      eye:    this._winAvg('eye'),
      smile:  this._winAvg('smile'),
      stable: this._winAvg('stable'),
    };
  }

  // ── EAR ───────────────────────────────────────────────
  _ear(lm, s) {
    try {
      const v = Math.abs(
        lm[s === 'left' ? L.LEFT_EYE_TOP    : L.RIGHT_EYE_TOP].y -
        lm[s === 'left' ? L.LEFT_EYE_BOTTOM : L.RIGHT_EYE_BOTTOM].y
      );
      const h = Math.abs(
        lm[s === 'left' ? L.LEFT_EYE_INNER  : L.RIGHT_EYE_INNER].x -
        lm[s === 'left' ? L.LEFT_EYE_OUTER  : L.RIGHT_EYE_OUTER].x
      );
      return h > 0.001 ? v / h : 0;
    } catch { return 0.3; }
  }

  // ── Head pose ─────────────────────────────────────────
  _pose(mats) {
    try {
      if (!mats?.length) return { yaw: 0, pitch: 0 };
      const m = mats[0].data;
      return {
        yaw:   +(Math.atan2(-m[8], m[10]) * 180 / Math.PI).toFixed(1),
        pitch: +(Math.asin(Math.max(-1, Math.min(1, m[9]))) * 180 / Math.PI).toFixed(1),
      };
    } catch { return { yaw: 0, pitch: 0 }; }
  }

  // ── Gaze toward camera ────────────────────────────────
  _gaze(lm, blends, pose, lOpen, rOpen) {
    try {
      if (!lOpen || !rOpen)                    return false;
      if (Math.abs(pose.yaw)   > CFG.YAW_MAX)   return false;
      if (Math.abs(pose.pitch) > CFG.PITCH_MAX)  return false;

      const hasIris = lm[L.LEFT_IRIS_CENTER]?.x > 0;
      if (hasIris) {
        if (this._irisOff(lm, 'left')  > CFG.IRIS_MAX) return false;
        if (this._irisOff(lm, 'right') > CFG.IRIS_MAX) return false;
      } else {
        const cx =
          ((lm[L.LEFT_EYE_INNER].x  + lm[L.LEFT_EYE_OUTER].x) +
           (lm[L.RIGHT_EYE_INNER].x + lm[L.RIGHT_EYE_OUTER].x)) / 4;
        if (Math.abs(lm[L.NOSE_TIP].x - cx) > 0.08) return false;
      }
      return true;
    } catch { return false; }
  }

  _irisOff(lm, s) {
    try {
      const iris  = lm[s === 'left' ? L.LEFT_IRIS_CENTER  : L.RIGHT_IRIS_CENTER];
      const inner = lm[s === 'left' ? L.LEFT_EYE_INNER    : L.RIGHT_EYE_INNER];
      const outer = lm[s === 'left' ? L.LEFT_EYE_OUTER    : L.RIGHT_EYE_OUTER];
      const w  = Math.abs(inner.x - outer.x);
      const cx = (inner.x + outer.x) / 2;
      return w > 0.001 ? Math.abs(iris.x - cx) / (w / 2) : 0;
    } catch { return 0; }
  }

  // ── Head movement ─────────────────────────────────────
  _mov(lm) {
    try {
      const n = { x: lm[L.NOSE_TIP].x, y: lm[L.NOSE_TIP].y };
      if (!this.prevNose) { this.prevNose = n; return 0; }
      const d = Math.sqrt((n.x - this.prevNose.x) ** 2 + (n.y - this.prevNose.y) ** 2);
      this.prevNose = n;
      return Math.min(1, d * 30);
    } catch { return 0; }
  }

  // ── Smile ─────────────────────────────────────────────
  _smile(lm, blends) {
    try {
      if (blends.length > 10) {
        const sl = blends.find((b) => b.categoryName === 'mouthSmileLeft')?.score  ?? -1;
        const sr = blends.find((b) => b.categoryName === 'mouthSmileRight')?.score ?? -1;
        if (sl >= 0 && sr >= 0) return (sl + sr) / 2 > CFG.SMILE_BS;
      }
      const mw = Math.abs(lm[L.MOUTH_LEFT].x - lm[L.MOUTH_RIGHT].x);
      const cw = Math.abs(lm[L.LEFT_CHEEK].x  - lm[L.RIGHT_CHEEK].x);
      return cw > 0.001 && mw / cw > CFG.SMILE_GEO;
    } catch { return false; }
  }

  // ── Engagement ────────────────────────────────────────
  _eng(eye, smile, stable, pose) {
    let s = 0;
    if (eye)    s += 4;
    if (smile)  s += 2;
    if (stable) s += 2;
    if (Math.abs(pose.yaw) < 10 && Math.abs(pose.pitch) < 10) s += 2;
    else if (Math.abs(pose.yaw) < 18) s += 1;
    if (Math.abs(pose.yaw) > 30) s -= 2;
    return s >= 7 ? 'high' : s >= 4 ? 'medium' : 'low';
  }

  // ─────────────────────────────────────────────────────
  // SESSION SUMMARY — for final report after interview
  // Uses lifetime totals / lifetime total
  // NOT used for bars — bars use window ratios
  // ─────────────────────────────────────────────────────
  _sessionSummary() {
    const { total, face, eye, smile, stable } = this.life;
    if (total === 0) return {
      facePresence: 0, eyeContactRatio: 0, headStability: 0,
      smileRatio: 0, engagementScore: 0, totalFrames: 0,
    };

    const faceP   = face   / total;
    const eyeR    = eye    / total;
    const stableR = stable / total;
    const smileR  = smile  / total;

    const score = Math.min(10, Math.max(0,
      faceP   * 2.0 + eyeR * 4.5 + stableR * 2.5 + smileR * 1.0
    ));

    return {
      facePresence:    +faceP.toFixed(2),
      eyeContactRatio: +eyeR.toFixed(2),
      headStability:   +stableR.toFixed(2),
      smileRatio:      +smileR.toFixed(2),
      engagementScore: +score.toFixed(1),
      totalFrames:     total,
    };
  }

  getSessionSummary() { return this._sessionSummary(); }

  resetMetrics() {
    this.win      = { eye: [], smile: [], stable: [], face: [] };
    this.life     = this._zeroLife();
    this.prevNose = null;
  }

  _zeroLife() {
    return { total: 0, face: 0, eye: 0, smile: 0, stable: 0 };
  }
}

export const faceAnalyzer = new FaceAnalyzer();
export default FaceAnalyzer;