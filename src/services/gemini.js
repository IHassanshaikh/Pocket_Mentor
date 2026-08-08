// ============================================================
// GEMINI API CLIENT — Conversation engine
// ============================================================

import { LS_KEYS } from '../utils/constants.js';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const MODEL = 'gemini-3.5-flash';

class GeminiService {
  constructor() {
    this.conversationHistory = [];
    this.systemPrompt = '';
    this.apiKey = '';
  }

  /** Initialize with API key */
  init(apiKey) {
    this.apiKey = apiKey || localStorage.getItem(LS_KEYS.API_KEY) || '';
  }

  /** Check if API key is set */
  isReady() {
    return this.apiKey.length > 10;
  }

  /** Set the system prompt for the session */
  setSystemPrompt(prompt) {
    this.systemPrompt = prompt;
    this.conversationHistory = [];
  }

  /** Add a message to history */
  addToHistory(role, text) {
    this.conversationHistory.push({ role, parts: [{ text }] });
    // Keep history manageable (last 40 exchanges)
    if (this.conversationHistory.length > 80) {
      this.conversationHistory = this.conversationHistory.slice(-60);
    }
  }

  /** Send a message and get AI response */
  async sendMessage(userText) {
    if (!this.isReady()) {
      console.warn('API key not configured. Using Demo Mode fallback.');
      
      this.addToHistory('user', userText);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const demoResponses = [
        "That's a great point! I'm currently running in Demo Mode since an API key isn't configured, but your audio and layout seem to be working perfectly.",
        "I hear you loud and clear. As your Pocket Mentor in Demo Mode, I think you're doing a fantastic job testing the interface.",
        "Excellent communication! You can add a Gemini API key in the settings to unlock my full conversational abilities.",
        "I completely agree. This demo voice lets you test the Text-to-Speech system and verify everything runs smoothly on your device."
      ];
      
      const aiText = demoResponses[Math.floor(Math.random() * demoResponses.length)];
      this.addToHistory('model', aiText);
      return aiText;
    }

    this.addToHistory('user', userText);

    const url = `${GEMINI_API_URL}/${MODEL}:generateContent?key=${this.apiKey}`;

    const body = {
      contents: this.conversationHistory,
      systemInstruction: {
        parts: [{ text: this.systemPrompt }],
      },
      generationConfig: {
        temperature: 0.9,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 300,
        candidateCount: 1,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      ],
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      if (aiText) {
        this.addToHistory('model', aiText);
      }

      return aiText;
    } catch (error) {
      console.error('Gemini API error:', error);
      throw error;
    }
  }

  /** Send a message with streaming (returns async generator) */
  async *sendMessageStream(userText) {
    if (!this.isReady()) {
      console.warn('API key not configured. Using Demo Mode fallback.');
      this.addToHistory('user', userText);
      
      const demoResponses = [
        "That's a great point! I'm currently running in Demo Mode since an API key isn't configured, but your audio and layout seem to be working perfectly.",
        "I hear you loud and clear. As your Pocket Mentor in Demo Mode, I think you're doing a fantastic job testing the interface.",
        "Excellent communication! You can add a Gemini API key in the settings to unlock my full conversational abilities.",
        "I completely agree. This demo voice lets you test the Text-to-Speech system and verify everything runs smoothly on your device."
      ];
      
      const aiText = demoResponses[Math.floor(Math.random() * demoResponses.length)];
      
      // Simulate streaming
      const words = aiText.split(' ');
      let fullText = '';
      for (const word of words) {
        await new Promise(resolve => setTimeout(resolve, 150));
        fullText += word + ' ';
        yield word + ' ';
      }
      
      this.addToHistory('model', fullText.trim());
      return;
    }

    this.addToHistory('user', userText);

    const url = `${GEMINI_API_URL}/${MODEL}:streamGenerateContent?alt=sse&key=${this.apiKey}`;

    const body = {
      contents: this.conversationHistory,
      systemInstruction: {
        parts: [{ text: this.systemPrompt }],
      },
      generationConfig: {
        temperature: 0.9,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 300,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      ],
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `API error: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const data = JSON.parse(jsonStr);
            const chunk = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (chunk) {
              fullText += chunk;
              yield chunk;
            }
          } catch { /* skip malformed JSON */ }
        }
      }
    }

    if (fullText) {
      this.addToHistory('model', fullText);
    }
  }

  /** Analyze text for corrections (non-streaming) */
  async analyzeText(prompt) {
    if (!this.isReady()) return null;

    const url = `${GEMINI_API_URL}/${MODEL}:generateContent?key=${this.apiKey}`;
    const body = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 500,
      },
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) return null;

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } catch {
      return null;
    }
  }

  /** Get conversation history as plain text transcript */
  getTranscript() {
    return this.conversationHistory
      .map(msg => `${msg.role === 'user' ? 'You' : 'AI'}: ${msg.parts[0].text}`)
      .join('\n');
  }

  /** Reset conversation */
  reset() {
    this.conversationHistory = [];
  }
}

export const geminiService = new GeminiService();
