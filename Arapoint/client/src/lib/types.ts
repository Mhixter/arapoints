export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "admin" | "user" | "superadmin";
  avatar?: string;
  walletBalance: number;
  plan: "free" | "premium" | "enterprise";
  isVerified: boolean;
  nin?: string;
  bvn?: string;
}

export interface Verification {
  id: string;
  type: "NIN" | "BVN" | "JAMB" | "WAEC" | "NECO" | "CAC" | "TIN" | "IPE";
  reference: string;
  status: "verified" | "pending" | "failed";
  date: string;
  details: string;
}

export interface Transaction {
  id: string;
  type: "credit" | "debit";
  amount: number;
  date: string;
  description: string;
  status: "success" | "failed" | "pending";
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
  isPopular?: boolean;
}
