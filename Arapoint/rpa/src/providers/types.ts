export type ProviderType = 'api' | 'rpa';

export interface ProviderCredentials {
  [key: string]: string;
}

export interface ProviderResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  provider: string;
  executionTime: number;
  timestamp: Date;
}

export interface ServiceRequest {
  id: string;
  service: string;
  action: string;
  data: Record<string, any>;
  priority?: number;
  retryCount?: number;
}

export interface ProviderConfig {
  type: ProviderType;
  name: string;
  requires: string[];
  docs?: string;
}

export interface ServiceConfig {
  provider: string;
  fallback: string | null;
  enabled: boolean;
  description: string;
}

export abstract class BaseProvider {
  abstract readonly name: string;
  abstract readonly type: ProviderType;
  protected credentials: ProviderCredentials = {};

  constructor(credentials?: ProviderCredentials) {
    if (credentials) {
      this.credentials = credentials;
    }
  }

  abstract initialize(): Promise<void>;
  abstract execute(request: ServiceRequest): Promise<ProviderResult>;
  abstract cleanup(): Promise<void>;
  abstract healthCheck(): Promise<boolean>;

  protected getCredential(key: string): string {
    const value = this.credentials[key] || process.env[key];
    if (!value) {
      throw new Error(`Missing required credential: ${key}`);
    }
    return value;
  }

  protected log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    const timestamp = new Date().toISOString();
    console[level](`[${timestamp}] [${this.name}] ${message}`);
  }
}

export abstract class RPAProvider extends BaseProvider {
  readonly type: ProviderType = 'rpa';
  protected browser: any = null;
  protected page: any = null;

  abstract login(): Promise<boolean>;
  abstract navigateToService(service: string): Promise<void>;
  abstract submitQuery(data: Record<string, any>): Promise<any>;
  abstract parseResult(): Promise<any>;

  async execute(request: ServiceRequest): Promise<ProviderResult> {
    const startTime = Date.now();
    try {
      await this.initialize();
      const loggedIn = await this.login();
      if (!loggedIn) {
        throw new Error('Failed to login to service portal');
      }

      await this.navigateToService(request.action);
      await this.submitQuery(request.data);
      const result = await this.parseResult();

      return {
        success: true,
        data: result,
        provider: this.name,
        executionTime: Date.now() - startTime,
        timestamp: new Date()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        provider: this.name,
        executionTime: Date.now() - startTime,
        timestamp: new Date()
      };
    } finally {
      await this.cleanup();
    }
  }
}

export abstract class APIProvider extends BaseProvider {
  readonly type: ProviderType = 'api';
  protected baseUrl: string = '';
  protected headers: Record<string, string> = {};

  abstract makeRequest(endpoint: string, data: Record<string, any>): Promise<any>;

  async execute(request: ServiceRequest): Promise<ProviderResult> {
    const startTime = Date.now();
    try {
      await this.initialize();
      const result = await this.makeRequest(request.action, request.data);

      return {
        success: true,
        data: result,
        provider: this.name,
        executionTime: Date.now() - startTime,
        timestamp: new Date()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        provider: this.name,
        executionTime: Date.now() - startTime,
        timestamp: new Date()
      };
    }
  }

  async cleanup(): Promise<void> {
    // API providers typically don't need cleanup
  }
}
