/**
 * Email Sender (Edge Function)
 *
 * Sends transactional emails via Resend REST API using native fetch.
 */

import { logger } from '../../utils/logger.ts';

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<void> {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) {
    logger.warn('RESEND_API_KEY not configured — skipping email send', {
      subject: params.subject,
    });
    return;
  }

  const from = params.from ?? 'SuplAI <notificaciones@suplai.cl>';
  const to = Array.isArray(params.to) ? params.to : [params.to];

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ from, to, subject: params.subject, html: params.html }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Resend API error ${response.status}: ${body}`);
    }

    logger.info('Email sent', { to, subject: params.subject });
  } catch (error) {
    logger.error('Failed to send email', {
      to,
      subject: params.subject,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
