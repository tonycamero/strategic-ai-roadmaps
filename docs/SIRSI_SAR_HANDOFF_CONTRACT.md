# SAR Handoff Contract Spec (v1.0)

This document defines the interface for handing off roadmap and intake data from **Strategic AI Roadmaps (SAR)** to **SirsiNexusApp**.

## 1. Primary Data Models (Sirsi Canonical)

Sirsi's input expectations are derived from the following internal definitions:

| Component | Sirsi File Reference | Key Data Structure |
| :--- | :--- | :--- |
| **Infra Engine** | [ai_infrastructure_service.rs](file:///sirsi_analysis/core-engine/src/services/ai_infrastructure_service.rs#L9-L14) | `InfrastructureRequest` |
| **Optimization** | [ai_optimization_service.rs](file:///sirsi_analysis/core-engine/src/services/ai_optimization_service.rs#L10-L17) | `OptimizationRequest` |
| **Compliance** | [soc2.rs](file:///sirsi_analysis/core-engine/src/compliance/soc2.rs#L32-L43) | `Soc2Control` |
| **gRPC Interface**| [sirsi_interface.proto](file:///sirsi_analysis/core-engine/proto/sirsi/agent/v1/sirsi_interface.proto#L45-L57) | `SirsiRequest` |

---

## 2. Input Points & Engines

Sirsi consumes handoff data at these identified points:

### A. Infrastructure Planning
*   **Target**: `AIInfrastructureService::generate_infrastructure`
*   **File**: [ai_infrastructure_service.rs:L119](file:///sirsi_analysis/core-engine/src/services/ai_infrastructure_service.rs#L119)
*   **Expectation**: A high-level description with strict performance and security tiers.

### B. Risk & Hardening
*   **Target**: `SirsiPersonaService::execute_supreme_decision`
*   **File**: [sirsi_persona.rs:L319](file:///sirsi_analysis/core-engine/src/services/sirsi_persona.rs#L319)
*   **Expectation**: Contextual data that can be processed by the `DecisionEngine` to produce a `RiskAssessment`.

### C. Compliance Validation
*   **Target**: `Soc2ComplianceManager::perform_control_assessment`
*   **File**: [soc2.rs:L216](file:///sirsi_analysis/core-engine/src/compliance/soc2.rs#L216)
*   **Expectation**: Control IDs and evidence data to run automated checks (e.g., `rbac_validation`, `encryption_compliance`).

---

## 3. Handoff Contract Schemas

### A. Minimal JSON Schema (v0)
*Purpose: Immediate stateless verification/risk scoring.*

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "SirsiHandoff_v0",
  "type": "object",
  "required": ["description", "cloud_provider", "security_level"],
  "properties": {
    "description": { "type": "string", "description": "Human-readable roadmap/intent" },
    "cloud_provider": { "enum": ["AWS", "Azure", "GCP", "Kubernetes"] },
    "security_level": { "enum": ["Basic", "Enhanced", "Maximum", "Compliant"] },
    "performance_tier": { "enum": ["Basic", "Standard", "Premium", "Enterprise"], "default": "Standard" },
    "budget_limit": { "type": "number", "minimum": 0 }
  }
}
```

### B. Full JSON Schema (v1)
*Purpose: Rich integration including telemetry patterns and compliance mapping.*

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "SirsiHandoff_v1",
  "type": "object",
  "required": ["project_id", "layers"],
  "properties": {
    "project_id": { "type": "string" },
    "infrastructure": {
      "type": "object",
      "properties": {
        "description": { "type": "string" },
        "compliance_requirements": { "type": "array", "items": { "type": "string" } },
        "scaling": {
          "type": "object",
          "properties": {
            "min_instances": { "type": "integer" },
            "max_instances": { "type": "integer" },
            "load_balancing": { "type": "boolean" }
          }
        }
      }
    },
    "telemetry_expectations": {
      "type": "object",
      "properties": {
        "avg_response_time_ms": { "type": "number" },
        "throughput_rps": { "type": "number" },
        "availability_target": { "type": "number", "maximum": 1 }
      }
    },
    "metadata": { "type": "object", "additionalProperties": { "type": "string" } }
  }
}
```

---

## 4. Ninkasi Sample Payload (v1)

Derived from a realistic SAR-to-Sirsi transition for a high-availability backend (Ninkasi implementation).

```json
{
  "project_id": "sar_ninkasi_99",
  "infrastructure": {
    "description": "High-availability financial ledger for Ninkasi brewery ecosystem.",
    "cloud_provider": "AWS",
    "security_level": "Maximum",
    "performance_tier": "Premium",
    "compliance_requirements": ["SOC2_CC6.1", "GDPR_ART32"], 
    "scaling": {
      "min_instances": 3,
      "max_instances": 12,
      "auto_scaling": true,
      "load_balancing": true
    }
  },
  "telemetry_expectations": {
    "avg_response_time_ms": 150.0,
    "throughput_rps": 500,
    "availability_target": 0.999
  },
  "metadata": {
    "sar_tenant": "Bright Focus Marketing",
    "risk_profile": "High_Integrity"
  }
}
```
*Assumptions: `SOC2_CC6.1` is mapped internally by Sirsi to Logical Access controls.*

---

## 5. SAR to Sirsi Mapping Table

| SAR Concept | Sirsi Concept | Implementation Mapping |
| :--- | :--- | :--- |
| Roadmap Step | `ActionStep` | [sirsi_persona.rs:L163](file:///sirsi_analysis/core-engine/src/services/sirsi_persona.rs#L163) |
| Tenant Profile | `ProjectSettings` | [schema.prisma:L37](file:///sirsi_analysis/packages/prisma/schema.prisma#L37) |
| Risk Assessment | `RiskAssessment` | [sirsi_persona.rs:L173](file:///sirsi_analysis/core-engine/src/services/sirsi_persona.rs#L173) |
| Goal | `OptimizationGoal`| [ai_optimization_service.rs:L77](file:///sirsi_analysis/core-engine/src/services/ai_optimization_service.rs#L77) |
| Performance target | `PerformanceMetrics`| [ai_optimization_service.rs:L55](file:///sirsi_analysis/core-engine/src/services/ai_optimization_service.rs#L55) |
