
import 'dotenv/config';
import * as emailService from '../services/email.service';

/**
 * MANUAL ACTION: Resend invite to Kaitlin Gligo
 * Tenant: Ninkasi Brewing
 * Owner: Marissa Spalding
 * Token: OeovWCkmsIc5Am7GuyPsvNL_2xDQ-025g982qs6EAjQ
 */
async function resendInvite() {
    console.log('🚀 Resending invite to Kaitlin Gligo...');

    const recipientEmail = 'kaitlin.g@gfbev.com';
    // Token found in DB causing existing invite conflict
    const inviteToken = 'OeovWCkmsIc5Am7GuyPsvNL_2xDQ-025g982qs6EAjQ';
    const inviterName = 'Marissa Spalding';
    const companyName = 'Ninkasi Brewing Company';
    const roleLabel = 'Executive Sponsor';

    try {
        console.log(` - Dispatching to: ${recipientEmail}`);
        console.log(` - Token: ${inviteToken}`);

        const result = await emailService.sendInviteEmail(
            recipientEmail,
            inviteToken,
            inviterName,
            companyName,
            roleLabel
        );
        console.log(`✅ Email sent successfully! Message ID: ${result?.id}`);
    } catch (error) {
        console.error('❌ Failed to send email:', error);
        process.exit(1);
    }
}

resendInvite();
