import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Copy, Check, Building2, CreditCard, RefreshCw } from "lucide-react";
import { walletApi, VirtualAccount } from "@/lib/api/wallet";
import { useToast } from "@/hooks/use-toast";

interface FundWalletModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FundWalletModal({ open, onOpenChange }: FundWalletModalProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: virtualAccount, isLoading, isError, refetch } = useQuery({
    queryKey: ['virtualAccount'],
    queryFn: walletApi.getVirtualAccount,
    enabled: open,
  });

  const generateMutation = useMutation({
    mutationFn: walletApi.generateVirtualAccount,
    onSuccess: (data) => {
      queryClient.setQueryData(['virtualAccount'], {
        configured: true,
        account: data.account,
      });
      toast({
        title: "Account Created",
        description: "Your funding account has been generated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.response?.data?.message || "Failed to generate account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: "Copied",
      description: "Account number copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (open && virtualAccount?.configured && !virtualAccount?.account) {
      generateMutation.mutate();
    }
  }, [open, virtualAccount?.configured, virtualAccount?.account]);

  const renderContent = () => {
    if (isLoading || generateMutation.isPending) {
      return (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">
            {generateMutation.isPending ? "Generating your account..." : "Loading account details..."}
          </p>
        </div>
      );
    }

    if (isError || !virtualAccount?.configured) {
      return (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Building2 className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground text-center">
            Payment system is being configured. Please check back later or contact support.
          </p>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      );
    }

    if (virtualAccount?.account) {
      return (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Transfer any amount to the account below to fund your wallet instantly.
            </p>
          </div>

          <Card className="border-2 border-primary/20 bg-primary/5">
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Bank Name</p>
                <p className="text-lg font-semibold flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  {virtualAccount.account.bankName}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Account Number</p>
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold tracking-wider text-primary">
                    {virtualAccount.account.accountNumber}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(virtualAccount.account!.accountNumber)}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Account Name</p>
                <p className="text-lg font-medium">
                  {virtualAccount.account.accountName}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Note:</strong> Transfers to this account are credited instantly to your Arapoint wallet. 
              A small fee may apply per transaction.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <CreditCard className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground text-center">
          Generate your dedicated funding account
        </p>
        <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
          {generateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Generate Account
        </Button>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Fund Your Wallet
          </DialogTitle>
          <DialogDescription>
            Use bank transfer to add money to your wallet
          </DialogDescription>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
