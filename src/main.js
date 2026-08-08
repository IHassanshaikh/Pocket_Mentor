// ============================================================
// POCKET MENTOR — Main Application Entry Point
// ============================================================

import './styles/index.css';
import './styles/video-call.css';
import './styles/home.css';
import './styles/dashboard.css';

import { renderHome } from './pages/home.js';
import { renderVideoCall } from './pages/video-call.js';
import { renderSessionReport } from './pages/session-report.js';
import { userStore } from './stores/user-store.js';
import { speechService } from './services/speech-recognition.js';
import { ttsService } from './services/tts.js';

// ============================================================
// APP ROUTER
// ============================================================

const app = document.getElementById('app');

function navigateHome() {
  renderHome(app, startSession);
}

function startSession() {
  renderVideoCall(app, endSession);
}

function endSession(sessionData) {
  renderSessionReport(app, sessionData, navigateHome);
}

// ============================================================
// INITIALIZATION
// ============================================================

function init() {
  // Check browser support
  if (!speechService.constructor.isSupported()) {
    app.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 2rem; text-align: center;">
        <div style="font-size: 4rem; margin-bottom: 1.5rem;">🎙️</div>
        <h1 style="font-size: 1.5rem; font-weight: 800; margin-bottom: 1rem;">
          Browser Not Supported
        </h1>
        <p style="color: var(--text-secondary); max-width: 400px; margin-bottom: 2rem;">
          Pocket Mentor requires Speech Recognition which is best supported in 
          <strong>Google Chrome</strong>. Please switch to Chrome for the full experience.
        </p>
        <a href="https://www.google.com/chrome/" target="_blank" class="btn btn-primary btn-lg">
          Download Chrome
        </a>
      </div>
    `;
    return;
  }

  // Start at home page
  navigateHome();
}

// Start the app
init();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  speechService.stop();
  ttsService.stop();
});
