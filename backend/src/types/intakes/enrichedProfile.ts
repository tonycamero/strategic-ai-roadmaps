/**
 * Enriched Intake Profile Types
 * 
 * These fields can be embedded in any intake's answers JSON to capture
 * role-specific details, issues, goals, KPIs, and implementation readiness.
 */

export type DepartmentKey =
  | 'owner'
  | 'sales'
  | 'marketing'
  | 'ops'
  | 'delivery'
  | 'service'
  | 'finance'
  | 'admin'
  | 'other';

export type ChangeReadiness = 'low' | 'medium' | 'high';

export interface EnrichedIntakeProfile {
  // Role & Department
  role_label?: string;              // "Owner", "Sales Lead", etc
  department_key?: DepartmentKey;   // normalized enum

  // Issues & Goals
  top_3_issues?: string[];          // ordered list of pain points
  top_3_goals_next_90_days?: string[];
  if_nothing_else_changes_but_X_this_was_worth_it?: string;

  // KPIs & Baselines
  primary_kpis?: string[];          // labels only (e.g., "Lead response time")
  kpi_baselines?: Record<string, string>; // KPI name -> current value ("Lead response time" -> "3 hours")

  // Guardrails
  non_goals?: string[];             // things we explicitly are NOT trying to do
  do_not_automate?: string[];       // areas/processes to keep human-only

  // Readiness & Capacity
  change_readiness?: ChangeReadiness;
  weekly_capacity_for_implementation_hours?: number;
  biggest_risk_if_we_push_too_fast?: string;

  // Display
  display_name?: string;            // "Roberta"
  preferred_reference?: string;     // "Roberta (Owner)" or "Ryan (Sales Lead)"
}

/**
 * Base intake answers type that extends EnrichedIntakeProfile
 * Use this as the base for all role-specific intake answer types
 */
export interface BaseIntakeAnswers extends EnrichedIntakeProfile {
  // Role-specific fields will be added by individual intake types
}
