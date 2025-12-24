/**
 * Shared CSS styles for PDF templates
 * Inline for print stability
 */

export const PDF_STYLES = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    background: #0a0a0a;
    color: #e5e5e5;
    line-height: 1.6;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .page {
    page-break-after: always;
    break-after: page;
    min-height: 10in;
  }

  .avoid-break {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  /* Cover Page */
  .cover {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-height: 10in;
    text-align: center;
    padding: 2rem;
  }

  .cover h1 {
    font-size: 3rem;
    font-weight: 700;
    margin-bottom: 1rem;
    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .cover .subtitle {
    font-size: 1.5rem;
    color: #9ca3af;
    margin-bottom: 2rem;
  }

  .cover .meta {
    font-size: 1rem;
    color: #6b7280;
  }

  /* Content Sections */
  .section {
    margin-bottom: 2rem;
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .section-title {
    font-size: 1.75rem;
    font-weight: 600;
    margin-bottom: 1rem;
    color: #3b82f6;
    border-bottom: 2px solid #1f2937;
    padding-bottom: 0.5rem;
  }

  .card {
    background: #111827;
    border: 1px solid #1f2937;
    border-radius: 0.5rem;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .card h3 {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 0.75rem;
    color: #60a5fa;
  }

  .card p {
    color: #d1d5db;
    margin-bottom: 0.75rem;
  }

  .card ul {
    list-style: none;
    padding-left: 0;
  }

  .card li {
    padding: 0.5rem 0;
    color: #d1d5db;
    position: relative;
    padding-left: 1.5rem;
  }

  .card li:before {
    content: "→";
    position: absolute;
    left: 0;
    color: #3b82f6;
  }

  /* First Moves Grid */
  .first-moves-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
    margin-top: 1rem;
  }

  .first-move {
    background: #1f2937;
    padding: 1rem;
    border-radius: 0.375rem;
    border-left: 4px solid #3b82f6;
    break-inside: avoid;
  }

  .first-move h4 {
    font-size: 1rem;
    font-weight: 600;
    color: #60a5fa;
    margin-bottom: 0.5rem;
  }

  .first-move .why {
    font-size: 0.875rem;
    color: #9ca3af;
    margin-bottom: 0.5rem;
  }

  .first-move .meta {
    font-size: 0.75rem;
    color: #6b7280;
    display: flex;
    gap: 1rem;
  }

  /* Comparison Matrix */
  .comparison-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1rem;
    font-size: 0.875rem;
  }

  .comparison-table th,
  .comparison-table td {
    padding: 0.75rem;
    border: 1px solid #1f2937;
    text-align: left;
  }

  .comparison-table th {
    background: #1f2937;
    color: #60a5fa;
    font-weight: 600;
  }

  .comparison-table td {
    background: #111827;
    color: #d1d5db;
  }

  .badge {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .badge-aligned {
    background: #065f46;
    color: #34d399;
  }

  .badge-misaligned {
    background: #7c2d12;
    color: #fb923c;
  }

  .badge-high {
    background: #065f46;
    color: #34d399;
  }

  .badge-med {
    background: #713f12;
    color: #fbbf24;
  }

  .badge-low {
    background: #7c2d12;
    color: #fb923c;
  }

  /* Footer */
  .footer {
    margin-top: 3rem;
    padding-top: 1rem;
    border-top: 1px solid #1f2937;
    text-align: center;
    font-size: 0.75rem;
    color: #6b7280;
  }
`;
