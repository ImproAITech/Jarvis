// Tool implementations corresponding directly to the Jarvis system prompt schema
import { store } from './store.js';

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

// Calendar Tools
export const calendarTools = {
  create_calendar_event({ title, start_time, end_time, description = '', location = '' }) {
    if (!title) {
      return { success: false, message: 'Falta el título del evento.' };
    }
    const start = start_time ? new Date(start_time) : new Date();
    const end = end_time ? new Date(end_time) : new Date(start.getTime() + 60 * 60 * 1000);

    const created = store.addEvent({
      title,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      description,
      location
    });

    return {
      success: true,
      event: created,
      summary: `📅 Evento agendado: "${title}" para el ${formatDateTime(created.start_time)}.`
    };
  },

  get_calendar_events({ start_date, end_date } = {}) {
    const allEvents = store.getEvents();
    const start = start_date ? new Date(start_date).getTime() : 0;
    const end = end_date ? new Date(end_date).getTime() : Infinity;

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

    const txDate = date ? new Date(date).toISOString() : new Date().toISOString();
    const finalCategory = category || (type === 'income' ? 'Ingresos' : 'Varios');

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
        title: { type: 'STRING', description: 'Título o motivo del evento (ej. Cita con el dentista)' },
        start_time: { type: 'STRING', description: 'Fecha y hora de inicio en formato ISO 8601 (ej. 2026-09-21T10:00:00)' },
        end_time: { type: 'STRING', description: 'Fecha y hora de fin en formato ISO 8601 (ej. 2026-09-21T11:00:00)' },
        description: { type: 'STRING', description: 'Detalles o notas adicionales' },
        location: { type: 'STRING', description: 'Ubicación física o enlace virtual' }
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
        category: { type: 'STRING', description: 'Categoría (ej. Comida / Alimentación, Transporte, Servicios, Entretenimiento, Salud, Sueldo)' },
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
