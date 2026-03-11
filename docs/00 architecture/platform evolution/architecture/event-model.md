# event-model.md

# Operational Event Model

This document defines the canonical operational event schema used by the StrategicAI platform.

Operational events represent signals of execution pressure within an organization.

---

## OperationalEvent

Represents a detected operational condition.

Fields:

id  
tenant_id  
source_system  
event_type  
severity  
payload  
detected_at  
status

---

### Field Descriptions

id  
Unique identifier.

tenant_id  
Organization generating the signal.

source_system  
Originating system (ERP, CRM, operator input).

event_type  
Type of operational signal.

severity  
Operational impact level.

payload  
Structured metadata associated with the event.

detected_at  
Timestamp when the event was detected.

status  

Possible values:

- open
- acknowledged
- resolved

---

## OperationalResolution

Represents an action taken to resolve an event.

Fields:

id  
event_id  
assigned_to  
action  
escalation_at
resolved_at  
notes

---

## Event Lifecycle

Signal detected  
↓  
OperationalEvent created  
↓  
Event displayed in Trust Console  
↓  
Operator response initiated  
↓  
OperationalResolution recorded  
↓  
Event marked resolved

---

## Event Sources

Operational events can originate from:

- ERP systems
- inventory systems
- production systems
- manual operator reports

The SAR Shield gateway standardizes these signals.