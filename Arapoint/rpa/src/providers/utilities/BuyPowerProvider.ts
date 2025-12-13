import { APIProvider, ProviderCredentials } from '../types';

export class BuyPowerProvider extends APIProvider {
  readonly name = 'buypower_api';
  protected baseUrl = 'https://api.buypower.ng';

  constructor(credentials?: ProviderCredentials) {
    super(credentials);
  }

  async initialize(): Promise<void> {
    const apiKey = this.getCredential('BUYPOWER_API_KEY');
    const secretKey = this.getCredential('BUYPOWER_SECRET_KEY');
    
    this.headers = {
      'Authorization': `Bearer ${apiKey}`,
      'x-secret-key': secretKey,
      'Content-Type': 'application/json'
    };
    this.log('Initialized BuyPower API provider');
  }

  async makeRequest(endpoint: string, data: Record<string, any>): Promise<any> {
    this.log(`Making electricity request: ${endpoint}`);
    
    const response = await fetch(`${this.baseUrl}/${endpoint}`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(data)
    });

    const result = await response.json();
    
    if (!result.success && result.status !== 'success') {
      throw new Error(result.message || 'Electricity transaction failed');
    }

    return result;
  }

  // Validate meter number
  async validateMeter(disco: string, meterNumber: string, meterType: string): Promise<any> {
    return this.makeRequest('validate', {
      disco,
      meter_number: meterNumber,
      meter_type: meterType
    });
  }

  // Purchase electricity token
  async purchaseToken(disco: string, meterNumber: string, meterType: string, amount: number): Promise<any> {
    return this.makeRequest('vend', {
      disco,
      meter_number: meterNumber,
      meter_type: meterType,
      amount,
      reference: `ELC-${Date.now()}`
    });
  }

  // Get available discos
  async getDiscos(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/discos`, {
      headers: this.headers
    });
    return response.json();
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/discos`, {
        headers: this.headers
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const createBuyPowerProvider = (credentials?: ProviderCredentials) => new BuyPowerProvider(credentials);
