import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle2, ShoppingCart, Plus, Minus, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PIN {
  id: string;
  service: string;
  name: string;
  description: string;
  price: number;
  category: "exam" | "utility";
  icon?: string;
}

const ALL_PINS: PIN[] = [
  // Exam Services
  {
    id: "waec",
    service: "WAEC",
    name: "WAEC Scratch Card",
    description: "West African Examinations Council Result Checker PIN",
    price: 3500,
    category: "exam",
  },
  {
    id: "neco",
    service: "NECO",
    name: "NECO Token",
    description: "National Examinations Council Result Checker Token",
    price: 1200,
    category: "exam",
  },
  {
    id: "jamb",
    service: "JAMB",
    name: "JAMB Result Pin",
    description: "Joint Admissions & Matriculation Board Result PIN",
    price: 1500,
    category: "exam",
  },
  {
    id: "nabteb",
    service: "NABTEB",
    name: "NABTEB PIN",
    description: "National Board of Technical Education Result PIN",
    price: 2000,
    category: "exam",
  },
  {
    id: "nbais",
    service: "NBAIS",
    name: "NBAIS PIN",
    description: "National Board for Arabic & Islamic Studies PIN",
    price: 1800,
    category: "exam",
  },
  // Utility Services
  {
    id: "airtime-mtn",
    service: "MTN",
    name: "MTN Airtime Pin",
    description: "Purchase MTN airtime credit",
    price: 500,
    category: "utility",
  },
  {
    id: "airtime-airtel",
    service: "Airtel",
    name: "Airtel Airtime Pin",
    description: "Purchase Airtel airtime credit",
    price: 500,
    category: "utility",
  },
  {
    id: "data-mtn",
    service: "MTN",
    name: "MTN Data Bundle Pin",
    description: "Purchase MTN data packages",
    price: 1000,
    category: "utility",
  },
  {
    id: "data-airtel",
    service: "Airtel",
    name: "Airtel Data Bundle Pin",
    description: "Purchase Airtel data packages",
    price: 1000,
    category: "utility",
  },
];

interface PinWithQuantity extends PIN {
  quantity: number;
}

export default function BuyPINs() {
  const { toast } = useToast();
  const [pins, setPins] = useState<PinWithQuantity[]>(
    ALL_PINS.map(pin => ({ ...pin, quantity: 0 }))
  );
  const [isLoading, setIsLoading] = useState(false);
  const [purchaseComplete, setPurchaseComplete] = useState(false);

  const updateQuantity = (id: string, delta: number) => {
    setPins(pins.map(pin =>
      pin.id === id ? { ...pin, quantity: Math.max(0, pin.quantity + delta) } : pin
    ));
  };

  const getTotalItems = () => pins.reduce((sum, pin) => sum + pin.quantity, 0);
  const getTotalAmount = () => pins.reduce((sum, pin) => sum + (pin.price * pin.quantity), 0);

  const handlePurchase = () => {
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
    setPins(pins.map(pin => ({ ...pin, quantity: 0 })));
    setPurchaseComplete(false);
  };

  const examPins = pins.filter(p => p.category === "exam");

  if (purchaseComplete) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold tracking-tight">Buy PINs</h2>
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
            <div className="bg-white dark:bg-slate-900 rounded-lg p-4 my-6 space-y-2 text-left max-h-96 overflow-y-auto">
              {pins.map(pin => (
                pin.quantity > 0 && (
                  <div key={pin.id} className="flex justify-between items-center text-sm border-b pb-2">
                    <span className="font-medium">{pin.name} ×{pin.quantity}</span>
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
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold tracking-tight">Buy Exam Result PINs</h2>
        <p className="text-sm sm:text-base text-muted-foreground mt-2">Purchase result checker PINs for all major examination bodies.</p>
      </div>

      {/* Exam Services Section */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {examPins.map((pin) => (
            <PinCard key={pin.id} pin={pin} onUpdateQuantity={updateQuantity} />
          ))}
        </div>
      </div>

      {/* Order Summary */}
      {getTotalItems() > 0 && (
        <Card className="sticky bottom-4 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Items: <span className="font-bold text-primary">{getTotalItems()}</span></p>
                <p className="text-2xl font-bold">₦{getTotalAmount().toLocaleString()}</p>
              </div>
              <Button
                onClick={handlePurchase}
                size="lg"
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Checkout Now
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}

function PinCard({ pin, onUpdateQuantity }: { pin: PinWithQuantity; onUpdateQuantity: (id: string, delta: number) => void }) {
  return (
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-sm">{pin.name}</CardTitle>
              <span className="text-xs bg-muted px-2 py-0.5 rounded font-medium">{pin.service}</span>
            </div>
            <CardDescription className="text-xs">{pin.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <div className="text-2xl font-bold text-primary">
          ₦{pin.price.toLocaleString()}
        </div>

        <div className="flex items-center justify-between bg-muted/30 rounded-lg p-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => onUpdateQuantity(pin.id, -1)}
            disabled={pin.quantity === 0}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="font-bold text-sm w-8 text-center">{pin.quantity}</span>
          <Button
            variant="outline"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => onUpdateQuantity(pin.id, 1)}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>

        {pin.quantity > 0 && (
          <div className="bg-primary/10 rounded p-2 text-center">
            <p className="text-xs text-muted-foreground">Subtotal</p>
            <p className="font-bold text-primary">₦{(pin.price * pin.quantity).toLocaleString()}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
