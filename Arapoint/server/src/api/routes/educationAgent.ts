import { Router, Request, Response } from 'express';
import { logger } from '../../utils/logger';
import { formatResponse, formatErrorResponse } from '../../utils/helpers';
import { db } from '../../config/database';
import { 
  educationAgents,
  educationServiceRequests, 
  adminUsers,
  users
} from '../../db/schema';
import { eq, desc, count, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here';

const educationAgentAuthMiddleware = async (req: Request, res: Response, next: Function) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(formatErrorResponse(401, 'Authentication required'));
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    if (decoded.role !== 'education_agent') {
      return res.status(403).json(formatErrorResponse(403, 'Access denied. Education agent role required'));
    }

    const [agent] = await db.select()
      .from(educationAgents)
      .where(eq(educationAgents.id, decoded.agentId))
      .limit(1);

    if (!agent || !agent.isAvailable) {
      return res.status(403).json(formatErrorResponse(403, 'Agent account is inactive'));
    }

    (req as any).agentId = agent.id;
    (req as any).adminUserId = agent.adminUserId;
    next();
  } catch (error: any) {
    logger.error('Education agent auth error', { error: error.message });
    return res.status(401).json(formatErrorResponse(401, 'Invalid or expired token'));
  }
};

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json(formatErrorResponse(400, 'Email and password are required'));
    }

    const [adminUser] = await db.select()
      .from(adminUsers)
      .where(eq(adminUsers.email, email.toLowerCase()))
      .limit(1);

    if (!adminUser || !adminUser.isActive) {
      return res.status(401).json(formatErrorResponse(401, 'Invalid credentials'));
    }

    const passwordValid = await bcrypt.compare(password, adminUser.passwordHash);
    if (!passwordValid) {
      return res.status(401).json(formatErrorResponse(401, 'Invalid credentials'));
    }

    const [agent] = await db.select()
      .from(educationAgents)
      .where(eq(educationAgents.adminUserId, adminUser.id))
      .limit(1);

    if (!agent) {
      return res.status(403).json(formatErrorResponse(403, 'Not authorized as Education agent'));
    }

    if (!agent.isAvailable) {
      return res.status(403).json(formatErrorResponse(403, 'Agent account is currently inactive'));
    }

    const token = jwt.sign(
      { 
        agentId: agent.id, 
        adminUserId: adminUser.id, 
        email: adminUser.email,
        role: 'education_agent' 
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    await db.update(adminUsers)
      .set({ lastLogin: new Date() })
      .where(eq(adminUsers.id, adminUser.id));

    logger.info('Education agent login', { agentId: agent.id, email });

    res.json(formatResponse('success', 200, 'Login successful', {
      token,
      agent: {
        id: agent.id,
        name: adminUser.name,
        email: adminUser.email,
        employeeId: agent.employeeId,
        currentActiveRequests: agent.currentActiveRequests,
        totalCompletedRequests: agent.totalCompletedRequests,
      },
    }));
  } catch (error: any) {
    logger.error('Education agent login error', { error: error.message });
    res.status(500).json(formatErrorResponse(500, 'Login failed'));
  }
});

router.get('/me', educationAgentAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const agentId = (req as any).agentId;

    const [agent] = await db.select({
      id: educationAgents.id,
      employeeId: educationAgents.employeeId,
      specializations: educationAgents.specializations,
      maxActiveRequests: educationAgents.maxActiveRequests,
      currentActiveRequests: educationAgents.currentActiveRequests,
      totalCompletedRequests: educationAgents.totalCompletedRequests,
      isAvailable: educationAgents.isAvailable,
      name: adminUsers.name,
      email: adminUsers.email,
    })
      .from(educationAgents)
      .leftJoin(adminUsers, eq(educationAgents.adminUserId, adminUsers.id))
      .where(eq(educationAgents.id, agentId))
      .limit(1);

    res.json(formatResponse('success', 200, 'Agent profile', { agent }));
  } catch (error: any) {
    logger.error('Get education agent profile error', { error: error.message });
    res.status(500).json(formatErrorResponse(500, 'Failed to get profile'));
  }
});

router.get('/stats', educationAgentAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const [stats] = await db.select({
      pending: sql<number>`COUNT(*) FILTER (WHERE status = 'pending')`,
      pickup: sql<number>`COUNT(*) FILTER (WHERE status = 'pickup')`,
      completed: sql<number>`COUNT(*) FILTER (WHERE status = 'completed')`,
      total: count(),
    }).from(educationServiceRequests);

    res.json(formatResponse('success', 200, 'Stats retrieved', { stats }));
  } catch (error: any) {
    logger.error('Get education stats error', { error: error.message });
    res.status(500).json(formatErrorResponse(500, 'Failed to get stats'));
  }
});

router.get('/requests', educationAgentAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { status } = req.query;

    let query = db.select({
      id: educationServiceRequests.id,
      trackingId: educationServiceRequests.trackingId,
      serviceType: educationServiceRequests.serviceType,
      examYear: educationServiceRequests.examYear,
      registrationNumber: educationServiceRequests.registrationNumber,
      candidateName: educationServiceRequests.candidateName,
      status: educationServiceRequests.status,
      fee: educationServiceRequests.fee,
      isPaid: educationServiceRequests.isPaid,
      customerNotes: educationServiceRequests.customerNotes,
      agentNotes: educationServiceRequests.agentNotes,
      resultUrl: educationServiceRequests.resultUrl,
      createdAt: educationServiceRequests.createdAt,
      userName: users.name,
      userEmail: users.email,
      userPhone: users.phone,
    })
      .from(educationServiceRequests)
      .leftJoin(users, eq(educationServiceRequests.userId, users.id))
      .orderBy(desc(educationServiceRequests.createdAt));

    let requests;
    if (status && status !== 'all') {
      requests = await query.where(eq(educationServiceRequests.status, status as string));
    } else {
      requests = await query;
    }

    res.json(formatResponse('success', 200, 'Requests retrieved', { requests }));
  } catch (error: any) {
    logger.error('Get education requests error', { error: error.message });
    res.status(500).json(formatErrorResponse(500, 'Failed to get requests'));
  }
});

router.put('/requests/:id/status', educationAgentAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const agentId = (req as any).agentId;
    const { id } = req.params;
    const { status, agentNotes, resultUrl, resultData } = req.body;

    if (!['pending', 'pickup', 'completed'].includes(status)) {
      return res.status(400).json(formatErrorResponse(400, 'Invalid status'));
    }

    const [request] = await db.select()
      .from(educationServiceRequests)
      .where(eq(educationServiceRequests.id, id))
      .limit(1);

    if (!request) {
      return res.status(404).json(formatErrorResponse(404, 'Request not found'));
    }

    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (status === 'pickup' && !request.assignedAgentId) {
      updateData.assignedAgentId = agentId;
      updateData.assignedAt = new Date();
    }

    if (status === 'completed') {
      updateData.completedAt = new Date();
      if (resultUrl) updateData.resultUrl = resultUrl;
      if (resultData) updateData.resultData = resultData;
    }

    if (agentNotes) {
      updateData.agentNotes = agentNotes;
    }

    await db.update(educationServiceRequests)
      .set(updateData)
      .where(eq(educationServiceRequests.id, id));

    logger.info('Education request status updated', { requestId: id, status, agentId });

    res.json(formatResponse('success', 200, 'Request updated'));
  } catch (error: any) {
    logger.error('Update education request error', { error: error.message });
    res.status(500).json(formatErrorResponse(500, 'Failed to update request'));
  }
});

export default router;
