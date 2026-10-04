// AI Dispatcher: Supports Google Gemini API, OpenAI API, and an offline Smart Local Assistant
import { store } from './store.js';
import { executeTool, geminiToolDeclarations, openaiToolDeclarations } from './tools.js';

export function getSystemInstruction() {
  const now = new Date();
  const daysOfWeek = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const dayName = daysOfWeek[now.getDay()];

  const pad = n => String(n).padStart(2, '0');
  const yyyy = now.getFullYear();
  const mm = pad(now.getMonth() + 1);
  const dd = pad(now.getDate());
  const hours = pad(now.getHours());
  const mins = pad(now.getMinutes());

  const todayStr = `${yyyy}-${mm}-${dd}`;

  // Tomorrow
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const tomorrowStr = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}`;
  const tomorrowDayName = daysOfWeek[tomorrow.getDay()];

  // Day after tomorrow
  const dayAfter = new Date(now);
  dayAfter.setDate(now.getDate() + 2);
  const dayAfterStr = `${dayAfter.getFullYear()}-${pad(dayAfter.getMonth() + 1)}-${pad(dayAfter.getDate())}`;
  const dayAfterName = daysOfWeek[dayAfter.getDay()];

  const expenseCats = store.getExpenseCategories().join(', ');
  const incomeCats = store.getIncomeCategories().join(', ');

  return `Eres Jarvis, un asistente personal de IA integrado en un entorno móvil (iPhone).
Tu objetivo es ayudar al usuario a gestionar su vida diaria con máxima rapidez, precisión y tono natural en español.
Tienes acceso directo a herramientas para interactuar con su Calendario y su sistema de Finanzas Personales.

CONTEXTO TEMPORAL LOCAL (ZONA HORARIA DEL DISPOSITIVO DEL USUARIO):
- HOY es: ${dayName.toUpperCase()}, ${dd}/${mm}/${yyyy}.
- Hora actual local: ${hours}:${mins} (formato 24h).
- Fecha de HOY (YYYY-MM-DD): ${todayStr}
- Fecha de MAÑANA (${tomorrowDayName}): ${tomorrowStr}
- Fecha de PASADO MAÑANA (${dayAfterName}): ${dayAfterStr}

REGLAS CRÍTICAS PARA FECHAS Y CALENDARIO:
1. SIEMPRE toma la fecha de HOY (${todayStr}) y hora local (${hours}:${mins}) como punto de referencia absoluto.
2. Formato del parámetro 'start_time' y 'end_time' en 'create_calendar_event':
   - DEBEN ser siempre en formato ISO local SIN letra Z al final: "YYYY-MM-DDTHH:mm:ss".
   - Ejemplo para mañana a las 4pm: "${tomorrowStr}T16:00:00".
   - Si no especifican hora (ej. "agenda reunión el viernes"), usa por defecto las 09:00:00 ("${todayStr}T09:00:00").
   - NUNCA agregues sufijo 'Z' (UTC) ni calcules desfases de zona horaria; usa directamente la fecha y hora local del usuario.
3. Expresiones relativas:
   - "hoy" -> ${todayStr}
   - "mañana" -> ${tomorrowStr}
   - "pasado mañana" -> ${dayAfterStr}
   - Días específicos (ej. "el viernes", "el próximo lunes"): calcula la fecha exacta sumando los días necesarios a partir de HOY (${dayName} ${todayStr}).
4. Tiempo de anticipación para recordatorios ('reminder_minutes'):
   - Si el usuario indica con cuánta anticipación quiere el aviso (ej. "avísame 30 minutos antes", "recuérdame 1 hora antes", "avísame 1 día antes", "avísame al comenzar"), calcula los minutos equivalentes (30, 60, 1440, 0) y pásalos en 'reminder_minutes'. Si no lo especifica, omite este parámetro.

REGLAS PARA FINANZAS:
- Categorías de gasto configuradas por el usuario: ${expenseCats}.
- Categorías de ingreso configuradas por el usuario: ${incomeCats}.
- Al registrar un movimiento con 'add_transaction':
  1. SOLO usa categorías de la lista del usuario. Nunca inventes o crees una nueva categoría.
  2. Si el usuario menciona algo que encaja parcialmente con una categoría (ej. "tacos" -> "Comida / Alimentación"), mápalo a la más cercana.
  3. Si no puedes deducir la categoría correcta de la lista, llama igual al tool con el nombre que dijo el usuario y el sistema preguntará al usuario cuál usar.
  4. Extrae siempre el monto numérico y la descripción. Moneda por defecto: MXN.

REGLAS DE VELOCIDAD Y RESPUESTA:
- Sé conciso, breve y directo. El usuario te lee en la pantalla de su iPhone.`;
}

// Local NLP parser for immediate offline or key-free usage
function parseLocalIntent(userInput) {
  const text = userInput.toLowerCase().trim();
  const now = new Date();

  // 1. Finance: Expense detection
  // e.g. "gasté 250 pesos en gasolina", "pagué 100 de tacos", "compré café por 65"
  const expenseMatch = text.match(/(?:gast[eé]|pagu[eé]|compr[eé]|consum[ií]|gasto de)\s*\$?(\d+(?:\.\d+)?)\s*(?:pesos|mxn|\$)?\s*(?:en|de|por)?\s*([^.,\n]+)?/i) ||
                       text.match(/(\d+(?:\.\d+)?)\s*(?:pesos|mxn|\$)?\s*(?:en|de)\s*([^.,\n]+)/i);

  if (expenseMatch && !text.includes('balance') && !text.includes('resumen')) {
    const amount = parseFloat(expenseMatch[1]);
    let rawDesc = (expenseMatch[2] || 'Varios').trim();
    rawDesc = rawDesc.replace(/\b(hace un rato|hoy|ayer|en la tarde)\b/gi, '').trim();

    // Infer or match category
    const userExpenseCats = store.getExpenseCategories();
    let category = 'Otros';
    const textLower = text.toLowerCase();
    const descLower = rawDesc.toLowerCase();

    // Direct match with custom categories
    const directMatch = userExpenseCats.find(c => {
      const cl = c.toLowerCase();
      return textLower.includes(cl) || descLower.includes(cl);
    });

    if (directMatch) {
      category = directMatch;
    } else if (/tacos|comida|cena|almuerzo|café|restaurante|pizza|hamburguesa|sushi|oxxo|desayuno/i.test(descLower)) {
      category = userExpenseCats.find(c => /comida|aliment/i.test(c)) || 'Comida / Alimentación';
    } else if (/gasolina|gas|uber|didi|taxi|metro|pasaje|estacionamiento|peaje/i.test(descLower)) {
      category = userExpenseCats.find(c => /transporte/i.test(c)) || 'Transporte';
    } else if (/luz|cfe|agua|internet|teléfono|renta|gas natural|netflix|spotify/i.test(descLower)) {
      category = userExpenseCats.find(c => /servicio/i.test(c)) || 'Servicios';
    } else if (/cine|juego|salida|bar|cerveza|fiesta/i.test(descLower)) {
      category = userExpenseCats.find(c => /entretenimiento/i.test(c)) || 'Entretenimiento';
    } else if (/medicina|doctor|farmacia|consulta|dentista/i.test(descLower)) {
      category = userExpenseCats.find(c => /salud/i.test(c)) || 'Salud';
    } else if (rawDesc && rawDesc !== 'Varios' && rawDesc.length <= 30) {
      category = rawDesc.charAt(0).toUpperCase() + rawDesc.slice(1);
    }

    const toolResult = executeTool('add_transaction', {
      type: 'expense',
      amount,
      category,
      description: rawDesc || 'Gasto registrado',
      date: now.toISOString()
    });

    return {
      handled: true,
      toolResult: {
        name: 'add_transaction',
        args: { type: 'expense', amount, category, description: rawDesc },
        result: toolResult
      },
      response: `Registrado: Gasto de $${amount} en ${category} (${rawDesc || 'Gasto'}).`
    };
  }

  // 2. Finance: Income detection
  // e.g. "ingresé 5000", "me pagaron 3000 de sueldo", "recibí 1200"
  const incomeMatch = text.match(/(?:ingres[eé]|recib[ií]|me pagaron|cobro de|abono de)\s*\$?(\d+(?:\.\d+)?)\s*(?:pesos|mxn|\$)?\s*(?:en|de|por)?\s*([^.,\n]+)?/i);
  if (incomeMatch) {
    const amount = parseFloat(incomeMatch[1]);
    const rawDesc = (incomeMatch[2] || 'Ingreso general').trim();
    const userIncomeCats = store.getIncomeCategories();
    let category = userIncomeCats[0] || 'Ingresos / Sueldo';
    const directIncomeMatch = userIncomeCats.find(c =>
      text.toLowerCase().includes(c.toLowerCase()) || rawDesc.toLowerCase().includes(c.toLowerCase())
    );
    if (directIncomeMatch) {
      category = directIncomeMatch;
    } else if (rawDesc && rawDesc !== 'Ingreso general' && rawDesc.length <= 30 && !/sueldo|honorarios/i.test(rawDesc)) {
      category = rawDesc.charAt(0).toUpperCase() + rawDesc.slice(1);
    }

    const toolResult = executeTool('add_transaction', {
      type: 'income',
      amount,
      category,
      description: rawDesc,
      date: now.toISOString()
    });
    return {
      handled: true,
      toolResult: {
        name: 'add_transaction',
        args: { type: 'income', amount, category, description: rawDesc },
        result: toolResult
      },
      response: `Registrado: Ingreso de $${amount} en ${category} (${rawDesc}).`
    };
  }

  // 3. Finance: Summary / Balance
  if (/balance|finanzas|resumen|cu[aá]nto he gastado|cu[aá]nto dinero tengo|c[oó]mo van mis gastos/i.test(text)) {
    let period = 'this_month';
    if (text.includes('hoy')) period = 'today';
    else if (text.includes('semana')) period = 'this_week';

    const toolResult = executeTool('get_financial_summary', { period });
    const curr = store.getSettings().currency || 'MXN';
    return {
      handled: true,
      toolResult: {
        name: 'get_financial_summary',
        args: { period },
        result: toolResult
      },
      response: `Tu balance de ${period === 'today' ? 'hoy' : period === 'this_week' ? 'esta semana' : 'este mes'} es de $${toolResult.balance.toFixed(2)} ${curr} (Ingresos: $${toolResult.total_income.toFixed(2)}, Gastos: $${toolResult.total_expense.toFixed(2)}).`
    };
  }

  // 4. Calendar: Events query
  // e.g. "¿qué tengo mañana?", "¿cuál es mi agenda de hoy?"
  if (/(?:qu[eé] tengo|agenda|eventos|reuniones|citas|calendario)\b/i.test(text)) {
    let start = new Date(now);
    let end = new Date(now);

    if (text.includes('mañana')) {
      start.setDate(now.getDate() + 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(now.getDate() + 1);
      end.setHours(23, 59, 59, 999);
    } else if (text.includes('semana')) {
      start.setHours(0, 0, 0, 0);
      end.setDate(now.getDate() + 7);
      end.setHours(23, 59, 59, 999);
    } else {
      // today
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    }

    const toolResult = executeTool('get_calendar_events', {
      start_date: start.toISOString(),
      end_date: end.toISOString()
    });

    if (toolResult.events.length === 0) {
      return {
        handled: true,
        toolResult: {
          name: 'get_calendar_events',
          args: { start_date: start.toISOString(), end_date: end.toISOString() },
          result: toolResult
        },
        response: 'No tienes eventos programados para ese periodo. Tu agenda está libre.'
      };
    }

    const listStr = toolResult.events
      .map(e => `• ${new Date(e.start_time).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })} - ${e.title}`)
      .join('\n');

    return {
      handled: true,
      toolResult: {
        name: 'get_calendar_events',
        args: { start_date: start.toISOString(), end_date: end.toISOString() },
        result: toolResult
      },
      response: `Tienes ${toolResult.events.length} evento(s):\n${listStr}`
    };
  }

  // 5. Calendar: Create event
  // e.g. "agendar reunión con Juan mañana a las 10am", "crear cita dentista el viernes a las 4pm", "agenda junta hoy a las 5pm"
  if (/(?:agend|crear evento|crear recordatorio|recordatorio|nueva cita|programar|poner evento)\b/i.test(text)) {
    const daysOfWeek = [
      { name: 'domingo', day: 0 },
      { name: 'lunes', day: 1 },
      { name: 'martes', day: 2 },
      { name: 'miércoles', day: 3 },
      { name: 'miercoles', day: 3 },
      { name: 'jueves', day: 4 },
      { name: 'viernes', day: 5 },
      { name: 'sábado', day: 6 },
      { name: 'sabado', day: 6 }
    ];

    let targetDate = new Date(now);
    let workingText = text;

    // Relative day extraction
    if (/\bpasado\s+mañana\b/i.test(workingText)) {
      targetDate.setDate(targetDate.getDate() + 2);
      workingText = workingText.replace(/\bpasado\s+mañana\b/gi, '');
    } else if (/\bmañana\b/i.test(workingText)) {
      targetDate.setDate(targetDate.getDate() + 1);
      workingText = workingText.replace(/\bmañana\b/gi, '');
    } else if (/\bhoy\b/i.test(workingText)) {
      workingText = workingText.replace(/\bhoy\b/gi, '');
    } else {
      // Check named weekdays
      for (const w of daysOfWeek) {
        const regex = new RegExp(`\\b(?:el\\s+)?(?:pr[oó]ximo\\s+)?${w.name}\\b`, 'i');
        if (regex.test(workingText)) {
          const currentDay = now.getDay();
          let diff = w.day - currentDay;
          if (diff <= 0) diff += 7; // Next occurrence
          targetDate.setDate(targetDate.getDate() + diff);
          workingText = workingText.replace(regex, '');
          break;
        }
      }
    }

    // Time parsing (e.g. 4pm, 10:30am, a las 15:00, 5 de la tarde)
    const timeMatch = workingText.match(/(?:a\s+las?|de\s+las?)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm|de la mañana|de la tarde|de la noche)?/i) ||
                      workingText.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);

    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10);
      const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      const modifier = (timeMatch[3] || '').toLowerCase();

      if ((modifier === 'pm' || modifier.includes('tarde') || modifier.includes('noche')) && hours < 12) {
        hours += 12;
      } else if ((modifier === 'am' || modifier.includes('mañana')) && hours === 12) {
        hours = 0;
      }
      targetDate.setHours(hours, minutes, 0, 0);
      workingText = workingText.replace(timeMatch[0], '');
    } else {
      // Default to 10:00 AM
      targetDate.setHours(10, 0, 0, 0);
    }

    // Reminder extraction (e.g. "avísame 30 minutos antes", "recuérdame 1 hora antes")
    let reminderMinutes = undefined;
    const reminderMatch = workingText.match(/(?:av[ií]same|recu[eé]rdame|notif[ií]came|alerta)\s*(?:con)?\s*(\d+)?\s*(min(?:uto)?s?|h(?:ora)?s?|d[ií]a?s?)?\s*antes/i) ||
                          workingText.match(/(?:av[ií]same|recu[eé]rdame)\s*al\s*(?:momento|comenzar|iniciar)/i);
    if (reminderMatch) {
      if (/al\s*(?:momento|comenzar|iniciar)/i.test(reminderMatch[0])) {
        reminderMinutes = 0;
      } else {
        const qty = parseInt(reminderMatch[1] || '15', 10);
        const unit = (reminderMatch[2] || 'min').toLowerCase();
        if (unit.startsWith('h')) reminderMinutes = qty * 60;
        else if (unit.startsWith('d')) reminderMinutes = qty * 1440;
        else reminderMinutes = qty;
      }
      workingText = workingText.replace(reminderMatch[0], '');
    }

    // Clean title
    let title = workingText
      .replace(/^(?:agend(?:ar|ame)?|crear evento|crear recordatorio|recordatorio|nueva cita|programar|poner evento)\s*(?:de|un|una)?\s*/i, '')
      .replace(/\b(?:para|el|en|a|las)\b/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!title || title.length < 2) title = 'Evento';
    title = title.charAt(0).toUpperCase() + title.slice(1);

    const endTarget = new Date(targetDate.getTime() + 60 * 60 * 1000);

    const toolResult = executeTool('create_calendar_event', {
      title,
      start_time: targetDate.toISOString(),
      end_time: endTarget.toISOString(),
      reminder_minutes: reminderMinutes
    });

    const dateFormatted = targetDate.toLocaleString('es-MX', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return {
      handled: true,
      toolResult: {
        name: 'create_calendar_event',
        args: { title, start_time: targetDate.toISOString(), reminder_minutes: reminderMinutes },
        result: toolResult
      },
      response: `Agendado: "${toolResult.event?.title || title}" para el ${dateFormatted}.`
    };
  }

  return { handled: false };
}

// Test Gemini API Key connectivity
export async function testGeminiApiKey(apiKey, model = 'gemini-2.5-flash') {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('Por favor ingresa tu API Key.');
  }
  const cleanKey = apiKey.trim();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cleanKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: 'Responde solo: "Conexión exitosa"' }]
        }
      ]
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const msg = errorData.error?.message || `Error en Gemini API (${response.status})`;
    if (msg.includes('API_KEY_INVALID') || response.status === 400) {
      throw new Error('API Key inválida. Revisa que esté copiada completa.');
    }
    throw new Error(msg);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Conexión exitosa';
}

// Call Google Gemini API
async function callGemini(userInput, apiKey) {
  const settings = store.getSettings();
  const model = settings.geminiModel || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;

  // Keep last 6 messages (3 conversation turns) to save tokens and quota.
  // IMPORTANT: Neutralize tool-call confirmation texts in model history so Gemini doesn't
  // think it already executed the action for a new user request.
  const TOOL_CONFIRM_RX = /^(?:🟢|🔴|💰|📅|✅)\s*Registrado:|^Registrado:|^Acción completada|^Evento creado/i;
  const chatHistory = store.getChatHistory().slice(-6).map(msg => {
    if (msg.sender !== 'user') {
      const isToolConfirm = TOOL_CONFIRM_RX.test(msg.text.trim());
      return {
        role: 'model',
        parts: [{ text: isToolConfirm ? 'Acción completada.' : msg.text }]
      };
    }
    return { role: 'user', parts: [{ text: msg.text }] };
  });

  const contents = [
    ...chatHistory,
    {
      role: 'user',
      parts: [{ text: userInput }]
    }
  ];

  // Force tool use when user message clearly contains an action intent
  const ACTION_RX = /\b(gast[eé]|pagu[eé]|compr[eé]|registr[a-z]+|anot[a-z]+|agrega|ingres[ao]|gano|gan[eé]|recib[ií]|pon(?:me)?|agend[a-z]+|cre[a-z]+\s+evento)\b/i;
  const forceTool = ACTION_RX.test(userInput);

  const payload = {
    contents,
    systemInstruction: {
      parts: [{ text: getSystemInstruction() }]
    },
    tools: [
      { functionDeclarations: geminiToolDeclarations }
    ],
    toolConfig: {
      // Use ANY to force a tool call when action intent is detected; otherwise AUTO
      functionCallingConfig: { mode: forceTool ? 'ANY' : 'AUTO' }
    },
    generationConfig: {
      // thinkingBudget: 0 makes Gemini 2.5 Flash respond in ~1-1.5s without multi-second internal chain-of-thought
      thinkingConfig: {
        thinkingBudget: 0
      },
      maxOutputTokens: 600,
      temperature: 0.2
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMsg = errorData.error?.message || `Error en Gemini API (${response.status})`;
    throw new Error(errorMsg);
  }

  const data = await response.json();
  const candidate = data.candidates?.[0];
  const content = candidate?.content;
  const parts = content?.parts || [];

  // Check for function calls
  const functionCallPart = parts.find(p => p.functionCall);

  if (functionCallPart) {
    const { name, args } = functionCallPart.functionCall;
    const toolOutput = executeTool(name, args);

    // If tool needs clarification (e.g. unknown category), return as plain text question
    if (toolOutput.needsClarification) {
      return {
        text: toolOutput.summary,
        toolCall: null
      };
    }

    // Return immediately with tool summary to save an extra API call (50% quota savings and 2x faster)
    return {
      text: toolOutput.summary || 'Acción completada con éxito.',
      toolCall: { name, args, result: toolOutput }
    };
  }

  // Pure text answer
  const textPart = parts.find(p => p.text);
  return {
    text: textPart?.text || 'Entendido. ¿Deseas hacer algo más?',
    toolCall: null
  };
}

// Call OpenAI API
async function callOpenAI(userInput, apiKey) {
  const url = 'https://api.openai.com/v1/chat/completions';
  const chatHistory = store.getChatHistory().slice(-4).map(msg => ({
    role: msg.sender === 'user' ? 'user' : 'assistant',
    content: msg.text
  }));

  const messages = [
    { role: 'system', content: getSystemInstruction() },
    ...chatHistory,
    { role: 'user', content: userInput }
  ];

  const payload = {
    model: 'gpt-4o-mini',
    messages,
    tools: openaiToolDeclarations,
    tool_choice: 'auto'
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Error en OpenAI API (${response.status})`);
  }

  const data = await response.json();
  const choice = data.choices?.[0];
  const message = choice?.message;

  if (message?.tool_calls && message.tool_calls.length > 0) {
    const toolCall = message.tool_calls[0];
    const name = toolCall.function.name;
    const args = JSON.parse(toolCall.function.arguments || '{}');
    const toolOutput = executeTool(name, args);

    // If tool needs clarification (e.g. unknown category), return as plain text question
    if (toolOutput.needsClarification) {
      return {
        text: toolOutput.summary,
        toolCall: null
      };
    }

    return {
      text: toolOutput.summary || 'Acción completada con éxito.',
      toolCall: { name, args, result: toolOutput }
    };
  }

  return {
    text: message?.content || 'Entendido. ¿En qué más puedo apoyarte?',
    toolCall: null
  };
}

// Main assistant handler
export async function sendMessageToJarvis(userInput) {
  const settings = store.getSettings();
  const trimmed = userInput.trim();

  // Try API first if configured
  if (settings.provider === 'gemini' && settings.apiKey) {
    try {
      return await callGemini(trimmed, settings.apiKey);
    } catch (err) {
      console.warn('Fallo en Gemini API, intentando procesador local:', err);
      const isQuotaError = /429|quota|resource_exhausted|rate limit/i.test(err.message || '');
      const localResult = parseLocalIntent(trimmed);
      if (localResult.handled) {
        const quotaNotice = isQuotaError
          ? '\n\n*(⚡ Procesado con motor local instantáneo debido al límite de cuota temporal de Gemini)*'
          : '';
        return {
          text: localResult.response + quotaNotice,
          toolCall: localResult.toolResult
        };
      }
      if (isQuotaError) {
        return {
          text: '⏳ Has alcanzado temporalmente el límite de peticiones de la API de Gemini (15 peticiones por minuto en cuenta gratuita).\n\nPor favor espera 30-60 segundos para volver a consultarlo, o utiliza frases directas como "Gasté $100 en comida" o "Agenda cita mañana a las 4pm" que funcionan localmente sin consumir cuota.',
          toolCall: null
        };
      }
      return {
        text: `⚠️ No pude conectar con Gemini (${err.message}). Por favor verifica tu API Key o conexión en Ajustes ⚙️.`,
        toolCall: null
      };
    }
  } else if (settings.provider === 'openai' && settings.openaiApiKey) {
    try {
      return await callOpenAI(trimmed, settings.openaiApiKey);
    } catch (err) {
      console.warn('Fallo en OpenAI API, intentando procesador local:', err);
      const localResult = parseLocalIntent(trimmed);
      if (localResult.handled) {
        return {
          text: localResult.response,
          toolCall: localResult.toolResult
        };
      }
      return {
        text: `⚠️ No pude conectar con OpenAI (${err.message}). Verifica tu API Key en Ajustes ⚙️.`,
        toolCall: null
      };
    }
  }

  // Local rule-based NLP parser
  const localResult = parseLocalIntent(trimmed);
  if (localResult.handled) {
    return {
      text: localResult.response,
      toolCall: localResult.toolResult
    };
  }

  // Friendly conversational fallback
  if (/hola|buen(?:os|as)|saludos|hey|jarvis/i.test(trimmed)) {
    return {
      text: '¡Hola! Estoy listo para ayudarte. Puedes pedirme registrar un gasto ("Gasté $150 en comida"), ver tu balance o agendar una cita en tu calendario.',
      toolCall: null
    };
  }

  if (/gracias|excelente|perfecto|ok/i.test(trimmed)) {
    return {
      text: 'Con gusto. Si necesitas registrar otro movimiento o revisar tu agenda, aquí estaré.',
      toolCall: null
    };
  }

  return {
    text: `Entendido. Para aprovechar toda mi potencia de razonamiento puedes agregar tu API Key de Gemini en Ajustes ⚙️.\n\nPuedes decirme cosas como:\n• "Gasté 180 pesos en gasolina"\n• "Agendar cita mañana a las 4pm"\n• "Ver balance del mes"`,
    toolCall: null
  };
}
