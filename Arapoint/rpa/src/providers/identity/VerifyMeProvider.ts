import { APIProvider, ProviderCredentials, ServiceRequest, ProviderResult } from '../types';

export class VerifyMeProvider extends APIProvider {
  readonly name = 'verifyme_api';
  protected baseUrl = 'https://api.verifyme.ng/v1';

  constructor(credentials?: ProviderCredentials) {
    super(credentials);
  }

  async initialize(): Promise<void> {
    const apiKey = this.getCredential('VERIFYME_API_KEY');
    this.headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };
    this.log('Initialized VerifyMe API provider');
  }

  async makeRequest(endpoint: string, data: Record<string, any>): Promise<any> {
    this.log(`Making request to: ${endpoint}`);
    
    const response = await fetch(`${this.baseUrl}/${endpoint}`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `API request failed: ${response.status}`);
    }

    return await response.json();
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        headers: this.headers
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const createVerifyMeProvider = (credentials?: ProviderCredentials) => new VerifyMeProvider(credentials);
