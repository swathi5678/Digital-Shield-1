import { Router, Response } from 'express';
import { getDatabase } from '../db/connection.js';
import { AuthRequest, verifyAuth, requireRole } from '../middleware/auth.middleware.js';
import { AgentLedgerService } from '../services/agl.service.js';
import { CompliancePostureService } from '../services/cpm.service.js';

const router = Router();

router.post('/projects/:id/compliance/assess', verifyAuth, requireRole('ciso', 'project_manager', 'security_analyst'), (req: AuthRequest, res: Response): void => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    const result = new CompliancePostureService(db).assessProject(id);

    new AgentLedgerService(db).appendAction({
      projectId: id,
      agentName: 'CompliancePostureMapper',
      actionType: 'compliance_assessment',
      targetObject: 'compliance_controls',
      actionSummary: `Generated ${result.controlsAssessed} automated compliance control assessment(s).`,
      dataAccessed: result.metrics,
      outcome: 'success',
      riskLevel: result.controls.some((control) => control.status === 'non_compliant') ? 'high' : 'low',
      userId: req.user?.id
    });

    res.json({
      success: true,
      message: `Generated ${result.controlsAssessed} compliance assessments from runtime findings`,
      ...result
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to assess compliance posture' });
  }
});

router.get('/projects/:id/compliance', verifyAuth, (req: AuthRequest, res: Response): void => {
  try {
    const { id } = req.params;
    const { framework } = req.query;
    const db = getDatabase();

    let query = 'SELECT * FROM compliance_controls WHERE project_id = ?';
    const params: any[] = [id];

    if (framework && framework !== '') {
      query += ' AND framework = ?';
      params.push(framework);
    }

    query += ' ORDER BY framework, control_id';

    const controls = db.prepare(query).all(...params);
    res.json(controls);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch controls' });
  }
});

router.patch('/projects/:id/compliance/:cid', verifyAuth, requireRole('ciso', 'project_manager'), (req: AuthRequest, res: Response): void => {
  try {
    const { id, cid } = req.params;
    const { status, evidence } = req.body;
    const db = getDatabase();

    if (!['compliant', 'non_compliant', 'partial', 'not_assessed'].includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    const updates = ['status = ?'];
    const values: any[] = [status];

    if (evidence) {
      updates.push('evidence = ?');
      values.push(evidence);
    }

    updates.push('last_assessed = datetime("now")');
    values.push(cid, id);

    db.prepare(`UPDATE compliance_controls SET ${updates.join(', ')} WHERE id = ? AND project_id = ?`).run(...values);
    const control = db.prepare('SELECT * FROM compliance_controls WHERE id = ?').get(cid);

    res.json(control);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update control' });
  }
});

export default router;
