import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { MockDatabase } from '../db/schema.js';

export type AgentOutcome = 'success' | 'partial' | 'failed' | 'blocked';
export type AgentRiskLevel = 'none' | 'low' | 'medium' | 'high';

export interface AgentActionInput {
  projectId: string;
  agentName: string;
  actionType: string;
  targetObject: string;
  actionSummary: string;
  dataAccessed?: unknown;
  outcome: AgentOutcome;
  riskLevel: AgentRiskLevel;
  userId?: string;
}

export class AgentLedgerService {
  constructor(private db: MockDatabase) {}

  appendAction(input: AgentActionInput) {
    const executedAt = new Date().toISOString();
    const dataAccessed = typeof input.dataAccessed === 'string'
      ? input.dataAccessed
      : JSON.stringify(input.dataAccessed || {});

    const hash = createHash('sha256')
      .update(JSON.stringify({ ...input, dataAccessed, executedAt }))
      .digest('hex');

    const entry = {
      id: uuidv4(),
      project_id: input.projectId,
      agent_name: input.agentName,
      action_type: input.actionType,
      target_object: input.targetObject,
      action_summary: input.actionSummary,
      data_accessed: dataAccessed,
      outcome: input.outcome,
      risk_level: input.riskLevel,
      user_id: input.userId || null,
      hash,
      executed_at: executedAt
    };

    this.db.prepare(`INSERT INTO agent_ledger (id, project_id, agent_name, action_type, target_object, action_summary, data_accessed, outcome, risk_level, user_id, hash, executed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      entry.id,
      entry.project_id,
      entry.agent_name,
      entry.action_type,
      entry.target_object,
      entry.action_summary,
      entry.data_accessed,
      entry.outcome,
      entry.risk_level,
      entry.user_id,
      entry.hash,
      entry.executed_at
    );

    return entry;
  }
}
