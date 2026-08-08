// ============================================================
// USER STORE — User profile and preferences (localStorage)
// ============================================================

import { LS_KEYS } from '../utils/constants.js';

const defaultProfile = {
  name: 'Hassan',
  profession: 'Software Developer',
  nativeLanguage: 'Urdu',
  difficulty: 'intermediate',
  personality: 'software_engineer',
  mode: 'casual',
  ambient: 'none',
  captionsEnabled: true,
  metricsEnabled: true,
  transcriptOpen: true,
  totalSessions: 0,
  totalMinutes: 0,
  streak: 0,
  lastSessionDate: null,
};

class UserStore {
  constructor() {
    this.profile = { ...defaultProfile };
    this.load();
  }

  load() {
    try {
      const saved = localStorage.getItem(LS_KEYS.USER_PROFILE);
      if (saved) {
        this.profile = { ...defaultProfile, ...JSON.parse(saved) };
      }
    } catch {
      this.profile = { ...defaultProfile };
    }
  }

  save() {
    try {
      localStorage.setItem(LS_KEYS.USER_PROFILE, JSON.stringify(this.profile));
    } catch { /* ignore */ }
  }

  get(key) {
    return this.profile[key];
  }

  set(key, value) {
    this.profile[key] = value;
    this.save();
  }

  update(updates) {
    Object.assign(this.profile, updates);
    this.save();
  }

  isOnboarded() {
    return localStorage.getItem(LS_KEYS.ONBOARDED) === 'true';
  }

  setOnboarded() {
    localStorage.setItem(LS_KEYS.ONBOARDED, 'true');
  }

  getApiKey() {
    return localStorage.getItem(LS_KEYS.API_KEY) || '';
  }

  setApiKey(key) {
    localStorage.setItem(LS_KEYS.API_KEY, key);
  }

  incrementSession(durationMinutes) {
    this.profile.totalSessions++;
    this.profile.totalMinutes += durationMinutes;

    const today = new Date().toDateString();
    if (this.profile.lastSessionDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      if (this.profile.lastSessionDate === yesterday) {
        this.profile.streak++;
      } else {
        this.profile.streak = 1;
      }
      this.profile.lastSessionDate = today;
    }

    this.save();
  }
}

export const userStore = new UserStore();
