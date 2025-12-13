import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MOCK_VTU_SERVICES, VTUService } from "@/lib/mockData";
import { ArrowLeft, CheckCircle, XCircle, Plus, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { downloadCSV } from "@/lib/downloadUtils";
import { ResponsiveServiceTable, ResponsiveTabs } from "@/components/admin/ResponsiveServiceTable";

export default function AdminVTUServices() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [services, setServices] = useState(MOCK_VTU_SERVICES);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<VTUService | null>(null);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [formData, setFormData] = useState<Partial<VTUService>>({});
  const [activeTab, setActiveTab] = useState("airtime");

  const handleUpdateStatus = (id: string, status: "completed" | "failed") => {
    setServices(services.map(s => s.id === id ? { ...s, status } : s));
    setSelectedRequest(null);
    toast({ title: "Status Updated", description: `Service marked as ${status}.` });
  };

  const handleDelete = (item: any) => {
    if (window.confirm("Delete this record?")) {
      setServices(services.filter(s => s.id !== item.id));
      toast({ title: "Deleted", description: "VTU service record deleted." });
    }
  };

  const handleCreateService = () => {
    if (!formData.userName || !formData.provider || !formData.serviceType || !formData.amount) {
      toast({ title: "Missing Fields", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }
    const newService: VTUService = {
      id: `vtu_${Date.now()}`,
      userId: `usr_${Date.now()}`,
      userName: formData.userName || "",
      serviceType: formData.serviceType as any,
      provider: formData.provider || "",
      amount: formData.amount || 0,
      status: "pending",
      date: new Date().toISOString(),
      isVerified: false,
    };
    setServices([...services, newService]);
    setOpenCreateDialog(false);
    setFormData({});
    toast({ title: "Created", description: "New VTU service record created." });
  };

  const handleEditService = () => {
    setServices(services.map(s => s.id === selectedRequest?.id ? { ...s, ...formData } : s));
    setOpenEditDialog(false);
    setSelectedRequest(null);
    setFormData({});
    toast({ title: "Updated", description: "VTU service record updated." });
  };

  const filteredServices = services.filter(s => 
    (statusFilter === "all" || s.status === statusFilter) &&
    (searchTerm === "" || s.userName.toLowerCase().includes(searchTerm.toLowerCase()) || s.provider.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const airtimeRequests = filteredServices.filter(s => s.serviceType === "airtime");
  const dataRequests = filteredServices.filter(s => s.serviceType === "data");
  const electricityRequests = filteredServices.filter(s => s.serviceType === "electricity");
  const cableRequests = filteredServices.filter(s => s.serviceType === "cable");

  const tabs = [
    { id: "airtime", label: "Airtime", count: airtimeRequests.length },
    { id: "data", label: "Data", count: dataRequests.length },
    { id: "electricity", label: "Electricity", count: electricityRequests.length },
    { id: "cable", label: "Cable TV", count: cableRequests.length },
  ];

  const getCurrentData = () => {
    switch(activeTab) {
      case "airtime": return airtimeRequests;
      case "data": return dataRequests;
      case "electricity": return electricityRequests;
      case "cable": return cableRequests;
      default: return airtimeRequests;
    }
  };

  const columns = [
    { key: "id", label: "Request ID", render: (v: string) => <span className="font-mono text-xs">{v}</span> },
    { key: "userName", label: "User", render: (v: string) => <span className="font-medium">{v}</span> },
    { key: "provider", label: "Provider" },
    { key: "amount", label: "Amount" },
    { key: "status", label: "Status" },
    { key: "isVerified", label: "Verified", render: (v: boolean) => (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${v ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
        {v ? "Verified" : "Pending"}
      </span>
    )},
    { key: "date", label: "Date" },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-heading font-bold tracking-tight">VTU Services</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Manage Airtime, Data, Electricity, Cable TV</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/admin")} size="sm" className="w-fit h-8 sm:h-9 text-xs sm:text-sm">
          <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
          Back
        </Button>
      </div>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base sm:text-lg">Filter & Search</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Find requests by user, provider, or status</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => downloadCSV(filteredServices, "vtu-services")}>
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  CSV
                </Button>
                <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="h-8 text-xs">
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      Create
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[95vw] sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-base sm:text-lg">Create VTU Service</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-4">
                      <div>
                        <Label className="text-xs sm:text-sm">User Name</Label>
                        <Input className="h-8 sm:h-9 text-sm mt-1" placeholder="Enter user name" value={formData.userName || ""} onChange={(e) => setFormData({...formData, userName: e.target.value})} />
                      </div>
                      <div>
                        <Label className="text-xs sm:text-sm">Service Type</Label>
                        <Select value={formData.serviceType || ""} onValueChange={(val) => setFormData({...formData, serviceType: val as any})}>
                          <SelectTrigger className="h-8 sm:h-9 text-sm mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="airtime">Airtime</SelectItem>
                            <SelectItem value="data">Data</SelectItem>
                            <SelectItem value="electricity">Electricity</SelectItem>
                            <SelectItem value="cable">Cable TV</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs sm:text-sm">Provider</Label>
                        <Input className="h-8 sm:h-9 text-sm mt-1" placeholder="e.g., MTN, Airtel" value={formData.provider || ""} onChange={(e) => setFormData({...formData, provider: e.target.value})} />
                      </div>
                      <div>
                        <Label className="text-xs sm:text-sm">Amount (₦)</Label>
                        <Input className="h-8 sm:h-9 text-sm mt-1" type="number" placeholder="0" value={formData.amount || ""} onChange={(e) => setFormData({...formData, amount: parseInt(e.target.value)})} />
                      </div>
                    </div>
                    <DialogFooter className="gap-2">
                      <Button variant="outline" size="sm" onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
                      <Button size="sm" onClick={handleCreateService}>Create</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <Input 
                placeholder="Search by name or provider..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 h-8 sm:h-9 text-sm"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-32 h-8 sm:h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      <ResponsiveTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">
            {tabs.find(t => t.id === activeTab)?.label} Requests
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {getCurrentData().length} requests found
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          <ResponsiveServiceTable
            data={getCurrentData()}
            columns={columns}
            onView={(item) => setSelectedRequest(item)}
            onEdit={(item) => { setSelectedRequest(item); setFormData(item); setOpenEditDialog(true); }}
            onDelete={handleDelete}
            emptyMessage="No requests found"
          />
        </CardContent>
      </Card>

      <Dialog open={!!selectedRequest && !openEditDialog} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Request Details</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Request ID</p>
                  <p className="font-mono font-bold text-xs sm:text-sm mt-1">{selectedRequest.id}</p>
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">User</p>
                  <p className="font-bold text-xs sm:text-sm mt-1">{selectedRequest.userName}</p>
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Provider</p>
                  <p className="text-xs sm:text-sm mt-1">{selectedRequest.provider}</p>
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Amount</p>
                  <p className="font-bold text-green-600 text-xs sm:text-sm mt-1">₦{selectedRequest.amount?.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            {selectedRequest?.status === "pending" && (
              <>
                <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(selectedRequest.id, "failed")}>
                  <XCircle className="h-3.5 w-3.5 mr-1.5" />
                  Mark Failed
                </Button>
                <Button size="sm" onClick={() => handleUpdateStatus(selectedRequest.id, "completed")}>
                  <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                  Approve
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Edit Service</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div>
              <Label className="text-xs sm:text-sm">User Name</Label>
              <Input className="h-8 sm:h-9 text-sm mt-1" value={formData.userName || ""} onChange={(e) => setFormData({...formData, userName: e.target.value})} />
            </div>
            <div>
              <Label className="text-xs sm:text-sm">Amount (₦)</Label>
              <Input className="h-8 sm:h-9 text-sm mt-1" type="number" value={formData.amount || ""} onChange={(e) => setFormData({...formData, amount: parseInt(e.target.value)})} />
            </div>
            <div>
              <Label className="text-xs sm:text-sm">Status</Label>
              <Select value={formData.status || ""} onValueChange={(val) => setFormData({...formData, status: val as any})}>
                <SelectTrigger className="h-8 sm:h-9 text-sm mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpenEditDialog(false)}>Cancel</Button>
            <Button size="sm" onClick={handleEditService}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
