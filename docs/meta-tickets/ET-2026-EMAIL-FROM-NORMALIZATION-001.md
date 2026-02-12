# EXECUTION-TICKET v2
ID: ET-2026-EMAIL-FROM-NORMALIZATION-001
TITLE: Normalize outbound email "from" header to StrategicAI display format
OWNER: Backend
SCOPE: backend email sending service only
CONSTRAINTS:
- No changes outside email sending layer
- No hardcoded email addresses
- Must fail-closed if FROM_EMAIL missing

## OBJECTIVE
Ensure all outbound emails are sent with:
Display Name: StrategicAI
From Address: process.env.FROM_EMAIL

## REQUIREMENTS

1. Locate the centralized email sending service (Resend integration).
   This must be the single path used for all outbound email.

2. Replace any existing "from" usage with:

   const fromEmail = process.env.FROM_EMAIL;
   if (!fromEmail) {
     throw new Error("FROM_EMAIL environment variable is not defined");
   }

   const fromHeader = `StrategicAI <${fromEmail}>`;

3. Pass fromHeader to Resend:

   await resend.emails.send({
     from: fromHeader,
     to,
     subject,
     html,
     text,
   });

4. Remove any:
   - hardcoded "no-reply@..."
   - hardcoded display names
   - inline string literals for from address

5. Add a minimal unit-level guard test (if test harness exists):
   - Throws if FROM_EMAIL undefined
   - Produces correctly formatted header

## ACCEPTANCE CRITERIA

- All outbound emails show:
  StrategicAI <hello@strategicai.app>
- No hardcoded sender strings remain in codebase
- Runtime throws if FROM_EMAIL missing
- No impact to existing email content or templates
- Zero changes to unrelated modules

## DELIVERABLE

- Diff of modified email service file
- Confirmation of no remaining hardcoded sender values via grep:
  rg -n "no-reply|noreply|@strategicai" backend/
