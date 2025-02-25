
import React from 'react';
import { Button } from "@/components/ui/button";

interface FormActionsProps {
  onCancel: () => void;
  isEditing?: boolean;
}

export function FormActions({ onCancel, isEditing }: FormActionsProps) {
  return (
    <div className="flex justify-end space-x-4 mt-6">
      <Button variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit">
        {isEditing ? "Update Plan" : "Create Plan"}
      </Button>
    </div>
  );
}
