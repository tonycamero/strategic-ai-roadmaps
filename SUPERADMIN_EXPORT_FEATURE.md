# SuperAdmin Intake Export Feature

## Overview
Added comprehensive export functionality to the SuperAdmin Dashboard, allowing admins to export intake data with detailed team member information in both CSV and JSON formats.

## Features

### 1. Export All Intakes
**Endpoint**: `GET /api/superadmin/export/intakes?format=csv|json&cohortLabel=<optional>`

**Location**: SuperAdmin Overview Page

**Capabilities**:
- Export all intakes across all tenants
- Optional filtering by cohort
- Includes complete team member data
- Available in CSV and JSON formats

**CSV Format Includes**:
- Intake ID
- Tenant details (Name, Cohort, Segment, Region, Status, Created Date)
- Team size
- Team member details (Name, Email, Role, Join Date)
- Intake details (Role, Status, Started, Completed)
- All intake answers as individual columns (dynamically generated)

**JSON Format Includes**:
Structured object with:
- `exportedAt`: Timestamp
- `totalIntakes`: Count
- `cohortFilter`: Applied filter (if any)
- `data`: Array of objects containing:
  - `intake`: Intake details and answers
  - `teamMember`: Complete team member info
  - `tenant`: Tenant details including team size

### 2. Export Single Firm Intakes
**Endpoint**: `GET /api/superadmin/export/firms/:tenantId/intakes?format=csv|json`

**Location**: SuperAdmin Firm Detail Page

**Capabilities**:
- Export intakes for a specific firm/tenant
- Includes all team members (not just those with intakes)
- Available in CSV and JSON formats
- Filename includes tenant name

**CSV Format Includes**:
- Intake ID
- Team member details (Name, Email, Role, Join Date)
- Intake details (Role, Status, Started, Completed)
- All intake answers as individual columns

**JSON Format Includes**:
Structured object with:
- `exportedAt`: Timestamp
- `tenant`: Full tenant details
- `teamMembers`: All team members with intake completion status
- `intakes`: Array of intakes with team member details
- `summary`: Statistics including:
  - Total team members
  - Total intakes
  - Completed intakes
  - Intakes by role breakdown

## Data Structure

### Team Member Information
Each export includes:
- ID
- Name
- Email
- Role (owner, sales, ops, delivery)
- Join date (when they were added to the system)

### Intake Information
- Intake ID
- Role (which intake form they filled out)
- Status (in_progress, completed)
- Started date
- Completed date (if completed)
- All answers to intake questions

### Tenant Information
- Tenant ID
- Tenant name
- Cohort label
- Segment
- Region
- Status (prospect, active, paused, churned)
- Created date
- Team size

## UI Components

### SuperAdmin Overview Page
- Two export buttons in the header
- "Export All CSV" and "Export All JSON"
- Buttons disabled when no intakes exist
- Shows "Exporting…" status

### SuperAdmin Firm Detail Page
- Two export buttons in the header
- "Export CSV" and "Export JSON"
- Buttons disabled when no intakes exist for that firm
- Shows "Exporting…" status
- Exported filename includes the firm name

## File Naming Convention

### All Intakes Export
- CSV: `intakes-export-YYYY-MM-DD.csv`
- JSON: `intakes-export-YYYY-MM-DD.json`

### Single Firm Export
- CSV: `{tenant_name}-intakes-YYYY-MM-DD.csv`
- JSON: `{tenant_name}-intakes-YYYY-MM-DD.json`

(Special characters in tenant names are replaced with underscores)

## CSV Features

### Dynamic Columns
The CSV export dynamically generates columns for all intake answers. This means:
- All unique question keys across all intakes become columns
- If an intake doesn't have an answer for a particular question, that cell is empty
- Complex answers (objects/arrays) are JSON-stringified in the cell

### Proper CSV Escaping
- Values containing commas, quotes, or newlines are properly quoted
- Internal quotes are escaped using double-quotes (`""`)
- UTF-8 encoding for international characters

## JSON Features

### Pretty Formatting
JSON exports are structured for easy programmatic access:
- Nested objects for logical grouping
- Consistent property naming
- ISO 8601 timestamps
- Summary statistics (for single firm exports)

## Security

### Authentication
- All export endpoints require SuperAdmin role
- JWT token authentication
- Audit logging for all export actions

### Audit Trail
Every export action is logged to `audit_events` table with:
- Actor user ID
- Actor role
- Event type (INTAKES_EXPORTED or FIRM_INTAKES_EXPORTED)
- Metadata (format, filter, count)
- Timestamp

## Usage Examples

### Export All Intakes as CSV
1. Navigate to SuperAdmin Overview
2. Click "Export All CSV"
3. File downloads automatically

### Export Roberta's Team Data
1. Navigate to SuperAdmin Firms
2. Click on Roberta Hayes' firm
3. Click "Export JSON" in the header
4. File downloads with all team member data and intake responses

### Analyze Intake Completion by Cohort
1. Can be done via API: `/api/superadmin/export/intakes?format=json&cohortLabel=Eugene`
2. Returns only intakes from Eugene cohort

## Technical Implementation

### Backend
- `backend/src/controllers/superadmin.controller.ts`
  - `exportIntakes()`: Global export
  - `exportFirmIntakes()`: Single firm export
- `backend/src/routes/superadmin.routes.ts`: Route definitions

### Frontend
- `frontend/src/superadmin/api.ts`: Export API functions
- `frontend/src/superadmin/pages/SuperAdminOverviewPage.tsx`: Global export UI
- `frontend/src/superadmin/pages/SuperAdminFirmDetailPage.tsx`: Firm export UI

## Future Enhancements

Potential additions:
- Excel (.xlsx) format support
- Scheduled exports
- Email delivery of exports
- Custom column selection for CSV
- Date range filtering
- Export templates
