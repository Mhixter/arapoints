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
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
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
