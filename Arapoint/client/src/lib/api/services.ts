import { apiClient, ApiResponse } from './client';

export interface BVNRetrievalRequest {
  phone: string;
  dateOfBirth: string;
}

export interface BVNCardRequest {
  bvn: string;
  fullName: string;
}

export interface NINLookupRequest {
  nin: string;
}

export interface NINPhoneRequest {
  phone: string;
}

export interface EducationCheckRequest {
  registrationNumber: string;
  examYear: number;
  examType?: string;
}

export interface AirtimeRequest {
  network: string;
  phoneNumber: string;
  amount: number;
}

export interface DataRequest {
  network: string;
  phoneNumber: string;
  planCode: string;
  amount: number;
}

export interface ElectricityRequest {
  disco: string;
  meterNumber: string;
  meterType: 'prepaid' | 'postpaid';
  amount: number;
}

export interface CableRequest {
  provider: string;
  smartcardNumber: string;
  packageCode: string;
  amount: number;
}

export interface ServiceResponse {
  id: string;
  status: string;
  message: string;
  data?: any;
  reference?: string;
}

export const servicesApi = {
  bvn: {
    retrieve: async (data: BVNRetrievalRequest): Promise<ServiceResponse> => {
      const response = await apiClient.post<ApiResponse<ServiceResponse>>('/bvn/retrieve', data);
      return response.data.data;
    },
    requestCard: async (data: BVNCardRequest): Promise<ServiceResponse> => {
      const response = await apiClient.post<ApiResponse<ServiceResponse>>('/bvn/card', data);
      return response.data.data;
    },
    getHistory: async (): Promise<any[]> => {
      const response = await apiClient.get<ApiResponse<{ services: any[] }>>('/bvn/history');
      return response.data.data.services;
    },
  },

  identity: {
    lookupNIN: async (data: NINLookupRequest): Promise<ServiceResponse> => {
      const response = await apiClient.post<ApiResponse<ServiceResponse>>('/identity/nin-lookup', data);
      return response.data.data;
    },
    lookupByPhone: async (data: NINPhoneRequest): Promise<ServiceResponse> => {
      const response = await apiClient.post<ApiResponse<ServiceResponse>>('/identity/nin-phone', data);
      return response.data.data;
    },
    getHistory: async (): Promise<any[]> => {
      const response = await apiClient.get<ApiResponse<{ verifications: any[] }>>('/identity/history');
      return response.data.data.verifications;
    },
  },

  education: {
    checkResult: async (examBody: string, data: EducationCheckRequest): Promise<ServiceResponse> => {
      const response = await apiClient.post<ApiResponse<ServiceResponse>>(`/education/${examBody}/check`, data);
      return response.data.data;
    },
    getHistory: async (): Promise<any[]> => {
      const response = await apiClient.get<ApiResponse<{ services: any[] }>>('/education/history');
      return response.data.data.services;
    },
  },

  vtu: {
    buyAirtime: async (data: AirtimeRequest): Promise<ServiceResponse> => {
      const response = await apiClient.post<ApiResponse<ServiceResponse>>('/airtime/buy', data);
      return response.data.data;
    },
    buyData: async (data: DataRequest): Promise<ServiceResponse> => {
      const response = await apiClient.post<ApiResponse<ServiceResponse>>('/data/purchase', data);
      return response.data.data;
    },
    getDataPlans: async (network: string): Promise<any[]> => {
      const response = await apiClient.get<ApiResponse<{ plans: any[] }>>(`/data/plans/${network}`);
      return response.data.data.plans;
    },
    getAirtimeHistory: async (): Promise<any[]> => {
      const response = await apiClient.get<ApiResponse<{ services: any[] }>>('/airtime/history');
      return response.data.data.services;
    },
    getDataHistory: async (): Promise<any[]> => {
      const response = await apiClient.get<ApiResponse<{ services: any[] }>>('/data/history');
      return response.data.data.services;
    },
  },

  utilities: {
    buyElectricity: async (data: ElectricityRequest): Promise<ServiceResponse> => {
      const response = await apiClient.post<ApiResponse<ServiceResponse>>('/electricity/purchase', data);
      return response.data.data;
    },
    validateMeter: async (disco: string, meterNumber: string, meterType: string): Promise<any> => {
      const response = await apiClient.post<ApiResponse<any>>('/electricity/validate', { disco, meterNumber, meterType });
      return response.data.data;
    },
    buyCable: async (data: CableRequest): Promise<ServiceResponse> => {
      const response = await apiClient.post<ApiResponse<ServiceResponse>>('/cable/purchase', data);
      return response.data.data;
    },
    validateSmartcard: async (provider: string, smartcardNumber: string): Promise<any> => {
      const response = await apiClient.post<ApiResponse<any>>('/cable/validate', { provider, smartcardNumber });
      return response.data.data;
    },
    getElectricityHistory: async (): Promise<any[]> => {
      const response = await apiClient.get<ApiResponse<{ services: any[] }>>('/electricity/history');
      return response.data.data.services;
    },
    getCableHistory: async (): Promise<any[]> => {
      const response = await apiClient.get<ApiResponse<{ services: any[] }>>('/cable/history');
      return response.data.data.services;
    },
  },

  dashboard: {
    getStats: async (): Promise<DashboardStats> => {
      const response = await apiClient.get<ApiResponse<DashboardStats>>('/dashboard/stats');
      return response.data.data;
    },
  },
};

export interface DashboardStats {
  user: {
    name: string;
    email: string;
    walletBalance: number;
  };
  stats: {
    totalTransactions: number;
    totalVerifications: number;
    ninVerifications: number;
    bvnVerifications: number;
    educationVerifications: number;
    airtimeTotal: number;
    airtimeSuccess: number;
    dataTotal: number;
    dataSuccess: number;
    electricityTotal: number;
    electricitySuccess: number;
    cableTotal: number;
    cableSuccess: number;
  };
}
