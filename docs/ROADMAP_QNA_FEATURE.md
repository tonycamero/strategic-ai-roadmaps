# Roadmap Q&A Feature

## Overview
The Roadmap Q&A feature provides personalized, context-aware answers about strategic AI roadmaps using enriched intake profiles, approved tickets, and capacity constraints.

## Architecture

### Backend Components

#### 1. Context Builder (`roadmapQnAContext.service.ts`)
- **Function**: `buildRoadmapQnAContext(tenantId: string)`
- Fetches tenant, roadmap, sections, and **approved tickets only** (`approved = true`)
- Computes ticket rollup with ROI calculations
- Builds sprint summaries (30/60/90-day groupings)
- Identifies top 5 high-impact tickets by impact score
- Retrieves owner profile from enriched intake data

#### 2. OpenAI Agent Service (`roadmapQnAAgent.service.ts`)
- Uses GPT-4o-mini with temperature 0.2
- Receives full enriched context including:
  - Tenant info
  - Roadmap overview
  - Approved tickets with ROI
  - Sprint breakdowns
  - Owner profile (issues, goals, KPIs, capacity)
- Enforces STRICT ANTI-INVENTION RULES to prevent hallucinations

#### 3. API Endpoint (`roadmapQnA.controller.ts`)
- **Route**: POST `/api/roadmap/qna`
- **Authentication**: Required via middleware
- **Request Body**: 
  ```json
  {
    "question": "string",
    "sectionKey": "string (optional)"
  }
  ```
- **Response**:
  ```json
  {
    "answer": "string"
  }
  ```

### Frontend Components

#### 1. React Hook (`useRoadmapQnA.ts`)
- React Query mutation hook
- Accepts question and optional sectionKey
- Returns loading state, data, and error handling

#### 2. UI Panel Component (`RoadmapQnAPanel.tsx`)
- Textarea for question input (3 rows)
- Submit button with loading state
- Answer display with proper styling
- Error state handling
- Dark theme for modal embedding

#### 3. Integration (`RoadmapViewer.tsx`)
- Two-mode chat panel:
  - **Roadmap Mode**: Full Q&A with enriched context
  - **Section Mode**: Existing section-specific assistant
- Floating modal at bottom-right
- Toggle buttons in sidebar

## Enriched Profile Fields

Owner profiles include:
- `role_label`, `department_key`, `display_name`
- `top_3_issues[]` - Primary pain points
- `top_3_goals_next_90_days[]` - Short-term objectives
- `if_nothing_else_changes_but_X_this_was_worth_it` - The "One Thing"
- `primary_kpis[]` - Key performance indicators
- `kpi_baselines{}` - Current KPI values
- `change_readiness` - Low/Medium/High
- `weekly_capacity_for_implementation_hours` - Available hours
- `biggest_risk_if_we_push_too_fast` - Risk assessment

## Demo Data

### Hayes Real Estate
- **Owner**: Marcus Hayes, Managing Broker
- **Capacity**: 8 hours/week
- **Readiness**: High
- **Tickets**: 15 approved, $16,875 investment, 548% ROI

### BrightFocus Marketing  
- **Owner**: Sarah Chen, Founder & Creative Director
- **Capacity**: 5 hours/week
- **Readiness**: Medium
- **Tickets**: 11 approved, $12,250 investment, 714% ROI

## Usage

1. User completes Owner Intake with Section E enrichment fields
2. Roadmap is generated with approved tickets
3. User opens RoadmapViewer and clicks "Ask About Roadmap"
4. User types question (e.g., "What can I accomplish in 30 days with 8 hours/week?")
5. Agent responds with capacity-aware, KPI-grounded answer based on approved tickets only

## Testing

To test with demo tenants:
```bash
# Enrich demo intakes
npm run enrich-demo

# Start backend
npm run dev

# Start frontend
cd ../frontend && pnpm dev

# Login as Hayes or BrightFocus user
# Navigate to Roadmap Viewer
# Click "Ask About Roadmap"
```

## Future Enhancements

- [ ] Multi-role profiles (delivery, sales, ops teams)
- [ ] Section-specific Q&A filtering
- [ ] Conversation history persistence
- [ ] Export Q&A transcripts
- [ ] Suggested questions based on context
