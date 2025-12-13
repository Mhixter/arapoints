import sgMail from '@sendgrid/mail';
import { logger } from '../utils/logger';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=sendgrid',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key || !connectionSettings.settings.from_email)) {
    throw new Error('SendGrid not connected');
  }
  return {
    apiKey: connectionSettings.settings.api_key, 
    fromEmail: connectionSettings.settings.from_email
  };
}

export async function getSendGridClient() {
  const { apiKey, fromEmail } = await getCredentials();
  sgMail.setApiKey(apiKey);
  return {
    client: sgMail,
    fromEmail: fromEmail
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
