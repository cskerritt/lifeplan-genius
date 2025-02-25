
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Search } from "lucide-react";
import { CPTFee } from "./types";

interface CPTFeesFormProps {
  fees: CPTFee[];
  onAddFee: (fee: CPTFee) => void;
  onRemoveFee: (index: number) => void;
  onCPTLookup: (code: string) => Promise<any>;
}

export function CPTFeesForm({
  fees,
  onAddFee,
  onRemoveFee,
  onCPTLookup
}: CPTFeesFormProps) {
  const [currentCPT, setCurrentCPT] = useState("");
  const [currentDescription, setCurrentDescription] = useState("");
  const [currentCostRange, setCurrentCostRange] = useState({
    low: 0,
    average: 0,
    high: 0
  });

  const handleCPTLookup = async () => {
    if (currentCPT.trim()) {
      try {
        const cptData = await onCPTLookup(currentCPT);
        if (cptData && Array.isArray(cptData) && cptData.length > 0) {
          const result = cptData[0];
          if (result.pfr_75th) {
            setCurrentDescription(result.code_description || '');
            setCurrentCostRange({
              low: result.pfr_50th || 0,
              average: result.pfr_75th || 0,
              high: result.pfr_90th || 0
            });
          }
        }
      } catch (error) {
        console.error('Error looking up CPT code:', error);
      }
    }
  };

  const handleAdd = () => {
    if (currentCPT && fees.length < 5) {
      onAddFee({
        cptCode: currentCPT,
        description: currentDescription,
        costRange: currentCostRange
      });
      setCurrentCPT("");
      setCurrentDescription("");
      setCurrentCostRange({ low: 0, average: 0, high: 0 });
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">CPT Codes</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>CPT Code</Label>
          <div className="flex gap-2">
            <Input
              value={currentCPT}
              onChange={(e) => setCurrentCPT(e.target.value)}
              placeholder="Enter CPT code"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleCPTLookup}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Input
            value={currentDescription}
            onChange={(e) => setCurrentDescription(e.target.value)}
            placeholder="Description"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Low</Label>
          <Input
            type="number"
            value={currentCostRange.low}
            onChange={(e) => setCurrentCostRange(prev => ({ ...prev, low: Number(e.target.value) }))}
          />
        </div>
        <div>
          <Label>Average</Label>
          <Input
            type="number"
            value={currentCostRange.average}
            onChange={(e) => setCurrentCostRange(prev => ({ ...prev, average: Number(e.target.value) }))}
          />
        </div>
        <div>
          <Label>High</Label>
          <Input
            type="number"
            value={currentCostRange.high}
            onChange={(e) => setCurrentCostRange(prev => ({ ...prev, high: Number(e.target.value) }))}
          />
        </div>
      </div>

      <Button 
        onClick={handleAdd}
        disabled={fees.length >= 5}
        className="w-full"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add CPT Code
      </Button>

      <div className="space-y-2">
        {fees.map((fee, index) => (
          <div key={index} className="flex items-center justify-between p-2 border rounded">
            <div>
              <span className="font-medium">{fee.cptCode}</span>
              <span className="mx-2">-</span>
              <span>{fee.description}</span>
              <span className="ml-2 text-gray-500">
                (${fee.costRange.low} - ${fee.costRange.high})
              </span>
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
