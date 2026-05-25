// client/src/services/WebcamManager.js
// ─────────────────────────────────────────────────────────
// Handles all webcam lifecycle operations:
// - Requesting permission
// - Starting / stopping the stream
// - Attaching stream to video element
// - Error handling with descriptive messages
// ─────────────────────────────────────────────────────────

class WebcamManager {
  constructor() {
    this.stream      = null;
    this.videoEl     = null;
    this.isActive    = false;
    this.onError     = null;
  }

  // ── Attach a video DOM element ────────────────────────
  attach(videoElement) {
    this.videoEl = videoElement;
  }

  // ── Start the webcam stream ───────────────────────────
  async start() {
    if (this.isActive) return { success: true };

    try {
      // Request webcam access with optimal settings for face detection
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width:       { ideal: 640 },
          height:      { ideal: 480 },
          frameRate:   { ideal: 30 },
          facingMode:  'user', // Front camera
        },
        audio: false, // Audio handled separately by VoiceInput
      });

      // Attach stream to video element if provided
      if (this.videoEl) {
        this.videoEl.srcObject = this.stream;
        await this._waitForVideoReady();
      }

      this.isActive = true;
      console.log('📷 Webcam started successfully');
      return { success: true };

    } catch (err) {
      const message = this._parseError(err);
      console.error('📷 Webcam error:', message);
      return { success: false, error: message };
    }
  }

  // ── Stop the webcam stream ────────────────────────────
  stop() {
    if (!this.isActive) return;

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    if (this.videoEl) {
      this.videoEl.srcObject = null;
    }

    this.isActive = false;
    console.log('📷 Webcam stopped');
  }

  // ── Get the current video element ────────────────────
  getVideoElement() {
    return this.videoEl;
  }

  // ── Check if video is ready for processing ───────────
  isVideoReady() {
    return (
      this.videoEl &&
      this.videoEl.readyState >= 2 && // HAVE_CURRENT_DATA
      this.videoEl.videoWidth > 0 &&
      !this.videoEl.paused
    );
  }

  // ── Wait until video metadata is loaded ──────────────
  _waitForVideoReady() {
    return new Promise((resolve) => {
      if (this.videoEl.readyState >= 2) {
        resolve();
        return;
      }
      this.videoEl.addEventListener('loadeddata', resolve, { once: true });
    });
  }

  // ── Parse browser errors into human-readable messages ─
  _parseError(err) {
    switch (err.name) {
      case 'NotAllowedError':
      case 'PermissionDeniedError':
        return 'Camera access denied. Please allow camera access in your browser settings.';
      case 'NotFoundError':
      case 'DevicesNotFoundError':
        return 'No camera found. Please connect a webcam and try again.';
      case 'NotReadableError':
      case 'TrackStartError':
        return 'Camera is already in use by another application.';
      case 'OverconstrainedError':
        return 'Camera does not meet the required specifications.';
      case 'AbortError':
        return 'Camera access was interrupted. Please try again.';
      default:
        return `Camera error: ${err.message}`;
    }
  }
}

// Export as singleton
export const webcamManager = new WebcamManager();
export default WebcamManager;