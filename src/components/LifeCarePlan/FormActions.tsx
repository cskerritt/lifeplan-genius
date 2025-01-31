import React from 'react';
import { Button } from "@/components/ui/button";

interface FormActionsProps {
  onCancel: () => void;
}

export function FormActions({ onCancel }: FormActionsProps) {
  return (
    <div className="flex justify-end space-x-4 mt-6">
      <Button variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit">
        Create Plan
      </Button>
    </div>
  );
}