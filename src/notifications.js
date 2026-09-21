// Jarvis Notification & Alert Manager
import { store } from './store.js';

class NotificationManager {
  constructor() {
    this.notifiedEvents = new Set(this.loadNotifiedEvents());
    this.monitoringInterval = null;
    this.audioCtx = null;
  }

  loadNotifiedEvents() {
    try {
      return JSON.parse(localStorage.getItem('jarvis_notified_events') || '[]');
    } catch {
      return [];
    }
  }

  saveNotifiedEvents() {
    try {
      localStorage.setItem('jarvis_notified_events', JSON.stringify([...this.notifiedEvents].slice(-50)));
    } catch (e) {
      console.warn('Error guardando historial de notificaciones:', e);
    }
  }

  isSupported() {
    return 'Notification' in window;
  }

  getPermission() {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission;
  }

  async requestPermission() {
    if (!this.isSupported()) {
      return false;
    }
    try {
      const permission = await Notification.requestPermission();
      store.updateSettings({ notificationsEnabled: permission === 'granted' });
      return permission === 'granted';
    } catch (err) {
      console.error('Error solicitando permisos de notificación:', err);
      return false;
    }
  }

  // Play pleasant sci-fi chime for alerts
  playAlertSound() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      if (!this.audioCtx) {
        this.audioCtx = new AudioContext();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;
      const osc1 = this.audioCtx.createOscillator();
      const osc2 = this.audioCtx.createOscillator();
      const gainNode = this.audioCtx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';

      // Chime note frequencies (C6 and E6)
      osc1.frequency.setValueAtTime(1046.50, now);
      osc1.frequency.exponentialRampToValueAtTime(1318.51, now + 0.12);

      osc2.frequency.setValueAtTime(523.25, now);
      osc2.frequency.exponentialRampToValueAtTime(659.25, now + 0.12);

      gainNode.gain.setValueAtTime(0.2, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(this.audioCtx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.6);
      osc2.stop(now + 0.6);
    } catch (e) {
      console.log('Audio chime info:', e);
    }
  }

  async sendNotification(title, options = {}) {
    this.playAlertSound();

    if ('vibrate' in navigator) {
      navigator.vibrate([150, 80, 150]);
    }

    if (!this.isSupported() || Notification.permission !== 'granted') {
      return false;
    }

    // Attempt via Service Worker first (essential for iOS PWA)
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_NOTIFICATION',
        title,
        options
      });
      return true;
    }

    // Fallback standard web Notification
    try {
      new Notification(title, {
        icon: '/icon.svg',
        badge: '/icon.svg',
        ...options
      });
      return true;
    } catch (e) {
      console.warn('Error en notificación directa:', e);
      return false;
    }
  }

  // Check upcoming events within 15 minutes or starting now
  checkUpcomingEvents() {
    const events = store.getEvents();
    const now = Date.now();

    events.forEach(evt => {
      const startTime = new Date(evt.start_time).getTime();
      const diffMinutes = Math.round((startTime - now) / 60000);

      // Condition 1: 15 minutes before (between 10 and 16 minutes)
      const key15 = `${evt.id}_15min`;
      if (diffMinutes >= 10 && diffMinutes <= 16 && !this.notifiedEvents.has(key15)) {
        this.notifiedEvents.add(key15);
        this.saveNotifiedEvents();

        this.sendNotification(`⏰ Evento en 15 minutos: ${evt.title}`, {
          body: `Inicia a las ${new Date(evt.start_time).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}${evt.location ? ` en ${evt.location}` : ''}.`,
          tag: key15,
          requireInteraction: true
        });
      }

      // Condition 2: Starting now (between 0 and 5 minutes)
      const keyNow = `${evt.id}_now`;
      if (diffMinutes >= 0 && diffMinutes <= 5 && !this.notifiedEvents.has(keyNow)) {
        this.notifiedEvents.add(keyNow);
        this.saveNotifiedEvents();

        this.sendNotification(`🚨 ¡Comenzando ahora! ${evt.title}`, {
          body: `Tu evento "${evt.title}" está por comenzar.${evt.location ? ` Ubicación: ${evt.location}` : ''}`,
          tag: keyNow,
          requireInteraction: true
        });
      }
    });
  }

  startMonitoring() {
    if (this.monitoringInterval) return;
    this.checkUpcomingEvents();
    this.monitoringInterval = setInterval(() => {
      this.checkUpcomingEvents();
    }, 30000); // check every 30 seconds
  }

  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  async sendTestNotification() {
    const perm = this.getPermission();
    if (perm !== 'granted') {
      const granted = await this.requestPermission();
      if (!granted) {
        return { success: false, message: 'Permiso de notificaciones no concedido.' };
      }
    }

    const title = 'Jarvis: Alerta de Evento de Prueba ⏰';
    const body = 'Tu reunión "Revisión de Estrategia" comienza en 15 minutos en Google Meet.';
    await this.sendNotification(title, { body });

    return { success: true, message: 'Notificación de prueba enviada exitosamente.' };
  }
}

export const notificationManager = new NotificationManager();
