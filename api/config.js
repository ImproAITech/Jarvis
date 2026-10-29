// api/config.js
// Provides client with server-configured environment settings (e.g. Gemini API key)

export default async function handler(req, res) {
  res.status(200).json({
    geminiApiKey: process.env.GEMINI_API_KEY || '',
  });
}
