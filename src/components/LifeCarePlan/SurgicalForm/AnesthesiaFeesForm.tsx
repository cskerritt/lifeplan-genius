
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";

interface AnesthesiaFee {
  asaCode: string;
  feeSource: string;
  fee: number;
}

interface AnesthesiaFeesFormProps {
  fees: AnesthesiaFee[];
  onAddFee: (fee: AnesthesiaFee) => void;
  onRemoveFee: (index: number) => void;
}

export function AnesthesiaFeesForm({
  fees,
  onAddFee,
  onRemoveFee
}: AnesthesiaFeesFormProps) {
  const [currentFee, setCurrentFee] = useState<AnesthesiaFee>({
    asaCode: "",
    feeSource: "",
    fee: 0
  });

  const handleAdd = () => {
    if (currentFee.asaCode && currentFee.feeSource && fees.length < 3) {
      onAddFee(currentFee);
      setCurrentFee({ asaCode: "", feeSource: "", fee: 0 });
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Anesthesia Fees</h3>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>ASA Code</Label>
          <Input
            value={currentFee.asaCode}
            onChange={(e) => setCurrentFee(prev => ({ ...prev, asaCode: e.target.value }))}
            placeholder="Enter ASA code"
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
        Add Anesthesia Fee
      </Button>

      <div className="space-y-2">
        {fees.map((fee, index) => (
          <div key={index} className="flex items-center justify-between p-2 border rounded">
            <div>
              <span className="font-medium">{fee.asaCode}</span>
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
