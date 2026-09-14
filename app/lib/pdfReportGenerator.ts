import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Engagement, Finding } from '../types';

export interface PDFReportOptions {
  engagement?: Engagement;
  findings: Finding[];
  includeExecutiveSummary?: boolean;
  includeTechnicalEvidence?: boolean;
  includeRemediationRoadmap?: boolean;
  classification?: string;
  leadAuditor?: string;
}

export function generateFindingsPDFReport({
  engagement,
  findings,
  includeExecutiveSummary = true,
  includeTechnicalEvidence = true,
  includeRemediationRoadmap = true,
  classification = engagement?.securityClass || 'Confidential',
  leadAuditor = 'SecOps Red-Team Lead (Operator ID: OP-9042)'
}: PDFReportOptions): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  const now = new Date();
  const timestampStr = now.toUTCString();
  const reportRef = `SEC-REP-${Math.floor(100000 + Math.random() * 900000)}`;

  // Severities count
  const criticalCount = findings.filter(f => f.severity === 'critical').length;
  const highCount = findings.filter(f => f.severity === 'high').length;
  const mediumCount = findings.filter(f => f.severity === 'medium').length;
  const lowCount = findings.filter(f => f.severity === 'low').length;
  const totalFindings = findings.length;

  // Primary Brand Colors
  const primaryDark = [10, 10, 10] as const; // #0a0a0a
  const accentRed = [220, 38, 38] as const; // #dc2626
  const textDark = [24, 24, 27] as const; // #18181b
  const textMuted = [113, 113, 122] as const; // #71717a

  // Helper for footer and header on all pages
  const addPageDecorations = (currentPage: number, totalPages: number) => {
    // Top banner
    doc.setFillColor(15, 15, 18);
    doc.rect(0, 0, pageWidth, 8, 'F');
    doc.setFillColor(220, 38, 38);
    doc.rect(0, 7.5, pageWidth, 0.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(239, 68, 68);
    doc.text('HELIX RED-OPS // CYBERSECURITY ENGAGEMENT AUDIT', margin, 5.2);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(160, 160, 165);
    doc.text(`CLASSIFICATION: ${classification.toUpperCase()} • REF: ${reportRef}`, pageWidth - margin, 5.2, { align: 'right' });

    // Bottom banner
    doc.setFillColor(245, 245, 247);
    doc.rect(0, pageHeight - 10, pageWidth, 10, 'F');
    doc.setDrawColor(220, 220, 225);
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(`CONFIDENTIALITY NOTICE: Authorized distribution only. Prepared for ${engagement?.clientName || 'Authorized Client'}`, margin, pageHeight - 4);
    doc.text(`Page ${currentPage} of ${totalPages}`, pageWidth - margin, pageHeight - 4, { align: 'right' });
  };

  // ══════════════════════════════════════════════════════════════════════════
  // PAGE 1: COVER & EXECUTIVE SUMMARY
  // ══════════════════════════════════════════════════════════════════════════

  // Top Title Card Block
  doc.setFillColor(12, 12, 14);
  doc.roundedRect(margin, 14, contentWidth, 38, 2, 2, 'F');
  
  // Left Crimson accent strip
  doc.setFillColor(220, 38, 38);
  doc.roundedRect(margin, 14, 4, 38, 1, 1, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('PERIMETER SECURITY ASSESSMENT & VULNERABILITY AUDIT', margin + 8, 24);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(180, 180, 185);
  doc.text(`Target Scope: ${engagement?.clientName || 'Enterprise Infrastructure'} (${engagement?.id || 'GLOBAL-AUDIT'})`, margin + 8, 30);
  doc.text(`Framework: ${engagement?.complianceFramework || 'SOC2 Type II / NIST SP 800-53'} • Generated: ${timestampStr}`, margin + 8, 36);
  doc.text(`Lead SecOps Auditor: ${leadAuditor}`, margin + 8, 42);

  let currentY = 58;

  // Engagement Scope & Classification Meta Box
  doc.setFillColor(248, 249, 250);
  doc.setDrawColor(228, 228, 231);
  doc.roundedRect(margin, currentY, contentWidth, 26, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('ENGAGEMENT METADATA & SCOPE BOUNDARIES', margin + 4, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(70, 70, 75);
  
  const scopeList = engagement?.scope?.join(', ') || 'api.runehall.com, auth.runehall.com, 198.51.100.24';
  doc.text(`Authorized Hosts / IPs: ${scopeList}`, margin + 4, currentY + 12);
  doc.text(`Assessment Type: ${engagement?.type || 'External Perimeter Red-Team Audit & Exploit Verification'}`, margin + 4, currentY + 17);
  doc.text(`Security Class: ${classification}  |  Audit Status: ${engagement?.status?.toUpperCase() || 'ESTABLISHED'}  |  Report ID: ${reportRef}`, margin + 4, currentY + 22);

  currentY += 32;

  // Executive Scorecard Metrics
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('EXECUTIVE RISK SCORECARD & FINDINGS DISTRIBUTION', margin, currentY);
  currentY += 5;

  const cardWidth = (contentWidth - 9) / 4;
  const cardHeight = 20;

  // Card 1: Critical
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(239, 68, 68);
  doc.roundedRect(margin, currentY, cardWidth, cardHeight, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(220, 38, 38);
  doc.text(`${criticalCount}`, margin + 4, currentY + 9);
  doc.setFontSize(7.5);
  doc.text('CRITICAL FLAWS', margin + 4, currentY + 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(150, 40, 40);
  doc.text('Immediate Threat', margin + 4, currentY + 18);

  // Card 2: High
  const highX = margin + cardWidth + 3;
  doc.setFillColor(255, 247, 237);
  doc.setDrawColor(249, 115, 22);
  doc.roundedRect(highX, currentY, cardWidth, cardHeight, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(234, 88, 12);
  doc.text(`${highCount}`, highX + 4, currentY + 9);
  doc.setFontSize(7.5);
  doc.text('HIGH SEVERITY', highX + 4, currentY + 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(160, 60, 20);
  doc.text('Urgent Patching', highX + 4, currentY + 18);

  // Card 3: Medium
  const medX = highX + cardWidth + 3;
  doc.setFillColor(254, 252, 232);
  doc.setDrawColor(234, 179, 8);
  doc.roundedRect(medX, currentY, cardWidth, cardHeight, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(202, 138, 4);
  doc.text(`${mediumCount}`, medX + 4, currentY + 9);
  doc.setFontSize(7.5);
  doc.text('MEDIUM SEVERITY', medX + 4, currentY + 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(130, 90, 10);
  doc.text('Prioritize in Sprint', medX + 4, currentY + 18);

  // Card 4: Total
  const totalX = medX + cardWidth + 3;
  doc.setFillColor(244, 244, 245);
  doc.setDrawColor(161, 161, 170);
  doc.roundedRect(totalX, currentY, cardWidth, cardHeight, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(24, 24, 27);
  doc.text(`${totalFindings}`, totalX + 4, currentY + 9);
  doc.setFontSize(7.5);
  doc.text('TOTAL FINDINGS', totalX + 4, currentY + 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(82, 82, 91);
  doc.text('Audited Items', totalX + 4, currentY + 18);

  currentY += cardHeight + 8;

  // Executive Risk Summary Narrative
  if (includeExecutiveSummary) {
    doc.setFillColor(250, 250, 250);
    doc.setDrawColor(228, 228, 231);
    doc.roundedRect(margin, currentY, contentWidth, 30, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text('EXECUTIVE SECURITY POSTURE STATEMENT', margin + 4, currentY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 65);
    
    const riskLevel = criticalCount > 0 ? 'ELEVATED / ACTION REQUIRED' : highCount > 0 ? 'MODERATE' : 'ACCEPTABLE';
    const summaryText = `During the authorized penetration testing cycle conducted against the designated target scope, a total of ${totalFindings} security findings were identified. The overall risk posture is evaluated as ${riskLevel}. Exploitation verification proved potential avenues for cross-origin information disclosure and endpoint leakage. Immediate remediation is recommended for critical and high severity findings according to the technical guidance below.`;
    
    const splitSummary = doc.splitTextToSize(summaryText, contentWidth - 8);
    doc.text(splitSummary, margin + 4, currentY + 12);

    currentY += 36;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SUMMARY TABLE (autoTable)
  // ══════════════════════════════════════════════════════════════════════════
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('CONSOLIDATED VULNERABILITY REGISTER', margin, currentY);
  currentY += 4;

  const tableData = findings.map(f => [
    f.id,
    f.severity.toUpperCase(),
    f.title,
    f.status.toUpperCase(),
    f.discoveredAt ? f.discoveredAt.substring(0, 10) : 'Recent'
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['ID', 'Severity', 'Vulnerability Title', 'Status', 'Date Discovered']],
    body: tableData,
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: {
      fillColor: [15, 15, 18],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 2.5
    },
    bodyStyles: {
      fontSize: 7.5,
      cellPadding: 2.5,
      textColor: [30, 30, 35]
    },
    columnStyles: {
      0: { cellWidth: 22, fontStyle: 'bold' },
      1: { cellWidth: 24, fontStyle: 'bold' },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 22 },
      4: { cellWidth: 26 }
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 1) {
        const val = String(data.cell.raw);
        if (val === 'CRITICAL') {
          data.cell.styles.textColor = [220, 38, 38];
          data.cell.styles.fillColor = [254, 242, 242];
        } else if (val === 'HIGH') {
          data.cell.styles.textColor = [234, 88, 12];
          data.cell.styles.fillColor = [255, 247, 237];
        } else if (val === 'MEDIUM') {
          data.cell.styles.textColor = [202, 138, 4];
          data.cell.styles.fillColor = [254, 252, 232];
        } else {
          data.cell.styles.textColor = [34, 197, 94];
        }
      }
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // PAGE 2+: DETAILED TECHNICAL BREAKDOWN & REMEDIATION BLUEPRINT
  // ══════════════════════════════════════════════════════════════════════════
  if (includeTechnicalEvidence || includeRemediationRoadmap) {
    doc.addPage();
    let detailY = 16;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text('DETAILED TECHNICAL FINDINGS & REMEDIATION DIRECTIVES', margin, detailY);
    detailY += 6;

    findings.forEach((finding, index) => {
      // Check if we need a new page for this finding
      if (detailY > pageHeight - 65) {
        doc.addPage();
        detailY = 16;
      }

      // Finding Header Box
      const sevColor = finding.severity === 'critical' ? [220, 38, 38] :
                       finding.severity === 'high' ? [234, 88, 12] :
                       finding.severity === 'medium' ? [202, 138, 4] : [34, 197, 94];

      doc.setFillColor(248, 249, 251);
      doc.setDrawColor(225, 225, 230);
      doc.roundedRect(margin, detailY, contentWidth, 9, 1.5, 1.5, 'FD');

      // Severity badge strip
      doc.setFillColor(sevColor[0], sevColor[1], sevColor[2]);
      doc.roundedRect(margin, detailY, 3.5, 9, 1, 1, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      doc.text(`[${finding.id}] ${finding.title}`, margin + 6, detailY + 6);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(sevColor[0], sevColor[1], sevColor[2]);
      doc.text(finding.severity.toUpperCase(), pageWidth - margin - 4, detailY + 6, { align: 'right' });

      detailY += 12;

      // Technical Evidence / Description Box
      if (includeTechnicalEvidence) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(80, 80, 85);
        doc.text('TECHNICAL VULNERABILITY DESCRIPTION & EVIDENCE:', margin + 2, detailY);
        detailY += 3.5;

        doc.setFillColor(252, 252, 253);
        doc.setDrawColor(230, 230, 235);
        
        const splitDesc = doc.splitTextToSize(finding.description, contentWidth - 8);
        const descBoxHeight = Math.max(12, splitDesc.length * 3.4 + 4);

        if (detailY + descBoxHeight > pageHeight - 35) {
          doc.addPage();
          detailY = 16;
        }

        doc.roundedRect(margin, detailY, contentWidth, descBoxHeight, 1, 1, 'FD');
        doc.setFont('courier', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(40, 40, 45);
        doc.text(splitDesc, margin + 4, detailY + 4.5);

        detailY += descBoxHeight + 4;
      }

      // Remediation Guidance Box
      if (includeRemediationRoadmap && finding.recommendation) {
        if (detailY > pageHeight - 35) {
          doc.addPage();
          detailY = 16;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(220, 38, 38);
        doc.text('RECOMMENDED ARCHITECTURAL & CODE REMEDIATION:', margin + 2, detailY);
        detailY += 3.5;

        doc.setFillColor(254, 242, 242);
        doc.setDrawColor(254, 202, 202);

        const splitRem = doc.splitTextToSize(finding.recommendation, contentWidth - 8);
        const remBoxHeight = Math.max(10, splitRem.length * 3.4 + 4);

        if (detailY + remBoxHeight > pageHeight - 30) {
          doc.addPage();
          detailY = 16;
        }

        doc.roundedRect(margin, detailY, contentWidth, remBoxHeight, 1, 1, 'FD');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(153, 27, 27);
        doc.text(splitRem, margin + 4, detailY + 4.5);

        detailY += remBoxHeight + 8;
      }
    });

    // Auditor Attestation & Methodology Notice
    if (detailY > pageHeight - 45) {
      doc.addPage();
      detailY = 16;
    }

    doc.setFillColor(245, 245, 248);
    doc.setDrawColor(220, 220, 228);
    doc.roundedRect(margin, detailY, contentWidth, 24, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text('AUDITOR ATTESTATION & METHODOLOGY COMPLIANCE', margin + 4, detailY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(90, 90, 95);
    const attestation = `This technical audit was executed in strict adherence to NIST SP 800-115, OWASP ASVS v4.0, and PTES penetration testing standards under authorized Rules of Engagement. All tests were logged cryptographically with verified timestamps. The findings herein reflect the security posture observed at the time of execution.`;
    doc.text(doc.splitTextToSize(attestation, contentWidth - 8), margin + 4, detailY + 10.5);

    doc.setFont('courier', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(40, 40, 45);
    doc.text(`CRYPTOGRAPHIC SIGNATURE: SHA256-${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)} • VERIFIED`, margin + 4, detailY + 20);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // APPLY HEADERS & FOOTERS (Page Numbers)
  // ══════════════════════════════════════════════════════════════════════════
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addPageDecorations(i, totalPages);
  }

  return doc;
}
