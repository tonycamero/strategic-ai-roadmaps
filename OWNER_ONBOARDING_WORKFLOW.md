# Owner Onboarding Workflow Guide
**Strategic AI Roadmaps - Business Type Profiles Edition**

## Overview

This document explains the complete onboarding journey for a new business owner signing up for Strategic AI Roadmaps, with special emphasis on the **Business Type Selection** feature that enables Chamber of Commerce support.

**Status:** ✅ Fully implemented and wired into signup flow as of latest update.

---

## 🚀 Complete Onboarding Flow

### Step 1: Sign Up / Login
**Route:** `/signup` or `/login`

**What Happens:**
1. Owner creates an account with email, password, and basic info
2. Upon successful signup, a tenant record is created in the database
3. The tenant is automatically assigned `businessType: 'default'` initially
4. Owner is automatically logged in and redirected to onboarding

**User Experience:**
- Standard signup form
- No business type selection yet (comes next)
- Creates owner user account + tenant entity

---

### Step 2: ⭐ **Organization Type Selection** (NEW)
**Route:** `/organization-type`

**When:** First step in onboarding, immediately after signup

**What Happens:**
This is where the owner chooses their organization type:

**Screen Content:**
```
┌─────────────────────────────────────────────────┐
│  What type of organization are you?             │
│  We'll tune your intakes and metrics to match   │
│  your world.                                     │
│                                                  │
│  ┌──────────────────┐  ┌─────────────────────┐ │
│  │ Professional     │  │ Chamber of Commerce │ │
│  │ Services Firm    │  │ / Business Assoc    │ │
│  │                  │  │                     │ │
│  │ CPAs, agencies,  │  │ Regional chambers,  │ │
│  │ insurance, real  │  │ business alliances, │ │
│  │ estate, etc.     │  │ associations        │ │
│  └──────────────────┘  └─────────────────────┘ │
│                                                  │
│                              [Continue] ───────► │
└─────────────────────────────────────────────────┘
```

**What Owner Sees:**
- Two large cards to choose from:
  1. **Professional Services Firm** (default)
     - For CPAs, agencies, insurance, real estate, consultants
  2. **Chamber of Commerce / Business Association**
     - For regional chambers, business alliances, industry associations

**User Actions:**
1. Click one of the two cards (selection is highlighted)
2. Click "Continue" button
3. Selection is saved to database via `PATCH /api/tenants/business-type`

**Technical Details:**
- Component: `OrganizationTypeStep`
- API Call: `PATCH /api/tenants/business-type` with `{ businessType: 'chamber' }` or `{ businessType: 'default' }`
- Database: Updates `tenants.business_type` column
- Onboarding: Marks `ORGANIZATION_TYPE` step as completed
- Next: Redirects to `/business-profile`

**Why This Matters:**
This single choice transforms the entire platform experience:
- Changes all role labels throughout the app
- Adjusts intake question framing
- Customizes KPI recommendations
- Displays edition badge

---

### Step 3: Business Profile
**Route:** `/business-profile`

**What Happens:**
Owner fills out basic business information:
- Company name
- Team size (headcount)
- Monthly lead/member volume
- Firm size tier (micro/small/mid/large)
- Industry segment (optional)
- Region (optional)

**User Experience:**
- Standard form, same for both business types
- Data used for ROI calculations and roadmap customization
- Saves to tenant record

---

### Step 4: Owner Intake
**Route:** `/intake/owner`

**What Happens:**
Owner completes strategic assessment form

**🎯 Business Type Impact:**
The **heading and intro text change** based on earlier selection:

**For Professional Services (default):**
```
Owner / Leadership Assessment
This intake covers your goals, constraints, and 
priorities as the owner.
```

**For Chamber of Commerce:**
```
CEO / Executive Leadership Assessment
This intake covers your 12-month goals, constraints, 
and priorities as CEO.
```

**Questions:** Same strategic questions about priorities, bottlenecks, growth barriers
- 12 questions across 4 sections
- ~15 minutes to complete

---

### Step 5: Invite Team
**Route:** `/invite-team`

**What Happens:**
Owner invites their leadership team to complete role-specific intakes

**🎯 Business Type Impact:**
The **role names shown** change based on business type:

**For Professional Services (default):**
- Sales Lead
- Operations Lead
- Delivery / Fulfillment Lead

**For Chamber of Commerce:**
- Membership Development Lead
- Operations / Admin Lead
- Programs & Events Lead

**User Actions:**
1. Enter email addresses for each role
2. Send invitations
3. Wait for team to complete their intakes

---

### Step 6: Team Intakes (Completed by Team)
**Routes:** `/intake/sales`, `/intake/ops`, `/intake/delivery`

**What Happens:**
Each team member receives email invitation and completes their intake

**🎯 Business Type Impact:**

#### Sales/Membership Intake

**For Professional Services:**
```
┌────────────────────────────────────┐
│ Sales Intake                       │
│                                    │
│ This intake covers how you         │
│ attract, qualify, and close        │
│ new business.                      │
└────────────────────────────────────┘
```

**For Chamber of Commerce:**
```
┌────────────────────────────────────┐
│ Membership Development Intake      │
│                                    │
│ This intake covers how you         │
│ attract, onboard, and renew        │
│ members.                           │
└────────────────────────────────────┘
```

#### Operations Intake

**For Professional Services:**
```
┌────────────────────────────────────┐
│ Operations Intake                  │
│                                    │
│ This intake covers your internal   │
│ processes, tools, and data quality.│
└────────────────────────────────────┘
```

**For Chamber of Commerce:**
```
┌────────────────────────────────────┐
│ Operations / Admin Intake          │
│                                    │
│ This intake covers your back-office│
│ processes, systems, and member data│
└────────────────────────────────────┘
```

#### Delivery/Programs Intake

**For Professional Services:**
```
┌────────────────────────────────────┐
│ Delivery / Fulfillment Intake      │
│                                    │
│ This intake covers how you deliver │
│ your product or service to clients.│
└────────────────────────────────────┘
```

**For Chamber of Commerce:**
```
┌────────────────────────────────────┐
│ Programs & Events Intake           │
│                                    │
│ This intake covers your events,    │
│ programs, committees, and          │
│ engagement.                        │
└────────────────────────────────────┘
```

---

### Step 7: Dashboard (Ongoing)
**Route:** `/dashboard`

**What Happens:**
Owner monitors progress and accesses roadmap features

**🎯 Business Type Impact:**

**For Chamber of Commerce ONLY:**
A special edition badge appears at the top of the dashboard:

```
┌─────────────────────────────────────────────────┐
│  [Header with company name]                     │
├─────────────────────────────────────────────────┤
│  🏆 Chamber Edition  │ Customized for           │
│                      │ membership organizations │
└─────────────────────────────────────────────────┘
```

The badge:
- Blue-themed design
- Visible on every dashboard page
- Indicates specialized edition
- No badge appears for Professional Services (default)

---

## 📊 Visual Journey Map

```
NEW OWNER SIGNUP
       ↓
┌──────────────────┐
│   1. Sign Up     │ ← Create account
└──────────────────┘
       ↓
┌──────────────────┐
│ 2. Organization  │ ← ⭐ CHOOSE BUSINESS TYPE
│    Type Select   │   • Professional Services
└──────────────────┘   • Chamber of Commerce
       ↓
┌──────────────────┐
│ 3. Business      │ ← Basic company info
│    Profile       │
└──────────────────┘
       ↓
┌──────────────────┐
│ 4. Owner Intake  │ ← Strategic assessment
└──────────────────┘   (labels adapt here)
       ↓
┌──────────────────┐
│ 5. Invite Team   │ ← Send invitations
└──────────────────┘   (role names adapt here)
       ↓
┌──────────────────┐
│ 6. Team Intakes  │ ← Team completes forms
└──────────────────┘   (all labels adapt here)
       ↓
┌──────────────────┐
│ 7. Dashboard     │ ← Monitor progress
└──────────────────┘   (badge shows for Chamber)
```

---

## 🎨 Business Type Comparison Table

| Aspect | Professional Services | Chamber of Commerce |
|--------|----------------------|---------------------|
| **Sales/Growth Role** | Sales | Membership Development |
| **Operations Role** | Operations | Operations / Admin |
| **Delivery Role** | Delivery / Fulfillment | Programs & Events |
| **Owner Role** | Owner / Leadership | CEO / Executive Leadership |
| **Sales Intro** | "...attract, qualify, and close new business" | "...attract, onboard, and renew members" |
| **Ops Intro** | "...internal processes, tools, and data quality" | "...back-office processes, systems, and member data" |
| **Delivery Intro** | "...deliver your product or service to clients" | "...events, programs, committees, and engagement" |
| **Owner Intro** | "...goals, constraints, and priorities as the owner" | "...12-month goals, constraints, and priorities as CEO" |
| **Dashboard Badge** | None | "🏆 Chamber Edition" |
| **Sample KPIs** | Lead conversion rates, Revenue per FTE | Member renewal rates, Event attendance, Sponsor revenue |

---

## 🔄 Can Organization Type Be Changed?

**Yes!** The owner can change their organization type at any time:

1. Navigate to `/organization-type`
2. Select a different business type
3. Click "Continue"
4. All labels and text update immediately throughout the app

**What Gets Updated:**
- All intake page headers and intros
- All role labels in team invitation flow
- Dashboard badge (appears/disappears)
- KPI recommendations (future feature)

**What Stays The Same:**
- Previously completed intake answers
- Team member assignments
- Roadmap data
- All core functionality

---

## 💡 Key Design Decisions

### Why This Approach?

1. **Early Selection:** Organization type is chosen FIRST in onboarding (before any content) so all subsequent screens are already customized

2. **Non-Intrusive:** For professional services firms (default), the experience is identical to before - no extra steps or complexity

3. **Clear Value:** Chamber users immediately see the benefit - every screen speaks their language

4. **Reversible:** Not locked in - can change anytime without data loss

5. **Scalable:** Easy to add new business types (dental, legal, nonprofits) in the future

### What This Does NOT Change

✅ **No changes to:**
- Roadmap generation logic
- AI agent behavior
- SOP workflows
- Ticket system
- Core platform features

🎯 **Only changes:**
- UI labels and copy
- Role terminology
- KPI suggestions (future)
- Visual indicators (badge)

---

## 🧪 Testing the Flow

### As a New Chamber Owner:

1. **Sign up** at `/signup`
2. **Immediately see** Organization Type selection
3. **Choose** "Chamber of Commerce / Business Association"
4. **Continue** to Business Profile
5. **Notice** intake says "CEO / Executive Leadership Assessment"
6. **Invite team** with roles: "Membership Development", "Operations / Admin", "Programs & Events"
7. **Check dashboard** - see "Chamber Edition" badge

### As a New Professional Services Owner:

1. **Sign up** at `/signup`
2. **Immediately see** Organization Type selection
3. **Choose** "Professional Services Firm" (or just continue with default)
4. **Continue** to Business Profile
5. **Notice** intake says "Owner / Leadership Assessment"
6. **Invite team** with roles: "Sales", "Operations", "Delivery / Fulfillment"
7. **Check dashboard** - no special badge (standard experience)

---

## 📱 Mobile/Responsive Notes

The Organization Type selection screen:
- **Desktop:** Two cards side-by-side
- **Mobile:** Cards stack vertically
- **Tablet:** Adapts responsively
- Large tap targets on all devices
- Clear visual feedback on selection

---

## 🔐 Security & Data Notes

- Organization type is stored in `tenants.business_type` column
- Only owner role can change organization type
- API endpoint: `PATCH /api/tenants/business-type` requires authentication
- Default value: `'default'` (Professional Services)
- Valid values: `'default'` | `'chamber'`
- Change is immediate and affects all users in that tenant

---

## 🎓 For Product/Support Teams

### When a Customer Asks About Chamber Support:

**Answer:** "Yes! When you sign up, you'll be asked to choose your organization type. Select 'Chamber of Commerce' and the entire platform adapts to membership organization terminology - Membership Development instead of Sales, Programs & Events instead of Delivery, etc."

### When a Chamber Accidentally Chose Professional Services:

**Fix:** "No problem! Just visit the Organization Type page (`/organization-type`), select Chamber of Commerce, and all the labels will update immediately. Your data stays the same."

### When Adding a New Business Type (Future):

1. Add new type to `businessTypeProfiles.ts`
2. Define role labels, intros, and KPIs
3. Update `OrganizationTypeStep` options array
4. Update backend validation
5. That's it! Everything else adapts automatically.

---

## 📚 Technical Reference

- **Config File:** `shared/src/config/businessTypeProfiles.ts`
- **Frontend Context:** `frontend/src/context/TenantContext.tsx`
- **Selection Component:** `frontend/src/components/onboarding/OrganizationTypeStep.tsx`
- **Selection Page:** `frontend/src/pages/OrganizationType.tsx`
- **API Endpoint:** `backend/src/controllers/tenants.controller.ts::updateBusinessType`
- **Database Schema:** `backend/src/db/schema.ts` (tenants table)
- **Migration:** `backend/drizzle/025_add_business_type_to_tenants.sql`

---

## 🎉 Summary

The **Organization Type Selection** is:
- **Step 2** of onboarding (right after signup)
- **Simple** - just two choices
- **Impactful** - transforms entire UX
- **Flexible** - can be changed anytime
- **Non-breaking** - default experience unchanged

For **Chamber of Commerce** customers, this creates a native, purpose-built experience where every label, every intro, and every metric speaks their language from day one.
