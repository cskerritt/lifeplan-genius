
import { ProcedureForm } from "../ProcedureForm/ProcedureForm";
import { SurgicalFormProps } from "./types";

export function SurgicalForm(props: SurgicalFormProps) {
  return <ProcedureForm type="surgical" {...props} />;
}
