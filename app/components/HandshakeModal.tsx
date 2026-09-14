'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, KeyRound, ShieldAlert, Radio, Fingerprint, Crown } from 'lucide-react';

interface HandshakeModalProps {
  isOpen: boolean;
  engagementId: string | null;
  onClose: () => void;
  onHandshakeSuccess: (unlockedEngagement: any, session: any) => void;
  localEngagements?: any[];
}

export default function HandshakeModal({
  isOpen,
  engagementId,
  onClose,
  onHandshakeSuccess,
  localEngagements = []
}: HandshakeModalProps) {
  const [typedId, setTypedId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const [isHandshaking, setIsHandshaking] = useState(false);
  const [handshakeStep, setHandshakeStep] = useState(0);
  const [handshakeLogs, setHandshakeLogs] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setTypedId(engagementId || '');
      setPassword('');
      setError('');
      setIsHandshaking(false);
      setHandshakeStep(0);
      setHandshakeLogs([]);
    }
  }, [isOpen, engagementId]);

  const simulateHandshakeLogs = (targetEngagement: any, matchedSession: any, isAdmin = false) => {
    setIsHandshaking(true);
    setHandshakeLogs([
      isAdmin 
        ? '[ADMIN_OVERRIDE] Master Key monalisa recognized. Bypassing cryptographic constraints...'
        : '[INIT] Requesting cryptographic validation lease...'
    ]);
    
    const steps = isAdmin ? [
      { text: '[GOD_MODE] Unrestricted operator authentication granted...', delay: 300 },
      { text: `[OVERRIDE] Target Scope ${targetEngagement.id} unlocked with full root privileges.`, delay: 600 },
      { text: '[ACCESS] Zero-constraint telemetry & exploit engine active.', delay: 900 }
    ] : [
      { text: '[NEGOTIATION] Broadcast handshake signal to /api/engagement/handshake...', delay: 400 },
      { text: `[AUTH] Client signature integrity check for ID: ${targetEngagement.id}`, delay: 800 },
      { text: '[CRYPTO] Constructing ephemeral Diffie-Hellman signature parameter...', delay: 1200 },
      { text: '[ESTABLISHED] Decrypting authorized target scan scopes & reports...', delay: 1600 }
    ];

    steps.forEach((step, index) => {
      setTimeout(() => {
        setHandshakeLogs(prev => [...prev, step.text]);
        setHandshakeStep(index + 1);
        
        if (index === steps.length - 1) {
          setTimeout(() => {
            onHandshakeSuccess(targetEngagement, matchedSession);
            setIsHandshaking(false);
            onClose();
          }, 500);
        }
      }, step.delay);
    });
  };

  const handleHandshakeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanId = typedId.trim().toUpperCase();
    const cleanPassword = password.trim();

    if (!cleanId || !cleanPassword) {
      setError('Both Engagement Scope ID and Authorization Password are required.');
      return;
    }

    const isAdmin = cleanPassword.toLowerCase() === 'monalisa';

    try {
      const matchedLocal = localEngagements.find(e => e.id.toUpperCase() === cleanId);
      
      if (matchedLocal) {
        if (matchedLocal.localPassword === cleanPassword || isAdmin) {
          const sessionData = {
            token: `live_sess_${Math.random().toString(36).substring(7)}`,
            handshakeHash: `hash_${Math.random().toString(36).substring(2)}`,
            verifiedAt: new Date().toISOString(),
            role: isAdmin ? 'ROOT_SUPERUSER' : 'OPERATOR'
          };
          
          simulateHandshakeLogs({ ...matchedLocal, status: 'established' }, sessionData, isAdmin);
          return;
        } else {
          setError('Authenticity validation failed. Invalid master password (or use admin key: monalisa).');
          return;
        }
      }

      // Server handshake
      const response = await fetch('/api/engagement/handshake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ engagementId: cleanId, masterPassword: cleanPassword })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        simulateHandshakeLogs(result.engagement, result.session, isAdmin);
      } else {
        setError(result.error || 'Server validation rejected the parameters.');
      }

    } catch (err: any) {
      console.error(err);
      setError('Communication error with authentication backend.');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!isHandshaking ? onClose : undefined}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            className="relative w-full max-w-md overflow-hidden bg-zinc-950 border border-red-900/50 rounded-xl shadow-2xl z-10 font-sans"
          >
            <div className={`h-1 w-full transition-colors duration-500 ${isHandshaking ? 'bg-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,1)]' : 'bg-red-600'}`} />

            <div className="p-6">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-850">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-red-950/60 text-red-400 border border-red-900/40">
                    <Fingerprint className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-zinc-100 font-mono">
                      Operator Cryptographic Handshake
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Authenticate scope or apply admin master override
                    </p>
                  </div>
                </div>
                {!isHandshaking && (
                  <button
                    onClick={onClose}
                    className="p-1.5 text-zinc-400 hover:text-zinc-100 transition-colors bg-zinc-900 hover:bg-zinc-800 rounded-md border border-zinc-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {isHandshaking ? (
                <div className="mt-5 space-y-4">
                  <div className="p-4 bg-black border border-red-900/40 rounded-lg flex items-center gap-3">
                    <Radio className="w-5 h-5 text-red-500 animate-ping shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-red-400 font-mono uppercase">Negotiating Handshake Lease</h4>
                      <p className="text-[11px] text-zinc-400 mt-0.5">Validating authorization parameters...</p>
                    </div>
                  </div>

                  <div className="p-3 bg-black rounded-lg border border-zinc-900 text-[10.5px] font-mono space-y-1.5 min-h-[120px] max-h-[160px] overflow-y-auto">
                    {handshakeLogs.map((log, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={log.includes('ADMIN') || log.includes('ESTABLISHED') ? 'text-red-400 font-bold' : 'text-zinc-400'}
                      >
                        {log}
                      </motion.div>
                    ))}
                  </div>

                  <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-red-600"
                      initial={{ width: '0%' }}
                      animate={{ width: `${(handshakeStep / 4) * 100}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              ) : (
                <form onSubmit={handleHandshakeSubmit} className="mt-5 space-y-4">
                  {error && (
                    <div className="p-3 bg-red-950/50 border border-red-800/80 text-red-300 text-xs rounded-lg flex items-start gap-2 font-mono">
                      <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Target Scope ID
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. ENG-RUN-9021"
                      value={typedId}
                      onChange={(e) => setTypedId(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-black border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-600 font-mono focus:outline-none focus:border-red-500 transition-colors"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-zinc-500" />
                        Master Password / Admin Key
                      </label>
                      <button
                        type="button"
                        onClick={() => setPassword('monalisa')}
                        className="text-[10px] text-red-400 hover:text-red-300 font-mono flex items-center gap-1"
                      >
                        <Crown className="w-3 h-3" /> Auto-fill monalisa
                      </button>
                    </div>
                    <input
                      type="password"
                      placeholder="Enter password (use 'monalisa' for Admin God Mode)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-black border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-600 font-mono focus:outline-none focus:border-red-500 transition-colors"
                    />
                    <div className="bg-black p-2.5 rounded border border-zinc-900 mt-2 text-[10.5px] text-zinc-400 font-mono leading-relaxed">
                      👑 <span className="text-red-400 font-bold">Admin Override:</span> Enter <code className="text-red-400 bg-red-950/60 border border-red-900/50 px-1.5 py-0.5 rounded font-bold">monalisa</code> to bypass all authentication constraints.
                    </div>
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
                      className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 active:bg-red-600 rounded-lg transition-all shadow-[0_0_15px_rgba(220,38,38,0.4)]"
                    >
                      Establish Handshake
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
