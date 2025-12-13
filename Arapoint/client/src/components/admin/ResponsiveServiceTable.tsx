import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Edit2, Trash2 } from "lucide-react";

interface Column {
  key: string;
  label: string;
  hideOnMobile?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
}

interface ResponsiveServiceTableProps {
  data: any[];
  columns: Column[];
  onView?: (item: any) => void;
  onEdit?: (item: any) => void;
  onDelete?: (item: any) => void;
  emptyMessage?: string;
  mobileCardRender?: (item: any) => React.ReactNode;
}

const getStatusColor = (status: string) => {
  switch(status?.toLowerCase()) {
    case 'completed': return 'bg-green-100 text-green-700';
    case 'active': return 'bg-green-100 text-green-700';
    case 'verified': return 'bg-green-100 text-green-700';
    case 'pending': return 'bg-yellow-100 text-yellow-700';
    case 'processing': return 'bg-blue-100 text-blue-700';
    case 'rejected': return 'bg-red-100 text-red-700';
    case 'failed': return 'bg-red-100 text-red-700';
    case 'inactive': return 'bg-gray-100 text-gray-700';
    case 'suspended': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

export function ResponsiveServiceTable({
  data,
  columns,
  onView,
  onEdit,
  onDelete,
  emptyMessage = "No data found",
  mobileCardRender,
}: ResponsiveServiceTableProps) {
  const hasActions = onView || onEdit || onDelete;

  const defaultMobileRender = (item: any) => {
    const primaryCol = columns[0];
    const secondaryCol = columns[1];
    const statusCol = columns.find(c => c.key === 'status');
    const amountCol = columns.find(c => c.key === 'amount');
    const dateCol = columns.find(c => c.key === 'date' || c.key === 'createdAt');
    const detailCols = columns.filter(c => 
      c.key !== primaryCol?.key && 
      c.key !== secondaryCol?.key && 
      c.key !== 'status' && 
      c.key !== 'amount' && 
      c.key !== 'date' && 
      c.key !== 'createdAt'
    );

    return (
      <Card key={item.id} className="overflow-hidden">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-sm truncate">
                {primaryCol?.render ? primaryCol.render(item[primaryCol.key], item) : item[primaryCol?.key]}
              </h3>
              {secondaryCol && (
                <p className="text-xs text-muted-foreground truncate">
                  {secondaryCol.render ? secondaryCol.render(item[secondaryCol.key], item) : item[secondaryCol.key]}
                </p>
              )}
            </div>
            {statusCol && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 ${getStatusColor(item.status)}`}>
                {item.status}
              </span>
            )}
          </div>
          
          {detailCols.length > 0 && (
            <div className="grid grid-cols-2 gap-1 text-xs mb-2">
              {detailCols.slice(0, 4).map((col) => (
                <div key={col.key} className="text-muted-foreground truncate">
                  <span className="opacity-70">{col.label}: </span>
                  {col.render ? col.render(item[col.key], item) : item[col.key]}
                </div>
              ))}
            </div>
          )}
          
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-3">
            {amountCol && (
              <span className="font-semibold text-green-600">₦{item.amount?.toLocaleString()}</span>
            )}
            {dateCol && (
              <span>{new Date(item[dateCol.key]).toLocaleDateString()}</span>
            )}
          </div>
          
          {hasActions && (
            <div className="flex gap-2 pt-2 border-t">
              {onView && (
                <Button size="sm" variant="outline" className="flex-1 h-7 text-xs" onClick={() => onView(item)}>
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Button>
              )}
              {onEdit && (
                <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => onEdit(item)}>
                  <Edit2 className="h-3 w-3" />
                </Button>
              )}
              {onDelete && (
                <Button size="sm" variant="destructive" className="h-7 px-2 text-xs" onClick={() => onDelete(item)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <>
      <div className="hidden lg:block rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              {columns.map((col) => (
                <th key={col.key} className="p-3 text-left font-medium whitespace-nowrap">
                  {col.label}
                </th>
              ))}
              {hasActions && <th className="p-3 text-right font-medium">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => (
              <tr key={item.id || idx} className="border-b">
                {columns.map((col) => (
                  <td key={col.key} className="p-3">
                    {col.render ? col.render(item[col.key], item) : (
                      col.key === 'status' ? (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item[col.key])}`}>
                          {item[col.key]}
                        </span>
                      ) : col.key === 'amount' ? (
                        <span className="font-semibold text-green-600">₦{item[col.key]?.toLocaleString()}</span>
                      ) : col.key === 'date' || col.key === 'createdAt' ? (
                        <span className="text-muted-foreground">{new Date(item[col.key]).toLocaleDateString()}</span>
                      ) : (
                        <span className="text-muted-foreground">{item[col.key]}</span>
                      )
                    )}
                  </td>
                ))}
                {hasActions && (
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1">
                      {onView && (
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => onView(item)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      {onEdit && (
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => onEdit(item)}>
                          <Edit2 className="h-4 w-4 text-blue-600" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => onDelete(item)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="lg:hidden space-y-3 px-4 pb-4">
        {data.map((item) => mobileCardRender ? mobileCardRender(item) : defaultMobileRender(item))}
      </div>
    </>
  );
}

export function ResponsiveTabs({ 
  tabs, 
  activeTab, 
  onTabChange 
}: { 
  tabs: { id: string; label: string; count?: number }[]; 
  activeTab: string; 
  onTabChange: (id: string) => void;
}) {
  return (
    <div className="w-full overflow-x-auto scrollbar-hide">
      <div className="flex gap-1 p-1 bg-muted rounded-lg min-w-max">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md whitespace-nowrap transition-colors touch-manipulation ${
              activeTab === tab.id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-1 text-[10px] sm:text-xs opacity-70">({tab.count})</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
