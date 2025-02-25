
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { CareItem, CategoryTotal } from "@/types/lifecare";
import { exportToWord, exportToExcel } from "@/utils/exportUtils";

interface PlanTableProps {
  items: CareItem[];
  categoryTotals: CategoryTotal[];
  grandTotal: number;
  lifetimeTotal?: number;
  evalueeName?: string;
  planId?: string;
}

const PlanTable = ({ 
  items, 
  categoryTotals, 
  grandTotal, 
  lifetimeTotal = 0,
  evalueeName = "Unknown",
  planId = "unknown"
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
                  <div className="text-sm">
                    <div>Low: ${item.costRange.low.toFixed(2)}</div>
                    <div>Avg: ${item.costRange.average.toFixed(2)}</div>
                    <div>High: ${item.costRange.high.toFixed(2)}</div>
                  </div>
                </TableCell>
                <TableCell>${item.annualCost.toFixed(2)}</TableCell>
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
                  Range: ${total.costRange.low.toFixed(2)} - ${total.costRange.high.toFixed(2)}
                </div>
                <span className="font-semibold">
                  ${total.total.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
          <div className="border-t pt-2 mt-4 flex justify-between text-lg font-bold">
            <span>Annual Total:</span>
            <span>${grandTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-medical-600">
            <span>Lifetime Total:</span>
            <span>${lifetimeTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanTable;
