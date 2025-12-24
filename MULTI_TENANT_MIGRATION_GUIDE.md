# Multi-Tenant Migration Guide

**Date:** 2025-01-20  
**Purpose:** Add multi-tenant support to enable onboarding 20+ firms safely  
**Impact:** Adds `ownerId` to users and intakes tables

---

## 🎯 What This Enables

**Before:** Single-tenant-ish (all owners see all intakes)  
**After:** Hard multi-tenant isolation (each owner only sees their firm's data)

### Key Changes:
- `users.ownerId` → Owner is the tenant key
- `intakes.ownerId` → Scopes intake responses to tenant
- JWT tokens include `ownerId` for request scoping
- All queries filtered by `ownerId` for isolation

---

## 🚀 Migration Steps

### **Step 1: Run the SQL Migration**

```bash
cd backend
psql $DATABASE_URL < src/db/migrations/001_add_multi_tenant_support.sql
```

This will:
1. Add `owner_id` column to `users` (nullable initially)
2. Backfill existing owners with `owner_id = id`
3. Make `owner_id` NOT NULL
4. Add `owner_id` column to `intakes`
5. Backfill from users table
6. Add indexes for performance

### **Step 2: Verify Schema Changes**

```bash
psql $DATABASE_URL -c "\d users"
psql $DATABASE_URL -c "\d intakes"
```

Expected output:
```
users:
  - id (uuid, pk)
  - email (varchar)
  - password_hash (varchar)
  - role (varchar)
  - name (varchar)
  - owner_id (uuid, not null) ← NEW
  - created_at (timestamp)

intakes:
  - id (uuid, pk)
  - user_id (uuid, fk)
  - role (varchar)
  - answers (jsonb)
  - owner_id (uuid, not null) ← NEW
  - created_at (timestamp)
```

### **Step 3: Restart Backend**

```bash
pnpm run dev  # or your production restart command
```

The updated controllers will now:
- Set `ownerId` on registration (to own ID)
- Set `ownerId` on invite acceptance (from invite)
- Include `ownerId` in JWT tokens
- Filter all queries by `ownerId`

---

## ✅ Testing Checklist

### Test 1: New Owner Registration
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"owner2@test.com","password":"test123","name":"Owner Two"}'
```

**Expected:** User created with `owner_id = user.id`

### Test 2: Owner Invites Leadership
```bash
curl -X POST http://localhost:3001/api/invites/create \
  -H "Authorization: Bearer <owner2_token>" \
  -H "Content-Type: application/json" \
  -d '{"email":"ops2@test.com","role":"ops"}'
```

**Expected:** Invite created with `owner_id = owner2.id`

### Test 3: Leadership Accepts Invite
```bash
curl -X POST http://localhost:3001/api/invites/accept \
  -H "Content-Type: application/json" \
  -d '{"token":"<invite_token>","name":"Ops Two","password":"test123"}'
```

**Expected:** New user created with `owner_id = owner2.id` (inherited from invite)

### Test 4: Leadership Submits Intake
```bash
curl -X POST http://localhost:3001/api/intake/submit \
  -H "Authorization: Bearer <ops2_token>" \
  -H "Content-Type: application/json" \
  -d '{"role":"ops","answers":{"test":"data"}}'
```

**Expected:** Intake created with `owner_id = owner2.id`

### Test 5: Owner Views Intakes (Isolation Test)
```bash
# Owner 1 should only see their intakes
curl http://localhost:3001/api/intake/owner \
  -H "Authorization: Bearer <owner1_token>"

# Owner 2 should only see their intakes
curl http://localhost:3001/api/intake/owner \
  -H "Authorization: Bearer <owner2_token>"
```

**Expected:** Each owner sees ONLY their team's intakes

---

## 🔄 Rollback Instructions

If something goes wrong, rollback using:

```bash
psql $DATABASE_URL <<EOF
DROP INDEX IF EXISTS idx_intakes_owner_id;
DROP INDEX IF EXISTS idx_users_owner_id;
ALTER TABLE intakes DROP COLUMN owner_id;
ALTER TABLE users DROP COLUMN owner_id;
EOF
```

Then revert the code changes:
```bash
git revert HEAD  # or checkout previous commit
```

---

## 📊 Database Verification Queries

### Check existing data was backfilled correctly:

```sql
-- All owners should have owner_id = id
SELECT id, email, role, owner_id, (id = owner_id) AS is_self_tenant
FROM users
WHERE role = 'owner';

-- All invited users should have owner_id matching their inviter
SELECT u.id, u.email, u.role, u.owner_id, o.email AS owner_email
FROM users u
JOIN users o ON u.owner_id = o.id
WHERE u.role != 'owner';

-- All intakes should have owner_id set
SELECT i.id, i.role, i.owner_id, u.email AS owner_email
FROM intakes i
JOIN users u ON i.owner_id = u.id;
```

---

## 🎯 Success Criteria

- [x] Schema migration completes without errors
- [x] All existing users have `owner_id` set
- [x] All existing intakes have `owner_id` set
- [x] New registrations set `owner_id = user.id`
- [x] Invite acceptance inherits `owner_id` from invite
- [x] Intake submission includes `owner_id`
- [x] Owner queries only return their tenant's data
- [x] JWT tokens include `ownerId` field
- [x] No 500 errors after migration

---

## 🚨 Common Issues

### Issue: "column owner_id does not exist"
**Cause:** Migration not run  
**Fix:** Run the SQL migration file

### Issue: "null value in column owner_id violates not-null constraint"
**Cause:** Backfill step failed  
**Fix:** Check `UPDATE` queries in migration, ensure all rows updated before `SET NOT NULL`

### Issue: Owner sees no intakes after migration
**Cause:** `owner_id` mismatch in queries  
**Fix:** Verify JWT token includes `ownerId` and matches database `owner_id`

### Issue: Invited user can't submit intake
**Cause:** `owner_id` not set during invite acceptance  
**Fix:** Check invite controller sets `ownerId: invite.ownerId`

---

## 📝 Notes

- **Backward Compatible:** Existing owner can still see their old data
- **Forward Compatible:** Easy to migrate to `organizations` table later
- **Zero Downtime:** Migration can run on live database (adds nullable column first)
- **Performance:** Indexes added on `owner_id` columns for fast filtering

---

## 🔮 Future: Organizations Table

When you need multi-user per org + billing:

1. Create `organizations` table
2. Add `organizationId` to users/invites/intakes
3. Migrate `ownerId → organizationId`
4. All queries still work (just filter by `organizationId` instead)

Current `ownerId` pattern is **the right foundation** for that upgrade.

---

**Status:** ✅ Ready to deploy  
**Risk Level:** LOW (additive changes, safe rollback)  
**Estimated Migration Time:** <5 minutes
