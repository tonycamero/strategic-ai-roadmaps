// ============================================================================
// BUSINESS TYPE PROFILES
// ============================================================================
// Single source of truth for multi-vertical customization.
// Controls labels, intakes, KPIs, and other business-type-specific UX.

export type BusinessType = 'default' | 'chamber' | 'manufacturing' | 'enterprise';

export interface BusinessTypeProfile {
  id: BusinessType;
  label: string;
  description: string;
  roleLabels: {
    sales: string;
    ops: string;
    delivery: string;
    owner: string;
    exec_sponsor: string;
  };
  intakeCopy: {
    salesIntro: string;
    opsIntro: string;
    deliveryIntro: string;
    ownerIntro: string;
    execSponsorIntro: string;
  };
  kpis: string[];
}

export const BUSINESS_TYPE_PROFILES: Record<BusinessType, BusinessTypeProfile> = {
  default: {
    id: 'default',
    label: 'Professional Services Firm',
    description: 'CPAs, agencies, insurance, real estate, and similar service businesses.',
    roleLabels: {
      sales: 'Sales',
      ops: 'Operations',
      delivery: 'Delivery / Fulfillment',
      owner: 'Owner / Leadership',
      exec_sponsor: 'Executive Sponsor',
    },
    intakeCopy: {
      salesIntro: 'This intake covers how you attract, qualify, and close new business.',
      opsIntro: 'This intake covers your internal processes, tools, and data quality.',
      deliveryIntro: 'This intake covers how you deliver your product or service to clients.',
      ownerIntro: 'This intake covers your goals, constraints, and priorities as the owner.',
      execSponsorIntro: 'This intake covers high-level strategic alignment and organizational growth.',
    },
    kpis: [
      'New leads per month',
      'Lead-to-opportunity conversion rate',
      'Opportunity-to-close conversion rate',
      'Average response time to new leads',
      'Revenue per full-time employee',
    ],
  },
  chamber: {
    id: 'chamber',
    label: 'Chamber of Commerce',
    description: 'Regional chambers, business alliances, and similar membership organizations.',
    roleLabels: {
      sales: 'Membership Development',
      ops: 'Operations / Administration',
      delivery: 'Programs & Events',
      owner: 'CEO / Executive Leadership',
      exec_sponsor: 'Executive Sponsor / Board Member',
    },
    intakeCopy: {
      salesIntro: 'This intake covers how you attract, onboard, and renew members.',
      opsIntro: 'This intake covers your back-office processes, systems, and member data.',
      deliveryIntro: 'This intake covers your events, programs, committees, and engagement.',
      ownerIntro: 'This intake covers your 12-month goals, constraints, and priorities as CEO.',
      execSponsorIntro: 'This intake covers mission alignment, board priorities, and long-term impact.',
    },
    kpis: [
      'New members per month',
      'First-year renewal rate',
      'Overall member renewal rate',
      'Average time to follow up with new members',
      'Average event attendance vs. capacity',
      'Number of engaged members in the last 90 days',
      'Sponsor revenue per quarter',
    ],
  },
  manufacturing: {
    id: 'manufacturing',
    label: 'Manufacturing / Industrial',
    description: 'Manufacturing facilities, industrial operations, and production companies.',
    roleLabels: {
      sales: 'Sales / Estimating',
      ops: 'Operations / Logistics',
      delivery: 'Production / Quality',
      owner: 'Owner / CEO',
      exec_sponsor: 'Executive Sponsor',
    },
    intakeCopy: {
      salesIntro: 'Covers estimating, quoting, and client acquisition.',
      opsIntro: 'Covers logistics, supply chain, and back-office.',
      deliveryIntro: 'Covers shop floor, production planning, and quality control.',
      ownerIntro: 'Covers strategy, capital allocation, and risk.',
      execSponsorIntro: 'Covers board relations and enterprise value.',
    },
    kpis: ['OEE', 'Lead time', 'Defect rate', 'Revenue per workstation'],
  },
  enterprise: {
    id: 'enterprise',
    label: 'Enterprise',
    description: 'Large-scale organizations with multiple departments.',
    roleLabels: {
      sales: 'Revenue / Sales',
      ops: 'Operations / IT',
      delivery: 'Product / Delivery',
      owner: 'Executive Leadership',
      exec_sponsor: 'Corporate Sponsor',
    },
    intakeCopy: {
      salesIntro: 'Covers complex sales cycles and account management.',
      opsIntro: 'Covers infrastructure, shared services, and compliance.',
      deliveryIntro: 'Covers delivery at scale and cross-dept coordination.',
      ownerIntro: 'Covers large-scale vision and shareholder value.',
      execSponsorIntro: 'Covers governance and transformational alignment.',
    },
    kpis: ['LTV', 'CAC', 'Churn', 'NPS', 'Dept utilization'],
  },
};


export const DEFAULT_BUSINESS_TYPE: BusinessType = 'default';

/**
 * Get the business type profile for a given business type.
 * Falls back to 'default' if the business type is not recognized.
 */
export function getBusinessTypeProfile(businessType?: string | null): BusinessTypeProfile {
  if (businessType === 'chamber') return BUSINESS_TYPE_PROFILES.chamber;
  return BUSINESS_TYPE_PROFILES.default;
}
