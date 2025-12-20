import { Router, Request, Response } from 'express';
import { db } from '../../config/database';
import { identityAgents, identityServiceRequests, identityRequestActivity, servicePricing, users } from '../../db/schema';
import { eq, desc, and, inArray, sql, count } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth';
import { formatResponse, formatErrorResponse } from '../../utils/helpers';
import { logger } from '../../utils/logger';

const router = Router();

function generateTrackingId(): string {
  const prefix = 'ARA';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

router.get('/manual-services', authMiddleware, async (req: Request, res: Response) => {
  try {
    const services = await db.select()
      .from(servicePricing)
      .where(
        and(
          eq(servicePricing.isActive, true),
          inArray(servicePricing.serviceType, ['nin_validation', 'ipe_clearance', 'nin_personalization'])
        )
      );
    res.json(formatResponse('success', 200, 'Manual identity services retrieved', { services }));
  } catch (error: any) {
    logger.error('Get manual services error', { error: error.message });
    res.status(500).json(formatErrorResponse(500, 'Failed to get services'));
  }
});

router.post('/request', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json(formatErrorResponse(401, 'Authentication required'));
    }
    const { serviceType, nin, newTrackingId, updateFields, customerNotes } = req.body;

    if (!serviceType || !['nin_validation', 'ipe_clearance', 'nin_personalization'].includes(serviceType)) {
      return res.status(400).json(formatErrorResponse(400, 'Invalid service type'));
    }

    const [pricing] = await db.select()
      .from(servicePricing)
      .where(and(eq(servicePricing.serviceType, serviceType), eq(servicePricing.isActive, true)))
      .limit(1);

    if (!pricing) {
      return res.status(400).json(formatErrorResponse(400, 'Service not available'));
    }

    const trackingId = generateTrackingId();

    const [request] = await db.insert(identityServiceRequests).values({
      userId: userId,
      trackingId,
      serviceType,
      nin,
      newTrackingId,
      updateFields,
      customerNotes,
      fee: pricing.price,
      status: 'pending',
    }).returning();

    await db.insert(identityRequestActivity).values({
      requestId: request.id,
      actorType: 'user',
      actorId: userId,
      action: 'request_created',
      newStatus: 'pending',
      comment: `New ${serviceType} request created`,
    });

    logger.info('Identity service request created', { requestId: request.id, serviceType, userId });
    res.status(201).json(formatResponse('success', 201, 'Request created successfully', {
      request: { ...request, serviceName: pricing.serviceName }
    }));
  } catch (error: any) {
    logger.error('Create identity request error', { error: error.message });
    res.status(500).json(formatErrorResponse(500, 'Failed to create request'));
  }
});

router.get('/my-requests', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const requests = await db.select({
      id: identityServiceRequests.id,
      trackingId: identityServiceRequests.trackingId,
      serviceType: identityServiceRequests.serviceType,
      status: identityServiceRequests.status,
      fee: identityServiceRequests.fee,
      isPaid: identityServiceRequests.isPaid,
      slipUrl: identityServiceRequests.slipUrl,
      customerNotes: identityServiceRequests.customerNotes,
      agentNotes: identityServiceRequests.agentNotes,
      createdAt: identityServiceRequests.createdAt,
      completedAt: identityServiceRequests.completedAt,
    })
      .from(identityServiceRequests)
      .where(eq(identityServiceRequests.userId, userId!))
      .orderBy(desc(identityServiceRequests.createdAt));

    res.json(formatResponse('success', 200, 'Requests retrieved', { requests }));
  } catch (error: any) {
    logger.error('Get my requests error', { error: error.message });
    res.status(500).json(formatErrorResponse(500, 'Failed to get requests'));
  }
});

router.get('/request/:trackingId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { trackingId } = req.params;
    const userId = req.userId;

    const [request] = await db.select()
      .from(identityServiceRequests)
      .where(eq(identityServiceRequests.trackingId, trackingId))
      .limit(1);

    if (!request) {
      return res.status(404).json(formatErrorResponse(404, 'Request not found'));
    }

    if (request.userId !== userId) {
      return res.status(403).json(formatErrorResponse(403, 'Access denied'));
    }

    const activity = await db.select()
      .from(identityRequestActivity)
      .where(eq(identityRequestActivity.requestId, request.id))
      .orderBy(desc(identityRequestActivity.createdAt));

    res.json(formatResponse('success', 200, 'Request details retrieved', { request, activity }));
  } catch (error: any) {
    logger.error('Get request details error', { error: error.message });
    res.status(500).json(formatErrorResponse(500, 'Failed to get request details'));
  }
});

router.get('/agent/check', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const [agent] = await db.select()
      .from(identityAgents)
      .where(and(eq(identityAgents.userId, userId!), eq(identityAgents.isActive, true)))
      .limit(1);

    res.json(formatResponse('success', 200, 'Agent check', { isAgent: !!agent, agent }));
  } catch (error: any) {
    logger.error('Agent check error', { error: error.message });
    res.status(500).json(formatErrorResponse(500, 'Failed to check agent status'));
  }
});

router.get('/agent/requests', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { status } = req.query;

    const [agent] = await db.select()
      .from(identityAgents)
      .where(and(eq(identityAgents.userId, userId!), eq(identityAgents.isActive, true)))
      .limit(1);

    if (!agent) {
      return res.status(403).json(formatErrorResponse(403, 'Not an identity agent'));
    }

    let query = db.select({
      id: identityServiceRequests.id,
      trackingId: identityServiceRequests.trackingId,
      serviceType: identityServiceRequests.serviceType,
      nin: identityServiceRequests.nin,
      newTrackingId: identityServiceRequests.newTrackingId,
      updateFields: identityServiceRequests.updateFields,
      status: identityServiceRequests.status,
      fee: identityServiceRequests.fee,
      isPaid: identityServiceRequests.isPaid,
      customerNotes: identityServiceRequests.customerNotes,
      agentNotes: identityServiceRequests.agentNotes,
      createdAt: identityServiceRequests.createdAt,
      userName: users.name,
      userEmail: users.email,
      userPhone: users.phone,
    })
      .from(identityServiceRequests)
      .leftJoin(users, eq(identityServiceRequests.userId, users.id))
      .orderBy(desc(identityServiceRequests.createdAt));

    let requests;
    if (status && status !== 'all') {
      requests = await query.where(eq(identityServiceRequests.status, status as string));
    } else {
      requests = await query;
    }

    const [stats] = await db.select({
      pending: sql<number>`COUNT(*) FILTER (WHERE status = 'pending')`,
      pickup: sql<number>`COUNT(*) FILTER (WHERE status = 'pickup')`,
      completed: sql<number>`COUNT(*) FILTER (WHERE status = 'completed')`,
      total: count(),
    }).from(identityServiceRequests);

    res.json(formatResponse('success', 200, 'Agent requests retrieved', { requests, stats }));
  } catch (error: any) {
    logger.error('Get agent requests error', { error: error.message });
    res.status(500).json(formatErrorResponse(500, 'Failed to get requests'));
  }
});

router.put('/agent/request/:id/status', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { status, agentNotes, slipUrl } = req.body;

    const [agent] = await db.select()
      .from(identityAgents)
      .where(and(eq(identityAgents.userId, userId!), eq(identityAgents.isActive, true)))
      .limit(1);

    if (!agent) {
      return res.status(403).json(formatErrorResponse(403, 'Not an identity agent'));
    }

    if (!['pending', 'pickup', 'completed'].includes(status)) {
      return res.status(400).json(formatErrorResponse(400, 'Invalid status'));
    }

    const [request] = await db.select()
      .from(identityServiceRequests)
      .where(eq(identityServiceRequests.id, id))
      .limit(1);

    if (!request) {
      return res.status(404).json(formatErrorResponse(404, 'Request not found'));
    }

    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (status === 'pickup' && !request.assignedAgentId) {
      updateData.assignedAgentId = agent.id;
      updateData.assignedAt = new Date();
    }

    if (status === 'completed') {
      updateData.completedAt = new Date();
      if (slipUrl) {
        updateData.slipUrl = slipUrl;
      }
    }

    if (agentNotes) {
      updateData.agentNotes = agentNotes;
    }

    const [updated] = await db.update(identityServiceRequests)
      .set(updateData)
      .where(eq(identityServiceRequests.id, id))
      .returning();

    await db.insert(identityRequestActivity).values({
      requestId: id,
      actorType: 'agent',
      actorId: agent.id,
      action: `status_changed_to_${status}`,
      previousStatus: request.status,
      newStatus: status,
      comment: agentNotes || `Status updated to ${status}`,
    });

    if (status === 'completed') {
      await db.update(identityAgents)
        .set({
          currentActiveRequests: sql`${identityAgents.currentActiveRequests} - 1`,
          totalCompletedRequests: sql`${identityAgents.totalCompletedRequests} + 1`,
        })
        .where(eq(identityAgents.id, agent.id));
    } else if (status === 'pickup' && request.status === 'pending') {
      await db.update(identityAgents)
        .set({ currentActiveRequests: sql`${identityAgents.currentActiveRequests} + 1` })
        .where(eq(identityAgents.id, agent.id));
    }

    logger.info('Identity request status updated', { requestId: id, status, agentId: agent.id });
    res.json(formatResponse('success', 200, 'Status updated', { request: updated }));
  } catch (error: any) {
    logger.error('Update request status error', { error: error.message });
    res.status(500).json(formatErrorResponse(500, 'Failed to update status'));
  }
});

export default router;
