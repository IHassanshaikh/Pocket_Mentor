// ============================================================
// VIDEO CALL PAGE — The main conversation experience
// ============================================================

import { MODES, PERSONALITIES } from '../utils/constants.js';
import { formatTime, countWords } from '../utils/formatters.js';
import { buildSystemPrompt, getInitialGreeting } from '../utils/prompts.js';
import { geminiService } from '../services/gemini.js';
import { speechService } from '../services/speech-recognition.js';
import { ttsService } from '../services/tts.js';
import { audioAnalyzer } from '../services/audio-analyzer.js';
import { sessionStore } from '../stores/session-store.js';
import { userStore } from '../stores/user-store.js';

let timerInterval = null;
let waveformInterval = null;
let metricsInterval = null;
let isProcessing = false;

export function renderVideoCall(app, onEndCall) {
  const profile = userStore.profile;
  const mode = Object.values(MODES).find(m => m.id === profile.mode) || MODES.CASUAL;
  const personality = Object.values(PERSONALITIES).find(p => p.id === profile.personality) || PERSONALITIES.SOFTWARE_ENGINEER;

  app.innerHTML = `
    <div class="video-call-page" id="video-call-page">
      <!-- Connecting Overlay -->
      <div class="connecting-overlay" id="connecting-overlay">
        <div class="connecting-spinner"></div>
        <div class="connecting-text">Connecting to ${personality.name}...</div>
      </div>

      <!-- Top Bar -->
      <div class="call-top-bar">
        <div class="call-info">
          <div class="call-status">
            <div class="status-dot" id="status-dot"></div>
          </div>
          <span class="call-info-name">${personality.name} — ${personality.role}</span>
          <span class="call-info-mode">${mode.icon} ${mode.name}</span>
        </div>
        <div style="display: flex; align-items: center; gap: var(--space-4);">
          <span class="meeting-timer" id="meeting-timer">00:00</span>
          <div class="call-top-actions">
            <button class="top-action-btn" id="captions-toggle-btn" title="Toggle captions">
              CC
            </button>
            <button class="top-action-btn" id="metrics-toggle-btn" title="Toggle metrics">
              📊
            </button>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="call-content">
        <!-- Video Area -->
        <div class="call-video-area">
          <!-- Metrics Panel -->
          <div class="metrics-panel" id="metrics-panel">
            <div class="metric-card">
              <div class="metric-label">Words/Min</div>
              <div class="metric-value" id="metric-wpm">—</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Fillers</div>
              <div class="metric-value" id="metric-fillers">0</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Pauses</div>
              <div class="metric-value" id="metric-pauses">0</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Confidence</div>
              <div class="metric-value" id="metric-confidence">—</div>
            </div>
          </div>

          <!-- AI Video -->
          <div class="ai-video-container">
            <div class="ai-video-bg"></div>
            <div class="ai-avatar-area">
              <div class="ai-avatar" id="ai-avatar">
                <div class="ai-avatar-ring"></div>
                ${personality.icon}
              </div>
              <div class="waveform-container" id="waveform">
                ${Array(24).fill('').map(() => '<div class="waveform-bar"></div>').join('')}
              </div>
              <div class="ai-name-tag">
                <h2>${personality.name}</h2>
                <p>${personality.role}</p>
              </div>
            </div>
            <div class="ai-speaking-indicator" id="ai-speaking-indicator">
              <div class="speaking-dots"><span></span><span></span><span></span></div>
              <span>${personality.name.split(' ')[0]} is speaking...</span>
            </div>
          </div>

          <!-- Captions Overlay -->
          <div class="captions-overlay" id="captions-overlay">
            <div class="captions-text" id="captions-text" style="display:none;"></div>
          </div>

          <!-- Live Suggestions -->
          <div class="live-suggestions" id="live-suggestions" style="display:none;">
            <div class="suggestion-popup">
              <div class="suggestion-label">💡 Suggestion</div>
              <div class="suggestion-text" id="suggestion-text"></div>
            </div>
          </div>

          <!-- Self Video PIP -->
          <div class="self-video-pip" id="self-pip">
            <div class="pip-no-video" id="pip-no-video">
              <div class="pip-avatar">👤</div>
            </div>
            <video id="self-video" autoplay muted playsinline style="display:none;"></video>
            <div class="pip-label">${profile.name}</div>
            <div class="pip-mic-indicator" id="pip-mic">🎤</div>
          </div>
        </div>

        <!-- Transcript Panel -->
        <div class="transcript-panel ${profile.transcriptOpen ? '' : 'collapsed'}" id="transcript-panel">
          <div class="transcript-header">
            <h3>
              📝 Transcript
              <span class="live-badge">LIVE</span>
            </h3>
            <button class="top-action-btn" id="close-transcript-btn">✕</button>
          </div>
          <div class="transcript-messages" id="transcript-messages">
            <!-- Messages will be added here -->
          </div>
        </div>
      </div>

      <!-- Controls Bar -->
      <div class="call-controls-bar">
        <button class="control-btn control-btn-bg" id="mic-btn" title="Toggle Microphone">
          🎤
          <span class="tooltip">Mute</span>
        </button>
        <button class="control-btn control-btn-bg" id="camera-btn" title="Toggle Camera">
          📷
          <span class="tooltip">Camera</span>
        </button>
        <div class="controls-divider"></div>
        <button class="control-btn control-btn-bg" id="transcript-btn" title="Toggle Transcript">
          📝
          <span class="tooltip">Transcript</span>
        </button>
        <div class="controls-divider"></div>
        <button class="control-btn control-btn-end" id="end-call-btn" title="End Call">
          📞
          <span class="tooltip">End Call</span>
        </button>
      </div>
    </div>
  `;

  // Initialize and start the session
  initSession(personality, mode, profile, onEndCall);
}

async function initSession(personality, mode, profile, onEndCall) {
  // Initialize session store
  sessionStore.startSession({
    mode: profile.mode,
    personality: profile.personality,
    difficulty: profile.difficulty,
    ambient: profile.ambient,
  });

  // Initialize Gemini
  geminiService.init(userStore.getApiKey());
  const systemPrompt = buildSystemPrompt({
    mode: profile.mode,
    personality: profile.personality,
    difficulty: profile.difficulty,
    userProfile: profile,
    memories: [],
  });
  geminiService.setSystemPrompt(systemPrompt);

  // Initialize TTS
  await ttsService.init();

  // Initialize Audio Analyzer & get mic access
  try {
    const stream = await audioAnalyzer.init();

    // Set up silence detection callback
    audioAnalyzer.onSilenceDetected = (duration) => {
      if (duration > 5000 && !isProcessing && !ttsService.isSpeaking) {
        showSuggestion('Take your time! Try starting with "I think..." or "In my experience..."');
      }
    };
  } catch (err) {
    console.error('Mic access failed:', err);
    showToast('Could not access microphone. Please allow mic access.', 'error');
  }

  // Initialize Speech Recognition
  if (!speechService.init()) {
    showToast('Speech recognition not supported. Please use Chrome.', 'error');
    return;
  }

  speechService.onResult = (text) => handleUserSpeech(text);
  speechService.onInterim = (text) => showInterimText(text);
  speechService.onSpeechStart = () => {
    sessionStore.isUserSpeaking = true;
    document.getElementById('pip-mic')?.classList.add('speaking');
  };
  speechService.onSpeechEnd = () => {
    sessionStore.isUserSpeaking = false;
    document.getElementById('pip-mic')?.classList.remove('speaking');
  };

  // TTS callbacks
  ttsService.onStart = () => {
    sessionStore.isAiSpeaking = true;
    document.getElementById('ai-avatar')?.classList.add('speaking');
    document.getElementById('ai-speaking-indicator')?.classList.add('visible');
    document.getElementById('waveform')?.classList.add('active');
    // Pause listening while AI speaks
    speechService.stop();
  };

  ttsService.onEnd = () => {
    sessionStore.isAiSpeaking = false;
    document.getElementById('ai-avatar')?.classList.remove('speaking');
    document.getElementById('ai-speaking-indicator')?.classList.remove('visible');
    document.getElementById('waveform')?.classList.remove('active');
    // Resume listening
    if (sessionStore.isActive && !sessionStore.isMuted) {
      speechService.start();
    }
  };

  // Set up controls
  setupControls(onEndCall);

  // Start timer
  startTimer();

  // Start waveform animation
  startWaveformAnimation();

  // Start metrics updates
  startMetricsUpdates();

  // Simulate connection delay, then start
  setTimeout(async () => {
    document.getElementById('connecting-overlay')?.remove();

    // Get and speak initial greeting
    const greeting = getInitialGreeting({
      mode: profile.mode,
      personality: profile.personality,
      userName: profile.name,
    });

    addTranscriptMessage('ai', greeting);
    sessionStore.addMessage('ai', greeting);
    showCaptions(greeting);
    ttsService.speak(greeting);
  }, 1500);
}

function setupControls(onEndCall) {
  // Mic button
  document.getElementById('mic-btn')?.addEventListener('click', () => {
    sessionStore.isMuted = !sessionStore.isMuted;
    const btn = document.getElementById('mic-btn');
    if (sessionStore.isMuted) {
      speechService.stop();
      btn.classList.add('active');
      btn.querySelector('.tooltip').textContent = 'Unmute';
      btn.innerHTML = '🔇<span class="tooltip">Unmute</span>';
    } else {
      speechService.start();
      btn.classList.remove('active');
      btn.querySelector('.tooltip').textContent = 'Mute';
      btn.innerHTML = '🎤<span class="tooltip">Mute</span>';
    }
  });

  // Camera button
  document.getElementById('camera-btn')?.addEventListener('click', async () => {
    sessionStore.isCameraOn = !sessionStore.isCameraOn;
    const btn = document.getElementById('camera-btn');
    const video = document.getElementById('self-video');
    const noVideo = document.getElementById('pip-no-video');

    if (sessionStore.isCameraOn) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        video.style.display = 'block';
        noVideo.style.display = 'none';
        btn.classList.remove('active');
      } catch {
        showToast('Could not access camera', 'warning');
        sessionStore.isCameraOn = false;
      }
    } else {
      if (video.srcObject) {
        video.srcObject.getTracks().forEach(t => t.stop());
        video.srcObject = null;
      }
      video.style.display = 'none';
      noVideo.style.display = 'flex';
      btn.classList.add('active');
    }
  });

  // Transcript toggle
  document.getElementById('transcript-btn')?.addEventListener('click', () => {
    document.getElementById('transcript-panel')?.classList.toggle('collapsed');
  });

  document.getElementById('close-transcript-btn')?.addEventListener('click', () => {
    document.getElementById('transcript-panel')?.classList.add('collapsed');
  });

  // Captions toggle
  document.getElementById('captions-toggle-btn')?.addEventListener('click', () => {
    const overlay = document.getElementById('captions-overlay');
    overlay.style.display = overlay.style.display === 'none' ? 'block' : 'none';
  });

  // Metrics toggle
  document.getElementById('metrics-toggle-btn')?.addEventListener('click', () => {
    const panel = document.getElementById('metrics-panel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  });

  // End call
  document.getElementById('end-call-btn')?.addEventListener('click', () => {
    endSession(onEndCall);
  });
}

async function handleUserSpeech(text) {
  if (isProcessing || !text.trim() || ttsService.isSpeaking) return;

  isProcessing = true;

  // Add to transcript
  addTranscriptMessage('user', text);
  sessionStore.addMessage('user', text);
  clearInterimText();

  try {
    // Get AI response
    const response = await geminiService.sendMessage(text);

    if (response && sessionStore.isActive) {
      addTranscriptMessage('ai', response);
      sessionStore.addMessage('ai', response);
      showCaptions(response);
      ttsService.speak(response);
    }
  } catch (err) {
    console.error('AI response error:', err);
    showToast('Connection issue. Trying again...', 'warning');
  }

  isProcessing = false;
}

function addTranscriptMessage(role, text) {
  const container = document.getElementById('transcript-messages');
  if (!container) return;

  const personality = Object.values(PERSONALITIES).find(p => p.id === userStore.get('personality'));
  const isAI = role === 'ai';
  const name = isAI ? (personality?.name?.split(' ')[0] || 'AI') : userStore.get('name');
  const icon = isAI ? (personality?.icon || '🤖') : '👤';
  const time = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  const msgEl = document.createElement('div');
  msgEl.className = 'transcript-msg';
  msgEl.innerHTML = `
    <div class="transcript-msg-avatar ${role}">${icon}</div>
    <div class="transcript-msg-content">
      <div class="transcript-msg-name">${name}</div>
      <div class="transcript-msg-text">${highlightFillers(text)}</div>
      <div class="transcript-msg-time">${time}</div>
    </div>
  `;

  container.appendChild(msgEl);
  container.scrollTop = container.scrollHeight;
}

function highlightFillers(text) {
  const fillers = ['umm', 'um', 'uh', 'uhh', 'you know', 'like', 'basically', 'actually'];
  let result = text;
  for (const filler of fillers) {
    const regex = new RegExp(`\\b(${filler})\\b`, 'gi');
    result = result.replace(regex, '<span class="filler">$1</span>');
  }
  return result;
}

function showInterimText(text) {
  let interim = document.getElementById('interim-text');
  if (!interim) {
    const container = document.getElementById('transcript-messages');
    if (!container) return;
    interim = document.createElement('div');
    interim.id = 'interim-text';
    interim.className = 'transcript-msg interim';
    interim.innerHTML = `
      <div class="transcript-msg-avatar user">👤</div>
      <div class="transcript-msg-content">
        <div class="transcript-msg-name">${userStore.get('name')}</div>
        <div class="transcript-msg-text"></div>
      </div>
    `;
    container.appendChild(interim);
  }
  interim.querySelector('.transcript-msg-text').textContent = text;
  const container = document.getElementById('transcript-messages');
  if (container) container.scrollTop = container.scrollHeight;
}

function clearInterimText() {
  document.getElementById('interim-text')?.remove();
}

function showCaptions(text) {
  const el = document.getElementById('captions-text');
  if (el) {
    el.textContent = text;
    el.style.display = 'inline-block';
    // Hide after AI finishes speaking
    setTimeout(() => { el.style.display = 'none'; }, Math.max(3000, text.length * 60));
  }
}

function showSuggestion(text) {
  const el = document.getElementById('live-suggestions');
  const textEl = document.getElementById('suggestion-text');
  if (el && textEl) {
    textEl.innerHTML = text;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 6000);
  }
}

function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function startTimer() {
  const timerEl = document.getElementById('meeting-timer');
  timerInterval = setInterval(() => {
    if (timerEl && sessionStore.isActive) {
      timerEl.textContent = formatTime(sessionStore.getDurationSeconds());
    }
  }, 1000);
}

function startWaveformAnimation() {
  const bars = document.querySelectorAll('#waveform .waveform-bar');
  waveformInterval = setInterval(() => {
    if (ttsService.isSpeaking) {
      bars.forEach(bar => {
        const h = Math.random() * 35 + 4;
        bar.style.height = `${h}px`;
        bar.style.background = `hsl(${230 + Math.random() * 30}, 80%, ${60 + Math.random() * 20}%)`;
      });
    } else {
      bars.forEach(bar => {
        bar.style.height = '4px';
      });
    }
  }, 100);
}

function startMetricsUpdates() {
  metricsInterval = setInterval(() => {
    if (!sessionStore.isActive) return;

    const stats = speechService.getStats();
    const wpmEl = document.getElementById('metric-wpm');
    const fillersEl = document.getElementById('metric-fillers');
    const pausesEl = document.getElementById('metric-pauses');
    const confEl = document.getElementById('metric-confidence');

    if (wpmEl) {
      const wpm = stats.wpm;
      wpmEl.textContent = wpm || '—';
      wpmEl.className = 'metric-value' + (wpm >= 100 && wpm <= 170 ? ' good' : wpm > 0 ? ' warning' : '');
    }
    if (fillersEl) {
      fillersEl.textContent = stats.fillerCount;
      fillersEl.className = 'metric-value' + (stats.fillerCount > 5 ? ' poor' : stats.fillerCount > 2 ? ' warning' : ' good');
    }
    if (pausesEl) {
      pausesEl.textContent = stats.pauseCount;
    }
    if (confEl) {
      const vol = audioAnalyzer.getVolume();
      const conf = vol > 0.05 ? 'High' : vol > 0.02 ? 'Med' : 'Low';
      confEl.textContent = conf;
      confEl.className = 'metric-value' + (vol > 0.05 ? ' good' : vol > 0.02 ? '' : ' warning');
    }
  }, 2000);
}

function endSession(onEndCall) {
  // Stop all services
  speechService.stop();
  ttsService.stop();
  audioAnalyzer.stop();
  clearInterval(timerInterval);
  clearInterval(waveformInterval);
  clearInterval(metricsInterval);

  // Stop camera
  const video = document.getElementById('self-video');
  if (video?.srcObject) {
    video.srcObject.getTracks().forEach(t => t.stop());
  }

  // End session with stats
  const stats = speechService.getStats();
  sessionStore.endSession(stats);

  // Call the end callback (navigates to report)
  onEndCall(sessionStore);
}
