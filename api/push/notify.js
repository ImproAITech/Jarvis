// api/push/notify.js
// Called by QStash at the exact moment a reminder should fire.
// Looks up the user's push subscription and sends the Web Push notification.

import webpush from 'web-push';
import { Redis } from '@upstash/redis';
import { Receiver } from '@upstash/qstash';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL || 'jarvis@example.com'}`,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Verify QStash signature if keys are provided
  if (process.env.QSTASH_CURRENT_SIGNING_KEY) {
    try {
      const signature = req.headers['upstash-signature'];
      if (signature) {
        const receiver = new Receiver({
          currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY,
          nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY || process.env.QSTASH_CURRENT_SIGNING_KEY,
        });
        const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
        await receiver.verify({
          signature,
          body: rawBody,
        });
      }
    } catch (sigErr) {
      console.warn('[notify] QStash signature verification failed:', sigErr);
      return res.status(401).json({ error: 'Invalid signature' });
    }
  }

  try {
    const bodyData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { userId, event, reminderMinutes } = bodyData || {};

    if (!userId || !event) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Retrieve the push subscription from Redis
    const subRaw = await redis.get(`push:sub:${userId}`);
    if (!subRaw) {
      console.warn(`[notify] No subscription found for userId: ${userId}`);
      return res.status(404).json({ error: 'Subscription not found' });
    }

    const subscription = typeof subRaw === 'string' ? JSON.parse(subRaw) : subRaw;

    // Build a friendly event time string
    const eventDate = new Date(event.start);
    const timeStr = eventDate.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    let body;
    if (reminderMinutes === 0) {
      body = `🔔 "${event.title}" está comenzando ahora.`;
    } else if (reminderMinutes < 60) {
      body = `⏰ "${event.title}" comienza en ${reminderMinutes} minutos (${timeStr}).`;
    } else {
      const hrs = Math.floor(reminderMinutes / 60);
      body = `⏰ "${event.title}" comienza en ${hrs} hora${hrs > 1 ? 's' : ''} (${timeStr}).`;
    }

    const payload = JSON.stringify({
      title: 'Jarvis 🤖 — Recordatorio',
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: `event-reminder-${event.id}`,
      data: {
        url: '/',
        eventId: event.id,
      },
    });

    await webpush.sendNotification(subscription, payload);

    return res.status(200).json({ success: true });
  } catch (err) {
    // If the subscription is expired/invalid, clean it up
    if (err.statusCode === 410 || err.statusCode === 404) {
      console.warn('[notify] Subscription expired, removing from Redis');
      const bodyData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (bodyData && bodyData.userId) {
        await redis.del(`push:sub:${bodyData.userId}`);
      }
      return res.status(200).json({ cleaned: true });
    }

    console.error('[notify] Error sending push:', err);
    return res.status(500).json({ error: 'Failed to send notification' });
  }
}
