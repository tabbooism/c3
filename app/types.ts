export type SecurityClass = "Unclassified" | "Restricted" | "Confidential" | "Secret";
export type EngagementStatus = "pending" | "established" | "terminated";

export interface Engagement {
  id: string;
  clientName: string;
  scope: string[];
  type: string;
  status: EngagementStatus;
  securityClass: SecurityClass;
  complianceFramework: string;
  masterPasswordHash?: string; // Stored hash for verification
  // Storing plaintext password on client-created purely for local-handshake convenience
  localPassword?: string; 
  createdAt: string;
}

export interface Finding {
  id: string;
  engagementId: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  recommendation: string;
  status: "open" | "resolved";
  discoveredAt: string;
}

export interface HandshakeSession {
  engagementId: string;
  token: string;
  handshakeHash: string;
  verifiedAt: string;
}

export type AuditLogCategory = 
  | "USER_ACTION" 
  | "SYSTEM_EVENT" 
  | "OPERATIONAL_OUTPUT" 
  | "SECURITY_ALERT" 
  | "AUTHENTICATION" 
  | "PROFILE_OPS";

export type AuditLogSeverity = "info" | "warn" | "error" | "critical";

export interface AuditLog {
  id: string;
  timestamp: string;
  category: AuditLogCategory;
  action: string;
  severity: AuditLogSeverity;
  operator: string;
  details: string;
  target?: string;
  metadata?: Record<string, any>;
  checksum: string;
}

export interface ApiKeyEntry {
  id: string;
  service: string; // e.g. "Shodan", "Censys", "Hunter", "VirusTotal", "Custom"
  key: string;
  description?: string;
  addedAt: string;
}

export interface UserProfileConfig {
  defaultScanType: "ports" | "headers" | "ssl" | "fuzz";
  defaultEncoder: "base64" | "hex" | "url" | "rot13" | "html";
  shellIp: string;
  shellPort: string;
  shellType: "bash" | "python" | "nc" | "powershell" | "php";
  webhookUrl: string;
  osintTarget?: string;
  scannerTarget?: string;
  autoLogAudits?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  role: string;
  avatarInitials: string;
  engagementId: string;
  apiKeys: ApiKeyEntry[];
  config: UserProfileConfig;
  createdAt: string;
  updatedAt: string;
  isDefault?: boolean;
}
