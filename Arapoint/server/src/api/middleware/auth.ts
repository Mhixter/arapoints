import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../config/env';
import { logger } from '../../utils/logger';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        code: 401,
        message: 'No token provided',
      });
    }
    
    const token = authHeader.slice(7); // Extract token after 'Bearer '
    
    if (!token || token.trim() === '') {
      return res.status(401).json({
        status: 'error',
        code: 401,
        message: 'No token provided',
      });
    }
    
    const decoded = jwt.verify(token, config.JWT_SECRET) as any;
    req.userId = decoded.userId;
    next();
  } catch (error) {
    logger.error('Auth error:', error);
    res.status(401).json({
      status: 'error',
      code: 401,
      message: 'Invalid token',
    });
  }
};
