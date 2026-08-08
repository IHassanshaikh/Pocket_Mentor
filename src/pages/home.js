// ============================================================
// HOME PAGE — Landing page with mode selection
// ============================================================

import { MODES, PERSONALITIES, DIFFICULTY, AMBIENTS } from '../utils/constants.js';
import { userStore } from '../stores/user-store.js';
import { progressStore } from '../stores/progress-store.js';
import { formatTimeLong } from '../utils/formatters.js';

export function renderHome(app, onStartSession) {
  const profile = userStore.profile;
  const totalMins = progressStore.getTotalMinutes();
  const totalSessions = progressStore.getTotalSessions();
  const streak = progressStore.getStreakDays();
  const avgFluency = progressStore.getAverageScore('fluency', 5);

  const modesArray = Object.values(MODES);
  const personalitiesArray = Object.values(PERSONALITIES);
  const difficultyArray = Object.values(DIFFICULTY);
  const ambientsArray = Object.values(AMBIENTS);

  app.innerHTML = `
    <!-- Nav Bar -->
    <nav class="nav-bar">
      <div class="nav-brand">
        <div class="nav-brand-icon">🎙️</div>
        <span>Pocket <span class="text-gradient">Mentor</span></span>
      </div>
      <div class="nav-links">
        <button class="nav-link active" data-page="home">Home</button>
        <button class="nav-link" data-page="dashboard">Dashboard</button>
        <button class="nav-link" data-page="settings">Settings</button>
      </div>
    </nav>

    <div class="home-page">
      <!-- Hero Section -->
      <section class="hero fade-in">
        <div class="hero-badge">
          <span class="dot"></span>
          <span>Your AI Communication Coach</span>
        </div>
        <h1>Practice English<br/><span class="text-gradient">Like a Native</span></h1>
        <p class="hero-subtitle">
          Have natural conversations with your AI American mentor. 
          No lessons — just real practice that builds real confidence.
        </p>
        <div class="hero-cta">
          <button class="join-meeting-btn" id="quick-start-btn">
            📹 Join Meeting
          </button>
          <button class="btn btn-secondary btn-lg" id="customize-btn">
            ⚙️ Customize Session
          </button>
        </div>
      </section>

      <!-- Stats Row -->
      <section class="stats-row fade-in" style="animation-delay: 0.1s">
        <div class="stat-item">
          <div class="stat-value text-gradient">${totalSessions}</div>
          <div class="stat-label">Sessions</div>
        </div>
        <div class="stat-item">
          <div class="stat-value text-gradient">${totalMins > 60 ? Math.round(totalMins / 60) + 'h' : totalMins + 'm'}</div>
          <div class="stat-label">Practice Time</div>
        </div>
        <div class="stat-item">
          <div class="stat-value text-gradient">${streak}</div>
          <div class="stat-label">Day Streak 🔥</div>
        </div>
        <div class="stat-item">
          <div class="stat-value text-gradient">${avgFluency || '—'}%</div>
          <div class="stat-label">Avg Fluency</div>
        </div>
      </section>

      <!-- Daily Challenge -->
      <section class="daily-challenge fade-in" style="animation-delay: 0.15s">
        <div class="daily-challenge-content">
          <div class="daily-challenge-icon">🎯</div>
          <div class="daily-challenge-info">
            <h3>Today's Challenge</h3>
            <p>${getDailyChallenge()}</p>
          </div>
          <button class="btn btn-primary" id="challenge-btn">Start</button>
        </div>
      </section>

      <!-- Conversation Modes -->
      <section class="fade-in" style="animation-delay: 0.2s">
        <div class="section-header">
          <h2>Choose Your Scenario</h2>
        </div>
        <div class="modes-grid">
          ${modesArray.map(mode => `
            <div class="mode-card" data-mode="${mode.id}">
              <div class="mode-card-content">
                <div class="mode-icon" style="background: ${mode.color}15; color: ${mode.color}">
                  ${mode.icon}
                </div>
                <h3>${mode.name}</h3>
                <p>${mode.description}</p>
                <div class="mode-tags">
                  ${mode.tags.slice(0, 3).map(t => `<span class="mode-tag">${t}</span>`).join('')}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- AI Personalities -->
      <section class="fade-in" style="animation-delay: 0.25s">
        <div class="section-header">
          <h2>Choose Your Mentor</h2>
        </div>
        <div class="personality-grid">
          ${personalitiesArray.map(p => `
            <div class="personality-card ${profile.personality === p.id ? 'selected' : ''}" data-personality="${p.id}">
              <div class="personality-avatar" style="background: ${p.color}20; color: ${p.color}">
                ${p.icon}
              </div>
              <h4>${p.name}</h4>
              <p>${p.role}</p>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- Difficulty -->
      <section class="fade-in" style="animation-delay: 0.3s">
        <div class="section-header">
          <h2>Difficulty Level</h2>
        </div>
        <div class="difficulty-selector">
          ${difficultyArray.map(d => `
            <div class="difficulty-option ${profile.difficulty === d.id ? 'selected' : ''}" data-difficulty="${d.id}">
              <h4>${d.name}</h4>
              <p>${d.description}</p>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- Background Environment -->
      <section class="fade-in" style="animation-delay: 0.35s">
        <div class="section-header">
          <h2>Background Environment</h2>
        </div>
        <div class="ambient-selector">
          ${ambientsArray.map(a => `
            <button class="ambient-option ${profile.ambient === a.id ? 'selected' : ''}" data-ambient="${a.id}">
              ${a.icon} ${a.name}
            </button>
          `).join('')}
        </div>
      </section>
    </div>

    <!-- API Key Modal -->
    <div class="modal-overlay hidden" id="api-key-modal">
      <div class="modal setup-modal">
        <h2>🔑 Setup Your Mentor</h2>
        <p style="color: var(--text-secondary); margin-bottom: var(--space-6); font-size: var(--text-sm);">
          To power the AI conversation, you need a free Gemini API key from Google AI Studio.
        </p>
        <div class="setup-step">
          <label for="api-key-input">Gemini API Key</label>
          <input type="password" id="api-key-input" placeholder="Enter your API key..." value="${userStore.getApiKey()}" />
          <p class="hint">
            Get your free key at <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">aistudio.google.com/apikey</a>
          </p>
        </div>
        <div class="setup-step">
          <label for="user-name-input">Your Name</label>
          <input type="text" id="user-name-input" placeholder="Your name..." value="${profile.name}" />
        </div>
        <div style="display: flex; gap: var(--space-3); justify-content: flex-end; margin-top: var(--space-6);">
          <button class="btn btn-secondary" id="modal-cancel-btn">Cancel</button>
          <button class="btn btn-primary" id="modal-save-btn">Save & Start</button>
        </div>
      </div>
    </div>
  `;

  // --- Event Listeners ---

  // Mode cards
  app.querySelectorAll('.mode-card').forEach(card => {
    card.addEventListener('click', () => {
      app.querySelectorAll('.mode-card').forEach(c => c.style.borderColor = '');
      card.style.borderColor = 'var(--accent-primary)';
      userStore.set('mode', card.dataset.mode);
    });
  });

  // Personality cards
  app.querySelectorAll('.personality-card').forEach(card => {
    card.addEventListener('click', () => {
      app.querySelectorAll('.personality-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      userStore.set('personality', card.dataset.personality);
    });
  });

  // Difficulty options
  app.querySelectorAll('.difficulty-option').forEach(opt => {
    opt.addEventListener('click', () => {
      app.querySelectorAll('.difficulty-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      userStore.set('difficulty', opt.dataset.difficulty);
    });
  });

  // Ambient options
  app.querySelectorAll('.ambient-option').forEach(opt => {
    opt.addEventListener('click', () => {
      app.querySelectorAll('.ambient-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      userStore.set('ambient', opt.dataset.ambient);
    });
  });

  // Quick start button
  document.getElementById('quick-start-btn').addEventListener('click', () => {
    if (!userStore.getApiKey()) {
      document.getElementById('api-key-modal').classList.remove('hidden');
    } else {
      onStartSession();
    }
  });

  // Customize button
  document.getElementById('customize-btn')?.addEventListener('click', () => {
    document.querySelector('.modes-grid')?.scrollIntoView({ behavior: 'smooth' });
  });

  // Challenge button
  document.getElementById('challenge-btn')?.addEventListener('click', () => {
    if (!userStore.getApiKey()) {
      document.getElementById('api-key-modal').classList.remove('hidden');
    } else {
      onStartSession();
    }
  });

  // Modal
  document.getElementById('modal-cancel-btn')?.addEventListener('click', () => {
    document.getElementById('api-key-modal').classList.add('hidden');
  });

  document.getElementById('modal-save-btn')?.addEventListener('click', () => {
    const apiKey = document.getElementById('api-key-input').value.trim();
    const userName = document.getElementById('user-name-input').value.trim();
    if (apiKey) {
      userStore.setApiKey(apiKey);
      if (userName) userStore.set('name', userName);
      userStore.setOnboarded();
      document.getElementById('api-key-modal').classList.add('hidden');
      onStartSession();
    }
  });

  // Nav links
  app.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      const page = link.dataset.page;
      if (page === 'dashboard') {
        import('./dashboard.js').then(m => m.renderDashboard(app, onStartSession));
      } else if (page === 'settings') {
        import('./settings.js').then(m => m.renderSettings(app, onStartSession));
      }
    });
  });
}

function getDailyChallenge() {
  const challenges = [
    'Practice introducing yourself to a new team member in 60 seconds.',
    'Explain your current project to a non-technical client.',
    'Handle a difficult question: "Why should we hire you?"',
    'Negotiate a project deadline with your client.',
    'Small talk: Discuss your weekend plans naturally.',
    'Explain a technical bug to your project manager.',
    'Practice a salary negotiation conversation.',
    'Describe your biggest professional achievement.',
    'Handle an unhappy client who found a bug in production.',
    'Pitch your startup idea to an investor in 2 minutes.',
    'Discuss the pros and cons of a technology choice with your team lead.',
    'Practice disagreeing politely in a meeting.',
    'Explain why a feature will take longer than estimated.',
    'Network at a virtual conference — introduce yourself.',
  ];
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return challenges[dayOfYear % challenges.length];
}
