import { Router, Response } from 'express';
import { AuthRequest, verifyAuth } from '../middleware/auth.middleware.js';
import { analyzeWithAI } from '../services/openai.service.js';

const router = Router();

export type AnalysisMode = 'ciso_brief' | 'remediation_plan' | 'code_fix' | 'data_risk' | 'audit_evidence' | 'behavioral_risk' | 'explain_agent_action' | 'handover_narrative';

router.post('/analyze', verifyAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { mode, context } = req.body;

    if (!mode || !context) {
      res.status(400).json({ error: 'Mode and context required' });
      return;
    }

    const analysis = await analyzeWithAI(mode as AnalysisMode, context);
    res.json({ analysis });
  } catch (err) {
    const error = err as any;
    console.error('AI analysis error:', error.message || error);
    
    if (error.message && error.message.includes('API key')) {
      res.status(503).json({ error: 'AI service unavailable. Please configure OPENAI_API_KEY.' });
    } else if (error.status === 401 || error.code === '401') {
      res.status(503).json({ error: 'Invalid OpenAI API key.' });
    } else {
      res.status(500).json({ error: error.message || 'Analysis failed. Please try again.' });
    }
  }
});

export default router;
