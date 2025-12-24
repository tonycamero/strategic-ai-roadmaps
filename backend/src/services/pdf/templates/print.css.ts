/**
 * Canonical Print CSS (Dark Mode, Letter 8.5x11)
 * Matches exact spec from print-first PDF template
 */

export const PRINT_CSS = `
/* =========================================================
   PDF PRINT TEMPLATE — DARK MODE (8.5x11 Letter)
   ========================================================= */

@page {
  size: Letter;
  margin: 0.65in 0.65in 0.75in 0.65in; /* bottom extra for footer */
}

:root {
  --bg: #070A12;
  --panel: rgba(255,255,255,0.04);
  --panel-2: rgba(255,255,255,0.06);
  --border: rgba(255,255,255,0.08);
  --text: rgba(255,255,255,0.92);
  --muted: rgba(255,255,255,0.64);
  --faint: rgba(255,255,255,0.44);

  --accent: #3B82F6;
  --accent2: #22C55E;
  --warn: #F97316;
  --danger: #EF4444;

  --radius: 16px;
  --shadow: 0 10px 30px rgba(0,0,0,0.40);

  --h1: 36px;
  --h2: 26px;
}

html, body {
  height: 100%;
  margin: 0;
  padding: 0;
  background: var(--bg);
  color: var(--text);
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}

* { hyphens: none; box-sizing: border-box; }

.doc { width: 100%; background: var(--bg); }

.page {
  position: relative;
  padding: 0;
  page-break-after: always;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 0 18px 0;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 650;
  letter-spacing: 0.2px;
  font-size: 11px;
  color: var(--text);
}

.brand-badge {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  background: linear-gradient(135deg, rgba(59,130,246,0.9), rgba(34,197,94,0.55));
  box-shadow: 0 8px 18px rgba(59,130,246,0.18);
}

.top-meta {
  font-size: 10px;
  color: var(--muted);
  display: flex;
  align-items: center;
  gap: 12px;
  white-space: nowrap;
}

.rule {
  height: 1px;
  background: rgba(255,255,255,0.06);
  margin: 14px 0 18px 0;
}

.page-footer {
  margin-top: 20px;
  padding-top: 14px;
  border-top: 1px solid rgba(255,255,255,0.06);
  font-size: 9px;
  color: var(--faint);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-left { display:flex; gap:10px; align-items:center; }
.footer-dot { width:4px; height:4px; border-radius:99px; background: rgba(255,255,255,0.25); }

.h1 {
  font-size: var(--h1);
  line-height: 1.08;
  margin: 0;
  font-weight: 760;
  letter-spacing: -0.5px;
}

.h2 {
  margin: 4px 0 0 0;
  font-size: var(--h2);
  line-height: 1.12;
  font-weight: 820;
  letter-spacing: -0.3px;
  color: rgba(255,255,255,0.92);
}

.subhead {
  margin-top: 10px;
  font-size: 12px;
  color: var(--muted);
  max-width: 560px;
  line-height: 1.5;
}

.subhead-wide { max-width: none; }

.section-kicker {
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--faint);
  margin: 0 0 10px 0;
}

.section-title {
  font-size: 14px;
  margin: 0 0 10px 0;
  font-weight: 700;
  color: var(--text);
}

.section-num {
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(59,130,246,0.75);
  margin: 0 0 6px 0;
}

.pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.10);
  background: rgba(255,255,255,0.03);
  color: var(--muted);
  font-size: 10px;
  white-space: nowrap;
}

.dot {
  width: 7px;
  height: 7px;
  border-radius: 99px;
  background: var(--accent);
  box-shadow: 0 0 0 3px rgba(59,130,246,0.18);
}
.dot-blue { background: var(--accent); box-shadow: 0 0 0 3px rgba(59,130,246,0.18); }
.dot-green { background: var(--accent2); box-shadow: 0 0 0 3px rgba(34,197,94,0.16); }
.dot-warn { background: var(--warn); box-shadow: 0 0 0 3px rgba(249,115,22,0.16); }

.card {
  background: linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.03));
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: var(--radius);
  padding: 14px;
  box-shadow: var(--shadow);
  break-inside: avoid;
  page-break-inside: avoid;
}

.card-flat {
  box-shadow: none;
  background: rgba(255,255,255,0.03);
}

.card-title {
  font-size: 11px;
  font-weight: 750;
  margin: 0 0 8px 0;
  color: rgba(255,255,255,0.90);
}

.card-body {
  font-size: 10.5px;
  line-height: 1.5;
  color: rgba(255,255,255,0.66);
  margin: 0;
}

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  break-inside: avoid;
  page-break-inside: avoid;
}

.section { margin: 18px 0 0 0; break-inside: avoid; page-break-inside: avoid; }
.section + .section { margin-top: 22px; }

.quote {
  margin-top: 10px;
  padding: 10px 12px;
  border-left: 2px solid rgba(59,130,246,0.65);
  background: rgba(59,130,246,0.08);
  border-radius: 12px;
  font-size: 10px;
  color: rgba(255,255,255,0.72);
  line-height: 1.45;
  break-inside: avoid;
  page-break-inside: avoid;
}

.plan { display: grid; gap: 10px; break-inside: avoid; page-break-inside: avoid; }

.plan-row {
  display: grid;
  grid-template-columns: 40px 1fr 92px;
  gap: 12px;
  align-items: center;
  padding: 12px;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.03);
  break-inside: avoid;
  page-break-inside: avoid;
}

.week {
  width: 40px;
  height: 26px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 800;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.78);
}

.plan-title {
  font-size: 11px;
  font-weight: 780;
  color: rgba(255,255,255,0.88);
  margin: 0 0 2px 0;
}

.plan-why {
  font-size: 10px;
  color: rgba(255,255,255,0.60);
  margin: 0;
  line-height: 1.45;
}

.owner-tag {
  justify-self: end;
  font-size: 9px;
  color: rgba(255,255,255,0.70);
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.03);
  padding: 5px 8px;
  border-radius: 999px;
  white-space: nowrap;
}

.risk { display: flex; gap: 10px; align-items: flex-start; }
.risk-bullet {
  width: 9px;
  height: 9px;
  border-radius: 99px;
  margin-top: 4px;
  background: rgba(239,68,68,0.75);
  box-shadow: 0 0 0 3px rgba(239,68,68,0.16);
  flex: 0 0 auto;
}
.risk-text {
  font-size: 10.5px;
  color: rgba(255,255,255,0.66);
  line-height: 1.45;
}

.cta {
  margin-top: 18px;
  padding: 14px;
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,0.10);
  background: rgba(255,255,255,0.03);
  text-align: center;
  break-inside: avoid;
  page-break-inside: avoid;
}

.cta-title {
  font-size: 14px;
  font-weight: 820;
  color: rgba(255,255,255,0.92);
  margin: 0 0 6px 0;
}

.cta-body {
  font-size: 10.5px;
  color: rgba(255,255,255,0.66);
  margin: 0 0 10px 0;
  line-height: 1.45;
}

.cta-btn {
  display: inline-block;
  padding: 9px 12px;
  border-radius: 999px;
  border: 1px solid rgba(59,130,246,0.55);
  background: rgba(59,130,246,0.14);
  color: rgba(255,255,255,0.86);
  font-size: 10.5px;
  font-weight: 760;
  text-decoration: none;
}

.cover-hero {
  margin-top: 26px;
  padding: 18px;
  border-radius: 22px;
  border: 1px solid rgba(255,255,255,0.10);
  background:
    radial-gradient(900px 360px at 20% 20%, rgba(59,130,246,0.20), transparent 60%),
    radial-gradient(700px 300px at 90% 0%, rgba(34,197,94,0.14), transparent 60%),
    rgba(255,255,255,0.03);
  break-inside: avoid;
  page-break-inside: avoid;
}

.cover-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 18px;
  align-items: start;
}

.cover-right {
  display: grid;
  gap: 8px;
  justify-items: end;
  text-align: right;
  color: rgba(255,255,255,0.70);
  font-size: 10px;
  white-space: nowrap;
}

.meta-line {
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.10);
  background: rgba(255,255,255,0.03);
}

.cover-pills {
  margin-top: 12px;
  display:flex;
  gap:10px;
  flex-wrap:wrap;
}

.cover-summary {
  margin-top: 18px;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
}

.mini {
  padding: 12px;
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.03);
  break-inside: avoid;
  page-break-inside: avoid;
}

.mini .k {
  font-size: 9px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.48);
  margin: 0 0 6px 0;
}

.mini .v {
  font-size: 11px;
  color: rgba(255,255,255,0.84);
  font-weight: 760;
  margin: 0;
  line-height: 1.3;
}

.tag-row { display:flex; gap:10px; flex-wrap:wrap; }
.bottleneck-row { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; }

.no-split { break-inside: avoid; page-break-inside: avoid; }

.bullets {
  margin: 10px 0 0 18px;
  padding: 0;
  color: rgba(255,255,255,0.70);
  font-size: 10.5px;
  line-height: 1.45;
}

@media screen {
  .page { max-width: 900px; margin: 0 auto; padding: 24px 18px; }
}
`;
