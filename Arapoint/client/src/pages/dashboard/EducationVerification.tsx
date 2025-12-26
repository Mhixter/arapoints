import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GraduationCap, Loader2, Award, Download, Printer, AlertCircle } from "lucide-react";
import { servicesApi } from "@/lib/api/services";
import jambLogo from '@assets/Official_JAMB_logo-removebg-preview_1764215962098.png';

const ExamLogo = ({ name, color, image }: { name: string, color?: string, image?: string }) => {
  if (image) {
    return <img src={image} alt={name} className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 lg:h-30 lg:w-30 object-contain bg-transparent" />;
  }
  return (
    <div className={`h-12 w-12 rounded-lg flex items-center justify-center text-sm font-bold text-white ${color} shadow-sm`}>
      {name}
    </div>
  );
};

export default function EducationVerification() {
  const currentYear = new Date().getFullYear();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [jambYear, setJambYear] = useState(currentYear.toString());
  const [examType, setExamType] = useState("school_candidate");
  const [examYear, setExamYear] = useState(currentYear.toString());
  const [token, setToken] = useState("");

  const pollJobStatus = async (jobId: string): Promise<any> => {
    const maxAttempts = 60;
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      const status = await servicesApi.education.getJobStatus(jobId);
      
      if (status.status === 'completed') {
        return status.resultData;
      }
      
      if (status.status === 'failed') {
        throw new Error(status.errorMessage || 'Verification failed');
      }
      
      setStatusMessage(`Processing... (${attempts + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 3000));
      attempts++;
    }
    
    throw new Error('Request timed out. Please try again.');
  };

  const handleJAMBCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);
    setError(null);
    setStatusMessage("Submitting request...");

    const form = e.target as HTMLFormElement;
    const regNumber = (form.elements.namedItem('jamb-reg') as HTMLInputElement).value;

    try {
      const response = await servicesApi.education.checkJAMB({
        registrationNumber: regNumber.toUpperCase(),
        examYear: parseInt(jambYear)
      });

      setStatusMessage("Waiting for results...");
      const resultData = await pollJobStatus(response.jobId);
      setResult(resultData);
      setStatusMessage(null);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to check JAMB result');
      setStatusMessage(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold tracking-tight">JAMB Result Checker</h2>
        <p className="text-sm sm:text-base text-muted-foreground mt-2">Check your JAMB UTME/DE examination results instantly.</p>
      </div>

      <div className="flex gap-2 sm:gap-3 md:gap-4 mb-4 flex-wrap justify-center sm:justify-start">
        <ExamLogo name="JAMB" image={jambLogo} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
        <div className="lg:col-span-2 space-y-4 md:space-y-6 lg:space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Check Your Result</CardTitle>
              <CardDescription>Enter your JAMB registration details to retrieve your result.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                  </div>
                )}
                <div className="border-t pt-6">
                  <form onSubmit={handleJAMBCheck} className="grid gap-3 md:gap-4 lg:gap-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="jamb-reg">JAMB Registration Number *</Label>
                        <Input id="jamb-reg" name="jamb-reg" placeholder="e.g., 1234567890" required className="h-10 sm:h-11 uppercase text-sm" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="jamb-year">Exam Year *</Label>
                        <Select value={jambYear} onValueChange={setJambYear}>
                          <SelectTrigger className="h-10 sm:h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({length: 12}, (_, i) => currentYear + 1 - i).map(year => (
                              <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 border-t pt-4">
                      <div className="space-y-2">
                        <Label>Exam Type *</Label>
                        <Select value={examType} onValueChange={setExamType}>
                          <SelectTrigger className="h-10 sm:h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="school_candidate">School Candidate (Internal)</SelectItem>
                            <SelectItem value="private_candidate">Private Candidate (GCE)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Exam Year *</Label>
                        <Select value={examYear} onValueChange={setExamYear}>
                          <SelectTrigger className="h-10 sm:h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({length: 20}, (_, i) => currentYear - i).map(year => (
                              <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Scratch Card PIN / Token *</Label>
                      <Input 
                        value={token} 
                        onChange={(e) => setToken(e.target.value)}
                        placeholder="Enter PIN or Token"
                        className="h-10 sm:h-11"
                        required
                      />
                    </div>

                    <Button type="submit" size="lg" disabled={isLoading} className="w-full">
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {statusMessage || "Checking Result..."}
                        </>
                      ) : (
                        "Check JAMB Result"
                      )}
                    </Button>
                  </form>
                </div>
              </div>
            </CardContent>
          </Card>

          {result && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="border-2 border-primary/20 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                  <GraduationCap className="h-40 w-40" />
                </div>
                <CardHeader className="bg-muted/30 border-b text-center pb-6">
                  <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4 text-green-700">
                    <Award className="h-8 w-8" />
                  </div>
                  <CardTitle className="text-2xl uppercase tracking-widest text-foreground">Result Slip</CardTitle>
                  <CardDescription className="font-mono text-xs uppercase tracking-widest">Official Verification Copy</CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Candidate Name</p>
                      <p className="font-bold text-base sm:text-lg">{result.candidateName || result.name || 'N/A'}</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Reg Number</p>
                      <p className="font-mono font-bold text-base sm:text-lg">{result.regNumber || result.registrationNumber || 'N/A'}</p>
                    </div>
                  </div>

                  {result.subjects && result.subjects.length > 0 && (
                    <div className="border rounded-lg p-3 sm:p-4 bg-muted/10">
                      <div className="flex justify-between items-center mb-3 sm:mb-4 pb-2 border-b">
                        <span className="font-semibold text-sm sm:text-base">Subject</span>
                        <span className="font-semibold text-sm sm:text-base">Score</span>
                      </div>
                      <div className="space-y-2 sm:space-y-3">
                        {result.subjects.map((sub: any, i: number) => (
                          <div key={i} className="flex justify-between items-center text-xs sm:text-sm">
                            <span>{sub.name || sub.subject}</span>
                            <span className="font-mono font-bold">{sub.score || sub.grade}</span>
                          </div>
                        ))}
                      </div>
                      {(result.score || result.aggregate) && (
                        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t flex justify-between items-center">
                          <span className="font-bold text-base sm:text-lg">Aggregate Score</span>
                          <span className="font-mono font-bold text-xl sm:text-2xl text-primary">{result.score || result.aggregate}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {(result.status || result.institution) && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800 text-center">
                       <p className="text-sm text-blue-800 dark:text-blue-300">
                         Admission Status: <span className="font-bold">{result.status || 'N/A'}</span>
                       </p>
                       {result.institution && (
                         <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">{result.institution}</p>
                       )}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="bg-muted/30 p-3 sm:p-4 flex flex-col sm:flex-row gap-2 sm:gap-4 justify-between">
                   <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
                    <Printer className="mr-2 h-4 w-4" />
                    Print
                  </Button>
                   <Button size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
                    <Download className="mr-2 h-4 w-4" />
                    Download Certificate
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )}
        </div>

        <div className="space-y-4 md:space-y-6">
           <Card className="bg-gradient-to-br from-primary to-green-700 text-white border-none sticky top-4 sm:top-6 md:top-8 lg:top-0">
            <CardHeader>
              <CardTitle>Buy PINs</CardTitle>
              <CardDescription className="text-white/80">Purchase result checker PINs in bulk.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-white/20 pb-2">
                  <span>WAEC Scratch Card</span>
                  <span className="font-bold">₦3,500</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/20 pb-2">
                  <span>NECO Token</span>
                  <span className="font-bold">₦1,200</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/20 pb-2">
                  <span>JAMB Result Pin</span>
                  <span className="font-bold">₦1,500</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/dashboard/buy-pins" className="w-full">
                <Button variant="secondary" className="w-full text-primary font-bold">Purchase Now</Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
