// ============================================================
// DASHBOARD PAGE — Progress tracking with charts
// ============================================================

import { formatDate, getScoreColor, getScoreClass } from '../utils/formatters.js';
import { progressStore } from '../stores/progress-store.js';
import { userStore } from '../stores/user-store.js';

export function renderDashboard(app, onStartSession) {
  const profile = userStore.profile;
  const totalMins = progressStore.getTotalMinutes();
  const totalSessions = progressStore.getTotalSessions();
  const streak = progressStore.getStreakDays();
  const recentSessions = progressStore.getRecentSessions(10);

  const avgScores = {
    fluency: progressStore.getAverageScore('fluency', 5),
    confidence: progressStore.getAverageScore('confidence', 5),
    grammar: progressStore.getAverageScore('grammar', 5),
    vocabulary: progressStore.getAverageScore('vocabulary', 5),
    pronunciation: progressStore.getAverageScore('pronunciation', 5),
    naturalness: progressStore.getAverageScore('naturalness', 5),
    listening: progressStore.getAverageScore('listening', 5),
  };

  app.innerHTML = `
    <nav class="nav-bar">
      <div class="nav-brand">
        <div class="nav-brand-icon">🎙️</div>
        <span>Pocket <span class="text-gradient">Mentor</span></span>
      </div>
      <div class="nav-links">
        <button class="nav-link" data-page="home">Home</button>
        <button class="nav-link active" data-page="dashboard">Dashboard</button>
        <button class="nav-link" data-page="settings">Settings</button>
      </div>
    </nav>

    <div class="dashboard-page">
      <div class="dashboard-header fade-in">
        <h1>Your <span class="text-gradient">Progress</span></h1>
        <p>Track your communication improvement over time</p>
      </div>

      <!-- Overview Stats -->
      <div class="scores-grid fade-in" style="animation-delay: 0.1s">
        <div class="score-card">
          <div class="score-card-icon">🎯</div>
          <div class="score-card-value text-gradient">${totalSessions}</div>
          <div class="score-card-label">Total Sessions</div>
        </div>
        <div class="score-card">
          <div class="score-card-icon">⏱️</div>
          <div class="score-card-value text-gradient">${totalMins > 60 ? Math.round(totalMins / 60) + 'h' : totalMins + 'm'}</div>
          <div class="score-card-label">Practice Time</div>
        </div>
        <div class="score-card">
          <div class="score-card-icon">🔥</div>
          <div class="score-card-value text-gradient">${streak}</div>
          <div class="score-card-label">Day Streak</div>
        </div>
        <div class="score-card">
          <div class="score-card-icon">📈</div>
          <div class="score-card-value text-gradient">${avgScores.fluency || '—'}%</div>
          <div class="score-card-label">Avg Fluency</div>
        </div>
      </div>

      <!-- Skill Scores -->
      <div class="chart-container fade-in" style="animation-delay: 0.2s">
        <h3>Skill Breakdown (Last 5 Sessions)</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: var(--space-4); margin-top: var(--space-4);">
          ${Object.entries(avgScores).map(([key, value]) => renderSkillBar(key, value)).join('')}
        </div>
      </div>

      <!-- Practice Calendar -->
      <div class="streak-calendar fade-in" style="animation-delay: 0.3s">
        <h3 style="margin-bottom: var(--space-4);">📅 Practice Calendar</h3>
        <div class="streak-grid">
          ${renderCalendar()}
        </div>
        <div style="display: flex; align-items: center; gap: var(--space-3); margin-top: var(--space-3); justify-content: flex-end;">
          <span style="font-size: var(--text-xs); color: var(--text-muted);">Less</span>
          <div class="streak-day" style="width: 12px; height: 12px;"></div>
          <div class="streak-day level-1" style="width: 12px; height: 12px;"></div>
          <div class="streak-day level-2" style="width: 12px; height: 12px;"></div>
          <div class="streak-day level-3" style="width: 12px; height: 12px;"></div>
          <div class="streak-day level-4" style="width: 12px; height: 12px;"></div>
          <span style="font-size: var(--text-xs); color: var(--text-muted);">More</span>
        </div>
      </div>

      <!-- Recent Sessions -->
      <div class="chart-container fade-in" style="animation-delay: 0.4s">
        <h3>Recent Sessions</h3>
        <div style="margin-top: var(--space-4);">
          ${recentSessions.length > 0 ? recentSessions.map(s => renderSessionRow(s)).join('') : `
            <div style="text-align: center; padding: var(--space-8); color: var(--text-muted);">
              <p style="font-size: var(--text-lg); margin-bottom: var(--space-2);">No sessions yet</p>
              <p>Start your first conversation to see your progress!</p>
            </div>
          `}
        </div>
      </div>

      <!-- Action -->
      <div style="text-align: center; padding: var(--space-8) 0;">
        <button class="btn btn-primary btn-lg" id="start-session-btn">
          📹 Start New Session
        </button>
      </div>
    </div>
  `;

  // Event listeners
  document.getElementById('start-session-btn')?.addEventListener('click', onStartSession);

  app.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      const page = link.dataset.page;
      if (page === 'home') {
        import('./home.js').then(m => m.renderHome(app, onStartSession));
      } else if (page === 'settings') {
        import('./settings.js').then(m => m.renderSettings(app, onStartSession));
      }
    });
  });
}

function renderSkillBar(name, value) {
  const color = getScoreColor(value || 0);
  const label = name.charAt(0).toUpperCase() + name.slice(1);
  return `
    <div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
        <span style="font-size: var(--text-sm); color: var(--text-secondary);">${label}</span>
        <span style="font-size: var(--text-sm); font-family: var(--font-mono); font-weight: 600; color: ${color};">${value || '—'}%</span>
      </div>
      <div style="height: 8px; background: var(--bg-glass); border-radius: var(--radius-full); overflow: hidden;">
        <div style="height: 100%; width: ${value || 0}%; background: ${color}; border-radius: var(--radius-full); transition: width 1s var(--ease-default);"></div>
      </div>
    </div>
  `;
}

function renderCalendar() {
  const daily = progressStore.getDailyPractice();
  const cells = [];
  const today = new Date();

  // Show last 7 weeks (49 days)
  for (let i = 48; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const minutes = daily[dateStr] || 0;

    let level = '';
    if (minutes > 0 && minutes <= 10) level = 'level-1';
    else if (minutes > 10 && minutes <= 20) level = 'level-2';
    else if (minutes > 20 && minutes <= 40) level = 'level-3';
    else if (minutes > 40) level = 'level-4';

    cells.push(`<div class="streak-day ${level}" title="${dateStr}: ${minutes}min"></div>`);
  }

  return cells.join('');
}

function renderSessionRow(session) {
  const fluency = session.scores?.fluency || 0;
  const color = getScoreColor(fluency);
  const date = formatDate(session.startTime);
  const duration = Math.round(session.duration / 60);

  return `
    <div style="display: flex; align-items: center; justify-content: space-between; padding: var(--space-3) 0; border-bottom: 1px solid var(--border-subtle);">
      <div>
        <div style="font-size: var(--text-sm); font-weight: 600;">${session.mode || 'Conversation'}</div>
        <div style="font-size: var(--text-xs); color: var(--text-muted);">${date} • ${duration}min</div>
      </div>
      <div style="display: flex; align-items: center; gap: var(--space-3);">
        <div style="text-align: right;">
          <div style="font-family: var(--font-mono); font-weight: 700; color: ${color};">${fluency}%</div>
          <div style="font-size: 10px; color: var(--text-muted);">Fluency</div>
        </div>
      </div>
    </div>
  `;
}
