import sgMail from '@sendgrid/mail';
import { logger } from '../utils/logger';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'Arapoint <noreply@arapoint.com.ng>';

let initialized = false;

function initializeSendGrid() {
  if (!SENDGRID_API_KEY) {
    throw new Error('SENDGRID_API_KEY is not configured');
  }
  if (!initialized) {
    sgMail.setApiKey(SENDGRID_API_KEY);
    initialized = true;
  }
}

export async function getSendGridClient() {
  initializeSendGrid();
  return {
    client: sgMail,
    fromEmail: FROM_EMAIL
  };
}

export async function sendEmail(to: string, subject: string, html: string, text?: string): Promise<boolean> {
  try {
    const { client, fromEmail } = await getSendGridClient();
    
    const msg = {
      to: to,
      from: fromEmail || 'Arapoint <noreply@arapoint.com.ng>',
      subject: subject,
      html: html,
      text: text || html.replace(/<[^>]*>/g, ''),
    };

    await client.send(msg);

    logger.info('Email sent successfully via SendGrid', { to });
    return true;
  } catch (error: any) {
    logger.error('Failed to send email via SendGrid', { to, error: error.message });
    return false;
  }
}
