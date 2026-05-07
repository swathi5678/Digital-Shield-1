import { Router, Response } from 'express';
import multer from 'multer';
import { getDatabase } from '../db/connection.js';
import { AuthRequest, verifyAuth, requireRole } from '../middleware/auth.middleware.js';
import { AgentLedgerService } from '../services/agl.service.js';
import { SecureCodeGuardianService } from '../services/scg.service.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post(
  '/projects/:id/code-scan/upload',
  verifyAuth,
  requireRole('ciso', 'security_analyst', 'project_manager'),
  upload.single('source'),
  (req: AuthRequest & { file?: Express.Multer.File }, res: Response): void => {
    try {
      const { id } = req.params;
      const db = getDatabase();
      const sourceCode = req.file?.buffer.toString('utf-8') || String(req.body.source_code || req.body.sourceCode || '');
      const objectName = String(req.body.object_name || req.body.objectName || req.file?.originalname || 'UPLOADED_ABAP_OBJECT');
      const objectType = String(req.body.object_type || req.body.objectType || 'PROG') as 'PROG' | 'FUGR' | 'CLAS';

      if (!sourceCode.trim()) {
        res.status(400).json({ error: 'Provide ABAP source in file field "source" or body field "source_code".' });
        return;
      }

      if (!['PROG', 'FUGR', 'CLAS'].includes(objectType)) {
        res.status(400).json({ error: 'Invalid object_type. Use PROG, FUGR, or CLAS.' });
        return;
      }

      const result = new SecureCodeGuardianService(db).scanAbap({
        projectId: id,
        objectName,
        objectType,
        sourceCode
      });

      new AgentLedgerService(db).appendAction({
        projectId: id,
        agentName: 'SecureCodeGuardian',
        actionType: 'code_scan',
        targetObject: objectName,
        actionSummary: `Scanned ABAP object and inserted ${result.findingsInserted} code finding(s).`,
        dataAccessed: { objectType, rulesEvaluated: result.rulesEvaluated },
        outcome: result.findingsInserted > 0 ? 'partial' : 'success',
        riskLevel: result.findingsInserted > 0 ? 'medium' : 'low',
        userId: req.user?.id
      });

      res.json({
        success: true,
        message: `Scanned ${objectName} against ${result.rulesEvaluated} ABAP security rules`,
        ...result
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to scan ABAP source' });
    }
  }
);

router.get('/projects/:id/code-findings', verifyAuth, (req: AuthRequest, res: Response): void => {
  try {
    const { id } = req.params;
    const { severity, object_type, finding_type, status } = req.query;
    const db = getDatabase();

    let query = 'SELECT * FROM code_findings WHERE project_id = ?';
    const params: any[] = [id];

    if (severity && severity !== '') {
      query += ' AND severity = ?';
      params.push(severity);
    }

    if (object_type && object_type !== '') {
      query += ' AND object_type = ?';
      params.push(object_type);
    }

    if (finding_type && finding_type !== '') {
      query += ' AND finding_type = ?';
      params.push(finding_type);
    }

    if (status && status !== '') {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY detected_at DESC';

    const findings = db.prepare(query).all(...params);
    res.json(findings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch findings' });
  }
});

export default router;
