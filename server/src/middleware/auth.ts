import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AuthenticatedRequest, JwtPayload } from '../types';

export function authenticateJwt(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Unauthorized: Authentication token required' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ success: false, error: 'Unauthorized: Invalid or expired token' });
    return;
  }
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  authenticateJwt(req, res, () => {
    if (req.user?.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: 'Forbidden: Admin access required' });
      return;
    }
    next();
  });
}

export function requireTeam(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  authenticateJwt(req, res, () => {
    if (req.user?.role !== 'TEAM') {
      res.status(403).json({ success: false, error: 'Forbidden: Team access required' });
      return;
    }
    next();
  });
}
