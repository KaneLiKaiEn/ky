import { formLayout } from "../../styles/formLayout";
import {
  AdaptiveForm,
  type AdaptiveFormProps,
} from "../../../form/AdaptiveForm";
export default function PropertyForm<Values extends object>(
  props: AdaptiveFormProps<Values>,
) {
  return (
    <AdaptiveForm<Values>
      {...formLayout}
      labelSizing="group"
      {...props}
      className={`mw-form ${props.className || ""}`}
    />
  );
}
