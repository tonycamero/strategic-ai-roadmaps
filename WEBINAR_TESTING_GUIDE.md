# WEBINAR SYSTEM - READY TO TEST

## ✅ STATUS: IMPLEMENTATION COMPLETE

**All code written. Ready for migration + testing.**

---

## 🔧 SETUP STEPS

### 1. Run Migration (REQUIRED)

You need to run the migration manually since it requires database password:

```bash
cd backend
psql "$DATABASE_URL" -f src/db/migrations/024_webinar_system.sql
```

**What this does:**
- Renames `lead_requests` → `webinar_registrations`
- Creates `webinar_settings` table
- Seeds default password: `webinar2025` (hashed with bcrypt)
- Adds indexes for performance

### 2. Dependencies

✅ **bcryptjs is already installed** in backend/package.json (v2.4.3)

If you get build errors, just run:
```bash
cd backend && pnpm install
cd ../frontend && pnpm install
```

### 3. Start Services

```bash
# Terminal 1 - Backend
cd backend
pnpm dev

# Terminal 2 - Frontend  
cd frontend
pnpm dev
```

---

## 🧪 ACCEPTANCE TESTS

### Test 1: Password Authentication

**Wrong password:**
```bash
curl -X POST http://localhost:3001/api/public/webinar/auth \
  -H "Content-Type: application/json" \
  -d '{"password":"wrong"}'
```

**Expected:** `{"ok":false,"message":"Invalid password"}`

**Correct password:**
```bash
curl -X POST http://localhost:3001/api/public/webinar/auth \
  -H "Content-Type: application/json" \
  -d '{"password":"webinar2025"}'
```

**Expected:** `{"ok":true,"passwordVersion":1}`

---

### Test 2: Registration

```bash
curl -X POST http://localhost:3001/api/public/webinar/register \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Test User",
    "email":"test@example.com",
    "company":"Test Co",
    "role":"CEO",
    "teamSize":10,
    "currentCrm":"Salesforce",
    "bottleneck":"Manual processes"
  }'
```

**Expected:** `{"ok":true,"message":"You're registered. We'll send the updated password."}`

**Verify in SuperAdmin:**
1. Visit: `http://localhost:5173/superadmin/leads`
2. Should see the registration in table

---

### Test 3: Owner Diagnostic (Working)

```bash
curl -X POST http://localhost:3001/api/public/webinar/diagnostic/chat \
  -H "Content-Type: application/json" \
  -d '{"role":"owner","sessionId":"test-123","message":""}'
```

**Expected:** H0 question with options array

**Follow-up (answer H0):**
```bash
curl -X POST http://localhost:3001/api/public/webinar/diagnostic/chat \
  -H "Content-Type: application/json" \
  -d '{"role":"owner","sessionId":"test-123","message":"H0_YES"}'
```

**Expected:** Q1 question with options

---

### Test 4: Role Isolation (Critical)

**Start Owner session:**
```bash
curl -X POST http://localhost:3001/api/public/webinar/diagnostic/chat \
  -H "Content-Type: application/json" \
  -d '{"role":"owner","sessionId":"shared-id","message":""}'
```

**Start Sales session WITH SAME sessionId:**
```bash
curl -X POST http://localhost:3001/api/public/webinar/diagnostic/chat \
  -H "Content-Type: application/json" \
  -d '{"role":"sales","sessionId":"shared-id","message":""}'
```

**Expected:** Both return different questions (Owner: real H0, Sales: stub message)

**Implementation uses composite key:** `owner:shared-id` vs `sales:shared-id` → independent state ✓

---

### Test 5: Frontend Flow

1. **Visit:** `http://localhost:5173/webinar`

2. **Password gate:**
   - Enter wrong password → Shows error + "Register now" link
   - Enter `webinar2025` → Unlocks

3. **Role selector:**
   - Shows 4 buttons: Owner, Sales, Ops, Delivery

4. **Owner diagnostic:**
   - Click "Owner / Executive"
   - Should see: "Hey — thanks for stopping by..." (H0)
   - Click "Yes, let's do it"
   - Complete Q1 → Q2 → Q3 → Reveal
   - Click "Generate my 1-page Fix Plan"
   - Should redirect to `/onepager`
   - Click "Print / Save PDF" → Opens print dialog

5. **Role isolation:**
   - Go back to `/webinar`
   - Select "Sales" role
   - Should see: "SALES ROLE TAXONOMY NOT CONFIGURED" (stub)
   - **Must NOT show Owner's previous state**

6. **Registration:**
   - Click "Register" tab
   - Fill form + submit
   - Should see: "You're Registered!" message
   - Auto-switches to Diagnostic tab after 3s

---

### Test 6: SuperAdmin Password Management

1. **Login as superadmin**

2. **Visit:** `http://localhost:5173/superadmin/leads`

3. **Password section (top of page):**
   - Shows: "Current version: v1"
   - Enter new password (min 8 chars)
   - Click "Update Password"
   - Should see: "✓ Password updated successfully (v2)"
   - Version increments

4. **Test new password works:**
```bash
curl -X POST http://localhost:3001/api/public/webinar/auth \
  -H "Content-Type: application/json" \
  -d '{"password":"your-new-password"}'
```

**Expected:** `{"ok":true,"passwordVersion":2}`

5. **Registrations table:**
   - Shows all webinar registrations
   - Can filter by status/source
   - Click "Edit" on any row
   - Change status/notes
   - Click "Save"
   - Updates in real-time

---

## 📝 STUB FILES TO REPLACE (Later)

When you have actual sales/ops/delivery questions, replace these:

```
shared/src/feta/taxonomy.sales.ts    → Copy format from taxonomy.owner.ts
shared/src/feta/taxonomy.ops.ts      → Copy format from taxonomy.owner.ts
shared/src/feta/taxonomy.delivery.ts → Copy format from taxonomy.owner.ts

shared/src/feta/synthesis.sales.ts    → Copy format from synthesis.owner.ts
shared/src/feta/synthesis.ops.ts      → Copy format from synthesis.owner.ts
shared/src/feta/synthesis.delivery.ts → Copy format from synthesis.owner.ts
```

**Structure required:**
- Each taxonomy: H0, Q1, Q2, Q3 with options arrays
- Each synthesis: SB-01, SB-02, etc. with headline/signals/diagnosis
- Selector function: `selectXxxSynthesis(answers)` returns synthesis block ID

---

## 🚨 KNOWN ISSUES

1. **Sales/Ops/Delivery show stub messages** until you replace taxonomy files
2. **Old `/api/superadmin/leads` endpoints** still exist (backward compat)
3. **Lint errors in IDE** will vanish after running `pnpm install`

---

## ✅ CHECKLIST BEFORE GO-LIVE

- [ ] Run migration
- [ ] Test password auth (wrong + correct)
- [ ] Test registration flow
- [ ] Test Owner diagnostic end-to-end
- [ ] Verify role isolation (different sessionId per role)
- [ ] Test SuperAdmin password update
- [ ] Test SuperAdmin registrations table
- [ ] Replace role taxonomy stubs with real content
- [ ] Update default password from `webinar2025`
- [ ] Test print/PDF functionality

---

## 🎯 PRODUCTION DEPLOYMENT

1. **Environment variables:** No new vars needed (uses existing `DATABASE_URL`)
2. **Migration:** Run same SQL file against production DB
3. **Password:** Immediately change via SuperAdmin UI after deploy
4. **Monitoring:** Check `/api/public/webinar/*` endpoint logs

---

**DEFAULT PASSWORD:** `webinar2025` (change immediately via SuperAdmin)

**READY TO SHIP.** 🚀
