import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, finding, engagement, contextData } = body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      return NextResponse.json({
        success: false,
        error: "Internal Error: GEMINI_API_KEY is not configured. Please supply your API key in the AI Studio SettingsSecrets panel."
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    let systemInstruction = "You are a world-class cybersecurity security architect, authorized compliance assessor and lead penetration tester.";
    let prompt = "";

    if (action === "remediate") {
      systemInstruction += " Your task is to provide real, functional secure code snippets or server configuration adjustments to fix a specific security finding.";
      prompt = `
        Draft a high-quality mitigation strategy and complete production-ready secure code remediation recipe for the following security vulnerability finding:
        
        CRITERIA:
        - Scope: ${finding.scope || "Client Infrastructure Target"}
        - Vulnerability Title: ${finding.title}
        - Severity: ${finding.severity.toUpperCase()}
        - Core Description: ${finding.description}
        - Current Recommended Fix Action: ${finding.recommendation}

        Please structure your response back in strict Markdown format:
        1. **Vulnerability Analysis**: Explain the technical root-cause (1-2 sentences)
        2. **Risk Classification**: Estimate CVSS v3 score metrics, STRIDE classification, and DREAD index.
        3. **Authorized Remediation Blueprint**: Provide real, concrete, unmocked code snippets, configuration lines or API middleware adjustments (e.g., TS/JS, Nginx, or Web application response headers depending on target).
        4. **Compliance Cross-Reference Mapping**: Detail list of target checks verified under ${engagement?.complianceFramework || "SOC2 / HIPAA / PCI-DSS"}.
      `;
    } else if (action === "simulate-threats") {
      systemInstruction += " Your task is to generate actionable advanced diagnostic test parameters, simulated threat attack trees, and specific continuous monitoring checkpoints.";
      prompt = `
        Compose a full Threat Modeling & Penetration Testing assessment procedure for the target scope: ${engagement?.clientName || "Registered Client"}.
        
        Context Specs:
        - Target Host Scopes: ${JSON.stringify(engagement?.scope || [])}
        - Compliance Criteria: ${engagement?.complianceFramework}
        - Security Grade Class: ${engagement?.securityClass}
        
        Return an authorized diagnostic protocol containing:
        1. **Simulated Threat Scenerios Tree**: List 3 specific theoretical attack vectors mapped directly to MITRE ATT&CK (e.g. initial target reconnaissance down to privilege escalation).
        2. **Automated Audit Check Script Suggestion**: Draft an illustrative code-free pseudo-bash or mock Node request script that checks the target endpoint for missing baseline headers or incorrect resource sharing origins.
        3. **Security Health Metrics checklist**: Grade from 1 to 10 what the overall posture should be under safe testing guidelines.
      `;
    } else {
      // Default report generation
      systemInstruction += " Your task is to synthesize all active engagement data into a comprehensive Executive Summary Assessment Report.";
      prompt = `
        Synthesize a Professional Compliance Executive Summary Assessment Report for ${engagement?.clientName}.
        
        Details:
        - Engagement ID: ${engagement?.id}
        - Selected Compliance Framework: ${engagement?.complianceFramework}
        - Security Class: ${engagement?.securityClass}
        - Scope Targets: ${JSON.stringify(engagement?.scope)}
        - Number of Identified Findings: ${contextData?.findingsCount || 0}
        
        Draft a beautiful markdown executive report with the following headers:
        1. **EXECUTIVE DECLARATION SUMMARY**
        2. **IMPACT AND RISK LANDSCAPE MATRIX**
        3. **RECOMMENDED RESOLUTION NEXT STEPS**
        4. **COMPLIANCE CONFORMANCE FOOTPRINT**
      `;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.2
      }
    });

    return NextResponse.json({
      success: true,
      text: response.text
    });

  } catch (error: any) {
    console.error("Gemini API server error:", error);
    return NextResponse.json({
      success: false,
      error: error?.message || "Internal compliance reasoning endpoint failure."
    });
  }
}
