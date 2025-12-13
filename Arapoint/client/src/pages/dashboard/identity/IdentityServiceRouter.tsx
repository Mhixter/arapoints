import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Search, CheckCircle2, Download, Printer, Clock, FileText, AlertCircle } from "lucide-react";
import { SERVICES } from "../IdentityVerification";
import { useState, useRef } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import slipInfo from '@assets/image_1764211401623.png';
import slipRegular from '@assets/image_1764211451522.png';
import slipStandard from '@assets/image_1764211490940.png';
import slipPremium from '@assets/image_1764211520708.png';

const SLIP_TYPES = [
  { id: "information", name: "Information Slip", price: 200, desc: "Verified NIN Details", image: slipInfo },
  { id: "regular", name: "Regular Slip", price: 250, desc: "National Identification Number Slip (NINS)", image: slipRegular },
  { id: "standard", name: "Standard Slip", price: 300, desc: "National Identification Card (NGA)", image: slipStandard },
  { id: "premium", name: "Premium Slip", price: 300, desc: "Digital NIN Slip", image: slipPremium },
];

const SERVICE_PRICES: Record<string, number> = {
  "nin-verification": 150,
  "nin-phone": 200,
  "ipe-clearance": 500,
  "validation": 200,
  "personalization": 3000,
  "birth-attestation": 5000,
};

export default function IdentityServiceRouter() {
  const [match, params] = useRoute("/dashboard/identity/:service");
  const serviceId = params?.service;
  const service = SERVICES.find(s => s.id === serviceId);
  const price = SERVICE_PRICES[serviceId || ''] || 500;

  if (!service) {
    return <div>Service not found</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/identity">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-heading font-bold flex items-center gap-2">
            <service.icon className={`h-6 w-6 ${service.color}`} />
            {service.name}
          </h2>
          <p className="text-muted-foreground">{service.desc}</p>
        </div>
      </div>

      <ServiceContent service={service} price={price} />
    </div>
  );
}

function ServiceContent({ service, price }: { service: any, price: number }) {
  const [isLoading, setIsLoading] = useState(false);
  const [requestStatus, setRequestStatus] = useState<"idle" | "pending" | "completed" | "error">("idle");
  const [result, setResult] = useState<any>(null);
  const [slipHtml, setSlipHtml] = useState<string | null>(null);
  const [selectedSlip, setSelectedSlip] = useState("standard");
  const [error, setError] = useState("");
  const { toast } = useToast();
  const slipContainerRef = useRef<HTMLDivElement>(null);

  const getAuthToken = () => {
    return localStorage.getItem('accessToken');
  };

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const inputValue = formData.get("input") as string;
    const phoneValue = formData.get("phone") as string;

    setError("");
    setIsLoading(true);
    setResult(null);
    setSlipHtml(null);

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Please login to continue");
      }

      let endpoint = '';
      let body: any = {};

      if (service.id === "nin-verification") {
        endpoint = '/api/identity/nin';
        body = { nin: inputValue, slipType: selectedSlip };
      } else if (service.id === "nin-phone") {
        endpoint = '/api/identity/nin-phone';
        body = { nin: inputValue, phone: phoneValue, slipType: selectedSlip };
      } else if (service.id === "ipe-clearance") {
        endpoint = '/api/identity/lost-nin';
        body = { phone: phoneValue || inputValue, enrollmentId: inputValue };
        setIsLoading(false);
        setRequestStatus("pending");
        return;
      } else if (service.id === "personalization" || service.id === "validation" || service.id === "birth-attestation") {
        setIsLoading(false);
        setRequestStatus("pending");
        return;
      } else {
        throw new Error("Unknown service type");
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Verification failed');
      }

      setResult(data.data?.data || data.data);
      if (data.data?.slip?.html) {
        setSlipHtml(data.data.slip.html);
      }
      setRequestStatus("completed");

      toast({
        title: "Verification Successful",
        description: `${service.name} completed successfully`,
      });

    } catch (err: any) {
      setError(err.message || 'Verification failed');
      setRequestStatus("error");
      toast({
        title: "Verification Failed",
        description: err.message || 'An error occurred',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadSlip = () => {
    if (!slipHtml) return;

    const blob = new Blob([slipHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${service.id}-slip-${Date.now()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Slip Downloaded",
      description: "Open the HTML file in your browser and print it",
    });
  };

  const handlePrintSlip = () => {
    if (!slipHtml) return;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(slipHtml);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  if (requestStatus === "pending") {
    return (
      <Card className="max-w-lg mx-auto text-center border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800">
        <CardContent className="pt-10 pb-10 space-y-4">
          <div className="h-16 w-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto text-yellow-600">
            <Clock className="h-8 w-8" />
          </div>
          <h3 className="text-2xl font-bold text-yellow-800 dark:text-yellow-400">Request Submitted</h3>
          <p className="text-yellow-700 dark:text-yellow-300 max-w-xs mx-auto">
            Your {service.name} request has been submitted successfully. 
            Status is currently <strong>Pending Admin Approval</strong>.
          </p>
          <p className="text-sm text-muted-foreground">
            You will be notified once the admin processes your request and uploads the result slip.
          </p>
          <Button onClick={() => setRequestStatus("idle")} variant="outline" className="mt-4">Submit Another Request</Button>
        </CardContent>
      </Card>
    );
  }

  if (requestStatus === "error") {
    return (
      <Card className="max-w-lg mx-auto text-center border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
        <CardContent className="pt-10 pb-10 space-y-4">
          <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h3 className="text-2xl font-bold text-red-800 dark:text-red-400">Verification Failed</h3>
          <p className="text-red-700 dark:text-red-300 max-w-xs mx-auto">
            {error || 'An error occurred during verification. Please try again.'}
          </p>
          <Button onClick={() => { setRequestStatus("idle"); setError(""); }} variant="outline" className="mt-4">Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  if (service.id.includes("verification") || service.id.includes("lookup") || service.id === "nin-phone") {
    return (
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Search Identity</CardTitle>
              <CardDescription>Enter the required details to verify. Price: ₦{price}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="space-y-6">
                {service.id === "nin-phone" ? (
                  <>
                    <div className="space-y-2">
                      <Label>National Identity Number (NIN)</Label>
                      <Input 
                        name="input"
                        placeholder="11 Digit NIN" 
                        maxLength={11} 
                        inputMode="numeric"
                        pattern="[0-9]*"
                        required 
                        className="h-12 font-mono text-lg tracking-widest" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone Number</Label>
                      <Input 
                        name="phone"
                        placeholder="08012345678" 
                        maxLength={11} 
                        inputMode="numeric"
                        pattern="[0-9]*"
                        required 
                        className="h-12 font-mono text-lg tracking-widest" 
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <Label>National Identity Number (NIN)</Label>
                    <Input 
                      name="input"
                      placeholder="11 Digit NIN" 
                      maxLength={11} 
                      inputMode="numeric"
                      pattern="[0-9]*"
                      required 
                      className="h-12 font-mono text-lg tracking-widest" 
                    />
                  </div>
                )}

                <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying with YouVerify...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Verify Now (₦{price})
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {result && (
            <div className="space-y-6">
              <ResultCard result={result} type={service.id} />
              
              {slipHtml && (
                <Card>
                  <CardHeader>
                    <CardTitle>Download Result Slip</CardTitle>
                    <CardDescription>Your verified identity slip is ready</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div ref={slipContainerRef} className="border rounded-lg overflow-hidden mb-6">
                      <iframe 
                        srcDoc={slipHtml} 
                        className="w-full h-96 border-0"
                        title="Identity Slip Preview"
                      />
                    </div>
                    <div className="flex gap-4 justify-end">
                      <Button variant="outline" onClick={handlePrintSlip}>
                        <Printer className="mr-2 h-4 w-4" />
                        Print Slip
                      </Button>
                      <Button onClick={handleDownloadSlip}>
                        <Download className="mr-2 h-4 w-4" />
                        Download Slip
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <Card className="bg-muted/30 border-none">
            <CardHeader>
              <CardTitle className="text-base">Instructions</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2 text-muted-foreground">
              <p>1. Ensure you have the correct NIN number.</p>
              <p>2. Consent must be obtained from the ID holder.</p>
              <p>3. Results are fetched directly from NIMC via YouVerify.</p>
              <p>4. Service fee: ₦{price} will be deducted from your wallet.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (service.id === "ipe-clearance") {
     return (
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Lost NIN Recovery</CardTitle>
          <CardDescription>Recover your lost NIN using NIMC second enrollment tracking ID. Price: ₦{price}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
             <div className="space-y-2">
              <Label>Phone Number (Linked to NIN)</Label>
              <Input name="phone" placeholder="08012345678" className="h-12" required />
            </div>
             <div className="space-y-2">
              <Label>Tracking ID / Second Enrollment ID</Label>
              <Input name="input" placeholder="Enter Tracking ID" className="h-12" required />
            </div>
             <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
               {isLoading ? <Loader2 className="animate-spin" /> : `Recover NIN (₦${price})`}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  if (service.id === "personalization" || service.id === "validation") {
    return (
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>{service.id === "personalization" ? "Personalization Request" : "Validation Request"}</CardTitle>
          <CardDescription>Submit a request to {service.id === "personalization" ? "personalize your identity details" : "validate your identity"}. Price: ₦{price}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
             <div className="space-y-2">
              <Label>{service.id === "personalization" ? "Tracking ID / Reference" : "National Identity Number (NIN)"}</Label>
              <Input 
                name="input" 
                placeholder={service.id === "personalization" ? "Enter Tracking ID" : "11 Digit NIN"}
                className="h-12" 
                maxLength={service.id === "personalization" ? undefined : 11}
                inputMode={service.id === "personalization" ? "text" : "numeric"}
                pattern={service.id === "personalization" ? undefined : "[0-9]*"}
                required 
              />
            </div>
             <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
               {isLoading ? <Loader2 className="animate-spin" /> : `Submit Request (₦${price})`}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  if (service.id === "birth-attestation") {
    return (
      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Birth Attestation Certificate Request</CardTitle>
            <CardDescription>Request an NPC birth certificate or attestation document. Price: ₦{price}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full-name">Full Name</Label>
                <Input id="full-name" name="input" placeholder="Enter full name as on birth certificate" className="h-12" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input id="dob" name="dob" type="date" className="h-12" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <select name="gender" className="h-12 w-full rounded-md border border-input bg-background px-3 py-2" required>
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State of Registration</Label>
                <Input id="state" name="state" placeholder="State where birth was registered" className="h-12" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lga">Local Government Area (LGA)</Label>
                <Input id="lga" name="lga" placeholder="LGA of registration" className="h-12" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parents">Parents/Guardian Name</Label>
                <Input id="parents" name="parents" placeholder="Name of parent or guardian" className="h-12" required />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing Request...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Request Certificate (₦{price})
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <Card className="mt-6 bg-muted/30 border-none">
          <CardHeader>
            <CardTitle className="text-base">Requirements</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2 text-muted-foreground">
            <p>✓ Full name as on birth certificate</p>
            <p>✓ Exact date of birth</p>
            <p>✓ State and LGA of registration</p>
            <p>✓ Parent/Guardian details</p>
            <p>✓ Valid means of identification</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-muted/10 border-dashed">
      <div className={`h-16 w-16 rounded-full flex items-center justify-center mb-4 ${service.bg} ${service.color}`}>
        <service.icon className="h-8 w-8" />
      </div>
      <h3 className="text-xl font-bold mb-2">{service.name}</h3>
      <p className="text-muted-foreground max-w-md mb-6">
        This service is currently being maintained or requires manual processing. Please contact support for assistance.
      </p>
      <Button variant="outline">Contact Support</Button>
    </div>
  );
}

function ResultCard({ result, type }: { result: any, type: string }) {
  const fullName = `${result.lastName || ''} ${result.firstName || ''} ${result.middleName || ''}`.trim();
  
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mt-6">
      <Card className="border-primary/50 shadow-md overflow-hidden">
        <div className="bg-primary/10 p-4 border-b border-primary/20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary font-bold">
            <CheckCircle2 className="h-5 w-5" />
            Identity Verified
          </div>
          <span className="text-xs text-muted-foreground font-mono">{new Date().toLocaleString()}</span>
        </div>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              {result.photo ? (
                <img 
                  src={result.photo.startsWith('data:') ? result.photo : `data:image/jpeg;base64,${result.photo}`} 
                  alt="Face" 
                  className="w-32 h-32 rounded-lg object-cover border border-border shadow-sm bg-muted" 
                />
              ) : (
                <div className="w-32 h-32 rounded-lg border border-border shadow-sm bg-muted flex items-center justify-center text-muted-foreground">
                  No Photo
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 flex-1">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Full Name</p>
                <p className="font-medium text-lg">{fullName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">Date of Birth</p>
                <p className="font-medium">{result.dateOfBirth || result.dob || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">Gender</p>
                <p className="font-medium">{result.gender || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">Phone</p>
                <p className="font-medium">{result.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">State</p>
                <p className="font-medium">{result.state || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">LGA</p>
                <p className="font-medium">{result.lga || 'N/A'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs text-muted-foreground uppercase">Address</p>
                <p className="font-medium">{result.address || 'N/A'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
