import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Banknote, Loader2, RefreshCw, LogOut, User, Clock, 
  CheckCircle, Phone, ArrowDownCircle, Wallet, AlertCircle
} from 'lucide-react';

const getToken = () => localStorage.getItem('a2cAgentToken');

const STATUS_LABELS: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pending', color: 'bg-gray-100 text-gray-700', icon: Clock },
  awaiting_transfer: { label: 'Awaiting Transfer', color: 'bg-yellow-100 text-yellow-700', icon: ArrowDownCircle },
  confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700', icon: Wallet },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: AlertCircle },
};

export default function A2CAgentDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('available');
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>({});
  const [availableRequests, setAvailableRequests] = useState<any[]>([]);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [pickupForm, setPickupForm] = useState({ receivingNumber: '' });
  const [statusForm, setStatusForm] = useState({ status: '', agentNotes: '' });
  const [networkFilter, setNetworkFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLocation('/agent/a2c/login');
      return;
    }
    fetchProfile();
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'available') {
      fetchAvailableRequests();
    } else if (activeTab === 'my-requests') {
      fetchMyRequests();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'available') {
      fetchAvailableRequests();
    }
  }, [networkFilter]);

  useEffect(() => {
    if (activeTab === 'my-requests') {
      fetchMyRequests();
    }
  }, [statusFilter]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/a2c-agent/profile', {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await response.json();
      if (data.status === 'success') {
        setProfile(data.data.agent);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/a2c-agent/stats', {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await response.json();
      if (data.status === 'success') {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchAvailableRequests = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (networkFilter !== 'all') params.append('network', networkFilter);
      
      const response = await fetch(`/api/a2c-agent/available-requests?${params}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await response.json();
      if (data.status === 'success') {
        setAvailableRequests(data.data.requests || []);
      }
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyRequests = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      
      const response = await fetch(`/api/a2c-agent/requests?${params}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await response.json();
      if (data.status === 'success') {
        setMyRequests(data.data.requests || []);
      }
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePickup = async () => {
    if (!pickupForm.receivingNumber) {
      toast({ title: 'Error', description: 'Enter your phone number to receive airtime', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/a2c-agent/requests/${selectedRequest.id}/pickup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify(pickupForm)
      });
      const data = await response.json();
      if (data.status === 'success') {
        toast({ title: 'Success', description: 'Request picked up! Wait for customer to send airtime.' });
        setShowPickupModal(false);
        setPickupForm({ receivingNumber: '' });
        fetchAvailableRequests();
        fetchStats();
      } else {
        toast({ title: 'Error', description: data.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to pickup request', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!statusForm.status) {
      toast({ title: 'Error', description: 'Select a status', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/a2c-agent/requests/${selectedRequest.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify(statusForm)
      });
      const data = await response.json();
      if (data.status === 'success') {
        toast({ title: 'Success', description: 'Request status updated!' });
        setShowStatusModal(false);
        setStatusForm({ status: '', agentNotes: '' });
        fetchMyRequests();
        fetchStats();
      } else {
        toast({ title: 'Error', description: data.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update request', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('a2cAgentToken');
    localStorage.removeItem('a2cAgentRefreshToken');
    localStorage.removeItem('a2cAgentInfo');
    setLocation('/agent/a2c/login');
  };

  const getNextStatuses = (currentStatus: string) => {
    const transitions: Record<string, string[]> = {
      awaiting_transfer: ['confirmed', 'cancelled'],
      confirmed: ['completed', 'cancelled'],
    };
    return transitions[currentStatus] || [];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Banknote className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h1 className="font-semibold">A2C Agent Portal</h1>
              <p className="text-sm text-muted-foreground">{profile?.name || 'Loading...'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Awaiting</p>
                  <p className="text-2xl font-bold">{stats.awaiting || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Confirmed</p>
                  <p className="text-2xl font-bold">{stats.confirmed || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{stats.totalCompletedRequests || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Banknote className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Processed</p>
                  <p className="text-2xl font-bold">₦{parseFloat(stats.totalProcessedAmount || 0).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="available">Available Requests</TabsTrigger>
            <TabsTrigger value="my-requests">My Requests</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Available Requests</CardTitle>
                  <CardDescription>Pick up requests to process</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={networkFilter} onValueChange={setNetworkFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Network" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Networks</SelectItem>
                      <SelectItem value="mtn">MTN</SelectItem>
                      <SelectItem value="airtel">Airtel</SelectItem>
                      <SelectItem value="glo">Glo</SelectItem>
                      <SelectItem value="9mobile">9mobile</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={fetchAvailableRequests}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : availableRequests.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No available requests at the moment
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tracking ID</TableHead>
                        <TableHead>Network</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Airtime</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>Cash Out</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {availableRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-mono text-sm">{request.trackingId}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{request.network?.toUpperCase()}</Badge>
                          </TableCell>
                          <TableCell>{request.phoneNumber}</TableCell>
                          <TableCell className="font-medium">₦{parseFloat(request.airtimeAmount).toLocaleString()}</TableCell>
                          <TableCell>{(parseFloat(request.conversionRate) * 100).toFixed(0)}%</TableCell>
                          <TableCell className="font-medium text-green-600">₦{parseFloat(request.cashAmount).toLocaleString()}</TableCell>
                          <TableCell>{new Date(request.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Button 
                              size="sm" 
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowPickupModal(true);
                              }}
                            >
                              Pickup
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="my-requests" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>My Requests</CardTitle>
                  <CardDescription>Requests you are processing</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="awaiting_transfer">Awaiting Transfer</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={fetchMyRequests}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : myRequests.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No requests found
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tracking ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Network</TableHead>
                        <TableHead>Airtime</TableHead>
                        <TableHead>Cash Out</TableHead>
                        <TableHead>Receiving #</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {myRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-mono text-sm">{request.trackingId}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{request.userName || 'N/A'}</div>
                              <div className="text-xs text-muted-foreground">{request.phoneNumber}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{request.network?.toUpperCase()}</Badge>
                          </TableCell>
                          <TableCell>₦{parseFloat(request.airtimeAmount).toLocaleString()}</TableCell>
                          <TableCell className="text-green-600">₦{parseFloat(request.cashAmount).toLocaleString()}</TableCell>
                          <TableCell>{request.receivingNumber}</TableCell>
                          <TableCell>
                            <Badge className={STATUS_LABELS[request.status]?.color || ''}>
                              {STATUS_LABELS[request.status]?.label || request.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {getNextStatuses(request.status).length > 0 && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setStatusForm({ status: '', agentNotes: '' });
                                  setShowStatusModal(true);
                                }}
                              >
                                Update
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Agent Profile</CardTitle>
                <CardDescription>Your account information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Name</Label>
                      <p className="font-medium">{profile.name}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Email</Label>
                      <p className="font-medium">{profile.email}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Employee ID</Label>
                      <p className="font-medium">{profile.employeeId || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Status</Label>
                      <Badge variant={profile.isAvailable ? 'default' : 'secondary'}>
                        {profile.isAvailable ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Total Completed</Label>
                      <p className="font-medium">{profile.totalCompletedRequests || 0} requests</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Total Processed</Label>
                      <p className="font-medium">₦{parseFloat(profile.totalProcessedAmount || 0).toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={showPickupModal} onOpenChange={setShowPickupModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pickup Request</DialogTitle>
            <DialogDescription>
              Enter your phone number to receive the airtime transfer
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-muted-foreground">Network</Label>
                  <p className="font-medium">{selectedRequest.network?.toUpperCase()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Customer Phone</Label>
                  <p className="font-medium">{selectedRequest.phoneNumber}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Airtime Amount</Label>
                  <p className="font-medium">₦{parseFloat(selectedRequest.airtimeAmount).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Cash to Pay</Label>
                  <p className="font-medium text-green-600">₦{parseFloat(selectedRequest.cashAmount).toLocaleString()}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="receivingNumber">Your Receiving Phone Number</Label>
                <Input
                  id="receivingNumber"
                  placeholder="e.g., 08012345678"
                  value={pickupForm.receivingNumber}
                  onChange={(e) => setPickupForm({ receivingNumber: e.target.value })}
                />
                <p className="text-sm text-muted-foreground">
                  The customer will send airtime to this number
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPickupModal(false)}>Cancel</Button>
            <Button onClick={handlePickup} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirm Pickup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showStatusModal} onOpenChange={setShowStatusModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Request Status</DialogTitle>
            <DialogDescription>
              Update the status of this conversion request
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Tracking ID</p>
                <p className="font-mono font-medium">{selectedRequest.trackingId}</p>
                <p className="text-sm text-muted-foreground mt-2">Current Status</p>
                <Badge className={STATUS_LABELS[selectedRequest.status]?.color}>
                  {STATUS_LABELS[selectedRequest.status]?.label}
                </Badge>
              </div>
              <div className="space-y-2">
                <Label>New Status</Label>
                <Select value={statusForm.status} onValueChange={(v) => setStatusForm({ ...statusForm, status: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    {getNextStatuses(selectedRequest.status).map((status) => (
                      <SelectItem key={status} value={status}>
                        {STATUS_LABELS[status]?.label || status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Textarea
                  placeholder="Add any notes about this update"
                  value={statusForm.agentNotes}
                  onChange={(e) => setStatusForm({ ...statusForm, agentNotes: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusModal(false)}>Cancel</Button>
            <Button onClick={handleStatusUpdate} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
