# META-TICKET-GIT-HYGIENE-AND-LOCK-1.md

### TITLE

**META — Git Hygiene, Authority Locks, and Change Control**

---

### CLASS

Meta Ticket · Governance / Infrastructure

---

### PRIORITY

**BLOCKING**
Required before any new feature work, schema changes, or agent parallelization.

---

### PURPOSE

Establish a **minimal, enforceable Git hygiene and lock protocol** that prevents:

* silent drift
* undocumented changes
* agent overreach
* loss of execution provenance

This ticket does **not** introduce CI, automation, or tooling beyond what is explicitly declared.

---

### SCOPE (IN BOUNDS)

The following are **explicitly allowed** under this Meta Ticket:

1. **Canonical Branch Declaration**

   * Identify the single authoritative branch (e.g. `main`)
   * All other branches are non-authoritative

2. **Change Entry Rule**

   * Every code change must be traceable to:

     * a Meta Ticket, or
     * an Execution Ticket derived from a Meta Ticket
   * No “drive-by” commits

3. **Ticket → Commit Traceability Rule**

   * Every commit message must reference:

     * the ticket ID (e.g. `CR-UX-6.2`, `FIX-LOCK-INTAKE-1`)
   * Squash commits must preserve ticket reference

4. **Lock Conditions**

   * Schema files
   * SOPs
   * Governance documents
     are **read-only** unless an explicit Meta Ticket authorizes mutation.

5. **Agent Execution Constraint**

   * Agents may not:

     * create branches
     * merge branches
     * rewrite history
   * Agents act only on explicitly delegated execution surfaces.

---

### OUT OF SCOPE (FORBIDDEN)

This Meta Ticket **does NOT authorize**:

* Adding CI/CD
* Adding Git hooks
* Changing repo structure
* Renaming branches
* Rewriting commit history
* Enforcing code style or linting
* Any refactors

If any of the above are required → **STOP and request a new Meta Ticket**.

---

### CURRENT STATE ASSUMPTIONS (TO BE VERIFIED)

* Repo already exists
* Git is already in use
* No destructive changes are required
* Hygiene may be informal or implicit

This ticket formalizes — it does not invent.

---

### DEFINITION OF DONE

This Meta Ticket is considered **COMPLETE** when:

* [x] Authoritative branch is explicitly documented
* [x] Ticket → commit traceability rule is documented
* [x] Lock rules for schema + governance docs are documented
* [x] Agent permissions and prohibitions are explicitly stated
* [x] No code or tooling changes were made during this ticket

---

### VERIFICATION METHOD

* Human review of documentation
* Repo inspection (read-only)
* No scripts required

Narrative confirmation is acceptable **only** because this ticket governs *process*, not runtime behavior.

---

### RESULTING AUTHORITY

Once completed:

* Any un-ticketed commit is **invalid by definition**
* Any agent acting outside a ticket is **non-compliant**
* Future automation can be layered safely **without reinterpretation**

---

### META NOTES

This ticket intentionally favors **clarity over automation**.
Discipline first. Tooling later.

---

### REQUIRED ACTION (NEXT)

1. Save this file to:
   **`docs/meta-tickets/META-TICKET-GIT-HYGIENE-AND-LOCK-1.md`**

2. Acknowledge ingestion.

3. Await explicit instruction to **audit** or **execute**.

---

**END OF META TICKET**
