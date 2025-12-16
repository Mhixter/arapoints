import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Smartphone, Wifi, Zap, Tv, Building2 } from "lucide-react";

export default function Services() {
  const vtuServices = [
    { icon: Smartphone, title: "Airtime Top-up", description: "MTN, Airtel, Glo, 9mobile", href: "/dashboard/airtime", color: "text-blue-600" },
    { icon: Wifi, title: "Data Bundles", description: "Daily, Weekly, Monthly Plans", href: "/dashboard/data", color: "text-purple-600" }
  ];

  const subscriptionServices = [
    { icon: Zap, title: "Electricity Bills", description: "EKEDC, IKEDC, AEDC, PHED", href: "/dashboard/electricity", color: "text-yellow-600" },
    { icon: Tv, title: "Cable TV", description: "DSTV, GOtv, Startimes", href: "/dashboard/cable", color: "text-red-600" }
  ];

  const businessServices = [
    { icon: Building2, title: "CAC Registration", description: "Business Name, Company Limited, NGO", href: "/dashboard/cac", color: "text-green-600" }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-heading font-bold tracking-tight">All Services</h2>
        <p className="text-muted-foreground">Browse available services on Arapoint</p>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-blue-600" /> VTU Services
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          {vtuServices.map((service) => (
            <Link key={service.href} href={service.href}>
              <Card className="h-full flex flex-col cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all">
                <CardHeader>
                  <div className={`h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2 ${service.color}`}>
                    <service.icon className="h-5 w-5" />
                  </div>
                  <CardTitle>{service.title}</CardTitle>
                  <CardDescription>{service.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-primary font-medium">Continue →</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-600" /> Bill Payments
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          {subscriptionServices.map((service) => (
            <Link key={service.href} href={service.href}>
              <Card className="h-full flex flex-col cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all">
                <CardHeader>
                  <div className={`h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2 ${service.color}`}>
                    <service.icon className="h-5 w-5" />
                  </div>
                  <CardTitle>{service.title}</CardTitle>
                  <CardDescription>{service.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-primary font-medium">Continue →</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-green-600" /> Business Services
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          {businessServices.map((service) => (
            <Link key={service.href} href={service.href}>
              <Card className="h-full flex flex-col cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all">
                <CardHeader>
                  <div className={`h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2 ${service.color}`}>
                    <service.icon className="h-5 w-5" />
                  </div>
                  <CardTitle>{service.title}</CardTitle>
                  <CardDescription>{service.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-primary font-medium">Continue →</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
