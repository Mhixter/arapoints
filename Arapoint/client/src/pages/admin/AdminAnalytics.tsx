import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const REVENUE_DATA = [
  { month: 'Jan', revenue: 45000, users: 240 },
  { month: 'Feb', revenue: 52000, users: 280 },
  { month: 'Mar', revenue: 48000, users: 300 },
  { month: 'Apr', revenue: 61000, users: 350 },
  { month: 'May', revenue: 58000, users: 380 },
  { month: 'Jun', revenue: 72000, users: 420 },
];

const SERVICE_STATS = [
  { name: 'Identity', value: 2400, fill: '#10b981' },
  { name: 'BVN', value: 1800, fill: '#3b82f6' },
  { name: 'Education', value: 3200, fill: '#8b5cf6' },
  { name: 'VTU', value: 2100, fill: '#f59e0b' },
];

const CONVERSION_DATA = [
  { day: 'Mon', conversions: 65, attempts: 100 },
  { day: 'Tue', conversions: 72, attempts: 105 },
  { day: 'Wed', conversions: 68, attempts: 98 },
  { day: 'Thu', conversions: 78, attempts: 110 },
  { day: 'Fri', conversions: 82, attempts: 115 },
  { day: 'Sat', conversions: 70, attempts: 102 },
  { day: 'Sun', conversions: 65, attempts: 95 },
];

export default function AdminAnalytics() {
  const [, navigate] = useLocation();

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-heading font-bold tracking-tight">Analytics Dashboard</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Platform performance and metrics</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/admin")} size="sm" className="w-fit h-8 sm:h-9 text-xs sm:text-sm">
          <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
          Back
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
        <Card className="overflow-hidden">
          <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-[10px] sm:text-xs lg:text-sm font-medium truncate">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold">₦358,000</div>
            <p className="text-[10px] sm:text-xs text-green-600 flex items-center gap-1 mt-0.5 sm:mt-1">
              <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> +12.5% vs last month
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-[10px] sm:text-xs lg:text-sm font-medium truncate">Transactions</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold">9,701</div>
            <p className="text-[10px] sm:text-xs text-green-600 flex items-center gap-1 mt-0.5 sm:mt-1">
              <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> +23.1% vs last month
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-[10px] sm:text-xs lg:text-sm font-medium truncate">Active Users</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold">1,203</div>
            <p className="text-[10px] sm:text-xs text-green-600 flex items-center gap-1 mt-0.5 sm:mt-1">
              <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> +5.3% vs last month
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-[10px] sm:text-xs lg:text-sm font-medium truncate">Conversion</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold">72.4%</div>
            <p className="text-[10px] sm:text-xs text-green-600 flex items-center gap-1 mt-0.5 sm:mt-1">
              <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> +2.1% vs last month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">Revenue & Users Trend</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Monthly performance over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent className="h-[200px] sm:h-[250px] lg:h-[300px] p-2 sm:p-4 lg:p-6 pt-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={REVENUE_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10 }} width={35} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} width={35} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Bar yAxisId="left" dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Revenue" />
                <Bar yAxisId="right" dataKey="users" fill="#10b981" radius={[4, 4, 0, 0]} name="Users" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">Service Distribution</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Transactions by service type</CardDescription>
          </CardHeader>
          <CardContent className="h-[200px] sm:h-[250px] lg:h-[300px] p-2 sm:p-4 lg:p-6 pt-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={SERVICE_STATS}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius="70%"
                  fill="#8884d8"
                  dataKey="value"
                  fontSize={10}
                >
                  {SERVICE_STATS.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
          <CardTitle className="text-base sm:text-lg">Conversion Rate Trend</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Successful transactions vs total attempts (daily)</CardDescription>
        </CardHeader>
        <CardContent className="h-[200px] sm:h-[250px] lg:h-[300px] p-2 sm:p-4 lg:p-6 pt-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={CONVERSION_DATA}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} width={30} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <Line type="monotone" dataKey="conversions" stroke="hsl(var(--primary))" strokeWidth={2} name="Successful" />
              <Line type="monotone" dataKey="attempts" stroke="#94a3b8" strokeWidth={2} name="Total Attempts" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
