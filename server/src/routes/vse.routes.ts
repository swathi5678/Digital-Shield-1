import { Router, Response } from 'express';
import { AuthRequest, verifyAuth, requireRole } from '../middleware/auth.middleware.js';
import { getDatabase } from '../db/connection.js';
import VSEService from '../services/vse.service.js';

const router = Router();

router.get('/projects/:id/vse/summary', verifyAuth, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    const svc = new VSEService(db);
    res.json(svc.getVSESummary(id));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch VSE summary' });
  }
});

router.get('/projects/:id/vse/findings', verifyAuth, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { scan_type, finding_type, severity, status, search } = req.query;
    const db = getDatabase();
    const svc = new VSEService(db);
    const findings = svc.getVSEFindings(id, { scan_type: scan_type as any, finding_type: finding_type as any, severity: severity as any, status: status as any, search: search as any });
    res.json(findings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch VSE findings' });
  }
});

router.patch('/projects/:id/vse/findings/:fid', verifyAuth, requireRole('ciso', 'security_analyst'), (req: AuthRequest, res: Response) => {
  try {
    const { fid } = req.params;
    const { status } = req.body;
    const db = getDatabase();
    const svc = new VSEService(db);
    svc.updateVSEFindingStatus(fid, status);
    const updated = db.prepare('SELECT * FROM vse_findings WHERE id = ?').get(fid);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update finding status' });
  }
});

router.get('/projects/:id/vse/change-events', verifyAuth, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    const svc = new VSEService(db);
    res.json(svc.getChangeEvents(id));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch change events' });
  }
});

router.get('/projects/:id/vse/handover', verifyAuth, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    const svc = new VSEService(db);
    res.json(svc.getHandoverReport(id));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch handover report' });
  }
});

router.patch('/projects/:id/vse/handover/status', verifyAuth, requireRole('ciso', 'project_manager'), (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, signed_off_by } = req.body;
    const db = getDatabase();
    const svc = new VSEService(db);
    svc.updateHandoverStatus(id, status, signed_off_by);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update handover status' });
  }
});

router.get('/projects/:id/vse/monitoring', verifyAuth, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    const svc = new VSEService(db);
    res.json(svc.getMonitoringConfig(id));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch monitoring config' });
  }
});

router.post('/projects/:id/vse/trigger-scan', verifyAuth, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { scan_type, object } = req.body;
    const db = getDatabase();
    const svc = new VSEService(db);
    const result = svc.triggerScan(id, scan_type, object);
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ error: 'Failed to trigger scan' });
  }
});

export default router;
