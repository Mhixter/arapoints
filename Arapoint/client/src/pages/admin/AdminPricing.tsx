import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Edit, Save, X, DollarSign, TrendingUp, Layers, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ServicePrice {
  id: string;
  service_type: string;
  service_name: string;
  price: number;
  description: string | null;
  is_active: boolean;
  category: string;
}

const MOCK_PRICING: ServicePrice[] = [
  { id: "1", service_type: "nin_verification", service_name: "NIN Verification", price: 150, description: "Verify using 11-digit NIN", is_active: true, category: "Identity" },
  { id: "2", service_type: "nin_phone", service_name: "NIN With Phone", price: 200, description: "Search NIN using Phone Number", is_active: true, category: "Identity" },
  { id: "3", service_type: "nin_recovery", service_name: "Lost NIN Recovery", price: 2500, description: "Recover lost NIN using NIMC tracking ID", is_active: true, category: "Identity" },
  { id: "4", service_type: "validation", service_name: "Validation", price: 1500, description: "General Identity Validation", is_active: true, category: "Identity" },
  { id: "5", service_type: "personalization", service_name: "Personalization", price: 3000, description: "Customize Identity Data", is_active: true, category: "Identity" },
  { id: "6", service_type: "birth_attestation", service_name: "Birth Attestation", price: 5000, description: "NPC Birth Certificate", is_active: true, category: "Identity" },
  { id: "7", service_type: "jamb_result", service_name: "JAMB Result Check", price: 500, description: "Check JAMB UTME/DE results", is_active: true, category: "Education" },
  { id: "8", service_type: "waec_result", service_name: "WAEC Result Check", price: 1000, description: "Check WAEC examination results", is_active: true, category: "Education" },
  { id: "9", service_type: "neco_result", service_name: "NECO Result Check", price: 800, description: "Check NECO examination results", is_active: true, category: "Education" },
  { id: "10", service_type: "nabteb_result", service_name: "NABTEB Result Check", price: 800, description: "Check NABTEB examination results", is_active: true, category: "Education" },
  { id: "11", service_type: "nbais_result", service_name: "NBAIS Result Check", price: 800, description: "Check NBAIS examination results", is_active: true, category: "Education" },
];

export default function AdminPricing() {
  const { toast } = useToast();
  const [pricing, setPricing] = useState<ServicePrice[]>(MOCK_PRICING);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ServicePrice | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const filteredPricing = filter === "all" ? pricing : pricing.filter(p => p.category === filter);
  
  const categories = ["all", ...Array.from(new Set(pricing.map(p => p.category)))];

  const totalServices = pricing.length;
  const activeServices = pricing.filter(p => p.is_active).length;
  const averagePrice = Math.round(pricing.reduce((sum, p) => sum + p.price, 0) / pricing.length);

  const handleEdit = (item: ServicePrice) => {
    setEditingId(item.id);
    setEditForm({ ...item });
  };

  const handleSave = () => {
    if (editForm) {
      setPricing(prev => prev.map(p => p.id === editForm.id ? editForm : p));
      toast({
        title: "Price Updated",
        description: `${editForm.service_name} price has been updated to ₦${editForm.price.toLocaleString()}`,
      });
      setEditingId(null);
      setEditForm(null);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const toggleActive = (id: string) => {
    setPricing(prev => prev.map(p => {
      if (p.id === id) {
        toast({
          title: p.is_active ? "Service Disabled" : "Service Enabled",
          description: `${p.service_name} has been ${p.is_active ? "disabled" : "enabled"}`,
        });
        return { ...p, is_active: !p.is_active };
      }
      return p;
    }));
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-heading font-bold tracking-tight">Pricing Management</h2>
        <p className="text-sm sm:text-base text-muted-foreground">Configure service prices and manage pricing tiers</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-[10px] sm:text-xs lg:text-sm font-medium truncate pr-2">Total Services</CardTitle>
            <Layers className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold">{totalServices}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">Configured services</p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-[10px] sm:text-xs lg:text-sm font-medium truncate pr-2">Active</CardTitle>
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">{activeServices}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">Currently enabled</p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-[10px] sm:text-xs lg:text-sm font-medium truncate pr-2">Avg Price</CardTitle>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">₦{averagePrice.toLocaleString()}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">Across all services</p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-[10px] sm:text-xs lg:text-sm font-medium truncate pr-2">Inactive</CardTitle>
            <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600 flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-600">{totalServices - activeServices}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">Disabled services</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div>
              <CardTitle className="text-base sm:text-lg">Service Pricing</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Manage prices for all platform services</CardDescription>
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {categories.map(cat => (
                <Button
                  key={cat}
                  variant={filter === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(cat)}
                  className="capitalize text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3"
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          <div className="hidden md:block rounded-md border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-3 text-left font-medium">Service</th>
                  <th className="p-3 text-left font-medium">Category</th>
                  <th className="p-3 text-left font-medium">Price</th>
                  <th className="p-3 text-left font-medium">Description</th>
                  <th className="p-3 text-left font-medium">Status</th>
                  <th className="p-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPricing.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="p-3 font-medium">
                      {editingId === item.id ? (
                        <Input
                          value={editForm?.service_name || ""}
                          onChange={(e) => setEditForm(prev => prev ? { ...prev, service_name: e.target.value } : null)}
                          className="w-full h-8"
                        />
                      ) : (
                        item.service_name
                      )}
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className="capitalize text-xs">{item.category}</Badge>
                    </td>
                    <td className="p-3">
                      {editingId === item.id ? (
                        <Input
                          type="number"
                          value={editForm?.price || 0}
                          onChange={(e) => setEditForm(prev => prev ? { ...prev, price: Number(e.target.value) } : null)}
                          className="w-24 h-8"
                        />
                      ) : (
                        <span className="font-semibold text-green-600">₦{item.price.toLocaleString()}</span>
                      )}
                    </td>
                    <td className="p-3 max-w-[200px] truncate text-muted-foreground text-xs">
                      {editingId === item.id ? (
                        <Input
                          value={editForm?.description || ""}
                          onChange={(e) => setEditForm(prev => prev ? { ...prev, description: e.target.value } : null)}
                          className="w-full h-8"
                        />
                      ) : (
                        item.description
                      )}
                    </td>
                    <td className="p-3">
                      <Switch
                        checked={item.is_active}
                        onCheckedChange={() => toggleActive(item.id)}
                      />
                    </td>
                    <td className="p-3 text-right">
                      {editingId === item.id ? (
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={handleCancel} className="h-8 w-8 p-0">
                            <X className="h-4 w-4" />
                          </Button>
                          <Button size="sm" onClick={handleSave} className="h-8 w-8 p-0">
                            <Save className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(item)} className="h-8 w-8 p-0">
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3 px-4 pb-4">
            {filteredPricing.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0 flex-1">
                      {editingId === item.id ? (
                        <Input
                          value={editForm?.service_name || ""}
                          onChange={(e) => setEditForm(prev => prev ? { ...prev, service_name: e.target.value } : null)}
                          className="w-full h-8 text-sm mb-2"
                        />
                      ) : (
                        <h3 className="font-semibold text-sm truncate">{item.service_name}</h3>
                      )}
                      <Badge variant="outline" className="capitalize text-[10px] mt-1">{item.category}</Badge>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {editingId === item.id ? (
                        <>
                          <Button size="sm" variant="ghost" onClick={handleCancel} className="h-7 w-7 p-0">
                            <X className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" onClick={handleSave} className="h-7 w-7 p-0">
                            <Save className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(item)} className="h-7 w-7 p-0">
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                    {editingId === item.id ? (
                      <Input
                        value={editForm?.description || ""}
                        onChange={(e) => setEditForm(prev => prev ? { ...prev, description: e.target.value } : null)}
                        className="w-full h-8 text-xs"
                        placeholder="Description"
                      />
                    ) : (
                      item.description
                    )}
                  </p>
                  
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div>
                      {editingId === item.id ? (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">₦</span>
                          <Input
                            type="number"
                            value={editForm?.price || 0}
                            onChange={(e) => setEditForm(prev => prev ? { ...prev, price: Number(e.target.value) } : null)}
                            className="w-20 h-7 text-sm"
                          />
                        </div>
                      ) : (
                        <span className="font-bold text-green-600 text-base">₦{item.price.toLocaleString()}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">{item.is_active ? "Active" : "Inactive"}</span>
                      <Switch
                        checked={item.is_active}
                        onCheckedChange={() => toggleActive(item.id)}
                        className="scale-90"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
