// ============================================================
// TEXT-TO-SPEECH SERVICE
// Uses Web Speech API with best available American English voice
// Kokoro TTS can be added as an upgrade path
// ============================================================

class TTSService {
  constructor() {
    this.synth = window.speechSynthesis;
    this.voice = null;
    this.isSpeaking = false;
    this.queue = [];
    this.activeUtterances = []; // Keep references to prevent garbage collection
    this.onStart = null;
    this.onEnd = null;
    this.onWord = null;
    this.rate = 1.05;
    this.pitch = 1.0;
    this.volume = 1.0;
    this._voicesLoaded = false;
  }

  /** Unlock audio context for mobile browsers */
  unlock() {
    if (!this.synth) return;
    try {
      this.synth.cancel(); // Cancel any stuck state
      const silentUtterance = new SpeechSynthesisUtterance('');
      silentUtterance.volume = 0;
      this.synth.speak(silentUtterance);
      console.log('SpeechSynthesis unlocked for mobile');
    } catch (e) {
      console.warn('Silent utterance unlock failed:', e);
    }
  }

  /** Initialize and select best American voice */
  async init() {
    return new Promise((resolve) => {
      const loadVoices = () => {
        const voices = this.synth.getVoices();
        if (voices.length === 0) return;

        this._voicesLoaded = true;

        // Check if there is a saved voice preferred by the user
        const savedVoiceName = localStorage.getItem('pm_tts_voice');
        if (savedVoiceName) {
          const match = voices.find(v => v.name === savedVoiceName);
          if (match) {
            this.voice = match;
            console.log('Selected saved TTS voice:', match.name, match.lang);
            resolve(true);
            return;
          }
        }

        // Priority: Find the most natural American voice possible (Neural/Cloud > Desktop)
        const priorities = [
          // Highest quality: Edge Neural Voices
          v => v.name.includes('GuyNeural') || v.name.includes('ChristopherNeural') || v.name.includes('EricNeural'),
          v => v.name.includes('JennyNeural') || v.name.includes('AriaNeural'),
          // High quality: Google Cloud/Non-local voices
          v => v.name.includes('Google US English') && v.localService === false,
          v => v.name.includes('Google US English'),
          // Better standard voices
          v => v.name.includes('Microsoft Mark'),
          // Any Cloud/Online American English voice
          v => v.lang === 'en-US' && v.localService === false,
          // Any American English male
          v => v.lang === 'en-US' && v.name.toLowerCase().includes('male'),
          // Any American English
          v => v.lang === 'en-US',
          // Fallback to robotic desktop voices
          v => v.name.includes('Microsoft David'),
          // Any English
          v => v.lang.startsWith('en'),
        ];

        for (const test of priorities) {
          const match = voices.find(test);
          if (match) {
            this.voice = match;
            console.log('Selected TTS voice:', match.name, match.lang);
            break;
          }
        }

        if (!this.voice && voices.length > 0) {
          this.voice = voices[0];
        }

        resolve(true);
      };

      // Chrome loads voices asynchronously
      if (this.synth.getVoices().length > 0) {
        loadVoices();
      } else {
        this.synth.onvoiceschanged = loadVoices;
        // Fallback timeout
        setTimeout(() => {
          if (!this._voicesLoaded) loadVoices();
        }, 1000);
      }
    });
  }

  /** Speak text */
  speak(text) {
    if (!text || !this.synth) return;

    // Cancel any current speech
    this.stop();

    this.activeUtterances = [];

    // Split into sentences for more natural delivery
    const sentences = this._splitIntoSentences(text);

    sentences.forEach((sentence, index) => {
      const utterance = new SpeechSynthesisUtterance(sentence);
      if (this.voice) utterance.voice = this.voice;
      utterance.rate = this.rate;
      utterance.pitch = this.pitch;
      utterance.volume = this.volume;
      utterance.lang = 'en-US';

      // Store reference to prevent garbage collection
      this.activeUtterances.push(utterance);

      if (index === 0) {
        utterance.onstart = () => {
          this.isSpeaking = true;
          this.onStart?.();
        };
      }

      if (index === sentences.length - 1) {
        utterance.onend = () => {
          this.isSpeaking = false;
          this.activeUtterances = [];
          this.onEnd?.();
        };
      }

      utterance.onerror = (e) => {
        if (e.error !== 'canceled') {
          console.warn('TTS error:', e.error);
        }
        this.isSpeaking = false;
        this.activeUtterances = [];
        this.onEnd?.();
      };

      utterance.onboundary = (e) => {
        if (e.name === 'word') {
          this.onWord?.(e);
        }
      };

      this.synth.speak(utterance);
    });
  }

  /** Stop speaking */
  stop() {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
      this.activeUtterances = [];
    }
  }

  /** Pause speaking */
  pause() {
    if (this.synth) this.synth.pause();
  }

  /** Resume speaking */
  resume() {
    if (this.synth) this.synth.resume();
  }

  /** Set speaking rate */
  setRate(rate) {
    this.rate = Math.max(0.5, Math.min(2.0, rate));
  }

  /** Split text into natural sentence chunks */
  _splitIntoSentences(text) {
    // Split on sentence-ending punctuation, keeping the punctuation
    const parts = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
    return parts.map(s => s.trim()).filter(s => s.length > 0);
  }

  /** Get available voices for settings */
  getVoices() {
    return this.synth?.getVoices().filter(v => v.lang.startsWith('en')) || [];
  }

  /** Set a specific voice by name */
  setVoice(voiceName) {
    const voices = this.synth?.getVoices() || [];
    const match = voices.find(v => v.name === voiceName);
    if (match) {
      this.voice = match;
      localStorage.setItem('pm_tts_voice', voiceName);
    }
  }

  /** Check if TTS is supported */
  static isSupported() {
    return 'speechSynthesis' in window;
  }
}

export const ttsService = new TTSService();
