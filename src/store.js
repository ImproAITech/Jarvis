// Jarvis Data Store with LocalStorage persistence & event pub/sub

const STORAGE_KEYS = {
  EVENTS: 'jarvis_calendar_events',
  TRANSACTIONS: 'jarvis_finance_transactions',
  CHAT_HISTORY: 'jarvis_chat_history',
  SETTINGS: 'jarvis_user_settings',
  BUDGETS: 'jarvis_category_budgets',
  EXPENSE_CATEGORIES: 'jarvis_expense_categories',
  INCOME_CATEGORIES: 'jarvis_income_categories'
};

// Default categories shared across the app
export const DEFAULT_EXPENSE_CATEGORIES = [
  'Comida / Alimentación',
  'Transporte',
  'Servicios',
  'Entretenimiento',
  'Salud',
  'Otros'
];

export const DEFAULT_INCOME_CATEGORIES = [
  'Ingresos / Sueldo',
  'Inversiones',
  'Ventas',
  'Premios / Regalos',
  'Otros'
];

export const EXPENSE_CATEGORIES = DEFAULT_EXPENSE_CATEGORIES;

// Default seed data for initial rich experience
const getInitialEvents = () => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const formatIso = (date, hours, minutes) => {
    const d = new Date(date);
    d.setHours(hours, minutes, 0, 0);
    return d.toISOString();
  };

  return [
    {
      id: 'evt-seed-1',
      title: 'Reunión de Estrategia Semanal',
      start_time: formatIso(today, 10, 0),
      end_time: formatIso(today, 11, 0),
      description: 'Revisión de objetivos y avances de proyectos',
      location: 'Google Meet',
      created_at: new Date().toISOString()
    },
    {
      id: 'evt-seed-2',
      title: 'Cita Médica de Rutina',
      start_time: formatIso(tomorrow, 16, 30),
      end_time: formatIso(tomorrow, 17, 30),
      description: 'Checkup anual con el Dr. Martínez',
      location: 'Hospital Ángeles',
      created_at: new Date().toISOString()
    }
  ];
};

const getInitialTransactions = () => {
  const today = new Date();
  const d1 = new Date(today);
  d1.setHours(d1.getHours() - 4);
  const d2 = new Date(today);
  d2.setDate(d2.getDate() - 1);
  const d3 = new Date(today);
  d3.setDate(d3.getDate() - 3);

  return [
    {
      id: 'tx-seed-1',
      type: 'expense',
      amount: 145.50,
      category: 'Comida / Alimentación',
      description: 'Comida corrida con colegas',
      date: d1.toISOString()
    },
    {
      id: 'tx-seed-2',
      type: 'expense',
      amount: 420.00,
      category: 'Transporte',
      description: 'Carga de gasolina magna',
      date: d2.toISOString()
    },
    {
      id: 'tx-seed-3',
      type: 'income',
      amount: 8500.00,
      category: 'Ingresos / Sueldo',
      description: 'Pago de honorarios proyecto',
      date: d3.toISOString()
    },
    {
      id: 'tx-seed-4',
      type: 'expense',
      amount: 289.00,
      category: 'Servicios',
      description: 'Suscripción mensual streaming',
      date: d3.toISOString()
    }
  ];
};

const getInitialChat = () => [
  {
    id: 'msg-init-1',
    sender: 'jarvis',
    text: 'Hola. Soy Jarvis, tu asistente personal. Estoy listo para ayudarte con tu agenda y el control de tus finanzas. ¿En qué puedo apoyarte hoy?',
    timestamp: new Date().toISOString()
  }
];

export const VALID_GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.5-flash-lite'];

const getInitialSettings = () => ({
  apiKey: 'AQ.Ab8RN6I5y5JUhYnT-8JPoG0tUyWAOF2_gqTgoZehHrRlC63qFw',
  geminiModel: 'gemini-2.5-flash',
  openaiApiKey: '',
  provider: 'gemini',
  currency: 'MXN',
  userName: 'Usuario',
  voiceEnabled: false,
  defaultReminderMinutes: 15,
  notifyOnStart: true
});

class Store {
  constructor() {
    this.subscribers = [];
    this.init();
  }

  init() {
    if (!localStorage.getItem(STORAGE_KEYS.EVENTS)) {
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(getInitialEvents()));
    }
    if (!localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(getInitialTransactions()));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY)) {
      localStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(getInitialChat()));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(getInitialSettings()));
    }
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  notify(topic, data) {
    this.subscribers.forEach(cb => cb(topic, data));
  }

  // --- CALENDAR ---
  getEvents() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.EVENTS) || '[]');
    } catch {
      return [];
    }
  }

  saveEvents(events) {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
    this.notify('calendar', events);
  }

  addEvent(event) {
    const events = this.getEvents();
    const settings = this.getSettings();
    const defaultRem = settings.defaultReminderMinutes !== undefined ? parseInt(settings.defaultReminderMinutes, 10) : 15;
    const reminder = event.reminder_minutes !== undefined && event.reminder_minutes !== null
      ? parseInt(event.reminder_minutes, 10)
      : defaultRem;

    const newEvent = {
      id: event.id || `evt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      title: event.title || 'Sin título',
      start_time: event.start_time,
      end_time: event.end_time || event.start_time,
      description: event.description || '',
      location: event.location || '',
      reminder_minutes: reminder,
      created_at: new Date().toISOString()
    };
    events.push(newEvent);
    // Sort chronologically
    events.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
    this.saveEvents(events);
    return newEvent;
  }

  deleteEvent(id) {
    const events = this.getEvents();
    const filtered = events.filter(e => e.id !== id);
    const deleted = events.find(e => e.id === id);
    this.saveEvents(filtered);
    return deleted;
  }

  // --- FINANCES ---
  getTransactions() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS) || '[]');
    } catch {
      return [];
    }
  }

  saveTransactions(transactions) {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    this.notify('finance', transactions);
  }

  addTransaction(tx) {
    const transactions = this.getTransactions();
    const rawCat = (tx.category || (tx.type === 'income' ? 'Ingresos / Sueldo' : 'Otros')).trim();
    const isExpense = tx.type !== 'income';

    if (isExpense) {
      this.ensureExpenseCategory(rawCat);
    } else {
      this.ensureIncomeCategory(rawCat);
    }

    const newTx = {
      id: tx.id || `tx-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      type: isExpense ? 'expense' : 'income',
      amount: Number(tx.amount) || 0,
      category: rawCat,
      description: tx.description || 'Sin descripción',
      date: tx.date || new Date().toISOString()
    };
    transactions.unshift(newTx); // Newest first
    this.saveTransactions(transactions);
    return newTx;
  }

  deleteTransaction(id) {
    const transactions = this.getTransactions();
    const filtered = transactions.filter(t => t.id !== id);
    const deleted = transactions.find(t => t.id === id);
    this.saveTransactions(filtered);
    return deleted;
  }

  // --- CHAT HISTORY ---
  getChatHistory() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY) || '[]');
    } catch {
      return [];
    }
  }

  addChatMessage(message) {
    const history = this.getChatHistory();
    const newMsg = {
      id: message.id || `msg-${Date.now()}`,
      sender: message.sender, // 'user' | 'jarvis'
      text: message.text,
      timestamp: message.timestamp || new Date().toISOString(),
      toolCall: message.toolCall || null
    };
    history.push(newMsg);
    // Keep last 100 messages
    const trimmed = history.slice(-100);
    localStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(trimmed));
    this.notify('chat', newMsg);
    return newMsg;
  }

  clearChatHistory() {
    localStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(getInitialChat()));
    this.notify('chat_cleared', null);
  }

  // --- SETTINGS ---
  getSettings() {
    try {
      const defaults = getInitialSettings();
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || '{}');
      const merged = { ...defaults, ...stored };
      // Always use default key if stored key is empty
      if (!merged.apiKey) merged.apiKey = defaults.apiKey;
      // Auto-migrate old/deprecated model names to gemini-2.5-flash
      if (!VALID_GEMINI_MODELS.includes(merged.geminiModel)) {
        merged.geminiModel = 'gemini-2.5-flash';
      }
      return merged;
    } catch {
      return getInitialSettings();
    }
  }

  updateSettings(partial) {
    const current = this.getSettings();
    const updated = { ...current, ...partial };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    this.notify('settings', updated);
    return updated;
  }

  // --- BUDGETS ---
  getBudgets() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.BUDGETS) || '{}');
    } catch {
      return {};
    }
  }

  saveBudgets(budgets) {
    localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
    this.notify('budgets', budgets);
  }

  /**
   * Set the monthly budget limit for a category.
   * @param {string} category
   * @param {number|null} amount  — null removes the limit
   */
  setBudget(category, amount) {
    const budgets = this.getBudgets();
    if (amount === null || amount === undefined || isNaN(amount) || amount <= 0) {
      delete budgets[category];
    } else {
      budgets[category] = Number(amount);
    }
    this.saveBudgets(budgets);
    return budgets;
  }

  // --- CATEGORIES MANAGEMENT ---
  getExpenseCategories() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.EXPENSE_CATEGORIES) || 'null');
      if (Array.isArray(stored) && stored.length > 0) {
        return stored;
      }
    } catch {}
    return [...DEFAULT_EXPENSE_CATEGORIES];
  }

  saveExpenseCategories(categories) {
    const clean = Array.from(new Set(categories.map(c => String(c).trim()).filter(Boolean)));
    localStorage.setItem(STORAGE_KEYS.EXPENSE_CATEGORIES, JSON.stringify(clean));
    this.notify('expense_categories', clean);
    return clean;
  }

  addExpenseCategory(name) {
    const trimmed = String(name || '').trim();
    if (!trimmed) return this.getExpenseCategories();
    const current = this.getExpenseCategories();
    if (!current.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      current.push(trimmed);
      return this.saveExpenseCategories(current);
    }
    return current;
  }

  ensureExpenseCategory(name) {
    return this.addExpenseCategory(name);
  }

  deleteExpenseCategory(name) {
    const trimmed = String(name || '').trim().toLowerCase();
    const current = this.getExpenseCategories();
    const filtered = current.filter(c => c.toLowerCase() !== trimmed);
    this.saveExpenseCategories(filtered);

    // Also remove budget limit for this category if existed
    const budgets = this.getBudgets();
    let changed = false;
    for (const key of Object.keys(budgets)) {
      if (key.toLowerCase() === trimmed) {
        delete budgets[key];
        changed = true;
      }
    }
    if (changed) {
      this.saveBudgets(budgets);
    }
    return filtered;
  }

  getIncomeCategories() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.INCOME_CATEGORIES) || 'null');
      if (Array.isArray(stored) && stored.length > 0) {
        return stored;
      }
    } catch {}
    return [...DEFAULT_INCOME_CATEGORIES];
  }

  saveIncomeCategories(categories) {
    const clean = Array.from(new Set(categories.map(c => String(c).trim()).filter(Boolean)));
    localStorage.setItem(STORAGE_KEYS.INCOME_CATEGORIES, JSON.stringify(clean));
    this.notify('income_categories', clean);
    return clean;
  }

  addIncomeCategory(name) {
    const trimmed = String(name || '').trim();
    if (!trimmed) return this.getIncomeCategories();
    const current = this.getIncomeCategories();
    if (!current.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      current.push(trimmed);
      return this.saveIncomeCategories(current);
    }
    return current;
  }

  ensureIncomeCategory(name) {
    return this.addIncomeCategory(name);
  }

  deleteIncomeCategory(name) {
    const trimmed = String(name || '').trim().toLowerCase();
    const current = this.getIncomeCategories();
    const filtered = current.filter(c => c.toLowerCase() !== trimmed);
    return this.saveIncomeCategories(filtered);
  }

  // Reset all to sample factory
  resetAllData() {
    localStorage.removeItem(STORAGE_KEYS.EVENTS);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.CHAT_HISTORY);
    localStorage.removeItem(STORAGE_KEYS.BUDGETS);
    localStorage.removeItem(STORAGE_KEYS.EXPENSE_CATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.INCOME_CATEGORIES);
    this.init();
    this.notify('reset', null);
  }
}

export const store = new Store();
