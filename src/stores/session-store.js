// ============================================================
// SESSION STORE — Current session state (in-memory)
// ============================================================

import { generateId } from '../utils/formatters.js';

class SessionStore {
  constructor() {
    this.reset();
  }

  reset() {
    this.id = generateId();
    this.startTime = null;
    this.endTime = null;
    this.mode = 'casual';
    this.personality = 'software_engineer';
    this.difficulty = 'intermediate';
    this.ambient = 'none';

    // Transcript
    this.messages = []; // { role: 'user'|'ai', text, timestamp, corrections? }

    // Metrics (accumulated during session)
    this.userWordCount = 0;
    this.aiWordCount = 0;
    this.fillerCount = 0;
    this.pauseCount = 0;
    this.longestPause = 0;
    this.averagePause = 0;
    this.wpm = 0;
    this.corrections = []; // { original, suggestion, type }

    // Scores (calculated at end)
    this.scores = {
      fluency: 0,
      confidence: 0,
      grammar: 0,
      vocabulary: 0,
      pronunciation: 0,
      naturalness: 0,
      listening: 0,
    };

    // State
    this.isActive = false;
    this.isMuted = false;
    this.isCameraOn = false;
    this.isAiSpeaking = false;
    this.isUserSpeaking = false;
  }

  startSession(config) {
    this.id = generateId();
    this.startTime = Date.now();
    this.mode = config.mode || 'casual';
    this.personality = config.personality || 'software_engineer';
    this.difficulty = config.difficulty || 'intermediate';
    this.ambient = config.ambient || 'none';
    this.isActive = true;
    this.messages = [];
    this.corrections = [];
  }

  addMessage(role, text) {
    this.messages.push({
      role,
      text,
      timestamp: Date.now(),
    });

    if (role === 'user') {
      const words = text.split(/\s+/).filter(w => w.length > 0).length;
      this.userWordCount += words;
    } else {
      const words = text.split(/\s+/).filter(w => w.length > 0).length;
      this.aiWordCount += words;
    }
  }

  addCorrection(correction) {
    this.corrections.push(correction);
  }

  endSession(speechStats) {
    this.endTime = Date.now();
    this.isActive = false;

    if (speechStats) {
      this.fillerCount = speechStats.fillerCount || 0;
      this.pauseCount = speechStats.pauseCount || 0;
      this.longestPause = speechStats.longestPause || 0;
      this.averagePause = speechStats.averagePause || 0;
      this.wpm = speechStats.wpm || 0;
    }

    this._calculateScores();
  }

  _calculateScores() {
    const duration = this.getDurationSeconds();
    const messageCount = this.messages.filter(m => m.role === 'user').length;

    // Handle case where user didn't speak at all
    if (this.userWordCount === 0) {
      this.scores = {
        fluency: 0,
        confidence: 0,
        grammar: 0,
        vocabulary: 0,
        pronunciation: 0,
        naturalness: 0,
        listening: 0,
      };
      return;
    }

    // Fluency: Based on WPM (ideal 120-160), filler rate, pause frequency
    let fluency = 80;
    if (this.wpm > 0) {
      const wpmScore = this.wpm >= 100 && this.wpm <= 170 ? 90 : (this.wpm >= 80 ? 75 : 60);
      const fillerPenalty = Math.min(25, this.fillerCount * 3);
      const pausePenalty = Math.min(20, this.pauseCount * 2);
      fluency = Math.max(20, wpmScore - fillerPenalty - pausePenalty);
    }

    // Confidence: Based on speaking time vs total time, pause patterns
    let confidence = 75;
    if (duration > 0 && messageCount > 0) {
      const speakingRatio = this.userWordCount / Math.max(1, this.userWordCount + this.aiWordCount);
      confidence = Math.min(95, Math.max(30, Math.round(speakingRatio * 150)));
      if (this.longestPause > 8) confidence -= 10;
      if (this.fillerCount > 10) confidence -= 5;
    }

    // Grammar: Based on corrections
    const grammarCorrections = this.corrections.filter(c => c.type === 'grammar').length;
    const grammar = Math.max(30, 95 - grammarCorrections * 8);

    // Vocabulary: Based on word variety and corrections
    const vocabCorrections = this.corrections.filter(c => c.type === 'vocabulary' || c.type === 'phrasing').length;
    const uniqueWords = new Set(
      this.messages
        .filter(m => m.role === 'user')
        .join(' ')
        .toLowerCase()
        .split(/\s+/)
    ).size;
    const vocabulary = Math.max(30, Math.min(95, 70 + Math.min(25, uniqueWords / 5) - vocabCorrections * 5));

    // Naturalness: Combination of all factors
    const naturalness = Math.round((fluency + confidence + grammar + vocabulary) / 4);

    // Listening: Based on response relevance (approximated by response count)
    const listening = Math.min(95, Math.max(50, 70 + messageCount * 2));

    this.scores = {
      fluency: Math.round(fluency),
      confidence: Math.round(confidence),
      grammar: Math.round(grammar),
      vocabulary: Math.round(vocabulary),
      pronunciation: Math.round(Math.max(50, fluency * 0.9)),
      naturalness: Math.round(naturalness),
      listening: Math.round(listening),
    };
  }

  getDurationSeconds() {
    if (!this.startTime) return 0;
    const end = this.endTime || Date.now();
    return Math.round((end - this.startTime) / 1000);
  }

  getTranscript() {
    return this.messages.map(m => `${m.role === 'user' ? 'You' : 'AI'}: ${m.text}`).join('\n');
  }

  toSummary() {
    return {
      id: this.id,
      startTime: this.startTime,
      endTime: this.endTime,
      duration: this.getDurationSeconds(),
      mode: this.mode,
      personality: this.personality,
      difficulty: this.difficulty,
      scores: { ...this.scores },
      messageCount: this.messages.length,
      userWordCount: this.userWordCount,
      fillerCount: this.fillerCount,
      wpm: this.wpm,
      corrections: this.corrections.length,
    };
  }
}

export const sessionStore = new SessionStore();
