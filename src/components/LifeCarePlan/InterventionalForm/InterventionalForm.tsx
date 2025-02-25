
import { ProcedureForm } from "../ProcedureForm/ProcedureForm";
import { InterventionalFormProps } from "./types";

export function InterventionalForm(props: InterventionalFormProps) {
  return (
    <ProcedureForm 
      type="interventional"
      {...props}
    />
  );
}
