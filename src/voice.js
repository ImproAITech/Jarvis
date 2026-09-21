// Jarvis Voice Assistant: Speech-to-Text & Text-to-Speech Engine
import { store } from './store.js';

class VoiceEngine {
  constructor() {
    this.recognition = null;
    this.synth = window.speechSynthesis || null;
    this.isListening = false;
    this.isSpeaking = false;
    this.voiceEnabled = store.getSettings().voiceEnabled || false;
    this.selectedVoice = null;

    this.initSpeechRecognition();
    this.initVoices();
  }

  initVoices() {
    if (!this.synth) return;

    const loadVoices = () => {
      const voices = this.synth.getVoices();
      // Look for Mexican Spanish first, then any Spanish voice
      this.selectedVoice = 
        voices.find(v => v.lang === 'es-MX') ||
        voices.find(v => v.lang.startsWith('es-')) ||
        voices.find(v => v.lang.startsWith('es')) ||
        null;
    };

    loadVoices();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = loadVoices;
    }
  }

  initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Reconocimiento de voz no soportado en este navegador.');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'es-MX';
  }

  isRecognitionSupported() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  isSynthesisSupported() {
    return !!window.speechSynthesis;
  }

  toggleVoiceEnabled() {
    this.voiceEnabled = !this.voiceEnabled;
    store.updateSettings({ voiceEnabled: this.voiceEnabled });
    if (!this.voiceEnabled && this.synth) {
      this.synth.cancel();
    }
    return this.voiceEnabled;
  }

  isVoiceEnabled() {
    return this.voiceEnabled;
  }

  // Clean text so Jarvis speaks smoothly without reading markdown or emojis
  cleanTextForSpeech(text) {
    if (!text) return '';
    return text
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}]/gu, '') // Emojis
      .replace(/[*_#`~>[\]()]/g, '') // Markdown symbols
      .replace(/\n+/g, '. ') // Newlines to pauses
      .replace(/\s+/g, ' ')
      .trim();
  }

  speak(text, force = false) {
    if (!this.synth || (!this.voiceEnabled && !force)) return;

    // Cancel ongoing speech
    this.synth.cancel();

    const clean = this.cleanTextForSpeech(text);
    if (!clean) return;

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = 'es-MX';
    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }
    utterance.rate = 1.05; // Slightly brisk, modern assistant pace
    utterance.pitch = 0.98;

    utterance.onstart = () => {
      this.isSpeaking = true;
      document.dispatchEvent(new CustomEvent('jarvis_speaking_start'));
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      document.dispatchEvent(new CustomEvent('jarvis_speaking_end'));
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      document.dispatchEvent(new CustomEvent('jarvis_speaking_end'));
    };

    this.synth.speak(utterance);
  }

  stopSpeaking() {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
      document.dispatchEvent(new CustomEvent('jarvis_speaking_end'));
    }
  }

  listen({ onStart, onResult, onError, onEnd } = {}) {
    if (!this.recognition) {
      if (onError) onError(new Error('Dictado por voz no disponible en este dispositivo.'));
      return;
    }

    if (this.isListening) {
      this.recognition.stop();
      return;
    }

    // Stop speaking while listening to prevent self-triggering
    this.stopSpeaking();

    this.recognition.onstart = () => {
      this.isListening = true;
      if (onStart) onStart();
    };

    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (onResult) onResult(transcript);
    };

    this.recognition.onerror = (event) => {
      this.isListening = false;
      if (onError) onError(event);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (onEnd) onEnd();
    };

    try {
      this.recognition.start();
    } catch (err) {
      console.warn('Error iniciando reconocimiento:', err);
      this.isListening = false;
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }
}

export const voiceEngine = new VoiceEngine();
