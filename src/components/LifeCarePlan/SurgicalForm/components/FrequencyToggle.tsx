
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface FrequencyToggleProps {
  showFrequency: boolean;
  onToggle: (value: boolean) => void;
}

export function FrequencyToggle({ showFrequency, onToggle }: FrequencyToggleProps) {
  return (
    <div className="flex items-center space-x-2">
      <Switch
        checked={showFrequency}
        onCheckedChange={onToggle}
        id="frequency-switch"
      />
      <Label htmlFor="frequency-switch">Multiple Occurrences Expected</Label>
    </div>
  );
}
