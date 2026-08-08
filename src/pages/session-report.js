// ============================================================
// SESSION REPORT PAGE — Post-session analytics
// ============================================================

import { MODES, PERSONALITIES } from '../utils/constants.js';
import { formatTime, formatDate, getScoreClass, getScoreColor } from '../utils/formatters.js';
import { userStore } from '../stores/user-store.js';
import { progressStore } from '../stores/progress-store.js';

export function renderSessionReport(app, sessionData, onGoHome) {
  const mode = Object.values(MODES).find(m => m.id === sessionData.mode);
  const personality = Object.values(PERSONALITIES).find(p => p.id === sessionData.personality);
  const scores = sessionData.scores;
  const duration = sessionData.getDurationSeconds();
  const stats = {
    wpm: sessionData.wpm,
    fillerCount: sessionData.fillerCount,
    pauseCount: sessionData.pauseCount,
    longestPause: sessionData.longestPause,
    averagePause: sessionData.averagePause,
    userWordCount: sessionData.userWordCount,
    messageCount: sessionData.messages.length,
  };

  // Save to progress
  progressStore.addSession(sessionData.toSummary());
  if (sessionData.corrections.length > 0) {
    progressStore.addMistakes(sessionData.corrections);
  }
  userStore.incrementSession(Math.round(duration / 60));

  const overallScore = Math.round(
    Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length
  );

  app.innerHTML = `
    <nav class="nav-bar">
      <div class="nav-brand">
        <div class="nav-brand-icon">🎙️</div>
        <span>Pocket <span class="text-gradient">Mentor</span></span>
      </div>
      <div class="nav-links">
        <button class="nav-link" id="go-home-btn">← Back to Home</button>
      </div>
    </nav>

    <div class="report-page">
      <!-- Hero -->
      <div class="report-hero fade-in">
        <h1>Session <span class="text-gradient">Complete!</span> 🎉</h1>
        <p class="session-info">
          ${mode?.icon || '🗣️'} ${mode?.name || 'Conversation'} with ${personality?.name || 'AI'} • ${formatTime(duration)}
        </p>
      </div>

      <!-- Overall Score -->
      <div style="text-align: center; margin-bottom: var(--space-8);" class="fade-in" style="animation-delay: 0.1s">
        <div class="radial-progress" style="width: 140px; height: 140px; margin: 0 auto var(--space-4);">
          <svg viewBox="0 0 100 100">
            <circle class="track" cx="50" cy="50" r="42"/>
            <circle class="fill" cx="50" cy="50" r="42"
              stroke="${getScoreColor(overallScore)}"
              stroke-dasharray="${2 * Math.PI * 42}"
              stroke-dashoffset="${2 * Math.PI * 42 * (1 - overallScore / 100)}"
            />
          </svg>
          <div class="value" style="font-size: var(--text-3xl); color: ${getScoreColor(overallScore)}">
            ${overallScore}
          </div>
        </div>
        <p style="color: var(--text-secondary); font-size: var(--text-sm);">Overall Score</p>
      </div>

      <!-- Score Cards Grid -->
      <div class="report-scores-grid">
        ${renderScoreCard('🗣️', 'Fluency', scores.fluency)}
        ${renderScoreCard('💪', 'Confidence', scores.confidence)}
        ${renderScoreCard('📝', 'Grammar', scores.grammar)}
        ${renderScoreCard('📚', 'Vocabulary', scores.vocabulary)}
        ${renderScoreCard('🔊', 'Pronunciation', scores.pronunciation)}
        ${renderScoreCard('🎭', 'Naturalness', scores.naturalness)}
        ${renderScoreCard('👂', 'Listening', scores.listening)}
        ${renderScoreCard('⚡', 'Speed', Math.min(100, Math.round((stats.wpm / 150) * 100)))}
      </div>

      <!-- Speaking Stats -->
      <div class="mistakes-section fade-in" style="animation-delay: 0.5s">
        <h3>📊 Speaking Statistics</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: var(--space-4); margin-top: var(--space-4);">
          ${renderStatItem('Speaking Time', formatTime(duration))}
          ${renderStatItem('Words Spoken', stats.userWordCount)}
          ${renderStatItem('Words/Minute', stats.wpm || '—')}
          ${renderStatItem('Filler Words', stats.fillerCount)}
          ${renderStatItem('Long Pauses', stats.pauseCount)}
          ${renderStatItem('Longest Pause', stats.longestPause ? stats.longestPause + 's' : '—')}
          ${renderStatItem('Avg Pause', stats.averagePause ? stats.averagePause + 's' : '—')}
          ${renderStatItem('Exchanges', stats.messageCount)}
        </div>
      </div>

      <!-- Corrections / Mistakes -->
      ${sessionData.corrections.length > 0 ? `
        <div class="mistakes-section fade-in" style="animation-delay: 0.6s">
          <h3>🔍 Corrections</h3>
          ${sessionData.corrections.map(c => `
            <div class="mistake-item">
              <span class="mistake-type ${c.type}">${c.type}</span>
              <div class="mistake-detail">
                <div class="original">${c.original}</div>
                <div class="suggestion">→ ${c.suggestion}</div>
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <!-- Improvements -->
      <div class="improvements-section fade-in" style="animation-delay: 0.7s">
        <h3 style="margin-bottom: var(--space-4);">💡 Suggestions for Improvement</h3>
        ${getImprovements(scores, stats).map(tip => `
          <div class="improvement-item">${tip}</div>
        `).join('')}
      </div>

      <!-- Transcript -->
      <div class="mistakes-section fade-in" style="animation-delay: 0.8s">
        <h3>📝 Full Transcript</h3>
        <div style="margin-top: var(--space-4); max-height: 400px; overflow-y: auto;">
          ${sessionData.messages.map(msg => `
            <div style="display: flex; gap: var(--space-3); padding: var(--space-2) 0; border-bottom: 1px solid var(--border-subtle);">
              <span style="font-size: var(--text-xs); color: var(--text-muted); min-width: 30px;">${msg.role === 'user' ? '👤' : (personality?.icon || '🤖')}</span>
              <span style="font-size: var(--text-sm); color: ${msg.role === 'user' ? 'var(--text-secondary)' : 'var(--accent-primary-light)'};">${msg.text}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Action Buttons -->
      <div style="display: flex; gap: var(--space-4); justify-content: center; padding: var(--space-8) 0;" class="fade-in" style="animation-delay: 0.9s">
        <button class="btn btn-primary btn-lg" id="practice-again-btn">
          🔄 Practice Again
        </button>
        <button class="btn btn-secondary btn-lg" id="go-dashboard-btn">
          📊 View Dashboard
        </button>
      </div>
    </div>
  `;

  // Event listeners
  document.getElementById('go-home-btn')?.addEventListener('click', onGoHome);
  document.getElementById('practice-again-btn')?.addEventListener('click', onGoHome);
  document.getElementById('go-dashboard-btn')?.addEventListener('click', () => {
    import('./dashboard.js').then(m => m.renderDashboard(app, onGoHome));
  });
}

function renderScoreCard(icon, label, value) {
  const cls = getScoreClass(value);
  const color = getScoreColor(value);
  return `
    <div class="report-score-card">
      <div class="radial-progress" style="width: 80px; height: 80px;">
        <svg viewBox="0 0 100 100">
          <circle class="track" cx="50" cy="50" r="42"/>
          <circle class="fill" cx="50" cy="50" r="42"
            stroke="${color}"
            stroke-dasharray="${2 * Math.PI * 42}"
            stroke-dashoffset="${2 * Math.PI * 42 * (1 - value / 100)}"
          />
        </svg>
        <div class="value" style="font-size: var(--text-lg); color: ${color}">${value}</div>
      </div>
      <div class="score-card-label" style="margin-top: var(--space-2);">${icon} ${label}</div>
    </div>
  `;
}

function renderStatItem(label, value) {
  return `
    <div style="text-align: center; padding: var(--space-3); background: var(--bg-glass); border-radius: var(--radius-md);">
      <div style="font-family: var(--font-mono); font-size: var(--text-lg); font-weight: 700; color: var(--text-primary);">${value}</div>
      <div style="font-size: var(--text-xs); color: var(--text-muted); margin-top: 2px;">${label}</div>
    </div>
  `;
}

function getImprovements(scores, stats) {
  const tips = [];

  if (scores.fluency < 70) {
    tips.push('Practice speaking in longer sentences without pausing. Try reading aloud for 5 minutes daily.');
  }
  if (scores.confidence < 70) {
    tips.push('Your confidence score suggests nervousness. Try the "Casual Friend" mode to build comfort first.');
  }
  if (stats.fillerCount > 5) {
    tips.push(`You used ${stats.fillerCount} filler words. Try replacing "umm" with a brief pause — silence sounds more confident.`);
  }
  if (scores.grammar < 80) {
    tips.push('Focus on verb tenses — pay attention to past tense ("worked on" vs "work on") and present perfect ("I\'ve built" vs "I build").');
  }
  if (scores.vocabulary < 75) {
    tips.push('Expand your vocabulary by using more specific words. Instead of "good", try "excellent", "outstanding", or "impressive".');
  }
  if (stats.wpm && stats.wpm < 100) {
    tips.push('Your speaking speed is a bit slow. Try to speak more continuously — think of it as a flowing stream, not separate drops.');
  }
  if (stats.wpm && stats.wpm > 180) {
    tips.push('You\'re speaking quite fast! Try to slow down slightly — clear communication is more important than speed.');
  }
  if (stats.longestPause > 5) {
    tips.push(`Your longest pause was ${stats.longestPause}s. When you need time to think, try saying "That\'s a great question, let me think about that..."`);
  }

  if (tips.length === 0) {
    tips.push('Great session! Keep practicing regularly to maintain your progress.');
    tips.push('Try increasing the difficulty level to challenge yourself further.');
  }

  return tips;
}
