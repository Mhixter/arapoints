import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { jobService } from '../../services/jobService';
import { walletService } from '../../services/walletService';
import { birthAttestationSchema } from '../validators/vtu';
import { logger } from '../../utils/logger';
import { formatResponse, formatErrorResponse } from '../../utils/helpers';
import { db } from '../../config/database';
import { birthAttestations } from '../../db/schema';
import { eq, desc } from 'drizzle-orm';

const router = Router();
router.use(authMiddleware);

const SERVICE_PRICE = 500;

router.post('/attestation', async (req: Request, res: Response) => {
  try {
    const validation = birthAttestationSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json(formatErrorResponse(400, 'Validation error',
        validation.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
      ));
    }

    const { fullName, dateOfBirth, registrationNumber } = validation.data;

    await walletService.deductBalance(req.userId!, SERVICE_PRICE, 'Birth Certificate Attestation');

    const job = await jobService.createBirthJob(req.userId!, {
      fullName,
      dateOfBirth,
      registrationNumber,
    });

    logger.info('Birth attestation request', { userId: req.userId, jobId: job.jobId });

    res.status(202).json(formatResponse('success', 202, 'Birth attestation request submitted', {
      ...job,
      price: SERVICE_PRICE,
    }));
  } catch (error: any) {
    logger.error('Birth attestation error', { error: error.message, userId: req.userId });
    
    if (error.message === 'Insufficient wallet balance') {
      return res.status(402).json(formatErrorResponse(402, error.message));
    }
    
    res.status(500).json(formatErrorResponse(500, 'Failed to process birth attestation request'));
  }
});

router.get('/history', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const history = await db.select()
      .from(birthAttestations)
      .where(eq(birthAttestations.userId, req.userId!))
      .orderBy(desc(birthAttestations.createdAt))
      .limit(limit)
      .offset(offset);

    res.json(formatResponse('success', 200, 'Birth attestation history retrieved', {
      history,
      pagination: { page, limit },
    }));
  } catch (error: any) {
    logger.error('Birth history error', { error: error.message, userId: req.userId });
    res.status(500).json(formatErrorResponse(500, 'Failed to get history'));
  }
});

router.get('/job/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const job = await jobService.getJobStatus(jobId, req.userId!);

    res.json(formatResponse('success', 200, 'Job status retrieved', job));
  } catch (error: any) {
    logger.error('Get job status error', { error: error.message, userId: req.userId });
    
    if (error.message === 'Job not found') {
      return res.status(404).json(formatErrorResponse(404, error.message));
    }
    
    res.status(500).json(formatErrorResponse(500, 'Failed to get job status'));
  }
});

export default router;
