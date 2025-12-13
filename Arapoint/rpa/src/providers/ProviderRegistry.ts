import { BaseProvider, ProviderResult, ServiceRequest, ServiceConfig, ProviderConfig } from './types';
import providersConfig from '../config/providers.json';

type ProviderFactory = (credentials?: Record<string, string>) => BaseProvider;

export class ProviderRegistry {
  private static instance: ProviderRegistry;
  private providers: Map<string, ProviderFactory> = new Map();
  private activeProviders: Map<string, BaseProvider> = new Map();
  private initializedProviders: Set<string> = new Set();
  private config: typeof providersConfig = providersConfig;

  private constructor() {}

  static getInstance(): ProviderRegistry {
    if (!ProviderRegistry.instance) {
      ProviderRegistry.instance = new ProviderRegistry();
    }
    return ProviderRegistry.instance;
  }

  registerProvider(name: string, factory: ProviderFactory): void {
    this.providers.set(name, factory);
    console.log(`[ProviderRegistry] Registered provider: ${name}`);
  }

  getProviderFactory(name: string): ProviderFactory | undefined {
    return this.providers.get(name);
  }

  isProviderRegistered(name: string): boolean {
    return this.providers.has(name);
  }

  async getProvider(name: string, credentials?: Record<string, string>): Promise<BaseProvider> {
    if (this.activeProviders.has(name) && this.initializedProviders.has(name)) {
      return this.activeProviders.get(name)!;
    }

    const factory = this.providers.get(name);
    if (!factory) {
      throw new Error(`Provider not registered: ${name}. Available providers: ${this.listProviders().join(', ')}`);
    }

    const provider = factory(credentials);
    
    if (!this.initializedProviders.has(name)) {
      await provider.initialize();
      this.initializedProviders.add(name);
    }
    
    this.activeProviders.set(name, provider);
    return provider;
  }

  getServiceConfig(category: string, service: string): ServiceConfig | null {
    const categoryConfig = (this.config as any)[category];
    if (!categoryConfig) return null;
    return categoryConfig[service] || null;
  }

  getProviderConfig(category: string, providerName: string): ProviderConfig | null {
    const availableProviders = (this.config as any).available_providers[category];
    if (!availableProviders) return null;
    return availableProviders[providerName] || null;
  }

  validateConfiguration(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    for (const category of ['identity', 'education', 'government', 'vtu', 'utilities']) {
      const categoryConfig = (this.config as any)[category];
      if (categoryConfig) {
        for (const [service, config] of Object.entries(categoryConfig)) {
          const serviceConfig = config as ServiceConfig;
          
          if (!this.isProviderRegistered(serviceConfig.provider)) {
            errors.push(`${category}/${service}: Primary provider '${serviceConfig.provider}' not registered`);
          }
          
          if (serviceConfig.fallback && !this.isProviderRegistered(serviceConfig.fallback)) {
            errors.push(`${category}/${service}: Fallback provider '${serviceConfig.fallback}' not registered`);
          }
        }
      }
    }
    
    return { valid: errors.length === 0, errors };
  }

  async executeService(category: string, service: string, request: ServiceRequest): Promise<ProviderResult> {
    const serviceConfig = this.getServiceConfig(category, service);
    if (!serviceConfig) {
      return {
        success: false,
        error: `Service not configured: ${category}/${service}`,
        provider: 'unknown',
        executionTime: 0,
        timestamp: new Date()
      };
    }

    if (!serviceConfig.enabled) {
      return {
        success: false,
        error: `Service is disabled: ${category}/${service}`,
        provider: 'unknown',
        executionTime: 0,
        timestamp: new Date()
      };
    }

    if (!this.isProviderRegistered(serviceConfig.provider)) {
      return {
        success: false,
        error: `Primary provider not registered: ${serviceConfig.provider}`,
        provider: serviceConfig.provider,
        executionTime: 0,
        timestamp: new Date()
      };
    }

    try {
      const provider = await this.getProvider(serviceConfig.provider);
      const result = await provider.execute(request);
      
      if (result.success) {
        return result;
      }

      if (serviceConfig.fallback && this.isProviderRegistered(serviceConfig.fallback)) {
        console.log(`[ProviderRegistry] Primary provider failed, trying fallback: ${serviceConfig.fallback}`);
        const fallbackProvider = await this.getProvider(serviceConfig.fallback);
        return await fallbackProvider.execute(request);
      }

      return result;
    } catch (error: any) {
      if (serviceConfig.fallback && this.isProviderRegistered(serviceConfig.fallback)) {
        try {
          console.log(`[ProviderRegistry] Primary provider errored, trying fallback: ${serviceConfig.fallback}`);
          const fallbackProvider = await this.getProvider(serviceConfig.fallback);
          return await fallbackProvider.execute(request);
        } catch (fallbackError: any) {
          return {
            success: false,
            error: `Both providers failed. Primary: ${error.message}, Fallback: ${fallbackError.message}`,
            provider: serviceConfig.provider,
            executionTime: 0,
            timestamp: new Date()
          };
        }
      }

      return {
        success: false,
        error: error.message,
        provider: serviceConfig.provider,
        executionTime: 0,
        timestamp: new Date()
      };
    }
  }

  switchProvider(category: string, service: string, newProvider: string): boolean {
    const categoryConfig = (this.config as any)[category];
    if (!categoryConfig || !categoryConfig[service]) {
      console.error(`[ProviderRegistry] Service not found: ${category}/${service}`);
      return false;
    }

    if (!this.isProviderRegistered(newProvider)) {
      console.error(`[ProviderRegistry] Provider not registered: ${newProvider}`);
      return false;
    }

    categoryConfig[service].provider = newProvider;
    console.log(`[ProviderRegistry] Switched ${category}/${service} to ${newProvider}`);
    return true;
  }

  listProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  getServiceStatus(): Record<string, any> {
    const status: Record<string, any> = {};
    
    for (const category of ['identity', 'education', 'government', 'vtu', 'utilities']) {
      const categoryConfig = (this.config as any)[category];
      if (categoryConfig) {
        status[category] = {};
        for (const [service, config] of Object.entries(categoryConfig)) {
          const serviceConfig = config as ServiceConfig;
          status[category][service] = {
            provider: serviceConfig.provider,
            fallback: serviceConfig.fallback,
            enabled: serviceConfig.enabled,
            providerRegistered: this.isProviderRegistered(serviceConfig.provider),
            fallbackRegistered: serviceConfig.fallback ? this.isProviderRegistered(serviceConfig.fallback) : null,
            hasActiveInstance: this.activeProviders.has(serviceConfig.provider)
          };
        }
      }
    }
    
    return status;
  }

  async cleanupAll(): Promise<void> {
    for (const [name, provider] of this.activeProviders) {
      try {
        await provider.cleanup();
        console.log(`[ProviderRegistry] Cleaned up provider: ${name}`);
      } catch (error) {
        console.error(`[ProviderRegistry] Error cleaning up ${name}:`, error);
      }
    }
    this.activeProviders.clear();
    this.initializedProviders.clear();
  }
}

export const providerRegistry = ProviderRegistry.getInstance();
