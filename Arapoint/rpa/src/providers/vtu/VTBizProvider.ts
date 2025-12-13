import { APIProvider, ProviderCredentials } from '../types';

export class VTBizProvider extends APIProvider {
  readonly name = 'vtbiz_api';
  protected baseUrl = 'https://vtbiz.net/api';

  constructor(credentials?: ProviderCredentials) {
    super(credentials);
  }

  async initialize(): Promise<void> {
    const apiKey = this.getCredential('VTBIZ_API_KEY');
    const secretKey = this.getCredential('VTBIZ_SECRET_KEY');
    
    this.headers = {
      'api-key': apiKey,
      'secret-key': secretKey,
      'Content-Type': 'application/json'
    };
    this.log('Initialized VTBiz API provider');
  }

  async makeRequest(endpoint: string, data: Record<string, any>): Promise<any> {
    this.log(`Making VTU request: ${endpoint}`);
    
    const response = await fetch(`${this.baseUrl}/${endpoint}`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(data)
    });

    const result = await response.json();
    
    if (result.code !== '00' && result.status !== 'success') {
      throw new Error(result.message || 'VTU transaction failed');
    }

    return result;
  }

  // Airtime purchase
  async buyAirtime(network: string, phone: string, amount: number): Promise<any> {
    return this.makeRequest('airtime', {
      network,
      phone,
      amount,
      request_id: `ART-${Date.now()}`
    });
  }

  // Data purchase
  async buyData(network: string, phone: string, planId: string): Promise<any> {
    return this.makeRequest('data', {
      network,
      phone,
      plan: planId,
      request_id: `DAT-${Date.now()}`
    });
  }

  // Get available data plans
  async getDataPlans(network: string): Promise<any> {
    return this.makeRequest('data/plans', { network });
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/balance`, {
        headers: this.headers
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const createVTBizProvider = (credentials?: ProviderCredentials) => new VTBizProvider(credentials);
