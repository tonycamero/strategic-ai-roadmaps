# META-TICKET — STAGE-5 ECONOMIC BASELINE INJECTION (V1.0)

Authority: Operator-Governed Baseline → Stage 5 Economic Modeling Activation  
Scope: Backend + Stage 5 Prompt Layer + ROI Review Cycles  
Priority: HIGH  
Dependency: firm_baseline_intake table operational + API routes active  

---

## OBJECTIVE

Inject TENANT_BASELINE_ECONOMICS into Assisted Synthesis (Stage 5) context immediately upon Operator lock.
Eliminate snapshot-derived inference.
Enable quantified directional modeling with governance constraints.
Preserve human authority over baseline truth.

---

## CANONICAL DATA CONTRACT

TENANT_BASELINE_ECONOMICS {
  weekly_revenue: number,
  peak_hour_revenue_pct: number,
  labor_pct: number,
  overtime_pct: number,
  gross_margin_pct: number,
  average_ticket: number,
  lead_volume?: number,
  close_rate?: number,
  economic_confidence_level: "LOW" | "MODERATE" | "HIGH",
  baseline_locked_at: timestamp,
  locked_by: operator_id
}

Persistence Requirements:
- Primary: firm_baseline_intake
- Mirror Snapshot: implementation_snapshots (label: baseline_v1_locked)

---

## STAGE 5 CONTEXT INJECTION

Modify:
- assistedSynthesisProposals.service.ts
- assistedSynthesisAgent.service.ts

Insert BEFORE system instructions:

<SAR_TENANT_BASELINE>
Weekly Revenue: ...
Peak Hour Revenue %: ...
Labor %: ...
Overtime %: ...
Gross Margin %: ...
Average Ticket: ...
Lead Volume: ...
Close Rate: ...
Confidence Level: ...
Baseline Locked: ...
</SAR_TENANT_BASELINE>

If baseline not present → inject:
<SAR_TENANT_BASELINE>
NO BASELINE LOCKED
</SAR_TENANT_BASELINE>

---

## ECONOMIC MODELING RULES

If baseline exists:
- All proposals must trace economic_vector against baseline metrics.
- Use arithmetic directional modeling where applicable.
- Show mechanism-based linkage (e.g., missed_peak_conversion_dropped_orders × peak_hour_revenue_pct × weekly_revenue).
- Label extrapolations explicitly:
  "EXTRAPOLATED — pending 30-day validation."

Confidence Handling:
- LOW → Directional modeling only.
- MODERATE → Directional + bounded assumptions.
- HIGH → Quantified modeling permitted.

Banned:
- "Potential impact"
- "May affect revenue"
- Generic economic phrasing without mechanism.

---

## REVIEW CYCLE FRAMEWORK (30/60/90)

Create table: baseline_review_cycles

Fields:
- cycle_number
- review_date
- updated_values (JSON)
- delta_from_v1 (JSON)
- validated_by (operator_id)
- confidence_level
- notes

Stage 5 must read:
- Latest locked baseline
- Latest review cycle
- Confidence level

---

## UI REQUIREMENTS (SuperAdmin)

Baseline Panel must display:
- V1 LOCKED badge
- Confidence badge
- Locked timestamp
- Locked by
- Last review date
- Next review due
- “Injected into Stage 5” status indicator

---

## GUARDRAILS

- No baseline → no quantified economic modeling.
- LOW confidence → mandatory directional labeling.
- No system-generated baseline inference.
- Operator remains sole economic authority.

---

## ACCEPTANCE CRITERIA

1. Stage 5 proposals reference baseline metrics when present.
2. Economic vectors trace to concrete baseline arithmetic.
3. No quantified output appears without locked baseline.
4. Review cycle updates propagate to Stage 5 context.
5. Governance rules enforced server-side.

Status: READY FOR IMPLEMENTATION
