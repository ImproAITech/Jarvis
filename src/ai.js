// AI Dispatcher: Supports Google Gemini API, OpenAI API, and an offline Smart Local Assistant
import { store } from './store.js';
import { executeTool, geminiToolDeclarations, openaiToolDeclarations } from './tools.js';

const SYSTEM_INSTRUCTION = `Eres Jarvis, un asistente personal de IA integrado en un entorno móvil (iPhone).
Tu objetivo es ayudar al usuario a gestionar su vida diaria con precisión, eficiencia y tono natural en español.
Tienes acceso directo a herramientas para interactuar con su Calendario y su sistema de Finanzas Personales.

CORE RESPONSIBILITIES:
1. Gestión de Calendario: Crear, consultar, actualizar y cancelar eventos o recordatorios.
2. Control Financiero: Registrar gastos/ingresos, consultar balances, categorizar movimientos y resumir hábitos de gasto (moneda predeterminada: MXN).
3. Interacción Conversacional: Responder de forma directa, concisa y empática, manteniendo el contexto de la conversación.

REGLAS OPERATIVAS:
- Prioridad de Herramientas: Si la solicitud del usuario requiere interactuar con el calendario o registrar/consultar finanzas, DEBES invocar la función correspondiente antes de responder.
- Extracción de Parámetros:
  - Fechas y Tiempos: Convierte expresiones relativas ("mañana a las 4pm", "el próximo viernes", "ayer") a fechas absolutas ISO8601 basadas en la fecha y hora actual: ${new Date().toISOString()}.
  - Moneda y Montos: Identifica el valor numérico.
  - Categorización Finanzas: Infiere la categoría más adecuada (ej. "Comida / Alimentación", "Transporte", "Servicios", "Entretenimiento", "Salud", "Ingresos", "Otros").
- Respuestas Concisas: El usuario te lee en la pantalla de su iPhone. Sé breve, claro y evita rodeos.
- Confirma siempre la ejecución exitosa de una herramienta mostrando los detalles clave (monto, fecha o título del evento).`;

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

    // Infer category
    let category = 'Otros';
    const descLower = rawDesc.toLowerCase();
    if (/tacos|comida|cena|almuerzo|café|restaurante|pizza|hamburguesa|sushi|oxxo|desayuno/i.test(descLower)) {
      category = 'Comida / Alimentación';
    } else if (/gasolina|gas|uber|didi|taxi|metro|pasaje|estacionamiento|peaje/i.test(descLower)) {
      category = 'Transporte';
    } else if (/luz|cfe|agua|internet|teléfono|renta|gas natural|netflix|spotify/i.test(descLower)) {
      category = 'Servicios';
    } else if (/cine|juego|salida|bar|cerveza|fiesta/i.test(descLower)) {
      category = 'Entretenimiento';
    } else if (/medicina|doctor|farmacia|consulta|dentista/i.test(descLower)) {
      category = 'Salud';
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
    const toolResult = executeTool('add_transaction', {
      type: 'income',
      amount,
      category: 'Ingresos',
      description: rawDesc,
      date: now.toISOString()
    });
    return {
      handled: true,
      toolResult: {
        name: 'add_transaction',
        args: { type: 'income', amount, category: 'Ingresos', description: rawDesc },
        result: toolResult
      },
      response: `Registrado: Ingreso de $${amount} (${rawDesc}).`
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
  // e.g. "agendar reunión con Juan mañana a las 10am", "crear cita dentista el viernes"
  if (/(?:agend|crear evento|recordatorio|nueva cita|programar)\b/i.test(text)) {
    let title = text.replace(/^(?:agend(?:ar|ame)?|crear evento|recordatorio|nueva cita|programar)\s*(?:de|un|una)?\s*/i, '');
    let targetDate = new Date(now);

    if (text.includes('mañana')) {
      targetDate.setDate(targetDate.getDate() + 1);
      title = title.replace(/\bmañana\b/gi, '');
    }

    // Time parsing (e.g. 4pm, 10:30am, a las 15:00)
    const timeMatch = text.match(/(?:a las?|de las?)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10);
      const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      const ampm = (timeMatch[3] || '').toLowerCase();
      if (ampm === 'pm' && hours < 12) hours += 12;
      if (ampm === 'am' && hours === 12) hours = 0;
      targetDate.setHours(hours, minutes, 0, 0);
      title = title.replace(timeMatch[0], '');
    } else {
      // Default 10:00 am next day
      targetDate.setHours(10, 0, 0, 0);
    }

    title = title.trim().replace(/^para\s*/i, '').replace(/^el\s*/i, '');
    if (!title) title = 'Evento programado';

    const endTarget = new Date(targetDate.getTime() + 60 * 60 * 1000);

    const toolResult = executeTool('create_calendar_event', {
      title: title.charAt(0).toUpperCase() + title.slice(1),
      start_time: targetDate.toISOString(),
      end_time: endTarget.toISOString()
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
        args: { title, start_time: targetDate.toISOString() },
        result: toolResult
      },
      response: `Agendado: "${toolResult.event.title}" para el ${dateFormatted}.`
    };
  }

  return { handled: false };
}

// Call Google Gemini API
async function callGemini(userInput, apiKey) {
  const model = store.getSettings().geminiModel || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const chatHistory = store.getChatHistory().slice(-8).map(msg => ({
    role: msg.sender === 'user' ? 'user' : 'model',
    parts: [{ text: msg.text }]
  }));

  const contents = [
    ...chatHistory,
    {
      role: 'user',
      parts: [{ text: userInput }]
    }
  ];

  const payload = {
    contents,
    systemInstruction: {
      parts: [{ text: SYSTEM_INSTRUCTION }]
    },
    tools: [
      { functionDeclarations: geminiToolDeclarations }
    ],
    toolConfig: {
      functionCallingConfig: { mode: 'AUTO' }
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Error en Gemini API (${response.status})`);
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

    // Call Gemini again with the tool result to get the conversational response
    const secondContents = [
      ...contents,
      {
        role: 'model',
        parts: [{ functionCall: functionCallPart.functionCall }]
      },
      {
        role: 'user',
        parts: [{
          functionResponse: {
            name,
            response: { content: toolOutput }
          }
        }]
      }
    ];

    const secondResponse = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: secondContents,
        systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] }
      })
    });

    if (secondResponse.ok) {
      const secondData = await secondResponse.json();
      const finalCandidate = secondData.candidates?.[0];
      const textPart = finalCandidate?.content?.parts?.find(p => p.text);
      if (textPart?.text) {
        return {
          text: textPart.text,
          toolCall: { name, args, result: toolOutput }
        };
      }
    }

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
  const chatHistory = store.getChatHistory().slice(-8).map(msg => ({
    role: msg.sender === 'user' ? 'user' : 'assistant',
    content: msg.text
  }));

  const messages = [
    { role: 'system', content: SYSTEM_INSTRUCTION },
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

    // Call OpenAI back with tool output
    const secondMessages = [
      ...messages,
      message,
      {
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(toolOutput)
      }
    ];

    const secondResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: secondMessages
      })
    });

    if (secondResponse.ok) {
      const secondData = await secondResponse.json();
      return {
        text: secondData.choices?.[0]?.message?.content || toolOutput.summary,
        toolCall: { name, args, result: toolOutput }
      };
    }

    return {
      text: toolOutput.summary,
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
      console.warn('Fallo en Gemini API, recurriendo a procesador local:', err);
      // Fall through to local parser
    }
  } else if (settings.provider === 'openai' && settings.openaiApiKey) {
    try {
      return await callOpenAI(trimmed, settings.openaiApiKey);
    } catch (err) {
      console.warn('Fallo en OpenAI API, recurriendo a procesador local:', err);
      // Fall through to local parser
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
