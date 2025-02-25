
import { Button } from "@/components/ui/button";

interface EvalueeFormActionsProps {
  onCancel: () => void;
  isEditing?: boolean;
}

export function FormActions({ onCancel, isEditing }: EvalueeFormActionsProps) {
  return (
    <div className="flex justify-end space-x-4">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
      >
        Cancel
      </Button>
      <Button type="submit">
        {isEditing ? "Update" : "Create"} Life Care Plan
      </Button>
    </div>
  );
}
