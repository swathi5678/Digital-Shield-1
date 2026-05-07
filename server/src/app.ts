import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './db/schema.js';
import { getDatabase } from './db/connection.js';
import authRoutes from './routes/auth.routes.js';
import aieRoutes from './routes/aie.routes.js';
import scgRoutes from './routes/scg.routes.js';
import tdslRoutes from './routes/tdsl.routes.js';
import cpmRoutes from './routes/cpm.routes.js';
import basRoutes from './routes/bas.routes.js';
import aglRoutes from './routes/agl.routes.js';
import aiRoutes from './routes/ai.routes.js';
import vseRoutes from './routes/vse.routes.js';

dotenv.config();

const app: Express = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
initializeDatabase();
const db = getDatabase();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', aieRoutes);
app.use('/api', scgRoutes);
app.use('/api', tdslRoutes);
app.use('/api', cpmRoutes);
app.use('/api', basRoutes);
app.use('/api', aglRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api', vseRoutes);

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`✓ Digital Shield server running on http://localhost:${PORT}`);
  console.log(`✓ API available at http://localhost:${PORT}/api`);
});
