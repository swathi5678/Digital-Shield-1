import { Router, Response } from 'express';
import { getDatabase } from '../db/connection.js';
import { AuthRequest, verifyAuth, requireRole } from '../middleware/auth.middleware.js';
import { AgentLedgerService } from '../services/agl.service.js';
import { BehavioralAnomalyService, BehaviorEvent } from '../services/bas.service.js';

const router = Router();

router.post('/projects/:id/behavioral-events/ingest', verifyAuth, requireRole('ciso', 'security_analyst', 'project_manager'), (req: AuthRequest, res: Response): void => {
  try {
    const { id } = req.params;
    const events = (Array.isArray(req.body.events) ? req.body.events : [req.body.event || req.body]) as BehaviorEvent[];

    if (!events.length || events.some((event) => !event.user_name)) {
      res.status(400).json({ error: 'Provide one or more events with user_name.' });
      return;
    }

    const db = getDatabase();
    const result = new BehavioralAnomalyService(db).ingestEvents(id, events);

    new AgentLedgerService(db).appendAction({
      projectId: id,
      agentName: 'BehavioralAnomalySentinel',
      actionType: 'behavioral_event_ingest',
      targetObject: 'behavioral_alerts',
      actionSummary: `Processed ${result.eventsProcessed} behavioral event(s) and created ${result.alertsCreated} alert(s).`,
      dataAccessed: { eventsProcessed: result.eventsProcessed },
      outcome: result.alertsCreated > 0 ? 'partial' : 'success',
      riskLevel: result.alerts.some((alert) => alert.severity === 'critical' || alert.severity === 'high') ? 'high' : 'low',
      userId: req.user?.id
    });

    res.json({
      success: true,
      message: `Processed ${result.eventsProcessed} behavioral events`,
      ...result
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to ingest behavioral events' });
  }
});

router.get('/projects/:id/behavioral-alerts', verifyAuth, (req: AuthRequest, res: Response): void => {
  try {
    const { id } = req.params;
    const { severity, alert_type, status } = req.query;
    const db = getDatabase();

    let query = 'SELECT * FROM behavioral_alerts WHERE project_id = ?';
    const params: any[] = [id];

    if (severity && severity !== '') {
      query += ' AND severity = ?';
      params.push(severity);
    }

    if (alert_type && alert_type !== '') {
      query += ' AND alert_type = ?';
      params.push(alert_type);
    }

    if (status && status !== '') {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY occurred_at DESC';

    const alerts = db.prepare(query).all(...params);
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

router.patch('/projects/:id/behavioral-alerts/:aid/status', verifyAuth, requireRole('ciso', 'security_analyst'), (req: AuthRequest, res: Response): void => {
  try {
    const { id, aid } = req.params;
    const { status } = req.body;
    const db = getDatabase();

    if (!['open', 'investigating', 'cleared', 'escalated'].includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    db.prepare('UPDATE behavioral_alerts SET status = ? WHERE id = ? AND project_id = ?').run(status, aid, id);
    const alert = db.prepare('SELECT * FROM behavioral_alerts WHERE id = ?').get(aid);

    res.json(alert);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update alert' });
  }
});

export default router;
