// PulseAgent configuration

export interface TrustAgentConfig {
  // Feature flags
  introEnabled: boolean;
  showRoiFlow: boolean;
  analyticsEnabled: boolean;

  // Content
  intro: {
    headline: string;
    subheadline: string;
    quickPicks: Array<{ label: string; flowId: string }>;
    primaryCtaLabel: string;
    secondaryCtaLabel: string;
  };

  panel: {
    title: string;
    subtitle: string;
  };

  // Timing
  introDelay: number; // ms before showing intro modal
  autoAdvanceDelay: number; // ms between auto-advancing messages
}

export const trustAgentMode = 'feta' as const;

// Default configuration
export const config: TrustAgentConfig = {
  // Feature flags
  introEnabled: true,
  showRoiFlow: true,
  analyticsEnabled: true,

  // Content
  intro: {
    headline: "Hi, I'm TrustAgent",
    subheadline: "I help you see if the Strategic AI Roadmap is a fit, in plain language. No sales pressure, just clarity.",
    quickPicks: [
      { label: 'What exactly is this Roadmap?', flowId: 'explain_roadmap' },
      { label: 'Is this right for my firm?', flowId: 'fit_check' },
      { label: 'Show me ROI examples', flowId: 'roi_teaser' },
    ],
    primaryCtaLabel: 'Start a quick chat',
    secondaryCtaLabel: 'Maybe later',
  },

  panel: {
    title: 'TrustAgent',
    subtitle: 'Your Strategic AI Roadmap intake specialist.',
  },

  // Timing
  introDelay: 800,
  autoAdvanceDelay: 800,
};

// Override config from environment variables
if (import.meta.env.VITE_TRUSTAGENT_INTRO_ENABLED === 'false') {
  config.introEnabled = false;
}

if (import.meta.env.VITE_TRUSTAGENT_SHOW_ROI === 'false') {
  config.showRoiFlow = false;
}

// Get filtered quick picks based on config
export function getQuickPicks() {
  let picks = [...config.intro.quickPicks];

  if (!config.showRoiFlow) {
    picks = picks.filter(pick => pick.flowId !== 'roi_teaser');
  }

  return picks;
}
