import { APIProvider, ProviderCredentials } from '../types';

export class ReloadlyProvider extends APIProvider {
  readonly name = 'reloadly_api';
  protected baseUrl = 'https://topups.reloadly.com';
  private accessToken: string = '';

  constructor(credentials?: ProviderCredentials) {
    super(credentials);
  }

  async initialize(): Promise<void> {
    await this.authenticate();
    this.log('Initialized Reloadly API provider');
  }

  private async authenticate(): Promise<void> {
    const clientId = this.getCredential('RELOADLY_CLIENT_ID');
    const clientSecret = this.getCredential('RELOADLY_CLIENT_SECRET');

    const response = await fetch('https://auth.reloadly.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials',
        audience: 'https://topups.reloadly.com'
      })
    });

    if (!response.ok) {
      throw new Error('Failed to authenticate with Reloadly');
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.headers = {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/com.reloadly.topups-v1+json'
    };
  }

  async makeRequest(endpoint: string, data: Record<string, any>): Promise<any> {
    this.log(`Making Reloadly request: ${endpoint}`);
    
    const response = await fetch(`${this.baseUrl}/${endpoint}`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Reloadly request failed: ${response.status}`);
    }

    return await response.json();
  }

  // Get operators for a country
  async getOperators(countryCode: string = 'NG'): Promise<any> {
    const response = await fetch(`${this.baseUrl}/operators/countries/${countryCode}`, {
      headers: this.headers
    });
    return response.json();
  }

  // Top-up airtime
  async topup(operatorId: string, phone: string, amount: number): Promise<any> {
    return this.makeRequest('topups', {
      operatorId,
      recipientPhone: { countryCode: 'NG', number: phone },
      amount,
      useLocalAmount: true
    });
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/operators/countries/NG`, {
        headers: this.headers
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const createReloadlyProvider = (credentials?: ProviderCredentials) => new ReloadlyProvider(credentials);
