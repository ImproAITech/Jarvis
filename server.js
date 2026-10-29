// server.js — Express server for Render deployment
// Serves the static Vite frontend + the push notification API routes

import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────────────────────

// For /api/push/notify we need the raw body string so QStash signature
// verification works. We capture it before JSON parsing.
app.use('/api/push/notify', (req, res, next) => {
  let raw = '';
  req.on('data', chunk => { raw += chunk; });
  req.on('end', () => {
    req.body = raw;   // pass raw string; handler does JSON.parse internally
    next();
  });
});

// For all other routes, parse JSON normally
app.use(express.json());

// ── API Routes ────────────────────────────────────────────────────────────────

// Dynamically import handlers (they use ESM exports)
const { default: subscribeHandler } = await import('./api/push/subscribe.js');
const { default: scheduleHandler } = await import('./api/push/schedule.js');
const { default: notifyHandler } = await import('./api/push/notify.js');

app.post('/api/push/subscribe', async (req, res) => {
  await subscribeHandler(req, res);
});

app.post('/api/push/schedule', async (req, res) => {
  await scheduleHandler(req, res);
});

app.post('/api/push/notify', async (req, res) => {
  await notifyHandler(req, res);
});

// Health check for Render
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'jarvis-push-api' });
});

// App configuration (provides server-configured Gemini API key if present)
app.get('/api/config', (_req, res) => {
  res.json({
    geminiApiKey: process.env.GEMINI_API_KEY || '',
  });
});

// ── Static Frontend ───────────────────────────────────────────────────────────
const distPath = join(__dirname, 'dist');
app.use(express.static(distPath));

// SPA fallback: all non-API routes → index.html
app.get(/^(?!\/api\/).*/, (_req, res) => {
  res.sendFile(join(distPath, 'index.html'));
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[Jarvis] Server running on port ${PORT}`);
});
