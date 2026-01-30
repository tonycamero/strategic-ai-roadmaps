/**
 * ⚠️ EXECUTION LOCK — DO NOT MODIFY CASUALLY
 *
 * This file is governed by /working_protocol.md
 *
 * Default mode: NON-DESTRUCTIVE
 * Forbidden unless explicitly authorized:
 * - Refactors
 * - File moves or deletions
 * - API contract changes
 * - Dropping fields (e.g. cta, reveal)
 *
 * If unsure: STOP and ask before editing.
 */

// Flow types and state machine for simulated PulseAgent conversations

export type FlowId = 'intro' | 'explain_roadmap' | 'fit_check' | 'roi_teaser';

export interface FlowStep {
  id: string;
  message: string;
  speaker: 'agent' | 'user';
  options?: FlowOption[];
  cta?: CTAAction;
  nextId?: string;
}

export interface FlowOption {
  id: string;
  label: string;
  nextStepId?: string;
}

export interface CTAAction {
  type: 'book_call' | 'view_sample_roadmap' | 'view_metrics_demo' | 'external_link';
  label: string;
  url?: string;
}

export interface ConversationMessage {
  id: string;
  speaker: 'agent' | 'user';
  message: string;
  timestamp: Date;
  options?: FlowOption[];
  cta?: CTAAction;
  reveal?: {
    headline: string;
    signals: string[];
    diagnosis: string;
  };
}

// Flow definitions
export const flows: Record<FlowId, FlowStep[]> = {
  intro: [
    {
      id: 'intro-1',
      speaker: 'agent',
      message: "Hi! I'm TrustConsole. I help teams understand if the Strategic AI Roadmap is right for them. What would you like to know?",
      options: [
        { id: 'opt-1', label: 'What is the Roadmap?', nextStepId: 'intro-explain' },
        { id: 'opt-2', label: 'Who is this for?', nextStepId: 'intro-fit' },
        { id: 'opt-3', label: 'Show me ROI examples', nextStepId: 'intro-roi' },
      ],
    },
    {
      id: 'intro-explain',
      speaker: 'agent',
      message: "The Strategic AI Roadmap is a custom implementation plan for professional service firms. It's not software—it's a blueprint showing exactly what to build, why, and how to execute it over 90 days.",
      nextId: 'intro-2',
    },
    {
      id: 'intro-fit',
      speaker: 'agent',
      message: "This is built for professional service firms (law, real estate, consulting, etc.) with 5-50 people who want to modernize workflows without adding complexity. If you're tired of leads slipping through cracks and manual processes, you're in the right place.",
      nextId: 'intro-2',
    },
    {
      id: 'intro-roi',
      speaker: 'agent',
      message: "Typical outcomes: 40% faster lead response, 15-25% close rate improvement, 10-20 hours/week saved on ops work. The roadmap shows you the exact systems to build these results.",
      nextId: 'intro-2',
    },
    {
      id: 'intro-2',
      speaker: 'agent',
      message: "Want to dive deeper?",
      options: [
        { id: 'opt-4', label: 'See the full process', nextStepId: 'intro-process' },
        { id: 'opt-5', label: 'Check if we\'re a fit', nextStepId: 'intro-fit-check' },
        { id: 'opt-6', label: 'Book a strategy call', nextStepId: 'intro-book' },
      ],
    },
    {
      id: 'intro-process',
      speaker: 'agent',
      message: "Here's how it works:\n\n1. **Discovery call** (30 min) - I learn your pain points\n2. **Roadmap delivery** (7 days) - Custom 8-section strategic plan\n3. **Implementation** (90 days) - You build it, I guide you\n\nNo agencies, no monthly fees. Just a clear plan and execution support.",
      cta: {
        type: 'book_call',
        label: 'Book my discovery call',
      },
    },
    {
      id: 'intro-fit-check',
      speaker: 'agent',
      message: "Let me ask a few quick questions to see if this is right for you.",
      nextId: 'fit-check-1',
    },
    {
      id: 'intro-book',
      speaker: 'agent',
      message: "Great! Let's schedule a 30-minute strategy call. I'll learn about your firm, and we'll see if the Roadmap is a fit.",
      cta: {
        type: 'book_call',
        label: 'Schedule call',
      },
    },
  ],

  explain_roadmap: [
    {
      id: 'explain-1',
      speaker: 'agent',
      message: "The Strategic AI Roadmap is **not software**—it's a custom implementation plan built specifically for your firm.",
    },
    {
      id: 'explain-2',
      speaker: 'agent',
      message: "You get:\n\n• 8-section strategic document\n• Systems architecture diagrams\n• 30/60/90-day execution timeline\n• Tool recommendations\n• ROI projections\n\nThink of it as the blueprint before you build.",
      options: [
        { id: 'opt-7', label: 'What systems do you typically recommend?', nextStepId: 'explain-systems' },
        { id: 'opt-8', label: 'How much does implementation cost?', nextStepId: 'explain-cost' },
        { id: 'opt-9', label: 'Can I see a sample roadmap?', nextStepId: 'explain-sample' },
      ],
    },
    {
      id: 'explain-systems',
      speaker: 'agent',
      message: "Common systems:\n\n• **Lead follow-up automation** (no more slipping through cracks)\n• **Client onboarding workflows** (branded, digital, professional)\n• **Performance dashboards** (see what your team is actually doing)\n• **AI coaching agents** (on-demand support for your staff)\n\nEach roadmap is custom based on your pain points.",
      cta: {
        type: 'book_call',
        label: 'Discuss my systems',
      },
    },
    {
      id: 'explain-cost',
      speaker: 'agent',
      message: "The Roadmap itself is a flat fee (typically $5-15k depending on scope).\n\nImplementation is separate—you can build in-house, hire devs, or use no-code tools. Most firms spend $20-50k total over 90 days.\n\nThe ROI usually pays back in 6-12 months.",
      cta: {
        type: 'book_call',
        label: 'Get pricing for my firm',
      },
    },
    {
      id: 'explain-sample',
      speaker: 'agent',
      message: "I can't share a full client roadmap (confidential), but I can show you the structure and sample sections.",
      cta: {
        type: 'view_sample_roadmap',
        label: 'View sample structure',
      },
    },
  ],

  fit_check: [
    {
      id: 'fit-check-1',
      speaker: 'agent',
      message: "Let's see if this is a fit. First question: How many people are on your team?",
      options: [
        { id: 'opt-10', label: 'Just me (solo)', nextStepId: 'fit-solo' },
        { id: 'opt-11', label: '2-5 people', nextStepId: 'fit-small' },
        { id: 'opt-12', label: '6-15 people', nextStepId: 'fit-ideal' },
        { id: 'opt-13', label: '16-50 people', nextStepId: 'fit-ideal' },
        { id: 'opt-14', label: '50+ people', nextStepId: 'fit-large' },
      ],
    },
    {
      id: 'fit-solo',
      speaker: 'agent',
      message: "For solo operators, the Roadmap might be early. You'd get more value once you hit 2-3 people and start feeling workflow pain.\n\nThat said, if you're planning to scale soon, we can build systems that grow with you.",
      options: [
        { id: 'opt-15', label: 'I\'m planning to scale', nextStepId: 'fit-check-2' },
        { id: 'opt-16', label: 'Maybe later', nextStepId: 'fit-end' },
      ],
    },
    {
      id: 'fit-small',
      speaker: 'agent',
      message: "Perfect size. At 2-5 people, you're feeling the pain of manual processes but not so large that change is impossible. This is the sweet spot.",
      nextId: 'fit-check-2',
    },
    {
      id: 'fit-ideal',
      speaker: 'agent',
      message: "Excellent. At your size, workflow automation and visibility tools are game-changers. You're in the ideal range.",
      nextId: 'fit-check-2',
    },
    {
      id: 'fit-large',
      speaker: 'agent',
      message: "At 50+ people, you likely need enterprise-grade tools. The Roadmap can still help define architecture, but implementation will be more complex (and expensive).",
      nextId: 'fit-check-2',
    },
    {
      id: 'fit-check-2',
      speaker: 'agent',
      message: "Next: Do you currently use a CRM or workflow tool?",
      options: [
        { id: 'opt-17', label: 'Yes, we use HubSpot/Salesforce/etc.', nextStepId: 'fit-crm-yes' },
        { id: 'opt-18', label: 'We use spreadsheets/email', nextStepId: 'fit-crm-no' },
        { id: 'opt-19', label: 'We tried tools but gave up', nextStepId: 'fit-crm-failed' },
      ],
    },
    {
      id: 'fit-crm-yes',
      speaker: 'agent',
      message: "Great! Having a CRM means we can integrate and automate around it. Most of my clients come in with HubSpot or similar—we just make it actually work for them.",
      nextId: 'fit-result-strong',
    },
    {
      id: 'fit-crm-no',
      speaker: 'agent',
      message: "No problem. Part of the Roadmap is selecting the right tools. We'll recommend simple, affordable options that fit your workflow (not the other way around).",
      nextId: 'fit-result-strong',
    },
    {
      id: 'fit-crm-failed',
      speaker: 'agent',
      message: "That's common. Tools fail when they're implemented without a plan. The Roadmap solves that—we design the workflow first, then pick tools that fit.",
      nextId: 'fit-result-strong',
    },
    {
      id: 'fit-result-strong',
      speaker: 'agent',
      message: "**You're a strong fit.** Based on your team size and workflow needs, the Strategic AI Roadmap would likely deliver significant value.\n\nWant to book a discovery call to explore this further?",
      cta: {
        type: 'book_call',
        label: 'Book discovery call',
      },
    },
    {
      id: 'fit-end',
      speaker: 'agent',
      message: "No problem! Feel free to reach out when you're ready. You can always click the bubble in the top-right to chat again.",
    },
  ],

  roi_teaser: [
    {
      id: 'roi-1',
      speaker: 'agent',
      message: "Let me show you typical outcomes from firms that implement their roadmap:",
    },
    {
      id: 'roi-2',
      speaker: 'agent',
      message: "**Lead Response Time**\nBefore: 60+ minutes\nAfter: 15 minutes\nImpact: 40% more appointments booked\n\n**Close Rate**\nBefore: 15%\nAfter: 22%\nImpact: $150k+ annual revenue increase\n\n**Ops Hours Saved**\nBefore: 30 hrs/week on admin\nAfter: 15 hrs/week\nImpact: $75k/year in reclaimed time",
      options: [
        { id: 'opt-20', label: 'How do you calculate ROI?', nextStepId: 'roi-calc' },
        { id: 'opt-21', label: 'Show me a real case study', nextStepId: 'roi-case' },
        { id: 'opt-22', label: 'Calculate ROI for my firm', nextStepId: 'roi-custom' },
      ],
    },
    {
      id: 'roi-calc',
      speaker: 'agent',
      message: "ROI comes from:\n\n1. **Time savings** (ops hours reclaimed × staff cost/hour)\n2. **Revenue impact** (higher close rates × deal volume)\n3. **Cost avoidance** (fewer manual errors, less turnover)\n\nTypical payback: 6-12 months.\nTypical 3-year ROI: 300-500%.",
      cta: {
        type: 'view_metrics_demo',
        label: 'See detailed metrics',
      },
    },
    {
      id: 'roi-case',
      speaker: 'agent',
      message: "I can't share full client names publicly, but I can show you anonymized case studies with real numbers.",
      cta: {
        type: 'view_sample_roadmap',
        label: 'View case study',
      },
    },
    {
      id: 'roi-custom',
      speaker: 'agent',
      message: "To calculate ROI for your specific firm, I'll need to understand your current metrics during a discovery call.\n\nWe'll estimate:\n• Your current lead-to-close rate\n• Staff costs\n• Deal volume\n• Ops time spent on manual work\n\nThen project improvements based on similar firms.",
      cta: {
        type: 'book_call',
        label: 'Calculate my ROI',
      },
    },
  ],
};

// Helper to get flow by ID
export function getFlow(flowId: FlowId): FlowStep[] {
  return flows[flowId] || flows.intro;
}

// Helper to find step in flow
export function findStep(flowId: FlowId, stepId: string): FlowStep | undefined {
  const flow = getFlow(flowId);
  return flow.find(step => step.id === stepId);
}

// Helper to get initial step
export function getInitialStep(flowId: FlowId): FlowStep {
  const flow = getFlow(flowId);
  return flow[0];
}
