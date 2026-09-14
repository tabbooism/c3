'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertTriangle, CheckSquare, PlusCircle } from 'lucide-react';
import { Finding } from '../types';

interface AddFindingModalProps {
  isOpen: boolean;
  engagementId: string;
  scopeList: string[];
  onClose: () => void;
  onAdd: (newFinding: Finding) => void;
}

export default function AddFindingModal({
  isOpen,
  engagementId,
  scopeList,
  onClose,
  onAdd
}: AddFindingModalProps) {
  const [title, setTitle] = useState('');
  const [severity, setSeverity] = useState<'critical' | 'high' | 'medium' | 'low'>('high');
  const [selectedScope, setSelectedScope] = useState('');
  const [description, setDescription] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setSeverity('high');
      setSelectedScope(scopeList[0] || 'Entire Scope');
      setDescription('');
      setRecommendation('');
      setError('');
    }
  }, [isOpen, scopeList]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError('Title and Description are required.');
      return;
    }

    const finding: Finding = {
      id: `FIND-${Math.floor(1000 + Math.random() * 9000)}`,
      engagementId: engagementId,
      title: title.trim(),
      severity: severity,
      description: `[Scope Target: ${selectedScope}]\n\n${description.trim()}`,
      recommendation: recommendation.trim() || 'Remediate according to OWASP / NIST security guidelines.',
      status: 'open',
      discoveredAt: new Date().toISOString()
    };

    onAdd(finding);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            className="relative w-full max-w-lg bg-zinc-950 border border-red-900/50 rounded-xl shadow-2xl z-10 font-sans"
          >
            <div className="h-1 w-full bg-red-600 shadow-[0_0_12px_rgba(239,68,68,0.8)]" />

            <div className="p-6">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-850">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-red-950/60 border border-red-900/50 text-red-400 rounded-lg">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-zinc-100 font-mono">
                      Log Security Vulnerability Finding
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Record discovered flaw, exploit proof, and mitigation roadmap
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 text-zinc-400 hover:text-zinc-100 transition-colors bg-zinc-900 hover:bg-zinc-800 rounded-md border border-zinc-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                {error && (
                  <div className="p-3 bg-red-950/50 border border-red-800/80 text-red-300 text-xs rounded-lg font-mono">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Vulnerability Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Remote Code Execution via SSTI"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-black border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-red-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Severity Level
                    </label>
                    <select
                      value={severity}
                      onChange={(e) => setSeverity(e.target.value as any)}
                      className="w-full px-3 py-2 text-sm bg-black border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-red-500 font-semibold transition-colors"
                    >
                      <option value="critical" className="text-red-500">🔴 Critical</option>
                      <option value="high" className="text-orange-500">🟠 High</option>
                      <option value="medium" className="text-amber-500">🟡 Medium</option>
                      <option value="low" className="text-emerald-500">🟢 Low</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Target Scope Host
                  </label>
                  <select
                    value={selectedScope}
                    onChange={(e) => setSelectedScope(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-black border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-red-500 font-mono transition-colors"
                  >
                    {scopeList.map((sc, i) => (
                      <option key={i} value={sc}>
                        {sc}
                      </option>
                    ))}
                    <option value="Global Boundary">Global Boundary / Root</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Technical Evidence / Exploit Details
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide reproduction steps, payload executed, or server response logs..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-black border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-650 focus:outline-none focus:border-red-500 font-mono text-xs transition-colors resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5 text-red-400" />
                    Recommended Remediation Directive
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Specific architectural patch, configuration, or code fix..."
                    value={recommendation}
                    onChange={(e) => setRecommendation(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-black border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-650 focus:outline-none focus:border-red-500 font-mono text-xs transition-colors resize-none"
                  />
                </div>

                <div className="flex gap-3 justify-end pt-3 border-t border-zinc-850">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 active:bg-red-600 rounded-lg transition-all shadow-[0_0_15px_rgba(220,38,38,0.4)]"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Commit Finding
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
