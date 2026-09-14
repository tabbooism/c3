'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, FileText, Download, CheckCircle, ShieldAlert, Sliders, User, Lock, Check } from 'lucide-react';
import { Engagement, Finding } from '../types';
import { generateFindingsPDFReport } from '../lib/pdfReportGenerator';

interface ExportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  engagement: Engagement;
  allEngagements: Engagement[];
  findings: Finding[];
  isAdminMode: boolean;
}

export default function ExportPdfModal({
  isOpen,
  onClose,
  engagement,
  allEngagements,
  findings,
  isAdminMode
}: ExportPdfModalProps) {
  const [selectedEngagementId, setSelectedEngagementId] = useState(engagement.id);
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [includeExecutiveSummary, setIncludeExecutiveSummary] = useState(true);
  const [includeTechnicalEvidence, setIncludeTechnicalEvidence] = useState(true);
  const [includeRemediationRoadmap, setIncludeRemediationRoadmap] = useState(true);
  const [classification, setClassification] = useState<string>(engagement.securityClass || 'Confidential');
  const [leadAuditor, setLeadAuditor] = useState('Senior SecOps Red-Team Lead (Operator ID: OP-9042)');
  const [isExporting, setIsExporting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Selected target object
  const activeEngagement = allEngagements.find(e => e.id === selectedEngagementId) || engagement;

  // Filtered findings based on modal choices
  const relevantFindings = findings.filter(f => {
    const matchesEng = selectedEngagementId === 'ALL' ? true : f.engagementId === selectedEngagementId;
    const matchesSev = severityFilter === 'all' ? true : f.severity === severityFilter;
    return matchesEng && matchesSev;
  });

  const handleExport = () => {
    setIsExporting(true);
    setDownloadSuccess(false);

    try {
      const doc = generateFindingsPDFReport({
        engagement: selectedEngagementId === 'ALL' ? undefined : activeEngagement,
        findings: relevantFindings.length > 0 ? relevantFindings : findings,
        includeExecutiveSummary,
        includeTechnicalEvidence,
        includeRemediationRoadmap,
        classification,
        leadAuditor
      });

      const safeClientName = (activeEngagement.clientName || 'Security_Audit')
        .replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `HELIX_Security_Report_${safeClientName}_${new Date().toISOString().substring(0, 10)}.pdf`;

      doc.save(filename);
      setDownloadSuccess(true);
      setTimeout(() => {
        setDownloadSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error generating PDF report:', err);
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-[#0c0c0e] border border-red-900/50 rounded-2xl w-full max-w-2xl overflow-hidden shadow-[0_0_50px_rgba(220,38,38,0.25)] flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-zinc-850 bg-gradient-to-r from-red-950/40 via-black to-zinc-950">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-950/80 border border-red-600/60 rounded-xl text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-100 font-mono tracking-wide flex items-center gap-2">
                  EXPORT FINDINGS VAULT PDF REPORT
                  <span className="px-2 py-0.5 bg-red-950 text-red-400 border border-red-800 rounded text-[10px]">
                    jsPDF Engine
                  </span>
                </h3>
                <p className="text-xs text-zinc-400 font-mono">
                  Generate an enterprise-grade penetration testing audit document
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Options */}
          <div className="p-5 overflow-y-auto space-y-5 font-mono text-xs text-zinc-300">
            
            {/* Target Scope Selection */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
                Target Engagement Scope
              </label>
              <select
                value={selectedEngagementId}
                onChange={(e) => setSelectedEngagementId(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-red-500"
              >
                <option value="ALL">All Engagements / Global Vault ({findings.length} findings)</option>
                {allEngagements.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.id} — {e.clientName} ({findings.filter(f => f.engagementId === e.id).length} findings)
                  </option>
                ))}
              </select>
            </div>

            {/* Severity Filter & Classification */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-red-500" />
                  Severity Scope Filter
                </label>
                <select
                  value={severityFilter}
                  onChange={(e: any) => setSeverityFilter(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-red-500 capitalize"
                >
                  <option value="all">All Severities (Critical, High, Med, Low)</option>
                  <option value="critical">Critical Only</option>
                  <option value="high">High Severity Only</option>
                  <option value="medium">Medium Severity Only</option>
                  <option value="low">Low Severity Only</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-red-500" />
                  Security Classification
                </label>
                <select
                  value={classification}
                  onChange={(e) => setClassification(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-red-500"
                >
                  <option value="Top Secret">Top Secret / Red-Team Authorized</option>
                  <option value="Secret">Secret / Restricted Distribution</option>
                  <option value="Confidential">Confidential / Client Proprietary</option>
                  <option value="Internal">Internal SecOps Only</option>
                </select>
              </div>
            </div>

            {/* Lead Auditor Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-red-500" />
                Lead SecOps Auditor / Signature Line
              </label>
              <input
                type="text"
                value={leadAuditor}
                onChange={(e) => setLeadAuditor(e.target.value)}
                placeholder="Auditor Name and Operator ID..."
                className="w-full bg-black border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-red-500 text-xs"
              />
            </div>

            {/* Report Modules Checkboxes */}
            <div className="space-y-2 pt-2 border-t border-zinc-850">
              <span className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider block">
                Include Report Sections
              </span>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <label className="flex items-center gap-2 p-2.5 bg-black border border-zinc-800 rounded-lg cursor-pointer hover:border-zinc-700 transition-colors">
                  <input
                    type="checkbox"
                    checked={includeExecutiveSummary}
                    onChange={(e) => setIncludeExecutiveSummary(e.target.checked)}
                    className="accent-red-600 rounded"
                  />
                  <span className="text-[11px] text-zinc-300">Executive Scorecard</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 bg-black border border-zinc-800 rounded-lg cursor-pointer hover:border-zinc-700 transition-colors">
                  <input
                    type="checkbox"
                    checked={includeTechnicalEvidence}
                    onChange={(e) => setIncludeTechnicalEvidence(e.target.checked)}
                    className="accent-red-600 rounded"
                  />
                  <span className="text-[11px] text-zinc-300">Technical PoC / Evidence</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 bg-black border border-zinc-800 rounded-lg cursor-pointer hover:border-zinc-700 transition-colors">
                  <input
                    type="checkbox"
                    checked={includeRemediationRoadmap}
                    onChange={(e) => setIncludeRemediationRoadmap(e.target.checked)}
                    className="accent-red-600 rounded"
                  />
                  <span className="text-[11px] text-zinc-300">Remediation Blueprint</span>
                </label>
              </div>
            </div>

            {/* Document Statistics Preview Card */}
            <div className="p-3.5 bg-red-950/20 border border-red-900/40 rounded-xl flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="text-zinc-400 text-[11px]">Findings to Include:</span>
                <div className="text-zinc-100 font-bold text-sm">
                  {relevantFindings.length > 0 ? relevantFindings.length : findings.length} Vulnerabilities Selected
                </div>
              </div>
              <div className="text-right space-y-0.5">
                <span className="text-zinc-400 text-[11px]">Format / Layout:</span>
                <div className="text-red-400 font-bold">
                  A4 Structured Vector PDF
                </div>
              </div>
            </div>

          </div>

          {/* Footer Action Buttons */}
          <div className="p-5 border-t border-zinc-850 bg-[#08080a] flex items-center justify-between gap-3">
            <button
              onClick={onClose}
              disabled={isExporting}
              className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-lg font-mono text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              onClick={handleExport}
              disabled={isExporting}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-mono font-bold text-xs rounded-lg flex items-center gap-2 shadow-[0_0_20px_rgba(220,38,38,0.5)] disabled:opacity-50 transition-all cursor-pointer"
            >
              {downloadSuccess ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  PDF GENERATED & SAVED!
                </>
              ) : (
                <>
                  <Download className={`w-4 h-4 ${isExporting ? 'animate-bounce' : ''}`} />
                  {isExporting ? 'COMPILING VECTOR PDF...' : 'GENERATE & DOWNLOAD REPORT'}
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
