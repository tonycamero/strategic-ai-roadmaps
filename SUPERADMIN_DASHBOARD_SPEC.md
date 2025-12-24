# Super Admin Dashboard Specification

## Overview

The Super Admin Dashboard provides high-level system visibility, tenant oversight, and lifecycle control across all firms participating in the Strategic AI Roadmap program. It enables administrators to manage cohorts, track progress, and ensure streamlined operations during Phase 1 (Intake Portal + Manual Roadmap Construction).

## Goals

* Provide global visibility across all firms using the platform
* Enable lifecycle management: intake → roadmap → pilot
* Support operational efficiency for the 20→10 Eugene funnel
* Maintain strict permissions with super-admin-only functions

## Core Features

### 1. Global Overview

* Total firms onboarded
* Intake completion rates
* Roadmap status counts
* Pilot status counts
* Cohort tagging summary

### 2. Firms Table

Columns:

* Firm/Owner Name
* Email
* Cohort
* Intake Status
* Roadmap Status
* Pilot Status
* Actions (Open Firm Detail)

### 3. Firm Detail Page

Sections:

* Header: firm info + lifecycle chips
* Leadership Intake Summary
* Intake Responses (view-only)
* Internal Notes
* Roadmap Artifacts (upload/link)
* Roadmap/Pilot status dropdowns

### 4. Intake Inspector

* Cross-firm intake viewer for pattern recognition
* Filters: role, cohort, completion status

### 5. System Panel

* Pending invites
* Invite resend/revoke
* Light error logs (email sends, intake failures)

## Permissions

* Super Admin: full system visibility, lifecycle editing
* Owner: restricted to their own firm only
* Staff: role-specific intake access

## Phase Boundary

This specification intentionally avoids Phase 2 features (e.g., AI teammate metrics, workflows, billing). It focuses solely on the administrative needs required to run the 20→10 funnel effectively.

---

## Technical Implementation Notes

### Database Schema Extensions

```sql
-- Add lifecycle tracking fields to users table
ALTER TABLE users ADD COLUMN cohort VARCHAR(50);
ALTER TABLE users ADD COLUMN roadmap_status VARCHAR(50) DEFAULT 'not_started';
ALTER TABLE users ADD COLUMN pilot_status VARCHAR(50) DEFAULT 'not_started';

-- Add internal notes table
CREATE TABLE admin_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add roadmap artifacts table
CREATE TABLE roadmap_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  artifact_type VARCHAR(50) NOT NULL, -- pdf, link, doc
  artifact_url TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### API Endpoints

**SuperAdmin Only:**

* `GET /api/superadmin/overview` - Global stats
* `GET /api/superadmin/firms` - All firms with lifecycle data
* `GET /api/superadmin/firms/:ownerId` - Firm detail
* `PATCH /api/superadmin/firms/:ownerId` - Update lifecycle status
* `POST /api/superadmin/notes` - Add internal note
* `POST /api/superadmin/artifacts` - Upload roadmap artifact
* `GET /api/superadmin/intakes` - Cross-firm intake inspector

### Frontend Routes

* `/superadmin/dashboard` - Global overview
* `/superadmin/firms` - Firms table
* `/superadmin/firms/:ownerId` - Firm detail page
* `/superadmin/intakes` - Intake inspector
* `/superadmin/system` - System panel

---

## MVP Feature Prioritization

### Must Have (Week 1-2)
- [x] SuperAdmin role added to schema
- [ ] Global overview dashboard
- [ ] Firms table with basic data
- [ ] Cross-tenant intake viewing (already implemented)

### Should Have (Week 3-4)
- [ ] Firm detail page
- [ ] Lifecycle status dropdowns
- [ ] Internal notes system
- [ ] Cohort tagging

### Nice to Have (Week 5+)
- [ ] Intake inspector with filters
- [ ] Roadmap artifact uploads
- [ ] System panel (pending invites, logs)
- [ ] CSV exports for reporting

---

## Success Metrics

* SuperAdmin can view all 20 Eugene firms in one table
* Lifecycle status (intake → roadmap → pilot) visible at a glance
* Internal notes allow team coordination on each firm
* Cross-firm intake patterns visible for roadmap construction
* Zero need to query database directly for operational visibility

---

**Status:** Specification complete, implementation pending  
**Next Step:** Create Warp tickets for MVP features
