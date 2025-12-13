// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  password_hash: string;
  wallet_balance: number;
  bvn?: string;
  nin?: string;
  kyc_status: 'pending' | 'verified' | 'rejected';
  created_at: Date;
  updated_at: Date;
}

// RPA Job Types
export interface RPAJob {
  id: string;
  user_id: string;
  service_type: string;
  query_data: Record<string, any>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: Record<string, any>;
  error_message?: string;
  retry_count: number;
  max_retries: number;
  priority: number;
  created_at: Date;
  started_at?: Date;
  completed_at?: Date;
}

// API Response Types
export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  code: number;
  message: string;
  data?: T;
  errors?: Array<{ field: string; message: string }>;
}

export interface RpaJobResponse {
  status: 'success';
  code: number;
  message: string;
  job_id: string;
  job_status: string;
  estimated_wait_time: string;
}

// Service Types
export type ServiceType = 
  | 'bvn_retrieval'
  | 'nin_lookup'
  | 'jamb_score'
  | 'waec_score'
  | 'birth_cert'
  | 'airtime_purchase'
  | 'data_purchase'
  | 'electricity_purchase'
  | 'cable_purchase';

// Bot Credentials Types
export interface BotCredentials {
  id: string;
  service_name: string;
  username?: string;
  password_hash?: string;
  api_key?: string;
  auth_token?: string;
  token_expiry?: Date;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// Transaction Types
export interface Transaction {
  id: string;
  user_id: string;
  transaction_type: 'fund_wallet' | 'service_purchase' | 'refund';
  amount: number;
  payment_method: string;
  reference_id: string;
  status: 'pending' | 'successful' | 'failed';
  created_at: Date;
}
