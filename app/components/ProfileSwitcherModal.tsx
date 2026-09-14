'use client';

import React from 'react';
import { UserProfile, Engagement } from '../types';
import { User, Key, Check, Plus, ArrowRight, Shield } from 'lucide-react';

interface ProfileSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  profiles: UserProfile[];
  activeProfileId: string;
  engagements: Engagement[];
  onSelectProfile: (profile: UserProfile) => void;
  onOpenFullManager: () => void;
}

export default function ProfileSwitcherModal({
  isOpen,
  onClose,
  profiles,
  activeProfileId,
  engagements,
  onSelectProfile,
  onOpenFullManager
}: ProfileSwitcherModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#0a0a0a] border border-red-900/60 rounded-xl max-w-lg w-full p-5 space-y-4 shadow-2xl font-mono text-xs">
        
        <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-red-500" />
            <div>
              <h3 className="text-sm font-bold text-zinc-100 uppercase">
                Active Operator Profile Switcher
              </h3>
              <p className="text-[11px] text-zinc-400">
                Select an operational profile to load bound engagements and API keys.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 font-bold"
          >
            ✕
          </button>
        </div>

        {/* Profile selection cards */}
        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 scrollbar-thin">
          {profiles.map((prof) => {
            const isActive = prof.id === activeProfileId;
            const boundEng = engagements.find(e => e.id === prof.engagementId);

            return (
              <div
                key={prof.id}
                onClick={() => {
                  if (!isActive) {
                    onSelectProfile(prof);
                    onClose();
                  }
                }}
                className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isActive 
                    ? 'bg-red-950/40 border-red-600/80 shadow-[0_0_12px_rgba(239,68,68,0.2)]' 
                    : 'bg-black border-zinc-850 hover:border-zinc-700 hover:bg-zinc-950'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-red-400 text-sm">
                    {prof.avatarInitials}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-zinc-100">{prof.name}</span>
                      {isActive && (
                        <span className="px-1.5 py-0.2 bg-red-600 text-white text-[9px] rounded font-bold">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400">{prof.role}</p>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500 mt-1">
                      <span>Scope: <strong className="text-red-400">{prof.engagementId}</strong></span>
                      <span>•</span>
                      <span>Keys: <strong className="text-amber-400">{prof.apiKeys.length} configured</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isActive ? (
                    <span className="flex items-center gap-1 text-emerald-400 text-[11px] font-bold">
                      <Check className="w-3.5 h-3.5" /> Selected
                    </span>
                  ) : (
                    <button className="px-3 py-1 bg-zinc-900 hover:bg-red-600 hover:text-white text-zinc-300 rounded text-[11px] font-bold border border-zinc-800">
                      Switch
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-zinc-850">
          <button
            onClick={() => {
              onClose();
              onOpenFullManager();
            }}
            className="text-red-400 hover:text-red-300 flex items-center gap-1 font-bold text-[11px] cursor-pointer"
          >
            Manage Profiles, API Keys & Presets <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded font-bold"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
