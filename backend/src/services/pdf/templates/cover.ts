/**
 * Cover page template for PDFs
 */

export function buildCoverPage(options: {
    title: string;
    subtitle?: string;
    companyName?: string;
    attendeeName?: string;
    generatedAt?: string;
}): string {
    const { title, subtitle, companyName, attendeeName, generatedAt } = options;

    return `
    <div class="page cover">
      <h1>${escapeHtml(title)}</h1>
      ${subtitle ? `<div class="subtitle">${escapeHtml(subtitle)}</div>` : ''}
      <div class="meta">
        ${companyName ? `<div><strong>Company:</strong> ${escapeHtml(companyName)}</div>` : ''}
        ${attendeeName ? `<div><strong>Prepared for:</strong> ${escapeHtml(attendeeName)}</div>` : ''}
        ${generatedAt ? `<div><strong>Generated:</strong> ${generatedAt}</div>` : ''}
      </div>
    </div>
  `;
}

function escapeHtml(text: string): string {
    const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
}
