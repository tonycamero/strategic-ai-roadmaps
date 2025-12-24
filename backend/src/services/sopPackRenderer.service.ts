/**
 * SOP Pack Renderer Service
 * 
 * Generates Section 6 (SOP Pack) markdown directly from sop_tickets database.
 * This ensures 100% consistency between DB and rendered content.
 * 
 * GPT-4o no longer has discretion over sprint placement, hours, or costs.
 */

import type { SopTicket } from '../types/diagnostic';

export interface SopPackSection {
  section: 'sop_pack';
  title: string;
  content: string; // markdown
  order: number;
}

// Configuration constants
const HOURLY_RATE = 125;
const TIME_VALUE_PER_HOUR = 35;
const LEAD_VALUE = 35;

/**
 * Format currency with commas and dollar sign
 */
function formatCurrency(amount: number): string {
  return `$${Math.round(amount).toLocaleString('en-US')}`;
}

/**
 * Build complete SOP Pack section from database tickets
 * 
 * Generates:
 * - Sprint-organized ticket tables (30/60/90)
 * - Per-ticket detail blocks with implementation steps
 * - Investment summary
 * - ROI projection
 */
export function buildSopPackSection(tickets: SopTicket[]): SopPackSection {
  // Group tickets by tier (primary grouping)
  const tiers: Record<string, SopTicket[]> = {
    core: [],
    recommended: [],
    advanced: []
  };

  for (const ticket of tickets) {
    const tier = (ticket.tier || 'recommended').toLowerCase();
    if (!tiers[tier]) tiers[tier] = [];
    tiers[tier].push(ticket);
  }

  // Sort tickets within each tier by ticketId
  for (const tierKey of Object.keys(tiers)) {
    tiers[tierKey].sort((a, b) => 
      a.ticketId.localeCompare(b.ticketId)
    );
  }

  // Tier metadata
  const tierOrder: Array<{ 
    key: string; 
    label: string; 
    sprint: 30 | 60 | 90; 
    description: string;
    explanation: string;
  }> = [
    { 
      key: 'core',
      label: 'CORE Foundation', 
      sprint: 30, 
      description: 'Sprint 1 (30 Days)',
      explanation: 'Quick wins and critical pain relief. These tickets establish workflow foundations and eliminate urgent bottlenecks. Target payback: <4 weeks.'
    },
    { 
      key: 'recommended',
      label: 'RECOMMENDED Automation', 
      sprint: 60, 
      description: 'Sprint 2 (60 Days)',
      explanation: 'High-leverage systems that transform operations. These tickets build on CORE infrastructure to create strategic competitive advantages. Target payback: <8 weeks.'
    },
    { 
      key: 'advanced',
      label: 'ADVANCED Transformation', 
      sprint: 90, 
      description: 'Sprint 3 (90 Days)',
      explanation: 'Full AI transformation and predictive systems. These tickets represent industry-leading capabilities and position you for scale. Target payback: <16 weeks.'
    }
  ];

  // Accumulate totals (overall and per-tier)
  let totalHours = 0;
  let totalCost = 0;
  let totalHoursSavedWeekly = 0;
  let totalLeadsRecoveredMonthly = 0;

  const tierRollups: Record<string, {
    hours: number;
    cost: number;
    hoursSavedWeekly: number;
    leadsRecoveredMonthly: number;
  }> = {};

  const chunks: string[] = [];
  
  // Header
  chunks.push('# SOP Pack: Three-Tier Implementation Strategy');
  chunks.push('');
  chunks.push('## Investment Overview');
  chunks.push('');
  chunks.push('This roadmap is organized into **three implementation tiers**, allowing you to scale your investment based on business priorities:');
  chunks.push('');
  chunks.push('- **CORE (Sprint 30)**: Foundation systems + critical pain relief (5-8 hours per ticket)');
  chunks.push('- **RECOMMENDED (Sprint 60)**: High-leverage automation (8-12 hours per ticket)');
  chunks.push('- **ADVANCED (Sprint 90)**: Full AI transformation (12-15 hours per ticket)');
  chunks.push('');
  chunks.push('Each tier builds on the previous one, creating a strategic pathway from quick wins to industry-leading operations.');
  chunks.push('');

  // Generate tier sections
  for (const { key, label, sprint, description, explanation } of tierOrder) {
    const tierTickets = tiers[key] ?? [];
    
    // Calculate tier totals
    const tierHours = tierTickets.reduce((sum, t) => sum + t.time_estimate_hours, 0);
    const tierCost = tierTickets.reduce((sum, t) => sum + t.cost_estimate, 0);
    const tierHoursSaved = tierTickets.reduce(
      (sum, t) => sum + (t.projected_hours_saved_weekly ?? 0),
      0
    );
    const tierLeadsRecovered = tierTickets.reduce(
      (sum, t) => sum + (t.projected_leads_recovered_monthly ?? 0),
      0
    );

    // Store tier rollup
    tierRollups[key] = {
      hours: tierHours,
      cost: tierCost,
      hoursSavedWeekly: tierHoursSaved,
      leadsRecoveredMonthly: tierLeadsRecovered
    };

    totalHours += tierHours;
    totalCost += tierCost;
    totalHoursSavedWeekly += tierHoursSaved;
    totalLeadsRecoveredMonthly += tierLeadsRecovered;

    // Tier header
    chunks.push(`## ${label}`);
    chunks.push(`### ${description}`);
    chunks.push('');
    chunks.push(explanation);
    chunks.push('');
    
    if (tierTickets.length === 0) {
      chunks.push('*No tickets in this tier.*');
      chunks.push('');
      continue;
    }
    
    // Tier investment summary
    const annualHoursValue = tierHoursSaved * TIME_VALUE_PER_HOUR * 52;
    const annualLeadValue = tierLeadsRecovered * LEAD_VALUE * 12;
    const annualTotalValue = annualHoursValue + annualLeadValue;
    const paybackWeeks = tierCost > 0 && annualTotalValue > 0 ? (tierCost / (annualTotalValue / 52)) : 0;

    chunks.push(`**Investment:** ${formatCurrency(tierCost)} (${tierHours} hours)`);
    chunks.push(`**Annual Value:** ${formatCurrency(annualTotalValue)} (${tierHoursSaved}h/wk saved, ${tierLeadsRecovered} leads/mo recovered)`);
    if (paybackWeeks > 0) {
      chunks.push(`**Payback:** ~${Math.ceil(paybackWeeks)} weeks`);
    }
    chunks.push(`**Tickets:** ${tierTickets.length}`);
    chunks.push('');

    // Tier table
    chunks.push('| ID | Title | Category | Value Area | Owner | Sprint | Hours | Cost | Priority |');
    chunks.push('|----|-------|----------|------------|-------|--------|-------|------|----------|');

    for (const ticket of tierTickets) {
      chunks.push(
        `| ${ticket.ticketId} | ${ticket.title} | ${ticket.category} | ${ticket.value_category || 'General'} | ${ticket.owner} | ${sprint} | ${ticket.time_estimate_hours} | ${formatCurrency(ticket.cost_estimate)} | ${ticket.priority} |`
      );
    }

    chunks.push('');

    // Per-ticket detail blocks
    for (const ticket of tierTickets) {
      chunks.push(`### ${ticket.ticketId}: ${ticket.title}`);
      chunks.push('');
      
      if (ticket.pain_source) {
        chunks.push(`**Problem:** ${ticket.pain_source}`);
        chunks.push('');
      }
      
      if (ticket.current_state) {
        chunks.push(`**Current State:** ${ticket.current_state}`);
        chunks.push('');
      }
      
      if (ticket.target_state) {
        chunks.push(`**Target State:** ${ticket.target_state}`);
        chunks.push('');
      }

      // Implementation steps (numbered)
      const steps = ticket.implementation_steps ?? [];
      if (steps.length > 0) {
        chunks.push('**Implementation Steps:**');
        steps.forEach((step, idx) => {
          chunks.push(`${idx + 1}. ${step}`);
        });
        chunks.push('');
      }

      if (ticket.ai_design) {
        chunks.push(`**AI Design:** ${ticket.ai_design}`);
        chunks.push('');
      }

      if (ticket.ghl_implementation) {
        chunks.push(`**System Implementation:** ${ticket.ghl_implementation}`);
        chunks.push('');
      }

      if (ticket.success_metric) {
        chunks.push(`**Success Metric:** ${ticket.success_metric}`);
        chunks.push('');
      }

      // ROI projection
      const hoursSaved = ticket.projected_hours_saved_weekly ?? 0;
      const leadsRecovered = ticket.projected_leads_recovered_monthly ?? 0;

      if (hoursSaved > 0 || leadsRecovered > 0) {
        const annualHoursValue = hoursSaved * TIME_VALUE_PER_HOUR * 52;
        const annualLeadValue = leadsRecovered * LEAD_VALUE * 12;
        const ticketRoiValue = annualHoursValue + annualLeadValue;

        chunks.push(`**Projected ROI:**`);
        if (hoursSaved > 0) {
          chunks.push(`- Time saved: ~${hoursSaved} hours/week (${formatCurrency(annualHoursValue)}/year)`);
        }
        if (leadsRecovered > 0) {
          chunks.push(`- Leads recovered: ~${leadsRecovered}/month (${formatCurrency(annualLeadValue)}/year)`);
        }
        if (ticket.roi_notes) {
          chunks.push(`- ${ticket.roi_notes}`);
        }
        chunks.push('');
      }

      chunks.push('---');
      chunks.push('');
    }
  }

  // Overall investment summary with tier breakdown
  chunks.push('## Total Investment Summary');
  chunks.push('');
  chunks.push(`**Full Implementation (All Tiers):** ${formatCurrency(totalCost)} (${totalHours} hours @ ${formatCurrency(HOURLY_RATE)}/hr)`);
  chunks.push('');
  chunks.push('**Tier Breakdown:**');
  
  for (const { key, label } of tierOrder) {
    const rollup = tierRollups[key];
    if (rollup && rollup.cost > 0) {
      const tierTicketCount = tiers[key]?.length || 0;
      chunks.push(`- **${label}**: ${formatCurrency(rollup.cost)} (${rollup.hours} hrs) — ${tierTicketCount} tickets`);
    }
  }
  chunks.push('');
  chunks.push('**Cohort Pricing:** $5,000 (vs. $15K+ rack rate)');
  chunks.push('**Savings:** 67% off standard consulting rates');
  chunks.push('');

  // ROI projection summary
  const annualHoursValue = totalHoursSavedWeekly * TIME_VALUE_PER_HOUR * 52;
  const annualLeadValue = totalLeadsRecoveredMonthly * LEAD_VALUE * 12;
  const annualTotalValue = annualHoursValue + annualLeadValue;
  const paybackRatio = totalCost > 0 ? annualTotalValue / totalCost : 0;
  const paybackMonths = totalCost > 0 && annualTotalValue > 0 ? (totalCost / (annualTotalValue / 12)) : 0;

  chunks.push('## ROI Projection');
  chunks.push('');
  chunks.push('**Time Savings:**');
  chunks.push(`- Weekly hours recovered: ~${totalHoursSavedWeekly} hours`);
  chunks.push(`- Annual time value: ${formatCurrency(annualHoursValue)}`);
  chunks.push('');
  
  if (totalLeadsRecoveredMonthly > 0) {
    chunks.push('**Revenue Recovery:**');
    chunks.push(`- Monthly leads recovered: ~${totalLeadsRecoveredMonthly} leads`);
    chunks.push(`- Annual lead value: ${formatCurrency(annualLeadValue)}`);
    chunks.push('');
  }

  chunks.push('**Financial Summary:**');
  chunks.push(`- Total investment: ${formatCurrency(totalCost)}`);
  chunks.push(`- Annual value created: ${formatCurrency(annualTotalValue)}`);
  
  if (paybackMonths > 0) {
    if (paybackMonths < 1) {
      chunks.push(`- Payback period: ~${Math.ceil(paybackMonths * 30)} days`);
    } else {
      chunks.push(`- Payback period: ~${Math.ceil(paybackMonths)} months`);
    }
  }
  
  if (paybackRatio > 0) {
    chunks.push(`- ROI ratio: ${paybackRatio.toFixed(1)}x annualized`);
  }
  
  chunks.push('');

  // Top ROI drivers
  const ticketsWithROI = tickets
    .map(t => ({
      ...t,
      roiValue: 
        ((t.projected_hours_saved_weekly ?? 0) * TIME_VALUE_PER_HOUR * 52) +
        ((t.projected_leads_recovered_monthly ?? 0) * LEAD_VALUE * 12)
    }))
    .filter(t => t.roiValue > 0)
    .sort((a, b) => b.roiValue - a.roiValue)
    .slice(0, 3);

  if (ticketsWithROI.length > 0) {
    chunks.push('**Top ROI Drivers:**');
    ticketsWithROI.forEach((ticket, idx) => {
      const hoursSaved = ticket.projected_hours_saved_weekly ?? 0;
      const leadsRecovered = ticket.projected_leads_recovered_monthly ?? 0;
      const impact: string[] = [];
      
      if (hoursSaved > 0) impact.push(`${hoursSaved}h/wk saved`);
      if (leadsRecovered > 0) impact.push(`${leadsRecovered} leads/mo recovered`);
      
      chunks.push(`${idx + 1}. **${ticket.ticketId}: ${ticket.title}** — ${impact.join(', ')} (${formatCurrency(ticket.roiValue)}/year)`);
    });
    chunks.push('');
  }

  return {
    section: 'sop_pack',
    title: 'SOP Pack',
    content: chunks.join('\n'),
    order: 6
  };
}
