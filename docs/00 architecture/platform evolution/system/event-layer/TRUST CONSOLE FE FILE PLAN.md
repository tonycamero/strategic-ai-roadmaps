TRUST CONSOLE FE FILE PLAN
Root: frontend/src/

frontend/
└── src/
    ├── app/
    │   ├── App.tsx
    │   ├── main.tsx
    │   ├── router.tsx
    │   └── providers.tsx
    │
    ├── api/
    │   ├── client.ts
    │   ├── events.ts
    │   ├── signals.ts
    │   ├── entities.ts
    │   ├── metrics.ts
    │   └── compliance.ts
    │
    ├── types/
    │   ├── Event.ts
    │   ├── Signal.ts
    │   ├── Entity.ts
    │   ├── Metric.ts
    │   ├── Alert.ts
    │   ├── Compliance.ts
    │   └── Api.ts
    │
    ├── store/
    │   ├── appStore.ts
    │   ├── signalsStore.ts
    │   ├── entitiesStore.ts
    │   ├── metricsStore.ts
    │   └── filtersStore.ts
    │
    ├── hooks/
    │   ├── useSignals.ts
    │   ├── useEntities.ts
    │   ├── useMetrics.ts
    │   ├── useEventStream.ts
    │   └── useCompliance.ts
    │
    ├── utils/
    │   ├── formatDate.ts
    │   ├── formatSeverity.ts
    │   ├── mapSignalColor.ts
    │   ├── groupEvents.ts
    │   └── constants.ts
    │
    ├── layout/
    │   ├── Shell.tsx
    │   ├── Sidebar.tsx
    │   ├── Topbar.tsx
    │   ├── PageHeader.tsx
    │   └── ContentGrid.tsx
    │
    ├── components/
    │   ├── common/
    │   │   ├── Badge.tsx
    │   │   ├── EmptyState.tsx
    │   │   ├── LoadingState.tsx
    │   │   ├── ErrorState.tsx
    │   │   ├── SearchInput.tsx
    │   │   └── FilterBar.tsx
    │   │
    │   ├── signals/
    │   │   ├── SignalCard.tsx
    │   │   ├── SignalFeed.tsx
    │   │   ├── SignalDetailDrawer.tsx
    │   │   ├── SeverityPill.tsx
    │   │   └── AlertBanner.tsx
    │   │
    │   ├── entities/
    │   │   ├── EntityCard.tsx
    │   │   ├── EntityList.tsx
    │   │   ├── EntityHeader.tsx
    │   │   ├── EntityTimeline.tsx
    │   │   └── EntityRelations.tsx
    │   │
    │   ├── events/
    │   │   ├── EventRow.tsx
    │   │   ├── EventTable.tsx
    │   │   ├── EventTimeline.tsx
    │   │   └── EventTypeBadge.tsx
    │   │
    │   ├── metrics/
    │   │   ├── MetricCard.tsx
    │   │   ├── MetricsGrid.tsx
    │   │   ├── MetricTrendChart.tsx
    │   │   └── KPIBar.tsx
    │   │
    │   └── compliance/
    │       ├── ComplianceSignalCard.tsx
    │       ├── ComplianceFeed.tsx
    │       ├── ChainOfCustodyPanel.tsx
    │       └── AuditTrailTable.tsx
    │
    ├── pages/
    │   ├── DashboardPage.tsx
    │   ├── SignalsPage.tsx
    │   ├── EntitiesPage.tsx
    │   ├── EntityDetailPage.tsx
    │   ├── EventsPage.tsx
    │   ├── MetricsPage.tsx
    │   ├── CompliancePage.tsx
    │   └── SettingsPage.tsx
    │
    ├── views/
    │   ├── dashboard/
    │   │   ├── DashboardHero.tsx
    │   │   ├── DashboardSignalsPanel.tsx
    │   │   ├── DashboardMetricsPanel.tsx
    │   │   └── DashboardEntityPanel.tsx
    │   │
    │   ├── signals/
    │   │   ├── SignalsView.tsx
    │   │   ├── ActiveSignalsPanel.tsx
    │   │   └── EscalationsPanel.tsx
    │   │
    │   ├── entities/
    │   │   ├── EntitiesView.tsx
    │   │   ├── EntityDetailView.tsx
    │   │   └── EntityActivityView.tsx
    │   │
    │   ├── events/
    │   │   ├── EventStreamView.tsx
    │   │   └── EventInspectorView.tsx
    │   │
    │   ├── metrics/
    │   │   ├── MetricsView.tsx
    │   │   └── OperationalHealthView.tsx
    │   │
    │   └── compliance/
    │       ├── ComplianceView.tsx
    │       ├── BreweryComplianceView.tsx
    │       └── CannabisComplianceView.tsx
    │
    └── styles/
        ├── globals.css
        └── tokens.css

BUILD SEQUENCE
1. app/App.tsx
2. app/main.tsx
3. app/router.tsx
4. api/client.ts
5. types/Event.ts
6. types/Signal.ts
7. types/Entity.ts
8. types/Metric.ts
9. layout/Shell.tsx
10. layout/Sidebar.tsx
11. layout/Topbar.tsx
12. pages/DashboardPage.tsx
13. components/signals/SignalCard.tsx
14. components/signals/SignalFeed.tsx
15. components/entities/EntityCard.tsx
16. components/events/EventTable.tsx
17. components/metrics/MetricCard.tsx
18. views/dashboard/DashboardHero.tsx
19. views/dashboard/DashboardSignalsPanel.tsx
20. views/dashboard/DashboardMetricsPanel.tsx
21. views/dashboard/DashboardEntityPanel.tsx
22. api/signals.ts
23. api/entities.ts
24. api/events.ts
25. api/metrics.ts
26. store/signalsStore.ts
27. store/entitiesStore.ts
28. store/metricsStore.ts
29. pages/SignalsPage.tsx
30. pages/EntitiesPage.tsx
31. pages/EntityDetailPage.tsx
32. pages/EventsPage.tsx
33. pages/MetricsPage.tsx
34. pages/CompliancePage.tsx
35. components/compliance/ComplianceFeed.tsx
36. api/compliance.ts
37. hooks/useSignals.ts
38. hooks/useEntities.ts
39. hooks/useMetrics.ts
40. hooks/useCompliance.ts

MINIMUM V1 TO SHIP FAST
app/App.tsx
app/main.tsx
app/router.tsx
api/client.ts
api/signals.ts
api/entities.ts
api/events.ts
api/metrics.ts
types/Event.ts
types/Signal.ts
types/Entity.ts
types/Metric.ts
layout/Shell.tsx
layout/Sidebar.tsx
layout/Topbar.tsx
components/signals/SignalCard.tsx
components/signals/SignalFeed.tsx
components/entities/EntityCard.tsx
components/events/EventTable.tsx
components/metrics/MetricCard.tsx
pages/DashboardPage.tsx
pages/SignalsPage.tsx
pages/EntitiesPage.tsx
pages/EntityDetailPage.tsx
pages/EventsPage.tsx
pages/MetricsPage.tsx
views/dashboard/DashboardSignalsPanel.tsx
views/dashboard/DashboardMetricsPanel.tsx
views/dashboard/DashboardEntityPanel.tsx
styles/globals.css

PAGE INTENT
DashboardPage.tsx
- unified mission control
- active signals
- top metrics
- key entities needing attention

SignalsPage.tsx
- filter by severity, vertical, signal_type
- acknowledge / inspect workflow

EntitiesPage.tsx
- searchable registry of tanks, batches, harvest lots, dispensaries, etc.

EntityDetailPage.tsx
- one entity
- event timeline
- active signals
- metrics
- compliance trace

EventsPage.tsx
- raw canonical event stream
- validation and debugging surface

MetricsPage.tsx
- operational health and trend charts

CompliancePage.tsx
- chain-of-custody
- regulatory signals
- audit view

API CONTRACTS TO ASSUME
GET /api/signals
GET /api/signals/:id
GET /api/entities
GET /api/entities/:id
GET /api/entities/:id/events
GET /api/entities/:id/signals
GET /api/events
GET /api/metrics
GET /api/compliance/signals

TYPE SHAPES TO LOCK
Event
- event_id
- event_type
- entity_type
- entity_id
- actor
- location
- payload
- metadata
- timestamp
- ingestion_timestamp

Signal
- signal_id
- signal_type
- severity
- description
- source_event
- created_at

Entity
- entity_id
- tenant_id
- vertical
- entity_type
- name
- description
- external_system
- external_id
- metadata
- created_at

Metric
- metric_id
- tenant_id
- vertical
- metric_name
- metric_value
- entity_type
- entity_id
- recorded_at

UI RULES
- FE must stay vertical-agnostic
- never bind UI directly to brewery_ops or cannabis_ops tables
- FE reads only through events, signals, entities, metrics, compliance endpoints
- trust console is the universal instrument panel
- entity detail is the deepest and most important view
- compliance gets its own page but uses the same core components

SHIP POSTURE
V1 = dashboard + signals + entities + events + metrics
V1.1 = compliance page
V1.2 = acknowledgements, escalations, drilldown drawers