import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";

export default function Settings() {
  const [notifications, setNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-heading font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">Manage your preferences and account settings</p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
          <CardDescription>Control how you receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">Push Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive push notifications on your device</p>
            </div>
            <Switch checked={notifications} onCheckedChange={setNotifications} data-testid="toggle-notifications" />
          </div>
          <div className="border-t pt-6 flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">Email Alerts</Label>
              <p className="text-sm text-muted-foreground">Receive email alerts for important activities</p>
            </div>
            <Switch checked={emailAlerts} onCheckedChange={setEmailAlerts} data-testid="toggle-email-alerts" />
          </div>
        </CardContent>
      </Card>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Privacy & Security</CardTitle>
          <CardDescription>Manage your security settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
            </div>
            <Switch checked={twoFactor} onCheckedChange={setTwoFactor} data-testid="toggle-2fa" />
          </div>
          <div className="border-t pt-6">
            <Button variant="outline" data-testid="button-change-password">Change Password</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize how the app looks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">Dark Mode</Label>
              <p className="text-sm text-muted-foreground">Enable dark theme for better visibility in low light</p>
            </div>
            <Switch checked={darkMode} onCheckedChange={setDarkMode} data-testid="toggle-dark-mode" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
