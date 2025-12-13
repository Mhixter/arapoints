import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';

const YOUVERIFY_BASE_URL = process.env.YOUVERIFY_SANDBOX === 'true' 
  ? 'https://api.sandbox.youverify.co'
  : 'https://api.youverify.co';

interface YouVerifyResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
}

interface NINData {
  id: string;
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  town: string;
  lga: string;
  state: string;
  birthState: string;
  birthLga: string;
  birthCountry: string;
  religion: string;
  photo: string;
  signature: string;
  nextOfKinState: string;
}

interface BVNData {
  id: string;
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  gender?: string;
  address?: string;
  enrollmentBranch: string;
  enrollmentInstitution: string;
  photo: string;
  watchListed?: boolean;
}

interface VerificationResult<T> {
  success: boolean;
  data: T | null;
  error?: string;
  reference: string;
}

class YouVerifyService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: YOUVERIFY_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use((config) => {
      const apiKey = process.env.YOUVERIFY_API_KEY;
      if (!apiKey) {
        throw new Error('YOUVERIFY_API_KEY is not configured');
      }
      config.headers.Authorization = `Bearer ${apiKey}`;
      return config;
    });
  }

  isConfigured(): boolean {
    return !!process.env.YOUVERIFY_API_KEY;
  }

  async verifyNIN(nin: string, metadata?: Record<string, any>): Promise<VerificationResult<NINData>> {
    const reference = `NIN-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    try {
      logger.info('YouVerify NIN verification started', { nin: nin.substring(0, 4) + '***', reference });

      const response = await this.client.post<YouVerifyResponse<NINData>>('/v2/api/identity/ng/nin', {
        id: nin,
        isSubjectConsent: true,
        metadata: { 
          requestId: reference,
          ...metadata 
        },
      });

      if (response.data.success && response.data.data) {
        logger.info('YouVerify NIN verification successful', { reference });
        return {
          success: true,
          data: response.data.data,
          reference,
        };
      }

      logger.warn('YouVerify NIN verification failed', { reference, message: response.data.message });
      return {
        success: false,
        data: null,
        error: response.data.message || 'NIN verification failed',
        reference,
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'NIN verification failed';
      logger.error('YouVerify NIN verification error', { reference, error: errorMessage });
      return {
        success: false,
        data: null,
        error: errorMessage,
        reference,
      };
    }
  }

  async verifyBVN(bvn: string, premium: boolean = false, metadata?: Record<string, any>): Promise<VerificationResult<BVNData>> {
    const reference = `BVN-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    try {
      logger.info('YouVerify BVN verification started', { bvn: bvn.substring(0, 4) + '***', reference, premium });

      const response = await this.client.post<YouVerifyResponse<BVNData>>('/v2/api/identity/ng/bvn', {
        id: bvn,
        isSubjectConsent: true,
        premiumBVN: premium,
        metadata: { 
          requestId: reference,
          ...metadata 
        },
      });

      if (response.data.success && response.data.data) {
        logger.info('YouVerify BVN verification successful', { reference });
        return {
          success: true,
          data: response.data.data,
          reference,
        };
      }

      logger.warn('YouVerify BVN verification failed', { reference, message: response.data.message });
      return {
        success: false,
        data: null,
        error: response.data.message || 'BVN verification failed',
        reference,
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'BVN verification failed';
      logger.error('YouVerify BVN verification error', { reference, error: errorMessage });
      return {
        success: false,
        data: null,
        error: errorMessage,
        reference,
      };
    }
  }

  async verifyVNIN(vnin: string, validationData?: { firstName?: string; lastName?: string; dateOfBirth?: string }, metadata?: Record<string, any>): Promise<VerificationResult<NINData>> {
    const reference = `VNIN-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    try {
      logger.info('YouVerify vNIN verification started', { reference });

      const payload: any = {
        id: vnin,
        isSubjectConsent: true,
        metadata: { 
          requestId: reference,
          ...metadata 
        },
      };

      if (validationData) {
        payload.validations = {
          data: validationData,
        };
      }

      const response = await this.client.post<YouVerifyResponse<NINData>>('/v2/api/identity/ng/vnin', payload);

      if (response.data.success && response.data.data) {
        logger.info('YouVerify vNIN verification successful', { reference });
        return {
          success: true,
          data: response.data.data,
          reference,
        };
      }

      logger.warn('YouVerify vNIN verification failed', { reference, message: response.data.message });
      return {
        success: false,
        data: null,
        error: response.data.message || 'vNIN verification failed',
        reference,
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'vNIN verification failed';
      logger.error('YouVerify vNIN verification error', { reference, error: errorMessage });
      return {
        success: false,
        data: null,
        error: errorMessage,
        reference,
      };
    }
  }
}

export const youverifyService = new YouVerifyService();

export type { NINData, BVNData, VerificationResult };
