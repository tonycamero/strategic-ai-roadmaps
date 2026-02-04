# META-TICKET: DISCOVERY-CALL-PACKET-008
## Discovery Call Packet: Generate Operator-Ready Call Doc from Existing Inputs

**STATUS: READY**
**TYPE: EXECUTION**
**PRIORITY: MEDIUM**
**SCOPE: IMPLEMENTATION-ONLY (DOCX/PDF PACKET GEN MINIMUM; USE EXISTING SOP-02)**

### OBJECTIVE
Produce a deterministic "Discovery Call Packet" artifact that SA can deliver after Diagnostic:

- Key hypotheses
- Questions to validate
- Red flags
- Agenda
- Expected outcomes

Uses SOP-02 as a structural contract.

### ABSOLUTE CONSTRAINTS
- No creative narrative tone. Operator utility only
- Deterministic ordering + stable sections
- Keep output format minimal (DOCX or PDF, one)

### SCOPE (IN)

**A) Define types + section caps**
- Create canonical contract for Discovery Call Packet

**B) Implement synthesis and validation**
- Deterministic synthesis pipeline
- Contract validation with fail-closed semantics

**C) Add generate + download endpoint**
- SuperAdmin endpoints with requestId support

**D) Add minimal SA UI button**
- Simple trigger in SA firm detail

### DELIVERABLES
- ⏳ Ticket persisted to docs/meta-tickets/
- ⏳ Discovery Call Packet types defined
- ⏳ Synthesis service implemented
- ⏳ Validation module created
- ⏳ Generate + download endpoints
- ⏳ SA UI button added
- ⏳ Deterministic output verified

### DEFINITION OF DONE
- Packet is generated from real tenant data
- Stable between runs
- Download works reliably with requestId surfaced
- Ticket persisted verbatim

### AUTHORITY
Derives from: EXEC-BRIEF-VALIDATION-KIT-003, DIAGNOSTIC-FOUNDATION-007
