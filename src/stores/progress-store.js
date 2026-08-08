// ============================================================
// PROGRESS STORE — Historical progress data (localStorage)
// ============================================================

const STORAGE_KEY = 'pm_progress_data';

class ProgressStore {
  constructor() {
    this.data = {
      sessions: [],      // Array of session summaries
      dailyPractice: {}, // { 'YYYY-MM-DD': minutesPracticed }
      vocabularyLog: [],  // Words learned
      mistakeLog: [],     // Common mistakes
    };
    this.load();
  }

  load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        this.data = JSON.parse(saved);
      }
    } catch { /* ignore */ }
  }

  save() {
    try {
      // Keep only last 100 sessions to avoid localStorage limits
      if (this.data.sessions.length > 100) {
        this.data.sessions = this.data.sessions.slice(-100);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch { /* ignore */ }
  }

  addSession(summary) {
    this.data.sessions.push(summary);

    const date = new Date(summary.startTime).toISOString().split('T')[0];
    this.data.dailyPractice[date] = (this.data.dailyPractice[date] || 0) + Math.round(summary.duration / 60);

    this.save();
  }

  addMistakes(mistakes) {
    this.data.mistakeLog.push(...mistakes);
    if (this.data.mistakeLog.length > 200) {
      this.data.mistakeLog = this.data.mistakeLog.slice(-200);
    }
    this.save();
  }

  getSessions() {
    return this.data.sessions;
  }

  getRecentSessions(count = 10) {
    return this.data.sessions.slice(-count).reverse();
  }

  getScoreHistory(metric = 'fluency') {
    return this.data.sessions.map(s => ({
      date: s.startTime,
      value: s.scores?.[metric] || 0,
    }));
  }

  getAverageScore(metric = 'fluency', lastN = 5) {
    const recent = this.data.sessions.slice(-lastN);
    if (recent.length === 0) return 0;
    const sum = recent.reduce((acc, s) => acc + (s.scores?.[metric] || 0), 0);
    return Math.round(sum / recent.length);
  }

  getTotalMinutes() {
    return this.data.sessions.reduce((acc, s) => acc + Math.round(s.duration / 60), 0);
  }

  getTotalSessions() {
    return this.data.sessions.length;
  }

  getStreakDays() {
    const dates = Object.keys(this.data.dailyPractice).sort().reverse();
    if (dates.length === 0) return 0;

    let streak = 0;
    let checkDate = new Date();

    for (let i = 0; i < 365; i++) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (this.data.dailyPractice[dateStr]) {
        streak++;
      } else if (i > 0) {
        break;
      }
      checkDate.setDate(checkDate.getDate() - 1);
    }

    return streak;
  }

  getDailyPractice() {
    return this.data.dailyPractice;
  }

  getCommonMistakes() {
    const counts = {};
    for (const m of this.data.mistakeLog) {
      const key = m.type || 'other';
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }

  clear() {
    this.data = { sessions: [], dailyPractice: {}, vocabularyLog: [], mistakeLog: [] };
    this.save();
  }
}

export const progressStore = new ProgressStore();
