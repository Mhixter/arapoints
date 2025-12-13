import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Bell, AlertCircle, CheckCircle, Info } from "lucide-react";
import { Link } from "wouter";

const mockNotifications = [
  {
    id: 1,
    type: "success",
    title: "Transaction Successful",
    message: "Your airtime purchase of ₦1,000 was successful",
    timestamp: "2 hours ago",
    icon: CheckCircle,
  },
  {
    id: 2,
    type: "warning",
    title: "Low Wallet Balance",
    message: "Your wallet balance is below ₦5,000. Top up now",
    timestamp: "5 hours ago",
    icon: AlertCircle,
  },
  {
    id: 3,
    type: "info",
    title: "New Service Available",
    message: "We've added new data plans for your network",
    timestamp: "1 day ago",
    icon: Info,
  },
  {
    id: 4,
    type: "success",
    title: "Account Verified",
    message: "Your phone number has been verified",
    timestamp: "3 days ago",
    icon: CheckCircle,
  },
];

export default function Notifications() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-heading font-bold tracking-tight flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Notifications
          </h2>
          <p className="text-muted-foreground">Stay updated with your account activity</p>
        </div>
      </div>

      <div className="space-y-4 max-w-2xl">
        {mockNotifications.map((notif) => {
          const Icon = notif.icon;
          return (
            <Card key={notif.id} className="hover:shadow-md transition-shadow" data-testid={`notification-${notif.id}`}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className={`mt-1 ${
                    notif.type === "success"
                      ? "text-green-600"
                      : notif.type === "warning"
                      ? "text-amber-600"
                      : "text-blue-600"
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{notif.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">{notif.message}</p>
                    <p className="text-xs text-muted-foreground mt-2">{notif.timestamp}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {mockNotifications.length === 0 && (
        <Card className="max-w-2xl">
          <CardContent className="pt-12 pb-12 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No notifications yet</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
