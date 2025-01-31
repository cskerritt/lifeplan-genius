import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";

export interface CareItem {
  id: string;
  category: string;
  service: string;
  frequency: string;
  costPerUnit: number;
  annualCost: number;
}

const PlanTable = () => {
  const [items, setItems] = useState<CareItem[]>([
    {
      id: "1",
      category: "Medical Care",
      service: "Physical Therapy",
      frequency: "2x per week",
      costPerUnit: 150,
      annualCost: 15600,
    },
    {
      id: "2",
      category: "Equipment",
      service: "Wheelchair Maintenance",
      frequency: "Quarterly",
      costPerUnit: 200,
      annualCost: 800,
    },
  ]);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Category</TableHead>
            <TableHead>Service</TableHead>
            <TableHead>Frequency</TableHead>
            <TableHead>Cost per Unit</TableHead>
            <TableHead>Annual Cost</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.category}</TableCell>
              <TableCell>{item.service}</TableCell>
              <TableCell>{item.frequency}</TableCell>
              <TableCell>${item.costPerUnit.toFixed(2)}</TableCell>
              <TableCell>${item.annualCost.toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default PlanTable;