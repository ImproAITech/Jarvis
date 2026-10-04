// Tool implementations corresponding directly to the Jarvis system prompt schema
import { store } from './store.js';
import { notificationManager } from './notifications.js';

// Format currency helper
export function formatCurrency(amount, currency = 'MXN') {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 2
  }).format(amount);
}

// Format readable date
export function formatDateTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

// Safely parse a date/time string into a local Date without UTC offset shifts
export function parseToLocalDate(dateStr) {
  if (!dateStr) return new Date();
  if (dateStr instanceof Date) return dateStr;

  const str = String(dateStr).trim();

  // If the string explicitly has a timezone indicator (UTC 'Z' or +/-HH:mm offset),
  // native Date correctly converts it to the user's local timezone.
  if (str.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(str)) {
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) return parsed;
  }

  // Date-only: "YYYY-MM-DD" -> default to 09:00 AM local time
  const dateOnlyMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const [, y, m, d] = dateOnlyMatch;
    return new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10), 9, 0, 0);
  }

  // Date with local time: "YYYY-MM-DDTHH:mm:ss" without timezone offset
  const dtMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (dtMatch) {
    const [, y, m, d, h, min, s] = dtMatch;
    return new Date(
      parseInt(y, 10),
      parseInt(m, 10) - 1,
      parseInt(d, 10),
      parseInt(h, 10),
      parseInt(min, 10),
      s ? parseInt(s, 10) : 0
    );
  }

  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

// Calendar Tools
export const calendarTools = {
  create_calendar_event({ title, start_time, end_time, description = '', location = '', reminder_minutes }) {
    if (!title) {
      return { success: false, message: 'Falta el título del evento.' };
    }
    const start = parseToLocalDate(start_time);
    const end = end_time ? parseToLocalDate(end_time) : new Date(start.getTime() + 60 * 60 * 1000);

    const settings = store.getSettings();
    const defaultRem = settings.defaultReminderMinutes !== undefined ? parseInt(settings.defaultReminderMinutes, 10) : 15;
    const finalReminder = reminder_minutes !== undefined && reminder_minutes !== null
      ? parseInt(reminder_minutes, 10)
      : defaultRem;

    const created = store.addEvent({
      title,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      description,
      location,
      reminder_minutes: finalReminder
    });

    let remText = '';
    if (finalReminder > 0) {
      if (finalReminder >= 1440) remText = ` (Aviso: ${Math.round(finalReminder / 1440)} día antes)`;
      else if (finalReminder >= 60) remText = ` (Aviso: ${Math.round(finalReminder / 60)} hora antes)`;
      else remText = ` (Aviso: ${finalReminder} min antes)`;
    } else if (finalReminder === 0) {
      remText = ' (Aviso: Al comenzar)';
    }

    // Schedule a server-side push reminder (works even when app is closed)
    if (finalReminder !== -1) {
      notificationManager.scheduleServerReminder(created, finalReminder).catch(e =>
        console.warn('[tools] No se pudo programar recordatorio en servidor:', e)
      );
    }

    return {
      success: true,
      event: created,
      summary: `📅 Evento agendado: "${title}" para el ${formatDateTime(created.start_time)}${remText}.`
    };
  },

  get_calendar_events({ start_date, end_date } = {}) {
    const allEvents = store.getEvents();
    const start = start_date ? parseToLocalDate(start_date).getTime() : 0;
    const end = end_date ? parseToLocalDate(end_date).getTime() : Infinity;

    const filtered = allEvents.filter(e => {
      const eTime = new Date(e.start_time).getTime();
      return eTime >= start && eTime <= end;
    });

    return {
      success: true,
      count: filtered.length,
      events: filtered,
      summary: filtered.length > 0
        ? `Se encontraron ${filtered.length} evento(s).`
        : 'No hay eventos programados en este rango.'
    };
  },

  delete_calendar_event({ event_id }) {
    if (!event_id) {
      return { success: false, message: 'Se requiere el ID del evento.' };
    }
    const deleted = store.deleteEvent(event_id);
    if (!deleted) {
      return { success: false, message: `No se encontró el evento con ID: ${event_id}` };
    }
    return {
      success: true,
      deleted,
      summary: `🗑️ Evento "${deleted.title}" cancelado correctamente.`
    };
  }
};

// Finance Tools
export const financeTools = {
  add_transaction({ type = 'expense', amount, category, description = '', date }) {
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return { success: false, message: 'Monto inválido. Debe ser un número mayor a 0.' };
    }

    const txDate = date ? parseToLocalDate(date).toISOString() : new Date().toISOString();
    const finalCategory = (category || (type === 'income' ? 'Ingresos / Sueldo' : 'Otros')).trim();

    const created = store.addTransaction({
      type,
      amount: numericAmount,
      category: finalCategory,
      description: description || finalCategory,
      date: txDate
    });

    const curr = store.getSettings().currency || 'MXN';
    const typeLabel = type === 'income' ? 'Ingreso' : 'Gasto';
    const icon = type === 'income' ? '🟢' : '🔴';

    return {
      success: true,
      transaction: created,
      summary: `${icon} Registrado: ${typeLabel} de ${formatCurrency(numericAmount, curr)} en ${finalCategory} (${created.description}).`
    };
  },

  get_financial_summary({ period = 'this_month', start_date, end_date } = {}) {
    const allTxs = store.getTransactions();
    const now = new Date();
    let filterStart = new Date(0);
    let filterEnd = new Date(8640000000000000);

    if (period === 'today') {
      filterStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      filterEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    } else if (period === 'this_week') {
      const day = now.getDay() || 7; // Sunday is 7 in ISO
      filterStart = new Date(now);
      filterStart.setDate(now.getDate() - day + 1);
      filterStart.setHours(0, 0, 0, 0);
      filterEnd = new Date(filterStart);
      filterEnd.setDate(filterStart.getDate() + 6);
      filterEnd.setHours(23, 59, 59, 999);
    } else if (period === 'this_month') {
      filterStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      filterEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    } else if (period === 'custom' && start_date) {
      filterStart = new Date(start_date);
      if (end_date) filterEnd = new Date(end_date);
    }

    const filtered = allTxs.filter(tx => {
      const t = new Date(tx.date).getTime();
      return t >= filterStart.getTime() && t <= filterEnd.getTime();
    });

    let totalIncome = 0;
    let totalExpense = 0;
    const categoryBreakdown = {};

    filtered.forEach(tx => {
      if (tx.type === 'income') {
        totalIncome += tx.amount;
      } else {
        totalExpense += tx.amount;
        categoryBreakdown[tx.category] = (categoryBreakdown[tx.category] || 0) + tx.amount;
      }
    });

    const balance = totalIncome - totalExpense;
    const curr = store.getSettings().currency || 'MXN';

    return {
      success: true,
      period,
      total_income: totalIncome,
      total_expense: totalExpense,
      balance,
      category_breakdown: categoryBreakdown,
      transaction_count: filtered.length,
      summary: `Resumen (${period}): Ingresos: ${formatCurrency(totalIncome, curr)} | Gastos: ${formatCurrency(totalExpense, curr)} | Balance: ${formatCurrency(balance, curr)}.`
    };
  },

  get_transactions({ category, limit = 10 } = {}) {
    let list = store.getTransactions();
    if (category) {
      list = list.filter(t => t.category.toLowerCase().includes(category.toLowerCase()));
    }
    const results = list.slice(0, limit);
    return {
      success: true,
      count: results.length,
      transactions: results,
      summary: `Se encontraron ${results.length} transacciones recientes.`
    };
  }
};

// Unified dispatcher
export function executeTool(toolName, args) {
  if (calendarTools[toolName]) {
    return calendarTools[toolName](args);
  }
  if (financeTools[toolName]) {
    return financeTools[toolName](args);
  }
  return { success: false, message: `Herramienta desconocida: ${toolName}` };
}

// Declarations for Gemini API Function Calling
export const geminiToolDeclarations = [
  {
    name: 'create_calendar_event',
    description: 'Crea un nuevo evento o recordatorio en el calendario del usuario.',
    parameters: {
      type: 'OBJECT',
      properties: {
        title: { type: 'STRING', description: 'Título o motivo del evento (ej. Cita con el dentista, Junta de equipo)' },
        start_time: { type: 'STRING', description: 'Fecha y hora local de inicio en formato ISO sin Z (ej. 2026-09-22T10:00:00). Nunca uses UTC ni agregues sufijo Z.' },
        end_time: { type: 'STRING', description: 'Fecha y hora local de fin en formato ISO sin Z (ej. 2026-09-22T11:00:00)' },
        description: { type: 'STRING', description: 'Detalles o notas adicionales' },
        location: { type: 'STRING', description: 'Ubicación física o enlace virtual' },
        reminder_minutes: { type: 'INTEGER', description: 'Minutos de anticipación para avisar al usuario (ej. 5, 10, 15, 30, 60 para 1h, 120 para 2h, 1440 para 1 día, 0 para al comenzar). Si el usuario no menciona tiempo de aviso específico, no envíes este parámetro.' }
      },
      required: ['title', 'start_time']
    }
  },
  {
    name: 'get_calendar_events',
    description: 'Consulta eventos programados dentro de un rango de fechas.',
    parameters: {
      type: 'OBJECT',
      properties: {
        start_date: { type: 'STRING', description: 'Fecha/hora inicio del rango en ISO 8601' },
        end_date: { type: 'STRING', description: 'Fecha/hora fin del rango en ISO 8601' }
      }
    }
  },
  {
    name: 'delete_calendar_event',
    description: 'Cancela o elimina un evento del calendario por su identificador.',
    parameters: {
      type: 'OBJECT',
      properties: {
        event_id: { type: 'STRING', description: 'ID del evento a cancelar' }
      },
      required: ['event_id']
    }
  },
  {
    name: 'add_transaction',
    description: 'Registra un gasto o ingreso financiero en la contabilidad personal.',
    parameters: {
      type: 'OBJECT',
      properties: {
        type: { type: 'STRING', enum: ['expense', 'income'], description: 'Tipo: expense para gasto, income para ingreso' },
        amount: { type: 'NUMBER', description: 'Monto numérico en la moneda local (ej. 150.50)' },
        category: { type: 'STRING', description: 'Categoría del movimiento. Puede ser una de las existentes o cualquier categoría personalizada que el usuario indique (ej. Comida / Alimentación, Transporte, Servicios, Entretenimiento, Salud, Sueldo, Gimnasio, Mascotas, Ropa, etc.)' },
        description: { type: 'STRING', description: 'Concepto o detalle breve del movimiento (ej. Tacos, Gasolina, Uber, Netflix)' },
        date: { type: 'STRING', description: 'Fecha del movimiento en ISO 8601' }
      },
      required: ['type', 'amount', 'category', 'description']
    }
  },
  {
    name: 'get_financial_summary',
    description: 'Calcula el balance y resumen de ingresos y gastos de un periodo.',
    parameters: {
      type: 'OBJECT',
      properties: {
        period: { type: 'STRING', enum: ['today', 'this_week', 'this_month', 'custom'], description: 'Periodo a consultar' },
        start_date: { type: 'STRING', description: 'Fecha inicio si period es custom' },
        end_date: { type: 'STRING', description: 'Fecha fin si period es custom' }
      },
      required: ['period']
    }
  },
  {
    name: 'get_transactions',
    description: 'Obtiene lista de transacciones recientes filtradas opcionalmente por categoría.',
    parameters: {
      type: 'OBJECT',
      properties: {
        category: { type: 'STRING', description: 'Categoría opcional para filtrar' },
        limit: { type: 'INTEGER', description: 'Número máximo de transacciones (por defecto 10)' }
      }
    }
  }
];

// Declarations for OpenAI Tools
export const openaiToolDeclarations = geminiToolDeclarations.map(tool => ({
  type: 'function',
  function: {
    name: tool.name,
    description: tool.description,
    parameters: {
      type: 'object',
      properties: tool.parameters.properties,
      required: tool.parameters.required || []
    }
  }
}));
