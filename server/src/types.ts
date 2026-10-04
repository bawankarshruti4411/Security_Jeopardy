import { Request } from 'express';

export interface JwtPayload {
  role: 'TEAM' | 'ADMIN';
  id: string;
  teamCode?: string;
  teamName?: string;
  email?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}
