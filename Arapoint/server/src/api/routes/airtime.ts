import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { walletService } from '../../services/walletService';
import { vtpassService } from '../../services/vtpassService';
import { airtimeBuySchema } from '../validators/vtu';
import { logger } from '../../utils/logger';
import { formatResponse, formatErrorResponse } from '../../utils/helpers';
import { db } from '../../config/database';
import { airtimeServices } from '../../db/schema';
import { eq, desc } from 'drizzle-orm';

const router = Router();
router.use(authMiddleware);

const AIRTIME_PRESETS = [
  { amount: 100, label: '100' },
  { amount: 200, label: '200' },
  { amount: 500, label: '500' },
  { amount: 1000, label: '1,000' },
  { amount: 2000, label: '2,000' },
  { amount: 5000, label: '5,000' },
  { amount: 10000, label: '10,000' },
];

const NETWORKS = ['mtn', 'airtel', 'glo', '9mobile'];

const NETWORK_SERVICE_IDS: Record<string, 'mtn' | 'airtel' | 'glo' | 'etisalat'> = {
  'mtn': 'mtn',
  'airtel': 'airtel',
  'glo': 'glo',
  '9mobile': 'etisalat',
};

router.post('/buy', async (req: Request, res: Response) => {
  try {
    const validation = airtimeBuySchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json(formatErrorResponse(400, 'Validation error',
        validation.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
      ));
    }

    const { network, phoneNumber, amount, type } = validation.data;

    if (!vtpassService.isConfigured()) {
      return res.status(503).json(formatErrorResponse(503, 'VTU service is not configured'));
    }

    const balance = await walletService.getBalance(req.userId!);
    if (balance.balance < amount) {
      return res.status(402).json(formatErrorResponse(402, 'Insufficient wallet balance'));
    }

    logger.info('Airtime purchase started', { userId: req.userId, network, amount, phone: phoneNumber.substring(0, 4) + '***' });

    const serviceID = NETWORK_SERVICE_IDS[network.toLowerCase()] || 'mtn';
    const result = await vtpassService.purchaseAirtime(phoneNumber, amount, serviceID);

    if (!result.success || !result.data) {
      logger.warn('Airtime purchase failed', { userId: req.userId, error: result.error });
      return res.status(400).json(formatErrorResponse(400, result.error || 'Airtime purchase failed'));
    }

    await walletService.deductBalance(req.userId!, amount, `Airtime Purchase - ${network.toUpperCase()}`, 'airtime_purchase');

    await db.insert(airtimeServices).values({
      userId: req.userId!,
      network: network,
      phoneNumber: phoneNumber,
      amount: amount.toString(),
      reference: result.reference,
      status: result.data.status === 'delivered' ? 'completed' : 'pending',
      transactionId: result.data.transactionId,
    });

    logger.info('Airtime purchase successful', { userId: req.userId, reference: result.reference, transactionId: result.data.transactionId });

    res.json(formatResponse('success', 200, 'Airtime purchase successful', {
      reference: result.reference,
      transactionId: result.data.transactionId,
      status: result.data.status,
      network: network.toUpperCase(),
      phoneNumber,
      amount,
      productName: result.data.productName,
    }));
  } catch (error: any) {
    logger.error('Airtime purchase error', { error: error.message, userId: req.userId });
    
    if (error.message === 'Insufficient wallet balance') {
      return res.status(402).json(formatErrorResponse(402, error.message));
    }
    
    if (error.message === 'VTPASS_API_KEY and VTPASS_SECRET_KEY are not configured') {
      return res.status(503).json(formatErrorResponse(503, 'VTU service is not configured'));
    }
    
    res.status(500).json(formatErrorResponse(500, 'Failed to process airtime purchase'));
  }
});

router.get('/presets', async (req: Request, res: Response) => {
  try {
    res.json(formatResponse('success', 200, 'Airtime presets retrieved', {
      presets: AIRTIME_PRESETS,
      networks: NETWORKS,
    }));
  } catch (error: any) {
    logger.error('Get presets error', { error: error.message });
    res.status(500).json(formatErrorResponse(500, 'Failed to get presets'));
  }
});

router.get('/history', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const history = await db.select()
      .from(airtimeServices)
      .where(eq(airtimeServices.userId, req.userId!))
      .orderBy(desc(airtimeServices.createdAt))
      .limit(limit)
      .offset(offset);

    res.json(formatResponse('success', 200, 'Airtime history retrieved', {
      history,
      pagination: { page, limit },
    }));
  } catch (error: any) {
    logger.error('Airtime history error', { error: error.message, userId: req.userId });
    res.status(500).json(formatErrorResponse(500, 'Failed to get history'));
  }
});

export default router;
