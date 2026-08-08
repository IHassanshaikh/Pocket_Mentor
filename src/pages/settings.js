// ============================================================
// SETTINGS PAGE
// ============================================================

import { userStore } from '../stores/user-store.js';
import { progressStore } from '../stores/progress-store.js';
import { ttsService } from '../services/tts.js';

export function renderSettings(app, onStartSession) {
  const profile = userStore.profile;
  const apiKey = userStore.getApiKey();

  app.innerHTML = `
    <nav class="nav-bar">
      <div class="nav-brand">
        <div class="nav-brand-icon">🎙️</div>
        <span>Pocket <span class="text-gradient">Mentor</span></span>
      </div>
      <div class="nav-links">
        <button class="nav-link" data-page="home">Home</button>
        <button class="nav-link" data-page="dashboard">Dashboard</button>
        <button class="nav-link active" data-page="settings">Settings</button>
      </div>
    </nav>

    <div class="settings-page">
      <h1 style="font-size: var(--text-3xl); font-weight: 800; margin-bottom: var(--space-8);">
        ⚙️ <span class="text-gradient">Settings</span>
      </h1>

      <!-- Profile -->
      <div class="settings-section fade-in">
        <h3>👤 Profile</h3>
        <div class="setting-row">
          <label>Your Name</label>
          <input type="text" id="setting-name" value="${profile.name}" style="width: 200px;" />
        </div>
        <div class="setting-row">
          <label>Profession</label>
          <input type="text" id="setting-profession" value="${profile.profession}" style="width: 200px;" />
        </div>
        <div class="setting-row">
          <label>Native Language</label>
          <input type="text" id="setting-language" value="${profile.nativeLanguage}" style="width: 200px;" />
        </div>
      </div>

      <!-- API Keys -->
      <div class="settings-section fade-in" style="animation-delay: 0.1s">
        <h3>🔑 API Configuration</h3>
        <div class="setting-row">
          <label>Gemini API Key</label>
          <div style="display: flex; gap: var(--space-2); align-items: center;">
            <input type="password" id="setting-api-key" value="${apiKey}" placeholder="Enter API key..." style="width: 280px;" />
            <span style="font-size: var(--text-xs); color: ${apiKey ? 'var(--accent-success-light)' : 'var(--accent-warning-light)'};">
              ${apiKey ? '✓ Set' : '⚠ Required'}
            </span>
          </div>
        </div>
        <p style="font-size: var(--text-xs); color: var(--text-muted); margin-top: var(--space-2);">
          Get your free key at <a href="https://aistudio.google.com/apikey" target="_blank">aistudio.google.com/apikey</a>.
          Your key is stored locally and never shared.
        </p>
      </div>

      <!-- Voice Settings -->
      <div class="settings-section fade-in" style="animation-delay: 0.2s">
        <h3>🔊 Voice Settings</h3>
        <div class="setting-row">
          <label>Speaking Speed</label>
          <div style="display: flex; align-items: center; gap: var(--space-3);">
            <input type="range" id="setting-rate" min="0.5" max="1.5" step="0.1" value="1.0" style="width: 120px;" />
            <span id="rate-value" style="font-family: var(--font-mono); font-size: var(--text-sm);">1.0x</span>
          </div>
        </div>
        <div class="setting-row">
          <label>Test Voice</label>
          <button class="btn btn-secondary" id="test-voice-btn">🔊 Play Sample</button>
        </div>
      </div>

      <!-- Display Settings -->
      <div class="settings-section fade-in" style="animation-delay: 0.3s">
        <h3>🖥️ Display</h3>
        <div class="setting-row">
          <label>Show Live Captions</label>
          <div class="toggle ${profile.captionsEnabled ? 'active' : ''}" id="toggle-captions"></div>
        </div>
        <div class="setting-row">
          <label>Show Metrics Panel</label>
          <div class="toggle ${profile.metricsEnabled ? 'active' : ''}" id="toggle-metrics"></div>
        </div>
        <div class="setting-row">
          <label>Open Transcript by Default</label>
          <div class="toggle ${profile.transcriptOpen ? 'active' : ''}" id="toggle-transcript"></div>
        </div>
      </div>

      <!-- Data -->
      <div class="settings-section fade-in" style="animation-delay: 0.4s">
        <h3>💾 Data</h3>
        <div class="setting-row">
          <label>Total Sessions: ${progressStore.getTotalSessions()}</label>
        </div>
        <div class="setting-row">
          <label>Total Practice Time: ${progressStore.getTotalMinutes()} minutes</label>
        </div>
        <div style="display: flex; gap: var(--space-3); margin-top: var(--space-4);">
          <button class="btn btn-secondary" id="export-data-btn">📤 Export Data</button>
          <button class="btn btn-danger" id="clear-data-btn">🗑️ Clear All Data</button>
        </div>
      </div>

      <!-- Save Button -->
      <div style="display: flex; justify-content: center; padding: var(--space-6) 0;">
        <button class="btn btn-primary btn-lg" id="save-settings-btn">💾 Save Settings</button>
      </div>
    </div>
  `;

  // Event listeners
  document.getElementById('setting-rate')?.addEventListener('input', (e) => {
    document.getElementById('rate-value').textContent = e.target.value + 'x';
  });

  document.getElementById('test-voice-btn')?.addEventListener('click', async () => {
    await ttsService.init();
    const rate = parseFloat(document.getElementById('setting-rate').value);
    ttsService.setRate(rate);
    ttsService.speak("Hey there! This is how I'll sound during our conversation. Pretty natural, right?");
  });

  // Toggle switches
  ['captions', 'metrics', 'transcript'].forEach(key => {
    document.getElementById(`toggle-${key}`)?.addEventListener('click', (e) => {
      e.target.classList.toggle('active');
    });
  });

  document.getElementById('save-settings-btn')?.addEventListener('click', () => {
    const name = document.getElementById('setting-name').value.trim();
    const profession = document.getElementById('setting-profession').value.trim();
    const language = document.getElementById('setting-language').value.trim();
    const apiKey = document.getElementById('setting-api-key').value.trim();

    if (name) userStore.set('name', name);
    if (profession) userStore.set('profession', profession);
    if (language) userStore.set('nativeLanguage', language);
    if (apiKey) userStore.setApiKey(apiKey);

    userStore.set('captionsEnabled', document.getElementById('toggle-captions')?.classList.contains('active'));
    userStore.set('metricsEnabled', document.getElementById('toggle-metrics')?.classList.contains('active'));
    userStore.set('transcriptOpen', document.getElementById('toggle-transcript')?.classList.contains('active'));

    // Show success feedback
    const btn = document.getElementById('save-settings-btn');
    btn.textContent = '✅ Saved!';
    btn.style.background = 'var(--accent-success)';
    setTimeout(() => {
      btn.textContent = '💾 Save Settings';
      btn.style.background = '';
    }, 2000);
  });

  document.getElementById('export-data-btn')?.addEventListener('click', () => {
    const data = {
      profile: userStore.profile,
      progress: progressStore.data,
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pocket-mentor-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById('clear-data-btn')?.addEventListener('click', () => {
    if (confirm('Are you sure? This will delete all your progress data.')) {
      progressStore.clear();
      renderSettings(app, onStartSession);
    }
  });

  // Nav links
  app.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      const page = link.dataset.page;
      if (page === 'home') {
        import('./home.js').then(m => m.renderHome(app, onStartSession));
      } else if (page === 'dashboard') {
        import('./dashboard.js').then(m => m.renderDashboard(app, onStartSession));
      }
    });
  });
}
