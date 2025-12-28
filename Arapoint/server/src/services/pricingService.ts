import { db } from '../config/database';
import { servicePricing } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { logger } from '../utils/logger';

const DEFAULT_PRICES: Record<string, { price: number; name: string; description: string }> = {
  jamb: { price: 1000, name: 'JAMB Score Lookup', description: 'JAMB result checking service' },
  waec: { price: 1000, name: 'WAEC Result Lookup', description: 'WAEC result checking service' },
  neco: { price: 1000, name: 'NECO Result Lookup', description: 'NECO result checking service' },
  nabteb: { price: 1000, name: 'NABTEB Result Lookup', description: 'NABTEB result checking service' },
  nbais: { price: 1000, name: 'NBAIS Result Lookup', description: 'NBAIS result checking service' },
  
  nin_basic: { price: 500, name: 'NIN Basic Lookup', description: 'Basic NIN verification' },
  nin_standard: { price: 1000, name: 'NIN Standard Lookup', description: 'Standard NIN verification with details' },
  nin_premium: { price: 1500, name: 'NIN Premium Lookup', description: 'Premium NIN verification with full details' },
  
  bvn_basic: { price: 500, name: 'BVN Basic Lookup', description: 'Basic BVN verification' },
  bvn_standard: { price: 1000, name: 'BVN Standard Lookup', description: 'Standard BVN verification' },
  
  birth_certificate: { price: 2000, name: 'Birth Certificate', description: 'Birth certificate verification' },
  
  cac_basic: { price: 2000, name: 'CAC Basic Search', description: 'Basic CAC company search' },
  cac_full: { price: 5000, name: 'CAC Full Report', description: 'Full CAC company report' },
  
  waec_pin: { price: 4500, name: 'WAEC Scratch Card', description: 'WAEC result checker PIN' },
  neco_pin: { price: 1200, name: 'NECO Scratch Card', description: 'NECO result checker PIN' },
  nabteb_pin: { price: 1200, name: 'NABTEB Scratch Card', description: 'NABTEB result checker PIN' },
  nbais_pin: { price: 1000, name: 'NBAIS Scratch Card', description: 'NBAIS result checker PIN' },
  
  a2c_mtn: { price: 80, name: 'MTN Airtime to Cash Rate', description: 'MTN conversion rate (%)' },
  a2c_airtel: { price: 75, name: 'Airtel Airtime to Cash Rate', description: 'Airtel conversion rate (%)' },
  a2c_glo: { price: 70, name: 'Glo Airtime to Cash Rate', description: 'Glo conversion rate (%)' },
  a2c_9mobile: { price: 70, name: '9Mobile Airtime to Cash Rate', description: '9Mobile conversion rate (%)' },
};

interface PricingResult {
  serviceType: string;
  price: number;
  serviceName: string;
  description: string;
  isActive: boolean;
}

class PricingService {
  private cache: Map<string, { data: PricingResult; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000;

  async getPrice(serviceType: string): Promise<number> {
    const pricing = await this.getPricing(serviceType);
    return pricing.price;
  }

  async getPricing(serviceType: string): Promise<PricingResult> {
    const cached = this.cache.get(serviceType);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    try {
      const [dbPricing] = await db.select()
        .from(servicePricing)
        .where(and(
          eq(servicePricing.serviceType, serviceType),
          eq(servicePricing.isActive, true)
        ))
        .limit(1);

      if (dbPricing) {
        const result: PricingResult = {
          serviceType: dbPricing.serviceType,
          price: parseFloat(dbPricing.price),
          serviceName: dbPricing.serviceName,
          description: dbPricing.description || '',
          isActive: dbPricing.isActive ?? true,
        };
        this.cache.set(serviceType, { data: result, timestamp: Date.now() });
        return result;
      }

      const defaultInfo = DEFAULT_PRICES[serviceType];
      if (defaultInfo) {
        return {
          serviceType,
          price: defaultInfo.price,
          serviceName: defaultInfo.name,
          description: defaultInfo.description,
          isActive: true,
        };
      }

      return {
        serviceType,
        price: 0,
        serviceName: serviceType,
        description: '',
        isActive: false,
      };
    } catch (error: any) {
      logger.error('Error fetching pricing', { serviceType, error: error.message });
      
      const defaultInfo = DEFAULT_PRICES[serviceType];
      return {
        serviceType,
        price: defaultInfo?.price || 0,
        serviceName: defaultInfo?.name || serviceType,
        description: defaultInfo?.description || '',
        isActive: true,
      };
    }
  }

  async getAllPricing(): Promise<PricingResult[]> {
    try {
      const dbPricing = await db.select().from(servicePricing).orderBy(servicePricing.serviceName);
      
      const results: PricingResult[] = dbPricing.map(p => ({
        serviceType: p.serviceType,
        price: parseFloat(p.price),
        serviceName: p.serviceName,
        description: p.description || '',
        isActive: p.isActive ?? true,
      }));

      const dbServiceTypes = new Set(results.map(r => r.serviceType));
      for (const [serviceType, info] of Object.entries(DEFAULT_PRICES)) {
        if (!dbServiceTypes.has(serviceType)) {
          results.push({
            serviceType,
            price: info.price,
            serviceName: info.name,
            description: info.description,
            isActive: true,
          });
        }
      }

      return results.sort((a, b) => a.serviceName.localeCompare(b.serviceName));
    } catch (error: any) {
      logger.error('Error fetching all pricing', { error: error.message });
      return Object.entries(DEFAULT_PRICES).map(([serviceType, info]) => ({
        serviceType,
        price: info.price,
        serviceName: info.name,
        description: info.description,
        isActive: true,
      }));
    }
  }

  async getActivePricing(): Promise<PricingResult[]> {
    const all = await this.getAllPricing();
    return all.filter(p => p.isActive);
  }

  async getPricingByCategory(category: string): Promise<PricingResult[]> {
    const all = await this.getAllPricing();
    
    const categories: Record<string, string[]> = {
      education: ['jamb', 'waec', 'neco', 'nabteb', 'nbais'],
      education_pins: ['waec_pin', 'neco_pin', 'nabteb_pin', 'nbais_pin'],
      identity: ['nin_basic', 'nin_standard', 'nin_premium', 'bvn_basic', 'bvn_standard'],
      documents: ['birth_certificate', 'cac_basic', 'cac_full'],
      a2c: ['a2c_mtn', 'a2c_airtel', 'a2c_glo', 'a2c_9mobile'],
    };

    const serviceTypes = categories[category] || [];
    return all.filter(p => serviceTypes.includes(p.serviceType));
  }

  async getA2CRate(network: string): Promise<number> {
    const serviceType = `a2c_${network.toLowerCase()}`;
    const pricing = await this.getPricing(serviceType);
    return pricing.price;
  }

  async getA2CRates(): Promise<Record<string, number>> {
    const networks = ['mtn', 'airtel', 'glo', '9mobile'];
    const rates: Record<string, number> = {};
    
    for (const network of networks) {
      rates[network] = await this.getA2CRate(network);
    }
    
    return rates;
  }

  async getPINPrice(examType: string): Promise<number> {
    const serviceType = `${examType.toLowerCase()}_pin`;
    return await this.getPrice(serviceType);
  }

  clearCache(): void {
    this.cache.clear();
  }

  async seedDefaultPrices(): Promise<{ created: number; skipped: number }> {
    let created = 0;
    let skipped = 0;

    for (const [serviceType, info] of Object.entries(DEFAULT_PRICES)) {
      try {
        const [existing] = await db.select()
          .from(servicePricing)
          .where(eq(servicePricing.serviceType, serviceType))
          .limit(1);

        if (!existing) {
          await db.insert(servicePricing).values({
            serviceType,
            serviceName: info.name,
            price: info.price.toFixed(2),
            description: info.description,
            isActive: true,
          });
          created++;
          logger.info('Created pricing', { serviceType, price: info.price });
        } else {
          skipped++;
        }
      } catch (error: any) {
        logger.error('Error seeding price', { serviceType, error: error.message });
      }
    }

    this.clearCache();
    return { created, skipped };
  }
}

export const pricingService = new PricingService();
