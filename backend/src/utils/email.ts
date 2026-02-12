import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
  console.warn('⚠️  RESEND_API_KEY is not set. Email sending will fail.');
}

const resend = apiKey ? new Resend(apiKey) : null;
const DEFAULT_FROM = "hello@mail.strategicai.app";
const FROM_EMAIL = (process.env.FROM_EMAIL ?? process.env.EMAIL_FROM ?? DEFAULT_FROM).trim();
const fromHeader = `StrategicAI <${FROM_EMAIL}>`;

export async function sendInviteEmail(params: {
  to: string;
  role: string;
  inviteLink: string;
  ownerName: string;
}) {
  const { to, role, inviteLink, ownerName } = params;

  const roleNames: Record<string, string> = {
    ops: 'Operations Lead',
    sales: 'Sales Lead',
    delivery: 'Delivery Lead',
  };

  const roleName = roleNames[role] || role;

  if (!resend) {
    console.error('Resend client not configured');
    throw new Error('Email service not configured');
  }

  try {
    await resend.emails.send({
      from: fromHeader,
      to,
      subject: `You've been invited as ${roleName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">You've been invited to join the Strategic AI Roadmap process</h2>
          <p style="color: #666; line-height: 1.6;">
            ${ownerName} has invited you to participate as <strong>${roleName}</strong>.
          </p>
          <p style="margin: 30px 0;">
            <a href="${inviteLink}" 
               style="background-color: #4F46E5; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;">
              Accept Invitation
            </a>
          </p>
          <p style="color: #999; font-size: 14px;">
            This link will expire in 7 days.
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send email:', error);
    throw new Error('Failed to send invite email');
  }
}
