import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/auth.types';

export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user?.isAdmin) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  next();
};