import { config } from '../../config/env';
import { logger } from '../../utils/logger';

export interface WorkerResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
  shouldRetry?: boolean;
}

export interface ServiceCredentials {
  username?: string;
  password?: string;
  apiKey?: string;
  authToken?: string;
}

export abstract class BaseWorker {
  protected abstract serviceName: string;
  protected workerId: string;

  constructor() {
    this.workerId = `${this.constructor.name}-${Date.now()}`;
  }

  abstract execute(queryData: Record<string, unknown>): Promise<WorkerResult>;

  protected async getCredentials(): Promise<ServiceCredentials> {
    logger.info(`Fetching credentials for ${this.serviceName}`, { service: this.serviceName });
    
    return {
      username: config.BVN_SERVICE_USERNAME || '',
      password: config.BVN_SERVICE_PASSWORD || '',
    };
  }

  protected async retry<T>(
    fn: () => Promise<T>,
    maxAttempts: number = 3,
    context: string = 'operation'
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        logger.info(`Attempting ${context}`, { attempt: attempt + 1, maxAttempts });
        const result = await fn();
        if (attempt > 0) {
          logger.info(`${context} succeeded after retry`, { attempt: attempt + 1 });
        }
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        logger.warn(`${context} failed`, {
          attempt: attempt + 1,
          maxAttempts,
          error: lastError.message,
        });

        if (attempt < maxAttempts - 1) {
          const delay = Math.pow(2, attempt) * 1000;
          logger.info(`Waiting before retry`, { delay });
          await this.sleep(delay);
        }
      }
    }

    logger.error(`${context} failed after all retries`, {
      maxAttempts,
      error: lastError?.message,
    });
    throw lastError || new Error(`${context} failed after ${maxAttempts} attempts`);
  }

  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  protected createSuccessResult(data: Record<string, unknown>): WorkerResult {
    return {
      success: true,
      data,
    };
  }

  protected createErrorResult(error: string, shouldRetry: boolean = false): WorkerResult {
    return {
      success: false,
      error,
      shouldRetry,
    };
  }

  protected isValidBVN(bvn: string): boolean {
    return /^\d{11}$/.test(bvn);
  }

  protected isValidNIN(nin: string): boolean {
    return /^\d{11}$/.test(nin);
  }

  protected isValidPhoneNumber(phone: string): boolean {
    return /^\+?[\d]{10,15}$/.test(phone);
  }
}
