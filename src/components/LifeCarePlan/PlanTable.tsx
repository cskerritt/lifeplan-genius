import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CareItem, CategoryTotal } from "@/types/lifecare";

interface PlanTableProps {
  items: CareItem[];
  categoryTotals: CategoryTotal[];
  grandTotal: number;
}

const PlanTable = ({ items, categoryTotals, grandTotal }: PlanTableProps) => {
  return (
    <div className="space-y-6">
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
            <span>Grand Total:</span>
            <span>${grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanTable;