import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { authMiddleware } from '../middleware/auth';
import { paymentService } from '../../services/paymentService';
import { walletService } from '../../services/walletService';
import { virtualAccountService } from '../../services/virtualAccountService';
import { payvesselService } from '../../services/payvesselService';
import { paystackInitSchema, paystackVerifySchema, palmpayInitSchema, palmpayVerifySchema } from '../validators/payment';
import { logger } from '../../utils/logger';
import { formatResponse, formatErrorResponse } from '../../utils/helpers';
import { db } from '../../config/database';
import { airtimeServices, dataServices } from '../../db/schema';
import { eq } from 'drizzle-orm';

const verifyPaystackSignature = (payload: string, signature: string): boolean => {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    logger.warn('Paystack secret key not configured for webhook verification');
    return false;
  }
  const hash = crypto.createHmac('sha512', secretKey).update(payload).digest('hex');
  return hash === signature;
};

const router = Router();

router.get('/gateways', authMiddleware, async (req: Request, res: Response) => {
  try {
    const gateways = paymentService.getAvailableGateways();
    
    res.json(formatResponse('success', 200, 'Available payment gateways', {
      gateways,
      paystackConfigured: paymentService.isPaystackConfigured(),
      palmpayConfigured: paymentService.isPalmpayConfigured(),
    }));
  } catch (error: any) {
    logger.error('Get gateways error', { error: error.message });
    res.status(500).json(formatErrorResponse(500, 'Failed to get payment gateways'));
  }
});

router.post('/paystack/init', authMiddleware, async (req: Request, res: Response) => {
  try {
    const validation = paystackInitSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json(formatErrorResponse(400, 'Validation error',
        validation.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
      ));
    }

    const { amount, email } = validation.data;
    const paymentData = await paymentService.initializePaystack(
      req.userId!,
      amount,
      email || req.body.userEmail || 'user@arapoint.com'
    );

    logger.info('Paystack payment initialized', { userId: req.userId, amount });

    res.json(formatResponse('success', 200, 'Payment initialized', paymentData));
  } catch (error: any) {
    logger.error('Paystack init error', { error: error.message, userId: req.userId });
    res.status(500).json(formatErrorResponse(500, 'Failed to initialize payment'));
  }
});

router.post('/paystack/verify', async (req: Request, res: Response) => {
  try {
    const validation = paystackVerifySchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json(formatErrorResponse(400, 'Validation error',
        validation.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
      ));
    }

    const { reference } = validation.data;
    const verificationResult = await paymentService.verifyPaystack(reference);

    if (verificationResult.success) {
      logger.info('Paystack payment verified', { reference, amount: verificationResult.amount });
      return res.json(formatResponse('success', 200, 'Payment verified successfully', verificationResult));
    }

    res.status(400).json(formatErrorResponse(400, 'Payment verification failed', [verificationResult]));
  } catch (error: any) {
    logger.error('Paystack verify error', { error: error.message });
    res.status(500).json(formatErrorResponse(500, 'Failed to verify payment'));
  }
});

router.post('/paystack/webhook', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-paystack-signature'] as string;
    const rawBody = JSON.stringify(req.body);
    
    if (!signature || !verifyPaystackSignature(rawBody, signature)) {
      logger.warn('Invalid Paystack webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const payload = req.body;
    logger.info('Paystack webhook received', { event: payload.event });
    
    if (payload.event === 'charge.success') {
      const { reference, amount, metadata } = payload.data;
      const userId = metadata?.userId || metadata?.custom_fields?.find((f: any) => f.variable_name === 'user_id')?.value;

      if (userId) {
        await walletService.addBalance(userId, amount / 100, reference, 'paystack');
        logger.info('Paystack payment credited', { reference, amount: amount / 100, userId });
      } else {
        logger.warn('Paystack webhook missing userId', { reference });
      }
    } else if (payload.event === 'charge.failed') {
      logger.warn('Paystack charge failed', { reference: payload.data?.reference });
    }

    res.status(200).json({ received: true });
  } catch (error: any) {
    logger.error('Paystack webhook error', { error: error.message });
    res.status(200).json({ received: true });
  }
});

router.get('/paystack/callback', async (req: Request, res: Response) => {
  try {
    const { reference } = req.query;
    
    if (reference && typeof reference === 'string') {
      const verificationResult = await paymentService.verifyPaystack(reference);
      
      if (verificationResult.success) {
        return res.redirect('/dashboard?payment=success');
      }
    }

    res.redirect('/dashboard?payment=failed');
  } catch (error: any) {
    logger.error('Paystack callback error', { error: error.message });
    res.redirect('/dashboard?payment=error');
  }
});

router.post('/palmpay/init', authMiddleware, async (req: Request, res: Response) => {
  try {
    const validation = palmpayInitSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json(formatErrorResponse(400, 'Validation error',
        validation.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
      ));
    }

    const { amount } = validation.data;
    const paymentData = await paymentService.initializePalmpay(req.userId!, amount);

    logger.info('PalmPay payment initialized', { userId: req.userId, amount });

    res.json(formatResponse('success', 200, 'Payment initialized', paymentData));
  } catch (error: any) {
    logger.error('PalmPay init error', { error: error.message, userId: req.userId });
    res.status(500).json(formatErrorResponse(500, 'Failed to initialize payment'));
  }
});

router.post('/palmpay/verify', async (req: Request, res: Response) => {
  try {
    const validation = palmpayVerifySchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json(formatErrorResponse(400, 'Validation error',
        validation.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
      ));
    }

    const { reference } = validation.data;
    const verificationResult = await paymentService.verifyPalmpay(reference);

    logger.info('PalmPay verification attempted', { reference });

    res.json(formatResponse('success', 200, 'Verification processed', verificationResult));
  } catch (error: any) {
    logger.error('PalmPay verify error', { error: error.message });
    res.status(500).json(formatErrorResponse(500, 'Failed to verify payment'));
  }
});

router.get('/vtpass/webhook-info', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { vtpassService } = await import('../../services/vtpassService');
    const webhookInfo = vtpassService.getWebhookInfo();
    
    logger.info('VTpass webhook info requested', { userId: req.userId });
    
    res.json(formatResponse('success', 200, 'VTpass webhook configuration', {
      webhookUrl: webhookInfo.url,
      instructions: webhookInfo.instructions,
      configured: vtpassService.isConfigured(),
      sandboxMode: vtpassService.isSandboxMode(),
    }));
  } catch (error: any) {
    logger.error('VTpass webhook info error', { error: error.message });
    res.status(500).json(formatErrorResponse(500, 'Failed to get webhook info'));
  }
});

router.post('/vtpass/webhook', async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    logger.info('VTpass webhook received', { type: payload.type });

    if (payload.type === 'transaction-update') {
      const data = payload.data;
      const transaction = data?.content?.transactions;
      
      if (transaction) {
        const { transactionId, status, product_name, type: txType } = transaction;
        const finalStatus = status === 'delivered' ? 'completed' : status === 'failed' ? 'failed' : 'pending';
        
        if (txType === 'Airtime Recharge') {
          await db.update(airtimeServices)
            .set({ status: finalStatus })
            .where(eq(airtimeServices.transactionId, transactionId));
          logger.info('VTpass airtime transaction updated', { transactionId, status: finalStatus });
        } else if (txType === 'Data' || txType?.includes('Data')) {
          await db.update(dataServices)
            .set({ status: finalStatus })
            .where(eq(dataServices.transactionId, transactionId));
          logger.info('VTpass data transaction updated', { transactionId, status: finalStatus });
        }
      }
    } else if (payload.type === 'transaction-reversal') {
      const transactionId = payload.data?.transactionId;
      if (transactionId) {
        await db.update(airtimeServices)
          .set({ status: 'reversed' })
          .where(eq(airtimeServices.transactionId, transactionId));
        await db.update(dataServices)
          .set({ status: 'reversed' })
          .where(eq(dataServices.transactionId, transactionId));
        logger.info('VTpass transaction reversed', { transactionId });
      }
    }

    res.status(200).json({ response: 'success' });
  } catch (error: any) {
    logger.error('VTpass webhook error', { error: error.message });
    res.status(200).json({ response: 'success' });
  }
});

router.post('/payvessel/webhook', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-payvessel-signature'] as string;
    const rawBody = JSON.stringify(req.body);
    
    if (!signature || !payvesselService.verifyWebhookSignature(rawBody, signature)) {
      logger.warn('Invalid or missing Payvessel webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const payload = payvesselService.parseWebhookPayload(req.body);
    if (!payload) {
      logger.warn('Invalid Payvessel webhook payload structure');
      return res.status(400).json({ error: 'Invalid payload' });
    }

    logger.info('Payvessel webhook received', { 
      transactionReference: payload.transactionReference,
      amount: payload.amount,
      status: payload.status,
    });

    if (payload.status === 'SUCCESSFUL' || payload.status === 'successful') {
      const accountNumber = payload.destinationAccountNumber;
      const amount = payload.amount;
      const reference = payload.transactionReference || payload.paymentReference;

      if (accountNumber && amount > 0 && reference) {
        const userId = await virtualAccountService.findUserByAccountNumber(accountNumber);

        if (userId) {
          await walletService.addBalance(userId, amount, reference, 'payvessel');
          logger.info('Payvessel payment credited', { 
            reference, 
            amount, 
            userId,
            accountNumber,
          });
        } else {
          logger.warn('Payvessel webhook: user not found for account', { accountNumber });
        }
      }
    }

    res.status(200).json({ status: 'success' });
  } catch (error: any) {
    logger.error('Payvessel webhook error', { error: error.message });
    res.status(200).json({ status: 'success' });
  }
});

router.get('/payvessel/status', authMiddleware, async (req: Request, res: Response) => {
  try {
    const configured = payvesselService.isConfigured();
    
    res.json(formatResponse('success', 200, 'Payvessel status', {
      configured,
      webhookUrl: `${process.env.REPLIT_DEV_DOMAIN || ''}/api/payment/payvessel/webhook`,
    }));
  } catch (error: any) {
    logger.error('Payvessel status error', { error: error.message });
    res.status(500).json(formatErrorResponse(500, 'Failed to check Payvessel status'));
  }
});

export default router;
