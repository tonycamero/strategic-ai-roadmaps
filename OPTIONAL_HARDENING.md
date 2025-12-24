# OPTIONAL HARDENING: Auth-Binding + Queue Upgrade

**Status:** NOT BLOCKING - Current implementation is drop-safe  
**Priority:** P2 (post-MVP hardening)  
**Effort:** 1-2 hours

---

## Enhancement 5: Bind PDF Access to Webinar Auth

### Problem
Currently, anyone with a `teamSessionId` can download PDFs. While entropy helps (24+ chars), IDs can leak via screenshare, logs, support tickets, or URL sharing.

### Solution
Require webinar auth token on PDF endpoints.

**Implementation (Fast Path - No DB Changes):**

**File:** `backend/src/controllers/webinar.controller.ts`
```typescript
import jwt from 'jsonwebtoken';

const PDF_SECRET = process.env.PDF_SECRET || 'change-me-in-prod';

// In auth() handler, after password verification:
const pdfToken = jwt.sign(
    {
        teamSessionId: `team-${Date.now()}...`, // Use same ID as team session
        passwordVersion: currentPassword.version,
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24h
    },
    PDF_SECRET
);

res.json({
    ok: true,
    message: 'Access granted',
    pdfToken // Return to client
});
```

**File:** `backend/src/controllers/webinarPdf.controller.ts`
```typescript
import jwt from 'jsonwebtoken';

// Add to both generateRolePdf() and generateTeamPdf():
const { teamSessionId, pdfToken } = req.body;

// Validate token
try {
    const payload = jwt.verify(pdfToken, process.env.PDF_SECRET || 'change-me-in-prod');
    
    // Verify token is for this team session
    if (payload.teamSessionId !== teamSessionId) {
        res.status(403).json({ error: 'Invalid token' });
        return;
    }
} catch (error) {
    res.status(401).json({ error: 'Authentication required' });
    return;
}
```

**Frontend Update:**
```typescript
// Store pdfToken from auth response
sessionStorage.setItem('pdfToken', authResponse.pdfToken);

// Include in PDF requests
await postPdfAndDownload(
    '/api/public/webinar/pdf/team',
    { 
        teamSessionId, 
        pdfToken: sessionStorage.getItem('pdfToken') 
    },
    'team.pdf'
);
```

**Security Impact:**
- PDFs require valid auth token (password gate)
- Tokens expire after 24h
- Tokens bound to specific teamSessionId
- Prevents link sharing after session ends

---

## Enhancement 6: Replace Busy-Wait with Promise Queue

### Problem
Current semaphore uses `while` loop with `setTimeout(100)`, which burns event loop under load.

### Solution
Proper promise queue with resolver array.

**File:** `backend/src/services/pdf/pdfRenderer.ts`

**Replace:**
```typescript
// Current (busy-wait)
let activeRenders = 0;
const MAX_CONCURRENT_RENDERS = 2;

async function waitForRenderSlot(): Promise<void> {
    while (activeRenders >= MAX_CONCURRENT_RENDERS) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    activeRenders++;
}
```

**With:**
```typescript
// Promise queue (clean)
class RenderQueue {
    private active = 0;
    private readonly maxConcurrent = 2;
    private waiters: Array<() => void> = [];

    async acquire(): Promise<void> {
        if (this.active < this.maxConcurrent) {
            this.active++;
            return;
        }

        // Enqueue and wait
        await new Promise<void>(resolve => {
            this.waiters.push(resolve);
        });
    }

    release(): void {
        this.active--;
        
        // Resolve next waiter
        const next = this.waiters.shift();
        if (next) {
            this.active++;
            next();
        }
    }
}

const renderQueue = new RenderQueue();

// In renderPdf():
await renderQueue.acquire();
try {
    // ... render logic
} finally {
    renderQueue.release();
}
```

**Performance Impact:**
- No event loop spinning
- O(1) acquire/release
- Cleaner under concurrent load

---

## Acceptance Criteria

### Enhancement 5 (Auth-Binding):
- [ ] PDF requests without `pdfToken` return 401
- [ ] PDF requests with wrong `teamSessionId` return 403
- [ ] PDF requests with expired token return 401
- [ ] Valid token + matching teamSessionId generates PDF

### Enhancement 6 (Queue):
- [ ] Max 2 concurrent renders enforced
- [ ] No busy-waiting (measure CPU idle)
- [ ] Clean FIFO ordering under load

---

## Testing

```bash
# Test 5: Auth-Binding
curl -X POST "http://localhost:3001/api/public/webinar/pdf/team" \
  -H "Content-Type: application/json" \
  -d '{"teamSessionId":"test123"}' \
# Expected: 401 (no token)

curl -X POST "http://localhost:3001/api/public/webinar/pdf/team" \
  -H "Content-Type: application/json" \
  -d '{"teamSessionId":"test123","pdfToken":"<valid_token>"}' \
  --output team.pdf
# Expected: 200 (PDF generated)

# Test 6: Queue under load
for i in {1..5}; do
  curl -X POST "http://localhost:3001/api/public/webinar/pdf/team" \
    -H "Content-Type: application/json" \
    -d '{"teamSessionId":"test'$i'","pdfToken":"<token>"}' \
    --output team$i.pdf &
done
# Expected: Max 2 concurrent, queue 3, all succeed
```

---

## Dependencies

```bash
# If using JWT for Enhancement 5
cd backend
pnpm add jsonwebtoken
pnpm add -D @types/jsonwebtoken
```

---

## Effort Estimate

- **Enhancement 5 (Auth):** 45-60 min
  - 20 min: Add token generation to auth handler
  - 20 min: Add token validation to PDF endpoints
  - 20 min: Update frontend + testing

- **Enhancement 6 (Queue):** 20-30 min
  - 15 min: Replace semaphore with queue class
  - 15 min: Testing under load

**Total:** ~1.5 hours

---

## Status: OPTIONAL

Current implementation is **drop-safe and production-ready** without these enhancements.

These are "belt + suspenders" hardening for mature production use.

**Recommendation:** Ship current implementation now, add these in post-MVP hardening pass.
