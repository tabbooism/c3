import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Server-side database for authorized engagements
interface Engagement {
  id: string;
  clientName: string;
  scope: string[];
  type: string;
  status: "pending" | "established" | "terminated";
  securityClass: "Unclassified" | "Restricted" | "Confidential" | "Secret";
  complianceFramework: string;
  masterPasswordHash: string; // SHA-256 hash of the master password
  createdAt: string;
}

const defaultEngagements: Record<string, Engagement> = {
  "ENG-RUN-9021": {
    id: "ENG-RUN-9021",
    clientName: "Runehall Technologies",
    scope: ["api.runehall.com", "runehall.com", "staging.rh420.xyz"],
    type: "Infrastructure Penetration Test",
    status: "pending",
    securityClass: "Confidential",
    complianceFramework: "SOC2 Type II / NIST-800",
    masterPasswordHash: "6c9d783d8e577ab5e173ffb6173bc5f7783a45371fbb7fca09f0dae4bdbc8cfb",
    createdAt: "2026-06-10T10:00:00Z"
  },
  "ENG-FORT-2026": {
    id: "ENG-FORT-2026",
    clientName: "Fortress Financial Corp",
    scope: ["vault.fortress-bank.internal", "pay-api.fortress.com"],
    type: "Cryptographic Audit & API Assessment",
    status: "pending",
    securityClass: "Secret",
    complianceFramework: "PCI-DSS v4.0",
    masterPasswordHash: "cb8147d159dd822dcca93d18bfbe7b93df2351ba86c57fa7c40f5f24f4633af3",
    createdAt: "2026-05-18T14:30:00Z"
  }
};

function sha256(text: string) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const { engagementId, masterPassword } = await req.json();

    if (!engagementId || !masterPassword) {
      return NextResponse.json(
        { success: false, error: "Missing Engagement ID or Master Password" },
        { status: 400 }
      );
    }

    const trimmedId = String(engagementId).trim().toUpperCase();
    const cleanPassword = String(masterPassword).trim();

    // ADMIN OVERRIDE: Admin key 'monalisa' bypasses any constraints and unlocks all engagements
    const isAdminOverride = cleanPassword.toLowerCase() === "monalisa";

    let engagement = defaultEngagements[trimmedId];

    if (!engagement && isAdminOverride) {
      // Admin can synthesize or unlock any arbitrary engagement on the fly
      engagement = {
        id: trimmedId,
        clientName: `Admin Live Ops Scope (${trimmedId})`,
        scope: ["*", "0.0.0.0/0", "internal.network"],
        type: "Full-Spectrum Zero-Constraint Audit",
        status: "established",
        securityClass: "Secret",
        complianceFramework: "ALL (NIST, SOC2, PCI-DSS, ISO-27001)",
        masterPasswordHash: "",
        createdAt: new Date().toISOString()
      };
    } else if (!engagement) {
      return NextResponse.json(
        {
          success: false,
          error: "Engagement ID not registered. (Or provide Admin Key 'monalisa' to bypass)."
        },
        { status: 404 }
      );
    }

    if (!isAdminOverride) {
      const inputHash = sha256(cleanPassword);
      if (inputHash !== engagement.masterPasswordHash) {
        return NextResponse.json(
          {
            success: false,
            error: "Authenticity verification failed. Invalid master authorization credential."
          },
          { status: 401 }
        );
      }
    }

    // Handshake successful! Generate dynamic session keys
    const sessionToken = crypto.randomBytes(32).toString("hex");
    const handshakeHash = sha256(`${trimmedId}:${cleanPassword}:${sessionToken}`);

    return NextResponse.json({
      success: true,
      message: isAdminOverride 
        ? "ADMIN GOD MODE: Zero-Constraint Handshake Authorized (Key: monalisa)"
        : "Handshake established. Cryptographic credentials verified.",
      adminOverride: isAdminOverride,
      session: {
        token: sessionToken,
        handshakeHash: handshakeHash,
        verifiedAt: new Date().toISOString(),
        role: isAdminOverride ? "ROOT_SUPERUSER" : "OPERATOR"
      },
      engagement: {
        id: engagement.id,
        clientName: engagement.clientName,
        type: engagement.type,
        scope: engagement.scope,
        securityClass: engagement.securityClass,
        complianceFramework: engagement.complianceFramework,
        status: "established" as const,
        createdAt: engagement.createdAt
      }
    });

  } catch (error: any) {
    console.error("Handshake handler error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server handshake negotiation failure." },
      { status: 500 }
    );
  }
}
