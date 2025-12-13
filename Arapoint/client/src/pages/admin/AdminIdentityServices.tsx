import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, CheckCircle, XCircle, Trash2, Eye, Plus, Edit2, Download } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { downloadCSV } from "@/lib/downloadUtils";
import { ResponsiveServiceTable, ResponsiveTabs } from "@/components/admin/ResponsiveServiceTable";

const IDENTITY_SERVICES_DATA = [
  { id: "id_1", userId: "usr_101", userName: "Ejiro Oluwaseun", serviceType: "nin-verification", nin: "12345678901", status: "pending", date: "2024-05-22T10:00:00", amount: 500 },
  { id: "id_2", userId: "usr_102", userName: "Mfoniso Bassey", serviceType: "nin-phone", nin: "98765432109", phone: "+234 801 234 5678", status: "completed", date: "2024-05-21T14:30:00", amount: 1000 },
  { id: "id_3", userId: "usr_103", userName: "Chibueze Okonkwo", serviceType: "ipe-clearance", nin: "11122233344", tracking: "NIN-REENROL-12345678", status: "pending", date: "2024-05-22T11:15:00", amount: 2500 },
];

export default function AdminIdentityServices() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [services, setServices] = useState(IDENTITY_SERVICES_DATA);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [formData, setFormData] = useState<Partial<any>>({});
  const [activeTab, setActiveTab] = useState("nin");

  const handleUpdateStatus = (id: string, status: "completed" | "rejected") => {
    setServices(services.map(s => s.id === id ? { ...s, status } : s));
    setSelectedRequest(null);
    toast({ title: "Status Updated", description: `Service marked as ${status}.` });
  };

  const handleDelete = (item: any) => {
    if (window.confirm("Delete this record?")) {
      setServices(services.filter(s => s.id !== item.id));
      toast({ title: "Deleted", description: "Record deleted." });
    }
  };

  const handleCreateService = () => {
    if (!formData.userName || !formData.serviceType || !formData.amount) {
      toast({ title: "Missing Fields", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }
    const newService: any = {
      id: `id_${Date.now()}`,
      userId: `usr_${Date.now()}`,
      userName: formData.userName,
      serviceType: formData.serviceType,
      nin: formData.nin || "",
      phone: formData.phone || "",
      tracking: formData.tracking || "",
      status: "pending",
      date: new Date().toISOString(),
      amount: formData.amount,
    };
    setServices([...services, newService]);
    setOpenCreateDialog(false);
    setFormData({});
    toast({ title: "Created", description: "New service record created." });
  };

  const handleEditService = () => {
    setServices(services.map(s => s.id === selectedRequest?.id ? { ...s, ...formData } : s));
    setOpenEditDialog(false);
    setSelectedRequest(null);
    setFormData({});
    toast({ title: "Updated", description: "Service record updated." });
  };

  const filteredServices = services.filter(s => 
    (statusFilter === "all" || s.status === statusFilter) &&
    (searchTerm === "" || s.userName.toLowerCase().includes(searchTerm.toLowerCase()) || s.nin?.includes(searchTerm))
  );

  const ninVerification = filteredServices.filter(s => s.serviceType === "nin-verification");
  const ninPhone = filteredServices.filter(s => s.serviceType === "nin-phone");
  const ipeClearance = filteredServices.filter(s => s.serviceType === "ipe-clearance");

  const tabs = [
    { id: "nin", label: "NIN Verification", count: ninVerification.length },
    { id: "ninphone", label: "NIN with Phone", count: ninPhone.length },
    { id: "ipe", label: "Lost NIN Recovery", count: ipeClearance.length },
  ];

  const getCurrentData = () => {
    switch(activeTab) {
      case "nin": return ninVerification;
      case "ninphone": return ninPhone;
      case "ipe": return ipeClearance;
      default: return ninVerification;
    }
  };

  const columns = [
    { key: "id", label: "Request ID", render: (v: string) => <span className="font-mono text-xs">{v}</span> },
    { key: "userName", label: "User", render: (v: string) => <span className="font-medium">{v}</span> },
    { key: "nin", label: "Details", render: (v: string, row: any) => (
      <span className="text-xs text-muted-foreground">
        {row.nin && `NIN: ${row.nin}`}
        {row.phone && ` | Phone: ${row.phone}`}
      </span>
    )},
    { key: "amount", label: "Amount" },
    { key: "status", label: "Status" },
    { key: "date", label: "Date" },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-heading font-bold tracking-tight">Identity Verification</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Manage NIN, Phone, and Lost NIN Recovery</p>
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
                <CardDescription className="text-xs sm:text-sm">Find requests by user, NIN, or tracking ID</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => downloadCSV(filteredServices, "identity-services")}>
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
                      <DialogTitle className="text-base sm:text-lg">Create New Service</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-4">
                      <div>
                        <Label className="text-xs sm:text-sm">User Name</Label>
                        <Input className="h-8 sm:h-9 text-sm mt-1" placeholder="Enter user name" value={formData.userName || ""} onChange={(e) => setFormData({...formData, userName: e.target.value})} />
                      </div>
                      <div>
                        <Label className="text-xs sm:text-sm">Service Type</Label>
                        <Select value={formData.serviceType || ""} onValueChange={(val) => setFormData({...formData, serviceType: val})}>
                          <SelectTrigger className="h-8 sm:h-9 text-sm mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="nin-verification">NIN Verification</SelectItem>
                            <SelectItem value="nin-phone">NIN with Phone</SelectItem>
                            <SelectItem value="ipe-clearance">Lost NIN Recovery</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs sm:text-sm">NIN</Label>
                        <Input className="h-8 sm:h-9 text-sm mt-1" placeholder="Enter NIN" value={formData.nin || ""} onChange={(e) => setFormData({...formData, nin: e.target.value})} />
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
                placeholder="Search by name or NIN..." 
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
                  <SelectItem value="rejected">Rejected</SelectItem>
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
                  <p className="text-[10px] sm:text-xs text-muted-foreground">NIN</p>
                  <p className="font-mono text-xs sm:text-sm mt-1">{selectedRequest.nin}</p>
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
                <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(selectedRequest.id, "rejected")}>
                  <XCircle className="h-3.5 w-3.5 mr-1.5" />
                  Reject
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
              <Select value={formData.status || ""} onValueChange={(val) => setFormData({...formData, status: val})}>
                <SelectTrigger className="h-8 sm:h-9 text-sm mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
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
