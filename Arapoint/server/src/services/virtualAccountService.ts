import { db } from '../config/database';
import { virtualAccounts, users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '../utils/logger';
import { payvesselService } from './payvesselService';

interface VirtualAccountResult {
  success: boolean;
  account?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  message: string;
}

export const virtualAccountService = {
  isConfigured(): boolean {
    return payvesselService.isConfigured();
  },

  async generateVirtualAccountForUser(userId: string, nin?: string, bvn?: string): Promise<VirtualAccountResult> {
    const existingAccount = await db.select()
      .from(virtualAccounts)
      .where(eq(virtualAccounts.userId, userId))
      .limit(1);

    if (existingAccount.length > 0 && existingAccount[0].accountNumber && existingAccount[0].providerSlug === 'payvessel') {
      return {
        success: true,
        account: {
          bankName: existingAccount[0].bankName || '9Payment Service Bank',
          accountNumber: existingAccount[0].accountNumber,
          accountName: existingAccount[0].accountName || 'Arapoint Account',
        },
        message: 'Virtual account retrieved successfully',
      };
    }

    const userResult = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userResult.length === 0) {
      return {
        success: false,
        message: 'User not found',
      };
    }

    const user = userResult[0];
    const userNin = nin || user.nin;
    const userBvn = bvn || user.bvn;

    // PayVessel account is ONLY created after NIN/BVN verification
    if (!payvesselService.isConfigured()) {
      return {
        success: false,
        message: 'Payment gateway not configured. Please contact support.',
      };
    }

    if (!userNin && !userBvn) {
      return {
        success: false,
        message: 'NIN or BVN verification is required to generate a virtual account. Please complete KYC verification first.',
      };
    }

    const result = await payvesselService.createVirtualAccount({
      email: user.email,
      name: user.name,
      phoneNumber: user.phone || '08000000000',
      bvn: userBvn || undefined,
      nin: userNin || undefined,
    });

    if (!result.success || !result.account) {
      return {
        success: false,
        message: result.error || 'Failed to generate virtual account. Please try again later.',
      };
    }

    await db.insert(virtualAccounts).values({
      userId: userId,
      bankName: result.account.bankName,
      bankCode: '120001',
      accountNumber: result.account.accountNumber,
      accountName: result.account.accountName,
      dedicatedAccountId: result.account.trackingReference,
      providerSlug: 'payvessel',
      isActive: true,
    }).onConflictDoUpdate({
      target: virtualAccounts.userId,
      set: {
        bankName: result.account.bankName,
        bankCode: '120001',
        accountNumber: result.account.accountNumber,
        accountName: result.account.accountName,
        dedicatedAccountId: result.account.trackingReference,
        providerSlug: 'payvessel',
        isActive: true,
        updatedAt: new Date(),
      },
    });

    logger.info('Virtual account created via Payvessel', { 
      userId, 
      accountNumber: result.account.accountNumber,
      trackingReference: result.account.trackingReference,
    });

    return {
      success: true,
      account: {
        bankName: result.account.bankName,
        accountNumber: result.account.accountNumber,
        accountName: result.account.accountName,
      },
      message: 'Virtual account created successfully',
    };
  },

  async getVirtualAccount(userId: string): Promise<{
    configured: boolean;
    shouldGenerate?: boolean;
    requiresKyc?: boolean;
    account?: {
      bankName: string;
      accountNumber: string;
      accountName: string;
    };
    message: string;
  }> {
    const existingAccount = await db.select()
      .from(virtualAccounts)
      .where(eq(virtualAccounts.userId, userId))
      .limit(1);

    if (existingAccount.length > 0 && existingAccount[0].accountNumber) {
      return {
        configured: true,
        account: {
          bankName: existingAccount[0].bankName || '9Payment Service Bank',
          accountNumber: existingAccount[0].accountNumber,
          accountName: existingAccount[0].accountName || 'Arapoint Account',
        },
        message: 'Virtual account found',
      };
    }

    if (!payvesselService.isConfigured()) {
      return {
        configured: false,
        message: 'Payment gateway not configured',
      };
    }

    const userResult = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userResult.length > 0) {
      const user = userResult[0];
      if (!user.nin && !user.bvn) {
        return {
          configured: true,
          requiresKyc: true,
          message: 'Please complete NIN or BVN verification to generate a virtual account. Submit your NIN to proceed.',
        };
      }
    }

    return {
      configured: true,
      shouldGenerate: true,
      message: 'Virtual account generation pending. Please contact support if you have verified your identity.',
    };
  },

  async findUserByAccountNumber(accountNumber: string): Promise<string | null> {
    const account = await db.select()
      .from(virtualAccounts)
      .where(eq(virtualAccounts.accountNumber, accountNumber))
      .limit(1);

    if (account.length > 0) {
      return account[0].userId;
    }

    return null;
  },
};
