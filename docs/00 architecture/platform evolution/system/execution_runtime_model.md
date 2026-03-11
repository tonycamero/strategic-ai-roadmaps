# Execution Runtime Model

The execution runtime layer tracks the live state of roadmap execution.

This layer converts the roadmap graph into a persistent execution system.

The runtime state is stored in:

roadmap_execution_nodes

---

# Purpose

StrategicAI roadmaps define what should be executed.

The runtime model tracks what is actually happening.

This separation allows the roadmap to remain deterministic while execution progresses.

---

# Core Table

roadmap_execution_nodes

Each record represents a runtime execution node derived from a roadmap graph node.

Each node corresponds to a compiled SOP ticket.

---

# Runtime Fields

Each node records:

tenantId
selectionEnvelopeId
sopTicketId
ticketKey

phaseIndex
executionOrder

status

namespace
capabilityId
complexityTier

scheduledStartAt
scheduledEndAt

startedAt
completedAt

createdAt
updatedAt

---

# Execution Lifecycle

Each node progresses through a lifecycle.

pending

The node exists but cannot execute yet.

ready

All dependencies are satisfied.

in_progress

Execution has started.

blocked

Execution cannot proceed due to dependency failure.

completed

Execution finished successfully.

failed

Execution ended with an error.

---

# Phase Execution

Nodes are organized by phaseIndex.

Nodes within the same phase may execute in parallel.

Example:

Phase 1

A
C

Phase 2

B

Phase 3

D

Execution engines may run all nodes within a phase concurrently.

---

# Relationship to Other Tables

roadmap_execution_nodes links to:

sop_tickets

Defines the operational task.

selection_envelopes

Defines the strategic plan.

tenants

Defines the organizational scope.

---

# Runtime Responsibilities

The runtime layer tracks execution state only.

It does not define strategy.

Strategy comes from the Selection Envelope.

Execution tasks come from SOP tickets.

The runtime layer tracks progress and operational outcomes.

---

# Example Execution Flow

Selection Envelope created.

Stage-6 compiler generates SOP tickets.

Stage-7 compiler generates roadmap graph.

Graph nodes are persisted to roadmap_execution_nodes.

Operators or automation execute nodes.

Execution status updates over time.

The Trust Console visualizes execution progress.

---

# Result

The execution runtime layer turns the roadmap into a live operational system.

selection_envelope
    ↓
Stage-6 compiler
    ↓
sop_tickets
    ↓
Stage-7 graph compiler
    ↓
roadmap_execution_nodes
    ↓
execution tracking