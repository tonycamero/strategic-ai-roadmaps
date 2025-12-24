# Document Upload System - Quick Guide

## Overview
Complete document management system for tenant-specific files (SOP outputs, roadmaps, reports).

## What's Implemented

### Backend ✅
- **Database**: `tenant_documents` table with full metadata
- **File Storage**: Local uploads directory (`backend/uploads/`)
- **API Endpoints**:
  - `POST /api/superadmin/firms/:tenantId/documents/upload` - SuperAdmin uploads for any tenant
  - `GET /api/superadmin/firms/:tenantId/documents` - List tenant documents
  - `GET /api/documents` - Owner lists their documents  
  - `GET /api/documents/:id/download` - Download document
  - `DELETE /api/documents/:id` - Delete document

### Frontend ✅
- **SuperAdmin**: Document upload modal component (`DocumentUploadModal.tsx`)
- **Ready to integrate**: Add to firm detail page

## Quick Upload (SuperAdmin)

### Option 1: Via SuperAdmin Dashboard UI (Recommended)
1. Start backend: `cd backend && pnpm dev`
2. Start frontend: `cd frontend && pnpm dev` 
3. Login as superadmin (`tony@scend.cash`)
4. Navigate to SuperAdmin → Firms → Hayes Real Estate
5. Click "Upload Document" button
6. Fill form and upload your SOP-01 outputs

### Option 2: Via cURL (For Bulk Upload)
```bash
# Get your auth token first
TOKEN="your-jwt-token-here"
TENANT_ID="hayes-tenant-id"

curl -X POST "http://localhost:3001/api/superadmin/firms/$TENANT_ID/documents/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/SOP-01 Output 1.pdf" \
  -F "category=sop_output" \
  -F "title=Strategic Business Overview" \
  -F "description=Comprehensive analysis of Hayes Real Estate operations" \
  -F "sopNumber=SOP-01" \
  -F "outputNumber=Output-1" \
  -F "isPublic=true"
```

## For Hayes Real Estate SOP-01

Upload these 4 documents:

1. **Output-1**: Strategic Business Overview
2. **Output-2**: Workflow & Process Analysis  
3. **Output-3**: AI Automation Opportunities
4. **Output-4**: Discovery Call Preparation Guide

All should be:
- Category: `sop_output`
- SOP Number: `SOP-01`
- Public: `true` (visible to all team members)

## File Storage

Files are stored at:
- **Production**: `backend/uploads/`
- **Filename format**: `{timestamp}-{random}.{ext}`
- **Database**: Stores metadata + file path reference

## Owner Dashboard Access

Once uploaded, documents will appear in:
- Owner dashboard documents section (needs frontend implementation)
- Downloadable by owner and team (if isPublic=true)

## Security

- ✅ Tenant isolation - documents scoped to owner_id
- ✅ SuperAdmin can upload to any tenant
- ✅ Owners can only see their own tenant's documents
- ✅ File size limit: 50MB
- ✅ Audit logging for all uploads

## Next Steps

To make documents visible on owner dashboard:
1. Add documents API call to owner dashboard
2. Display documents list with download links
3. Group by category (SOP outputs, roadmaps, etc.)

## Database Schema

```sql
tenant_documents:
  - id (uuid)
  - tenant_id (→ tenants)
  - owner_id (→ users)
  - filename (storage filename)
  - original_filename (user's filename)
  - file_path (relative path)
  - file_size (bytes)
  - mime_type
  - category (sop_output|roadmap|report|other)
  - title
  - description
  - sop_number (e.g., SOP-01)
  - output_number (e.g., Output-1)
  - uploaded_by (→ users, who uploaded)
  - is_public (boolean)
  - created_at, updated_at
```

## Example: Upload All 4 Hayes SOP Outputs

Place your 4 PDF files in a folder, then use SuperAdmin UI or this script:

```bash
#!/bin/bash
TOKEN="get-from-login"
TENANT_ID="get-from-superadmin-firms-page"
DOCS_DIR="/path/to/your/hayes-sop-outputs"

declare -A docs
docs["1"]="SOP-01 Output 1 - Strategic Overview.pdf"
docs["2"]="SOP-01 Output 2 - Workflow Analysis.pdf"
docs["3"]="SOP-01 Output 3 - AI Opportunity Map.pdf"
docs["4"]="SOP-01 Output 4 - Discovery Call Prep.pdf"

for num in 1 2 3 4; do
  curl -X POST "http://localhost:3001/api/superadmin/firms/$TENANT_ID/documents/upload" \
    -H "Authorization: Bearer $TOKEN" \
    -F "file=@$DOCS_DIR/${docs[$num]}" \
    -F "category=sop_output" \
    -F "title=${docs[$num]%.pdf}" \
    -F "sopNumber=SOP-01" \
    -F "outputNumber=Output-$num" \
    -F "isPublic=true"
done
```
