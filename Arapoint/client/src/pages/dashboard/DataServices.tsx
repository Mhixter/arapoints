import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Wifi, Loader2, AlertCircle, ArrowLeft, Check } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { servicesApi } from "@/lib/api/services";
import mtnLogo from '@assets/image_1764220436168.png';
import airtelLogo from '@assets/image_1764220472886.png';
import gloLogo from '@assets/image_1764220529748.png';
import ninemobileLogo from '@assets/image_1764220562186.png';

const networks = [
  { id: 'mtn', name: 'MTN', logo: mtnLogo },
  { id: 'airtel', name: 'Airtel', logo: airtelLogo },
  { id: 'glo', name: 'Glo', logo: gloLogo },
  { id: '9mobile', name: '9mobile', logo: ninemobileLogo },
];

const networkPrefixes: Record<string, string[]> = {
  mtn: ['0803', '0806', '0703', '0706', '0813', '0816', '0810', '0814', '0903', '0906', '0913', '0916', '0704'],
  airtel: ['0802', '0808', '0708', '0812', '0701', '0902', '0901', '0904', '0907', '0912'],
  glo: ['0805', '0807', '0705', '0815', '0811', '0905', '0915'],
  '9mobile': ['0809', '0817', '0818', '0908', '0909'],
};

function detectNetwork(phoneNumber: string): string | null {
  const cleaned = phoneNumber.replace(/\D/g, '');
  if (cleaned.length < 4) return null;
  
  const prefix = cleaned.startsWith('234') ? '0' + cleaned.slice(3, 6) : cleaned.slice(0, 4);
  
  for (const [network, prefixes] of Object.entries(networkPrefixes)) {
    if (prefixes.includes(prefix)) {
      return network;
    }
  }
  return null;
}

const DATA_PLANS = {
  mtn: {
    sme: [
      { id: "mtn-sme-1", name: "100MB - 7 Days - ₦200", value: "100mb-7d" },
      { id: "mtn-sme-2", name: "500MB - 14 Days - ₦500", value: "500mb-14d" },
      { id: "mtn-sme-3", name: "1GB - 30 Days - ₦1,000", value: "1gb-30d" },
      { id: "mtn-sme-4", name: "2GB - 30 Days - ₦1,500", value: "2gb-30d" }
    ],
    cg: [
      { id: "mtn-cg-1", name: "250MB - 7 Days - ₦150", value: "250mb-7d-cg" },
      { id: "mtn-cg-2", name: "1GB - 14 Days - ₦800", value: "1gb-14d-cg" },
      { id: "mtn-cg-3", name: "2GB - 30 Days - ₦1,200", value: "2gb-30d-cg" },
      { id: "mtn-cg-4", name: "5GB - 30 Days - ₦2,500", value: "5gb-30d-cg" }
    ],
    gifting: [
      { id: "mtn-gift-1", name: "100MB - 1 Day - ₦100", value: "100mb-1d-gift" },
      { id: "mtn-gift-2", name: "500MB - 7 Days - ₦400", value: "500mb-7d-gift" },
      { id: "mtn-gift-3", name: "1.5GB - 30 Days - ₦1,100", value: "1.5gb-30d-gift" },
      { id: "mtn-gift-4", name: "3GB - 30 Days - ₦2,000", value: "3gb-30d-gift" }
    ]
  },
  airtel: {
    sme: [
      { id: "airtl-sme-1", name: "150MB - 7 Days - ₦200", value: "150mb-7d-air" },
      { id: "airtel-sme-2", name: "750MB - 14 Days - ₦550", value: "750mb-14d-air" },
      { id: "airtel-sme-3", name: "1.5GB - 30 Days - ₦1,050", value: "1.5gb-30d-air" },
      { id: "airtel-sme-4", name: "2.5GB - 30 Days - ₦1,600", value: "2.5gb-30d-air" }
    ],
    cg: [
      { id: "airtel-cg-1", name: "300MB - 7 Days - ₦180", value: "300mb-7d-cg-air" },
      { id: "airtel-cg-2", name: "1.2GB - 14 Days - ₦850", value: "1.2gb-14d-cg-air" },
      { id: "airtel-cg-3", name: "2.5GB - 30 Days - ₦1,300", value: "2.5gb-30d-cg-air" },
      { id: "airtel-cg-4", name: "6GB - 30 Days - ₦2,800", value: "6gb-30d-cg-air" }
    ],
    gifting: [
      { id: "airtel-gift-1", name: "150MB - 1 Day - ₦120", value: "150mb-1d-gift-air" },
      { id: "airtel-gift-2", name: "600MB - 7 Days - ₦450", value: "600mb-7d-gift-air" },
      { id: "airtel-gift-3", name: "2GB - 30 Days - ₦1,200", value: "2gb-30d-gift-air" },
      { id: "airtel-gift-4", name: "3.5GB - 30 Days - ₦2,200", value: "3.5gb-30d-gift-air" }
    ]
  },
  glo: {
    sme: [
      { id: "glo-sme-1", name: "100MB - 7 Days - ₦180", value: "100mb-7d-glo" },
      { id: "glo-sme-2", name: "650MB - 14 Days - ₦500", value: "650mb-14d-glo" },
      { id: "glo-sme-3", name: "1.35GB - 30 Days - ₦1,000", value: "1.35gb-30d-glo" },
      { id: "glo-sme-4", name: "2.9GB - 30 Days - ₦1,550", value: "2.9gb-30d-glo" }
    ],
    cg: [
      { id: "glo-cg-1", name: "200MB - 7 Days - ₦150", value: "200mb-7d-cg-glo" },
      { id: "glo-cg-2", name: "1GB - 14 Days - ₦780", value: "1gb-14d-cg-glo" },
      { id: "glo-cg-3", name: "2.35GB - 30 Days - ₦1,200", value: "2.35gb-30d-cg-glo" },
      { id: "glo-cg-4", name: "5.8GB - 30 Days - ₦2,500", value: "5.8gb-30d-cg-glo" }
    ],
    gifting: [
      { id: "glo-gift-1", name: "50MB - 1 Day - ₦80", value: "50mb-1d-gift-glo" },
      { id: "glo-gift-2", name: "350MB - 7 Days - ₦350", value: "350mb-7d-gift-glo" },
      { id: "glo-gift-3", name: "1.25GB - 30 Days - ₦1,000", value: "1.25gb-30d-gift-glo" },
      { id: "glo-gift-4", name: "2.9GB - 30 Days - ₦1,900", value: "2.9gb-30d-gift-glo" }
    ]
  },
  "9mobile": {
    sme: [
      { id: "9m-sme-1", name: "100MB - 7 Days - ₦190", value: "100mb-7d-9m" },
      { id: "9m-sme-2", name: "500MB - 14 Days - ₦520", value: "500mb-14d-9m" },
      { id: "9m-sme-3", name: "1.2GB - 30 Days - ₦1,050", value: "1.2gb-30d-9m" },
      { id: "9m-sme-4", name: "2.5GB - 30 Days - ₦1,650", value: "2.5gb-30d-9m" }
    ],
    cg: [
      { id: "9m-cg-1", name: "250MB - 7 Days - ₦160", value: "250mb-7d-cg-9m" },
      { id: "9m-cg-2", name: "1.1GB - 14 Days - ₦820", value: "1.1gb-14d-cg-9m" },
      { id: "9m-cg-3", name: "2.2GB - 30 Days - ₦1,250", value: "2.2gb-30d-cg-9m" },
      { id: "9m-cg-4", name: "5.5GB - 30 Days - ₦2,750", value: "5.5gb-30d-cg-9m" }
    ],
    gifting: [
      { id: "9m-gift-1", name: "100MB - 1 Day - ₦110", value: "100mb-1d-gift-9m" },
      { id: "9m-gift-2", name: "500MB - 7 Days - ₦420", value: "500mb-7d-gift-9m" },
      { id: "9m-gift-3", name: "1.5GB - 30 Days - ₦1,150", value: "1.5gb-30d-gift-9m" },
      { id: "9m-gift-4", name: "3.2GB - 30 Days - ₦2,100", value: "3.2gb-30d-gift-9m" }
    ]
  }
};

export default function DataServices() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [autoDetected, setAutoDetected] = useState(false);

  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: servicesApi.dashboard.getStats,
    staleTime: 30000,
  });

  const dataTotal = dashboardData?.stats?.dataTotal || 0;
  const dataSuccess = dashboardData?.stats?.dataSuccess || 0;

  const handlePhoneChange = (value: string) => {
    setFormData((prev: any) => ({ ...prev, phoneNumber: value }));
    
    const detectedNetwork = detectNetwork(value);
    if (detectedNetwork) {
      setFormData((prev: any) => ({ ...prev, network: detectedNetwork, type: undefined, plan: undefined }));
      setAutoDetected(true);
    } else {
      setAutoDetected(false);
    }
  };

  const handleNetworkSelect = (networkId: string) => {
    setFormData((prev: any) => ({ ...prev, network: networkId, type: undefined, plan: undefined }));
    setAutoDetected(false);
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'type') {
      setFormData((prev: any) => ({ ...prev, type: value, plan: undefined }));
    } else {
      setFormData((prev: any) => ({ ...prev, [field]: value }));
    }
  };

  const getTypeOptions = () => {
    if (!formData.network) return [];
    const plans = DATA_PLANS[formData.network as keyof typeof DATA_PLANS];
    return plans ? Object.keys(plans) : [];
  };

  const getPlanOptions = () => {
    if (!formData.network || !formData.type) return [];
    const networkPlans = DATA_PLANS[formData.network as keyof typeof DATA_PLANS];
    if (!networkPlans) return [];
    return (networkPlans as any)[formData.type] || [];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.network || !formData.type || !formData.plan || !formData.phoneNumber) {
      toast({ title: "Missing Information", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    setShowConfirmation(true);
  };

  const handleConfirm = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setShowConfirmation(false);
      setFormData({});
      setAutoDetected(false);
      toast({ title: "Transaction Successful", description: "Data bundle purchase completed." });
    }, 1500);
  };

  const getPlanLabel = () => {
    const plans = getPlanOptions();
    return plans.find((p: any) => p.value === formData.plan)?.name || formData.plan;
  };

  const selectedNetwork = networks.find(n => n.id === formData.network);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <Card className="bg-primary text-primary-foreground border-none">
          <CardContent className="p-4 sm:p-6 flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium opacity-80">Total Data Purchased</p>
              <h3 className="text-2xl sm:text-3xl font-bold mt-1">{dataTotal.toLocaleString()}</h3>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-white/20 rounded-full flex items-center justify-center">
              <Wifi className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6 flex items-center justify-between">
             <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Successful Transactions</p>
              <h3 className="text-2xl sm:text-3xl font-bold mt-1">{dataSuccess.toLocaleString()}</h3>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-muted rounded-full flex items-center justify-center">
              <Check className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <Link href="/dashboard/services">
          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 sm:h-10 sm:w-10">
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-heading font-bold tracking-tight flex items-center gap-2">
            <Wifi className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            Data Bundles
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">Purchase data plans for MTN, Airtel, Glo, and 9mobile</p>
        </div>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Buy Data</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-base font-semibold">Phone Number</Label>
              <Input 
                placeholder="Enter phone number (e.g. 08031234567)" 
                className="w-full h-14 text-lg font-medium" 
                value={formData.phoneNumber || ''} 
                onChange={(e) => handlePhoneChange(e.target.value)} 
                data-testid="input-phone"
                maxLength={11}
              />
              {autoDetected && selectedNetwork && (
                <p className="text-sm text-green-600 font-medium flex items-center gap-1 animate-in fade-in duration-300">
                  <Check className="h-4 w-4" />
                  {selectedNetwork.name} network detected automatically
                </p>
              )}
            </div>

            <div className="space-y-3">
              <Label className="text-base font-semibold">
                {autoDetected ? 'Network (Auto-detected)' : 'Select Network'}
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {networks.map((network) => (
                  <button
                    key={network.id}
                    type="button"
                    onClick={() => handleNetworkSelect(network.id)}
                    className={`relative flex flex-col items-center p-2 sm:p-3 rounded-2xl border-2 transition-all duration-200 hover:shadow-lg ${
                      formData.network === network.id
                        ? 'border-primary bg-primary/5 shadow-md scale-105'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="relative h-12 w-12 sm:h-16 sm:w-16 rounded-full overflow-hidden bg-white shadow-sm border border-gray-100 flex items-center justify-center">
                      <img 
                        src={network.logo} 
                        alt={network.name} 
                        className="h-10 w-10 sm:h-14 sm:w-14 object-contain rounded-full" 
                      />
                      {formData.network === network.id && (
                        <div className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 bg-primary rounded-full flex items-center justify-center">
                          <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white" />
                        </div>
                      )}
                    </div>
                    <span className={`mt-1.5 sm:mt-2 text-xs sm:text-sm font-medium ${
                      formData.network === network.id ? 'text-primary' : 'text-gray-700'
                    }`}>
                      {network.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {formData.network && (
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                <Label className="text-base font-semibold">Data Type</Label>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {getTypeOptions().map((type: string) => (
                    <Button
                      key={type}
                      type="button"
                      variant={formData.type === type ? "default" : "outline"}
                      className={`w-full h-10 sm:h-12 text-sm sm:text-base font-semibold uppercase ${
                        formData.type === type ? '' : 'hover:bg-primary/10'
                      }`}
                      onClick={() => handleInputChange('type', type)}
                    >
                      {type}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {formData.type && (
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                <Label className="text-base font-semibold">Data Plan</Label>
                <Select value={formData.plan || ''} onValueChange={(val) => handleInputChange('plan', val)}>
                  <SelectTrigger className="w-full h-12 text-base" data-testid="select-plan">
                    <SelectValue placeholder="Select Data Plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {getPlanOptions().map((plan: any) => (
                      <SelectItem key={plan.id} value={plan.value} className="py-3">
                        {plan.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 text-base font-semibold" 
              disabled={loading || !formData.network || !formData.type || !formData.plan || !formData.phoneNumber} 
              data-testid="button-continue"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Confirm Data Purchase
            </DialogTitle>
            <DialogDescription>Please review the details before confirming.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              {selectedNetwork && (
                <img 
                  src={selectedNetwork.logo} 
                  alt={selectedNetwork.name} 
                  className="h-12 w-12 rounded-full object-contain border border-gray-200" 
                />
              )}
              <div>
                <p className="text-sm text-muted-foreground">Network</p>
                <p className="font-semibold capitalize">{selectedNetwork?.name}</p>
              </div>
            </div>
            <div className="border-l-4 border-primary pl-4">
              <p className="text-sm text-muted-foreground">Data Type</p>
              <p className="font-semibold uppercase">{formData.type}</p>
            </div>
            <div className="border-l-4 border-primary pl-4">
              <p className="text-sm text-muted-foreground">Plan</p>
              <p className="font-semibold">{getPlanLabel()}</p>
            </div>
            <div className="border-l-4 border-primary pl-4">
              <p className="text-sm text-muted-foreground">Phone Number</p>
              <p className="font-semibold">{formData.phoneNumber}</p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowConfirmation(false)} disabled={loading}>Cancel</Button>
            <Button onClick={handleConfirm} disabled={loading} data-testid="button-confirm">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : ""}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
