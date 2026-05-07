import { Router, Response } from 'express';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import { getDatabase } from '../db/connection.js';
import { AuthRequest, verifyAuth, requireRole } from '../middleware/auth.middleware.js';
import { TDSLService } from '../services/tdsl.service.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

function parseList(value: unknown): string[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.flatMap((item) => parseList(item));
  }

  if (typeof value !== 'string') {
    return [];
  }

  const trimmed = value.trim();
  if (!trimmed) return [];

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item).trim()).filter(Boolean);
    }
  } catch {
    // Fall through to comma-separated parsing.
  }

  return trimmed.split(',').map((item) => item.trim()).filter(Boolean);
}

function parseCsvUpload(file: Express.Multer.File): { columns: string[]; recordCount: number } {
  const content = file.buffer.toString('utf-8');
  const headerRows = parse(content, {
    to_line: 1,
    relax_column_count: true,
    skip_empty_lines: true,
    trim: true
  }) as string[][];

  const columns = headerRows[0] || [];

  let recordCount = 0;
  try {
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
      trim: true
    }) as Record<string, string>[];
    recordCount = records.length;
  } catch {
    recordCount = Math.max(content.split(/\r?\n/).filter((line) => line.trim()).length - 1, 0);
  }

  return { columns, recordCount };
}

router.post(
  '/projects/:id/data-scan/upload',
  verifyAuth,
  requireRole('ciso', 'security_analyst', 'project_manager'),
  upload.single('dataset'),
  (req: AuthRequest & { file?: Express.Multer.File }, res: Response): void => {
    try {
      const { id } = req.params;
      const db = getDatabase();
      const service = new TDSLService(db);
      const datasetName = String(req.body.dataset_name || req.body.datasetName || req.file?.originalname || 'Uploaded dataset');
      const defaultTableName = req.body.table_name || req.body.tableName;

      let columns = parseList(req.body.columns || req.body.headers);
      let recordCount = Number(req.body.record_count || req.body.recordCount || 0);

      if (req.file) {
        const parsed = parseCsvUpload(req.file);
        columns = parsed.columns;
        recordCount = parsed.recordCount;
      }

      if (columns.length === 0) {
        res.status(400).json({ error: 'Provide a CSV file in field "dataset" or metadata headers/columns.' });
        return;
      }

      const result = service.scanDataset({
        projectId: id,
        datasetName,
        columns,
        recordCount,
        defaultTableName: defaultTableName ? String(defaultTableName) : undefined
      });

      res.json({
        success: true,
        message: `Scanned ${result.scannedColumns} columns against ${result.rulesEvaluated} SAP PII classification rules`,
        ...result
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to scan dataset' });
    }
  }
);

router.get('/projects/:id/data-findings', verifyAuth, (req: AuthRequest, res: Response): void => {
  try {
    const { id } = req.params;
    const { regulation, pii_type, masked } = req.query;
    const db = getDatabase();

    let query = 'SELECT * FROM data_findings WHERE project_id = ?';
    const params: any[] = [id];

    if (regulation && regulation !== '') {
      query += ' AND regulation = ?';
      params.push(regulation);
    }

    if (pii_type && pii_type !== '') {
      query += ' AND pii_type = ?';
      params.push(pii_type);
    }

    if (masked !== undefined && masked !== '') {
      query += ' AND masked = ?';
      params.push(masked === 'true' ? 1 : 0);
    }

    query += ' ORDER BY detected_at DESC';

    const findings = db.prepare(query).all(...params);
    res.json(findings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch findings' });
  }
});

router.patch('/projects/:id/data-findings/:did/mask', verifyAuth, requireRole('ciso', 'security_analyst'), (req: AuthRequest, res: Response): void => {
  try {
    const { id, did } = req.params;
    const db = getDatabase();

    db.prepare('UPDATE data_findings SET masked = 1 WHERE id = ? AND project_id = ?').run(did, id);
    const finding = db.prepare('SELECT * FROM data_findings WHERE id = ?').get(did);

    res.json(finding);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update finding' });
  }
});

export default router;
