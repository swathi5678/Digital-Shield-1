import { Router, Response } from 'express';
import { getDatabase } from '../db/connection.js';
import { AuthRequest, verifyAuth, requireRole } from '../middleware/auth.middleware.js';
import { AgentLedgerService } from '../services/agl.service.js';

const router = Router();

router.post('/projects/:id/agent-ledger', verifyAuth, requireRole('ciso', 'security_analyst', 'project_manager'), (req: AuthRequest, res: Response): void => {
  try {
    const { id } = req.params;
    const { agent_name, agentName, action_type, actionType, target_object, targetObject, action_summary, actionSummary, data_accessed, dataAccessed, outcome, risk_level, riskLevel } = req.body;

    const entry = new AgentLedgerService(getDatabase()).appendAction({
      projectId: id,
      agentName: String(agent_name || agentName || 'RuntimeAgent'),
      actionType: String(action_type || actionType || 'manual_action'),
      targetObject: String(target_object || targetObject || 'unspecified'),
      actionSummary: String(action_summary || actionSummary || 'Runtime agent action recorded'),
      dataAccessed: data_accessed || dataAccessed || {},
      outcome: ['success', 'partial', 'failed', 'blocked'].includes(outcome) ? outcome : 'success',
      riskLevel: ['none', 'low', 'medium', 'high'].includes(risk_level || riskLevel) ? risk_level || riskLevel : 'low',
      userId: req.user?.id
    });

    res.status(201).json({ success: true, entry });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to append ledger entry' });
  }
});

router.get('/projects/:id/agent-ledger', verifyAuth, (req: AuthRequest, res: Response): void => {
  try {
    const { id } = req.params;
    const { agent_name, risk_level, date_from, date_to } = req.query;
    const db = getDatabase();

    let query = 'SELECT * FROM agent_ledger WHERE project_id = ?';
    const params: any[] = [id];

    if (agent_name && agent_name !== '') {
      query += ' AND agent_name = ?';
      params.push(agent_name);
    }

    if (risk_level && risk_level !== '') {
      query += ' AND risk_level = ?';
      params.push(risk_level);
    }

    if (date_from) {
      query += ' AND executed_at >= ?';
      params.push(date_from);
    }

    if (date_to) {
      query += ' AND executed_at <= ?';
      params.push(date_to);
    }

    query += ' ORDER BY executed_at DESC';

    const entries = db.prepare(query).all(...params);
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch ledger' });
  }
});

router.get('/projects/:id/agent-ledger/export', verifyAuth, requireRole('ciso', 'auditor'), (req: AuthRequest, res: Response): void => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    const entries = db.prepare('SELECT * FROM agent_ledger WHERE project_id = ? ORDER BY executed_at DESC').all(id);

    res.header('Content-Type', 'application/json');
    res.header('Content-Disposition', `attachment; filename="agent-ledger-${id}.json"`);
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: 'Failed to export ledger' });
  }
});

export default router;
