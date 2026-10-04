import './style.css';
import { store, EXPENSE_CATEGORIES } from './store.js';
import { sendMessageToJarvis, testGeminiApiKey } from './ai.js';
import { calendarTools, financeTools, formatCurrency, formatDateTime, parseToLocalDate } from './tools.js';
import { voiceEngine } from './voice.js';
import { notificationManager } from './notifications.js';

// SVG Icons helper with explicit sizing for iOS Safari
const ICONS = {
  chat: `<svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>`,
  calendar: `<svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>`,
  wallet: `<svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>`,
  settings: `<svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`,
  send: `<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>`,
  plus: `<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>`,
  trash: `<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>`,
  check: `<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>`,
  clock: `<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
  pin: `<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`,
  mic: `<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>`,
  speaker: `<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/></svg>`,
  speakerMute: `<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/><path stroke-linecap="round" stroke-linejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"/></svg>`,
  bell: `<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>`
};

class JarvisApp {
  constructor() {
    this.currentTab = 'chat';
    this.selectedCalendarDate = new Date();
    this.isGenerating = false;
    this.initDOM();
    this.bindEvents();
    this.renderAll();

    // Start event notification monitoring
    notificationManager.startMonitoring();

    // Listen for speaking state changes to animate logo
    document.addEventListener('jarvis_speaking_start', () => {
      document.querySelector('.brand-logo-wrap')?.classList.add('speaking');
    });
    document.addEventListener('jarvis_speaking_end', () => {
      document.querySelector('.brand-logo-wrap')?.classList.remove('speaking');
    });

    // Subscribe to store updates
    store.subscribe((topic) => {
      if (topic === 'chat' || topic === 'chat_cleared') {
        this.renderChatMessages();
      }
      if (topic === 'calendar' || topic === 'reset') {
        this.renderCalendar();
      }
      if (topic === 'finance' || topic === 'budgets' || topic === 'reset') {
        this.renderFinances();
      }
      if (topic === 'settings' || topic === 'reset') {
        this.renderSettings();
      }
    });

    // ── iOS Shortcut / Widget deep-link handler (URL params) ────────────────
    // Reads ?msg=... and/or ?tab=... when opened via Safari/URL
    this._handleDeepLink();

    // ── iOS Shortcut clipboard handler ───────────────────────────────────────
    // When opened via "Abrir app" in Shortcuts, reads clipboard for [JARVIS]: prefix
    setTimeout(() => this._checkClipboardForMessage(), 700);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        setTimeout(() => this._checkClipboardForMessage(), 300);
      }
    });
  }

  showToast(message) {
    const toast = document.getElementById('toastNotice');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  initDOM() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="ambient-glow"></div>
      <div id="toastNotice" class="toast-notice"></div>

      <!-- iOS Header -->
      <header class="app-header">
        <div class="brand-section">
          <div class="brand-logo-wrap">
            <img src="/icon.svg" alt="Jarvis Logo" class="brand-logo-img" />
            <div class="brand-pulse-dot"></div>
          </div>
          <div class="brand-info">
            <div class="brand-title">
              Jarvis <span class="badge-ai">AI CORE</span>
            </div>
            <div class="brand-status" id="brandStatus">En línea • iPhone</div>
          </div>
        </div>
        <div class="header-actions">
          <button class="icon-btn ${voiceEngine.isVoiceEnabled() ? 'active-voice' : ''}" id="btnToggleVoice" title="Activar/Desactivar Voz de Jarvis">
            ${voiceEngine.isVoiceEnabled() ? ICONS.speaker : ICONS.speakerMute}
          </button>
          <button class="icon-btn" id="btnQuickMic" title="Entrada de voz">
            ${ICONS.mic}
          </button>
        </div>
      </header>

      <!-- Main Views -->
      <main class="main-content">
        <!-- 1. CHAT TAB -->
        <section class="tab-panel chat-panel active" id="tab-chat">
          <div class="chat-messages-container" id="chatMessages"></div>

          <!-- Quick prompts bar -->
          <div class="quick-prompts-bar">
            <button class="chip" data-prompt="Gasté 150 pesos en tacos">🌮 Gasté $150 en tacos</button>
            <button class="chip" data-prompt="Cargué 400 de gasolina">⛽ $400 gasolina</button>
            <button class="chip" data-prompt="¿Cuál es mi balance de este mes?">📊 Balance del mes</button>
            <button class="chip" data-prompt="Agendar reunión con el equipo mañana a las 10am">📅 Agendar reunión</button>
            <button class="chip" data-prompt="¿Qué tengo programado para hoy?">📋 ¿Qué tengo hoy?</button>
          </div>

          <!-- Chat Input Bar -->
          <form class="chat-input-bar" id="chatForm">
            <div class="voice-listening-bar" id="voiceListeningBar">
              <div class="listening-text">
                <span>🎙️ Escuchando... Di algo como "Gasté 120 pesos"</span>
              </div>
              <div class="voice-wave">
                <div class="wave-bar"></div>
                <div class="wave-bar"></div>
                <div class="wave-bar"></div>
                <div class="wave-bar"></div>
                <div class="wave-bar"></div>
              </div>
            </div>
            <div class="chat-input-wrapper">
              <input 
                type="text" 
                id="chatInput" 
                class="chat-input" 
                placeholder="Escribe o habla con Jarvis..." 
                autocomplete="off" 
              />
              <button type="button" class="icon-btn-inner" id="btnChatMic" title="Hablar con Jarvis">
                ${ICONS.mic}
              </button>
            </div>
            <button type="submit" class="btn-send" id="btnSendChat">
              ${ICONS.send}
            </button>
          </form>
        </section>

        <!-- 2. CALENDAR TAB -->
        <section class="tab-panel" id="tab-calendar">
          <div class="calendar-view-header">
            <div>
              <h2 class="section-title">Agenda</h2>
              <p class="section-subtitle">Eventos y recordatorios sincronizados</p>
            </div>
            <button class="icon-btn" id="btnOpenAddEvent" title="Nuevo evento" style="background: rgba(0, 240, 255, 0.15); color: var(--accent-cyan);">
              ${ICONS.plus}
            </button>
          </div>

          <!-- Date pills selector -->
          <div class="date-selector-strip" id="calendarDateStrip"></div>

          <!-- Events Timeline -->
          <div class="events-timeline" id="eventsTimeline"></div>
        </section>

        <!-- 3. FINANCE TAB -->
        <section class="tab-panel" id="tab-finance">
          <div class="calendar-view-header">
            <div>
              <h2 class="section-title">Finanzas</h2>
              <p class="section-subtitle">Control de gastos e ingresos en MXN</p>
            </div>
            <button class="icon-btn" id="btnOpenAddTx" title="Registrar movimiento" style="background: rgba(16, 185, 129, 0.15); color: var(--accent-emerald);">
              ${ICONS.plus}
            </button>
          </div>

          <!-- Hero Balance Card -->
          <div class="balance-hero-card" id="balanceCard"></div>

          <!-- Category Breakdown -->
          <div class="breakdown-card" id="categoryBreakdownCard"></div>

          <!-- Budget Limits Section -->
          <h3 class="settings-group-title" style="margin-top: 8px;">Límites de Presupuesto</h3>
          <div class="breakdown-card" id="budgetLimitsCard"></div>

          <!-- Transactions List -->
          <h3 class="settings-group-title" style="margin-top: 8px;">Movimientos Recientes</h3>
          <div class="transactions-list" id="transactionsList"></div>
        </section>

        <!-- 4. SETTINGS TAB -->
        <section class="tab-panel" id="tab-settings">
          <div class="calendar-view-header">
            <div>
              <h2 class="section-title">Ajustes</h2>
              <p class="section-subtitle">Configuración y estado del sistema</p>
            </div>
          </div>

          <!-- AI Configuration -->
          <div class="settings-group">
            <div class="settings-group-title">Motor de Inteligencia Artificial</div>
            <div class="settings-card">
              <div>
                <label class="field-label">Proveedor de IA</label>
                <select class="custom-select" id="settingProvider">
                  <option value="gemini">Google Gemini API (Recomendado - Gratis)</option>
                  <option value="openai">OpenAI API (ChatGPT)</option>
                  <option value="local">Asistente Local (Modo sin API Key)</option>
                </select>
              </div>

              <div id="geminiKeyGroup">
                <label class="field-label">
                  <span>Gemini API Key</span>
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" style="color: var(--accent-cyan); font-size: 11px; text-decoration: none;">Obtener Key Gratis ↗</a>
                </label>
                <div style="position:relative; margin-bottom: 6px;">
                  <input type="text" class="custom-input" id="settingGeminiKey" placeholder="AIzaSy..." autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false" style="width:100%; padding-right: 44px; font-family: monospace; font-size: 12px; letter-spacing: 0.5px;" />
                  <button type="button" id="btnToggleKeyVis" title="Mostrar/ocultar key" style="position:absolute; right:8px; top:50%; transform:translateY(-50%); background:none; border:none; color:var(--text-secondary); cursor:pointer; font-size:16px; padding:4px;">👁️</button>
                </div>
                <div style="display: flex; gap: 8px; margin-bottom: 6px;">
                  <button type="button" class="btn-secondary" id="btnTestGeminiKey" style="flex:1; font-size: 12px; white-space: nowrap;">
                    ⚡ Probar Conexión
                  </button>
                  <button type="button" class="btn-primary" id="btnSaveGeminiKeyNow" style="flex:1; font-size: 12px; white-space: nowrap;">
                    💾 Guardar Key
                  </button>
                </div>
                <div id="geminiKeyStatus" style="font-size: 12px; margin-bottom: 4px; min-height: 16px;"></div>
                <span class="field-helper">Solo se guarda localmente en tu iPhone. Nunca sale de tu dispositivo.</span>
              </div>

              <div id="geminiModelGroup">
                <label class="field-label">Modelo Gemini</label>
                <select class="custom-select" id="settingGeminiModel">
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash (Recomendado)</option>
                  <option value="gemini-2.5-pro">Gemini 2.5 Pro (Máximo razonamiento)</option>
                  <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite (Ultra rápido)</option>
                </select>
              </div>

              <div id="openaiKeyGroup" style="display: none;">
                <label class="field-label">
                  <span>OpenAI API Key</span>
                  <a href="https://platform.openai.com/api-keys" target="_blank" style="color: var(--accent-cyan); font-size: 11px; text-decoration: none;">Crear Key ↗</a>
                </label>
                <input type="text" class="custom-input" id="settingOpenaiKey" placeholder="sk-..." autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false" style="font-family: monospace; font-size: 12px;" />
              </div>

              <button class="btn-primary" id="btnSaveApiSettings">Guardar Configuración de IA</button>
            </div>
          </div>

          <!-- Preferences -->
          <div class="settings-group">
            <div class="settings-group-title">Preferencias de Usuario</div>
            <div class="settings-card">
              <div>
                <label class="field-label">Divisa Principal</label>
                <select class="custom-select" id="settingCurrency">
                  <option value="MXN">Pesos Mexicanos (MXN $)</option>
                  <option value="USD">Dólares Americanos (USD $)</option>
                  <option value="EUR">Euros (EUR €)</option>
                </select>
              </div>
              <div>
                <label class="field-label">Tu Nombre</label>
                <input type="text" class="custom-input" id="settingUserName" placeholder="Tu nombre" />
              </div>
            </div>
          </div>

          <!-- Notifications & Event Alerts -->
          <div class="settings-group">
            <div class="settings-group-title">Notificaciones y Alertas de Eventos</div>
            <div class="settings-card">
              <div>
                <label class="field-label">
                  <span>Recordatorios de Calendario</span>
                  <span id="notifStatusBadge" style="font-size: 11px; padding: 2px 8px; border-radius: 6px; background: rgba(0, 240, 255, 0.15); color: var(--accent-cyan);">
                    ${notificationManager.getPermission() === 'granted' ? 'Activadas ✓' : 'Pendiente'}
                  </span>
                </label>
                <p class="field-helper" style="margin-top: 4px;">
                  Jarvis te notificará con sonido y vibración con el tiempo de anticipación que tú elijas.
                </p>
              </div>

              <div>
                <label class="field-label">Anticipación de Aviso Predeterminada</label>
                <select class="custom-select" id="settingDefaultReminder">
                  <option value="5">5 minutos antes</option>
                  <option value="10">10 minutos antes</option>
                  <option value="15">15 minutos antes (Predeterminado)</option>
                  <option value="30">30 minutos antes</option>
                  <option value="60">1 hora antes (60 min)</option>
                  <option value="120">2 horas antes (120 min)</option>
                  <option value="1440">1 día antes (24 hrs)</option>
                  <option value="0">Al momento del evento</option>
                  <option value="-1">Sin recordatorio previo</option>
                </select>
                <span class="field-helper">Se usará como valor por defecto para nuevos eventos salvo que indiques otro tiempo al agendar.</span>
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0;">
                <div>
                  <div style="font-size: 13px; font-weight: 600;">Avisar también al comenzar</div>
                  <div class="field-helper">Sonar también justo a la hora de inicio del evento.</div>
                </div>
                <input type="checkbox" id="settingNotifyOnStart" style="width: 20px; height: 20px; accent-color: var(--accent-cyan); cursor: pointer;" checked />
              </div>

              <div style="display: flex; gap: 8px; margin-top: 4px;">
                <button type="button" class="btn-primary" id="btnEnableNotifications" style="flex: 1; padding: 10px 12px; font-size: 13px;">
                  ${notificationManager.getPermission() === 'granted' ? 'Permiso Concedido ✓' : 'Activar Alertas'}
                </button>
                <button type="button" class="btn-secondary" id="btnTestNotification" style="flex: 1; padding: 10px 12px; font-size: 13px;">
                  Probar Alerta Ahora 🔔
                </button>
              </div>
            </div>
          </div>

          <!-- Voice Assistant Preferences -->
          <div class="settings-group">
            <div class="settings-group-title">Asistente de Voz (Jarvis Habla)</div>
            <div class="settings-card">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-size: 14px; font-weight: 600;">Respuestas habladas</div>
                  <div class="field-helper">Jarvis leerá sus respuestas en voz alta en español.</div>
                </div>
                <button type="button" class="icon-btn ${voiceEngine.isVoiceEnabled() ? 'active-voice' : ''}" id="btnSettingVoiceToggle">
                  ${voiceEngine.isVoiceEnabled() ? ICONS.speaker : ICONS.speakerMute}
                </button>
              </div>
            </div>
          </div>

          <!-- iPhone PWA Installation Guide -->
          <div class="settings-group">
            <div class="settings-group-title">Instalar en tu iPhone</div>
            <div class="install-card">
              <div style="font-weight: 700; font-size: 14px; color: #FFFFFF;">¿Cómo tener Jarvis como app nativa?</div>
              <div class="install-step">
                <div class="install-step-num">1</div>
                <div>Abre esta dirección web desde <strong>Safari</strong> en tu iPhone.</div>
              </div>
              <div class="install-step">
                <div class="install-step-num">2</div>
                <div>Toca el botón <strong>Compartir</strong> en la barra inferior (icono de cuadro con flecha hacia arriba ⎋).</div>
              </div>
              <div class="install-step">
                <div class="install-step-num">3</div>
                <div>Desliza y selecciona <strong>"Agregar a pantalla de inicio"</strong> ⊞.</div>
              </div>
              <div class="install-step">
                <div class="install-step-num">4</div>
                <div>¡Listo! Ábrela desde tu pantalla de inicio con vista completa sin barra de navegación.</div>
              </div>
            </div>
          </div>

          <!-- Widget / Shortcut de iOS -->
          <div class="settings-group">
            <div class="settings-group-title">⚡ Acceso Rápido al Chat (Shortcut de iOS)</div>
            <div class="install-card" style="border-color: rgba(0,240,255,0.25);">
              <div style="font-weight: 700; font-size: 14px; color: #FFFFFF; margin-bottom: 2px;">Escríbele a Jarvis desde la pantalla de inicio</div>
              <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 10px;">Crea un Atajo de Apple que pide tu mensaje y abre la app de Jarvis directo al chat.</div>
              <div class="install-step">
                <div class="install-step-num">1</div>
                <div>Abre la app <strong>Atajos</strong> en tu iPhone y toca <strong>+</strong>. Nómbralo <strong>"Jarvis Chat"</strong>.</div>
              </div>
              <div class="install-step">
                <div class="install-step-num">2</div>
                <div>Agrega acción <strong>"Solicitar texto"</strong> → Pregunta: <em>"¿Qué le digo a Jarvis?"</em></div>
              </div>
              <div class="install-step">
                <div class="install-step-num">3</div>
                <div>Agrega acción <strong>"Texto"</strong> → escribe <code style="color:var(--accent-cyan);">[JARVIS]:</code> y luego inserta la variable <em>"Entrada proporcionada"</em>.</div>
              </div>
              <div class="install-step">
                <div class="install-step-num">4</div>
                <div>Agrega acción <strong>"Copiar al portapapeles"</strong> → usa el <em>Texto</em> del paso anterior.</div>
              </div>
              <div class="install-step">
                <div class="install-step-num">5</div>
                <div>Agrega acción <strong>"Abrir app"</strong> → selecciona <strong>Jarvis</strong> de tus apps instaladas. <em>(¡No uses "Abrir URL"!)</em></div>
              </div>
              <div class="install-step">
                <div class="install-step-num">6</div>
                <div>Toca <strong>Listo</strong>. Mantén presionado el atajo → <strong>"Agregar a pantalla de inicio"</strong>.</div>
              </div>
              <div style="margin-top: 10px; padding: 8px 10px; background: rgba(0,240,255,0.08); border-radius: 8px; font-size: 11px; color: var(--text-secondary); line-height: 1.5;">
                ⚠️ La primera vez que ejecutes el atajo, iOS pedirá permiso para <strong>leer el portapapeles</strong>. Toca <strong>"Permitir"</strong> para que Jarvis reciba tu mensaje automáticamente.
              </div>
            </div>
          </div>

          <!-- Data Management -->
          <div class="settings-group">
            <div class="settings-group-title">Gestión de Datos</div>
            <div class="settings-card">
              <button class="btn-secondary" id="btnClearChat">Limpiar Historial de Chat</button>
              <button class="btn-secondary" id="btnResetData" style="color: var(--accent-rose);">Restablecer Todo a Datos de Fábrica</button>
            </div>
          </div>
        </section>
      </main>

      <!-- iOS Bottom Tab Bar -->
      <nav class="tab-bar">
        <button class="tab-btn active" data-tab="chat">
          ${ICONS.chat}
          <span>Jarvis</span>
        </button>
        <button class="tab-btn" data-tab="calendar">
          ${ICONS.calendar}
          <span>Agenda</span>
        </button>
        <button class="tab-btn" data-tab="finance">
          ${ICONS.wallet}
          <span>Finanzas</span>
        </button>
        <button class="tab-btn" data-tab="settings">
          ${ICONS.settings}
          <span>Ajustes</span>
        </button>
      </nav>

      <!-- MODAL: Add Event -->
      <div class="modal-backdrop" id="modalAddEvent">
        <div class="modal-sheet">
          <div class="sheet-handle"></div>
          <div class="modal-header">
            <h3 style="font-size: 17px; font-weight: 700;">Nuevo Evento</h3>
            <button class="icon-btn" id="btnCloseAddEvent">${ICONS.plus}</button>
          </div>
          <form id="formAddEvent" style="display: flex; flex-direction: column; gap: 12px;">
            <div>
              <label class="field-label" style="margin-bottom: 4px;">Título del Evento</label>
              <input type="text" id="eventTitle" class="custom-input" placeholder="Ej. Cita Dentista, Reunión..." required />
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <div>
                <label class="field-label" style="margin-bottom: 4px;">Inicio</label>
                <input type="datetime-local" id="eventStart" class="custom-input" required />
              </div>
              <div>
                <label class="field-label" style="margin-bottom: 4px;">Fin</label>
                <input type="datetime-local" id="eventEnd" class="custom-input" required />
              </div>
            </div>
            <div>
              <label class="field-label" style="margin-bottom: 4px;">Ubicación (opcional)</label>
              <input type="text" id="eventLocation" class="custom-input" placeholder="Ej. Google Meet, Consultorio 4..." />
            </div>
            <div>
              <label class="field-label" style="margin-bottom: 4px;">Recordatorio / Alerta</label>
              <select class="custom-select" id="eventReminder">
                <option value="default">Usar predeterminado de Ajustes</option>
                <option value="5">5 minutos antes</option>
                <option value="10">10 minutos antes</option>
                <option value="15">15 minutos antes</option>
                <option value="30">30 minutos antes</option>
                <option value="60">1 hora antes</option>
                <option value="120">2 horas antes</option>
                <option value="1440">1 día antes</option>
                <option value="0">Al comenzar el evento</option>
                <option value="-1">Sin recordatorio</option>
              </select>
            </div>
            <button type="submit" class="btn-primary" style="margin-top: 6px;">Crear Evento</button>
          </form>
        </div>
      </div>

      <!-- MODAL: Add Transaction -->
      <div class="modal-backdrop" id="modalAddTx">
        <div class="modal-sheet">
          <div class="sheet-handle"></div>
          <div class="modal-header">
            <h3 style="font-size: 17px; font-weight: 700;">Registrar Movimiento</h3>
            <button class="icon-btn" id="btnCloseAddTx">${ICONS.plus}</button>
          </div>
          <form id="formAddTx" style="display: flex; flex-direction: column; gap: 12px;">
            <div>
              <label class="field-label" style="margin-bottom: 4px;">Tipo de Movimiento</label>
              <select class="custom-select" id="txType">
                <option value="expense">🔴 Gasto</option>
                <option value="income">🟢 Ingreso</option>
              </select>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 10px;">
              <div>
                <label class="field-label" style="margin-bottom: 4px;">Monto ($)</label>
                <input type="number" step="0.50" id="txAmount" class="custom-input" placeholder="0.00" required />
              </div>
              <div>
                <label class="field-label" style="margin-bottom: 4px;">Categoría</label>
                <select class="custom-select" id="txCategory">
                  <option value="Comida / Alimentación">Comida / Alimentación</option>
                  <option value="Transporte">Transporte / Gasolina</option>
                  <option value="Servicios">Servicios / Facturas</option>
                  <option value="Entretenimiento">Entretenimiento</option>
                  <option value="Salud">Salud / Medicina</option>
                  <option value="Ingresos / Sueldo">Ingresos / Sueldo</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>
            </div>
            <div>
              <label class="field-label" style="margin-bottom: 4px;">Descripción / Concepto</label>
              <input type="text" id="txDesc" class="custom-input" placeholder="Ej. Tacos al pastor, Gasolina magna..." required />
            </div>
            <div>
              <label class="field-label" style="margin-bottom: 4px;">Fecha</label>
              <input type="datetime-local" id="txDate" class="custom-input" />
            </div>
            <button type="submit" class="btn-primary" style="margin-top: 6px;">Guardar Movimiento</button>
          </form>
        </div>
      </div>
    `;
  }

  bindEvents() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        this.switchTab(tab);
      });
    });

    // Chat form submit
    const chatForm = document.getElementById('chatForm');
    const chatInput = document.getElementById('chatInput');
    chatForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = chatInput.value.trim();
      if (!text || this.isGenerating) return;
      chatInput.value = '';
      await this.handleUserMessage(text);
    });

    // Quick prompt chips
    document.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', async () => {
        const prompt = chip.getAttribute('data-prompt');
        if (prompt && !this.isGenerating) {
          await this.handleUserMessage(prompt);
        }
      });
    });

    // Shared helper: start listening and send to Jarvis
    const startListening = (callerBtn) => {
      if (!voiceEngine.isRecognitionSupported()) {
        this.showToast('Dictado por voz no disponible en este navegador');
        return;
      }
      if (voiceEngine.isListening) {
        voiceEngine.stopListening();
        return;
      }

      const listeningBar = document.getElementById('voiceListeningBar');

      voiceEngine.listen({
        onStart: () => {
          callerBtn?.classList.add('listening');
          listeningBar?.classList.add('active');
        },
        onResult: async (transcript) => {
          callerBtn?.classList.remove('listening');
          listeningBar?.classList.remove('active');
          if (transcript) {
            this.switchTab('chat');
            const chatInput = document.getElementById('chatInput');
            if (chatInput) chatInput.value = transcript;
            await this.handleUserMessage(transcript);
            if (chatInput) chatInput.value = '';
          }
        },
        onError: (err) => {
          callerBtn?.classList.remove('listening');
          listeningBar?.classList.remove('active');
          const errType = err?.error || '';
          if (errType === 'no-speech') {
            this.showToast('No detecté voz. Intenta de nuevo.');
          } else if (errType === 'not-allowed') {
            this.showToast('Permiso de micrófono denegado.');
          } else {
            this.showToast('Error de micrófono — intenta de nuevo.');
          }
        },
        onEnd: () => {
          callerBtn?.classList.remove('listening');
          listeningBar?.classList.remove('active');
        }
      });
    };

    // Header quick-mic button (globe icon, any-tab access)
    const headerMicBtn = document.getElementById('btnQuickMic');
    headerMicBtn?.addEventListener('click', () => startListening(headerMicBtn));

    // Chat inline mic button (inside input)
    const chatMicBtn = document.getElementById('btnChatMic');
    chatMicBtn?.addEventListener('click', () => startListening(chatMicBtn));

    // Voice toggle (header)
    const btnToggleVoice = document.getElementById('btnToggleVoice');
    btnToggleVoice?.addEventListener('click', () => {
      const enabled = voiceEngine.toggleVoiceEnabled();
      btnToggleVoice.innerHTML = enabled ? ICONS.speaker : ICONS.speakerMute;
      btnToggleVoice.classList.toggle('active-voice', enabled);
      const settingBtn = document.getElementById('btnSettingVoiceToggle');
      if (settingBtn) {
        settingBtn.innerHTML = enabled ? ICONS.speaker : ICONS.speakerMute;
        settingBtn.classList.toggle('active-voice', enabled);
      }
      this.showToast(enabled ? '🔊 Voz de Jarvis activada' : '🔇 Voz de Jarvis silenciada');
    });

    // Voice toggle (settings)
    const btnSettingVoiceToggle = document.getElementById('btnSettingVoiceToggle');
    btnSettingVoiceToggle?.addEventListener('click', () => {
      const enabled = voiceEngine.toggleVoiceEnabled();
      btnSettingVoiceToggle.innerHTML = enabled ? ICONS.speaker : ICONS.speakerMute;
      btnSettingVoiceToggle.classList.toggle('active-voice', enabled);
      const headerBtn = document.getElementById('btnToggleVoice');
      if (headerBtn) {
        headerBtn.innerHTML = enabled ? ICONS.speaker : ICONS.speakerMute;
        headerBtn.classList.toggle('active-voice', enabled);
      }
      this.showToast(enabled ? '🔊 Voz de Jarvis activada' : '🔇 Voz de Jarvis silenciada');
    });

    // Notification enable button
    const btnEnableNotifications = document.getElementById('btnEnableNotifications');
    btnEnableNotifications?.addEventListener('click', async () => {
      if (notificationManager.getPermission() === 'granted') {
        this.showToast('Las notificaciones ya están activadas ✓');
        return;
      }
      const granted = await notificationManager.requestPermission();
      if (granted) {
        btnEnableNotifications.textContent = 'Permiso Concedido ✓';
        const badge = document.getElementById('notifStatusBadge');
        if (badge) badge.textContent = 'Activadas ✓';
        this.showToast('🔔 Alertas de eventos activadas');
        notificationManager.startMonitoring();
      } else {
        this.showToast('Permiso denegado. Actívalos desde Ajustes del iPhone.');
      }
    });

    // Test notification
    const btnTestNotif = document.getElementById('btnTestNotification');
    btnTestNotif?.addEventListener('click', async () => {
      const result = await notificationManager.sendTestNotification();
      this.showToast(result.success ? '🔔 Alerta de prueba enviada' : result.message);
    });

    // Default reminder setting change
    document.getElementById('settingDefaultReminder')?.addEventListener('change', (e) => {
      const mins = parseInt(e.target.value, 10);
      store.updateSettings({ defaultReminderMinutes: mins });
      const label = mins > 0 ? notificationManager.formatReminderText(mins) + ' antes' : (mins === 0 ? 'Al momento' : 'Desactivado');
      this.showToast(`⏰ Anticipación predeterminada: ${label}`);
    });

    // Notify on start setting change
    document.getElementById('settingNotifyOnStart')?.addEventListener('change', (e) => {
      store.updateSettings({ notifyOnStart: e.target.checked });
      this.showToast(e.target.checked ? '🔔 Alerta al comenzar activada' : '🔕 Alerta al comenzar desactivada');
    });

    // Modals
    const modalAddEvent = document.getElementById('modalAddEvent');
    const modalAddTx = document.getElementById('modalAddTx');

    document.getElementById('btnOpenAddEvent').addEventListener('click', () => {
      // Default to today + 1 hour
      const now = new Date();
      now.setMinutes(0, 0, 0);
      now.setHours(now.getHours() + 1);
      const end = new Date(now.getTime() + 60 * 60 * 1000);
      
      const toLocalISO = (d) => {
        const off = d.getTimezoneOffset();
        const local = new Date(d.getTime() - off * 60000);
        return local.toISOString().slice(0, 16);
      };

      document.getElementById('eventStart').value = toLocalISO(now);
      document.getElementById('eventEnd').value = toLocalISO(end);
      const eventReminder = document.getElementById('eventReminder');
      if (eventReminder) eventReminder.value = 'default';
      modalAddEvent.classList.add('active');
    });

    document.getElementById('btnCloseAddEvent').addEventListener('click', () => {
      modalAddEvent.classList.remove('active');
    });

    document.getElementById('formAddEvent').addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('eventTitle').value.trim();
      const start_time = document.getElementById('eventStart').value;
      const end_time = document.getElementById('eventEnd').value;
      const location = document.getElementById('eventLocation').value.trim();
      const description = document.getElementById('eventDescription').value.trim();
      const remVal = document.getElementById('eventReminder')?.value;
      const reminder_minutes = remVal === 'default' ? undefined : parseInt(remVal, 10);

      calendarTools.create_calendar_event({
        title,
        start_time: new Date(start_time).toISOString(),
        end_time: new Date(end_time).toISOString(),
        location,
        description,
        reminder_minutes
      });

      modalAddEvent.classList.remove('active');
      e.target.reset();
      this.showToast('📅 Evento creado con éxito');
    });

    // Finance modal
    document.getElementById('btnOpenAddTx').addEventListener('click', () => {
      const now = new Date();
      const off = now.getTimezoneOffset();
      const local = new Date(now.getTime() - off * 60000);
      document.getElementById('txDate').value = local.toISOString().slice(0, 16);
      modalAddTx.classList.add('active');
    });

    document.getElementById('btnCloseAddTx').addEventListener('click', () => {
      modalAddTx.classList.remove('active');
    });

    document.getElementById('formAddTx').addEventListener('submit', (e) => {
      e.preventDefault();
      const type = document.getElementById('txType').value;
      const amount = parseFloat(document.getElementById('txAmount').value);
      const category = document.getElementById('txCategory').value;
      const description = document.getElementById('txDesc').value.trim();
      const dateVal = document.getElementById('txDate').value;
      const date = dateVal ? new Date(dateVal).toISOString() : new Date().toISOString();

      const result = financeTools.add_transaction({
        type,
        amount,
        category,
        description,
        date
      });

      // --- Budget exceeded check ---
      if (type === 'expense') {
        const budgets = store.getBudgets();
        const limit = budgets[category];
        if (limit && limit > 0) {
          const txs = store.getTransactions();
          const now2 = new Date();
          const monthSpent = txs
            .filter(t => {
              const d = new Date(t.date);
              return t.type === 'expense' &&
                t.category === category &&
                d.getMonth() === now2.getMonth() &&
                d.getFullYear() === now2.getFullYear();
            })
            .reduce((sum, t) => sum + t.amount, 0);

          if (monthSpent > limit) {
            const currency2 = store.getSettings().currency || 'MXN';
            const overBy = monthSpent - limit;
            const msg = `⚠️ Límite superado en "${category}": gastaste ${formatCurrency(monthSpent, currency2)} de ${formatCurrency(limit, currency2)} (te pasaste ${formatCurrency(overBy, currency2)})`;
            this.showToast(msg);
            notificationManager.sendNotification(
              `⚠️ Presupuesto superado: ${category}`,
              {
                body: `Este mes gastaste ${formatCurrency(monthSpent, currency2)} de tu límite de ${formatCurrency(limit, currency2)}. Te pasaste por ${formatCurrency(overBy, currency2)}.`,
                tag: `budget-${category}`,
                requireInteraction: false
              }
            );
          }
        }
      }

      modalAddTx.classList.remove('active');
      e.target.reset();
      this.showToast('💰 Movimiento registrado');
    });

    // Close modals on backdrop click
    [modalAddEvent, modalAddTx].forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('active');
        }
      });
    });

    // Settings Provider Toggle
    const settingProvider = document.getElementById('settingProvider');
    const geminiKeyGroup = document.getElementById('geminiKeyGroup');
    const geminiModelGroup = document.getElementById('geminiModelGroup');
    const openaiKeyGroup = document.getElementById('openaiKeyGroup');

    settingProvider.addEventListener('change', () => {
      const val = settingProvider.value;
      if (val === 'gemini') {
        geminiKeyGroup.style.display = 'block';
        geminiModelGroup.style.display = 'block';
        openaiKeyGroup.style.display = 'none';
      } else if (val === 'openai') {
        geminiKeyGroup.style.display = 'none';
        geminiModelGroup.style.display = 'none';
        openaiKeyGroup.style.display = 'block';
      } else {
        geminiKeyGroup.style.display = 'none';
        geminiModelGroup.style.display = 'none';
        openaiKeyGroup.style.display = 'none';
      }
    });

    // Test Gemini API Key
    const btnTestGeminiKey = document.getElementById('btnTestGeminiKey');
    const geminiKeyInput = document.getElementById('settingGeminiKey');
    const geminiKeyStatus = document.getElementById('geminiKeyStatus');

    btnTestGeminiKey?.addEventListener('click', async () => {
      const key = geminiKeyInput.value.trim();
      const model = document.getElementById('settingGeminiModel')?.value || 'gemini-2.5-flash';

      if (!key) {
        if (geminiKeyStatus) geminiKeyStatus.innerHTML = '<span style="color: var(--accent-rose);">⚠️ Pega tu API Key primero.</span>';
        this.showToast('Ingresa tu API Key de Gemini');
        return;
      }

      btnTestGeminiKey.disabled = true;
      btnTestGeminiKey.textContent = '⏳ Probando...';
      if (geminiKeyStatus) geminiKeyStatus.innerHTML = '<span style="color: var(--text-secondary);">Verificando con Google AI...</span>';

      try {
        await testGeminiApiKey(key, model);
        // Auto-save on successful test
        store.updateSettings({
          provider: 'gemini',
          apiKey: key,
          geminiModel: model
        });
        if (geminiKeyStatus) {
          geminiKeyStatus.innerHTML = `<span style="color: var(--accent-emerald); font-weight: 600;">✓ Conexión exitosa con Gemini (${model})</span>`;
        }
        this.showToast('✅ Gemini conectado exitosamente');
        this.updateStatusBadge();
      } catch (err) {
        if (geminiKeyStatus) {
          geminiKeyStatus.innerHTML = `<span style="color: var(--accent-rose); font-weight: 600;">❌ ${this.escapeHtml(err.message)}</span>`;
        }
        this.showToast(`Error: ${err.message}`);
      } finally {
        btnTestGeminiKey.disabled = false;
        btnTestGeminiKey.textContent = '⚡ Probar Conexión';
      }
    });

    // Show/hide API key toggle
    const btnToggleKeyVis = document.getElementById('btnToggleKeyVis');
    btnToggleKeyVis?.addEventListener('click', () => {
      const input = document.getElementById('settingGeminiKey');
      if (!input) return;
      if (input.type === 'text') {
        input.type = 'password';
        btnToggleKeyVis.textContent = '👁️';
      } else {
        input.type = 'text';
        btnToggleKeyVis.textContent = '🙈';
      }
    });

    // Quick save key button
    const btnSaveGeminiKeyNow = document.getElementById('btnSaveGeminiKeyNow');
    btnSaveGeminiKeyNow?.addEventListener('click', () => {
      const apiKey = document.getElementById('settingGeminiKey')?.value.trim();
      const model = document.getElementById('settingGeminiModel')?.value || 'gemini-2.5-flash';
      if (!apiKey) {
        const geminiKeyStatus = document.getElementById('geminiKeyStatus');
        if (geminiKeyStatus) geminiKeyStatus.innerHTML = '<span style="color: var(--accent-rose);">⚠️ Escribe o pega tu API Key primero.</span>';
        this.showToast('Pega tu API Key de Gemini');
        return;
      }
      store.updateSettings({ apiKey, provider: 'gemini', geminiModel: model });
      const geminiKeyStatus = document.getElementById('geminiKeyStatus');
      if (geminiKeyStatus) geminiKeyStatus.innerHTML = '<span style="color: var(--accent-emerald); font-weight: 600;">✓ Key guardada. Toca "⚡ Probar Conexión" para verificar.</span>';
      this.showToast('💾 API Key guardada en tu iPhone');
      this.updateStatusBadge();
    });

    // Save Settings Button
    document.getElementById('btnSaveApiSettings').addEventListener('click', () => {
      const provider = settingProvider.value;
      const apiKey = document.getElementById('settingGeminiKey').value.trim();
      const geminiModel = document.getElementById('settingGeminiModel').value;
      const openaiApiKey = document.getElementById('settingOpenaiKey').value.trim();
      const currency = document.getElementById('settingCurrency').value;
      const userName = document.getElementById('settingUserName').value.trim();

      store.updateSettings({
        provider,
        apiKey,
        geminiModel,
        openaiApiKey,
        currency,
        userName
      });

      this.showToast('Configuración guardada ✓');
      this.updateStatusBadge();
      if (apiKey && geminiKeyStatus) {
        geminiKeyStatus.innerHTML = '<span style="color: var(--accent-cyan);">Guardado. Toca "⚡ Probar Key" para verificar conexión.</span>';
      }
    });

    // Clear chat
    document.getElementById('btnClearChat').addEventListener('click', () => {
      if (confirm('¿Deseas limpiar el historial de mensajes?')) {
        store.clearChatHistory();
        this.showToast('Historial de chat borrado');
      }
    });

    // Reset data
    document.getElementById('btnResetData').addEventListener('click', () => {
      if (confirm('¿Restablecer todos los eventos y finanzas a los datos iniciales?')) {
        store.resetAllData();
        this.showToast('Datos restablecidos');
      }
    });
  }

  // ── iOS Shortcut deep-link handler ────────────────────────────────────────
  _handleDeepLink() {
    const params = new URLSearchParams(window.location.search);
    const msg = params.get('msg');
    const tab = params.get('tab');

    // Switch tab if specified
    if (tab && ['chat', 'calendar', 'finance', 'settings'].includes(tab)) {
      this.switchTab(tab);
    }

    // Send message if specified
    if (msg && msg.trim()) {
      const cleanMsg = decodeURIComponent(msg).trim();
      // Small delay to let the app fully render
      setTimeout(async () => {
        // Make sure we're on the chat tab
        this.switchTab('chat');
        // Show the message in the input briefly so user sees it
        const chatInput = document.getElementById('chatInput');
        if (chatInput) chatInput.value = cleanMsg;
        // Send after another tiny delay for visual feedback
        setTimeout(async () => {
          if (chatInput) chatInput.value = '';
          await this.handleUserMessage(cleanMsg);
        }, 300);
      }, 400);
    }

    // Clean URL without reloading (remove ?msg and ?tab params)
    if (msg || tab) {
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    }
  }

  // ── iOS Shortcut clipboard handler ───────────────────────────────────────
  // The Shortcut copies "[JARVIS]:TuMensaje" to clipboard, then opens the app.
  // This method detects it, sends the message, and clears the clipboard.
  async _checkClipboardForMessage() {
    if (this.isGenerating) return;
    const PREFIX = '[JARVIS]:';
    try {
      const clip = await navigator.clipboard.readText();
      if (!clip || !clip.startsWith(PREFIX)) return;

      const msg = clip.slice(PREFIX.length).trim();
      if (!msg) return;

      // Avoid re-sending the same message if visibility fires multiple times
      if (this._lastClipboardMsg === msg) return;
      this._lastClipboardMsg = msg;

      // Clear clipboard so it doesn't trigger again on next focus
      navigator.clipboard.writeText('').catch(() => {});

      // Switch to chat, show message briefly in input, then send
      this.switchTab('chat');
      const chatInput = document.getElementById('chatInput');
      if (chatInput) chatInput.value = msg;

      setTimeout(async () => {
        if (chatInput) chatInput.value = '';
        await this.handleUserMessage(msg);
      }, 350);

    } catch {
      // Clipboard not accessible (permission not granted or not available) — silent
    }
  }

  switchTab(tabId) {
    this.currentTab = tabId;
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });
    document.querySelectorAll('.tab-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === `tab-${tabId}`);
    });

    // Auto scroll chat to bottom when entering chat
    if (tabId === 'chat') {
      this.scrollToBottom();
    }
  }

  updateStatusBadge() {
    const settings = store.getSettings();
    const statusEl = document.getElementById('brandStatus');
    if (!statusEl) return;

    if (settings.provider === 'gemini' && settings.apiKey) {
      statusEl.textContent = 'Gemini 1.5 • En línea';
    } else if (settings.provider === 'openai' && settings.openaiApiKey) {
      statusEl.textContent = 'GPT-4o Mini • En línea';
    } else {
      statusEl.textContent = 'Modo Inteligente Local • Listo';
    }
  }

  async handleUserMessage(text) {
    // Append user message
    store.addChatMessage({
      sender: 'user',
      text
    });

    this.isGenerating = true;
    const sendBtn = document.getElementById('btnSendChat');
    if (sendBtn) sendBtn.disabled = true;

    // Show typing bubble
    this.showTypingIndicator();

    try {
      const result = await sendMessageToJarvis(text);

      this.hideTypingIndicator();
      store.addChatMessage({
        sender: 'jarvis',
        text: result.text,
        toolCall: result.toolCall
      });

      // Speak Jarvis response if voice is enabled
      voiceEngine.speak(result.text);
    } catch (err) {
      this.hideTypingIndicator();
      const errorMsg = `Lo siento, ocurrió un problema al procesar tu solicitud: ${err.message}`;
      store.addChatMessage({
        sender: 'jarvis',
        text: errorMsg
      });
      voiceEngine.speak('Lo siento, ocurrió un problema. Inténtalo de nuevo.');
    } finally {
      this.isGenerating = false;
      if (sendBtn) sendBtn.disabled = false;
    }
  }

  showTypingIndicator() {
    const container = document.getElementById('chatMessages');
    const existing = document.getElementById('typingIndicator');
    if (existing) return;

    const row = document.createElement('div');
    row.id = 'typingIndicator';
    row.className = 'message-row jarvis';
    row.innerHTML = `
      <div class="avatar-small">J</div>
      <div class="typing-bubble">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    `;
    container.appendChild(row);
    this.scrollToBottom();
  }

  hideTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) indicator.remove();
  }

  scrollToBottom() {
    const container = document.getElementById('chatMessages');
    if (container) {
      setTimeout(() => {
        container.scrollTop = container.scrollHeight;
      }, 50);
    }
  }

  renderAll() {
    this.renderChatMessages();
    this.renderCalendar();
    this.renderFinances();
    this.renderSettings();
    this.updateStatusBadge();
  }

  renderChatMessages() {
    const container = document.getElementById('chatMessages');
    if (!container) return;

    const history = store.getChatHistory();
    container.innerHTML = history.map(msg => {
      const isUser = msg.sender === 'user';
      const time = new Date(msg.timestamp).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

      let toolHtml = '';
      if (msg.toolCall) {
        const tc = msg.toolCall;
        const name = tc.name || (tc.transaction ? 'add_transaction' : tc.event ? 'create_calendar_event' : tc.events ? 'get_calendar_events' : tc.balance !== undefined ? 'get_financial_summary' : '');
        const result = tc.result || tc;
        const args = tc.args || {};

        let badgeClass = 'calendar';
        let badgeTitle = 'Acción Realizada';

        if (name === 'add_transaction' || result?.transaction) {
          const isIncome = result?.transaction?.type === 'income' || args?.type === 'income';
          badgeClass = isIncome ? 'finance-income' : 'finance-expense';
          badgeTitle = isIncome ? '🟢 Ingreso Registrado' : '🔴 Gasto Registrado';
        } else if (name === 'get_financial_summary') {
          badgeClass = 'finance-income';
          badgeTitle = '📊 Resumen Financiero';
        } else if (name === 'create_calendar_event' || result?.event) {
          badgeClass = 'calendar';
          badgeTitle = '📅 Evento Creado';
        } else if (name === 'get_calendar_events' || result?.events) {
          badgeClass = 'calendar';
          badgeTitle = '🗓️ Consulta de Agenda';
        } else if (name === 'delete_calendar_event') {
          badgeClass = 'finance-expense';
          badgeTitle = '🗑️ Evento Cancelado';
        }

        toolHtml = `
          <div class="tool-badge ${badgeClass}">
            <div class="tool-badge-header">${badgeTitle}</div>
            <div class="tool-badge-content">${result?.summary || 'Acción completada.'}</div>
          </div>
        `;
      }

      return `
        <div class="message-row ${isUser ? 'user' : 'jarvis'}">
          ${!isUser ? `<div class="avatar-small">J</div>` : ''}
          <div class="bubble">
            <div class="bubble-text">${isUser ? this.escapeHtml(msg.text).replace(/\n/g, '<br/>') : this.formatMarkdown(msg.text)}</div>
            ${toolHtml}
            <div class="msg-time">${time}</div>
          </div>
        </div>
      `;
    }).join('');

    this.scrollToBottom();
  }

  escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Convert basic markdown to safe HTML for Jarvis responses
  formatMarkdown(text) {
    if (!text) return '';
    // Escape HTML first
    let s = this.escapeHtml(text);

    // Bold: **text** or __text__
    s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/__(.+?)__/g, '<strong>$1</strong>');

    // Italic: *text* or _text_
    s = s.replace(/\*([^*\n]+?)\*/g, '<em>$1</em>');
    s = s.replace(/_([^_\n]+?)_/g, '<em>$1</em>');

    // Inline code: `code`
    s = s.replace(/`([^`]+?)`/g, '<code style="background:rgba(0,240,255,0.1);padding:1px 5px;border-radius:4px;font-size:12px;">$1</code>');

    // Process line by line for lists and tables
    const lines = s.split('\n');
    const result = [];
    let inList = false;
    let inTable = false;
    let tableHeaderDone = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Table row: | col | col |
      if (line.startsWith('|') && line.endsWith('|')) {
        const cells = line.slice(1, -1).split('|').map(c => c.trim());
        // Separator row (---|---)
        if (cells.every(c => /^[-: ]+$/.test(c))) {
          if (!inTable) {
            result.push('<div class="md-table"><table>');
            inTable = true;
          }
          tableHeaderDone = true;
          continue;
        }
        if (!inTable) {
          result.push('<div class="md-table"><table>');
          inTable = true;
        }
        const tag = !tableHeaderDone ? 'th' : 'td';
        result.push('<tr>' + cells.map(c => `<${tag}>${c}</${tag}>`).join('') + '</tr>');
        continue;
      } else if (inTable) {
        result.push('</table></div>');
        inTable = false;
        tableHeaderDone = false;
      }

      // Unordered list: - item or • item
      if (/^[-•*]\s+/.test(line)) {
        if (!inList) {
          result.push('<ul class="md-list">');
          inList = true;
        }
        result.push('<li>' + line.replace(/^[-•*]\s+/, '') + '</li>');
        continue;
      } else if (inList) {
        result.push('</ul>');
        inList = false;
      }

      // Ordered list: 1. item
      if (/^\d+\.\s+/.test(line)) {
        if (!inList) {
          result.push('<ol class="md-list">');
          inList = true;
        }
        result.push('<li>' + line.replace(/^\d+\.\s+/, '') + '</li>');
        continue;
      }

      // Heading: ## text
      if (/^###\s/.test(line)) {
        result.push('<p style="font-size:13px;font-weight:700;color:var(--accent-cyan);margin:6px 0 2px;">' + line.slice(4) + '</p>');
        continue;
      }
      if (/^##\s/.test(line)) {
        result.push('<p style="font-size:14px;font-weight:700;color:var(--text-primary);margin:8px 0 2px;">' + line.slice(3) + '</p>');
        continue;
      }
      if (/^#\s/.test(line)) {
        result.push('<p style="font-size:15px;font-weight:700;color:var(--text-primary);margin:8px 0 2px;">' + line.slice(2) + '</p>');
        continue;
      }

      // Empty line → paragraph break
      if (line === '') {
        if (inList) { result.push('</ul>'); inList = false; }
        result.push('<br/>');
        continue;
      }

      result.push('<span>' + line + '</span><br/>');
    }

    if (inList) result.push('</ul>');
    if (inTable) result.push('</table></div>');

    // Clean up trailing <br/>
    let html = result.join('');
    html = html.replace(/(<br\/>)+$/, '');
    return html;
  }

  // --- CALENDAR RENDERING ---
  renderCalendar() {
    this.renderDateStrip();
    this.renderEventsTimeline();
  }

  renderDateStrip() {
    const strip = document.getElementById('calendarDateStrip');
    if (!strip) return;

    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    let html = '';
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    for (let i = 0; i < 14; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);

      const isSelected = d.toDateString() === this.selectedCalendarDate.toDateString();
      const dayName = i === 0 ? 'Hoy' : i === 1 ? 'Mañ' : days[d.getDay()];
      const dayNum = d.getDate();

      html += `
        <div class="date-pill ${isSelected ? 'active' : ''}" data-date="${d.toISOString()}">
          <span class="date-pill-day">${dayName}</span>
          <span class="date-pill-num">${dayNum}</span>
        </div>
      `;
    }

    strip.innerHTML = html;

    strip.querySelectorAll('.date-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const iso = pill.getAttribute('data-date');
        this.selectedCalendarDate = new Date(iso);
        this.renderCalendar();
      });
    });
  }

  renderEventsTimeline() {
    const container = document.getElementById('eventsTimeline');
    if (!container) return;

    const allEvents = store.getEvents();
    const selDateStr = this.selectedCalendarDate.toDateString();

    const filtered = allEvents.filter(e => {
      const d = parseToLocalDate(e.start_time);
      return d.toDateString() === selDateStr;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
          <div style="font-size: 36px; margin-bottom: 8px;">🗓️</div>
          <div style="font-size: 15px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">Sin eventos este día</div>
          <div style="font-size: 12px;">Pídele a Jarvis agendar uno o toca el botón "+" superior.</div>
        </div>
      `;
      return;
    }

    const settings = store.getSettings();
    const defaultRem = settings.defaultReminderMinutes !== undefined ? parseInt(settings.defaultReminderMinutes, 10) : 15;

    container.innerHTML = filtered.map(evt => {
      const startTime = new Date(evt.start_time).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
      const endTime = evt.end_time ? new Date(evt.end_time).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : '';
      const rem = evt.reminder_minutes !== undefined && evt.reminder_minutes !== null ? evt.reminder_minutes : defaultRem;
      let reminderBadge = '';
      if (rem > 0) {
        let lbl = `${rem} min antes`;
        if (rem >= 1440) lbl = `${Math.round(rem / 1440)}d antes`;
        else if (rem >= 60) lbl = `${Math.round(rem / 60)}h antes`;
        reminderBadge = `<span class="event-reminder-badge" title="Alerta programada con ${lbl}">${ICONS.bell} ${lbl}</span>`;
      } else if (rem === 0) {
        reminderBadge = `<span class="event-reminder-badge" title="Alerta al comenzar">${ICONS.bell} Al iniciar</span>`;
      }

      return `
        <div class="event-card">
          <div class="event-card-header">
            <div class="event-card-title">${this.escapeHtml(evt.title)}</div>
            <button class="event-delete-btn" data-id="${evt.id}" title="Eliminar evento">
              ${ICONS.trash}
            </button>
          </div>
          <div class="event-card-time">
            <span>${ICONS.clock} ${startTime} ${endTime ? `— ${endTime}` : ''}</span>
            ${reminderBadge}
          </div>
          ${evt.description ? `<div class="event-card-desc">${this.escapeHtml(evt.description)}</div>` : ''}
          ${evt.location ? `
            <div class="event-card-location">
              ${ICONS.pin} ${this.escapeHtml(evt.location)}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    // Delete event handler
    container.querySelectorAll('.event-delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        calendarTools.delete_calendar_event({ event_id: id });
        this.showToast('Evento eliminado');
      });
    });
  }

  // --- FINANCES RENDERING ---
  renderFinances() {
    const transactions = store.getTransactions();
    const currency = store.getSettings().currency || 'MXN';

    // Calculate month stats
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthTxs = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    let totalIncome = 0;
    let totalExpense = 0;
    const catMap = {};

    monthTxs.forEach(t => {
      if (t.type === 'income') {
        totalIncome += t.amount;
      } else {
        totalExpense += t.amount;
        catMap[t.category] = (catMap[t.category] || 0) + t.amount;
      }
    });

    const balance = totalIncome - totalExpense;

    // Render Hero Card
    const balanceCard = document.getElementById('balanceCard');
    if (balanceCard) {
      balanceCard.innerHTML = `
        <div class="balance-label">Balance de ${new Intl.DateTimeFormat('es-MX', { month: 'long' }).format(now)}</div>
        <div class="balance-amount">
          ${formatCurrency(balance, currency)}
          <span class="balance-currency">${currency}</span>
        </div>
        <div class="balance-pills-row">
          <div class="summary-pill">
            <div class="pill-icon income">↑</div>
            <div class="pill-info">
              <span class="pill-label">Ingresos</span>
              <span class="pill-val">${formatCurrency(totalIncome, currency)}</span>
            </div>
          </div>
          <div class="summary-pill">
            <div class="pill-icon expense">↓</div>
            <div class="pill-info">
              <span class="pill-label">Gastos</span>
              <span class="pill-val">${formatCurrency(totalExpense, currency)}</span>
            </div>
          </div>
        </div>
      `;
    }

    // Render Category Breakdown
    const breakdownCard = document.getElementById('categoryBreakdownCard');
    if (breakdownCard) {
      const categories = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
      if (categories.length === 0) {
        breakdownCard.innerHTML = `
          <div class="breakdown-title">Distribución de Gastos</div>
          <div style="font-size: 12px; color: var(--text-muted); text-align: center; padding: 12px 0;">
            No hay gastos registrados en el mes actual.
          </div>
        `;
      } else {
        const maxCat = Math.max(...categories.map(c => c[1]));
        const rows = categories.map(([cat, amt]) => {
          const pct = Math.round((amt / (totalExpense || 1)) * 100);
          const barWidth = Math.round((amt / (maxCat || 1)) * 100);

          return `
            <div class="category-bar-row">
              <div class="cat-bar-header">
                <span class="cat-bar-name">${this.escapeHtml(cat)}</span>
                <span class="cat-bar-amt">${formatCurrency(amt, currency)} (${pct}%)</span>
              </div>
              <div class="cat-bar-track">
                <div class="cat-bar-fill" style="width: ${barWidth}%;"></div>
              </div>
            </div>
          `;
        }).join('');

        breakdownCard.innerHTML = `
          <div class="breakdown-title">Distribución de Gastos (${monthTxs.filter(t => t.type === 'expense').length} movimientos)</div>
          ${rows}
        `;
      }
    }

    // Render Budget Limits Panel
    const budgetCard = document.getElementById('budgetLimitsCard');
    if (budgetCard) {
      const budgets = store.getBudgets();
      const currency = store.getSettings().currency || 'MXN';

      const budgetRows = EXPENSE_CATEGORIES.map(cat => {
        const limit = budgets[cat] || 0;
        const spent = catMap[cat] || 0;
        const pct = limit > 0 ? Math.min(Math.round((spent / limit) * 100), 100) : 0;
        const overLimit = limit > 0 && spent > limit;
        const barColor = overLimit
          ? 'var(--accent-rose)'
          : pct >= 80
          ? '#f59e0b'
          : 'var(--accent-emerald)';

        return `
          <div class="budget-row" data-cat="${this.escapeHtml(cat)}">
            <div class="budget-row-header">
              <span class="budget-cat-name">${this.escapeHtml(cat)}</span>
              <div class="budget-row-actions">
                ${limit > 0 ? `
                  <span class="budget-spent ${overLimit ? 'over' : ''}">
                    ${formatCurrency(spent, currency)} / ${formatCurrency(limit, currency)}
                    ${overLimit ? ' ⚠️' : ''}
                  </span>
                ` : '<span class="budget-no-limit">Sin límite</span>'}
                <button class="budget-edit-btn" data-cat="${this.escapeHtml(cat)}" title="Editar límite">✏️</button>
              </div>
            </div>
            ${limit > 0 ? `
              <div class="budget-bar-track">
                <div class="budget-bar-fill" style="width:${pct}%; background:${barColor};"></div>
              </div>
            ` : ''}
            <div class="budget-edit-row" id="budget-edit-${this.escapeHtml(cat).replace(/[^a-zA-Z0-9]/g,'-')}" style="display:none;">
              <input type="number" class="custom-input budget-limit-input" placeholder="Límite mensual ($)" step="50" min="0" value="${limit > 0 ? limit : ''}" />
              <div style="display:flex; gap:6px; margin-top:6px;">
                <button class="btn-primary budget-save-btn" style="flex:1; font-size:12px; padding:8px;">Guardar</button>
                <button class="btn-secondary budget-remove-btn" style="flex:1; font-size:12px; padding:8px;">Quitar límite</button>
              </div>
            </div>
          </div>
        `;
      }).join('');

      budgetCard.innerHTML = `
        <div class="breakdown-title">Presupuesto mensual por categoría</div>
        <p style="font-size:12px; color:var(--text-muted); margin-bottom:10px; margin-top:-2px;">Toca ✏️ para establecer un límite. Te notificaremos si te pasas.</p>
        ${budgetRows}
      `;

      // Wire edit buttons
      budgetCard.querySelectorAll('.budget-edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const cat = btn.getAttribute('data-cat');
          const editId = 'budget-edit-' + cat.replace(/[^a-zA-Z0-9]/g, '-');
          const editRow = document.getElementById(editId);
          if (editRow) {
            const isOpen = editRow.style.display !== 'none';
            // Close all
            budgetCard.querySelectorAll('.budget-edit-row').forEach(r => r.style.display = 'none');
            if (!isOpen) editRow.style.display = 'block';
          }
        });
      });

      // Wire save buttons
      budgetCard.querySelectorAll('.budget-save-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const row = btn.closest('.budget-row');
          const cat = row.getAttribute('data-cat');
          const input = row.querySelector('.budget-limit-input');
          const val = parseFloat(input?.value);
          if (!val || val <= 0) {
            this.showToast('Ingresa un monto válido mayor a 0');
            return;
          }
          store.setBudget(cat, val);
          this.showToast(`✅ Límite de ${formatCurrency(val, store.getSettings().currency || 'MXN')} guardado para ${cat}`);
        });
      });

      // Wire remove-limit buttons
      budgetCard.querySelectorAll('.budget-remove-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const row = btn.closest('.budget-row');
          const cat = row.getAttribute('data-cat');
          store.setBudget(cat, null);
          this.showToast(`Límite de "${cat}" eliminado`);
        });
      });
    }
    const txList = document.getElementById('transactionsList');
    if (txList) {
      if (transactions.length === 0) {
        txList.innerHTML = `
          <div style="text-align: center; padding: 30px; color: var(--text-muted); font-size: 13px;">
            Aún no tienes movimientos registrados.
          </div>
        `;
        return;
      }

      txList.innerHTML = transactions.slice(0, 15).map(tx => {
        const isIncome = tx.type === 'income';
        const icon = isIncome ? '💰' : this.getCategoryEmoji(tx.category);
        const dateStr = formatDateTime(tx.date);

        return `
          <div class="tx-item">
            <div class="tx-left">
              <div class="tx-icon-wrap">${icon}</div>
              <div class="tx-details">
                <span class="tx-desc">${this.escapeHtml(tx.description)}</span>
                <span class="tx-cat-date">${this.escapeHtml(tx.category)} • ${dateStr}</span>
              </div>
            </div>
            <div class="tx-right">
              <span class="tx-amt ${isIncome ? 'income' : 'expense'}">
                ${isIncome ? '+' : '-'}${formatCurrency(tx.amount, currency)}
              </span>
              <button class="tx-delete-btn" data-id="${tx.id}">Eliminar</button>
            </div>
          </div>
        `;
      }).join('');

      txList.querySelectorAll('.tx-delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          store.deleteTransaction(id);
          this.showToast('Movimiento eliminado');
        });
      });
    }
  }

  getCategoryEmoji(cat) {
    if (!cat) return '💳';
    const c = cat.toLowerCase();
    if (c.includes('comida') || c.includes('alimento') || c.includes('taco')) return '🌮';
    if (c.includes('transporte') || c.includes('gasolina') || c.includes('uber')) return '⛽';
    if (c.includes('servicio') || c.includes('luz') || c.includes('agua')) return '⚡';
    if (c.includes('entretenimiento') || c.includes('cine')) return '🍿';
    if (c.includes('salud') || c.includes('medicina') || c.includes('doctor')) return '🩺';
    if (c.includes('sueldo') || c.includes('ingreso')) return '💵';
    return '🛍️';
  }

  // --- SETTINGS RENDERING ---
  renderSettings() {
    const settings = store.getSettings();

    const providerSelect = document.getElementById('settingProvider');
    if (providerSelect) providerSelect.value = settings.provider || 'gemini';

    const geminiInput = document.getElementById('settingGeminiKey');
    if (geminiInput) geminiInput.value = settings.apiKey || '';

    const modelSelect = document.getElementById('settingGeminiModel');
    if (modelSelect) modelSelect.value = settings.geminiModel || 'gemini-2.5-flash';

    const openaiInput = document.getElementById('settingOpenaiKey');
    if (openaiInput) openaiInput.value = settings.openaiApiKey || '';

    const currencySelect = document.getElementById('settingCurrency');
    if (currencySelect) currencySelect.value = settings.currency || 'MXN';

    const userNameInput = document.getElementById('settingUserName');
    if (userNameInput) userNameInput.value = settings.userName || 'Usuario';

    const defaultReminderSelect = document.getElementById('settingDefaultReminder');
    if (defaultReminderSelect) defaultReminderSelect.value = String(settings.defaultReminderMinutes ?? 15);

    const notifyOnStartCheck = document.getElementById('settingNotifyOnStart');
    if (notifyOnStartCheck) notifyOnStartCheck.checked = settings.notifyOnStart !== false;

    // Show/hide groups based on provider
    const geminiKeyGroup = document.getElementById('geminiKeyGroup');
    const geminiModelGroup = document.getElementById('geminiModelGroup');
    const openaiKeyGroup = document.getElementById('openaiKeyGroup');

    if (geminiKeyGroup && openaiKeyGroup) {
      if (settings.provider === 'gemini') {
        geminiKeyGroup.style.display = 'block';
        if (geminiModelGroup) geminiModelGroup.style.display = 'block';
        openaiKeyGroup.style.display = 'none';
      } else if (settings.provider === 'openai') {
        geminiKeyGroup.style.display = 'none';
        if (geminiModelGroup) geminiModelGroup.style.display = 'none';
        openaiKeyGroup.style.display = 'block';
      } else {
        geminiKeyGroup.style.display = 'none';
        if (geminiModelGroup) geminiModelGroup.style.display = 'none';
        openaiKeyGroup.style.display = 'none';
      }
    }

    // Show saved key status
    const geminiKeyStatus = document.getElementById('geminiKeyStatus');
    if (geminiKeyStatus) {
      if (settings.apiKey && settings.provider === 'gemini') {
        const maskedKey = settings.apiKey.slice(0, 8) + '••••••••' + settings.apiKey.slice(-4);
        geminiKeyStatus.innerHTML = `<span style="color: var(--accent-emerald); font-weight: 600;">✓ Key guardada: ${maskedKey}</span>`;
      } else if (settings.provider === 'gemini') {
        geminiKeyStatus.innerHTML = `<span style="color: var(--text-muted);">Sin key guardada — modo local activo.</span>`;
      } else {
        geminiKeyStatus.innerHTML = '';
      }
    }
  }
}

// Bootstrap app on DOMContentLoaded
window.addEventListener('DOMContentLoaded', () => {
  new JarvisApp();
});
