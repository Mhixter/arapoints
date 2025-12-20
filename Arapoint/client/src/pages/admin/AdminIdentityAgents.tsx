import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { IdCard, Loader2, UserPlus, Edit, Trash2, Users, FileText, RefreshCw, CheckCircle, Clock, XCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

const getAdminToken = () => localStorage.getItem('accessToken');

const SERVICE_LABELS: Record<string, string> = {
  'nin_validation': 'NIN Validation',
  'ipe_clearance': 'IPE Clearance',
  'nin_personalization': 'NIN Personalization',
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-gray-100 text-gray-700' },
  pickup: { label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700' },
};

export default function AdminIdentityAgents() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [agents, setAgents] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<any>(null);
  const [agentForm, setAgentForm] = useState({ userId: '', specializations: '' });
  const [users, setUsers] = useState<any[]>([]);
  const [searchUser, setSearchUser] = useState('');

  useEffect(() => {
    fetchAgents();
    fetchRequests();
  }, []);

  const fetchAgents = async () => {
    try {
      const token = getAdminToken();
      const response = await fetch('/api/admin/identity-agents', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.status === 'success') {
        setAgents(data.data.agents || []);
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    }
  };

  const fetchRequests = async () => {
    try {
      const token = getAdminToken();
      const response = await fetch('/api/admin/identity-requests?limit=50', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.status === 'success') {
        setRequests(data.data.requests || []);
      }
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    }
  };

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setUsers([]);
      return;
    }
    try {
      const token = getAdminToken();
      const response = await fetch(`/api/admin/users/search?q=${encodeURIComponent(query)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.status === 'success') {
        setUsers(data.data.users || []);
      }
    } catch (error) {
      console.error('Failed to search users:', error);
    }
  };

  const handleCreateAgent = async () => {
    if (!agentForm.userId) {
      toast({ title: "Error", description: "Please select a user", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const token = getAdminToken();
      const response = await fetch('/api/admin/identity-agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(agentForm)
      });
      const data = await response.json();
      if (data.status === 'success') {
        toast({ title: "Success", description: "Identity agent created successfully" });
        setShowAgentModal(false);
        setAgentForm({ userId: '', specializations: '' });
        setSearchUser('');
        setUsers([]);
        fetchAgents();
      } else {
        toast({ title: "Error", description: data.message, variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to create agent", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAgent = async (agentId: string, isActive: boolean) => {
    try {
      const token = getAdminToken();
      const response = await fetch(`/api/admin/identity-agents/${agentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ isActive: !isActive })
      });
      const data = await response.json();
      if (data.status === 'success') {
        toast({ title: "Success", description: `Agent ${!isActive ? 'activated' : 'deactivated'}` });
        fetchAgents();
      } else {
        toast({ title: "Error", description: data.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update agent", variant: "destructive" });
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm('Are you sure you want to delete this agent?')) return;
    try {
      const token = getAdminToken();
      const response = await fetch(`/api/admin/identity-agents/${agentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.status === 'success') {
        toast({ title: "Success", description: "Agent deleted" });
        fetchAgents();
      } else {
        toast({ title: "Error", description: data.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete agent", variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    const info = STATUS_LABELS[status] || { label: status, color: 'bg-gray-100 text-gray-700' };
    return <Badge className={info.color}>{info.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Identity Agent Management</h2>
          <p className="text-muted-foreground">Manage agents for manual identity services (NIN Validation, IPE Clearance, Personalization)</p>
        </div>
      </div>

      <Tabs defaultValue="agents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="agents" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Agents
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Requests
          </TabsTrigger>
        </TabsList>

        <TabsContent value="agents">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Identity Agents</CardTitle>
                  <CardDescription>Users authorized to process manual identity service requests</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={fetchAgents}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button onClick={() => { setEditingAgent(null); setAgentForm({ userId: '', specializations: '' }); setShowAgentModal(true); }}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Agent
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {agents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <IdCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No identity agents yet</p>
                  <p className="text-sm">Create an agent to start processing manual identity requests</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Specializations</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agents.map((agent) => (
                      <TableRow key={agent.id}>
                        <TableCell className="font-medium">{agent.userName || 'Unknown'}</TableCell>
                        <TableCell>{agent.userEmail}</TableCell>
                        <TableCell>{agent.specializations || 'All services'}</TableCell>
                        <TableCell>
                          <Badge className={agent.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                            {agent.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(agent.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleAgent(agent.id, agent.isActive)}
                            >
                              {agent.isActive ? 'Deactivate' : 'Activate'}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteAgent(agent.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Service Requests</CardTitle>
                  <CardDescription>All manual identity service requests</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={fetchRequests}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {requests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No requests yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tracking ID</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Fee</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((req) => (
                      <TableRow key={req.id}>
                        <TableCell className="font-medium">{req.trackingId}</TableCell>
                        <TableCell>{SERVICE_LABELS[req.serviceType] || req.serviceType}</TableCell>
                        <TableCell>{req.userName || 'Unknown'}</TableCell>
                        <TableCell>{getStatusBadge(req.status)}</TableCell>
                        <TableCell>₦{parseFloat(req.fee || 0).toLocaleString()}</TableCell>
                        <TableCell>{new Date(req.createdAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showAgentModal} onOpenChange={setShowAgentModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Identity Agent</DialogTitle>
            <DialogDescription>
              Select a registered user to grant identity agent access
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Search User</Label>
              <Input
                value={searchUser}
                onChange={(e) => {
                  setSearchUser(e.target.value);
                  searchUsers(e.target.value);
                }}
                placeholder="Search by email or name..."
              />
              {users.length > 0 && (
                <div className="mt-2 border rounded-md max-h-40 overflow-y-auto">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className={`p-2 hover:bg-muted cursor-pointer ${agentForm.userId === user.id ? 'bg-primary/10' : ''}`}
                      onClick={() => {
                        setAgentForm(prev => ({ ...prev, userId: user.id }));
                        setSearchUser(user.email);
                        setUsers([]);
                      }}
                    >
                      <p className="font-medium text-sm">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <Label>Specializations (optional)</Label>
              <Input
                value={agentForm.specializations}
                onChange={(e) => setAgentForm(prev => ({ ...prev, specializations: e.target.value }))}
                placeholder="e.g., nin_validation, ipe_clearance"
              />
              <p className="text-xs text-muted-foreground mt-1">Leave empty for all services</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAgentModal(false)}>Cancel</Button>
            <Button onClick={handleCreateAgent} disabled={loading || !agentForm.userId}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Agent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
