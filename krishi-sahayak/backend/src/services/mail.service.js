import { env } from '../config/env.js';

export async function sendMail({ to, subject, text, replyTo }) {
  if (!env.resendApiKey || !env.emailFrom) throw new Error('Email delivery is not configured. Set RESEND_API_KEY and EMAIL_FROM.');
  const response = await globalThis.fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.resendApiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env.emailFrom, to: [to], subject, text, ...(replyTo && { reply_to: replyTo }) }),
    signal: globalThis.AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error('Email provider rejected the message.');
}
