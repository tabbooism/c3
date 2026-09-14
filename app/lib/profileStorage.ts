import { UserProfile } from '../types';

export const initialUserProfiles: UserProfile[] = [
  {
    id: 'PROF-RED-01',
    name: 'Red-Team Lead Operator',
    role: 'Lead Offensive Security Specialist',
    avatarInitials: 'RO',
    engagementId: 'ENG-RUN-9021',
    isDefault: true,
    apiKeys: [
      {
        id: 'KEY-SHOD-01',
        service: 'Shodan',
        key: 'shod_live_9281bf094a821e290f',
        description: 'Perimeter port & banner discovery subscription',
        addedAt: '2026-08-01T10:00:00Z'
      },
      {
        id: 'KEY-CENS-01',
        service: 'Censys',
        key: 'cens_id_81092a48:cens_sec_410294ae09b',
        description: 'Global certificate & host inventory search API',
        addedAt: '2026-08-05T14:15:00Z'
      },
      {
        id: 'KEY-HUNT-01',
        service: 'Hunter.io',
        key: 'hunt_91048201a0bc19e88',
        description: 'OSINT personnel email & target domain reconnaissance',
        addedAt: '2026-08-10T09:30:00Z'
      }
    ],
    config: {
      defaultScanType: 'ports',
      defaultEncoder: 'base64',
      shellIp: '10.10.14.2',
      shellPort: '4444',
      shellType: 'bash',
      webhookUrl: 'https://siem-collector.internal/v1/alerts',
      scannerTarget: 'api.runehall.com',
      osintTarget: 'runehall.com',
      autoLogAudits: true
    },
    createdAt: '2026-08-01T10:00:00Z',
    updatedAt: '2026-08-25T16:00:00Z'
  },
  {
    id: 'PROF-AUDIT-02',
    name: 'Zero-Trust Compliance Assessor',
    role: 'Senior PCI-DSS & SOC2 Assessor',
    avatarInitials: 'ZT',
    engagementId: 'ENG-FORT-2026',
    isDefault: false,
    apiKeys: [
      {
        id: 'KEY-CENS-02',
        service: 'Censys',
        key: 'cens_id_339108a:cens_sec_9918231aa',
        description: 'SSL/TLS cipher validation inventory',
        addedAt: '2026-08-15T11:00:00Z'
      },
      {
        id: 'KEY-HUNT-02',
        service: 'Hunter.io',
        key: 'hunt_88291047fa1888992',
        description: 'Governance contact audit token',
        addedAt: '2026-08-16T12:00:00Z'
      }
    ],
    config: {
      defaultScanType: 'ssl',
      defaultEncoder: 'hex',
      shellIp: '192.168.100.5',
      shellPort: '8443',
      shellType: 'nc',
      webhookUrl: 'https://siem.fortress-bank.internal/events',
      scannerTarget: 'pay-api.fortress.com',
      osintTarget: 'fortress.com',
      autoLogAudits: true
    },
    createdAt: '2026-08-15T14:30:00Z',
    updatedAt: '2026-08-28T18:45:00Z'
  }
];

export function loadStoredProfiles(): UserProfile[] {
  if (typeof window === 'undefined') return initialUserProfiles;
  try {
    const raw = localStorage.getItem('helix_user_profiles_v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to parse user profiles from localStorage:', err);
  }
  return initialUserProfiles;
}

export function saveProfilesToStorage(profiles: UserProfile[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('helix_user_profiles_v1', JSON.stringify(profiles));
  } catch (err) {
    console.warn('Failed to save profiles to localStorage:', err);
  }
}
