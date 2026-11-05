import { getAppEnv } from './env';

export type EmailAttachment = {
  filename: string;
  content: string;
  content_type?: string;
};

export async function sendOwnerEmail(opts: {
  subject: string;
  text: string;
  attachments?: EmailAttachment[];
}): Promise<boolean> {
  const env = await getAppEnv();
  if (!env.RESEND_API_KEY || !env.ORDER_NOTIFICATION_EMAIL) return false;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'orders@lialvaro.com',
      to: env.ORDER_NOTIFICATION_EMAIL,
      subject: opts.subject,
      text: opts.text,
      ...(opts.attachments?.length ? { attachments: opts.attachments } : {}),
    }),
  });
  return res.ok;
}

export async function sendCustomerEmail(opts: {
  to: string;
  subject: string;
  text: string;
}): Promise<boolean> {
  const env = await getAppEnv();
  if (!env.RESEND_API_KEY) return false;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'orders@lialvaro.com',
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
    }),
  });
  return res.ok;
}
