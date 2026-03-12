# Stage-7 Graph Compiler

The Stage-7 Graph Compiler transforms SOP tickets into an executable roadmap graph.

This compiler organizes operational tasks into dependency-aware execution phases.

The output graph determines execution order and parallelization opportunities.

---

# Inputs

Stage-7 consumes:

sop_tickets

These tickets represent the compiled execution steps produced by Stage-6.

inventory_registry

Contains capability dependency metadata.

Dependencies define which tickets must precede others.

---

# Output

The compiler produces an ExecutionGraph.

ExecutionGraph contains:

nodes
edges
phases

nodes represent SOP tickets.

edges represent capability dependencies.

phases group tasks that may run in parallel.

---

# Node Model

Each ticket becomes a node in the graph.

RoadmapNode

ticketId
ticketKey
capabilityId
namespace
complexityTier

Nodes represent individual execution steps.

---

# Dependency Edges

Edges represent dependency relationships.

Dependencies must come from the inventory registry.

They must never be inferred.

DependencyEdge

fromTicketId
toTicketId
dependencyType

These edges enforce execution ordering.

---

# Graph Construction

The compiler performs the following steps.

1 Load SOP Tickets

Load all tickets associated with a selectionEnvelopeId.

2 Resolve Dependencies

Look up capability dependency metadata in the inventory registry.

Create dependency edges between tickets.

3 Build Graph

Construct a directed acyclic graph.

Each node represents a ticket.

Edges represent dependencies.

4 Topological Sort

Sort the graph to determine execution order.

5 Phase Assignment

Group nodes with no mutual dependencies into execution phases.

Phase 1 tasks may execute in parallel.

Later phases wait for earlier phases to complete.

---

# Phase Example

Given dependencies:

A → B → D
C → D

The resulting phases are:

Phase 1
A
C

Phase 2
B

Phase 3
D

---

# Determinism Rules

Stage-7 must follow strict rules.

Dependencies must come from the inventory registry.

No LLM inference is allowed.

Graph construction must be reproducible.

Recompiling the same envelope must produce the same graph.

---

# Result

Stage-7 converts operational tasks into an execution roadmap.

sop_tickets
    ↓
Stage-7 Graph Compiler
    ↓
ExecutionGraph