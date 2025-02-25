
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { FacilityFee, FacilityCodeType } from "@/types/lifecare";

interface FacilityFeesFormProps {
  fees: FacilityFee[];
  onAddFee: (fee: FacilityFee) => void;
  onRemoveFee: (index: number) => void;
}

export function FacilityFeesForm({
  fees,
  onAddFee,
  onRemoveFee
}: FacilityFeesFormProps) {
  const [currentFee, setCurrentFee] = useState<FacilityFee>({
    codeType: 'DRG',
    code: "",
    feeSource: "",
    fee: 0
  });

  const handleAdd = () => {
    if (currentFee.code && currentFee.feeSource && fees.length < 3) {
      onAddFee(currentFee);
      setCurrentFee({ codeType: 'DRG', code: "", feeSource: "", fee: 0 });
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Facility Fees</h3>
      <div className="grid grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label>Code Type</Label>
          <Select
            value={currentFee.codeType}
            onValueChange={(value: FacilityCodeType) => 
              setCurrentFee(prev => ({ ...prev, codeType: value }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DRG">DRG</SelectItem>
              <SelectItem value="APC">APC</SelectItem>
              <SelectItem value="Outpatient">Outpatient</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Code</Label>
          <Input
            value={currentFee.code}
            onChange={(e) => setCurrentFee(prev => ({ ...prev, code: e.target.value }))}
            placeholder="Enter code"
          />
        </div>
        <div className="space-y-2">
          <Label>Fee Source</Label>
          <Input
            value={currentFee.feeSource}
            onChange={(e) => setCurrentFee(prev => ({ ...prev, feeSource: e.target.value }))}
            placeholder="Enter fee source"
          />
        </div>
        <div className="space-y-2">
          <Label>Fee</Label>
          <Input
            type="number"
            value={currentFee.fee}
            onChange={(e) => setCurrentFee(prev => ({ ...prev, fee: Number(e.target.value) }))}
            placeholder="Enter fee amount"
          />
        </div>
      </div>

      <Button 
        onClick={handleAdd}
        disabled={fees.length >= 3}
        className="w-full"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Facility Fee
      </Button>

      <div className="space-y-2">
        {fees.map((fee, index) => (
          <div key={index} className="flex items-center justify-between p-2 border rounded">
            <div>
              <span className="font-medium">{fee.codeType}</span>
              <span className="mx-2">-</span>
              <span>{fee.code}</span>
              <span className="mx-2">-</span>
              <span>{fee.feeSource}</span>
              <span className="ml-2">${fee.fee}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemoveFee(index)}
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
