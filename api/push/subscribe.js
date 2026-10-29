// api/push/subscribe.js
// Stores a user's Web Push subscription in Upstash Redis

import { Redis } from '@upstash/redis';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  try {
    const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { userId, subscription } = data || {};

    if (!userId || !subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Missing userId or subscription' });
    }

    // Store the push subscription keyed by userId
    // TTL: 90 days (auto-cleanup if user uninstalls)
    await redis.set(
      `push:sub:${userId}`,
      JSON.stringify(subscription),
      { ex: 60 * 60 * 24 * 90 }
    );

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[subscribe] Error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
