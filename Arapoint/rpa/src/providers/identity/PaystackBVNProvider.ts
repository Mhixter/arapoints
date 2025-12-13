import { APIProvider, ProviderCredentials } from '../types';

export class PaystackBVNProvider extends APIProvider {
  readonly name = 'paystack_bvn';
  protected baseUrl = 'https://api.paystack.co';

  constructor(credentials?: ProviderCredentials) {
    super(credentials);
  }

  async initialize(): Promise<void> {
    const secretKey = this.getCredential('PAYSTACK_SECRET_KEY');
    this.headers = {
      'Authorization': `Bearer ${secretKey}`,
      'Content-Type': 'application/json'
    };
    this.log('Initialized Paystack BVN provider');
  }

  async makeRequest(endpoint: string, data: Record<string, any>): Promise<any> {
    this.log(`Making Paystack BVN request: ${endpoint}`);
    
    const response = await fetch(`${this.baseUrl}/${endpoint}`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(data)
    });

    const result = await response.json();
    
    if (!result.status) {
      throw new Error(result.message || 'BVN verification failed');
    }

    return result.data;
  }

  async verifyBVN(bvn: string, accountNumber: string, bankCode: string): Promise<any> {
    return this.makeRequest('bank/resolve_bvn', {
      bvn,
      account_number: accountNumber,
      bank_code: bankCode
    });
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/bank`, {
        headers: this.headers
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const createPaystackBVNProvider = (credentials?: ProviderCredentials) => new PaystackBVNProvider(credentials);
