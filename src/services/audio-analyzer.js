// ============================================================
// AUDIO ANALYZER — Real-time voice analysis via Web Audio API
// ============================================================

class AudioAnalyzer {
  constructor() {
    this.audioContext = null;
    this.analyserNode = null;
    this.sourceNode = null;
    this.stream = null;
    this.isActive = false;

    // Data arrays
    this.dataArray = null;
    this.frequencyData = null;

    // Metrics
    this.volumeHistory = [];
    this.pitchHistory = [];
    this.silenceStart = null;
    this.isSilent = true;

    // Callbacks
    this.onVolumeChange = null;
    this.onSilenceDetected = null;
    this.onSpeechDetected = null;

    // Config
    this.silenceThreshold = 0.02;
    this.silenceTimeout = 2000; // ms before we report a long pause
    this._animFrameId = null;
  }

  /** Initialize with microphone stream */
  async init() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 2048;
      this.analyserNode.smoothingTimeConstant = 0.8;

      this.sourceNode = this.audioContext.createMediaStreamSource(this.stream);
      this.sourceNode.connect(this.analyserNode);

      const bufferLength = this.analyserNode.frequencyBinCount;
      this.dataArray = new Float32Array(bufferLength);
      this.frequencyData = new Uint8Array(bufferLength);

      this.isActive = true;
      this._analyze();

      return this.stream;
    } catch (err) {
      console.error('Failed to initialize audio:', err);
      throw err;
    }
  }

  /** Main analysis loop */
  _analyze() {
    if (!this.isActive) return;

    this.analyserNode.getFloatTimeDomainData(this.dataArray);
    this.analyserNode.getByteFrequencyData(this.frequencyData);

    // Calculate RMS volume
    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      sum += this.dataArray[i] * this.dataArray[i];
    }
    const rms = Math.sqrt(sum / this.dataArray.length);
    const volume = Math.min(1, rms * 5); // Normalize

    this.volumeHistory.push(volume);
    if (this.volumeHistory.length > 100) this.volumeHistory.shift();

    this.onVolumeChange?.(volume);

    // Silence detection
    if (volume < this.silenceThreshold) {
      if (!this.isSilent) {
        this.isSilent = true;
        this.silenceStart = Date.now();
      } else if (this.silenceStart && Date.now() - this.silenceStart > this.silenceTimeout) {
        this.onSilenceDetected?.(Date.now() - this.silenceStart);
        this.silenceStart = Date.now(); // Reset to avoid spamming
      }
    } else {
      if (this.isSilent) {
        this.isSilent = false;
        this.onSpeechDetected?.();
      }
    }

    // Estimate pitch (simplified autocorrelation)
    const pitch = this._estimatePitch();
    if (pitch > 0) {
      this.pitchHistory.push(pitch);
      if (this.pitchHistory.length > 50) this.pitchHistory.shift();
    }

    this._animFrameId = requestAnimationFrame(() => this._analyze());
  }

  /** Simple pitch estimation using autocorrelation */
  _estimatePitch() {
    const sampleRate = this.audioContext?.sampleRate || 44100;
    const buffer = this.dataArray;
    const SIZE = buffer.length;

    // Check if there's enough signal
    let rms = 0;
    for (let i = 0; i < SIZE; i++) rms += buffer[i] * buffer[i];
    rms = Math.sqrt(rms / SIZE);
    if (rms < 0.01) return -1;

    // Autocorrelation
    let bestOffset = -1;
    let bestCorrelation = 0;
    const minPeriod = Math.floor(sampleRate / 500); // Max 500 Hz
    const maxPeriod = Math.floor(sampleRate / 70);  // Min 70 Hz

    for (let offset = minPeriod; offset < maxPeriod && offset < SIZE; offset++) {
      let correlation = 0;
      for (let i = 0; i < SIZE - offset; i++) {
        correlation += buffer[i] * buffer[i + offset];
      }
      correlation /= (SIZE - offset);

      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestOffset = offset;
      }
    }

    if (bestCorrelation > 0.01 && bestOffset > 0) {
      return sampleRate / bestOffset;
    }
    return -1;
  }

  /** Get waveform data for visualization (normalized 0-1) */
  getWaveformData(barCount = 32) {
    if (!this.frequencyData) return new Array(barCount).fill(0);

    const bars = [];
    const step = Math.floor(this.frequencyData.length / barCount);

    for (let i = 0; i < barCount; i++) {
      let sum = 0;
      for (let j = 0; j < step; j++) {
        sum += this.frequencyData[i * step + j] || 0;
      }
      bars.push(sum / step / 255);
    }

    return bars;
  }

  /** Get current volume (0-1) */
  getVolume() {
    if (this.volumeHistory.length === 0) return 0;
    return this.volumeHistory[this.volumeHistory.length - 1];
  }

  /** Get average pitch */
  getAveragePitch() {
    if (this.pitchHistory.length === 0) return 0;
    return this.pitchHistory.reduce((a, b) => a + b, 0) / this.pitchHistory.length;
  }

  /** Get pitch variance (monotone detection) */
  getPitchVariance() {
    if (this.pitchHistory.length < 5) return 0;
    const avg = this.getAveragePitch();
    const variance = this.pitchHistory.reduce((sum, p) => sum + Math.pow(p - avg, 2), 0) / this.pitchHistory.length;
    return Math.sqrt(variance);
  }

  /** Get the audio stream for recording */
  getStream() {
    return this.stream;
  }

  /** Stop analysis */
  stop() {
    this.isActive = false;
    if (this._animFrameId) {
      cancelAnimationFrame(this._animFrameId);
    }
    if (this.sourceNode) this.sourceNode.disconnect();
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
    }
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
    }
  }
}

export const audioAnalyzer = new AudioAnalyzer();
