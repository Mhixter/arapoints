import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IdCard, Loader2, Clock, CheckCircle2, User, LogOut, RefreshCw, Eye, Upload } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileUploader } from "@/components/FileUploader";

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: 'bg-gray-100 text-gray-700' },
  { value: 'pickup', label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
  { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-700' },
];

const SERVICE_LABELS: Record<string, string> = {
  'nin_validation': 'NIN Validation',
  'ipe_clearance': 'IPE Clearance',
  'nin_personalization': 'NIN Personalization',
};

const getToken = () => localStorage.getItem('accessToken');

export default function IdentityAgentDashboard() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [agent, setAgent] = useState<any>(null);
  const [stats, setStats] = useState<any>({ pending: 0, pickup: 0, completed: 0 });
  const [requests, setRequests] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [completeData, setCompleteData] = useState({ slipUrl: '', agentNotes: '' });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLocation('/login');
      return;
    }
    fetchProfile();
    fetchStats();
    fetchRequests();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = getToken();
      const response = await fetch('/api/identity-agent/agent/check', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.status === 'success' && data.data.isAgent) {
        setAgent(data.data.agent);
      } else if (response.status === 401 || response.status === 403 || !data.data?.isAgent) {
        toast({ title: "Access Denied", description: "You don't have identity agent access", variant: "destructive" });
        setLocation('/dashboard');
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const fetchRequestsAndStats = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const url = filter === 'all' ? '/api/identity-agent/agent/requests' : `/api/identity-agent/agent/requests?status=${filter}`;
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.status === 'success') {
        setRequests(data.data.requests || []);
        if (data.data.stats) {
          setStats(data.data.stats);
        }
      }
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = () => {};

  const fetchRequests = fetchRequestsAndStats;

  const handlePickup = async (requestId: string) => {
    try {
      const token = getToken();
      const response = await fetch(`/api/identity-agent/agent/request/${requestId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: 'pickup' })
      });
      const data = await response.json();
      if (data.status === 'success') {
        toast({ title: "Picked up!", description: "Request assigned to you." });
        fetchRequests();
      } else {
        toast({ title: "Failed", description: data.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to pickup request", variant: "destructive" });
    }
  };

  const handleComplete = async () => {
    if (!completeData.slipUrl) {
      toast({ title: "Missing slip", description: "Please upload the completed slip", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const token = getToken();
      const response = await fetch(`/api/identity-agent/agent/request/${selectedRequest.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: 'completed', slipUrl: completeData.slipUrl, agentNotes: completeData.agentNotes })
      });
      const data = await response.json();
      if (data.status === 'success') {
        toast({ title: "Completed!", description: "Request marked as completed." });
        setShowComplete(false);
        setCompleteData({ slipUrl: '', agentNotes: '' });
        fetchRequests();
      } else {
        toast({ title: "Failed", description: data.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to complete request", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    setLocation('/login');
  };

  const getStatusBadge = (status: string) => {
    const option = STATUS_OPTIONS.find(o => o.value === status);
    return option ? (
      <Badge className={option.color}>{option.label}</Badge>
    ) : (
      <Badge>{status}</Badge>
    );
  };

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <IdCard className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-xl font-bold">Identity Agent Dashboard</h1>
            <p className="text-sm text-gray-500">{agent?.fullName || 'Agent'}</p>
          </div>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </header>

      <main className="p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-gray-500" />
                <span className="text-2xl font-bold">{stats.pending}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-500">In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-500" />
                <span className="text-2xl font-bold">{stats.pickup}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-500">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-2xl font-bold">{stats.completed}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Service Requests</CardTitle>
              <div className="flex items-center gap-2">
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Requests</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="pickup">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={fetchRequests}>
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No requests found
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map((req) => (
                  <div key={req.id} className="border rounded-lg p-4 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{req.trackingId}</span>
                        {getStatusBadge(req.status)}
                      </div>
                      <p className="text-sm text-gray-500">{SERVICE_LABELS[req.serviceType] || req.serviceType}</p>
                      <p className="text-xs text-gray-400">NIN: {req.nin || 'N/A'}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => { setSelectedRequest(req); setShowDetails(true); }}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      {req.status === 'pending' && (
                        <Button size="sm" onClick={() => handlePickup(req.id)}>
                          Pickup
                        </Button>
                      )}
                      {req.status === 'pickup' && (
                        <Button size="sm" variant="default" onClick={() => { setSelectedRequest(req); setShowComplete(true); }}>
                          <Upload className="h-4 w-4 mr-1" />
                          Complete
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
            <DialogDescription>{selectedRequest?.trackingId}</DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-gray-500">Service Type</Label>
                  <p className="font-medium">{SERVICE_LABELS[selectedRequest.serviceType]}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Status</Label>
                  <p>{getStatusBadge(selectedRequest.status)}</p>
                </div>
                <div>
                  <Label className="text-gray-500">NIN</Label>
                  <p className="font-medium">{selectedRequest.nin || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Fee</Label>
                  <p className="font-medium">₦{parseFloat(selectedRequest.fee || 0).toLocaleString()}</p>
                </div>
                {selectedRequest.newTrackingId && (
                  <div className="col-span-2">
                    <Label className="text-gray-500">New Tracking ID</Label>
                    <p className="font-medium">{selectedRequest.newTrackingId}</p>
                  </div>
                )}
                {selectedRequest.customerNotes && (
                  <div className="col-span-2">
                    <Label className="text-gray-500">Customer Notes</Label>
                    <p className="text-sm">{selectedRequest.customerNotes}</p>
                  </div>
                )}
                {selectedRequest.updateFields && (
                  <div className="col-span-2">
                    <Label className="text-gray-500">Update Fields</Label>
                    <p className="text-sm">{selectedRequest.updateFields}</p>
                  </div>
                )}
                {selectedRequest.slipUrl && (
                  <div className="col-span-2">
                    <Label className="text-gray-500">Completed Slip</Label>
                    <a href={selectedRequest.slipUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline text-sm">
                      View Slip
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetails(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showComplete} onOpenChange={setShowComplete}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Complete Request</DialogTitle>
            <DialogDescription>Upload the completed slip for {selectedRequest?.trackingId}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Completed Slip *</Label>
              <FileUploader
                onFileUploaded={(objectPath: string) => setCompleteData(prev => ({ ...prev, slipUrl: objectPath }))}
                accept="application/pdf,image/*"
                label="Upload Slip"
                getUploadUrl={async () => {
                  const token = getToken();
                  const response = await fetch('/api/upload/get-url', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ prefix: 'identity-slips' })
                  });
                  return response.json();
                }}
              />
              {completeData.slipUrl && (
                <p className="text-sm text-green-600 mt-1">Slip uploaded successfully</p>
              )}
            </div>
            <div>
              <Label>Agent Notes (optional)</Label>
              <Textarea
                value={completeData.agentNotes}
                onChange={(e) => setCompleteData(prev => ({ ...prev, agentNotes: e.target.value }))}
                placeholder="Any notes about the completion..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowComplete(false)}>Cancel</Button>
            <Button onClick={handleComplete} disabled={uploading}>
              {uploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Mark Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
