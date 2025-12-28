import { Router, Request, Response } from 'express';
import { pricingService } from '../../services/pricingService';
import { formatResponse, formatErrorResponse } from '../../utils/helpers';
import { logger } from '../../utils/logger';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const pricing = await pricingService.getActivePricing();
    res.json(formatResponse('success', 200, 'Pricing retrieved', { pricing }));
  } catch (error: any) {
    logger.error('Get public pricing error', { error: error.message });
    res.status(500).json(formatErrorResponse(500, 'Failed to get pricing'));
  }
});

router.get('/category/:category', async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    const pricing = await pricingService.getPricingByCategory(category);
    res.json(formatResponse('success', 200, 'Category pricing retrieved', { pricing, category }));
  } catch (error: any) {
    logger.error('Get category pricing error', { error: error.message, category: req.params.category });
    res.status(500).json(formatErrorResponse(500, 'Failed to get pricing'));
  }
});

router.get('/service/:serviceType', async (req: Request, res: Response) => {
  try {
    const { serviceType } = req.params;
    const pricing = await pricingService.getPricing(serviceType);
    res.json(formatResponse('success', 200, 'Service pricing retrieved', { pricing }));
  } catch (error: any) {
    logger.error('Get service pricing error', { error: error.message, serviceType: req.params.serviceType });
    res.status(500).json(formatErrorResponse(500, 'Failed to get pricing'));
  }
});

router.get('/a2c-rates', async (req: Request, res: Response) => {
  try {
    const rates = await pricingService.getA2CRates();
    res.json(formatResponse('success', 200, 'A2C rates retrieved', { rates }));
  } catch (error: any) {
    logger.error('Get A2C rates error', { error: error.message });
    res.status(500).json(formatErrorResponse(500, 'Failed to get rates'));
  }
});

export default router;
