import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, Shield, ShieldCheck, ShieldAlert, Eye, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AdminRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  is_active: boolean;
  user_count: number;
}

const ALL_PERMISSIONS = [
  { key: "users", label: "User Management", description: "View and manage user accounts" },
  { key: "identity", label: "Identity Services", description: "Manage identity verification requests" },
  { key: "bvn", label: "BVN Services", description: "Manage BVN retrieval and modification" },
  { key: "education", label: "Education Services", description: "Manage exam result checks" },
  { key: "vtu", label: "VTU Services", description: "Manage airtime, data, and bills" },
  { key: "pricing", label: "Pricing Management", description: "Edit service prices" },
  { key: "analytics", label: "Analytics", description: "View platform statistics" },
  { key: "settings", label: "Settings", description: "Configure platform settings" },
  { key: "roles", label: "Role Management", description: "Manage admin roles and permissions" },
];

const MOCK_ROLES: AdminRole[] = [
  { 
    id: "1", 
    name: "super_admin", 
    description: "Full access to all system features", 
    permissions: ALL_PERMISSIONS.map(p => p.key),
    is_active: true,
    user_count: 1
  },
  { 
    id: "2", 
    name: "admin", 
    description: "Standard admin access", 
    permissions: ["users", "identity", "bvn", "education", "vtu", "analytics"],
    is_active: true,
    user_count: 3
  },
  { 
    id: "3", 
    name: "operator", 
    description: "Limited access for service operations", 
    permissions: ["identity", "bvn", "education", "vtu"],
    is_active: true,
    user_count: 5
  },
  { 
    id: "4", 
    name: "viewer", 
    description: "Read-only access", 
    permissions: ["analytics"],
    is_active: true,
    user_count: 2
  },
];

export default function AdminRoles() {
  const { toast } = useToast();
  const [roles, setRoles] = useState<AdminRole[]>(MOCK_ROLES);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<AdminRole | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    permissions: [] as string[],
  });

  const getRoleIcon = (name: string) => {
    switch (name) {
      case "super_admin":
        return <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />;
      case "admin":
        return <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />;
      case "operator":
        return <ShieldAlert className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />;
      default:
        return <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />;
    }
  };

  const getRoleBadgeColor = (name: string) => {
    switch (name) {
      case "super_admin":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "admin":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "operator":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const togglePermission = (key: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(key)
        ? prev.permissions.filter(p => p !== key)
        : [...prev.permissions, key]
    }));
  };

  const handleCreate = () => {
    if (!formData.name.trim()) {
      toast({ title: "Error", description: "Role name is required", variant: "destructive" });
      return;
    }

    const newRole: AdminRole = {
      id: String(Date.now()),
      name: formData.name.toLowerCase().replace(/\s+/g, "_"),
      description: formData.description,
      permissions: formData.permissions,
      is_active: true,
      user_count: 0,
    };

    setRoles(prev => [...prev, newRole]);
    setFormData({ name: "", description: "", permissions: [] });
    setIsCreateOpen(false);
    toast({ title: "Role Created", description: `${newRole.name} has been created successfully` });
  };

  const handleEdit = (role: AdminRole) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description,
      permissions: [...role.permissions],
    });
  };

  const handleUpdate = () => {
    if (!editingRole) return;

    setRoles(prev => prev.map(r => 
      r.id === editingRole.id 
        ? { ...r, name: formData.name, description: formData.description, permissions: formData.permissions }
        : r
    ));
    setEditingRole(null);
    setFormData({ name: "", description: "", permissions: [] });
    toast({ title: "Role Updated", description: "Role has been updated successfully" });
  };

  const handleDelete = (id: string) => {
    const role = roles.find(r => r.id === id);
    if (role?.name === "super_admin") {
      toast({ title: "Error", description: "Cannot delete super admin role", variant: "destructive" });
      return;
    }

    setRoles(prev => prev.filter(r => r.id !== id));
    toast({ title: "Role Deleted", description: "Role has been deleted" });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-heading font-bold tracking-tight">Role Management</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Configure admin roles and their permissions</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-8 sm:h-9 text-xs sm:text-sm">
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              Create Role
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">Create New Role</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">Define a new admin role with specific permissions</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 sm:space-y-6 py-3 sm:py-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="role-name" className="text-xs sm:text-sm">Role Name</Label>
                <Input
                  id="role-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., content_manager"
                  className="h-8 sm:h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="role-desc" className="text-xs sm:text-sm">Description</Label>
                <Textarea
                  id="role-desc"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this role can do..."
                  className="text-sm min-h-[60px] sm:min-h-[80px]"
                />
              </div>
              <div className="space-y-2 sm:space-y-3">
                <Label className="text-xs sm:text-sm">Permissions</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  {ALL_PERMISSIONS.map((perm) => (
                    <div
                      key={perm.key}
                      className={`flex items-start space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg border transition-colors cursor-pointer touch-manipulation ${
                        formData.permissions.includes(perm.key)
                          ? "bg-primary/10 border-primary"
                          : "hover:bg-muted/50 active:bg-muted"
                      }`}
                      onClick={() => togglePermission(perm.key)}
                    >
                      <Checkbox
                        checked={formData.permissions.includes(perm.key)}
                        onCheckedChange={() => togglePermission(perm.key)}
                        className="mt-0.5"
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-xs sm:text-sm truncate">{perm.label}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2">{perm.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)} size="sm" className="h-8 sm:h-9">Cancel</Button>
              <Button onClick={handleCreate} size="sm" className="h-8 sm:h-9">Create Role</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {roles.map(role => (
          <Card key={role.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
              <div className="flex items-center justify-between gap-2">
                {getRoleIcon(role.name)}
                <Badge className={`${getRoleBadgeColor(role.name)} text-[10px] sm:text-xs truncate max-w-[120px]`}>
                  {role.name.replace(/_/g, " ")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0 space-y-3 sm:space-y-4">
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{role.description}</p>
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>{role.user_count} users</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">{role.permissions.length} perms</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {role.permissions.slice(0, 2).map(perm => (
                  <Badge key={perm} variant="outline" className="text-[10px] sm:text-xs">
                    {perm}
                  </Badge>
                ))}
                {role.permissions.length > 2 && (
                  <Badge variant="outline" className="text-[10px] sm:text-xs">
                    +{role.permissions.length - 2}
                  </Badge>
                )}
              </div>
              <div className="flex gap-2 pt-1 sm:pt-2">
                <Button variant="outline" size="sm" className="flex-1 h-7 sm:h-8 text-xs" onClick={() => handleEdit(role)}>
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                {role.name !== "super_admin" && (
                  <Button variant="destructive" size="sm" className="h-7 sm:h-8 px-2 sm:px-3" onClick={() => handleDelete(role.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!editingRole} onOpenChange={(open) => !open && setEditingRole(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Edit Role: {editingRole?.name}</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">Modify role permissions and details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 sm:space-y-6 py-3 sm:py-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="edit-role-name" className="text-xs sm:text-sm">Role Name</Label>
              <Input
                id="edit-role-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                disabled={editingRole?.name === "super_admin"}
                className="h-8 sm:h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="edit-role-desc" className="text-xs sm:text-sm">Description</Label>
              <Textarea
                id="edit-role-desc"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="text-sm min-h-[60px] sm:min-h-[80px]"
              />
            </div>
            <div className="space-y-2 sm:space-y-3">
              <Label className="text-xs sm:text-sm">Permissions</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {ALL_PERMISSIONS.map((perm) => (
                  <div
                    key={perm.key}
                    className={`flex items-start space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg border transition-colors cursor-pointer touch-manipulation ${
                      formData.permissions.includes(perm.key)
                        ? "bg-primary/10 border-primary"
                        : "hover:bg-muted/50 active:bg-muted"
                    }`}
                    onClick={() => editingRole?.name !== "super_admin" && togglePermission(perm.key)}
                  >
                    <Checkbox
                      checked={formData.permissions.includes(perm.key)}
                      onCheckedChange={() => editingRole?.name !== "super_admin" && togglePermission(perm.key)}
                      disabled={editingRole?.name === "super_admin"}
                      className="mt-0.5"
                    />
                    <div className="min-w-0">
                      <p className="font-medium text-xs sm:text-sm truncate">{perm.label}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2">{perm.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setEditingRole(null)} size="sm" className="h-8 sm:h-9">Cancel</Button>
            <Button onClick={handleUpdate} size="sm" className="h-8 sm:h-9">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
