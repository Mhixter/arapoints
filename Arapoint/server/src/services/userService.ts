import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/database';
import { users, transactions } from '../db/schema';
import { eq } from 'drizzle-orm';
import { config } from '../config/env';
import { logger } from '../utils/logger';
import { virtualAccountService } from './virtualAccountService';

interface RegisterInput {
  email: string;
  name: string;
  phone?: string;
  password: string;
  emailVerified?: boolean;
}

interface LoginInput {
  email: string;
  password: string;
}

interface TokenPayload {
  userId: string;
  email: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export const userService = {
  async register(input: RegisterInput) {
    const { email, name, phone, password, emailVerified } = input;

    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingUser.length > 0) {
      throw new Error('Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [newUser] = await db.insert(users).values({
      email,
      name,
      phone,
      passwordHash: passwordHash,
      walletBalance: '0',
      kycStatus: 'pending',
      emailVerified: emailVerified || false,
    }).returning();

    const tokens = this.generateTokens({ userId: newUser.id, email: newUser.email });

    logger.info('User registered', { userId: newUser.id, email: newUser.email });

    if (virtualAccountService.isConfigured()) {
      virtualAccountService.generateVirtualAccountForUser(newUser.id)
        .then(result => {
          if (result.success) {
            logger.info('Virtual account auto-generated on registration', { userId: newUser.id });
          } else {
            logger.warn('Failed to auto-generate virtual account', { userId: newUser.id, message: result.message });
          }
        })
        .catch(err => {
          logger.error('Error auto-generating virtual account', { userId: newUser.id, error: err.message });
        });
    }

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        phone: newUser.phone,
      },
      ...tokens,
    };
  },

  async login(input: LoginInput) {
    const { email, password } = input;

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash || '');
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    const tokens = this.generateTokens({ userId: user.id, email: user.email });

    logger.info('User logged in', { userId: user.id, email: user.email });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        walletBalance: user.walletBalance,
        kycStatus: user.kycStatus,
      },
      ...tokens,
    };
  },

  async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, config.REFRESH_TOKEN_SECRET) as TokenPayload;
      
      const [user] = await db.select().from(users).where(eq(users.id, decoded.userId)).limit(1);
      if (!user) {
        throw new Error('User not found');
      }

      const tokens = this.generateTokens({ userId: user.id, email: user.email });

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        ...tokens,
      };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  },

  async getProfile(userId: string) {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      walletBalance: user.walletBalance,
      bvn: user.bvn ? `***${user.bvn.slice(-4)}` : null,
      nin: user.nin ? `***${user.nin.slice(-4)}` : null,
      kycStatus: user.kycStatus,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    };
  },

  async updateProfile(userId: string, data: { name?: string; phone?: string }) {
    const [updatedUser] = await db.update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) {
      throw new Error('User not found');
    }

    logger.info('Profile updated', { userId });

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      phone: updatedUser.phone,
    };
  },

  async getDashboard(userId: string) {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) {
      throw new Error('User not found');
    }

    const userTransactions = await db.select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .limit(5);

    return {
      user: {
        name: user.name,
        walletBalance: user.walletBalance,
        kycStatus: user.kycStatus,
      },
      recentTransactions: userTransactions,
      stats: {
        totalTransactions: userTransactions.length,
      },
    };
  },

  generateTokens(payload: TokenPayload): AuthTokens {
    const accessToken = jwt.sign(payload, config.JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign(payload, config.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

    return { accessToken, refreshToken };
  },

  verifyToken(token: string): TokenPayload {
    return jwt.verify(token, config.JWT_SECRET) as TokenPayload;
  },
};
