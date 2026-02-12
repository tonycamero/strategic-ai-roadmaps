import 'dotenv/config';
import { sendEmail } from '../services/email.service.ts';

async function main() {
  const targetEmail = 'tony@strategicai.app';
  console.log(`[Verification] FROM_EMAIL: ${process.env.FROM_EMAIL}`);
  console.log(`[Verification] Attempting to send test email to: ${targetEmail}`);

  try {
    const data = await sendEmail({
      to: targetEmail,
      subject: 'Test Email from Strategic AI Roadmaps System',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h2 style="color: #1f2937;">System Verification Test</h2>
          <p style="color: #4b5563; line-height: 1.5;">This is a test email sent from the Strategic AI Roadmaps system to verify domain delivery to <strong>strategicai.app</strong>.</p>
          <div style="margin-top: 20px; padding: 15px; background-color: #f9fafb; border-radius: 6px;">
            <p style="margin: 0; font-size: 14px; color: #6b7280;">Timestamp: ${new Date().toISOString()}</p>
            <p style="margin: 5px 0 0 0; font-size: 14px; color: #6b7280;">Environment: ${process.env.NODE_ENV || 'development'}</p>
          </div>
          <p style="margin-top: 20px; color: #10b981; font-weight: bold;">Integration: Resend Success ✔️</p>
        </div>
      `
    });

    console.log('✅ Success! Resend Response:', data);
  } catch (error: any) {
    console.error('❌ Error sending test email:', error);
    process.exit(1);
  }
}

main();
