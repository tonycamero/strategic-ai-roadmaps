
import PDFDocument from 'pdfkit';

/**
 * Renders the Executive Brief into a PDF buffer.
 * uses standard 8.5x11 layout with brand styling.
 */
export async function renderPrivateLeadershipBriefToPDF(brief: any, tenantName: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const buffers: Buffer[] = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });

            const synthesis = brief.synthesis;

            // -- HEADER --
            doc.font('Helvetica-Bold').fontSize(24).text('Executive Brief', { align: 'center' });
            doc.moveDown(0.5);
            doc.font('Helvetica').fontSize(14).text(`Leadership Perspective for ${tenantName}`, { align: 'center', color: '#666666' });
            doc.moveDown(0.5);
            doc.fontSize(10).text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center', color: '#999999' });
            doc.moveDown(2);

            // -- EXECUTIVE SUMMARY --
            if (synthesis.executiveSummary) {
                addSection(doc, 'Executive Summary', synthesis.executiveSummary);
            }

            // -- CONSTRAINT LANDSCAPE --
            if (synthesis.constraintLandscape) {
                doc.addPage();
                addSection(doc, 'Constraint Landscape', synthesis.constraintLandscape);
            }

            // -- BLIND SPOTS --
            if (synthesis.blindSpotRisks) {
                doc.addPage();
                addSection(doc, 'Blind Spot Risks', synthesis.blindSpotRisks);
            }

            // -- OPERATING REALITY --
            if (synthesis.operatingReality) {
                doc.addPage();
                addSection(doc, 'Operating Reality', synthesis.operatingReality);
            }

            // -- FOOTER --
            const pageCount = doc.bufferedPageRange().count;
            for (let i = 0; i < pageCount; i++) {
                doc.switchToPage(i);
                doc.fontSize(8).text(
                    'CONFIDENTIAL - INTERNAL USE ONLY',
                    50,
                    doc.page.height - 50,
                    { align: 'center', width: doc.page.width - 100, color: '#999999' }
                );
            }

            doc.end();

        } catch (error) {
            reject(error);
        }
    });
}

function addSection(doc: PDFKit.PDFDocument, title: string, content: string) {
    doc.font('Helvetica-Bold').fontSize(16).text(title, { underline: true });
    doc.moveDown(1);

    // Split content by role attribution if present (using markdown bold syntax as a heuristic)
    // Content normally looks like "**Role:** Content... \n\n **Role:** Content..."

    // Simple markdown stripper/formatter
    const lines = content.split('\n');

    doc.font('Helvetica').fontSize(11).lineGap(4);

    for (const line of lines) {
        if (line.trim().startsWith('**')) {
            // Role header
            const roleMatch = line.match(/\*\*(.*?)\*\*:?/); // extract role
            if (roleMatch) {
                doc.moveDown(0.5);
                doc.font('Helvetica-Bold').text(roleMatch[1] + ':');
                // Print remainder of line if any
                const remainder = line.substring(roleMatch[0].length).trim();
                if (remainder) {
                    doc.font('Helvetica').text(remainder);
                }
            } else {
                // Fallback
                doc.text(line.replace(/\*\*/g, ''));
            }
        } else if (line.trim() === '') {
            doc.moveDown(0.5);
        } else {
            // Regular text
            doc.font('Helvetica').text(line.replace(/\*\*/g, ''));
        }
    }
    doc.moveDown(1);
}
