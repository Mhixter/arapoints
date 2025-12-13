import { Router, Request, Response } from 'express';
import { db } from '../../config/database';
import { users, transactions, identityVerifications, bvnServices, educationServices, airtimeServices, dataServices, electricityServices, cableServices } from '../../db/schema';
import { eq, desc, sql, and } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({
        status: 'error',
        code: 401,
        message: 'Unauthorized',
      });
    }

    const user = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        walletBalance: users.walletBalance,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user.length) {
      return res.status(404).json({
        status: 'error',
        code: 404,
        message: 'User not found',
      });
    }

    const [transactionCountResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(transactions)
      .where(eq(transactions.userId, userId));

    const [ninCountResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(identityVerifications)
      .where(eq(identityVerifications.userId, userId));

    const [bvnCountResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(bvnServices)
      .where(eq(bvnServices.userId, userId));

    const [educationCountResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(educationServices)
      .where(eq(educationServices.userId, userId));

    const [airtimeCountResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(airtimeServices)
      .where(eq(airtimeServices.userId, userId));

    const [airtimeSuccessCountResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(airtimeServices)
      .where(and(eq(airtimeServices.userId, userId), eq(airtimeServices.status, 'completed')));

    const [dataCountResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(dataServices)
      .where(eq(dataServices.userId, userId));

    const [dataSuccessCountResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(dataServices)
      .where(and(eq(dataServices.userId, userId), eq(dataServices.status, 'completed')));

    const [electricityCountResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(electricityServices)
      .where(eq(electricityServices.userId, userId));

    const [electricitySuccessCountResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(electricityServices)
      .where(and(eq(electricityServices.userId, userId), eq(electricityServices.status, 'completed')));

    const [cableCountResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(cableServices)
      .where(eq(cableServices.userId, userId));

    const [cableSuccessCountResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(cableServices)
      .where(and(eq(cableServices.userId, userId), eq(cableServices.status, 'completed')));

    const totalVerifications = 
      Number(ninCountResult?.count || 0) + 
      Number(bvnCountResult?.count || 0) + 
      Number(educationCountResult?.count || 0);

    res.json({
      status: 'success',
      code: 200,
      data: {
        user: {
          name: user[0].name,
          email: user[0].email,
          walletBalance: parseFloat(user[0].walletBalance as string || '0'),
        },
        stats: {
          totalTransactions: Number(transactionCountResult?.count || 0),
          totalVerifications,
          ninVerifications: Number(ninCountResult?.count || 0),
          bvnVerifications: Number(bvnCountResult?.count || 0),
          educationVerifications: Number(educationCountResult?.count || 0),
          airtimeTotal: Number(airtimeCountResult?.count || 0),
          airtimeSuccess: Number(airtimeSuccessCountResult?.count || 0),
          dataTotal: Number(dataCountResult?.count || 0),
          dataSuccess: Number(dataSuccessCountResult?.count || 0),
          electricityTotal: Number(electricityCountResult?.count || 0),
          electricitySuccess: Number(electricitySuccessCountResult?.count || 0),
          cableTotal: Number(cableCountResult?.count || 0),
          cableSuccess: Number(cableSuccessCountResult?.count || 0),
        },
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      status: 'error',
      code: 500,
      message: 'Failed to fetch dashboard stats',
    });
  }
});

router.get('/transactions', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const limit = parseInt(req.query.limit as string) || 10;
    
    if (!userId) {
      return res.status(401).json({
        status: 'error',
        code: 401,
        message: 'Unauthorized',
      });
    }

    const recentTransactions = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt))
      .limit(limit);

    res.json({
      status: 'success',
      code: 200,
      data: {
        transactions: recentTransactions.map((tx) => ({
          id: tx.id,
          type: tx.transactionType?.includes('credit') || tx.transactionType?.includes('fund') ? 'credit' : 'debit',
          description: tx.transactionType?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Transaction',
          amount: parseFloat(tx.amount as string || '0'),
          status: tx.status,
          date: tx.createdAt,
          reference: tx.referenceId,
        })),
      },
    });
  } catch (error) {
    console.error('Dashboard transactions error:', error);
    res.status(500).json({
      status: 'error',
      code: 500,
      message: 'Failed to fetch transactions',
    });
  }
});

router.get('/verifications', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const limit = parseInt(req.query.limit as string) || 10;
    
    if (!userId) {
      return res.status(401).json({
        status: 'error',
        code: 401,
        message: 'Unauthorized',
      });
    }

    const ninVerifications = await db
      .select({
        id: identityVerifications.id,
        type: sql<string>`'NIN'`,
        reference: identityVerifications.nin,
        status: identityVerifications.status,
        details: identityVerifications.verificationType,
        date: identityVerifications.createdAt,
      })
      .from(identityVerifications)
      .where(eq(identityVerifications.userId, userId))
      .orderBy(desc(identityVerifications.createdAt))
      .limit(limit);

    const bvnVerificationsData = await db
      .select({
        id: bvnServices.id,
        type: sql<string>`'BVN'`,
        reference: bvnServices.bvn,
        status: bvnServices.status,
        details: bvnServices.serviceType,
        date: bvnServices.createdAt,
      })
      .from(bvnServices)
      .where(eq(bvnServices.userId, userId))
      .orderBy(desc(bvnServices.createdAt))
      .limit(limit);

    const eduVerifications = await db
      .select({
        id: educationServices.id,
        type: educationServices.serviceType,
        reference: educationServices.registrationNumber,
        status: educationServices.status,
        details: sql<string>`CONCAT('Year ', ${educationServices.examYear})`,
        date: educationServices.createdAt,
      })
      .from(educationServices)
      .where(eq(educationServices.userId, userId))
      .orderBy(desc(educationServices.createdAt))
      .limit(limit);

    interface VerificationItem {
      id: string;
      type: string | null;
      reference: string | null;
      status: string | null;
      details: string | null;
      date: Date | null;
    }

    const allVerifications: VerificationItem[] = [
      ...ninVerifications.map((v) => ({ ...v, type: 'NIN' as string })),
      ...bvnVerificationsData.map((v) => ({ ...v, type: 'BVN' as string })),
      ...eduVerifications.map((v) => ({ ...v, type: v.type?.toUpperCase() || 'EDUCATION' })),
    ].sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    }).slice(0, limit);

    res.json({
      status: 'success',
      code: 200,
      data: {
        verifications: allVerifications.map((v) => ({
          id: v.id,
          type: v.type,
          reference: v.reference || 'N/A',
          status: v.status === 'completed' ? 'verified' : v.status || 'pending',
          details: v.details || '',
          date: v.date,
        })),
      },
    });
  } catch (error) {
    console.error('Dashboard verifications error:', error);
    res.status(500).json({
      status: 'error',
      code: 500,
      message: 'Failed to fetch verifications',
    });
  }
});

export default router;
