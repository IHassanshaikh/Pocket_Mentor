// ============================================================
// SPEECH RECOGNITION — Web Speech API wrapper
// ============================================================

import { FILLER_WORDS } from '../utils/constants.js';

class SpeechRecognitionService {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.onResult = null;
    this.onInterim = null;
    this.onEnd = null;
    this.onError = null;
    this.onSpeechStart = null;
    this.onSpeechEnd = null;

    // Analytics
    this.pauseStartTime = null;
    this.pauses = [];
    this.wordTimestamps = [];
    this.fillerCount = 0;
    this.totalWords = 0;
    this.startTime = null;
  }

  /** Initialize speech recognition */
  init() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error('Speech Recognition not supported');
      return false;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (event) => this._handleResult(event);
    this.recognition.onerror = (event) => this._handleError(event);
    this.recognition.onend = () => this._handleEnd();
    this.recognition.onspeechstart = () => {
      if (this.pauseStartTime) {
        const pauseDuration = (Date.now() - this.pauseStartTime) / 1000;
        if (pauseDuration > 0.5) {
          this.pauses.push(pauseDuration);
        }
        this.pauseStartTime = null;
      }
      this.onSpeechStart?.();
    };
    this.recognition.onspeechend = () => {
      this.pauseStartTime = Date.now();
      this.onSpeechEnd?.();
    };

    return true;
  }

  /** Start listening */
  start() {
    if (!this.recognition) {
      if (!this.init()) return false;
    }

    try {
      this.recognition.start();
      this.isListening = true;
      this.startTime = Date.now();
      this.pauseStartTime = null;
      this.pauses = [];
      this.fillerCount = 0;
      this.totalWords = 0;
      this.wordTimestamps = [];
      return true;
    } catch (err) {
      console.error('Failed to start recognition:', err);
      return false;
    }
  }

  /** Stop listening */
  stop() {
    if (this.recognition && this.isListening) {
      this.isListening = false;
      this.recognition.stop();
    }
  }

  /** Handle recognition result */
  _handleResult(event) {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }

    if (interimTranscript) {
      this.onInterim?.(interimTranscript);
    }

    if (finalTranscript) {
      const trimmed = finalTranscript.trim();
      if (trimmed) {
        // Count words
        const words = trimmed.split(/\s+/).filter(w => w.length > 0);
        this.totalWords += words.length;
        this.wordTimestamps.push({ count: words.length, time: Date.now() });

        // Detect filler words
        const lower = trimmed.toLowerCase();
        for (const filler of FILLER_WORDS) {
          const regex = new RegExp(`\\b${filler}\\b`, 'gi');
          const matches = lower.match(regex);
          if (matches) {
            this.fillerCount += matches.length;
          }
        }

        this.onResult?.(trimmed);
      }
    }
  }

  /** Handle errors */
  _handleError(event) {
    console.warn('Speech recognition error:', event.error);
    if (event.error === 'not-allowed' || event.error === 'audio-capture') {
      this.isListening = false;
      this.onError?.('Microphone access denied or not found. You can use text chat.');
    } else if (event.error === 'no-speech') {
      // Silently restart
      if (this.isListening) {
        this._restart();
      }
    } else {
      this.onError?.(event.error);
    }
  }

  /** Handle end (auto-restart if still listening) */
  _handleEnd() {
    if (this.isListening) {
      this._restart();
    } else {
      this.onEnd?.();
    }
  }

  /** Restart recognition */
  _restart() {
    if (!this.isListening) return;
    setTimeout(() => {
      if (this.isListening && this.recognition) {
        try {
          this.recognition.start();
        } catch (e) {
          // Ignore InvalidStateError (already started)
        }
      }
    }, 250);
  }

  /** Get speaking statistics */
  getStats() {
    const duration = this.startTime ? (Date.now() - this.startTime) / 1000 : 0;
    const avgPause = this.pauses.length > 0
      ? this.pauses.reduce((a, b) => a + b, 0) / this.pauses.length
      : 0;
    const longestPause = this.pauses.length > 0
      ? Math.max(...this.pauses)
      : 0;
    const wpm = duration > 0 ? Math.round((this.totalWords / duration) * 60) : 0;

    return {
      totalWords: this.totalWords,
      fillerCount: this.fillerCount,
      pauseCount: this.pauses.length,
      averagePause: Math.round(avgPause * 10) / 10,
      longestPause: Math.round(longestPause * 10) / 10,
      wpm,
      durationSeconds: Math.round(duration),
      fillerRate: this.totalWords > 0 ? Math.round((this.fillerCount / this.totalWords) * 100) : 0,
    };
  }

  /** Check if speech recognition is supported */
  static isSupported() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }
}

export const speechService = new SpeechRecognitionService();
