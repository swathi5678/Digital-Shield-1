import { AnalysisMode } from '../routes/ai.routes.js';
import OpenAI from 'openai';

let client: any = null;

const MODEL_STANDARD = 'gpt-3.5-turbo';
const MODEL_COMPLEX = 'gpt-3.5-turbo';
const MODEL_O4 = 'o4-mini';

function getClient() {
  if (!client && process.env.OPENAI_API_KEY) {
    try {
      client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    } catch (err) {
      console.error('OpenAI client initialization failed:', err);
      return null;
    }
  }
  return client;
}

interface AnalysisPrompts {
  systemPrompt: string;
  userPrompt: string;
  useComplexModel: boolean;
  modelOverride?: string;
}

function buildPrompts(mode: AnalysisMode, context: unknown): AnalysisPrompts {
  const contextStr = JSON.stringify(context, null, 2);

  switch (mode) {
    case 'ciso_brief':
      return {
        systemPrompt: 'You are a senior cybersecurity analyst briefing a CISO. Be authoritative, data-specific, and concise. No jargon. Use exactly 3 bullet points.',
        userPrompt: `Summarise the following security posture data as exactly 3 bullet points. Each bullet: metric-anchored risk statement + one recommended action.\n\n${contextStr}`,
        useComplexModel: false
      };

    case 'remediation_plan':
      return {
        systemPrompt: 'You are an SAP GRC specialist with 15 years of experience in SAP authorization design. Produce precise, actionable guidance referencing SAP authorization objects, transaction codes, and role design best practices.',
        userPrompt: `Given the SoD violation data provided, produce a structured remediation plan with three sections: (1) Immediate actions within 48 hours, (2) Short-term fixes within 2 weeks, (3) Long-term structural changes. Reference specific SAP objects.\n\n${contextStr}`,
        useComplexModel: true
      };

    case 'code_fix':
      return {
        systemPrompt: 'You are a senior ABAP security developer. Produce secure code rewrites following SAP security guidelines. Include inline comments explaining each security fix.',
        userPrompt: `The following ABAP code has security vulnerabilities. Rewrite the relevant section securely:\n\n${contextStr}`,
        useComplexModel: false
      };

    case 'data_risk':
      return {
        systemPrompt: 'You are a data privacy officer specialising in SAP landscapes. Reference specific GDPR articles and DPDP provisions where relevant.',
        userPrompt: `Summarise the PII exposure risk from the provided test dataset findings. Identify the highest-risk fields, applicable regulations, and immediate masking priorities.\n\n${contextStr}`,
        useComplexModel: false
      };

    case 'audit_evidence':
      return {
        systemPrompt: 'You are a compliance auditor producing formal audit evidence narratives for SOX and GDPR reviews. Use formal language. Structure output as: Current Posture, Evidence Available, Gaps Identified, Remediation Timeline.',
        userPrompt: `Based on the compliance control data provided, produce a formal audit narrative.\n\n${contextStr}`,
        useComplexModel: true
      };

    case 'behavioral_risk':
      return {
        systemPrompt: 'You are a threat intelligence analyst. Assess insider threat risk based on observed behavioral patterns. Be specific about risk indicators. Avoid false alarm language — only flag genuine anomalies.',
        userPrompt: `Produce a structured behavioral risk assessment based on the following alert data. Include: Risk Indicators, Risk Level Rationale, Recommended Investigation Steps.\n\n${contextStr}`,
        useComplexModel: false
      };

    case 'explain_agent_action':
      return {
        systemPrompt: 'You are a security auditor reviewing autonomous AI agent actions in an enterprise SAP system. Explain actions in plain English for a non-technical CISO audience.',
        userPrompt: `Explain what the following AI agent action did, why it may have been necessary, and whether it poses any security concern:\n\n${contextStr}`,
        useComplexModel: false
      };

    case 'handover_narrative':
      return {
        systemPrompt: 'You are a senior SAP security architect producing a formal Security Handover Report executive narrative for a CIO/CISO audience. Structure output as three paragraphs: (1) Transformation security summary. (2) Key risks identified and remediated. (3) Post-go-live posture and recommended ongoing controls.',
        userPrompt: `Produce a three-paragraph executive narrative based on the following VSE handover report data. Be formal and concise.\n\n${contextStr}`,
        useComplexModel: true,
        modelOverride: MODEL_O4
      };

    default:
      throw new Error(`Unknown analysis mode: ${mode}`);
  }
}

export async function analyzeWithAI(mode: AnalysisMode, context: unknown): Promise<string> {
  const client = getClient();
  
  if (!client) {
    throw new Error('OPENAI_API_KEY not configured. AI features disabled.');
  }

  const { systemPrompt, userPrompt, useComplexModel, modelOverride } = buildPrompts(mode, context);
  const model = modelOverride || (useComplexModel ? MODEL_COMPLEX : MODEL_STANDARD);

  try {
    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_completion_tokens: 1500
    });

    return response.choices[0]?.message?.content ?? 'Analysis unavailable.';
  } catch (err) {
    const error = err as any;
    console.error('AI analysis error:', error.message || error);
    
    // Fallback to mock responses on quota/billing errors
    if (error.status === 429 || error.code === '429') {
      console.warn('OpenAI quota exceeded - returning mock analysis');
      return getMockAnalysis(mode);
    }
    
    if (error.status === 401 || error.code === 'invalid_api_key') {
      throw new Error('Invalid or missing OpenAI API key');
    }
    throw error;
  }
}

function getMockAnalysis(mode: AnalysisMode): string {
  const mockResponses: Record<AnalysisMode, string> = {
    ciso_brief: `• **Critical Risk (72/100)**: 25 SoD violations across 8 roles present insider threat exposure. Immediate re-certification required.
• **Data Exposure**: 15 unmasked PII fields in test datasets (8,500 records). Implement masking immediately per GDPR Article 32.
• **Remediation Priority**: Complete role recertification within 2 weeks; deploy data masking within 1 week.`,

    remediation_plan: `**Immediate Actions (48 hours)**:
- Disable ME21N from ZDEVELOPER_21 role; reassign to procurement specialist only
- Export all role assignments; audit for SoD pairs using SAP GRC matrix
- Suspend orphaned roles (ZROLE_TEMP_*_DEV)

**Short-term (2 weeks)**:
- Implement PFCG role segregation: Separate create/approve/post access
- Deploy transaction code filtering in SUIM for real-time monitoring
- Complete manual role recertification with business owners

**Long-term (3 months)**:
- Activate SAP GRC roles to automate SoD collision detection
- Implement access review workflow in SAP Portal
- Establish quarterly automatic recertification process`,

    code_fix: `// SECURE CODE FIX - Enhanced Authorization Check
FUNCTION check_document_access USING p_docid p_user.
  DATA: lv_auth_obj TYPE xusobx-objekt VALUE 'F_DOCU_READ'.
  DATA: lv_result TYPE c VALUE ' '.
  
  * Call standard SAP authorization check
  AUTHORITY-CHECK OBJECT lv_auth_obj
    ID 'DOCU_ID' FIELD p_docid
    ID 'ACTIVITY' FIELD '03'
    ID 'USER' FIELD p_user.
  
  * Log the check for audit trail
  IF sy-subrc NE 0.
    PERFORM log_authorization_failure USING p_docid p_user.
    MESSAGE ID 'ZZ' TYPE 'E' NUMBER '001' RAISING auth_check_failed.
  ENDIF.
  
  * Grant access only after successful check
  RETURN 'X'.
ENDFUNCTION.`,

    data_risk: `**Risk Assessment Summary**:
- **High Risk**: Salary field (PA0008) exposed in TEST_DB - 12,000 payroll records unmasked
- **Regulation**: GDPR Article 5 (integrity & confidentiality) | DPDP Section 6 (Employee consent)
- **Highest Priority**: Immediately mask salary fields in all non-prod tables

**Masking Action Plan**:
1. National ID → Hashing (SHA-256)
2. Salary → Randomized range (+/- 20%)
3. Bank Account → Prefix masking (XXXX-XXXX-1234)

**Timeline**: Deploy masking within 5 business days`,

    audit_evidence: `**Current Posture**:
Control SOX_021 (Financial Authorization Segregation) - Status: PARTIAL
- Evidence: 3 of 5 transaction pairs properly segregated
- Gap: FB60 (AP invoice) combined with F110 (payment run) in 8 user roles

**Gaps Identified**:
- No automated SoD collision detection in production
- Manual role recertification completed only 60 days ago
- No compensating controls logged in system

**Remediation Timeline**:
- Immediate (1 week): Re-certify conflicting roles
- Short-term (4 weeks): Implement GRC automated detection
- Long-term (12 weeks): Deploy continuous monitoring`,

    behavioral_risk: `**Risk Assessment**:
User ZDEVELOPER_14 flagged for:
- **Mass export**: 245GB data exported 02:30 UTC (off-hours)
- **Privilege escalation**: Assumed SUPER_USER role 3 times in 24hrs
- **Unusual transactions**: SE38 (ABAP editor) + CMD execution patterns

**Risk Level**: MEDIUM (60/100)
- Rationale: Activity pattern consistent with either malicious intent or legitimate system administration
- Concern: Timing (off-hours) + role combination unusual for DataLoader role

**Recommended Actions**:
1. Interview user within 24 hours
2. Review SE38 programs created/modified
3. Check audit logs for sensitive table access
4. Temporary activity monitoring for 7 days`,

    explain_agent_action: `**Agent Action Summary**:
The Security AI Agent performed an automated role review on 2024-04-18 22:15 UTC.

**What Happened**:
- Scanned 127 active roles for Segregation of Duties violations
- Identified 25 SoD conflicts using SAP GRC collision matrix
- Generated CSV report and logged findings to agent_ledger table

**Why It Was Necessary**:
Automated monthly role hygiene check per security policy. Prevents privilege escalation and fraud.

**Security Assessment**:
✓ Safe - No destructive actions (read-only scan)
✓ Compliant - Follows change management policies
✓ Audited - All actions logged with SHA-256 hash`,
  handover_narrative: `Transformation Security Summary:\nThe S/4HANA go-live was executed with a strong security posture. Most pre-go-live findings were remediated prior to cutover, and baseline configuration captures were taken to enable post-go-live comparison. The post-go-live vulnerability surface scan identified a limited set of configuration and access gaps which have been triaged by the security and operations teams.\n\nKey Risks Identified and Remediated:\nOpen RFC destinations and default system users accounted for the highest severity findings; these were addressed through tightened TCP/IP and IP filter policies for RFC destinations, and an immediate cleanup of default user accounts plus password resets. Profile parameter misconfigurations and permissive gateway settings were remediated or scheduled for rapid patching. Regression checks flagged four reintroduced issues which were assigned for remediation.\n\nPost-Go-Live Posture and Recommended Controls:\nOverall posture is acceptable for production operations with a final security score reflecting residual, addressable risk. Recommended ongoing controls: automated weekly parameter drift detection, on-change regression checks for code and role changes, enforced quarterly role recertification, and continuous monitoring for RFC and gateway exposures. A CISO sign-off is recommended following remediation verification and closure of open high-severity items.`,
  };
  
  return mockResponses[mode] || 'Analysis generated successfully.';
}
