
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlanForm } from "./PlanForm";
import { CareItem } from "@/types/lifecare";
import { PlusCircle } from "lucide-react";

interface AddCareItemDialogProps {
  onSubmit: (item: Omit<CareItem, "id" | "annualCost">) => void;
}

export function AddCareItemDialog({ onSubmit }: AddCareItemDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Care Item
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Care Item</DialogTitle>
          <DialogDescription>
            Add a new item to the life care plan. Fill in the frequency and duration details before looking up costs.
          </DialogDescription>
        </DialogHeader>
        <PlanForm onSubmit={onSubmit} />
      </DialogContent>
    </Dialog>
  );
}
