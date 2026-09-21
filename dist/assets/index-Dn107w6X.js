(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e={EVENTS:`jarvis_calendar_events`,TRANSACTIONS:`jarvis_finance_transactions`,CHAT_HISTORY:`jarvis_chat_history`,SETTINGS:`jarvis_user_settings`},t=()=>{let e=new Date,t=new Date(e);t.setDate(t.getDate()+1);let n=(e,t,n)=>{let r=new Date(e);return r.setHours(t,n,0,0),r.toISOString()};return[{id:`evt-seed-1`,title:`Reunión de Estrategia Semanal`,start_time:n(e,10,0),end_time:n(e,11,0),description:`Revisión de objetivos y avances de proyectos`,location:`Google Meet`,created_at:new Date().toISOString()},{id:`evt-seed-2`,title:`Cita Médica de Rutina`,start_time:n(t,16,30),end_time:n(t,17,30),description:`Checkup anual con el Dr. Martínez`,location:`Hospital Ángeles`,created_at:new Date().toISOString()}]},n=()=>{let e=new Date,t=new Date(e);t.setHours(t.getHours()-4);let n=new Date(e);n.setDate(n.getDate()-1);let r=new Date(e);return r.setDate(r.getDate()-3),[{id:`tx-seed-1`,type:`expense`,amount:145.5,category:`Comida / Alimentación`,description:`Comida corrida con colegas`,date:t.toISOString()},{id:`tx-seed-2`,type:`expense`,amount:420,category:`Transporte`,description:`Carga de gasolina magna`,date:n.toISOString()},{id:`tx-seed-3`,type:`income`,amount:8500,category:`Ingresos / Sueldo`,description:`Pago de honorarios proyecto`,date:r.toISOString()},{id:`tx-seed-4`,type:`expense`,amount:289,category:`Servicios`,description:`Suscripción mensual streaming`,date:r.toISOString()}]},r=()=>[{id:`msg-init-1`,sender:`jarvis`,text:`Hola. Soy Jarvis, tu asistente personal. Estoy listo para ayudarte con tu agenda y el control de tus finanzas. ¿En qué puedo apoyarte hoy?`,timestamp:new Date().toISOString()}],i=()=>({apiKey:``,geminiModel:`gemini-1.5-flash`,openaiApiKey:``,provider:`gemini`,currency:`MXN`,userName:`Usuario`,voiceEnabled:!1}),a=new class{constructor(){this.subscribers=[],this.init()}init(){localStorage.getItem(e.EVENTS)||localStorage.setItem(e.EVENTS,JSON.stringify(t())),localStorage.getItem(e.TRANSACTIONS)||localStorage.setItem(e.TRANSACTIONS,JSON.stringify(n())),localStorage.getItem(e.CHAT_HISTORY)||localStorage.setItem(e.CHAT_HISTORY,JSON.stringify(r())),localStorage.getItem(e.SETTINGS)||localStorage.setItem(e.SETTINGS,JSON.stringify(i()))}subscribe(e){return this.subscribers.push(e),()=>{this.subscribers=this.subscribers.filter(t=>t!==e)}}notify(e,t){this.subscribers.forEach(n=>n(e,t))}getEvents(){try{return JSON.parse(localStorage.getItem(e.EVENTS)||`[]`)}catch{return[]}}saveEvents(t){localStorage.setItem(e.EVENTS,JSON.stringify(t)),this.notify(`calendar`,t)}addEvent(e){let t=this.getEvents(),n={id:e.id||`evt-${Date.now()}-${Math.random().toString(36).substr(2,5)}`,title:e.title||`Sin título`,start_time:e.start_time,end_time:e.end_time||e.start_time,description:e.description||``,location:e.location||``,created_at:new Date().toISOString()};return t.push(n),t.sort((e,t)=>new Date(e.start_time)-new Date(t.start_time)),this.saveEvents(t),n}deleteEvent(e){let t=this.getEvents(),n=t.filter(t=>t.id!==e),r=t.find(t=>t.id===e);return this.saveEvents(n),r}getTransactions(){try{return JSON.parse(localStorage.getItem(e.TRANSACTIONS)||`[]`)}catch{return[]}}saveTransactions(t){localStorage.setItem(e.TRANSACTIONS,JSON.stringify(t)),this.notify(`finance`,t)}addTransaction(e){let t=this.getTransactions(),n={id:e.id||`tx-${Date.now()}-${Math.random().toString(36).substr(2,5)}`,type:e.type===`income`?`income`:`expense`,amount:Number(e.amount)||0,category:e.category||(e.type===`income`?`Ingresos`:`Varios`),description:e.description||`Sin descripción`,date:e.date||new Date().toISOString()};return t.unshift(n),this.saveTransactions(t),n}deleteTransaction(e){let t=this.getTransactions(),n=t.filter(t=>t.id!==e),r=t.find(t=>t.id===e);return this.saveTransactions(n),r}getChatHistory(){try{return JSON.parse(localStorage.getItem(e.CHAT_HISTORY)||`[]`)}catch{return[]}}addChatMessage(t){let n=this.getChatHistory(),r={id:t.id||`msg-${Date.now()}`,sender:t.sender,text:t.text,timestamp:t.timestamp||new Date().toISOString(),toolCall:t.toolCall||null};n.push(r);let i=n.slice(-100);return localStorage.setItem(e.CHAT_HISTORY,JSON.stringify(i)),this.notify(`chat`,r),r}clearChatHistory(){localStorage.setItem(e.CHAT_HISTORY,JSON.stringify(r())),this.notify(`chat_cleared`,null)}getSettings(){try{return{...i(),...JSON.parse(localStorage.getItem(e.SETTINGS)||`{}`)}}catch{return i()}}updateSettings(t){let n={...this.getSettings(),...t};return localStorage.setItem(e.SETTINGS,JSON.stringify(n)),this.notify(`settings`,n),n}resetAllData(){localStorage.removeItem(e.EVENTS),localStorage.removeItem(e.TRANSACTIONS),localStorage.removeItem(e.CHAT_HISTORY),this.init(),this.notify(`reset`,null)}};function o(e,t=`MXN`){return new Intl.NumberFormat(`es-MX`,{style:`currency`,currency:t,maximumFractionDigits:2}).format(e)}function s(e){if(!e)return``;let t=new Date(e);return isNaN(t.getTime())?e:new Intl.DateTimeFormat(`es-MX`,{dateStyle:`medium`,timeStyle:`short`}).format(t)}var c={create_calendar_event({title:e,start_time:t,end_time:n,description:r=``,location:i=``}){if(!e)return{success:!1,message:`Falta el título del evento.`};let o=t?new Date(t):new Date,c=n?new Date(n):new Date(o.getTime()+36e5),l=a.addEvent({title:e,start_time:o.toISOString(),end_time:c.toISOString(),description:r,location:i});return{success:!0,event:l,summary:`📅 Evento agendado: "${e}" para el ${s(l.start_time)}.`}},get_calendar_events({start_date:e,end_date:t}={}){let n=a.getEvents(),r=e?new Date(e).getTime():0,i=t?new Date(t).getTime():1/0,o=n.filter(e=>{let t=new Date(e.start_time).getTime();return t>=r&&t<=i});return{success:!0,count:o.length,events:o,summary:o.length>0?`Se encontraron ${o.length} evento(s).`:`No hay eventos programados en este rango.`}},delete_calendar_event({event_id:e}){if(!e)return{success:!1,message:`Se requiere el ID del evento.`};let t=a.deleteEvent(e);return t?{success:!0,deleted:t,summary:`🗑️ Evento "${t.title}" cancelado correctamente.`}:{success:!1,message:`No se encontró el evento con ID: ${e}`}}},l={add_transaction({type:e=`expense`,amount:t,category:n,description:r=``,date:i}){let s=parseFloat(t);if(isNaN(s)||s<=0)return{success:!1,message:`Monto inválido. Debe ser un número mayor a 0.`};let c=i?new Date(i).toISOString():new Date().toISOString(),l=n||(e===`income`?`Ingresos`:`Varios`),u=a.addTransaction({type:e,amount:s,category:l,description:r||l,date:c}),d=a.getSettings().currency||`MXN`;return{success:!0,transaction:u,summary:`${e===`income`?`🟢`:`🔴`} Registrado: ${e===`income`?`Ingreso`:`Gasto`} de ${o(s,d)} en ${l} (${u.description}).`}},get_financial_summary({period:e=`this_month`,start_date:t,end_date:n}={}){let r=a.getTransactions(),i=new Date,s=new Date(0),c=new Date(864e13);if(e===`today`)s=new Date(i.getFullYear(),i.getMonth(),i.getDate(),0,0,0),c=new Date(i.getFullYear(),i.getMonth(),i.getDate(),23,59,59);else if(e===`this_week`){let e=i.getDay()||7;s=new Date(i),s.setDate(i.getDate()-e+1),s.setHours(0,0,0,0),c=new Date(s),c.setDate(s.getDate()+6),c.setHours(23,59,59,999)}else e===`this_month`?(s=new Date(i.getFullYear(),i.getMonth(),1,0,0,0),c=new Date(i.getFullYear(),i.getMonth()+1,0,23,59,59)):e===`custom`&&t&&(s=new Date(t),n&&(c=new Date(n)));let l=r.filter(e=>{let t=new Date(e.date).getTime();return t>=s.getTime()&&t<=c.getTime()}),u=0,d=0,f={};l.forEach(e=>{e.type===`income`?u+=e.amount:(d+=e.amount,f[e.category]=(f[e.category]||0)+e.amount)});let p=u-d,m=a.getSettings().currency||`MXN`;return{success:!0,period:e,total_income:u,total_expense:d,balance:p,category_breakdown:f,transaction_count:l.length,summary:`Resumen (${e}): Ingresos: ${o(u,m)} | Gastos: ${o(d,m)} | Balance: ${o(p,m)}.`}},get_transactions({category:e,limit:t=10}={}){let n=a.getTransactions();e&&(n=n.filter(t=>t.category.toLowerCase().includes(e.toLowerCase())));let r=n.slice(0,t);return{success:!0,count:r.length,transactions:r,summary:`Se encontraron ${r.length} transacciones recientes.`}}};function u(e,t){return c[e]?c[e](t):l[e]?l[e](t):{success:!1,message:`Herramienta desconocida: ${e}`}}var d=[{name:`create_calendar_event`,description:`Crea un nuevo evento o recordatorio en el calendario del usuario.`,parameters:{type:`OBJECT`,properties:{title:{type:`STRING`,description:`Título o motivo del evento (ej. Cita con el dentista)`},start_time:{type:`STRING`,description:`Fecha y hora de inicio en formato ISO 8601 (ej. 2026-09-21T10:00:00)`},end_time:{type:`STRING`,description:`Fecha y hora de fin en formato ISO 8601 (ej. 2026-09-21T11:00:00)`},description:{type:`STRING`,description:`Detalles o notas adicionales`},location:{type:`STRING`,description:`Ubicación física o enlace virtual`}},required:[`title`,`start_time`]}},{name:`get_calendar_events`,description:`Consulta eventos programados dentro de un rango de fechas.`,parameters:{type:`OBJECT`,properties:{start_date:{type:`STRING`,description:`Fecha/hora inicio del rango en ISO 8601`},end_date:{type:`STRING`,description:`Fecha/hora fin del rango en ISO 8601`}}}},{name:`delete_calendar_event`,description:`Cancela o elimina un evento del calendario por su identificador.`,parameters:{type:`OBJECT`,properties:{event_id:{type:`STRING`,description:`ID del evento a cancelar`}},required:[`event_id`]}},{name:`add_transaction`,description:`Registra un gasto o ingreso financiero en la contabilidad personal.`,parameters:{type:`OBJECT`,properties:{type:{type:`STRING`,enum:[`expense`,`income`],description:`Tipo: expense para gasto, income para ingreso`},amount:{type:`NUMBER`,description:`Monto numérico en la moneda local (ej. 150.50)`},category:{type:`STRING`,description:`Categoría (ej. Comida / Alimentación, Transporte, Servicios, Entretenimiento, Salud, Sueldo)`},description:{type:`STRING`,description:`Concepto o detalle breve del movimiento (ej. Tacos, Gasolina, Uber, Netflix)`},date:{type:`STRING`,description:`Fecha del movimiento en ISO 8601`}},required:[`type`,`amount`,`category`,`description`]}},{name:`get_financial_summary`,description:`Calcula el balance y resumen de ingresos y gastos de un periodo.`,parameters:{type:`OBJECT`,properties:{period:{type:`STRING`,enum:[`today`,`this_week`,`this_month`,`custom`],description:`Periodo a consultar`},start_date:{type:`STRING`,description:`Fecha inicio si period es custom`},end_date:{type:`STRING`,description:`Fecha fin si period es custom`}},required:[`period`]}},{name:`get_transactions`,description:`Obtiene lista de transacciones recientes filtradas opcionalmente por categoría.`,parameters:{type:`OBJECT`,properties:{category:{type:`STRING`,description:`Categoría opcional para filtrar`},limit:{type:`INTEGER`,description:`Número máximo de transacciones (por defecto 10)`}}}}],f=d.map(e=>({type:`function`,function:{name:e.name,description:e.description,parameters:{type:`object`,properties:e.parameters.properties,required:e.parameters.required||[]}}})),p=`Eres Jarvis, un asistente personal de IA integrado en un entorno móvil (iPhone).
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
- Confirma siempre la ejecución exitosa de una herramienta mostrando los detalles clave (monto, fecha o título del evento).`;function m(e){let t=e.toLowerCase().trim(),n=new Date,r=t.match(/(?:gast[eé]|pagu[eé]|compr[eé]|consum[ií]|gasto de)\s*\$?(\d+(?:\.\d+)?)\s*(?:pesos|mxn|\$)?\s*(?:en|de|por)?\s*([^.,\n]+)?/i)||t.match(/(\d+(?:\.\d+)?)\s*(?:pesos|mxn|\$)?\s*(?:en|de)\s*([^.,\n]+)/i);if(r&&!t.includes(`balance`)&&!t.includes(`resumen`)){let e=parseFloat(r[1]),t=(r[2]||`Varios`).trim();t=t.replace(/\b(hace un rato|hoy|ayer|en la tarde)\b/gi,``).trim();let i=`Otros`,a=t.toLowerCase();/tacos|comida|cena|almuerzo|café|restaurante|pizza|hamburguesa|sushi|oxxo|desayuno/i.test(a)?i=`Comida / Alimentación`:/gasolina|gas|uber|didi|taxi|metro|pasaje|estacionamiento|peaje/i.test(a)?i=`Transporte`:/luz|cfe|agua|internet|teléfono|renta|gas natural|netflix|spotify/i.test(a)?i=`Servicios`:/cine|juego|salida|bar|cerveza|fiesta/i.test(a)?i=`Entretenimiento`:/medicina|doctor|farmacia|consulta|dentista/i.test(a)&&(i=`Salud`);let o=u(`add_transaction`,{type:`expense`,amount:e,category:i,description:t||`Gasto registrado`,date:n.toISOString()});return{handled:!0,toolResult:{name:`add_transaction`,args:{type:`expense`,amount:e,category:i,description:t},result:o},response:`Registrado: Gasto de $${e} en ${i} (${t||`Gasto`}).`}}let i=t.match(/(?:ingres[eé]|recib[ií]|me pagaron|cobro de|abono de)\s*\$?(\d+(?:\.\d+)?)\s*(?:pesos|mxn|\$)?\s*(?:en|de|por)?\s*([^.,\n]+)?/i);if(i){let e=parseFloat(i[1]),t=(i[2]||`Ingreso general`).trim(),r=u(`add_transaction`,{type:`income`,amount:e,category:`Ingresos`,description:t,date:n.toISOString()});return{handled:!0,toolResult:{name:`add_transaction`,args:{type:`income`,amount:e,category:`Ingresos`,description:t},result:r},response:`Registrado: Ingreso de $${e} (${t}).`}}if(/balance|finanzas|resumen|cu[aá]nto he gastado|cu[aá]nto dinero tengo|c[oó]mo van mis gastos/i.test(t)){let e=`this_month`;t.includes(`hoy`)?e=`today`:t.includes(`semana`)&&(e=`this_week`);let n=u(`get_financial_summary`,{period:e}),r=a.getSettings().currency||`MXN`;return{handled:!0,toolResult:{name:`get_financial_summary`,args:{period:e},result:n},response:`Tu balance de ${e===`today`?`hoy`:e===`this_week`?`esta semana`:`este mes`} es de $${n.balance.toFixed(2)} ${r} (Ingresos: $${n.total_income.toFixed(2)}, Gastos: $${n.total_expense.toFixed(2)}).`}}if(/(?:qu[eé] tengo|agenda|eventos|reuniones|citas|calendario)\b/i.test(t)){let e=new Date(n),r=new Date(n);t.includes(`mañana`)?(e.setDate(n.getDate()+1),e.setHours(0,0,0,0),r.setDate(n.getDate()+1),r.setHours(23,59,59,999)):t.includes(`semana`)?(e.setHours(0,0,0,0),r.setDate(n.getDate()+7),r.setHours(23,59,59,999)):(e.setHours(0,0,0,0),r.setHours(23,59,59,999));let i=u(`get_calendar_events`,{start_date:e.toISOString(),end_date:r.toISOString()});if(i.events.length===0)return{handled:!0,toolResult:{name:`get_calendar_events`,args:{start_date:e.toISOString(),end_date:r.toISOString()},result:i},response:`No tienes eventos programados para ese periodo. Tu agenda está libre.`};let a=i.events.map(e=>`• ${new Date(e.start_time).toLocaleTimeString(`es-MX`,{hour:`2-digit`,minute:`2-digit`})} - ${e.title}`).join(`
`);return{handled:!0,toolResult:{name:`get_calendar_events`,args:{start_date:e.toISOString(),end_date:r.toISOString()},result:i},response:`Tienes ${i.events.length} evento(s):\n${a}`}}if(/(?:agend|crear evento|recordatorio|nueva cita|programar)\b/i.test(t)){let e=t.replace(/^(?:agend(?:ar|ame)?|crear evento|recordatorio|nueva cita|programar)\s*(?:de|un|una)?\s*/i,``),r=new Date(n);t.includes(`mañana`)&&(r.setDate(r.getDate()+1),e=e.replace(/\bmañana\b/gi,``));let i=t.match(/(?:a las?|de las?)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);if(i){let t=parseInt(i[1],10),n=i[2]?parseInt(i[2],10):0,a=(i[3]||``).toLowerCase();a===`pm`&&t<12&&(t+=12),a===`am`&&t===12&&(t=0),r.setHours(t,n,0,0),e=e.replace(i[0],``)}else r.setHours(10,0,0,0);e=e.trim().replace(/^para\s*/i,``).replace(/^el\s*/i,``),e||=`Evento programado`;let a=new Date(r.getTime()+36e5),o=u(`create_calendar_event`,{title:e.charAt(0).toUpperCase()+e.slice(1),start_time:r.toISOString(),end_time:a.toISOString()}),s=r.toLocaleString(`es-MX`,{weekday:`short`,month:`short`,day:`numeric`,hour:`2-digit`,minute:`2-digit`});return{handled:!0,toolResult:{name:`create_calendar_event`,args:{title:e,start_time:r.toISOString()},result:o},response:`Agendado: "${o.event.title}" para el ${s}.`}}return{handled:!1}}async function h(e,t){let n=`https://generativelanguage.googleapis.com/v1beta/models/${a.getSettings().geminiModel||`gemini-1.5-flash`}:generateContent?key=${t}`,r=[...a.getChatHistory().slice(-8).map(e=>({role:e.sender===`user`?`user`:`model`,parts:[{text:e.text}]})),{role:`user`,parts:[{text:e}]}],i=await fetch(n,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({contents:r,systemInstruction:{parts:[{text:p}]},tools:[{functionDeclarations:d}],toolConfig:{functionCallingConfig:{mode:`AUTO`}}})});if(!i.ok){let e=await i.json().catch(()=>({}));throw Error(e.error?.message||`Error en Gemini API (${i.status})`)}let o=(await i.json()).candidates?.[0]?.content?.parts||[],s=o.find(e=>e.functionCall);if(s){let{name:e,args:t}=s.functionCall,i=u(e,t),a=[...r,{role:`model`,parts:[{functionCall:s.functionCall}]},{role:`user`,parts:[{functionResponse:{name:e,response:{content:i}}}]}],o=await fetch(n,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({contents:a,systemInstruction:{parts:[{text:p}]}})});if(o.ok){let n=((await o.json()).candidates?.[0])?.content?.parts?.find(e=>e.text);if(n?.text)return{text:n.text,toolCall:{name:e,args:t,result:i}}}return{text:i.summary||`Acción completada con éxito.`,toolCall:{name:e,args:t,result:i}}}return{text:o.find(e=>e.text)?.text||`Entendido. ¿Deseas hacer algo más?`,toolCall:null}}async function g(e,t){let n=`https://api.openai.com/v1/chat/completions`,r=a.getChatHistory().slice(-8).map(e=>({role:e.sender===`user`?`user`:`assistant`,content:e.text})),i=[{role:`system`,content:p},...r,{role:`user`,content:e}],o={model:`gpt-4o-mini`,messages:i,tools:f,tool_choice:`auto`},s=await fetch(n,{method:`POST`,headers:{"Content-Type":`application/json`,Authorization:`Bearer ${t}`},body:JSON.stringify(o)});if(!s.ok){let e=await s.json().catch(()=>({}));throw Error(e.error?.message||`Error en OpenAI API (${s.status})`)}let c=(await s.json()).choices?.[0]?.message;if(c?.tool_calls&&c.tool_calls.length>0){let e=c.tool_calls[0],r=e.function.name,a=JSON.parse(e.function.arguments||`{}`),o=u(r,a),s=[...i,c,{role:`tool`,tool_call_id:e.id,content:JSON.stringify(o)}],l=await fetch(n,{method:`POST`,headers:{"Content-Type":`application/json`,Authorization:`Bearer ${t}`},body:JSON.stringify({model:`gpt-4o-mini`,messages:s})});return l.ok?{text:(await l.json()).choices?.[0]?.message?.content||o.summary,toolCall:{name:r,args:a,result:o}}:{text:o.summary,toolCall:{name:r,args:a,result:o}}}return{text:c?.content||`Entendido. ¿En qué más puedo apoyarte?`,toolCall:null}}async function _(e){let t=a.getSettings(),n=e.trim();if(t.provider===`gemini`&&t.apiKey)try{return await h(n,t.apiKey)}catch(e){console.warn(`Fallo en Gemini API, recurriendo a procesador local:`,e)}else if(t.provider===`openai`&&t.openaiApiKey)try{return await g(n,t.openaiApiKey)}catch(e){console.warn(`Fallo en OpenAI API, recurriendo a procesador local:`,e)}let r=m(n);return r.handled?{text:r.response,toolCall:r.toolResult}:/hola|buen(?:os|as)|saludos|hey|jarvis/i.test(n)?{text:`¡Hola! Estoy listo para ayudarte. Puedes pedirme registrar un gasto ("Gasté $150 en comida"), ver tu balance o agendar una cita en tu calendario.`,toolCall:null}:/gracias|excelente|perfecto|ok/i.test(n)?{text:`Con gusto. Si necesitas registrar otro movimiento o revisar tu agenda, aquí estaré.`,toolCall:null}:{text:`Entendido. Para aprovechar toda mi potencia de razonamiento puedes agregar tu API Key de Gemini en Ajustes ⚙️.

Puedes decirme cosas como:
• "Gasté 180 pesos en gasolina"
• "Agendar cita mañana a las 4pm"
• "Ver balance del mes"`,toolCall:null}}var v=new class{constructor(){this.recognition=null,this.synth=window.speechSynthesis||null,this.isListening=!1,this.isSpeaking=!1,this.voiceEnabled=a.getSettings().voiceEnabled||!1,this.selectedVoice=null,this.initSpeechRecognition(),this.initVoices()}initVoices(){if(!this.synth)return;let e=()=>{let e=this.synth.getVoices();this.selectedVoice=e.find(e=>e.lang===`es-MX`)||e.find(e=>e.lang.startsWith(`es-`))||e.find(e=>e.lang.startsWith(`es`))||null};e(),this.synth.onvoiceschanged!==void 0&&(this.synth.onvoiceschanged=e)}initSpeechRecognition(){let e=window.SpeechRecognition||window.webkitSpeechRecognition;if(!e){console.warn(`Reconocimiento de voz no soportado en este navegador.`);return}this.recognition=new e,this.recognition.continuous=!1,this.recognition.interimResults=!1,this.recognition.lang=`es-MX`}isRecognitionSupported(){return!!(window.SpeechRecognition||window.webkitSpeechRecognition)}isSynthesisSupported(){return!!window.speechSynthesis}toggleVoiceEnabled(){return this.voiceEnabled=!this.voiceEnabled,a.updateSettings({voiceEnabled:this.voiceEnabled}),!this.voiceEnabled&&this.synth&&this.synth.cancel(),this.voiceEnabled}isVoiceEnabled(){return this.voiceEnabled}cleanTextForSpeech(e){return e?e.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}]/gu,``).replace(/[*_#`~>[\]()]/g,``).replace(/\n+/g,`. `).replace(/\s+/g,` `).trim():``}speak(e,t=!1){if(!this.synth||!this.voiceEnabled&&!t)return;this.synth.cancel();let n=this.cleanTextForSpeech(e);if(!n)return;let r=new SpeechSynthesisUtterance(n);r.lang=`es-MX`,this.selectedVoice&&(r.voice=this.selectedVoice),r.rate=1.05,r.pitch=.98,r.onstart=()=>{this.isSpeaking=!0,document.dispatchEvent(new CustomEvent(`jarvis_speaking_start`))},r.onend=()=>{this.isSpeaking=!1,document.dispatchEvent(new CustomEvent(`jarvis_speaking_end`))},r.onerror=()=>{this.isSpeaking=!1,document.dispatchEvent(new CustomEvent(`jarvis_speaking_end`))},this.synth.speak(r)}stopSpeaking(){this.synth&&(this.synth.cancel(),this.isSpeaking=!1,document.dispatchEvent(new CustomEvent(`jarvis_speaking_end`)))}listen({onStart:e,onResult:t,onError:n,onEnd:r}={}){if(!this.recognition){n&&n(Error(`Dictado por voz no disponible en este dispositivo.`));return}if(this.isListening){this.recognition.stop();return}this.stopSpeaking(),this.recognition.onstart=()=>{this.isListening=!0,e&&e()},this.recognition.onresult=e=>{let n=e.results[0][0].transcript;t&&t(n)},this.recognition.onerror=e=>{this.isListening=!1,n&&n(e)},this.recognition.onend=()=>{this.isListening=!1,r&&r()};try{this.recognition.start()}catch(e){console.warn(`Error iniciando reconocimiento:`,e),this.isListening=!1}}stopListening(){this.recognition&&this.isListening&&(this.recognition.stop(),this.isListening=!1)}},y=new class{constructor(){this.notifiedEvents=new Set(this.loadNotifiedEvents()),this.monitoringInterval=null,this.audioCtx=null}loadNotifiedEvents(){try{return JSON.parse(localStorage.getItem(`jarvis_notified_events`)||`[]`)}catch{return[]}}saveNotifiedEvents(){try{localStorage.setItem(`jarvis_notified_events`,JSON.stringify([...this.notifiedEvents].slice(-50)))}catch(e){console.warn(`Error guardando historial de notificaciones:`,e)}}isSupported(){return`Notification`in window}getPermission(){return this.isSupported()?Notification.permission:`unsupported`}async requestPermission(){if(!this.isSupported())return!1;try{let e=await Notification.requestPermission();return a.updateSettings({notificationsEnabled:e===`granted`}),e===`granted`}catch(e){return console.error(`Error solicitando permisos de notificación:`,e),!1}}playAlertSound(){try{let e=window.AudioContext||window.webkitAudioContext;if(!e)return;this.audioCtx||=new e,this.audioCtx.state===`suspended`&&this.audioCtx.resume();let t=this.audioCtx.currentTime,n=this.audioCtx.createOscillator(),r=this.audioCtx.createOscillator(),i=this.audioCtx.createGain();n.type=`sine`,r.type=`sine`,n.frequency.setValueAtTime(1046.5,t),n.frequency.exponentialRampToValueAtTime(1318.51,t+.12),r.frequency.setValueAtTime(523.25,t),r.frequency.exponentialRampToValueAtTime(659.25,t+.12),i.gain.setValueAtTime(.2,t),i.gain.exponentialRampToValueAtTime(.001,t+.6),n.connect(i),r.connect(i),i.connect(this.audioCtx.destination),n.start(t),r.start(t),n.stop(t+.6),r.stop(t+.6)}catch(e){console.log(`Audio chime info:`,e)}}async sendNotification(e,t={}){if(this.playAlertSound(),`vibrate`in navigator&&navigator.vibrate([150,80,150]),!this.isSupported()||Notification.permission!==`granted`)return!1;if(`serviceWorker`in navigator&&navigator.serviceWorker.controller)return navigator.serviceWorker.controller.postMessage({type:`SHOW_NOTIFICATION`,title:e,options:t}),!0;try{return new Notification(e,{icon:`/icon.svg`,badge:`/icon.svg`,...t}),!0}catch(e){return console.warn(`Error en notificación directa:`,e),!1}}checkUpcomingEvents(){let e=a.getEvents(),t=Date.now();e.forEach(e=>{let n=new Date(e.start_time).getTime(),r=Math.round((n-t)/6e4),i=`${e.id}_15min`;r>=10&&r<=16&&!this.notifiedEvents.has(i)&&(this.notifiedEvents.add(i),this.saveNotifiedEvents(),this.sendNotification(`⏰ Evento en 15 minutos: ${e.title}`,{body:`Inicia a las ${new Date(e.start_time).toLocaleTimeString(`es-MX`,{hour:`2-digit`,minute:`2-digit`})}${e.location?` en ${e.location}`:``}.`,tag:i,requireInteraction:!0}));let a=`${e.id}_now`;r>=0&&r<=5&&!this.notifiedEvents.has(a)&&(this.notifiedEvents.add(a),this.saveNotifiedEvents(),this.sendNotification(`🚨 ¡Comenzando ahora! ${e.title}`,{body:`Tu evento "${e.title}" está por comenzar.${e.location?` Ubicación: ${e.location}`:``}`,tag:a,requireInteraction:!0}))})}startMonitoring(){this.monitoringInterval||=(this.checkUpcomingEvents(),setInterval(()=>{this.checkUpcomingEvents()},3e4))}stopMonitoring(){this.monitoringInterval&&=(clearInterval(this.monitoringInterval),null)}async sendTestNotification(){return this.getPermission()!==`granted`&&!await this.requestPermission()?{success:!1,message:`Permiso de notificaciones no concedido.`}:(await this.sendNotification(`Jarvis: Alerta de Evento de Prueba ⏰`,{body:`Tu reunión "Revisión de Estrategia" comienza en 15 minutos en Google Meet.`}),{success:!0,message:`Notificación de prueba enviada exitosamente.`})}},b={chat:`<svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>`,calendar:`<svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>`,wallet:`<svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>`,settings:`<svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`,send:`<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>`,plus:`<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>`,trash:`<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>`,check:`<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>`,clock:`<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,pin:`<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`,mic:`<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>`,speaker:`<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/></svg>`,speakerMute:`<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/><path stroke-linecap="round" stroke-linejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"/></svg>`,bell:`<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>`},x=class{constructor(){this.currentTab=`chat`,this.selectedCalendarDate=new Date,this.isGenerating=!1,this.initDOM(),this.bindEvents(),this.renderAll(),y.startMonitoring(),document.addEventListener(`jarvis_speaking_start`,()=>{document.querySelector(`.brand-logo-wrap`)?.classList.add(`speaking`)}),document.addEventListener(`jarvis_speaking_end`,()=>{document.querySelector(`.brand-logo-wrap`)?.classList.remove(`speaking`)}),a.subscribe(e=>{(e===`chat`||e===`chat_cleared`)&&this.renderChatMessages(),(e===`calendar`||e===`reset`)&&this.renderCalendar(),(e===`finance`||e===`reset`)&&this.renderFinances(),(e===`settings`||e===`reset`)&&this.renderSettings()})}showToast(e){let t=document.getElementById(`toastNotice`);t&&(t.textContent=e,t.classList.add(`show`),clearTimeout(this.toastTimer),this.toastTimer=setTimeout(()=>{t.classList.remove(`show`)},2800))}initDOM(){let e=document.getElementById(`app`);e.innerHTML=`
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
          <button class="icon-btn ${v.isVoiceEnabled()?`active-voice`:``}" id="btnToggleVoice" title="Activar/Desactivar Voz de Jarvis">
            ${v.isVoiceEnabled()?b.speaker:b.speakerMute}
          </button>
          <button class="icon-btn" id="btnQuickMic" title="Entrada de voz">
            ${b.mic}
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
                ${b.mic}
              </button>
            </div>
            <button type="submit" class="btn-send" id="btnSendChat">
              ${b.send}
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
              ${b.plus}
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
              ${b.plus}
            </button>
          </div>

          <!-- Hero Balance Card -->
          <div class="balance-hero-card" id="balanceCard"></div>

          <!-- Category Breakdown -->
          <div class="breakdown-card" id="categoryBreakdownCard"></div>

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
                <input type="password" class="custom-input" id="settingGeminiKey" placeholder="AIzaSy..." />
                <span class="field-helper">Se guarda únicamente en el almacenamiento local de tu iPhone.</span>
              </div>

              <div id="geminiModelGroup">
                <label class="field-label">Modelo Gemini</label>
                <select class="custom-select" id="settingGeminiModel">
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash (Ultrarrápido y recomendado)</option>
                  <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro (Máximo razonamiento)</option>
                </select>
              </div>

              <div id="openaiKeyGroup" style="display: none;">
                <label class="field-label">
                  <span>OpenAI API Key</span>
                  <a href="https://platform.openai.com/api-keys" target="_blank" style="color: var(--accent-cyan); font-size: 11px; text-decoration: none;">Crear Key ↗</a>
                </label>
                <input type="password" class="custom-input" id="settingOpenaiKey" placeholder="sk-..." />
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
                    ${y.getPermission()===`granted`?`Activadas ✓`:`Pendiente`}
                  </span>
                </label>
                <p class="field-helper" style="margin-top: 4px;">
                  Jarvis te notificará con sonido y vibración <strong>15 minutos antes</strong> y <strong>al comenzar</strong> cada evento o cita agendada.
                </p>
              </div>
              <div style="display: flex; gap: 8px;">
                <button type="button" class="btn-primary" id="btnEnableNotifications" style="flex: 1; padding: 10px 12px; font-size: 13px;">
                  ${y.getPermission()===`granted`?`Permiso Concedido ✓`:`Activar Alertas`}
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
                <button type="button" class="icon-btn ${v.isVoiceEnabled()?`active-voice`:``}" id="btnSettingVoiceToggle">
                  ${v.isVoiceEnabled()?b.speaker:b.speakerMute}
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
          ${b.chat}
          <span>Jarvis</span>
        </button>
        <button class="tab-btn" data-tab="calendar">
          ${b.calendar}
          <span>Agenda</span>
        </button>
        <button class="tab-btn" data-tab="finance">
          ${b.wallet}
          <span>Finanzas</span>
        </button>
        <button class="tab-btn" data-tab="settings">
          ${b.settings}
          <span>Ajustes</span>
        </button>
      </nav>

      <!-- MODAL: Add Event -->
      <div class="modal-backdrop" id="modalAddEvent">
        <div class="modal-sheet">
          <div class="sheet-handle"></div>
          <div class="modal-header">
            <h3 style="font-size: 17px; font-weight: 700;">Nuevo Evento</h3>
            <button class="icon-btn" id="btnCloseAddEvent">${b.plus}</button>
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
              <label class="field-label" style="margin-bottom: 4px;">Notas (opcional)</label>
              <input type="text" id="eventDescription" class="custom-input" placeholder="Detalles adicionales..." />
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
            <button class="icon-btn" id="btnCloseAddTx">${b.plus}</button>
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
    `}bindEvents(){document.querySelectorAll(`.tab-btn`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.getAttribute(`data-tab`);this.switchTab(t)})});let e=document.getElementById(`chatForm`),t=document.getElementById(`chatInput`);e.addEventListener(`submit`,async e=>{e.preventDefault();let n=t.value.trim();n&&!this.isGenerating&&(t.value=``,await this.handleUserMessage(n))}),document.querySelectorAll(`.chip`).forEach(e=>{e.addEventListener(`click`,async()=>{let t=e.getAttribute(`data-prompt`);t&&!this.isGenerating&&await this.handleUserMessage(t)})});let n=e=>{if(!v.isRecognitionSupported()){this.showToast(`Dictado por voz no disponible en este navegador`);return}if(v.isListening){v.stopListening();return}let t=document.getElementById(`voiceListeningBar`);v.listen({onStart:()=>{e?.classList.add(`listening`),t?.classList.add(`active`)},onResult:async n=>{if(e?.classList.remove(`listening`),t?.classList.remove(`active`),n){this.switchTab(`chat`);let e=document.getElementById(`chatInput`);e&&(e.value=n),await this.handleUserMessage(n),e&&(e.value=``)}},onError:n=>{e?.classList.remove(`listening`),t?.classList.remove(`active`);let r=n?.error||``;r===`no-speech`?this.showToast(`No detecté voz. Intenta de nuevo.`):r===`not-allowed`?this.showToast(`Permiso de micrófono denegado.`):this.showToast(`Error de micrófono — intenta de nuevo.`)},onEnd:()=>{e?.classList.remove(`listening`),t?.classList.remove(`active`)}})},r=document.getElementById(`btnQuickMic`);r?.addEventListener(`click`,()=>n(r));let i=document.getElementById(`btnChatMic`);i?.addEventListener(`click`,()=>n(i));let o=document.getElementById(`btnToggleVoice`);o?.addEventListener(`click`,()=>{let e=v.toggleVoiceEnabled();o.innerHTML=e?b.speaker:b.speakerMute,o.classList.toggle(`active-voice`,e);let t=document.getElementById(`btnSettingVoiceToggle`);t&&(t.innerHTML=e?b.speaker:b.speakerMute,t.classList.toggle(`active-voice`,e)),this.showToast(e?`🔊 Voz de Jarvis activada`:`🔇 Voz de Jarvis silenciada`)});let s=document.getElementById(`btnSettingVoiceToggle`);s?.addEventListener(`click`,()=>{let e=v.toggleVoiceEnabled();s.innerHTML=e?b.speaker:b.speakerMute,s.classList.toggle(`active-voice`,e);let t=document.getElementById(`btnToggleVoice`);t&&(t.innerHTML=e?b.speaker:b.speakerMute,t.classList.toggle(`active-voice`,e)),this.showToast(e?`🔊 Voz de Jarvis activada`:`🔇 Voz de Jarvis silenciada`)});let u=document.getElementById(`btnEnableNotifications`);u?.addEventListener(`click`,async()=>{if(y.getPermission()===`granted`){this.showToast(`Las notificaciones ya están activadas ✓`);return}if(await y.requestPermission()){u.textContent=`Permiso Concedido ✓`;let e=document.getElementById(`notifStatusBadge`);e&&(e.textContent=`Activadas ✓`),this.showToast(`🔔 Alertas de eventos activadas`),y.startMonitoring()}else this.showToast(`Permiso denegado. Actívalos desde Ajustes del iPhone.`)}),document.getElementById(`btnTestNotification`)?.addEventListener(`click`,async()=>{let e=await y.sendTestNotification();this.showToast(e.success?`🔔 Alerta de prueba enviada`:e.message)});let d=document.getElementById(`modalAddEvent`),f=document.getElementById(`modalAddTx`);document.getElementById(`btnOpenAddEvent`).addEventListener(`click`,()=>{let e=new Date;e.setMinutes(0,0,0),e.setHours(e.getHours()+1);let t=new Date(e.getTime()+36e5),n=e=>{let t=e.getTimezoneOffset();return new Date(e.getTime()-t*6e4).toISOString().slice(0,16)};document.getElementById(`eventStart`).value=n(e),document.getElementById(`eventEnd`).value=n(t),d.classList.add(`active`)}),document.getElementById(`btnCloseAddEvent`).addEventListener(`click`,()=>{d.classList.remove(`active`)}),document.getElementById(`formAddEvent`).addEventListener(`submit`,e=>{e.preventDefault();let t=document.getElementById(`eventTitle`).value.trim(),n=document.getElementById(`eventStart`).value,r=document.getElementById(`eventEnd`).value,i=document.getElementById(`eventLocation`).value.trim(),a=document.getElementById(`eventDescription`).value.trim();c.create_calendar_event({title:t,start_time:new Date(n).toISOString(),end_time:new Date(r).toISOString(),location:i,description:a}),d.classList.remove(`active`),e.target.reset(),this.showToast(`📅 Evento creado con éxito`)}),document.getElementById(`btnOpenAddTx`).addEventListener(`click`,()=>{let e=new Date,t=e.getTimezoneOffset(),n=new Date(e.getTime()-t*6e4);document.getElementById(`txDate`).value=n.toISOString().slice(0,16),f.classList.add(`active`)}),document.getElementById(`btnCloseAddTx`).addEventListener(`click`,()=>{f.classList.remove(`active`)}),document.getElementById(`formAddTx`).addEventListener(`submit`,e=>{e.preventDefault();let t=document.getElementById(`txType`).value,n=parseFloat(document.getElementById(`txAmount`).value),r=document.getElementById(`txCategory`).value,i=document.getElementById(`txDesc`).value.trim(),a=document.getElementById(`txDate`).value,o=a?new Date(a).toISOString():new Date().toISOString();l.add_transaction({type:t,amount:n,category:r,description:i,date:o}),f.classList.remove(`active`),e.target.reset(),this.showToast(`💰 Movimiento registrado`)}),[d,f].forEach(e=>{e.addEventListener(`click`,t=>{t.target===e&&e.classList.remove(`active`)})});let p=document.getElementById(`settingProvider`),m=document.getElementById(`geminiKeyGroup`),h=document.getElementById(`geminiModelGroup`),g=document.getElementById(`openaiKeyGroup`);p.addEventListener(`change`,()=>{let e=p.value;e===`gemini`?(m.style.display=`block`,h.style.display=`block`,g.style.display=`none`):e===`openai`?(m.style.display=`none`,h.style.display=`none`,g.style.display=`block`):(m.style.display=`none`,h.style.display=`none`,g.style.display=`none`)}),document.getElementById(`btnSaveApiSettings`).addEventListener(`click`,()=>{let e=p.value,t=document.getElementById(`settingGeminiKey`).value.trim(),n=document.getElementById(`settingGeminiModel`).value,r=document.getElementById(`settingOpenaiKey`).value.trim(),i=document.getElementById(`settingCurrency`).value,o=document.getElementById(`settingUserName`).value.trim();a.updateSettings({provider:e,apiKey:t,geminiModel:n,openaiApiKey:r,currency:i,userName:o}),this.showToast(`Configuración guardada`),this.updateStatusBadge()}),document.getElementById(`btnClearChat`).addEventListener(`click`,()=>{confirm(`¿Deseas limpiar el historial de mensajes?`)&&(a.clearChatHistory(),this.showToast(`Historial de chat borrado`))}),document.getElementById(`btnResetData`).addEventListener(`click`,()=>{confirm(`¿Restablecer todos los eventos y finanzas a los datos iniciales?`)&&(a.resetAllData(),this.showToast(`Datos restablecidos`))})}switchTab(e){this.currentTab=e,document.querySelectorAll(`.tab-btn`).forEach(t=>{t.classList.toggle(`active`,t.getAttribute(`data-tab`)===e)}),document.querySelectorAll(`.tab-panel`).forEach(t=>{t.classList.toggle(`active`,t.id===`tab-${e}`)}),e===`chat`&&this.scrollToBottom()}updateStatusBadge(){let e=a.getSettings(),t=document.getElementById(`brandStatus`);t&&(t.textContent=e.provider===`gemini`&&e.apiKey?`Gemini 1.5 • En línea`:e.provider===`openai`&&e.openaiApiKey?`GPT-4o Mini • En línea`:`Modo Inteligente Local • Listo`)}async handleUserMessage(e){a.addChatMessage({sender:`user`,text:e}),this.isGenerating=!0;let t=document.getElementById(`btnSendChat`);t&&(t.disabled=!0),this.showTypingIndicator();try{let t=await _(e);this.hideTypingIndicator(),a.addChatMessage({sender:`jarvis`,text:t.text,toolCall:t.toolCall}),v.speak(t.text)}catch(e){this.hideTypingIndicator();let t=`Lo siento, ocurrió un problema al procesar tu solicitud: ${e.message}`;a.addChatMessage({sender:`jarvis`,text:t}),v.speak(`Lo siento, ocurrió un problema. Inténtalo de nuevo.`)}finally{this.isGenerating=!1,t&&(t.disabled=!1)}}showTypingIndicator(){let e=document.getElementById(`chatMessages`);if(document.getElementById(`typingIndicator`))return;let t=document.createElement(`div`);t.id=`typingIndicator`,t.className=`message-row jarvis`,t.innerHTML=`
      <div class="avatar-small">J</div>
      <div class="typing-bubble">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    `,e.appendChild(t),this.scrollToBottom()}hideTypingIndicator(){let e=document.getElementById(`typingIndicator`);e&&e.remove()}scrollToBottom(){let e=document.getElementById(`chatMessages`);e&&setTimeout(()=>{e.scrollTop=e.scrollHeight},50)}renderAll(){this.renderChatMessages(),this.renderCalendar(),this.renderFinances(),this.renderSettings(),this.updateStatusBadge()}renderChatMessages(){let e=document.getElementById(`chatMessages`);e&&(e.innerHTML=a.getChatHistory().map(e=>{let t=e.sender===`user`,n=new Date(e.timestamp).toLocaleTimeString(`es-MX`,{hour:`2-digit`,minute:`2-digit`}),r=``;if(e.toolCall){let t=e.toolCall,n=t.name||(t.transaction?`add_transaction`:t.event?`create_calendar_event`:t.events?`get_calendar_events`:t.balance===void 0?``:`get_financial_summary`),i=t.result||t,a=t.args||{},o=`calendar`,s=`Acción Realizada`;if(n===`add_transaction`||i?.transaction){let e=i?.transaction?.type===`income`||a?.type===`income`;o=e?`finance-income`:`finance-expense`,s=e?`🟢 Ingreso Registrado`:`🔴 Gasto Registrado`}else n===`get_financial_summary`?(o=`finance-income`,s=`📊 Resumen Financiero`):n===`create_calendar_event`||i?.event?(o=`calendar`,s=`📅 Evento Creado`):n===`get_calendar_events`||i?.events?(o=`calendar`,s=`🗓️ Consulta de Agenda`):n===`delete_calendar_event`&&(o=`finance-expense`,s=`🗑️ Evento Cancelado`);r=`
          <div class="tool-badge ${o}">
            <div class="tool-badge-header">${s}</div>
            <div class="tool-badge-content">${i?.summary||`Acción completada.`}</div>
          </div>
        `}return`
        <div class="message-row ${t?`user`:`jarvis`}">
          ${t?``:`<div class="avatar-small">J</div>`}
          <div class="bubble">
            <div>${this.escapeHtml(e.text).replace(/\n/g,`<br/>`)}</div>
            ${r}
            <div class="msg-time">${n}</div>
          </div>
        </div>
      `}).join(``),this.scrollToBottom())}escapeHtml(e){return e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`)}renderCalendar(){this.renderDateStrip(),this.renderEventsTimeline()}renderDateStrip(){let e=document.getElementById(`calendarDateStrip`);if(!e)return;let t=[`Dom`,`Lun`,`Mar`,`Mié`,`Jue`,`Vie`,`Sáb`],n=``,r=new Date;for(let e=0;e<14;e++){let i=new Date(r);i.setDate(r.getDate()+e);let a=i.toDateString()===this.selectedCalendarDate.toDateString(),o=e===0?`Hoy`:e===1?`Mañ`:t[i.getDay()],s=i.getDate();n+=`
        <div class="date-pill ${a?`active`:``}" data-date="${i.toISOString()}">
          <span class="date-pill-day">${o}</span>
          <span class="date-pill-num">${s}</span>
        </div>
      `}e.innerHTML=n,e.querySelectorAll(`.date-pill`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.getAttribute(`data-date`);this.selectedCalendarDate=new Date(t),this.renderCalendar()})})}renderEventsTimeline(){let e=document.getElementById(`eventsTimeline`);if(!e)return;let t=a.getEvents(),n=this.selectedCalendarDate.toDateString(),r=t.filter(e=>new Date(e.start_time).toDateString()===n);if(r.length===0){e.innerHTML=`
        <div style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
          <div style="font-size: 36px; margin-bottom: 8px;">🗓️</div>
          <div style="font-size: 15px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">Sin eventos este día</div>
          <div style="font-size: 12px;">Pídele a Jarvis agendar uno o toca el botón "+" superior.</div>
        </div>
      `;return}e.innerHTML=r.map(e=>{let t=new Date(e.start_time).toLocaleTimeString(`es-MX`,{hour:`2-digit`,minute:`2-digit`}),n=e.end_time?new Date(e.end_time).toLocaleTimeString(`es-MX`,{hour:`2-digit`,minute:`2-digit`}):``;return`
        <div class="event-card">
          <div class="event-card-header">
            <div class="event-card-title">${this.escapeHtml(e.title)}</div>
            <button class="event-delete-btn" data-id="${e.id}" title="Eliminar evento">
              ${b.trash}
            </button>
          </div>
          <div class="event-card-time">
            ${b.clock} ${t} ${n?`— ${n}`:``}
          </div>
          ${e.description?`<div class="event-card-desc">${this.escapeHtml(e.description)}</div>`:``}
          ${e.location?`
            <div class="event-card-location">
              ${b.pin} ${this.escapeHtml(e.location)}
            </div>
          `:``}
        </div>
      `}).join(``),e.querySelectorAll(`.event-delete-btn`).forEach(e=>{e.addEventListener(`click`,t=>{t.stopPropagation();let n=e.getAttribute(`data-id`);c.delete_calendar_event({event_id:n}),this.showToast(`Evento eliminado`)})})}renderFinances(){let e=a.getTransactions(),t=a.getSettings().currency||`MXN`,n=new Date,r=n.getMonth(),i=n.getFullYear(),c=e.filter(e=>{let t=new Date(e.date);return t.getMonth()===r&&t.getFullYear()===i}),l=0,u=0,d={};c.forEach(e=>{e.type===`income`?l+=e.amount:(u+=e.amount,d[e.category]=(d[e.category]||0)+e.amount)});let f=l-u,p=document.getElementById(`balanceCard`);p&&(p.innerHTML=`
        <div class="balance-label">Balance de ${new Intl.DateTimeFormat(`es-MX`,{month:`long`}).format(n)}</div>
        <div class="balance-amount">
          ${o(f,t)}
          <span class="balance-currency">${t}</span>
        </div>
        <div class="balance-pills-row">
          <div class="summary-pill">
            <div class="pill-icon income">↑</div>
            <div class="pill-info">
              <span class="pill-label">Ingresos</span>
              <span class="pill-val">${o(l,t)}</span>
            </div>
          </div>
          <div class="summary-pill">
            <div class="pill-icon expense">↓</div>
            <div class="pill-info">
              <span class="pill-label">Gastos</span>
              <span class="pill-val">${o(u,t)}</span>
            </div>
          </div>
        </div>
      `);let m=document.getElementById(`categoryBreakdownCard`);if(m){let e=Object.entries(d).sort((e,t)=>t[1]-e[1]);if(e.length===0)m.innerHTML=`
          <div class="breakdown-title">Distribución de Gastos</div>
          <div style="font-size: 12px; color: var(--text-muted); text-align: center; padding: 12px 0;">
            No hay gastos registrados en el mes actual.
          </div>
        `;else{let n=Math.max(...e.map(e=>e[1])),r=e.map(([e,r])=>{let i=Math.round(r/(u||1)*100),a=Math.round(r/(n||1)*100);return`
            <div class="category-bar-row">
              <div class="cat-bar-header">
                <span class="cat-bar-name">${this.escapeHtml(e)}</span>
                <span class="cat-bar-amt">${o(r,t)} (${i}%)</span>
              </div>
              <div class="cat-bar-track">
                <div class="cat-bar-fill" style="width: ${a}%;"></div>
              </div>
            </div>
          `}).join(``);m.innerHTML=`
          <div class="breakdown-title">Distribución de Gastos (${c.filter(e=>e.type===`expense`).length} movimientos)</div>
          ${r}
        `}}let h=document.getElementById(`transactionsList`);if(h){if(e.length===0){h.innerHTML=`
          <div style="text-align: center; padding: 30px; color: var(--text-muted); font-size: 13px;">
            Aún no tienes movimientos registrados.
          </div>
        `;return}h.innerHTML=e.slice(0,15).map(e=>{let n=e.type===`income`,r=n?`💰`:this.getCategoryEmoji(e.category),i=s(e.date);return`
          <div class="tx-item">
            <div class="tx-left">
              <div class="tx-icon-wrap">${r}</div>
              <div class="tx-details">
                <span class="tx-desc">${this.escapeHtml(e.description)}</span>
                <span class="tx-cat-date">${this.escapeHtml(e.category)} • ${i}</span>
              </div>
            </div>
            <div class="tx-right">
              <span class="tx-amt ${n?`income`:`expense`}">
                ${n?`+`:`-`}${o(e.amount,t)}
              </span>
              <button class="tx-delete-btn" data-id="${e.id}">Eliminar</button>
            </div>
          </div>
        `}).join(``),h.querySelectorAll(`.tx-delete-btn`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.getAttribute(`data-id`);a.deleteTransaction(t),this.showToast(`Movimiento eliminado`)})})}}getCategoryEmoji(e){if(!e)return`💳`;let t=e.toLowerCase();return t.includes(`comida`)||t.includes(`alimento`)||t.includes(`taco`)?`🌮`:t.includes(`transporte`)||t.includes(`gasolina`)||t.includes(`uber`)?`⛽`:t.includes(`servicio`)||t.includes(`luz`)||t.includes(`agua`)?`⚡`:t.includes(`entretenimiento`)||t.includes(`cine`)?`🍿`:t.includes(`salud`)||t.includes(`medicina`)||t.includes(`doctor`)?`🩺`:t.includes(`sueldo`)||t.includes(`ingreso`)?`💵`:`🛍️`}renderSettings(){let e=a.getSettings(),t=document.getElementById(`settingProvider`);t&&(t.value=e.provider||`gemini`);let n=document.getElementById(`settingGeminiKey`);n&&(n.value=e.apiKey||``);let r=document.getElementById(`settingGeminiModel`);r&&(r.value=e.geminiModel||`gemini-1.5-flash`);let i=document.getElementById(`settingOpenaiKey`);i&&(i.value=e.openaiApiKey||``);let o=document.getElementById(`settingCurrency`);o&&(o.value=e.currency||`MXN`);let s=document.getElementById(`settingUserName`);s&&(s.value=e.userName||`Usuario`);let c=document.getElementById(`geminiKeyGroup`),l=document.getElementById(`geminiModelGroup`),u=document.getElementById(`openaiKeyGroup`);c&&u&&(e.provider===`gemini`?(c.style.display=`block`,l&&(l.style.display=`block`),u.style.display=`none`):e.provider===`openai`?(c.style.display=`none`,l&&(l.style.display=`none`),u.style.display=`block`):(c.style.display=`none`,l&&(l.style.display=`none`),u.style.display=`none`))}};window.addEventListener(`DOMContentLoaded`,()=>{new x});