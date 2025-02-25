
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FrequencyDetails } from "@/types/lifecare";
import { 
  Clock,
  CalendarDays, 
  CalendarClock,
  Calendar 
} from "lucide-react";

interface CustomFrequencyInputProps {
  frequencyDetails: FrequencyDetails;
  onFrequencyChange: (field: keyof FrequencyDetails, value: string) => void;
}

export function CustomFrequencyInput({ frequencyDetails, onFrequencyChange }: CustomFrequencyInputProps) {
  const applyCustomPattern = (pattern: string) => {
    onFrequencyChange('customFrequency', pattern);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Custom Frequency</Label>
        <Input
          value={frequencyDetails.customFrequency}
          onChange={(e) => onFrequencyChange('customFrequency', e.target.value)}
          placeholder="e.g., 1x every 10 years"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => applyCustomPattern(`${frequencyDetails.lowFrequencyPerYear}x per year`)}
          className="text-sm"
        >
          <Clock className="mr-2 h-4 w-4" />
          Per Year
        </Button>
        
        <Button
          type="button"
          variant="outline"
          onClick={() => applyCustomPattern(`1x every ${frequencyDetails.lowDurationYears} years`)}
          className="text-sm"
        >
          <CalendarDays className="mr-2 h-4 w-4" />
          Every X Years
        </Button>
        
        <Button
          type="button"
          variant="outline"
          onClick={() => applyCustomPattern(`${frequencyDetails.lowFrequencyPerYear}-${frequencyDetails.highFrequencyPerYear}x per year`)}
          className="text-sm"
        >
          <CalendarClock className="mr-2 h-4 w-4" />
          Range Per Year
        </Button>
        
        <Button
          type="button"
          variant="outline"
          onClick={() => applyCustomPattern(`${frequencyDetails.lowFrequencyPerYear}x per year for ${frequencyDetails.lowDurationYears} years`)}
          className="text-sm"
        >
          <Calendar className="mr-2 h-4 w-4" />
          X Times for Y Years
        </Button>
      </div>

      <div className="text-sm text-gray-500 space-y-1">
        <p>Example patterns:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>1x every 10 years</li>
          <li>2-3x per year</li>
          <li>4x per year for 5 years</li>
          <li>1x per year</li>
        </ul>
      </div>
    </div>
  );
}
