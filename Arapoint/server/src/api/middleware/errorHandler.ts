import { Request, Response, NextFunction } from 'express';
import { logger } from '../../utils/logger';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Error:', err);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      status: 'error',
      code: 400,
      message: 'Validation error',
      errors: err.errors,
    });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      status: 'error',
      code: 401,
      message: 'Unauthorized',
    });
  }
  
  res.status(500).json({
    status: 'error',
    code: 500,
    message: 'Internal server error',
  });
};
