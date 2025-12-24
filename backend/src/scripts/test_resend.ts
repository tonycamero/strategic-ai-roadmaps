import dotenv from 'dotenv';
import { Resend } from 'resend';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

async function testResend() {
  console.log('[Resend Test] Testing email delivery...\n');
  
  try {
    const { data, error } = await resend.emails.send({
      from: 'Tony Camero <tony@tonycamero.com>',
      to: ['tony@tonycamero.com'],
      subject: 'Test Email from Strategic AI Roadmap',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Resend Integration Test</h2>
          <p style="color: #666; line-height: 1.6;">
            This is a test email from your Strategic AI Roadmap application.
          </p>
          <p style="color: #666;">
            If you're seeing this, Resend is properly configured! 🎉
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('❌ Error sending email:', error);
      return;
    }

    console.log('✅ Email sent successfully!');
    console.log('Email ID:', data?.id);
  } catch (err: any) {
    console.error('❌ Failed to send test email:', err.message);
  }
}

testResend();
