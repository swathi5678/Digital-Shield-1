import { Router, Response, Request } from 'express';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import { getDatabase } from '../db/connection.js';
import { AuthRequest, verifyAuth, requireRole } from '../middleware/auth.middleware.js';
import { SoDDetectionService, AgrUser, AgrTCode } from '../services/sod.service.js';

const router = Router();

// Configure multer for in-memory file uploads
const upload = multer({ storage: multer.memoryStorage() });

/**
 * Get AIE findings (existing)
 */
router.get('/projects/:id/auth-findings', verifyAuth, (req: AuthRequest, res: Response): void => {
  try {
    const { id } = req.params;
    const { severity, type, status, search } = req.query;
    const db = getDatabase();

    let query = 'SELECT * FROM auth_findings WHERE project_id = ?';
    const params: any[] = [id];

    if (severity && severity !== '') {
      query += ' AND severity = ?';
      params.push(severity);
    }

    if (type && type !== '') {
      query += ' AND finding_type = ?';
      params.push(type);
    }

    if (status && status !== '') {
      query += ' AND status = ?';
      params.push(status);
    }

    if (search && search !== '') {
      query += ' AND (role_name LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY detected_at DESC';

    const findings = db.prepare(query).all(...params);
    res.json(findings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch findings' });
  }
});

/**
 * Update AIE finding status (existing)
 */
router.patch('/projects/:id/auth-findings/:fid', verifyAuth, requireRole('ciso', 'security_analyst'), (req: AuthRequest, res: Response): void => {
  try {
    const { id, fid } = req.params;
    const { status } = req.body;
    const db = getDatabase();

    if (!['open', 'in_review', 'remediated', 'accepted'].includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    db.prepare('UPDATE auth_findings SET status = ? WHERE id = ? AND project_id = ?').run(status, fid, id);
    const finding = db.prepare('SELECT * FROM auth_findings WHERE id = ?').get(fid);

    res.json(finding);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update finding' });
  }
});

/**
 * Upload AGR data (AGR_USERS and AGR_1251 CSVs)
 */
router.post(
  '/projects/:id/sod/upload',
  verifyAuth,
  requireRole('ciso', 'security_analyst', 'project_manager'),
  upload.fields([
    { name: 'agr_users', maxCount: 1 },
    { name: 'agr_1251', maxCount: 1 }
  ]),
  (req: AuthRequest & { files?: any }, res: Response): void => {
    try {
      const { id } = req.params;
      const db = getDatabase();
      const sodService = new SoDDetectionService(db);

      if (!req.files || !req.files.agr_users || !req.files.agr_1251) {
        res.status(400).json({ error: 'Both agr_users and agr_1251 CSV files are required' });
        return;
      }

      // Parse CSV files
      const agrUsersFile = req.files.agr_users[0];
      const agr1251File = req.files.agr_1251[0];

      let agrUsers: AgrUser[] = [];
      let agr1251: AgrTCode[] = [];

      try {
        // Parse AGR_USERS CSV
        const usersData = parse(agrUsersFile.buffer.toString(), {
          columns: true,
          skip_empty_lines: true,
          trim: true
        });
        agrUsers = usersData.map((row: any) => ({
          uname: row.uname || row.UNAME || row.User,
          user_full_name: row.user_full_name || row.USER_FULL_NAME || row.Name,
          user_type: row.user_type || row.USER_TYPE || 'Dialog',
          locked_status: row.locked_status || row.LOCKED_STATUS || 'Unlocked'
        }));

        // Parse AGR_1251 CSV
        const tcodesData = parse(agr1251File.buffer.toString(), {
          columns: true,
          skip_empty_lines: true,
          trim: true
        });
        agr1251 = tcodesData.map((row: any) => ({
          role_name: row.role_name || row.ROLE_NAME || row.AGRName,
          tcode: row.tcode || row.TCODE || row.TCode,
          tcode_description: row.tcode_description || row.TCODE_DESCRIPTION,
          auth_object: row.auth_object || row.AUTH_OBJECT
        }));

        if (agrUsers.length === 0 || agr1251.length === 0) {
          res.status(400).json({ error: 'CSV files appear to be empty or have invalid format' });
          return;
        }

        // Create detection run
        const runName = `SoD Detection Run - ${new Date().toLocaleString()}`;
        const runId = sodService.createDetectionRun(id, runName, agrUsers, agr1251);

        // Run detection
        const result = sodService.runDetection(runId, id);

        res.json({
          success: true,
          runId,
          message: `Successfully analyzed ${result.usersCount} users with ${result.rolesCount} roles and ${result.tcodesCount} transaction codes`,
          statistics: {
            usersCount: result.usersCount,
            rolesCount: result.rolesCount,
            tcodesCount: result.tcodesCount,
            violationsFound: result.violationsFound
          },
          violations: result.violations
        });
      } catch (parseErr: any) {
        res.status(400).json({ error: `CSV parsing failed: ${parseErr.message}` });
      }
    } catch (err) {
      res.status(500).json({ error: 'Failed to process upload' });
    }
  }
);

/**
 * Get detection runs for a project
 */
router.get('/projects/:id/sod/detection-runs', verifyAuth, (req: AuthRequest, res: Response): void => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    const sodService = new SoDDetectionService(db);

    const runs = sodService.getDetectionRuns(id);
    res.json(runs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch detection runs' });
  }
});

/**
 * Get violations from a specific detection run
 */
router.get('/projects/:id/sod/detection-runs/:runId/violations', verifyAuth, (req: AuthRequest, res: Response): void => {
  try {
    const { id, runId } = req.params;
    const { severity, status } = req.query;
    const db = getDatabase();
    const sodService = new SoDDetectionService(db);

    let violations = sodService.getViolations(runId);

    // Filter by severity
    if (severity && severity !== '') {
      violations = violations.filter(v => v.severity === severity);
    }

    // Filter by status (from the database)
    if (status && status !== '') {
      const dbViolations = db.prepare(
        'SELECT * FROM sod_detected_violations WHERE detection_run_id = ? AND status = ?'
      ).all(runId, status);
      const ids = new Set(dbViolations.map((v: any) => v.id));
      violations = violations.filter(v => ids.has(v.id));
    }

    res.json(violations);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch violations' });
  }
});

/**
 * Update violation status
 */
router.patch(
  '/projects/:id/sod/violations/:violationId',
  verifyAuth,
  requireRole('ciso', 'security_analyst'),
  (req: AuthRequest, res: Response): void => {
    try {
      const { id, violationId } = req.params;
      const { status } = req.body;
      const db = getDatabase();
      const sodService = new SoDDetectionService(db);

      if (!['open', 'in_review', 'remediated', 'accepted', 'false_positive'].includes(status)) {
        res.status(400).json({ error: 'Invalid status' });
        return;
      }

      sodService.updateViolationStatus(violationId, status);
      const violation = db.prepare('SELECT * FROM sod_detected_violations WHERE id = ?').get(violationId);

      res.json(violation);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update violation' });
    }
  }
);

export default router;
