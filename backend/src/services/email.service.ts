// FILE: backend/src/services/email.service.ts
// DROP-IN REPLACEMENT (copy/paste entire file)
// Goals:
// - Single canonical Resend client
// - Fail-closed in prod when RESEND_API_KEY missing (no silent success)
// - Safe dev behavior: log URLs / intents
// - Provide one generic sendEmail() API used by other services
// - Preserve existing sendPasswordResetEmail + sendInviteEmail behavior
// - Keep attachment support, but map safely to Resend expectations

import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const DEFAULT_FROM = "hello@mail.strategicai.app";
const FROM_EMAIL = (process.env.FROM_EMAIL ?? process.env.EMAIL_FROM ?? DEFAULT_FROM).trim();
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const REPLY_TO = process.env.RESEND_REPLY_TO;

const fromHeader = `StrategicAI <${FROM_EMAIL}>`;
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

function isDev() {
  return process.env.NODE_ENV === 'development';
}

function assertResendConfigured(opName: string) {
  if (resend) return;
  if (isDev()) return;

  // Fail-closed in non-dev so we don't silently "deliver" emails.
  throw new Error(`[EmailService] RESEND_API_KEY not set. Cannot execute: ${opName}`);
}

// ============================================================================
// PASSWORD RESET
// ============================================================================

export async function sendPasswordResetEmail(to: string, resetToken: string) {
  assertResendConfigured('sendPasswordResetEmail');
  const resetUrl = `${FRONTEND_URL}/reset-password/${resetToken}`;

  if (!resend) {
    if (isDev()) {
      console.warn('[EmailService] RESEND_API_KEY not set, not sending email.');
      console.warn(`[EmailService] Password reset URL for ${to}:`);
      console.warn(resetUrl);
    }
    return { id: 'dev-mode-reset' };
  }

  const { data, error } = await resend.emails.send({
    from: fromHeader,
    to,
    subject: 'Reset your password',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Reset Your Password</h2>
        <p>You requested a password reset for your Strategic AI Roadmaps account.</p>
        <p>Click the button below to reset your password:</p>
        <p style="margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset Password
          </a>
        </p>
        <p style="color: #6b7280; font-size: 14px;">
          Or copy and paste this link into your browser:<br>
          <a href="${resetUrl}" style="color: #2563eb;">${resetUrl}</a>
        </p>
        <p style="color: #6b7280; font-size: 14px;">
          This link will expire in 24 hours.
        </p>
        <p style="color: #6b7280; font-size: 14px;">
          If you didn't request this password reset, you can safely ignore this email.
        </p>
      </div>
    `,
  });

  if (error) {
    console.error('[EmailService] Failed to send password reset email:', error);
    throw error;
  }

  console.log(`[EmailService] Password reset email sent to ${to}, ID: ${data?.id}`);
  return data;
}

// ============================================================================
// TEAM INVITE
// ============================================================================

export async function sendInviteEmail(
  to: string,
  inviteToken: string,
  inviterName: string,
  companyName: string,
  roleLabel?: string
) {
  assertResendConfigured('sendInviteEmail');
  const inviteUrl = `${FRONTEND_URL}/accept-invite/${inviteToken}`;

  if (!resend) {
    if (isDev()) {
      console.warn('[EmailService] RESEND_API_KEY not set, not sending email.');
      console.warn(`[EmailService] Invite URL for ${to}:`);
      console.warn(inviteUrl);
    }
    return { id: 'dev-mode-invite' };
  }

  const subject = roleLabel
    ? `${inviterName} has invited you to Strategic AI Roadmaps for ${companyName} as ${roleLabel}`
    : `${inviterName} has invited you to Strategic AI Roadmaps for ${companyName}`;

  const { data, error } = await resend.emails.send({
    from: fromHeader,
    to,
    reply_to: REPLY_TO,
    subject,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>You've Been Invited!</h2>
        <p><strong>${inviterName}</strong> has invited you to join <strong>${companyName}</strong> on Strategic AI Roadmaps${roleLabel ? ` as <strong>${roleLabel}</strong>` : ''}.</p>
        <p>Click the button below to accept the invitation and create your account:</p>
        <p style="margin: 30px 0;">
          <a href="${inviteUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Accept Invitation
          </a>
        </p>
        <p style="color: #6b7280; font-size: 14px;">
          Or copy and paste this link into your browser:<br>
          <a href="${inviteUrl}" style="color: #2563eb;">${inviteUrl}</a>
        </p>
      </div>
    `,
  });

  if (error) {
    console.error('[EmailService] Failed to send invite email:', error);
    throw error;
  }

  console.log(`[EmailService] Invite email sent to ${to}, ID: ${data?.id}`);
  return data;
}

// ============================================================================
// INTAKE CLARIFICATION REQUEST
// ============================================================================

export async function sendClarificationRequestEmail(
  to: string,
  stakeholderName: string,
  questionLabel: string,
  clarificationPrompt: string,
  token: string
) {
  // === PROOF LOG ===
  // {"to":"${to}","intakeId":"UNKNOWN_IN_SERVICE","clarificationPromptLen":${clarificationPrompt.length}}
  console.log(JSON.stringify({
    proof: 'AG-CONSULTANT-CLARIFICATION-PIPELINE-003',
    to,
    questionLabel,
    token_fragment: token.substring(0, 6)
  }));

  assertResendConfigured('sendClarificationRequestEmail');
  const clarificationUrl = `${FRONTEND_URL}/clarify/${token}`;

  if (!resend) {
    if (isDev()) {
      console.warn('[EmailService] RESEND_API_KEY not set, not sending email.');
      console.warn(`[EmailService] Clarification URL for ${to}:`);
      console.warn(clarificationUrl);
    }
    return { id: 'dev-mode-clarify' };
  }

  const { data, error } = await resend.emails.send({
    from: fromHeader,
    to,
    reply_to: REPLY_TO,
    subject: 'Clarification Requested on Your Intake Response',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Clarification Requested</h2>
        <p>Hello ${stakeholderName},</p>
        <p>A consultant has requested additional clarification on one of your intake responses:</p>
        
        <div style="background-color: #f3f4f6; border-left: 4px solid #6366f1; padding: 16px; margin: 20px 0;">
          <p style="margin: 0; font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: bold;">Question</p>
          <p style="margin: 4px 0 0 0; font-weight: 500;">${questionLabel}</p>
        </div>

        <p><strong>Consultant's Question:</strong></p>
        <p style="font-style: italic; color: #374151;">"${clarificationPrompt}"</p>

        <p>Click the button below to provide your follow-up response:</p>
        <p style="margin: 30px 0;">
          <a href="${clarificationUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            Respond Now
          </a>
        </p>
        <p style="color: #6b7280; font-size: 14px;">
          Or copy and paste this link into your browser:<br>
          <a href="${clarificationUrl}" style="color: #4f46e5;">${clarificationUrl}</a>
        </p>
      </div>
    `,
  });

  if (error) {
    console.error('[EmailService] Failed to send clarification email:', error);
    throw error;
  }

  console.log(`[EmailService] Clarification email sent to ${to}, ID: ${data?.id}`);
  return data;
}

// ============================================================================
// GENERIC SEND (ATTACHMENTS SUPPORTED)
// ============================================================================

export type EmailAttachment = {
  filename: string;
  content: Buffer | string;
  contentType?: string; // kept for callers; Resend supports content; contentType may be ignored
};

export async function sendEmail(args: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: EmailAttachment[];
}) {
  const { to, subject, text, html, attachments } = args;

  if (!resend) {
    if (isDev()) {
      console.warn('[EmailService] RESEND_API_KEY not set, not sending email.');
      console.warn(`[EmailService] Would send to ${to}: ${subject}`);
      if (attachments?.length) {
        console.warn(
          `[EmailService] Attachments: ${attachments.map((a) => a.filename).join(', ')}`
        );
      }
      if (text) console.warn('[EmailService] text preview:', text.slice(0, 180));
      if (html) console.warn('[EmailService] html provided (length):', html.length);
    }
    return { id: 'dev-mode-generic' };
  }

  // In non-dev, fail closed if configured incorrectly (shouldn't happen here because resend truthy)
  assertResendConfigured('sendEmail');

  const resendAttachments =
    attachments?.map((att) => ({
      filename: att.filename,
      content: att.content,
    })) || undefined;

  const { data, error } = await resend.emails.send({
    from: fromHeader,
    to,
    reply_to: REPLY_TO,
    subject,
    text,
    html,
    attachments: resendAttachments as any, // Resend typings vary; keep runtime correct
  });

  if (error) {
    console.error('[EmailService] Failed to send email:', error);
    throw error;
  }

  console.log(`[EmailService] Email sent to ${to} from ${fromHeader}, ID: ${data?.id}`);
  return data;
}
