
# META-TICKET: SuperAdmin Tenant Impersonation (Hardened)

## Ticket ID
TICKET-SA-IMPERSONATION

## Status
APPROVED

## Description
SuperAdmins need the ability to "impersonate" a Tenant Owner to troubleshoot and verify configurations. This must be implemented securely using a dedicated impersonation token structure, audit logging, and short-lived sessions.

## Security Constraints (Hard Requirements)
1.  **Distinct Token Structure**: Impersonation tokens must use `typ: 'impersonation'` and include an `act` (actor) claim identifying the SuperAdmin.
2.  **Short TTL**: Tokens must expire in **15 minutes**.
3.  **Session Binding**: Tokens must be bound to a server-side `impersonation_sessions` record via `jti`.
4.  **Audit Trail**: All impersonation starts must be logged to `audit_events` and `impersonation_sessions`.

## Scope (Backend)
1.  **Endpoint**: `POST /api/superadmin/impersonate`
    *   **Auth**: `requireSuperAdmin`
    *   **Params**: `{ tenantId: string }`
    *   **Logic**:
        1.  Verify SuperAdmin authority.
        2.  Resolve target Tenant and Owner.
        3.  Create `impersonation_sessions` record (Status: Active).
        4.  Generate **Impersonation JWT**:
            *   `sub`: Target Owner ID
            *   `act`: SuperAdmin ID
            *   `typ`: 'impersonation'
            *   `jti`: Session ID
            *   `exp`: 15 mins
    *   **Response**: `{ token: string, user: UserProfile, sessionId: string }`

2.  **Middleware Updates**:
    *   Update `verifyToken` / `authenticate` to parse and accept the new token structure.
    *   Ensure `req.user` is populated with the Target Owner's identity so downstream controllers work transparently.
    *   Log the "Impersonator" context in audit logs if present.

## Implementation Details

### 1. `backend/src/utils/auth.ts`
*   Update `TokenPayload` interface.
*   Update `generateToken` to accept options for `typ`, `act`, `expiresIn`.

### 2. `backend/src/controllers/superadmin.controller.ts`
*   Update `impersonateTenantOwner` to implement the hardened flow.

### 3. `backend/src/middleware/auth.ts`
*   Ensure `authenticate` handles the `act` claim (optional for v1, but good for logging).

## Verification Plan
1.  SuperAdmin calls `/impersonate`.
2.  Receive Token.
3.  Decode Token: Verify `typ: 'impersonation'` and `act: <superAdminId>`.
4.  Use Token to call a protected route (e.g., `/api/auth/me`).
5.  Verify the response returns the *Target Owner's* profile.
