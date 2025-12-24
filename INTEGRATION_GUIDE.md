# Integration Guide - New Components

Quick reference for integrating the new role-based components into DashboardV3.

---

## ✅ What's Done

- [x] Type definitions (`src/types/roles.ts`, `src/types/dashboard.ts`)
- [x] Reusable components (`RoleCard`, `RoleDrawer`, `ProgressOverview`)
- [x] Leadership Summary page (`/owner/summary`)
- [x] AI Roadmap page (`/owner/roadmap`)
- [x] Routes wired up in App.tsx
- [x] Complete product spec documented

---

## 🔧 Next Steps: Integrate into DashboardV3

### 1. Update DashboardV3 Imports

Add these imports at the top of `DashboardV3.tsx`:

```typescript
import { RoleCard } from '../../components/dashboard/RoleCard';
import { RoleDrawer } from '../../components/dashboard/RoleDrawer';
import { ProgressOverview } from '../../components/dashboard/ProgressOverview';
import { 
  RoleStatus, 
  LeadershipRole, 
  ROLE_METADATA 
} from '../../types/roles';
import { 
  DashboardState, 
  getCounts, 
  getNextAction,
  isSummaryUnlocked,
  isRoadmapUnlocked 
} from '../../types/dashboard';
```

---

### 2. Transform Backend Data to RoleStatus

Replace the current invite/intake logic with this state derivation:

```typescript
const deriveRoleStatus = (
  invites: any[],
  intakes: any[]
): RoleStatus[] => {
  return (['ops', 'sales', 'delivery'] as LeadershipRole[]).map(role => {
    const invite = invites.find(i => i.role === role);
    const intake = intakes.find(i => i.role === role);

    return {
      role,
      displayName: ROLE_METADATA[role].displayName,
      email: invite?.email,
      inviteStatus: invite?.accepted 
        ? 'accepted' 
        : invite 
        ? 'invite_sent' 
        : 'not_invited',
      intakeStatus: intake ? 'submitted' : 'not_started',
      inviteSentAt: invite?.createdAt,
      acceptedAt: invite?.acceptedAt,
      intakeUpdatedAt: intake?.updatedAt,
    };
  });
};

// In your component:
const roles = deriveRoleStatus(invites, intakes);
const dashboardState: DashboardState = { roles };
const { invitesAccepted, intakesSubmitted } = getCounts(dashboardState);
const nextAction = getNextAction(dashboardState);
```

---

### 3. Replace Role Cards Section

Replace your current role cards with:

```tsx
{/* Role Cards Grid */}
<section className="mt-10">
  <h2 className="text-lg font-semibold text-gray-800 mb-4">
    Leadership Team
  </h2>
  <div className="grid gap-6 md:grid-cols-3">
    {roles.map(role => (
      <RoleCard
        key={role.role}
        role={role}
        onClick={() => {
          setSelectedRole(role);
          setDrawerOpen(true);
        }}
        onInviteClick={() => {
          // Open your invite modal/flow
          handleInviteRole(role.role);
        }}
      />
    ))}
  </div>
</section>
```

---

### 4. Add Progress Overview

Replace your current progress section with:

```tsx
<ProgressOverview state={dashboardState} />
```

---

### 5. Add Next Action Badge

In your header section:

```tsx
<div className="flex items-center justify-between mb-6">
  <div>
    <h1 className="text-2xl font-bold text-gray-900">
      Strategic AI Roadmap Portal
    </h1>
    <p className="text-sm text-gray-600 mt-1">
      Owner Dashboard
    </p>
  </div>
  <div className="flex items-center gap-3">
    <span className="rounded-full bg-blue-50 px-4 py-1.5 text-xs font-medium text-blue-700">
      {nextAction}
    </span>
    <button
      onClick={logout}
      className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
    >
      Logout
    </button>
  </div>
</div>
```

---

### 6. Add Summary & Roadmap Tiles

After the role cards section:

```tsx
{/* Action Tiles */}
<section className="mt-10">
  <h2 className="text-lg font-semibold text-gray-800 mb-4">
    Strategic Deliverables
  </h2>
  <div className="grid gap-6 md:grid-cols-2">
    {/* Leadership Summary Tile */}
    <div
      className={`relative rounded-xl border px-6 py-5 shadow-sm transition-all cursor-pointer ${
        isSummaryUnlocked(dashboardState)
          ? 'bg-white hover:shadow-md hover:scale-[1.02]'
          : 'bg-gray-50 border-gray-300 opacity-60 cursor-not-allowed'
      }`}
      onClick={() => {
        if (isSummaryUnlocked(dashboardState)) {
          window.location.href = '/owner/summary';
        }
      }}
    >
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">📄</span>
        <span className="text-2xl">📋</span>
        <h3 className="text-lg font-semibold text-gray-900">
          Leadership Summary
        </h3>
      </div>
      <p className="text-sm text-gray-600">
        {isSummaryUnlocked(dashboardState)
          ? 'Review all submitted intake forms and prepare for your discovery call.'
          : `Complete ${1 - intakesSubmitted} more intake(s) to unlock`}
      </p>
      {!isSummaryUnlocked(dashboardState) && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/40 rounded-xl">
          <span className="text-4xl opacity-30">🔒</span>
        </div>
      )}
    </div>

    {/* AI Roadmap Tile */}
    <div
      className={`relative rounded-xl border px-6 py-5 shadow-sm transition-all cursor-pointer ${
        isRoadmapUnlocked(dashboardState)
          ? 'bg-white hover:shadow-md hover:scale-[1.02]'
          : 'bg-gray-50 border-gray-300 opacity-60 cursor-not-allowed'
      }`}
      onClick={() => {
        if (isRoadmapUnlocked(dashboardState)) {
          window.location.href = '/owner/roadmap';
        }
      }}
    >
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">🧭</span>
        <span className="text-2xl">🗺️</span>
        <h3 className="text-lg font-semibold text-gray-900">
          AI Roadmap
        </h3>
      </div>
      <p className="text-sm text-gray-600">
        {isRoadmapUnlocked(dashboardState)
          ? 'View your personalized 2026 Strategic AI Infrastructure Roadmap.'
          : `Complete ${3 - intakesSubmitted} more intake(s) to unlock`}
      </p>
      {!isRoadmapUnlocked(dashboardState) && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/40 rounded-xl">
          <span className="text-4xl opacity-30">🔒</span>
        </div>
      )}
    </div>
  </div>
</section>
```

---

### 7. Add RoleDrawer Component

At the end of your component (before the closing tags):

```tsx
{/* Role Drawer */}
<RoleDrawer
  open={drawerOpen}
  onClose={() => {
    setDrawerOpen(false);
    setSelectedRole(null);
  }}
  role={selectedRole}
  onViewIntake={() => {
    // Your existing logic to view intake details
    const intake = intakes.find(i => i.role === selectedRole?.role);
    if (intake) {
      setSelectedIntake(intake);
      setShowIntakeModal(true);
    }
  }}
  onResendInvite={() => {
    // Your existing resend logic
    handleResendInvite(selectedRole?.email);
  }}
  onCopyLink={() => {
    // Your existing copy link logic
    const invite = invites.find(i => i.role === selectedRole?.role);
    if (invite?.token) {
      navigator.clipboard.writeText(
        `${window.location.origin}/accept-invite/${invite.token}`
      );
      // Show toast or confirmation
    }
  }}
  onReplaceLead={() => {
    // Future: Replace leader flow
    alert('Replace leader functionality coming soon');
  }}
/>
```

---

### 8. State Management

Add these state variables to your component:

```typescript
const [drawerOpen, setDrawerOpen] = useState(false);
const [selectedRole, setSelectedRole] = useState<RoleStatus | null>(null);
```

---

## 🎨 Styling Notes

The new components use:
- **Animations:** `animate-fadeIn`, `animate-slideInRight`, `animate-scaleIn`
- **Colors:** Tailwind blue-600, green-600, yellow-600, gray scale
- **Hover effects:** `hover:scale-[1.02]` with smooth transitions
- **Spacing:** Generous `space-y-10` for section breathing room

Make sure your `index.css` includes the custom animations from DashboardV3.

---

## 🧪 Testing Checklist

After integration:

- [ ] All 3 role cards render correctly
- [ ] Click role card → drawer opens
- [ ] Drawer shows correct status for each role
- [ ] "Invite Lead" button works (not invited state)
- [ ] Progress bars update correctly
- [ ] Next Action badge changes based on state
- [ ] Summary tile locks/unlocks at 1+ intakes
- [ ] Roadmap tile locks/unlocks at 3 intakes
- [ ] Click unlocked tiles → navigates to correct page
- [ ] "View Intake Details" button works from drawer

---

## 📦 File Structure

```
frontend/src/
├── types/
│   ├── roles.ts              ✅ Created
│   └── dashboard.ts          ✅ Created
├── components/
│   └── dashboard/
│       ├── RoleCard.tsx      ✅ Created
│       ├── RoleDrawer.tsx    ✅ Created
│       └── ProgressOverview.tsx ✅ Created
├── pages/
│   └── owner/
│       ├── DashboardV3.tsx   🔧 Needs integration
│       ├── LeadershipSummaryPage.tsx ✅ Created
│       └── RoadmapPage.tsx   ✅ Created
└── App.tsx                   ✅ Routes updated
```

---

## 🚀 Quick Start

1. **Import the helpers** in DashboardV3
2. **Derive role state** from your existing invites/intakes
3. **Replace role cards** with `<RoleCard />`
4. **Add drawer** with `<RoleDrawer />`
5. **Add tiles** for Summary and Roadmap
6. **Test the flow** end-to-end

All components are production-ready and follow your existing patterns!

---

Need help with any step? The complete spec is in `PRODUCT_SPEC.md`.
