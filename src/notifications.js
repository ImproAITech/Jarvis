// Jarvis Notification & Alert Manager
// Handles both in-app (setInterval) and server-push (background) notifications
import { store } from './store.js';

// VAPID public key — matches the private key stored in Vercel env vars
const VAPID_PUBLIC_KEY = 'BPl9N1_g5KBgCsi5UrTlbtqV2CLzSUkaBe70FLl1AuLm0mfxim5hZH0zWPKgm3o1u_cf8zM8gTf2uYvSyeLfLIQ';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

/** Returns (or creates) a stable anonymous user ID stored in localStorage */
function getUserId() {
  let id = localStorage.getItem('jarvis_push_user_id');
  if (!id) {
    id = 'u_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    localStorage.setItem('jarvis_push_user_id', id);
  }
  return id;
}

class NotificationManager {
  constructor() {
    this.notifiedEvents = new Set(this.loadNotifiedEvents());
    this.monitoringInterval = null;
    this.audioCtx = null;
    this.pushSubscription = null; // Web Push subscription object
  }

  // ── Persistence helpers ─────────────────────────────────────────────────────

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

  // ── Basic checks ────────────────────────────────────────────────────────────

  isSupported() {
    return 'Notification' in window;
  }

  getPermission() {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission;
  }

  // ── Permission + Web Push subscription ─────────────────────────────────────

  async requestPermission() {
    if (!this.isSupported()) return false;
    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      store.updateSettings({ notificationsEnabled: granted });
      if (granted) {
        // Subscribe to Web Push so background notifications work
        await this.subscribeToWebPush();
      }
      return granted;
    } catch (err) {
      console.error('Error solicitando permisos de notificación:', err);
      return false;
    }
  }

  /**
   * Subscribes this device to Web Push and registers the subscription with
   * the Jarvis backend so the server can send pushes when the app is closed.
   */
  async subscribeToWebPush() {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Web Push no soportado en este navegador/dispositivo.');
        return null;
      }

      const reg = await navigator.serviceWorker.ready;

      // Check for existing subscription first
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }

      this.pushSubscription = sub;

      // Send subscription to server
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: getUserId(),
          subscription: sub.toJSON(),
        }),
      });

      console.log('[Jarvis] Web Push subscription registrada en el servidor ✅');
      return sub;
    } catch (err) {
      console.error('[Jarvis] Error suscribiendo a Web Push:', err);
      return null;
    }
  }

  /**
   * Schedules a server-side reminder for an event.
   * Called after a new event is created that has reminder_minutes.
   */
  async scheduleServerReminder(event, reminderMinutes) {
    if (!this.pushSubscription && !await this.getExistingPushSubscription()) {
      console.warn('[Jarvis] No hay suscripción push activa, omitiendo recordatorio de servidor.');
      return;
    }

    try {
      const res = await fetch('/api/push/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: getUserId(),
          event: {
            id: event.id,
            title: event.title,
            start: event.start_time,
            location: event.location || '',
          },
          reminderMinutes,
        }),
      });

      const json = await res.json();
      if (json.success) {
        console.log(`[Jarvis] Recordatorio del servidor programado para ${json.scheduledFor} ✅`);
      } else if (json.skipped) {
        console.log('[Jarvis] Recordatorio omitido (ya pasó la hora de notificación).');
      }
    } catch (err) {
      console.error('[Jarvis] Error programando recordatorio en servidor:', err);
    }
  }

  async getExistingPushSubscription() {
    try {
      const reg = await navigator.serviceWorker.ready;
      this.pushSubscription = await reg.pushManager.getSubscription();
      return this.pushSubscription;
    } catch {
      return null;
    }
  }

  // ── Audio alert ─────────────────────────────────────────────────────────────

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

  // ── In-app notification (when the app IS open) ───────────────────────────

  async sendNotification(title, options = {}) {
    this.playAlertSound();

    if ('vibrate' in navigator) {
      navigator.vibrate([150, 80, 150]);
    }

    if (!this.isSupported() || Notification.permission !== 'granted') {
      return false;
    }

    // Attempt via Service Worker first (required for iOS PWA)
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_NOTIFICATION',
        title,
        options
      });
      return true;
    }

    // Fallback: standard web Notification
    try {
      new Notification(title, {
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        ...options
      });
      return true;
    } catch (e) {
      console.warn('Error en notificación directa:', e);
      return false;
    }
  }

  formatReminderText(minutes) {
    if (minutes >= 1440) {
      const days = Math.round(minutes / 1440);
      return days === 1 ? '1 día' : `${days} días`;
    }
    if (minutes >= 60) {
      const hours = Math.round(minutes / 60);
      return hours === 1 ? '1 hora' : `${hours} horas`;
    }
    return `${minutes} minutos`;
  }

  // ── In-app polling monitor (backup while app is open) ───────────────────────

  checkUpcomingEvents() {
    const events = store.getEvents();
    const settings = store.getSettings();
    const defaultRem = settings.defaultReminderMinutes !== undefined
      ? parseInt(settings.defaultReminderMinutes, 10)
      : 15;
    const notifyOnStart = settings.notifyOnStart !== false;
    const now = Date.now();

    events.forEach(evt => {
      const startTime = new Date(evt.start_time).getTime();
      const diffMinutes = Math.round((startTime - now) / 60000);

      const remMin = evt.reminder_minutes !== undefined && evt.reminder_minutes !== null
        ? parseInt(evt.reminder_minutes, 10)
        : defaultRem;

      // Condition 1: Advance reminder
      if (remMin > 0) {
        const keyAdvance = `${evt.id}_rem_${remMin}m`;
        if (diffMinutes <= remMin && diffMinutes >= Math.max(1, remMin - 3) && !this.notifiedEvents.has(keyAdvance)) {
          this.notifiedEvents.add(keyAdvance);
          this.saveNotifiedEvents();

          const label = this.formatReminderText(remMin);
          this.sendNotification(`⏰ Evento en ${label}: ${evt.title}`, {
            body: `Inicia a las ${new Date(evt.start_time).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}${evt.location ? ` en ${evt.location}` : ''}.`,
            tag: keyAdvance,
            requireInteraction: true
          });
        }
      }

      // Condition 2: Starting now
      if ((notifyOnStart || remMin === 0) && remMin !== -1) {
        const keyNow = `${evt.id}_now`;
        if (diffMinutes >= 0 && diffMinutes <= 4 && !this.notifiedEvents.has(keyNow)) {
          this.notifiedEvents.add(keyNow);
          this.saveNotifiedEvents();

          this.sendNotification(`🚨 ¡Comenzando ahora! ${evt.title}`, {
            body: `Tu evento "${evt.title}" está por comenzar.${evt.location ? ` Ubicación: ${evt.location}` : ''}`,
            tag: keyNow,
            requireInteraction: true
          });
        }
      }
    });

    // Monitoreo de eventos programados (mensuales y por días de la semana)
    try {
      const recurring = store.getRecurringEvents();
      const today = new Date();
      const currentDay = today.getDate();
      const currentDayOfWeek = today.getDay();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

      recurring.forEach(evt => {
        let isToday = false;
        if (evt.recurrence_type === 'weekly_days') {
          const days = Array.isArray(evt.days_of_week) ? evt.days_of_week : [];
          isToday = days.includes(currentDayOfWeek);
        } else {
          const effDay = Math.min(evt.day_of_month || 1, daysInMonth);
          isToday = (effDay === currentDay);
        }

        if (!isToday) return;

        const eventDate = new Date(currentYear, currentMonth, currentDay, evt.start_hour, evt.start_minute, 0);
        const startTime = eventDate.getTime();
        const diffMinutes = Math.round((startTime - now) / 60000);

        const remMin = evt.reminder_minutes !== undefined && evt.reminder_minutes !== null
          ? parseInt(evt.reminder_minutes, 10)
          : defaultRem;

        const todayKey = `${currentYear}-${currentMonth + 1}-${currentDay}`;

        if (remMin > 0) {
          const keyAdvance = `rec_${evt.id}_${todayKey}_rem_${remMin}m`;
          if (diffMinutes <= remMin && diffMinutes >= Math.max(1, remMin - 3) && !this.notifiedEvents.has(keyAdvance)) {
            this.notifiedEvents.add(keyAdvance);
            this.saveNotifiedEvents();

            const label = this.formatReminderText(remMin);
            this.sendNotification(`⏰ Evento programado en ${label}: ${evt.title}`, {
              body: `Inicia a las ${eventDate.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}${evt.location ? ` en ${evt.location}` : ''}.`,
              tag: keyAdvance,
              requireInteraction: true
            });
          }
        }

        if ((notifyOnStart || remMin === 0) && remMin !== -1) {
          const keyNow = `rec_${evt.id}_${todayKey}_now`;
          if (diffMinutes >= 0 && diffMinutes <= 4 && !this.notifiedEvents.has(keyNow)) {
            this.notifiedEvents.add(keyNow);
            this.saveNotifiedEvents();

            this.sendNotification(`🚨 ¡Comenzando ahora! ${evt.title}`, {
              body: `Tu evento programado "${evt.title}" está por comenzar.${evt.location ? ` Ubicación: ${evt.location}` : ''}`,
              tag: keyNow,
              requireInteraction: true
            });
          }
        }
      });
    } catch (e) {
      console.warn('Error monitoreando eventos recurrentes:', e);
    }
  }

  startMonitoring() {
    if (this.monitoringInterval) return;
    this.checkUpcomingEvents();
    this.monitoringInterval = setInterval(() => {
      this.checkUpcomingEvents();
    }, 30000);

    // Also ensure we have an active push subscription registered
    if (Notification.permission === 'granted') {
      this.subscribeToWebPush();
    }
  }

  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  // ── Test notification ────────────────────────────────────────────────────────

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
export { getUserId };
