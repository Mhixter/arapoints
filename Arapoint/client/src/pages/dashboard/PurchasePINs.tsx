import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle2, ShoppingCart, Plus, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PINS = [
  {
    id: "waec",
    name: "WAEC Scratch Card",
    description: "West African Examinations Council Result Checker PIN",
    price: 3500,
    quantity: 0,
  },
  {
    id: "neco",
    name: "NECO Token",
    description: "National Examinations Council Result Checker Token",
    price: 1200,
    quantity: 0,
  },
  {
    id: "jamb",
    name: "JAMB Result Pin",
    description: "Joint Admissions & Matriculation Board Result PIN",
    price: 1500,
    quantity: 0,
  },
];

export default function PurchasePINs() {
  const { toast } = useToast();
  const [pins, setPins] = useState(PINS);
  const [isLoading, setIsLoading] = useState(false);
  const [purchaseComplete, setPurchaseComplete] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("wallet");

  const updateQuantity = (id: string, delta: number) => {
    setPins(pins.map(pin =>
      pin.id === id ? { ...pin, quantity: Math.max(0, pin.quantity + delta) } : pin
    ));
  };

  const getTotalItems = () => pins.reduce((sum, pin) => sum + pin.quantity, 0);
  const getTotalAmount = () => pins.reduce((sum, pin) => sum + (pin.price * pin.quantity), 0);

  const handlePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (getTotalItems() === 0) {
      toast({
        title: "No Items Selected",
        description: "Please select at least one PIN to purchase.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setPurchaseComplete(true);
      toast({
        title: "Purchase Successful",
        description: `You have purchased ${getTotalItems()} PIN(s) for ₦${getTotalAmount().toLocaleString()}`,
      });
    }, 2000);
  };

  const handleReset = () => {
    setPins(PINS);
    setPurchaseComplete(false);
  };

  if (purchaseComplete) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold tracking-tight">Purchase PINs</h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">Order confirmation</p>
        </div>

        <Card className="max-w-2xl mx-auto text-center border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
          <CardContent className="pt-10 pb-10 space-y-4">
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-2xl font-bold text-green-800 dark:text-green-400">Purchase Completed!</h3>
            <p className="text-green-700 dark:text-green-300 max-w-xs mx-auto">
              Your PINs have been purchased successfully and will be delivered to your email shortly.
            </p>
            <div className="bg-white dark:bg-slate-900 rounded-lg p-4 my-6 space-y-2">
              {pins.map(pin => (
                pin.quantity > 0 && (
                  <div key={pin.id} className="flex justify-between items-center text-sm">
                    <span>{pin.name} × {pin.quantity}</span>
                    <span className="font-bold">₦{(pin.price * pin.quantity).toLocaleString()}</span>
                  </div>
                )
              ))}
              <div className="border-t pt-2 flex justify-between items-center font-bold">
                <span>Total</span>
                <span className="text-lg text-primary">₦{getTotalAmount().toLocaleString()}</span>
              </div>
            </div>
            <Button onClick={handleReset} className="w-full">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Purchase More PINs
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold tracking-tight">Purchase Result Checker PINs</h2>
        <p className="text-sm sm:text-base text-muted-foreground mt-2">Buy PINs in bulk for exam result verification.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Available PINs</CardTitle>
              <CardDescription>Select quantity and proceed to checkout.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pins.map((pin) => (
                <div key={pin.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="font-bold text-base sm:text-lg">{pin.name}</h4>
                      <p className="text-sm text-muted-foreground">{pin.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">₦{pin.price.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">per PIN</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-muted/30 rounded-lg p-3">
                    <span className="text-sm font-medium">Quantity:</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(pin.id, -1)}
                        disabled={pin.quantity === 0}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-12 text-center font-bold text-lg">{pin.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(pin.id, 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <span className="text-sm font-bold">₦{(pin.price * pin.quantity).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 md:space-y-6">
          <Card className="sticky top-4 sm:top-6 md:top-8 lg:top-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {pins.map(pin => (
                  pin.quantity > 0 && (
                    <div key={pin.id} className="flex justify-between text-sm">
                      <span>{pin.name} ×{pin.quantity}</span>
                      <span className="font-bold">₦{(pin.price * pin.quantity).toLocaleString()}</span>
                    </div>
                  )
                ))}
              </div>

              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Subtotal:</span>
                  <span>₦{getTotalAmount().toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Items:</span>
                  <span>{getTotalItems()}</span>
                </div>
              </div>

              <div className="border-t pt-3">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-bold">Total:</span>
                  <span className="text-2xl font-bold text-primary">₦{getTotalAmount().toLocaleString()}</span>
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="payment-method" className="text-sm">Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="wallet">Wallet Balance</SelectItem>
                        <SelectItem value="card">Debit Card</SelectItem>
                        <SelectItem value="bank">Bank Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    onClick={handlePurchase}
                    className="w-full" 
                    size="lg"
                    disabled={isLoading || getTotalItems() === 0}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : getTotalItems() === 0 ? (
                      <>
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Select Items to Checkout
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Checkout ({getTotalItems()})
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
