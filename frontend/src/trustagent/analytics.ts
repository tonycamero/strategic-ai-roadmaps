// Analytics tracking for TrustAgent events

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    fbq?: (...args: any[]) => void;
  }
}

export type TrustAgentEvent =
  | 'trustagent_opened'
  | 'trustagent_intro_seen'
  | 'trustagent_flow_started'
  | 'trustagent_flow_completed'
  | 'trustagent_cta_clicked'
  | 'trustagent_message_sent';

export interface EventPayload {
  flowId?: string;
  ctaId?: string;
  ctaType?: string;
  stepId?: string;
  [key: string]: any;
}

/**
 * Track TrustAgent event to analytics platforms
 * Safe to call even if analytics not installed
 */
export function track(event: TrustAgentEvent, payload?: EventPayload): void {
  // Google Analytics 4
  if (typeof window.gtag === 'function') {
    try {
      window.gtag('event', event, payload);
    } catch (error) {
      console.warn('Failed to send GA4 event:', error);
    }
  }

  // Facebook Pixel
  if (typeof window.fbq === 'function') {
    try {
      window.fbq('trackCustom', event, payload);
    } catch (error) {
      console.warn('Failed to send FB Pixel event:', error);
    }
  }

  // Development logging
  if (import.meta.env.DEV) {
    console.log('[TrustAgent Analytics]', event, payload);
  }
}

// Convenience functions
export const analytics = {
  opened: () => track('trustagent_opened'),

  introSeen: () => track('trustagent_intro_seen'),

  flowStarted: (flowId: string) => track('trustagent_flow_started', { flowId }),

  flowCompleted: (flowId: string) => track('trustagent_flow_completed', { flowId }),

  ctaClicked: (ctaType: string, ctaId?: string) => track('trustagent_cta_clicked', { ctaType, ctaId }),

  messageSent: (isUser: boolean) => track('trustagent_message_sent', { speaker: isUser ? 'user' : 'agent' }),
};
