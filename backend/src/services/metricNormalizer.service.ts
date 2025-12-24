/**
 * Metric Normalizer Service
 * 
 * Accepts various metric sources (manual input, CSV, API exports) and normalizes
 * them into a consistent schema for snapshot/outcome tracking.
 */

export interface NormalizedMetrics {
  lead_response_minutes?: number;
  lead_to_appt_rate?: number;
  close_rate?: number;
  crm_adoption_rate?: number;
  weekly_ops_hours?: number;
  nps?: number;
}

export interface RawMetrics {
  [key: string]: any;
}

/**
 * Normalize raw metrics from any source into standardized schema.
 * 
 * Handles:
 * - Field name variations (camelCase, snake_case, Title Case)
 * - Unit conversions (percentages as strings "85%" → 85)
 * - Numeric coercion
 * - Unknown field dropping
 */
export function normalizeMetrics(rawMetrics: RawMetrics): NormalizedMetrics {
  const normalized: NormalizedMetrics = {};

  // Field name mappings (support common variations)
  const fieldMappings: Record<string, keyof NormalizedMetrics> = {
    // Lead response time
    'lead_response_minutes': 'lead_response_minutes',
    'leadResponseMinutes': 'lead_response_minutes',
    'Lead Response Time': 'lead_response_minutes',
    'response_time': 'lead_response_minutes',
    'avg_response_time': 'lead_response_minutes',

    // Lead to appointment rate
    'lead_to_appt_rate': 'lead_to_appt_rate',
    'leadToApptRate': 'lead_to_appt_rate',
    'Lead to Appt Rate': 'lead_to_appt_rate',
    'appt_rate': 'lead_to_appt_rate',
    'appointment_rate': 'lead_to_appt_rate',

    // Close rate
    'close_rate': 'close_rate',
    'closeRate': 'close_rate',
    'Close Rate': 'close_rate',
    'conversion_rate': 'close_rate',

    // CRM adoption
    'crm_adoption_rate': 'crm_adoption_rate',
    'crmAdoptionRate': 'crm_adoption_rate',
    'CRM Adoption': 'crm_adoption_rate',
    'adoption_rate': 'crm_adoption_rate',

    // Weekly ops hours
    'weekly_ops_hours': 'weekly_ops_hours',
    'weeklyOpsHours': 'weekly_ops_hours',
    'Weekly Ops Hours': 'weekly_ops_hours',
    'ops_hours': 'weekly_ops_hours',
    'hours_per_week': 'weekly_ops_hours',

    // NPS
    'nps': 'nps',
    'NPS': 'nps',
    'net_promoter_score': 'nps',
    'netPromoterScore': 'nps',
  };

  // Process each field in raw metrics
  for (const [rawKey, rawValue] of Object.entries(rawMetrics)) {
    const normalizedKey = fieldMappings[rawKey];
    
    if (!normalizedKey) {
      // Unknown field - drop it
      continue;
    }

    // Convert to number
    const numericValue = coerceToNumber(rawValue);
    
    if (numericValue !== null && !isNaN(numericValue)) {
      normalized[normalizedKey] = numericValue;
    }
  }

  return normalized;
}

/**
 * Coerce various input types to number.
 * 
 * Handles:
 * - Numbers: 85 → 85
 * - Percentage strings: "85%" → 85
 * - String numbers: "42" → 42
 * - Floats: 3.14 → 3.14
 * - Invalid: "abc" → null
 */
function coerceToNumber(value: any): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  // Already a number
  if (typeof value === 'number') {
    return value;
  }

  // String conversion
  if (typeof value === 'string') {
    // Remove percentage sign if present
    const cleaned = value.trim().replace('%', '');
    
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  }

  // Boolean → number (for binary metrics)
  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }

  return null;
}

/**
 * Validate normalized metrics (optional strict validation).
 * Returns array of validation errors.
 */
export function validateMetrics(metrics: NormalizedMetrics): string[] {
  const errors: string[] = [];

  // Validate ranges
  if (metrics.lead_response_minutes !== undefined) {
    if (metrics.lead_response_minutes < 0) {
      errors.push('lead_response_minutes must be non-negative');
    }
  }

  if (metrics.lead_to_appt_rate !== undefined) {
    if (metrics.lead_to_appt_rate < 0 || metrics.lead_to_appt_rate > 100) {
      errors.push('lead_to_appt_rate must be between 0 and 100');
    }
  }

  if (metrics.close_rate !== undefined) {
    if (metrics.close_rate < 0 || metrics.close_rate > 100) {
      errors.push('close_rate must be between 0 and 100');
    }
  }

  if (metrics.crm_adoption_rate !== undefined) {
    if (metrics.crm_adoption_rate < 0 || metrics.crm_adoption_rate > 100) {
      errors.push('crm_adoption_rate must be between 0 and 100');
    }
  }

  if (metrics.weekly_ops_hours !== undefined) {
    if (metrics.weekly_ops_hours < 0) {
      errors.push('weekly_ops_hours must be non-negative');
    }
  }

  if (metrics.nps !== undefined) {
    if (metrics.nps < -100 || metrics.nps > 100) {
      errors.push('nps must be between -100 and 100');
    }
  }

  return errors;
}
