
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileDown, Trash2 } from "lucide-react";
import { CareItem, CategoryTotal } from "@/types/lifecare";
import { exportToWord, exportToExcel } from "@/utils/exportUtils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface PlanTableProps {
  items: CareItem[];
  categoryTotals: CategoryTotal[];
  grandTotal: number;
  lifetimeTotal?: number;
  evalueeName?: string;
  planId?: string;
  onDeleteItem?: (itemId: string) => void;
}

const PlanTable = ({ 
  items, 
  categoryTotals, 
  grandTotal, 
  lifetimeTotal = 0,
  evalueeName = "Unknown",
  planId = "unknown",
  onDeleteItem
}: PlanTableProps) => {
  const handleExport = (format: 'word' | 'excel') => {
    const exportData = {
      planId,
      evalueeName,
      items,
      categoryTotals,
      grandTotal,
      lifetimeTotal
    };

    if (format === 'word') {
      exportToWord(exportData);
    } else {
      exportToExcel(exportData);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatCostRange = (low: number, high: number) => {
    return `${formatCurrency(low)} - ${formatCurrency(high)}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-4 mb-4">
        <Button
          variant="outline"
          onClick={() => handleExport('word')}
          className="flex items-center gap-2"
        >
          <FileDown className="h-4 w-4" />
          Export to Word
        </Button>
        <Button
          variant="outline"
          onClick={() => handleExport('excel')}
          className="flex items-center gap-2"
        >
          <FileDown className="h-4 w-4" />
          Export to Excel
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>CPT/HCPCS Code</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead>Cost Range</TableHead>
              <TableHead>Annual Cost</TableHead>
              {onDeleteItem && <TableHead className="w-[50px]">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="capitalize">{item.category}</TableCell>
                <TableCell>{item.service}</TableCell>
                <TableCell>{item.cptCode}</TableCell>
                <TableCell>{item.frequency}</TableCell>
                <TableCell>
                  {formatCostRange(item.costRange.low, item.costRange.high)}
                </TableCell>
                <TableCell>{formatCurrency(item.annualCost)}</TableCell>
                {onDeleteItem && (
                  <TableCell>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Care Plan Item</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this item? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDeleteItem(item.id)}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            Delete Item
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="rounded-md border p-4 bg-gray-50">
        <h3 className="text-lg font-semibold mb-4">Category Totals</h3>
        <div className="space-y-2">
          {categoryTotals.map((total) => (
            <div key={total.category} className="flex justify-between">
              <span className="capitalize">{total.category}:</span>
              <div className="text-right">
                <div className="text-sm text-gray-600">
                  Range: {formatCostRange(total.costRange.low, total.costRange.high)}
                </div>
                <span className="font-semibold">
                  {formatCurrency(total.total)}
                </span>
              </div>
            </div>
          ))}
          <div className="border-t pt-2 mt-4 flex justify-between text-lg font-bold">
            <span>Annual Total:</span>
            <span>{formatCurrency(grandTotal)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-medical-600">
            <span>Lifetime Total:</span>
            <span>{formatCostRange(grandTotal, lifetimeTotal || 0)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanTable;
