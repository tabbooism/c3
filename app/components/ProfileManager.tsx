'use client';

import React, { useState } from 'react';
import { 
  UserProfile, 
  ApiKeyEntry, 
  Engagement, 
  UserProfileConfig 
} from '../types';
import { 
  User, 
  Key, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  Copy, 
  Eye, 
  EyeOff, 
  Save, 
  Download, 
  Upload, 
  Shield, 
  Crosshair, 
  Sliders, 
  Terminal, 
  Zap, 
  Radio, 
  Layers, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  RefreshCw
} from 'lucide-react';

interface ProfileManagerProps {
  profiles: UserProfile[];
  activeProfileId: string;
  engagements: Engagement[];
  currentWorkspaceConfig: {
    selectedEngagementId: string;
    scannerTarget: string;
    scanType: 'ports' | 'headers' | 'ssl' | 'fuzz';
    shellIp: string;
    shellPort: string;
    shellType: 'bash' | 'python' | 'nc' | 'powershell' | 'php';
    webhookUrl: string;
    osintTarget: string;
  };
  onSelectProfile: (profile: UserProfile) => void;
  onSaveCurrentToProfile: (profileId: string) => void;
  onCreateProfile: (profileData: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateProfile: (updated: UserProfile) => void;
  onDeleteProfile: (profileId: string) => void;
}

export default function ProfileManager({
  profiles,
  activeProfileId,
  engagements,
  currentWorkspaceConfig,
  onSelectProfile,
  onSaveCurrentToProfile,
  onCreateProfile,
  onUpdateProfile,
  onDeleteProfile
}: ProfileManagerProps) {
  const activeProfile = profiles.find(p => p.id === activeProfileId) || profiles[0];

  // Tab inside Profile Manager: 'active-profile' | 'all-profiles' | 'api-keys'
  const [managerTab, setManagerTab] = useState<'active-profile' | 'all-profiles' | 'api-keys'>('active-profile');

  // Key Visibility toggles (keyId -> boolean)
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // New Profile Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileRole, setNewProfileRole] = useState('Offensive Security Specialist');
  const [newProfileEngagementId, setNewProfileEngagementId] = useState(engagements[0]?.id || 'ENG-RUN-9021');

  // Add Key Form state
  const [isAddKeyOpen, setIsAddKeyOpen] = useState(false);
  const [keyService, setKeyService] = useState<'Shodan' | 'Censys' | 'Hunter' | 'VirusTotal' | 'Custom'>('Shodan');
  const [customServiceName, setCustomServiceName] = useState('');
  const [keyValue, setKeyValue] = useState('');
  const [keyDescription, setKeyDescription] = useState('');

  // Editable Profile Settings
  const [editConfig, setEditConfig] = useState<UserProfileConfig>(activeProfile ? { ...activeProfile.config } : {
    defaultScanType: 'ports',
    defaultEncoder: 'base64',
    shellIp: '10.10.14.2',
    shellPort: '4444',
    shellType: 'bash',
    webhookUrl: 'https://siem-collector.internal/v1/alerts',
    scannerTarget: 'api.runehall.com',
    osintTarget: 'runehall.com',
    autoLogAudits: true
  });
  const [editEngagementId, setEditEngagementId] = useState(activeProfile?.engagementId || engagements[0]?.id || '');
  const [isConfigSavedToast, setIsConfigSavedToast] = useState(false);

  // Synchronize when active profile changes
  React.useEffect(() => {
    if (activeProfile) {
      setEditConfig({ ...activeProfile.config });
      setEditEngagementId(activeProfile.engagementId);
    }
  }, [activeProfile?.id]);

  const toggleKeyReveal = (keyId: string) => {
    setRevealedKeys(prev => ({ ...prev, [keyId]: !prev[keyId] }));
  };

  const copyKey = (key: string, id: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const handleCreateProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;

    const initials = newProfileName.split(' ')
      .map(w => w[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'OP';

    onCreateProfile({
      name: newProfileName.trim(),
      role: newProfileRole.trim() || 'Security Specialist',
      avatarInitials: initials,
      engagementId: newProfileEngagementId,
      apiKeys: [],
      config: {
        defaultScanType: currentWorkspaceConfig.scanType,
        defaultEncoder: 'base64',
        shellIp: currentWorkspaceConfig.shellIp,
        shellPort: currentWorkspaceConfig.shellPort,
        shellType: currentWorkspaceConfig.shellType,
        webhookUrl: currentWorkspaceConfig.webhookUrl,
        scannerTarget: currentWorkspaceConfig.scannerTarget,
        osintTarget: currentWorkspaceConfig.osintTarget,
        autoLogAudits: true
      }
    });

    setNewProfileName('');
    setIsCreateModalOpen(false);
  };

  const handleAddApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyValue.trim()) return;

    const actualService = keyService === 'Custom' ? (customServiceName.trim() || 'Custom API') : keyService;
    const newKey: ApiKeyEntry = {
      id: `KEY-${Date.now().toString(36).toUpperCase()}`,
      service: actualService,
      key: keyValue.trim(),
      description: keyDescription.trim() || `${actualService} programmatic API token`,
      addedAt: new Date().toISOString()
    };

    const updatedKeys = [...activeProfile.apiKeys, newKey];
    onUpdateProfile({
      ...activeProfile,
      apiKeys: updatedKeys,
      updatedAt: new Date().toISOString()
    });

    setKeyValue('');
    setKeyDescription('');
    setCustomServiceName('');
    setIsAddKeyOpen(false);
  };

  const handleDeleteApiKey = (keyId: string) => {
    const updatedKeys = activeProfile.apiKeys.filter(k => k.id !== keyId);
    onUpdateProfile({
      ...activeProfile,
      apiKeys: updatedKeys,
      updatedAt: new Date().toISOString()
    });
  };

  const handleSaveProfileConfig = () => {
    if (!activeProfile) return;
    onUpdateProfile({
      ...activeProfile,
      engagementId: editEngagementId,
      config: { ...editConfig },
      updatedAt: new Date().toISOString()
    });
    setIsConfigSavedToast(true);
    setTimeout(() => setIsConfigSavedToast(false), 3000);
  };

  const maskKey = (key: string) => {
    if (key.length <= 8) return '••••••••';
    return key.substring(0, 4) + '••••••••' + key.substring(key.length - 4);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Profile HUD Card */}
      <div className="bg-[#0a0a0a] border border-red-900/30 rounded-xl p-5 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          
          {/* Active Operator Details */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-red-950/80 border-2 border-red-600/70 flex items-center justify-center text-red-400 font-mono font-bold text-xl shadow-[0_0_20px_rgba(239,68,68,0.3)]">
              {activeProfile.avatarInitials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-mono text-zinc-100">{activeProfile.name}</h2>
                <span className="px-2 py-0.5 bg-red-950 border border-red-800 text-red-400 text-[10px] font-mono font-bold rounded uppercase">
                  ACTIVE PROFILE
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">{activeProfile.role}</p>
              
              <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] font-mono">
                <span className="px-2 py-0.5 bg-black border border-zinc-800 rounded text-zinc-300">
                  Engagement: <strong className="text-red-400">{activeProfile.engagementId}</strong>
                </span>
                <span className="px-2 py-0.5 bg-black border border-zinc-800 rounded text-zinc-300">
                  Keys Vault: <strong className="text-amber-400">{activeProfile.apiKeys.length} active</strong>
                </span>
                <span className="px-2 py-0.5 bg-black border border-zinc-800 rounded text-zinc-400">
                  Target: <strong className="text-zinc-200">{activeProfile.config.scannerTarget || 'Not set'}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => {
                onSaveCurrentToProfile(activeProfile.id);
                setIsConfigSavedToast(true);
                setTimeout(() => setIsConfigSavedToast(false), 3000);
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-mono font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-[0_0_15px_rgba(220,38,38,0.5)] cursor-pointer"
              title="Capture current workspace target, ports, and parameters into this profile"
            >
              <Save className="w-3.5 h-3.5" />
              Save Workspace to Profile
            </button>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 hover:border-zinc-700 font-mono font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-red-400" />
              New Profile
            </button>
          </div>
        </div>

        {isConfigSavedToast && (
          <div className="mt-3 p-2 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-mono rounded flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Active workspace state successfully synchronized and saved to profile &quot;{activeProfile.name}&quot;!
          </div>
        )}
      </div>

      {/* Profile Section Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-zinc-900 pb-2">
        {[
          { id: 'active-profile', label: 'Active Profile Settings', icon: Sliders },
          { id: 'api-keys', label: `API Keys Vault (${activeProfile.apiKeys.length})`, icon: Key },
          { id: 'all-profiles', label: `All Stored Profiles (${profiles.length})`, icon: User }
        ].map(t => {
          const Icon = t.icon;
          const isCurrent = managerTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setManagerTab(t.id as any)}
              className={`px-4 py-2 rounded-lg text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
                isCurrent 
                  ? 'bg-zinc-900 text-zinc-100 border border-red-900/60 shadow-[0_0_10px_rgba(220,38,38,0.2)]' 
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-950'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isCurrent ? 'text-red-500' : 'text-zinc-500'}`} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SUBTAB 1: ACTIVE PROFILE CONFIGURATION & PREFERENCES
      ───────────────────────────────────────────────────────────── */}
      {managerTab === 'active-profile' && (
        <div className="bg-[#0a0a0a] border border-red-900/30 rounded-xl p-5 space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
            <div>
              <h3 className="text-sm font-bold font-mono text-zinc-100 uppercase">
                Profile Configuration & Operational Parameters
              </h3>
              <p className="text-xs text-zinc-400 font-mono">
                Persisted presets for {activeProfile.name}. Loading this profile applies these defaults.
              </p>
            </div>
            <button
              onClick={handleSaveProfileConfig}
              className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white font-mono font-bold text-xs rounded shadow flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              Save Changes
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
            
            {/* Engagement & Target Defaults */}
            <div className="space-y-4 p-4 bg-black border border-zinc-850 rounded-xl">
              <h4 className="font-bold text-red-400 flex items-center gap-2">
                <Crosshair className="w-4 h-4" /> Target Scope & Engagement Binding
              </h4>

              <div>
                <label className="block text-zinc-400 mb-1">Bound Engagement ID:</label>
                <select
                  value={editEngagementId}
                  onChange={(e) => setEditEngagementId(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-zinc-100 focus:outline-none focus:border-red-500"
                >
                  {engagements.map(eng => (
                    <option key={eng.id} value={eng.id}>
                      {eng.id} — {eng.clientName} ({eng.securityClass})
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  Switching profiles will automatically route active audit context to this engagement.
                </span>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Default Scanner Host/Endpoint:</label>
                <input
                  type="text"
                  value={editConfig.scannerTarget || ''}
                  onChange={(e) => setEditConfig(prev => ({ ...prev, scannerTarget: e.target.value }))}
                  placeholder="e.g. api.runehall.com"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-zinc-100 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Default OSINT Target Domain:</label>
                <input
                  type="text"
                  value={editConfig.osintTarget || ''}
                  onChange={(e) => setEditConfig(prev => ({ ...prev, osintTarget: e.target.value }))}
                  placeholder="e.g. runehall.com"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-zinc-100 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Preferred Scanner Mode:</label>
                <select
                  value={editConfig.defaultScanType}
                  onChange={(e) => setEditConfig(prev => ({ ...prev, defaultScanType: e.target.value as any }))}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-zinc-100 focus:outline-none focus:border-red-500"
                >
                  <option value="ports">Port Probe & TCP Fingerprint</option>
                  <option value="headers">Security Headers Audit</option>
                  <option value="ssl">SSL/TLS Cipher Suite Validation</option>
                  <option value="fuzz">Web Route & Actuator Fuzzer</option>
                </select>
              </div>
            </div>

            {/* Red Team Shell & Webhook Defaults */}
            <div className="space-y-4 p-4 bg-black border border-zinc-850 rounded-xl">
              <h4 className="font-bold text-red-400 flex items-center gap-2">
                <Terminal className="w-4 h-4" /> Operator Payload & Telemetry Presets
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">LHOST (Reverse IP):</label>
                  <input
                    type="text"
                    value={editConfig.shellIp}
                    onChange={(e) => setEditConfig(prev => ({ ...prev, shellIp: e.target.value }))}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-zinc-100 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">LPORT (Listen Port):</label>
                  <input
                    type="text"
                    value={editConfig.shellPort}
                    onChange={(e) => setEditConfig(prev => ({ ...prev, shellPort: e.target.value }))}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-zinc-100 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Default Reverse Shell Syntax:</label>
                <select
                  value={editConfig.shellType}
                  onChange={(e) => setEditConfig(prev => ({ ...prev, shellType: e.target.value as any }))}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-zinc-100 focus:outline-none focus:border-red-500"
                >
                  <option value="bash">Bash Interactive (/dev/tcp)</option>
                  <option value="python">Python3 PTY Socket</option>
                  <option value="nc">Netcat Traditional / FIFO</option>
                  <option value="powershell">PowerShell TCPClient Stream</option>
                  <option value="php">PHP fsockopen</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Default SIEM Webhook Collector:</label>
                <input
                  type="text"
                  value={editConfig.webhookUrl}
                  onChange={(e) => setEditConfig(prev => ({ ...prev, webhookUrl: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-zinc-100 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                  <input
                    type="checkbox"
                    checked={editConfig.autoLogAudits !== false}
                    onChange={(e) => setEditConfig(prev => ({ ...prev, autoLogAudits: e.target.checked }))}
                    className="accent-red-600 rounded"
                  />
                  <span>Automatically log operator actions to append-only audit trail</span>
                </label>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SUBTAB 2: API KEYS VAULT (Shodan, Censys, Hunter, Custom)
      ───────────────────────────────────────────────────────────── */}
      {managerTab === 'api-keys' && (
        <div className="bg-[#0a0a0a] border border-red-900/30 rounded-xl p-5 space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-850 pb-3">
            <div>
              <h3 className="text-sm font-bold font-mono text-zinc-100 uppercase flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-500" />
                API Key Credentials Vault ({activeProfile.name})
              </h3>
              <p className="text-xs text-zinc-400 font-mono">
                Store authorized intelligence API keys (Shodan, Censys, Hunter.io, VirusTotal) securely per profile.
              </p>
            </div>

            <button
              onClick={() => setIsAddKeyOpen(true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-mono font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-[0_0_12px_rgba(220,38,38,0.4)] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add API Key
            </button>
          </div>

          {activeProfile.apiKeys.length === 0 ? (
            <div className="p-10 text-center space-y-3 font-mono border border-dashed border-zinc-800 rounded-xl">
              <Key className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="text-sm text-zinc-300 font-bold">No API Keys Associated with this Profile</p>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Add keys for OSINT reconnaissance services like Shodan, Censys, or Hunter to authorize live querying.
              </p>
              <button
                onClick={() => setIsAddKeyOpen(true)}
                className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-red-400 border border-zinc-800 rounded text-xs font-bold"
              >
                + Add First API Key
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
              {activeProfile.apiKeys.map((keyEntry) => {
                const isRevealed = revealedKeys[keyEntry.id];
                return (
                  <div
                    key={keyEntry.id}
                    className="p-4 bg-black border border-zinc-850 rounded-xl space-y-3 hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-red-950/80 border border-red-800 text-red-400 rounded text-[11px] font-bold uppercase">
                          {keyEntry.service}
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          Added {new Date(keyEntry.addedAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleKeyReveal(keyEntry.id)}
                          className="p-1 text-zinc-400 hover:text-zinc-200"
                          title={isRevealed ? 'Mask key' : 'Reveal key'}
                        >
                          {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => copyKey(keyEntry.key, keyEntry.id)}
                          className="p-1 text-zinc-400 hover:text-zinc-200"
                          title="Copy API key"
                        >
                          {copiedKeyId === keyEntry.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleDeleteApiKey(keyEntry.id)}
                          className="p-1 text-zinc-500 hover:text-red-400"
                          title="Remove key"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="p-2.5 bg-zinc-950 border border-zinc-900 rounded font-mono text-xs break-all">
                      <span className="text-zinc-300 select-all font-bold">
                        {isRevealed ? keyEntry.key : maskKey(keyEntry.key)}
                      </span>
                    </div>

                    {keyEntry.description && (
                      <p className="text-[11px] text-zinc-500">
                        {keyEntry.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Add Key Inline Form Modal */}
          {isAddKeyOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="bg-[#0a0a0a] border border-red-900/60 rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-red-500" />
                    <h3 className="text-sm font-bold font-mono text-zinc-100 uppercase">
                      Add New API Key Credential
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsAddKeyOpen(false)}
                    className="text-zinc-500 hover:text-zinc-300 font-mono text-xs"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleAddApiKey} className="space-y-3 font-mono text-xs">
                  <div>
                    <label className="block text-zinc-400 mb-1">Target Intelligence Service:</label>
                    <select
                      value={keyService}
                      onChange={(e) => setKeyService(e.target.value as any)}
                      className="w-full px-3 py-2 bg-black border border-zinc-800 rounded text-zinc-100 focus:outline-none focus:border-red-500"
                    >
                      <option value="Shodan">Shodan (Host & Port Recon)</option>
                      <option value="Censys">Censys (SSL & Certificate Search)</option>
                      <option value="Hunter">Hunter.io (Domain Personnel OSINT)</option>
                      <option value="VirusTotal">VirusTotal (Threat Intelligence)</option>
                      <option value="Custom">Custom Service API</option>
                    </select>
                  </div>

                  {keyService === 'Custom' && (
                    <div>
                      <label className="block text-zinc-400 mb-1">Custom Service Name:</label>
                      <input
                        type="text"
                        value={customServiceName}
                        onChange={(e) => setCustomServiceName(e.target.value)}
                        placeholder="e.g. SecurityTrails, BinaryEdge"
                        className="w-full px-3 py-2 bg-black border border-zinc-800 rounded text-zinc-100 focus:outline-none focus:border-red-500"
                        required
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-zinc-400 mb-1">API Secret Key / Token:</label>
                    <input
                      type="password"
                      value={keyValue}
                      onChange={(e) => setKeyValue(e.target.value)}
                      placeholder="Paste your API key here..."
                      className="w-full px-3 py-2 bg-black border border-zinc-800 rounded text-zinc-100 focus:outline-none focus:border-red-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">Description / Project Scope (Optional):</label>
                    <input
                      type="text"
                      value={keyDescription}
                      onChange={(e) => setKeyDescription(e.target.value)}
                      placeholder="e.g. Primary production scanner token"
                      className="w-full px-3 py-2 bg-black border border-zinc-800 rounded text-zinc-100 focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-850">
                    <button
                      type="button"
                      onClick={() => setIsAddKeyOpen(false)}
                      className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded font-bold shadow-[0_0_12px_rgba(220,38,38,0.5)]"
                    >
                      Store Key in Vault
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SUBTAB 3: ALL USER PROFILES MANAGEMENT & SWITCHER
      ───────────────────────────────────────────────────────────── */}
      {managerTab === 'all-profiles' && (
        <div className="bg-[#0a0a0a] border border-red-900/30 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
            <div>
              <h3 className="text-sm font-bold font-mono text-zinc-100 uppercase flex items-center gap-2">
                <User className="w-4 h-4 text-red-500" />
                Saved Operator Profiles Directory
              </h3>
              <p className="text-xs text-zinc-400 font-mono">
                Switch profiles to instantly load stored engagement IDs, API keys, and operational defaults.
              </p>
            </div>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white font-mono font-bold text-xs rounded shadow flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Create Profile
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            {profiles.map((prof) => {
              const isActive = prof.id === activeProfileId;
              const boundEng = engagements.find(e => e.id === prof.engagementId);

              return (
                <div
                  key={prof.id}
                  className={`p-4 rounded-xl border transition-all space-y-3 ${
                    isActive 
                      ? 'bg-red-950/20 border-red-600/70 shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
                      : 'bg-black border-zinc-850 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-red-400">
                        {prof.avatarInitials}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-zinc-100">{prof.name}</h4>
                          {isActive && (
                            <span className="px-1.5 py-0.2 bg-red-600 text-white text-[9px] rounded font-bold">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-400">{prof.role}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {profiles.length > 1 && !isActive && (
                        <button
                          onClick={() => onDeleteProfile(prof.id)}
                          className="p-1 text-zinc-600 hover:text-red-400"
                          title="Delete profile"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-2.5 bg-zinc-950 border border-zinc-900 rounded space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Linked Engagement:</span>
                      <span className="text-red-400 font-bold">{prof.engagementId} {boundEng ? `(${boundEng.clientName})` : ''}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Keys Configured:</span>
                      <span className="text-amber-400">{prof.apiKeys.length} services</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">LHOST / Target:</span>
                      <span className="text-zinc-300">{prof.config.shellIp}:{prof.config.shellPort} • {prof.config.scannerTarget || 'None'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-zinc-600">
                      Updated {new Date(prof.updatedAt).toLocaleDateString()}
                    </span>

                    <div className="flex gap-2">
                      <button
                        onClick={() => onSaveCurrentToProfile(prof.id)}
                        className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded text-[11px] border border-zinc-800 cursor-pointer"
                        title="Save active workspace settings to this profile"
                      >
                        Save Current
                      </button>

                      <button
                        onClick={() => onSelectProfile(prof)}
                        disabled={isActive}
                        className={`px-3 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                          isActive 
                            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                            : 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_10px_rgba(220,38,38,0.4)]'
                        }`}
                      >
                        {isActive ? 'Loaded' : 'Load Profile'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create Profile Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0a0a0a] border border-red-900/60 rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-red-500" />
                <h3 className="text-sm font-bold font-mono text-zinc-100 uppercase">
                  Create New Operator Profile
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 font-mono text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProfileSubmit} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Profile Name:</label>
                <input
                  type="text"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  placeholder="e.g. Cloud Perimeter Red Team"
                  className="w-full px-3 py-2 bg-black border border-zinc-800 rounded text-zinc-100 focus:outline-none focus:border-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Operator Role / Title:</label>
                <input
                  type="text"
                  value={newProfileRole}
                  onChange={(e) => setNewProfileRole(e.target.value)}
                  placeholder="e.g. Lead Penetration Tester"
                  className="w-full px-3 py-2 bg-black border border-zinc-800 rounded text-zinc-100 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Bind Initial Engagement Scope:</label>
                <select
                  value={newProfileEngagementId}
                  onChange={(e) => setNewProfileEngagementId(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-zinc-800 rounded text-zinc-100 focus:outline-none focus:border-red-500"
                >
                  {engagements.map(eng => (
                    <option key={eng.id} value={eng.id}>
                      {eng.id} — {eng.clientName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-zinc-950 border border-zinc-850 rounded text-[11px] text-zinc-400">
                <span className="text-zinc-300 font-bold block mb-1">Workspace Snapshot:</span>
                This profile will be initialized with your active scanner target, reverse shell endpoints, and telemetry preferences.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-850">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded font-bold shadow-[0_0_12px_rgba(220,38,38,0.5)]"
                >
                  Initialize Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
