import { APIProvider, ProviderCredentials } from '../types';

export class VTPassProvider extends APIProvider {
  readonly name = 'vtpass_api';
  protected baseUrl = 'https://vtpass.com/api';

  constructor(credentials?: ProviderCredentials) {
    super(credentials);
  }

  async initialize(): Promise<void> {
    const apiKey = this.getCredential('VTPASS_API_KEY');
    const secretKey = this.getCredential('VTPASS_SECRET_KEY');
    
    this.headers = {
      'api-key': apiKey,
      'secret-key': secretKey,
      'Content-Type': 'application/json'
    };
    this.log('Initialized VTPass API provider');
  }

  async makeRequest(endpoint: string, data: Record<string, any>): Promise<any> {
    this.log(`Making VTPass request: ${endpoint}`);
    
    const response = await fetch(`${this.baseUrl}/${endpoint}`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(data)
    });

    const result = await response.json();
    
    if (result.code !== '000') {
      throw new Error(result.response_description || 'VTPass transaction failed');
    }

    return result;
  }

  async buyAirtime(serviceID: string, phone: string, amount: number): Promise<any> {
    return this.makeRequest('pay', {
      serviceID,
      phone,
      amount,
      request_id: `VTP-${Date.now()}`
    });
  }

  async buyData(serviceID: string, phone: string, billersCode: string, variationCode: string): Promise<any> {
    return this.makeRequest('pay', {
      serviceID,
      phone,
      billersCode,
      variation_code: variationCode,
      request_id: `VTP-${Date.now()}`
    });
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/services`, {
        headers: this.headers
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const createVTPassProvider = (credentials?: ProviderCredentials) => new VTPassProvider(credentials);
