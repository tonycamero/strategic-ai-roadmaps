/// <reference types="node" />
import type { Buffer as NodeBuffer } from 'node:buffer';
import PDFDocument from 'pdfkit';

/**
 * Renders the Executive Brief into a PDF buffer.
 * uses standard 8.5x11 layout with brand styling.
 */
/**
 * Renders the Executive Brief into a PDF buffer.
 * uses standard 8.5x11 layout with brand styling.
 */
export async function renderPrivateLeadershipBriefToPDF(
  brief: any,
  tenantName: string,
  briefMode: "DIAGNOSTIC_RAW" | "EXECUTIVE_SYNTHESIS" = "EXECUTIVE_SYNTHESIS",
  artifactCreatedAt?: Date  // EXEC-BRIEF-PDF-ARTIFACT-CONSISTENCY-022: Use artifact timestamp, not brief timestamp
): Promise<Buffer> {
  console.log(`[PDF Renderer] Rendering brief with mode: ${briefMode}`);

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 50,
        bufferPages: true
      });
      const buffers: NodeBuffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers as any);
        resolve(pdfData);
      });

      if (briefMode === 'EXECUTIVE_SYNTHESIS') {
        renderExecutiveSynthesisContract(doc, brief, tenantName, artifactCreatedAt);
      } else {
        renderDiagnosticRawContract(doc, brief, tenantName);
      }

      // Add footers to all pages that have content (Fix footer-only pages)
      const range = doc.bufferedPageRange();
      const pagesWithContent = (doc as any)._pagesWithContent as Set<number> || new Set();

      console.log(`[PDF_FOOTER] Applying footers to ${pagesWithContent.size} of ${range.count} pages.`);

      for (let i = range.start; i < range.start + range.count; i++) {
        const pageNumber = i + 1;
        if (pagesWithContent.has(pageNumber)) {
          doc.switchToPage(i);
          renderFooter(doc, pageNumber, range.count, tenantName, artifactCreatedAt);
        }
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

import {
  stripPdfSuppressedMeta,
  mitigateRepetition,
  PDF_TYPOGRAPHY,
  normalizeParagraphs,
  keepWithNext
} from './executiveBriefPdfRules';
import { LEADERSHIP_CONTEXT_V1 } from '../../modules/executiveBrief/pdf/copy/leadershipContext';

function renderExecutiveSynthesisContract(
  doc: PDFKit.PDFDocument,
  brief: any,
  tenantName: string,
  artifactCreatedAt?: Date
) {
  const synthesis = brief.synthesis;
  const content = synthesis?.content;

  // 1. LAYER SELECTION (EXEC-BRIEF-PDF-LAYER-SELECT-025)
  const isMirrorEnabled = process.env.EXEC_BRIEF_MIRROR_NARRATIVE === 'true';
  const hasMirrorContent = !!(content?.mirrorSections && Object.keys(content.mirrorSections).length > 0);
  const chosenLayer = (isMirrorEnabled && hasMirrorContent) ? 'mirror' : 'facts';
  const includeEvidence = process.env.EXEC_BRIEF_PDF_INCLUDE_EVIDENCE === 'true';

  console.log(`[PDF_LAYER] mirrorEnabled=${isMirrorEnabled} hasMirror=${hasMirrorContent} includeEvidence=${includeEvidence} chosen=${chosenLayer}`);

  // 1b. DETERMINISTIC PAGINATION (Ticket EXEC-MIRROR-LAYOUT-FIX-027)
  let pagesWithContent = new Set<number>([1]); // Page 1 (Cover) always active
  let isDrawingContent = false;
  const setIsDrawing = (val: boolean) => isDrawingContent = val;

  doc.on('pageAdded', () => {
    const range = doc.bufferedPageRange();
    const pageNum = range.start + range.count; // 1-based index
    if (isDrawingContent) {
      pagesWithContent.add(pageNum);
    }
  });

  const markActive = () => {
    const range = doc.bufferedPageRange();
    const pageNum = range.start + range.count; // 1-based index
    pagesWithContent.add(pageNum);
  };

  const ensureSpace = (height: number, reason?: string) => {
    const bottomLimit = 710; // Provide safe gap before footer
    const remaining = 742 - doc.y; // 742 is typical page height minus footer zone

    if (doc.y + height > bottomLimit) {
      console.log(`[PDF_PAGING] Forced page break. Block: ${reason}. heightReq=${height} remaining=${remaining.toFixed(1)}`);
      doc.addPage();
      if (isDrawingContent) markActive();
      return true;
    }
    return false;
  };

  // 2. COVER PAGE
  setIsDrawing(true);
  doc.font('Helvetica-Bold').fontSize(28).fillColor('#1E293B')
    .text('Executive Brief', { align: 'center' });

  doc.moveDown(0.4);
  doc.font('Helvetica').fontSize(14).fillColor('#64748B')
    .text('Leadership Perspective', { align: 'center' });

  doc.moveDown(2.5);
  doc.font('Helvetica').fontSize(10).fillColor('#94A3B8').text('PREPARED FOR', { align: 'center', characterSpacing: 1 });
  doc.moveDown(0.5);
  doc.font('Helvetica-Bold').fontSize(20).fillColor('#0F172A')
    .text(tenantName, { align: 'center' });

  doc.moveDown(3);
  doc.font('Helvetica').fontSize(10).fillColor('#94A3B8').text('PREPARED BY', { align: 'center', characterSpacing: 1 });
  doc.moveDown(0.5);
  doc.font('Helvetica-Bold').fontSize(12).fillColor('#475569').text('Strategic AI Roadmaps', { align: 'center' });

  doc.moveDown(4);
  const generatedDate = (artifactCreatedAt || new Date()).toISOString().split('T')[0];
  const requestId = brief.id ? brief.id.substring(0, 8) : 'N/A';
  const metaLine = `Generated: ${generatedDate}  •  Request ID: ${requestId}  •  CONFIDENTIAL — LEADERSHIP ONLY`;
  doc.font('Helvetica').fontSize(9).fillColor('#94A3B8').text(metaLine, { align: 'center' });
  setIsDrawing(false);

  doc.addPage(); // Page 2: Leadership Context
  renderExecutiveSectionWithRules(doc, 'Leadership Context', LEADERSHIP_CONTEXT_V1, markActive, ensureSpace, setIsDrawing);

  doc.addPage(); // Page 3: Executive Summary (Hard Break)
  const summaryText = chosenLayer === 'mirror'
    ? (content.mirrorSections?.EXEC_SUMMARY?.livedReality || content.mirrorSummary || 'Summary pending...')
    : (content.executiveSummary || synthesis.strategicSignalSummary || 'Summary pending...');

  renderExecutiveSectionWithRules(doc, 'Executive Summary', summaryText, markActive, ensureSpace, setIsDrawing);

  // PRIMARY SECTIONS
  const sections = [
    { title: 'Operating Reality', key: 'OPERATING_REALITY', fallback: 'operatingReality' },
    { title: 'Constraint Landscape', key: 'CONSTRAINT_LANDSCAPE', fallback: 'constraintLandscape' },
    { title: 'Blind Spot Risks', key: 'BLIND_SPOT_RISKS', fallback: 'blindSpotRisks' },
    { title: 'Alignment Signals', key: 'ALIGNMENT_SIGNALS', fallback: 'alignmentSignals' }
  ];

  sections.forEach((section) => {
    if (chosenLayer === 'mirror') {
      const mirrorSection = content.mirrorSections?.[section.key];
      if (mirrorSection) {
        renderMirrorTriadSection(doc, section.title, mirrorSection, markActive, ensureSpace, setIsDrawing);
      }
    } else {
      const sectionParagraphs = (content.sections?.[section.key] || [content[section.fallback]]);
      if (!sectionParagraphs || sectionParagraphs.length === 0 || !sectionParagraphs[0]) return;
      renderExecutiveSectionWithRules(doc, section.title, sectionParagraphs, markActive, ensureSpace, setIsDrawing);
    }
  });

  // 6. APPENDIX
  if (includeEvidence) {
    const evidenceSource = (content as any).evidenceSections || content.sections;
    if (evidenceSource) {
      const hasAnyEvidence = Object.values(evidenceSource).some((v: any) => v && v.length > 0);
      if (hasAnyEvidence) {
        // Atomic header for Appendix
        ensureSpace(120);
        setIsDrawing(true);
        markActive();
        doc.font('Helvetica-Bold').fontSize(18).fillColor('#1E293B').text('Appendix: Observations & Evidence');
        doc.moveDown(1);
        doc.font('Helvetica').fontSize(10).fillColor('#64748B').text('The following signals serve as the factual substrate for the primary narrative.', { width: 512 });
        doc.moveDown(2);

        sections.forEach(s => {
          const evidence = evidenceSource[s.key];
          if (evidence && evidence.length > 0) {
            ensureSpace(80);
            renderSupportingContext(doc, evidence, markActive, ensureSpace, setIsDrawing);
            doc.moveDown(1.5);
          }
        });
        setIsDrawing(false);
      }
    }
  }

  // Final metadata
  (doc as any)._pagesWithContent = pagesWithContent;
  const finalRange = doc.bufferedPageRange();
  console.log(`[PDF_PAGES] Render complete. totalPages=${finalRange.count} activePages=${pagesWithContent.size}`);
}

// ============================================================================
// DIAGNOSTIC_RAW CONTRACT (ORIGINAL)
// ============================================================================

function renderDiagnosticRawContract(doc: PDFKit.PDFDocument, brief: any, tenantName: string) {
  const synthesis = brief.synthesis;

  // -- HEADER --
  doc
    .fillColor('#000000')
    .font('Helvetica-Bold')
    .fontSize(24)
    .text('Executive Brief', { align: 'center' });

  doc.moveDown(0.5);
  doc
    .fillColor('#666666')
    .font('Helvetica')
    .fontSize(14)
    .text(`Leadership Perspective for ${tenantName}`, { align: 'center' });

  doc.moveDown(0.5);
  doc
    .fillColor('#999999')
    .font('Helvetica')
    .fontSize(10)
    .text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });

  doc.moveDown(2);

  if (synthesis.executiveSummary) {
    addLegacySection(doc, 'Executive Summary', synthesis.executiveSummary);
  }

  if (synthesis.constraintLandscape) {
    doc.addPage();
    addLegacySection(doc, 'Constraint Landscape', synthesis.constraintLandscape);
  }

  if (synthesis.blindSpotRisks) {
    doc.addPage();
    addLegacySection(doc, 'Blind Spot Risks', synthesis.blindSpotRisks);
  }

  if (synthesis.operatingReality) {
    doc.addPage();
    addLegacySection(doc, 'Operating Reality', synthesis.operatingReality);
  }
}

// ============================================================================
// LAYOUT PRIMITIVES
// ============================================================================

function renderHeaderBand(doc: PDFKit.PDFDocument, tenantName: string) {
  const startY = doc.y;

  // Subtle accent line
  doc.moveTo(50, startY).lineTo(562, startY).lineWidth(1).strokeColor('#E2E8F0').stroke();

  doc.moveDown(0.5);
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#64748B').text('EXECUTIVE LEADERSHIP BRIEF', { continued: true });
  doc.font('Helvetica').text(`  |  ${tenantName.toUpperCase()}`, { continued: true, align: 'left' });
  doc.text(`  |  ${new Date().toLocaleDateString()}`, { align: 'right' });

  doc.fontSize(8).fillColor('#94A3B8').text('CONFIDENTIAL — LEADERSHIP ONLY', { align: 'right' });
}

// EXEC-BRIEF-PDF-MIRROR-PRESENTATION-025: Footer uses artifactCreatedAt for date consistency
function renderFooter(
  doc: PDFKit.PDFDocument,
  current: number,
  total: number,
  tenantName: string,
  artifactCreatedAt?: Date
) {
  const dateObj = artifactCreatedAt || new Date();
  const date = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const footerText = `${tenantName} | ${date} | Page ${current}`;

  doc.fontSize(8).fillColor('#94A3B8')
    .text(footerText, 50, 730, {
      align: 'center',
      width: 512
    });
}

function renderOrientation(doc: PDFKit.PDFDocument) {
  doc.font('Helvetica-Bold').fontSize(14).fillColor('#0F172A').text('Strategic Orientation');
  doc.moveDown(0.5);

  const leftX = 50;
  const midX = 300;
  const width = 240;

  // WHAT THIS IS
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#1E293B').text('WHAT THIS IS', leftX);
  doc.font('Helvetica').fontSize(9).fillColor('#475569');
  ['Interpreted Leadership Lens', 'Strategic Bottleneck Identification', 'Decision Support Framework'].forEach(bullet => {
    doc.text(`• ${bullet}`, leftX + 10, undefined, { width: width - 10 });
  });

  // WHAT THIS IS NOT
  const saveY = doc.y;
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#1E293B').text('WHAT THIS IS NOT', midX, saveY - (doc.currentLineHeight() * 4));
  doc.font('Helvetica').fontSize(9).fillColor('#475569');
  ['Verbatim Interview Logs', 'Technical Specification', 'Public Consumption Report'].forEach(bullet => {
    doc.text(`• ${bullet}`, midX + 10, undefined, { width: width - 10 });
  });

  doc.y = Math.max(doc.y, saveY) + 10;
}

function renderSignalSummary(doc: PDFKit.PDFDocument, signals: any) {
  doc.font('Helvetica-Bold').fontSize(14).fillColor('#0F172A').text('Executive Signal Summary');
  doc.moveDown(0.5);

  const startX = 50;
  const startY = doc.y;
  const boxWidth = 160;
  const boxHeight = 60;

  const renderBox = (label: string, value: string, x: number) => {
    doc.rect(x, startY, boxWidth, boxHeight).fill('#F8FAFC');
    doc.fillColor('#64748B').font('Helvetica-Bold').fontSize(8).text(label.toUpperCase(), x + 10, startY + 15);

    // Band coloring
    let color = '#0F172A';
    if (value === 'HIGH') color = '#059669';
    if (value === 'LOW') color = '#DC2626';

    doc.fillColor(color).font('Helvetica-Bold').fontSize(14).text(value, x + 10, startY + 30);
  };

  renderBox('Constraint Consensus', signals?.constraintConsensusLevel || 'MEDIUM', startX);
  renderBox('Execution Risk', signals?.executionRiskLevel || 'MEDIUM', startX + boxWidth + 10);

  const clarity = signals?.orgClarityScore ?? 50;
  const clarityLabel = clarity > 70 ? 'HIGH' : clarity > 40 ? 'MEDIUM' : 'LOW';
  renderBox('Org Clarity', `${clarityLabel} (${clarity}%)`, startX + (boxWidth * 2) + 20);

  doc.y = startY + boxHeight + 20;

  // Primary Bottleneck (One liner)
  doc.fillColor('#475569').font('Helvetica').fontSize(10).text('Primary Bottleneck Theme: ', { continued: true });
  doc.fillColor('#0F172A').font('Helvetica-Bold').text('Operational Alignment & Scale Dependency');
}

function renderExecutiveSection(doc: PDFKit.PDFDocument, title: string, content: string, maxParagraphs: number) {
  doc.font('Helvetica-Bold').fontSize(14).fillColor('#0F172A').text(title);
  doc.moveDown(0.5);

  doc.font('Helvetica').fontSize(11).fillColor('#334155').lineGap(4);

  const cleanContent = stripAttribution(content);
  const paragraphs = cleanContent.split('\n').filter(p => p.trim().length > 0).slice(0, maxParagraphs);

  paragraphs.forEach(p => {
    doc.text(p, { align: 'justify', width: 512 });
    doc.moveDown(0.5);
  });
}

/**
 * PDF MARKUP PASS: Render section with presentation rules
 * - Applies suppressions (meta-language removal)
 * - Applies repetition mitigation
 * - Uses clean typography (Title Case, proper spacing)
 */
function renderExecutiveSectionWithRules(
  doc: PDFKit.PDFDocument,
  title: string,
  paragraphs: string | string[],
  markActive: () => void,
  ensureSpace: (height: number, reason?: string) => boolean,
  setIsDrawing: (val: boolean) => void
) {
  // Normalize paragraphs
  let paragraphArray: string[];
  if (typeof paragraphs === 'string') {
    paragraphArray = normalizeParagraphs(paragraphs);
  } else {
    paragraphArray = paragraphs.flatMap(p => normalizeParagraphs(p));
  }

  // Apply suppressions
  paragraphArray = paragraphArray.map(p => stripPdfSuppressedMeta(stripAttribution(p)));
  if (paragraphArray.length === 0) return;

  // Apply repetition mitigation
  paragraphArray = mitigateRepetition(paragraphArray);

  // ATOMIC HEADER + FIRST PARAGRAPH (Rule 3)
  const headerHeight = 40;
  const firstParaHeight = doc.heightOfString(paragraphArray[0], { width: PDF_TYPOGRAPHY.body.maxLineWidth }) + 20;

  // Widow/orphan check (ticket PATCH 4)
  const remainingSpace = 710 - doc.y;
  if (keepWithNext(4, 15, remainingSpace)) {
    ensureSpace(headerHeight + firstParaHeight, `head_orphan_${title}`);
  } else {
    ensureSpace(headerHeight + firstParaHeight, `head_fit_${title}`);
  }

  // Render title
  setIsDrawing(true);
  markActive();
  doc.font(PDF_TYPOGRAPHY.title.font)
    .fontSize(PDF_TYPOGRAPHY.title.size)
    .fillColor(PDF_TYPOGRAPHY.title.color)
    .text(title);

  doc.moveDown(PDF_TYPOGRAPHY.title.marginBottom);

  // Render paragraphs
  doc.font(PDF_TYPOGRAPHY.body.font)
    .fontSize(PDF_TYPOGRAPHY.body.size)
    .fillColor(PDF_TYPOGRAPHY.body.color)
    .lineGap(PDF_TYPOGRAPHY.body.lineHeight * PDF_TYPOGRAPHY.body.size - PDF_TYPOGRAPHY.body.size);

  paragraphArray.forEach((p, idx) => {
    if (p.trim().length === 0) return;

    markActive();
    doc.text(p.trim(), {
      align: 'left',
      width: PDF_TYPOGRAPHY.body.maxLineWidth
    });

    // Paragraph spacing (1.1-1.3em)
    if (idx < paragraphArray.length - 1) {
      doc.moveDown(PDF_TYPOGRAPHY.body.paragraphSpacing);
    }
  });
  setIsDrawing(false);
}

/**
 * Renders Mirror Narrative as structured triad blocks:
 * 1. Lived Reality
 * 2. Cost of Status Quo
 * 3. The Call
 */
function renderMirrorTriadSection(
  doc: PDFKit.PDFDocument,
  title: string,
  section: { livedReality: string; costOfStatusQuo: string; theCall: string },
  markActive: () => void,
  ensureSpace: (height: number, reason?: string) => boolean,
  setIsDrawing: (val: boolean) => void
) {
  doc.moveDown(1.5);
  // ATOMIC SECTION HEADER (Rule 3)
  ensureSpace(80);

  // Section Heading
  setIsDrawing(true);
  markActive();
  doc.font(PDF_TYPOGRAPHY.title.font)
    .fontSize(PDF_TYPOGRAPHY.title.size)
    .fillColor(PDF_TYPOGRAPHY.title.color)
    .text(title);

  doc.moveDown(0.8);

  const renderTriadBlock = (label: string, text: string) => {
    if (!text || text.trim().length === 0) return;

    ensureSpace(60, `triad_label_${label}`);
    markActive();

    // Block Label
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#64748B').text(label.toUpperCase(), { characterSpacing: 1 });
    doc.moveDown(0.4);

    // Block Content
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
    paragraphs.forEach((p, idx) => {
      ensureSpace(40, `triad_para_${label}_${idx}`);
      markActive();
      doc.font(PDF_TYPOGRAPHY.body.font)
        .fontSize(PDF_TYPOGRAPHY.body.size)
        .fillColor(PDF_TYPOGRAPHY.body.color)
        .lineGap(PDF_TYPOGRAPHY.body.lineHeight * PDF_TYPOGRAPHY.body.size - PDF_TYPOGRAPHY.body.size)
        .text(p.trim(), {
          align: 'left',
          width: PDF_TYPOGRAPHY.body.maxLineWidth
        });

      if (idx < paragraphs.length - 1) {
        doc.moveDown(PDF_TYPOGRAPHY.body.paragraphSpacing);
      }
    });

    doc.moveDown(1.2);
  };

  renderTriadBlock('Lived Reality', section.livedReality);
  renderTriadBlock('Cost of Status Quo', section.costOfStatusQuo);
  renderTriadBlock('The Call', section.theCall);
  setIsDrawing(false);
}

/**
 * Renders original facts/evidence as a secondary layer
 */
function renderSupportingContext(
  doc: PDFKit.PDFDocument,
  evidence: string[],
  markActive: () => void,
  ensureSpace: (height: number, reason?: string) => boolean,
  setIsDrawing: (val: boolean) => void
) {
  ensureSpace(40, 'supporting_context_header');
  setIsDrawing(true);
  markActive(); // Ensure page is active before writing appendix content
  doc.font('Helvetica-BoldOblique').fontSize(9).fillColor('#64748B')
    .text('OBSERVATIONS & EVIDENCE', { characterSpacing: 0.5 });

  doc.moveDown(0.4);

  evidence.forEach((item, idx) => {
    ensureSpace(30, `supporting_context_item_${idx}`);
    markActive();
    // Render each evidence point in a muted, smaller font
    doc.font('Helvetica').fontSize(8.5).fillColor('#94A3B8').text(`• ${item}`, {
      width: PDF_TYPOGRAPHY.body.maxLineWidth - 20,
      align: 'left'
    });

    if (idx < evidence.length - 1) {
      doc.moveDown(0.3);
    }
  });
  setIsDrawing(false);
}

function renderExecutiveListSection(doc: PDFKit.PDFDocument, title: string, content: string, maxItems: number, placeholder: string) {
  doc.font('Helvetica-Bold').fontSize(14).fillColor('#0F172A').text(title);
  doc.fontSize(8).fillColor('#94A3B8').text(placeholder);
  doc.moveDown(0.5);

  const items = content.split('\n')
    .filter(line => line.trim().length > 0 && !line.trim().startsWith('**')) // Strip headers
    .map(line => line.replace(/^[•\-\*]/, '').trim()) // Strip bullet chars
    .slice(0, maxItems);

  items.forEach(item => {
    const segments = item.split(/[.!?]/).filter(s => s.trim().length > 0);

    doc.rect(50, doc.y, 512, 1).fill('#F1F5F9');
    doc.moveDown(0.5);

    if (segments.length >= 2) {
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#1E293B').text(`• ${segments[0].trim()}`);
      doc.font('Helvetica').fontSize(9).fillColor('#64748B').text(`   ${segments.slice(1).join('.').trim().substring(0, 150)}...`);
    } else {
      doc.font('Helvetica').fontSize(10).fillColor('#1E293B').text(`• ${item.substring(0, 200)}`);
    }
    doc.moveDown(0.5);
  });
}

function stripAttribution(text: string): string {
  // Strip **Role:** prefixes and standard markdown bolding
  return text
    .replace(/\*\*(.*?)\*\*[:\s]*/g, '')
    .replace(/\*/g, '')
    .trim();
}

// LEGACY SECTION (For DIAGNOSTIC_RAW)
function addLegacySection(doc: PDFKit.PDFDocument, title: string, content: string) {
  doc
    .fillColor('#000000')
    .font('Helvetica-Bold')
    .fontSize(16)
    .text(title, { underline: true });

  doc.moveDown(1);
  const lines = content.split('\n');

  doc
    .fillColor('#000000')
    .font('Helvetica')
    .fontSize(11)
    .lineGap(4);

  for (const line of lines) {
    if (line.trim().startsWith('**')) {
      const roleMatch = line.match(/\*\*(.*?)\*\*:?/);
      if (roleMatch) {
        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').text(roleMatch[1] + ':');
        const remainder = line.substring(roleMatch[0].length).trim();
        if (remainder) {
          doc.font('Helvetica').text(remainder.replace(/\*\*/g, ''));
        }
      } else {
        doc.font('Helvetica').text(line.replace(/\*\*/g, ''));
      }
    } else if (line.trim() === '') {
      doc.moveDown(0.5);
    } else {
      doc.font('Helvetica').text(line.replace(/\*\*/g, ''));
    }
  }
  doc.moveDown(1);
}
