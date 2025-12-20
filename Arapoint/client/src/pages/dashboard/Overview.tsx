import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, CreditCard, ArrowUpRight, ArrowDownRight, ShieldCheck, GraduationCap, Loader2, Copy, Building2, AlertTriangle, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { walletApi } from "@/lib/api/wallet";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface DashboardStats {
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
  };
}

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  description: string;
  amount: number;
  status: string;
  date: string;
  reference: string;
}

interface Verification {
  id: string;
  type: string;
  reference: string;
  status: string;
  details: string;
  date: string;
}

interface VirtualAccount {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export default function Overview() {
  const { toast } = useToast();
  const [virtualAccount, setVirtualAccount] = useState<VirtualAccount | null>(null);
  const [accountLoading, setAccountLoading] = useState(true);
  const [generatingAccount, setGeneratingAccount] = useState(false);
  const [requiresKyc, setRequiresKyc] = useState(false);

  const getAuthToken = () => localStorage.getItem('accessToken');

  const fetchDashboardStats = async (): Promise<DashboardStats | null> => {
    const token = getAuthToken();
    if (!token) return null;
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
    const res = await fetch('/api/dashboard/stats', { headers, cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data;
  };

  const fetchTransactions = async (): Promise<Transaction[]> => {
    const token = getAuthToken();
    if (!token) return [];
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
    const res = await fetch('/api/dashboard/transactions?limit=5', { headers, cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data?.transactions || [];
  };

  const fetchVerifications = async (): Promise<Verification[]> => {
    const token = getAuthToken();
    if (!token) return [];
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
    const res = await fetch('/api/dashboard/verifications?limit=5', { headers, cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data?.verifications || [];
  };

  const token = getAuthToken();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: fetchDashboardStats,
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
    staleTime: 5000,
    enabled: !!token,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['dashboard', 'transactions'],
    queryFn: fetchTransactions,
    refetchOnWindowFocus: true,
    staleTime: 5000,
    enabled: !!token,
  });

  const { data: verifications = [] } = useQuery({
    queryKey: ['dashboard', 'verifications'],
    queryFn: fetchVerifications,
    refetchOnWindowFocus: true,
    staleTime: 5000,
    enabled: !!token,
  });

  const loading = statsLoading;

  useEffect(() => {
    const fetchVirtualAccount = async () => {
      try {
        const response = await walletApi.getVirtualAccount();
        if (response?.account) {
          setVirtualAccount(response.account);
        }
        if (response?.requiresKyc) {
          setRequiresKyc(true);
        }
      } catch (error) {
        console.error('Failed to fetch virtual account:', error);
      } finally {
        setAccountLoading(false);
      }
    };

    fetchVirtualAccount();
  }, []);

  const handleGenerateAccount = async () => {
    setGeneratingAccount(true);
    try {
      const response = await walletApi.generateVirtualAccount();
      if (response?.account) {
        setVirtualAccount(response.account);
        toast({
          title: "Account Generated",
          description: "Your virtual account has been created successfully.",
        });
      } else {
        toast({
          title: "Failed",
          description: "Could not generate virtual account.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate virtual account.",
        variant: "destructive",
      });
    } finally {
      setGeneratingAccount(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        toast({
          title: "Copied",
          description: "Account number copied to clipboard.",
        });
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        toast({
          title: "Copied",
          description: "Account number copied to clipboard.",
        });
      }
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Please manually copy the account number.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const walletBalance = stats?.user?.walletBalance || 0;
  const totalTransactions = stats?.stats?.totalTransactions || 0;
  const totalVerifications = stats?.stats?.totalVerifications || 0;

  return (
    <div className="space-y-8">
      {requiresKyc && (
        <Card className="border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-900/20 shadow-md">
          <CardContent className="pt-6 pb-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
                <Lock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-amber-900 dark:text-amber-100 text-lg mb-1">Complete Your Identity Verification</h3>
                <p className="text-sm text-amber-800 dark:text-amber-200 mb-4">
                  You need to verify your NIN (National Identification Number) to unlock your PayVessel virtual account and start receiving payments via bank transfer.
                </p>
                <div className="flex gap-3">
                  <Link href="/dashboard/identity/nin-verification">
                    <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                      <ShieldCheck className="h-4 w-4 mr-2" />
                      Submit NIN for Verification
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                  <Link href="/dashboard/identity">
                    <Button variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50">
                      View All Identity Services
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-r from-primary/90 to-primary text-primary-foreground border-0 shadow-lg">
          <CardContent className="pt-4 sm:pt-6">
            <div>
              <p className="text-xs sm:text-sm opacity-90 mb-1">Wallet Balance</p>
              <h3 className="text-2xl sm:text-3xl font-bold">{`₦${walletBalance.toLocaleString()}`}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-lg">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Fund via Bank Transfer</CardTitle>
            </div>
            <CardDescription>Transfer to this account to fund your wallet</CardDescription>
          </CardHeader>
          <CardContent>
            {accountLoading || generatingAccount ? (
              <div className="flex flex-col items-center justify-center py-6">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                <p className="text-sm text-muted-foreground">
                  {generatingAccount ? "Generating account..." : "Loading..."}
                </p>
              </div>
            ) : virtualAccount ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Bank</span>
                  <span className="font-medium">{virtualAccount.bankName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Account Number</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">{virtualAccount.accountNumber}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => copyToClipboard(virtualAccount.accountNumber)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Account Name</span>
                  <span className="font-medium text-sm">{virtualAccount.accountName}</span>
                </div>
              </div>
            ) : requiresKyc ? (
              <div className="flex flex-col items-center justify-center py-6">
                <AlertTriangle className="h-10 w-10 text-yellow-500 mb-3" />
                <p className="text-sm text-muted-foreground mb-1 text-center">KYC Required</p>
                <p className="text-xs text-muted-foreground mb-3 text-center">Verify your NIN or BVN to generate a virtual account</p>
                <Link href="/dashboard/identity">
                  <Button variant="outline">
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    Complete KYC
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6">
                <Building2 className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-3">No virtual account yet</p>
                <Button onClick={handleGenerateAccount} disabled={generatingAccount}>
                  {generatingAccount ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Generating...
                    </>
                  ) : (
                    "Generate Account"
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-4">
        <StatsCard 
          title="Total Transactions" 
          value={totalTransactions.toString()} 
          icon={CreditCard} 
          trend="All time" 
        />
        <StatsCard 
          title="Total Verifications" 
          value={totalVerifications.toString()} 
          icon={CheckCircle2} 
          trend="All time" 
          className="text-green-600"
        />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        <Card className="lg:col-span-2 border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Verifications</CardTitle>
              <CardDescription>Latest identity checks performed</CardDescription>
            </div>
            <Link href="/dashboard/identity">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {verifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ShieldCheck className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No verifications yet</p>
                <p className="text-sm">Start by verifying a NIN or BVN</p>
              </div>
            ) : (
              <div className="space-y-4">
                {verifications.map((ver) => (
                  <div key={ver.id} className="flex items-center justify-between p-4 rounded-lg border border-border/40 bg-muted/10 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        ver.type === 'NIN' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        ver.type === 'BVN' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                      }`}>
                        <span className="font-bold text-xs">{ver.type}</span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{ver.reference}</p>
                        <p className="text-sm text-muted-foreground">{new Date(ver.date).toLocaleDateString()} {ver.details && `• ${ver.details}`}</p>
                      </div>
                    </div>
                    <div className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                      ver.status === 'verified' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      ver.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {ver.status}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-8">
          <Card className="border-border/60 shadow-sm bg-primary text-primary-foreground">
            <CardHeader>
              <CardTitle>Quick Verify</CardTitle>
              <CardDescription className="text-primary-foreground/80">Start a new verification instantly</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Link href="/dashboard/identity">
                <Button variant="secondary" className="w-full h-auto py-4 flex flex-col gap-2 hover:scale-[1.02] transition-transform">
                  <ShieldCheck className="h-6 w-6" />
                  <span className="text-xs">Verify NIN</span>
                </Button>
              </Link>
              <Link href="/dashboard/education">
                <Button variant="secondary" className="w-full h-auto py-4 flex flex-col gap-2 hover:scale-[1.02] transition-transform">
                  <GraduationCap className="h-6 w-6" />
                  <span className="text-xs">Check Result</span>
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <CreditCard className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No transactions yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${tx.type === 'credit' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                          {tx.type === 'credit' ? <ArrowDownRight className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                        </div>
                        <div>
                          <p className="font-medium truncate max-w-[120px]">{tx.description}</p>
                          <p className="text-xs text-muted-foreground">{new Date(tx.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className={`font-medium ${tx.type === 'credit' ? 'text-green-600' : 'text-foreground'}`}>
                        {tx.type === 'credit' ? '+' : '-'}₦{tx.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatsCard({ title, value, icon: Icon, trend, trendUp, className }: any) {
  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={`h-4 w-4 text-muted-foreground ${className}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className={`text-xs mt-1 ${trendUp ? 'text-green-600' : 'text-muted-foreground'}`}>
          {trend}
        </p>
      </CardContent>
    </Card>
  );
}
