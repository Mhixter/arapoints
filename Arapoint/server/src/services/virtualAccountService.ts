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

  async generateVirtualAccountForUser(userId: string): Promise<VirtualAccountResult> {
    const existingAccount = await db.select()
      .from(virtualAccounts)
      .where(eq(virtualAccounts.userId, userId))
      .limit(1);

    if (existingAccount.length > 0 && existingAccount[0].accountNumber) {
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

    // Try PayVessel if configured and user has KYC verification
    if (payvesselService.isConfigured() && (user.nin || user.bvn)) {
      const result = await payvesselService.createVirtualAccount({
        email: user.email,
        name: user.name,
        phoneNumber: user.phone || '08000000000',
        bvn: user.bvn || undefined,
        nin: user.nin || undefined,
      });

      if (result.success && result.account) {
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
      }
    }

    // Fallback: Generate a temporary account number for unverified users
    const tempAccountNumber = `90${Date.now().toString().slice(-11)}`.slice(0, 12);
    const accountName = `${user.name} - Arapoint`;

    await db.insert(virtualAccounts).values({
      userId: userId,
      bankName: '9Payment Service Bank',
      bankCode: '120001',
      accountNumber: tempAccountNumber,
      accountName: accountName,
      dedicatedAccountId: `temp-${userId}`,
      providerSlug: 'temporary',
      isActive: true,
    }).onConflictDoUpdate({
      target: virtualAccounts.userId,
      set: {
        bankName: '9Payment Service Bank',
        bankCode: '120001',
        accountNumber: tempAccountNumber,
        accountName: accountName,
        dedicatedAccountId: `temp-${userId}`,
        providerSlug: 'temporary',
        isActive: true,
        updatedAt: new Date(),
      },
    });

    logger.info('Temporary virtual account created (awaiting KYC)', { 
      userId, 
      accountNumber: tempAccountNumber,
    });

    return {
      success: true,
      account: {
        bankName: '9Payment Service Bank',
        accountNumber: tempAccountNumber,
        accountName: accountName,
      },
      message: 'Temporary virtual account created. Complete KYC verification to enable full functionality.',
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
          message: 'Please verify your NIN or BVN to generate a virtual account',
        };
      }
    }

    return {
      configured: true,
      shouldGenerate: true,
      message: 'Virtual account not yet generated',
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
