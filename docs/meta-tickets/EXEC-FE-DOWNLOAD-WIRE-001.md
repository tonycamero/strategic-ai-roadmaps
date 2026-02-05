EXECUTION-TICKET: EXEC-FE-DOWNLOAD-WIRE-001

Title:
Fix “Download PDF” button — ensure it triggers request + downloads file

Status:
APPROVED

Objective:
In SuperAdmin → Execute → Executive Brief → Delivery & Export,
the “Download PDF” button must trigger a GET request to:
  /api/superadmin/firms/:tenantId/executive-brief/download
and initiate a browser download of the returned PDF.

Scope (STRICT):
- Frontend only.
- Only touch code paths for the “Download PDF” button in the Executive Brief modal Delivery & Export tab.
- No refactors. No styling changes except what is required to make the button clickable.
- No backend changes.

Hypotheses (ordered by likelihood):
H1) Button is disabled or has pointer-events: none (state/props mismatch)
H2) onClick handler missing / not bound in prod bundle
H3) onClick exists but returns early due to guard (e.g., missing firmId/tenantId, auth token, brief not approved/delivered)
H4) Click is swallowed by overlay/container (z-index / pointer-events) so handler never runs
H5) Handler uses window.open to a protected route and browser blocks popups

Required Debug Steps (Operator):
A) In browser console, run:
   - Right-click button → Inspect → confirm it is a <button> (or clickable element)
   - In Elements pane, check computed:
     pointer-events, opacity, disabled attribute
B) Add a temporary “click proof”:
   - In the onClick handler for Download button, add:
     console.log("[DownloadPDF] click", { tenantId, firmId, briefId })
   - Rebuild and confirm the log appears when clicked.

Required Implementation (minimal):
1) Ensure the button is actually clickable:
   - Remove disabled unless truly required
   - Ensure parent containers do not block pointer events

2) Wire onClick to a deterministic download flow:
   - Use fetch with Authorization header (Bearer token you already use in other SA calls)
   - On 200, convert response to Blob and trigger download via an <a download> click
   - On non-200, show toast/error and log response text

Pseudo-Implementation:
- handler:
  async function downloadExecutiveBrief(tenantId: string) {
    console.log("[DownloadPDF] start", { tenantId });
    const res = await fetch(`/api/superadmin/firms/${tenantId}/executive-brief/download`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[DownloadPDF] failed", res.status, text);
      throw new Error(`Download failed (${res.status})`);
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Executive_Brief_${tenantId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    console.log("[DownloadPDF] success");
  }

3) Confirm Network activity now appears:
   - You must see GET …/executive-brief/download
   - Must return 200 application/pdf

Acceptance Criteria:
- Clicking “Download PDF” fires a GET request every time.
- PDF downloads successfully.
- On failure, user sees a clear error and console logs show status + response.
