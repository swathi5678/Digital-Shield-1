import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import { getDatabase } from '../db/connection.js';
import { AuthRequest, verifyAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/login', (req: AuthRequest, res: Response): void => {
  try {
    const { email, password } = req.body;
    const db = getDatabase();

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user || !bcryptjs.compareSync(password, (user as any).password_hash)) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign(
      {
        id: (user as any).id,
        email: (user as any).email,
        name: (user as any).name,
        role: (user as any).role,
        project_id: (user as any).project_id
      },
      process.env.JWT_SECRET || 'digital-shield-jwt-secret',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: (user as any).id,
        email: (user as any).email,
        name: (user as any).name,
        role: (user as any).role,
        project_id: (user as any).project_id
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', verifyAuth, (req: AuthRequest, res: Response): void => {
  res.json({ user: req.user });
});

export default router;
