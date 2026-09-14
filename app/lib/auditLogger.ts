import { AuditLog, AuditLogCategory, AuditLogSeverity } from '../types';

// Fast reproducible checksum for tamper-evident audit logging
export function generateLogChecksum(
  id: string,
  timestamp: string,
  category: string,
  action: string,
  operator: string,
  details: string
): string {
  const str = `${id}:${timestamp}:${category}:${action}:${operator}:${details}:HELIX_SEC_INTEGRITY_SALT`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `0x${hex.toUpperCase()}`;
}

export function createAuditEntry(
  category: AuditLogCategory,
  action: string,
  details: string,
  options?: {
    severity?: AuditLogSeverity;
    operator?: string;
    target?: string;
    metadata?: Record<string, any>;
  }
): AuditLog {
  const id = `AUD-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
  const timestamp = new Date().toISOString();
  const severity = options?.severity || 'info';
  const operator = options?.operator || 'operator@redops (secops-authorized)';
  const target = options?.target;
  const metadata = options?.metadata;

  const checksum = generateLogChecksum(id, timestamp, category, action, operator, details);

  return {
    id,
    timestamp,
    category,
    action,
    severity,
    operator,
    details,
    target,
    metadata,
    checksum
  };
}

export const initialAuditLogs: AuditLog[] = [
  {
    id: 'AUD-INIT-001',
    timestamp: '2026-08-01T10:00:00.000Z',
    category: 'SYSTEM_EVENT',
    action: 'SYSTEM_BOOT',
    severity: 'info',
    operator: 'system:daemon',
    details: 'HELIX RED-OPS Core Kernel initialized on Node Port 3000. TLS 1.3 listener bound to all network interfaces.',
    target: '127.0.0.1:3000',
    metadata: { version: '4.2.0', environment: 'production-secure' },
    checksum: '0x3F8A91B2'
  },
  {
    id: 'AUD-AUTH-002',
    timestamp: '2026-08-01T10:05:12.000Z',
    category: 'AUTHENTICATION',
    action: 'OPERATOR_LOGIN',
    severity: 'info',
    operator: 'operator@redops',
    details: 'Operator session authenticated with valid cryptographic token for client Runehall Global Infrastructure.',
    target: 'api.runehall.com',
    metadata: { method: 'Bearer-Token', authLevel: 'Secret' },
    checksum: '0x992B1C4D'
  },
  {
    id: 'AUD-ACT-003',
    timestamp: '2026-08-20T11:20:00.000Z',
    category: 'OPERATIONAL_OUTPUT',
    action: 'FINDING_DOCUMENTED',
    severity: 'warn',
    operator: 'operator@redops',
    details: 'Identified High-severity CORS misconfiguration with Access-Control-Allow-Credentials: true on api.runehall.com.',
    target: 'api.runehall.com',
    metadata: { findingId: 'FIND-8812', cvss: '7.8' },
    checksum: '0x71E42A8F'
  },
  {
    id: 'AUD-SEC-004',
    timestamp: '2026-08-25T14:45:00.000Z',
    category: 'SECURITY_ALERT',
    action: 'VULN_EXPLOIT_DETECTED',
    severity: 'critical',
    operator: 'operator@redops',
    details: 'Critical Actuator environment leak confirmed on auth.runehall.com. Exposed DB connection strings.',
    target: 'auth.runehall.com',
    metadata: { findingId: 'FIND-9104', cvss: '9.4' },
    checksum: '0x5C80FE11'
  },
  {
    id: 'AUD-SYS-005',
    timestamp: '2026-09-01T08:30:00.000Z',
    category: 'USER_ACTION',
    action: 'HANDSHAKE_ESTABLISHED',
    severity: 'info',
    operator: 'operator@redops',
    details: 'Cryptographic challenge-response handshake verified for ENG-RUN-9021. Session leased for 24 hours.',
    target: 'ENG-RUN-9021',
    metadata: { engagementId: 'ENG-RUN-9021', leaseExpiry: '24h' },
    checksum: '0x882A31FF'
  }
];

export function exportAuditLogsToJSON(logs: AuditLog[]): void {
  const jsonStr = JSON.stringify(logs, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `HELIX_Audit_Logs_${new Date().toISOString().substring(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportAuditLogsToCSV(logs: AuditLog[]): void {
  const headers = ['ID', 'Timestamp', 'Category', 'Severity', 'Action', 'Operator', 'Target', 'Details', 'Checksum'];
  const rows = logs.map(l => [
    `"${l.id}"`,
    `"${l.timestamp}"`,
    `"${l.category}"`,
    `"${l.severity}"`,
    `"${l.action}"`,
    `"${l.operator}"`,
    `"${(l.target || '').replace(/"/g, '""')}"`,
    `"${l.details.replace(/"/g, '""')}"`,
    `"${l.checksum}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `HELIX_Audit_Logs_${new Date().toISOString().substring(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
