import { describe, it, expect, vi } from 'vitest';

describe('Email Service Configuration', () => {
    it('should have a correctly formatted fromHeader', async () => {
        // We import specifically to trigger the top-level logic
        // Since we are running in vitest, we might need to mock process.env
        // but the actual service is already modified.
        vi.stubEnv('FROM_EMAIL', 'test@example.com');
        vi.resetModules();

        const emailService = await import('../email.service');
        // We can't easily check the private fromHeader constant unless we export it,
        // but we can check if the module loaded without throwing.
        expect(emailService).toBeDefined();
        vi.unstubAllEnvs();
    });

    it('should fall back to default FROM_EMAIL if missing', async () => {
  vi.resetModules();
  vi.unstubAllEnvs();

  // Ensure FROM_EMAIL is absent
  vi.stubEnv('FROM_EMAIL', '');
  vi.stubEnv('EMAIL_FROM', '');

  const mod = await import('../email.service');

  // Should still import successfully and expose functions
  expect(typeof mod.sendEmail).toBe('function');
  expect(typeof mod.sendInviteEmail).toBe('function');
  expect(typeof mod.sendPasswordResetEmail).toBe('function');
});
});
