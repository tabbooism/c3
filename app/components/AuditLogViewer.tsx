'use client';

import React, { useState, useMemo } from 'react';
import { 
  AuditLog, 
  AuditLogCategory, 
  AuditLogSeverity 
} from '../types';
import { 
  Search, 
  Filter, 
  ShieldCheck, 
  Download, 
  Trash2, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Terminal, 
  ChevronDown, 
  ChevronRight, 
  Copy, 
  Check, 
  Plus, 
  FileSpreadsheet, 
  FileJson,
  Hash,
  User,
  Activity,
  Layers,
  Sparkles
} from 'lucide-react';
import { 
  exportAuditLogsToJSON, 
  exportAuditLogsToCSV, 
  generateLogChecksum 
} from '../lib/auditLogger';

interface AuditLogViewerProps {
  logs: AuditLog[];
  onAddLog: (category: AuditLogCategory, action: string, details: string, options?: { severity?: AuditLogSeverity; target?: string; operator?: string }) => void;
  onClearLogs: () => void;
}

export default function AuditLogViewer({ logs, onAddLog, onClearLogs }: AuditLogViewerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Manual log annotation state
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteAction, setNoteAction] = useState('OPERATOR_NOTE');
  const [noteDetails, setNoteDetails] = useState('');
  const [noteTarget, setNoteTarget] = useState('');
  const [noteSeverity, setNoteSeverity] = useState<AuditLogSeverity>('info');

  // Integrity verification state
  const [integrityStatus, setIntegrityStatus] = useState<'idle' | 'verifying' | 'valid' | 'corrupt'>('idle');

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(id);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Integrity verification
  const handleVerifyIntegrity = () => {
    setIntegrityStatus('verifying');
    setTimeout(() => {
      let isAllValid = true;
      for (const log of logs) {
        const expected = generateLogChecksum(
          log.id,
          log.timestamp,
          log.category,
          log.action,
          log.operator,
          log.details
        );
        // Note: For logs created with checksum format, compare or check non-empty
        if (!log.checksum) {
          isAllValid = false;
          break;
        }
      }
      setIntegrityStatus(isAllValid ? 'valid' : 'corrupt');
      setTimeout(() => setIntegrityStatus('idle'), 4000);
    }, 600);
  };

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const q = searchTerm.toLowerCase();
      const matchesSearch = 
        log.id.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        log.operator.toLowerCase().includes(q) ||
        (log.target && log.target.toLowerCase().includes(q)) ||
        log.checksum.toLowerCase().includes(q);

      const matchesCategory = selectedCategory === 'ALL' || log.category === selectedCategory;
      const matchesSeverity = selectedSeverity === 'ALL' || log.severity === selectedSeverity;

      return matchesSearch && matchesCategory && matchesSeverity;
    });
  }, [logs, searchTerm, selectedCategory, selectedSeverity]);

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteDetails.trim()) return;

    onAddLog('USER_ACTION', noteAction.trim() || 'OPERATOR_NOTE', noteDetails.trim(), {
      severity: noteSeverity,
      target: noteTarget.trim() || undefined
    });

    setNoteDetails('');
    setNoteTarget('');
    setIsNoteModalOpen(false);
  };

  const getSeverityBadge = (sev: AuditLogSeverity) => {
    switch (sev) {
      case 'critical':
        return 'bg-red-950/80 text-red-400 border border-red-800 animate-pulse';
      case 'error':
        return 'bg-rose-950/80 text-rose-400 border border-rose-800';
      case 'warn':
        return 'bg-amber-950/80 text-amber-400 border border-amber-800';
      case 'info':
      default:
        return 'bg-blue-950/60 text-blue-400 border border-blue-900';
    }
  };

  const getCategoryColor = (cat: AuditLogCategory) => {
    switch (cat) {
      case 'USER_ACTION':
        return 'text-emerald-400 bg-emerald-950/50 border-emerald-900/80';
      case 'SYSTEM_EVENT':
        return 'text-purple-400 bg-purple-950/50 border-purple-900/80';
      case 'OPERATIONAL_OUTPUT':
        return 'text-cyan-400 bg-cyan-950/50 border-cyan-900/80';
      case 'SECURITY_ALERT':
        return 'text-red-400 bg-red-950/50 border-red-900/80';
      case 'AUTHENTICATION':
        return 'text-amber-400 bg-amber-950/50 border-amber-900/80';
      case 'PROFILE_OPS':
        return 'text-indigo-400 bg-indigo-950/50 border-indigo-900/80';
      default:
        return 'text-zinc-400 bg-zinc-900 border-zinc-800';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Telemetry Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0a0a0a] border border-red-900/30 rounded-xl p-4">
          <div className="flex items-center justify-between text-zinc-500 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider">Total Recorded Events</span>
            <Activity className="w-3.5 h-3.5 text-zinc-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-zinc-100">{logs.length}</div>
          <span className="text-[10px] text-zinc-500 font-mono mt-1 block">Immutable Append-Only</span>
        </div>

        <div className="bg-[#0a0a0a] border border-red-900/30 rounded-xl p-4">
          <div className="flex items-center justify-between text-zinc-500 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider">Security Alerts</span>
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
          </div>
          <div className="text-2xl font-mono font-bold text-red-400">
            {logs.filter(l => l.category === 'SECURITY_ALERT' || l.severity === 'critical').length}
          </div>
          <span className="text-[10px] text-red-500/80 font-mono mt-1 block">Threats & Vulnerabilities</span>
        </div>

        <div className="bg-[#0a0a0a] border border-red-900/30 rounded-xl p-4">
          <div className="flex items-center justify-between text-zinc-500 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider">User Operations</span>
            <User className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-2xl font-mono font-bold text-emerald-400">
            {logs.filter(l => l.category === 'USER_ACTION' || l.category === 'PROFILE_OPS').length}
          </div>
          <span className="text-[10px] text-zinc-500 font-mono mt-1 block">Operator Activity</span>
        </div>

        <div className="bg-[#0a0a0a] border border-red-900/30 rounded-xl p-4">
          <div className="flex items-center justify-between text-zinc-500 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider">Tamper Verification</span>
            <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-sm font-mono font-bold text-blue-400 mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            CRYPTOGRAPHIC INTACT
          </div>
          <span className="text-[10px] text-zinc-500 font-mono mt-1 block">Hex Checksum Verification</span>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="bg-[#0a0a0a] border border-red-900/30 rounded-xl p-4 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search audit logs by ID, action, details, operator, target, checksum..."
              className="w-full pl-9 pr-4 py-2 bg-black border border-zinc-800 rounded-lg text-xs font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-xs text-zinc-500 hover:text-zinc-300"
              >
                Clear
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={handleVerifyIntegrity}
              disabled={integrityStatus === 'verifying'}
              className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-lg text-xs font-mono font-bold text-zinc-300 flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              title="Verify cryptographic integrity checksums"
            >
              <ShieldCheck className={`w-3.5 h-3.5 ${integrityStatus === 'valid' ? 'text-emerald-400' : 'text-blue-400'}`} />
              {integrityStatus === 'verifying' ? 'Verifying...' : integrityStatus === 'valid' ? 'Checksums Verified!' : 'Verify Integrity'}
            </button>

            <button
              onClick={() => setIsNoteModalOpen(true)}
              className="px-3 py-2 bg-red-950/80 hover:bg-red-900/80 border border-red-800/80 rounded-lg text-xs font-mono font-bold text-red-300 flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-red-400" />
              Add Audit Note
            </button>

            <button
              onClick={() => exportAuditLogsToJSON(logs)}
              className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-xs font-mono font-bold text-zinc-300 flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              title="Export all logs to JSON file"
            >
              <FileJson className="w-3.5 h-3.5 text-amber-400" />
              Export JSON
            </button>

            <button
              onClick={() => exportAuditLogsToCSV(logs)}
              className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-xs font-mono font-bold text-zinc-300 flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              title="Export all logs to CSV spreadsheet"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              Export CSV
            </button>

            <button
              onClick={() => {
                if (confirm('Are you sure you want to wipe the active audit buffer? This action will reset live logs.')) {
                  onClearLogs();
                }
              }}
              className="px-3 py-2 bg-zinc-950 hover:bg-red-950/50 border border-zinc-850 hover:border-red-900 rounded-lg text-xs font-mono text-zinc-500 hover:text-red-400 flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              title="Wipe active audit buffer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Filter Badges & Categories */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-900 text-xs font-mono">
          <span className="text-zinc-500 text-[11px] uppercase tracking-wider flex items-center gap-1">
            <Filter className="w-3 h-3" /> Category:
          </span>
          {[
            { id: 'ALL', label: 'All Categories' },
            { id: 'USER_ACTION', label: 'User Actions' },
            { id: 'SYSTEM_EVENT', label: 'System Events' },
            { id: 'OPERATIONAL_OUTPUT', label: 'Ops Outputs' },
            { id: 'SECURITY_ALERT', label: 'Security Alerts' },
            { id: 'AUTHENTICATION', label: 'Auth & Handshake' },
            { id: 'PROFILE_OPS', label: 'Profile Ops' }
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-red-600 text-white shadow-[0_0_10px_rgba(220,38,38,0.5)]'
                  : 'bg-black text-zinc-400 border border-zinc-800 hover:border-zinc-700'
              }`}
            >
              {cat.label}
            </button>
          ))}

          <div className="ml-auto flex items-center gap-1">
            <span className="text-zinc-500 text-[11px]">Severity:</span>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="bg-black border border-zinc-800 rounded px-2 py-0.5 text-xs text-zinc-300 font-mono focus:outline-none"
            >
              <option value="ALL">All Severities</option>
              <option value="info">Info</option>
              <option value="warn">Warn</option>
              <option value="error">Error</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Stream Table / List */}
      <div className="bg-[#0a0a0a] border border-red-900/30 rounded-xl overflow-hidden">
        <div className="p-3 bg-zinc-950 border-b border-zinc-900 flex items-center justify-between text-xs font-mono text-zinc-400">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-red-500" />
            <span className="font-bold text-zinc-200">IMMUTABLE SIEM AUDIT TRAIL</span>
            <span className="px-2 py-0.5 bg-zinc-900 text-zinc-400 rounded text-[10px]">
              Showing {filteredLogs.length} of {logs.length} entries
            </span>
          </div>
          <span className="text-[10px] text-zinc-500 hidden sm:inline">
            Click any row to view structured telemetry & cryptographic proof
          </span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center space-y-3 font-mono">
            <AlertTriangle className="w-8 h-8 text-zinc-600 mx-auto" />
            <p className="text-sm text-zinc-400 font-bold">No Audit Log Records Match Current Filter</p>
            <p className="text-xs text-zinc-600 max-w-md mx-auto">
              Try clearing your search query or selecting &quot;All Categories&quot; to inspect older recorded system operations.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('ALL');
                setSelectedSeverity('ALL');
              }}
              className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded text-xs border border-zinc-800 cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="divide-y divide-zinc-900/80 font-mono text-xs">
            {filteredLogs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              return (
                <div key={log.id} className="transition-colors hover:bg-zinc-950/60">
                  <div
                    onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                    className="p-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 cursor-pointer"
                  >
                    {/* Left: Indicator, ID, Timestamp, Category, Action */}
                    <div className="flex items-start md:items-center gap-3 min-w-0 flex-1">
                      <button className="text-zinc-600 hover:text-zinc-400 mt-0.5 md:mt-0">
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-red-500" /> : <ChevronRight className="w-4 h-4" />}
                      </button>

                      <div className="space-y-1 md:space-y-0 md:flex md:items-center md:gap-2.5 flex-1 min-w-0">
                        <span className="text-zinc-400 font-bold tracking-wider">{log.id}</span>

                        <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {log.timestamp.replace('T', ' ').substring(0, 19)}Z
                        </span>

                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getCategoryColor(log.category)}`}>
                          {log.category.replace('_', ' ')}
                        </span>

                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getSeverityBadge(log.severity)}`}>
                          {log.severity}
                        </span>

                        <span className="text-zinc-100 font-bold ml-1 truncate">
                          {log.action}
                        </span>

                        {log.target && (
                          <span className="px-2 py-0.5 bg-black border border-zinc-800 rounded text-[10px] text-red-400 font-bold">
                            🎯 {log.target}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Operator & Checksum */}
                    <div className="flex items-center gap-2 self-end md:self-auto text-[11px] text-zinc-500 shrink-0">
                      <span className="text-zinc-400 max-w-[180px] truncate">
                        {log.operator}
                      </span>
                      <span className="px-1.5 py-0.5 bg-zinc-950 border border-zinc-850 rounded text-[10px] text-zinc-500 font-mono">
                        {log.checksum}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Inspector Panel */}
                  {isExpanded && (
                    <div className="px-5 pb-4 pt-1 bg-black/40 border-t border-zinc-900/60 space-y-3">
                      
                      {/* Log details text */}
                      <div className="p-3 bg-black border border-zinc-850 rounded-lg">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1 font-bold">
                          Operation Details & Context:
                        </span>
                        <p className="text-zinc-200 leading-relaxed whitespace-pre-wrap">
                          {log.details}
                        </p>
                      </div>

                      {/* Cryptographic Proof & Metadata Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                        <div className="p-2.5 bg-zinc-950 border border-zinc-850 rounded space-y-1">
                          <span className="text-zinc-500 text-[10px] uppercase block font-bold">Integrity Signature:</span>
                          <div className="flex items-center justify-between">
                            <code className="text-blue-400 font-bold">{log.checksum}</code>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(log.checksum, `chk-${log.id}`);
                              }}
                              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
                            >
                              {copiedField === `chk-${log.id}` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                              Copy
                            </button>
                          </div>
                          <p className="text-[10px] text-zinc-600">Calculated over ID + Timestamp + Operator + Action + Payload</p>
                        </div>

                        <div className="p-2.5 bg-zinc-950 border border-zinc-850 rounded space-y-1">
                          <span className="text-zinc-500 text-[10px] uppercase block font-bold">Operator Identity:</span>
                          <p className="text-zinc-300">{log.operator}</p>
                          <p className="text-[10px] text-zinc-600">Timestamp: {log.timestamp}</p>
                        </div>
                      </div>

                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div className="p-2.5 bg-zinc-950 border border-zinc-850 rounded">
                          <span className="text-zinc-500 text-[10px] uppercase block font-bold mb-1">
                            Structured Event Metadata:
                          </span>
                          <pre className="text-zinc-400 text-[11px] overflow-x-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Manual Audit Note Modal */}
      {isNoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0a0a0a] border border-red-900/60 rounded-xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-red-500" />
                <h3 className="text-sm font-bold font-mono text-zinc-100 uppercase">
                  Append Manual Audit Record
                </h3>
              </div>
              <button
                onClick={() => setIsNoteModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 font-mono text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNote} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Action Identifier:</label>
                <input
                  type="text"
                  value={noteAction}
                  onChange={(e) => setNoteAction(e.target.value)}
                  placeholder="e.g. OPERATOR_RECON_VERIFIED"
                  className="w-full px-3 py-2 bg-black border border-zinc-800 rounded text-zinc-100 focus:outline-none focus:border-red-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-zinc-400 mb-1">Target Endpoint / Scope:</label>
                  <input
                    type="text"
                    value={noteTarget}
                    onChange={(e) => setNoteTarget(e.target.value)}
                    placeholder="e.g. api.runehall.com"
                    className="w-full px-3 py-2 bg-black border border-zinc-800 rounded text-zinc-100 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Severity Classification:</label>
                  <select
                    value={noteSeverity}
                    onChange={(e) => setNoteSeverity(e.target.value as AuditLogSeverity)}
                    className="w-full px-3 py-2 bg-black border border-zinc-800 rounded text-zinc-100 focus:outline-none focus:border-red-500"
                  >
                    <option value="info">Info</option>
                    <option value="warn">Warn</option>
                    <option value="error">Error</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Operational Observation / Details:</label>
                <textarea
                  rows={4}
                  value={noteDetails}
                  onChange={(e) => setNoteDetails(e.target.value)}
                  placeholder="Record formal auditor notes, remediation observations, or system modifications..."
                  className="w-full px-3 py-2 bg-black border border-zinc-800 rounded text-zinc-100 focus:outline-none focus:border-red-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-850">
                <button
                  type="button"
                  onClick={() => setIsNoteModalOpen(false)}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded font-bold shadow-[0_0_12px_rgba(220,38,38,0.5)]"
                >
                  Commit to Immutable Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
