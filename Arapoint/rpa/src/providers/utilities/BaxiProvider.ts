import { APIProvider, ProviderCredentials } from '../types';

export class BaxiProvider extends APIProvider {
  readonly name = 'baxi_api';
  protected baseUrl = 'https://api.baxi.com.ng/services';

  constructor(credentials?: ProviderCredentials) {
    super(credentials);
  }

  async initialize(): Promise<void> {
    const apiKey = this.getCredential('BAXI_API_KEY');
    
    this.headers = {
      'x-api-key': apiKey,
      'Content-Type': 'application/json'
    };
    this.log('Initialized Baxi API provider');
  }

  async makeRequest(endpoint: string, data: Record<string, any>): Promise<any> {
    this.log(`Making Baxi request: ${endpoint}`);
    
    const response = await fetch(`${this.baseUrl}/${endpoint}`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(data)
    });

    const result = await response.json();
    
    if (result.status !== 'success') {
      throw new Error(result.message || 'Baxi transaction failed');
    }

    return result;
  }

  // Electricity services
  async validateElectricity(disco: string, accountNumber: string, serviceType: string): Promise<any> {
    return this.makeRequest('electricity/verify', {
      service_type: disco,
      account_number: accountNumber,
      type: serviceType
    });
  }

  async purchaseElectricity(disco: string, accountNumber: string, amount: number, phone: string): Promise<any> {
    return this.makeRequest('electricity/request', {
      service_type: disco,
      account_number: accountNumber,
      amount,
      phone,
      reference: `ELC-${Date.now()}`
    });
  }

  // Cable TV services
  async validateCable(cableType: string, smartcardNumber: string): Promise<any> {
    return this.makeRequest('multichoice/verify', {
      service_type: cableType,
      smartcard_number: smartcardNumber
    });
  }

  async subscribeCable(cableType: string, smartcardNumber: string, productCode: string, phone: string): Promise<any> {
    return this.makeRequest('multichoice/request', {
      service_type: cableType,
      smartcard_number: smartcardNumber,
      product_code: productCode,
      phone,
      reference: `CAB-${Date.now()}`
    });
  }

  // Get cable bouquets/plans
  async getCablePlans(cableType: string): Promise<any> {
    return this.makeRequest('multichoice/list', {
      service_type: cableType
    });
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/billers/category/all`, {
        headers: this.headers
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const createBaxiProvider = (credentials?: ProviderCredentials) => new BaxiProvider(credentials);
