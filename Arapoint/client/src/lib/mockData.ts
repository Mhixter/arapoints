export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  avatar: string;
  walletBalance: number;
  plan: string;
  isVerified: boolean;
  nin: string;
  bvn: string;
}

export interface Verification {
  id: string;
  type: string;
  reference: string;
  status: string;
  date: string;
  details: string;
}

export interface Transaction {
  id: string;
  type: string;
  amount: number;
  date: string;
  description: string;
  status: string;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
  isPopular?: boolean;
}

export interface ServicePrice {
  id: string;
  name: string;
  price: number;
}

export interface AdminRequest {
  id: string;
  type: string;
  user: string;
  details: string;
  status: "pending" | "completed" | "rejected";
  date: string;
}

export interface BVNService {
  id: string;
  userId: string;
  userName: string;
  serviceType: "retrieval" | "card" | "modification";
  bvn: string;
  status: "pending" | "completed" | "rejected";
  date: string;
  amount: number;
  isVerified: boolean;
}

export interface EducationService {
  id: string;
  userId: string;
  userName: string;
  serviceType: "jamb" | "waec" | "neco" | "nabteb" | "nbais" | "jamb-sub";
  examBody?: string;
  regNumber: string;
  status: "pending" | "completed" | "rejected";
  date: string;
  amount: number;
  isVerified: boolean;
}

export interface VTUService {
  id: string;
  userId: string;
  userName: string;
  serviceType: "airtime" | "data" | "electricity" | "cable";
  provider: string;
  amount: number;
  status: "pending" | "completed" | "failed";
  date: string;
  isVerified: boolean;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  walletBalance: number;
  totalTransactions: number;
  status: "active" | "inactive" | "suspended";
  joinDate: string;
}

export const MOCK_USER: User = {
  id: "usr_demo",
  name: "Demo User",
  email: "demo@arapoint.com.ng",
  phone: "+234 801 000 0000",
  role: "user",
  avatar: "",
  walletBalance: 0,
  plan: "basic",
  isVerified: false,
  nin: "",
  bvn: "",
};

export const MOCK_VERIFICATIONS: Verification[] = [];

export const MOCK_TRANSACTIONS: Transaction[] = [];

export const MOCK_PRICES: ServicePrice[] = [];

export const MOCK_ADMIN_REQUESTS: AdminRequest[] = [];

export const MOCK_BVN_SERVICES: BVNService[] = [];

export const MOCK_EDUCATION_SERVICES: EducationService[] = [];

export const MOCK_VTU_SERVICES: VTUService[] = [];

export const MOCK_ADMIN_USERS: AdminUser[] = [];

export const PLANS: Plan[] = [
  {
    id: "basic",
    name: "Basic",
    price: 0,
    features: ["Basic Identity Lookup", "Pay-per-use verification", "Standard Support"],
  },
  {
    id: "premium",
    name: "Premium",
    price: 5000,
    features: ["Unlimited Validations", "Priority Support", "API Access", "Bulk Verification", "Discounted Services"],
    isPopular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 25000,
    features: ["Custom Integration", "Dedicated Account Manager", "SLA", "On-premise Deployment Options"],
  },
];
