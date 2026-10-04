// api/push/schedule.js
// Schedules a push notification reminder via Upstash QStash.
// Called by the client whenever an event with a reminder is created/updated.

import { Client as QStashClient } from '@upstash/qstash';

const qstash = new QStashClient({
  token: process.env.QSTASH_TOKEN,
  baseUrl: process.env.QSTASH_URL || 'https://qstash-us-east-1.upstash.io',
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { userId, event, reminderMinutes } = data || {};

    if (!userId || !event || !event.id || !event.start || reminderMinutes == null) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Calculate when to deliver the notification
    const eventStart = new Date(event.start);
    const notifyAt = new Date(eventStart.getTime() - reminderMinutes * 60 * 1000);
    const nowMs = Date.now();

    // Don't schedule if the notification time has already passed
    if (notifyAt.getTime() <= nowMs) {
      return res.status(200).json({ skipped: true, reason: 'Notification time already passed' });
    }

    const delaySeconds = Math.floor((notifyAt.getTime() - nowMs) / 1000);

    // Build the callback URL dynamically
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const baseUrl = process.env.APP_URL && !process.env.APP_URL.includes('tu-proyecto')
      ? process.env.APP_URL
      : `${proto}://${host}`;
    const notifyUrl = `${baseUrl.replace(/\/$/, '')}/api/push/notify`;

    // Use event ID as QStash message ID for deduplication / cancellation
    const messageId = `${userId}:${event.id}:${reminderMinutes}`;

    console.log(`[schedule] Scheduling QStash push to ${notifyUrl} in ${delaySeconds}s for event ${event.id}`);

    await qstash.publishJSON({
      url: notifyUrl,
      body: {
        userId,
        event,
        reminderMinutes,
      },
      delay: delaySeconds,
      headers: {
        'X-Upstash-Deduplication-Id': messageId,
      },
    });

    return res.status(200).json({ success: true, scheduledFor: notifyAt.toISOString() });
  } catch (err) {
    console.error('[schedule] Error:', err);
    return res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
}
