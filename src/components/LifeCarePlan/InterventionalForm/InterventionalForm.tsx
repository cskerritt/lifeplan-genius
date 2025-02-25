
import { ProcedureForm } from "../ProcedureForm/ProcedureForm";
import { InterventionalFormProps } from "./types";

export function InterventionalForm({
  onFrequencyChange,
  frequencyDetails,
  dateOfBirth,
  dateOfInjury,
  lifeExpectancy,
  onSubmit
}: InterventionalFormProps) {
  return (
    <ProcedureForm
      type="interventional"
      onFrequencyChange={onFrequencyChange}
      frequencyDetails={frequencyDetails}
      dateOfBirth={dateOfBirth}
      dateOfInjury={dateOfInjury}
      lifeExpectancy={lifeExpectancy}
      onSubmit={onSubmit}
    />
  );
}
