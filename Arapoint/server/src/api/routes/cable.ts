import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { walletService } from '../../services/walletService';
import { vtpassService } from '../../services/vtpassService';
import { cableBuySchema, cableValidateSchema } from '../validators/vtu';
import { logger } from '../../utils/logger';
import { formatResponse, formatErrorResponse } from '../../utils/helpers';
import { db } from '../../config/database';
import { cableServices } from '../../db/schema';
import { eq, desc } from 'drizzle-orm';

const router = Router();
router.use(authMiddleware);

const CABLE_PROVIDERS = [
  { id: 'dstv', name: 'DSTV', serviceID: 'dstv' },
  { id: 'gotv', name: 'GOtv', serviceID: 'gotv' },
  { id: 'startimes', name: 'StarTimes', serviceID: 'startimes' },
];

const CABLE_PLANS_CACHE: Record<string, any[]> = {};

router.post('/buy', async (req: Request, res: Response) => {
  try {
    const validation = cableBuySchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json(formatErrorResponse(400, 'Validation error',
        validation.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
      ));
    }

    const { provider, smartcardNumber, package: packageCode, amount, phone, subscriptionType = 'renew' } = validation.data;

    if (!vtpassService.isConfigured()) {
      return res.status(503).json(formatErrorResponse(503, 'Cable service is not configured'));
    }

    const balance = await walletService.getBalance(req.userId!);
    if (balance.balance < amount) {
      return res.status(402).json(formatErrorResponse(402, 'Insufficient wallet balance'));
    }

    const phoneNumber = phone || '08000000000';

    logger.info('Cable purchase started', { userId: req.userId, provider, smartcardNumber: smartcardNumber.substring(0, 4) + '***' });

    const result = await vtpassService.purchaseCable(
      smartcardNumber,
      packageCode,
      amount,
      provider.toLowerCase(),
      phoneNumber,
      subscriptionType
    );

    if (!result.success || !result.data) {
      logger.warn('Cable purchase failed', { userId: req.userId, error: result.error });
      return res.status(400).json(formatErrorResponse(400, result.error || 'Cable subscription failed'));
    }

    await walletService.deductBalance(req.userId!, amount, `Cable - ${provider.toUpperCase()}`, 'cable_purchase');

    await db.insert(cableServices).values({
      userId: req.userId!,
      provider: provider,
      smartcardNumber: smartcardNumber,
      package: packageCode,
      amount: amount.toString(),
      reference: result.reference,
      status: result.data.status === 'delivered' ? 'completed' : 'pending',
      transactionId: result.data.transactionId,
    });

    logger.info('Cable purchase successful', { userId: req.userId, reference: result.reference, transactionId: result.data.transactionId });

    res.json(formatResponse('success', 200, 'Cable subscription successful', {
      reference: result.reference,
      transactionId: result.data.transactionId,
      status: result.data.status,
      provider: provider.toUpperCase(),
      smartcardNumber,
      package: packageCode,
      amount,
      productName: result.data.productName,
    }));
  } catch (error: any) {
    logger.error('Cable purchase error', { error: error.message, userId: req.userId });
    
    if (error.message === 'Insufficient wallet balance') {
      return res.status(402).json(formatErrorResponse(402, error.message));
    }
    
    if (error.message === 'VTPASS_API_KEY and VTPASS_SECRET_KEY are not configured') {
      return res.status(503).json(formatErrorResponse(503, 'Cable service is not configured'));
    }
    
    res.status(500).json(formatErrorResponse(500, 'Failed to process cable subscription'));
  }
});

router.post('/validate', async (req: Request, res: Response) => {
  try {
    const validation = cableValidateSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json(formatErrorResponse(400, 'Validation error',
        validation.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
      ));
    }

    const { provider, smartcardNumber } = validation.data;

    if (!vtpassService.isConfigured()) {
      return res.status(503).json(formatErrorResponse(503, 'Cable service is not configured'));
    }

    logger.info('Smartcard validation request', { userId: req.userId, provider, smartcardNumber: smartcardNumber.substring(0, 4) + '***' });

    const result = await vtpassService.verifyCableSmartcard(smartcardNumber, provider.toLowerCase());

    if (!result.success || !result.data) {
      return res.status(400).json(formatErrorResponse(400, result.error || 'Smartcard validation failed'));
    }

    res.json(formatResponse('success', 200, 'Smartcard validated successfully', {
      smartcardNumber: result.data.smartcardNumber,
      customerName: result.data.customerName,
      currentPackage: result.data.currentPackage,
      dueDate: result.data.dueDate,
      provider,
      canRecharge: result.data.canRecharge,
    }));
  } catch (error: any) {
    logger.error('Smartcard validation error', { error: error.message, userId: req.userId });
    res.status(500).json(formatErrorResponse(500, 'Failed to validate smartcard'));
  }
});

router.get('/providers', async (req: Request, res: Response) => {
  try {
    res.json(formatResponse('success', 200, 'Cable providers retrieved', {
      providers: CABLE_PROVIDERS,
    }));
  } catch (error: any) {
    logger.error('Get providers error', { error: error.message });
    res.status(500).json(formatErrorResponse(500, 'Failed to get providers'));
  }
});

router.get('/packages/:provider', async (req: Request, res: Response) => {
  try {
    const { provider } = req.params;

    if (!vtpassService.isConfigured()) {
      const STATIC_CABLE_PACKAGES: Record<string, any[]> = {
        dstv: [
          { variation_code: 'dstv-padi', name: 'DStv Padi', variation_amount: '2150', fixedPrice: 'Yes' },
          { variation_code: 'dstv-yanga', name: 'DStv Yanga', variation_amount: '3500', fixedPrice: 'Yes' },
          { variation_code: 'dstv-confam', name: 'DStv Confam', variation_amount: '6200', fixedPrice: 'Yes' },
          { variation_code: 'dstv79', name: 'DStv Compact', variation_amount: '10500', fixedPrice: 'Yes' },
          { variation_code: 'dstv7', name: 'DStv Compact Plus', variation_amount: '16600', fixedPrice: 'Yes' },
          { variation_code: 'dstv3', name: 'DStv Premium', variation_amount: '24500', fixedPrice: 'Yes' },
        ],
        gotv: [
          { variation_code: 'gotv-smallie', name: 'GOtv Smallie', variation_amount: '1100', fixedPrice: 'Yes' },
          { variation_code: 'gotv-jinja', name: 'GOtv Jinja', variation_amount: '2250', fixedPrice: 'Yes' },
          { variation_code: 'gotv-jolli', name: 'GOtv Jolli', variation_amount: '3300', fixedPrice: 'Yes' },
          { variation_code: 'gotv-max', name: 'GOtv Max', variation_amount: '4850', fixedPrice: 'Yes' },
          { variation_code: 'gotv-supa', name: 'GOtv Supa', variation_amount: '6400', fixedPrice: 'Yes' },
        ],
        startimes: [
          { variation_code: 'nova', name: 'StarTimes Nova', variation_amount: '1200', fixedPrice: 'Yes' },
          { variation_code: 'basic', name: 'StarTimes Basic', variation_amount: '2100', fixedPrice: 'Yes' },
          { variation_code: 'smart', name: 'StarTimes Smart', variation_amount: '2800', fixedPrice: 'Yes' },
          { variation_code: 'classic', name: 'StarTimes Classic', variation_amount: '3000', fixedPrice: 'Yes' },
          { variation_code: 'super', name: 'StarTimes Super', variation_amount: '5500', fixedPrice: 'Yes' },
        ],
      };
      
      const packages = STATIC_CABLE_PACKAGES[provider.toLowerCase()] || [];
      return res.json(formatResponse('success', 200, 'Cable packages retrieved', { provider, packages }));
    }

    if (CABLE_PLANS_CACHE[provider] && CABLE_PLANS_CACHE[provider].length > 0) {
      return res.json(formatResponse('success', 200, 'Cable packages retrieved (cached)', { 
        provider, 
        packages: CABLE_PLANS_CACHE[provider] 
      }));
    }

    const result = await vtpassService.getCablePlans(provider.toLowerCase());
    
    if (result.success && result.plans) {
      CABLE_PLANS_CACHE[provider] = result.plans;
      return res.json(formatResponse('success', 200, 'Cable packages retrieved', { 
        provider, 
        packages: result.plans 
      }));
    }

    return res.status(500).json(formatErrorResponse(500, result.error || 'Failed to get cable packages'));
  } catch (error: any) {
    logger.error('Get packages error', { error: error.message });
    res.status(500).json(formatErrorResponse(500, 'Failed to get packages'));
  }
});

router.get('/history', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const history = await db.select()
      .from(cableServices)
      .where(eq(cableServices.userId, req.userId!))
      .orderBy(desc(cableServices.createdAt))
      .limit(limit)
      .offset(offset);

    res.json(formatResponse('success', 200, 'Cable history retrieved', {
      history,
      pagination: { page, limit },
    }));
  } catch (error: any) {
    logger.error('Cable history error', { error: error.message, userId: req.userId });
    res.status(500).json(formatErrorResponse(500, 'Failed to get history'));
  }
});

export default router;
