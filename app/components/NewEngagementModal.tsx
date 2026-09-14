'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Shield, Lock, Globe, CheckCircle, Zap } from 'lucide-react';
import { SecurityClass } from '../types';

interface NewEngagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: (newEngagement: any) => void;
}

export default function NewEngagementModal({ isOpen, onClose, onRegister }: NewEngagementModalProps) {
  const [clientName, setClientName] = useState('');
  const [type, setType] = useState('External Infrastructure Assessment');
  const [scopeInputs, setScopeInputs] = useState('');
  const [securityClass, setSecurityClass] = useState<SecurityClass>('Confidential');
  const [complianceFramework, setComplianceFramework] = useState('SOC2 Type II');
  const [customId, setCustomId] = useState('');
  const [masterPassword, setMasterPassword] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError('');
      setSuccess(false);
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      setCustomId(`ENG-LIVE-${randomSuffix}`);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!clientName.trim()) {
      setError('Client / Project Name is required.');
      return;
    }
    if (!scopeInputs.trim()) {
      setError('Please specify at least one target scope (e.g., domain or IP).');
      return;
    }

    const scopeArr = scopeInputs
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const newEngagement = {
      id: customId.trim().toUpperCase() || `ENG-${Math.floor(1000 + Math.random() * 9000)}`,
      clientName: clientName.trim(),
      scope: scopeArr,
      type: type,
      status: 'pending' as const,
      securityClass: securityClass,
      complianceFramework: complianceFramework,
      localPassword: masterPassword.trim() || 'monalisa',
      createdAt: new Date().toISOString()
    };

    setSuccess(true);
    setTimeout(() => {
      onRegister(newEngagement);
      setClientName('');
      setScopeInputs('');
      setMasterPassword('');
      onClose();
    }, 800);
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
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="relative w-full max-w-lg overflow-hidden bg-zinc-950 border border-red-900/40 rounded-xl shadow-2xl z-10"
          >
            <div className="h-1 w-full bg-red-600 shadow-[0_0_12px_rgba(239,68,68,0.8)]" />

            <div className="p-6">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-850">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-red-950/60 border border-red-900/50 text-red-400 rounded-lg">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-zinc-100 font-mono flex items-center gap-2">
                      Deploy Security Scope Target
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Configure target parameters and cryptographic authorization
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

              {success ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="p-3 bg-red-950/60 text-red-400 border border-red-800 rounded-full mb-3 animate-pulse">
                    <CheckCircle className="w-10 h-10" />
                  </div>
                  <h4 className="text-base font-bold text-zinc-100 font-mono">Scope Target Registered</h4>
                  <p className="text-xs text-zinc-400 mt-1">
                    Synchronizing live target parameters with operator registry...
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                  {error && (
                    <div className="p-3 bg-red-950/50 border border-red-800/80 text-red-300 text-xs rounded-lg font-mono">
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                        Client / Organization Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Apex Cyber Operations"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-black border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-red-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                        Engagement Scope ID
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. ENG-LIVE-804"
                        value={customId}
                        onChange={(e) => setCustomId(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-black border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-red-500 font-mono transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Target Domain / IP Scope (space or comma separated)
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                      <textarea
                        rows={2}
                        placeholder="e.g. app.target.com, api.target.com, 192.168.1.10"
                        value={scopeInputs}
                        onChange={(e) => setScopeInputs(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm bg-black border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-red-500 transition-colors resize-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                        Classification Level
                      </label>
                      <select
                        value={securityClass}
                        onChange={(e) => setSecurityClass(e.target.value as SecurityClass)}
                        className="w-full px-3 py-2 text-sm bg-black border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-red-500 transition-colors"
                      >
                        <option value="Unclassified">Unclassified</option>
                        <option value="Restricted">Restricted</option>
                        <option value="Confidential">Confidential</option>
                        <option value="Secret">Secret (Top-Secret)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                        Compliance Framework
                      </label>
                      <select
                        value={complianceFramework}
                        onChange={(e) => setComplianceFramework(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-black border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-red-500 transition-colors"
                      >
                        <option value="SOC2 Type II">SOC2 Type II</option>
                        <option value="PCI-DSS v4.0">PCI-DSS v4.0</option>
                        <option value="NIST Special Pub 800">NIST SP 800-53</option>
                        <option value="ISO 27001">ISO 27001</option>
                        <option value="HIPAA Audit">HIPAA Security</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Assessment Mode
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Infrastructure Penetration & Red-Team Audit"
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-black border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-red-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-red-400" />
                        Master Authorization Password
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">(Or use Admin Key: monalisa)</span>
                    </label>
                    <input
                      type="password"
                      placeholder="Enter verification password (default: monalisa)"
                      value={masterPassword}
                      onChange={(e) => setMasterPassword(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-black border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-650 focus:outline-none focus:border-red-500 font-mono transition-colors"
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
                      <Zap className="w-3.5 h-3.5" />
                      Deploy Scope Target
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
