import type { ElemProp, ElemValue, FormContext, InitValue } from "@/pages/CustomForm/components/DataElem/types";

export interface MultiRowTableRef {
  getSectionValue: () => ElemValue[];
  initSectionValue: (initSectionValue: InitValue, options?: { force?: boolean }) => void;
}

export interface MultiRowTableProps {
  section_id: number;
  formContext?: FormContext;
  elemList: ElemProp[];
  sectionValues?: ElemValue[];
  sectionInit?: string;
  onSectionValueChanged?: (section_id: number, elem_id: number) => void;
}
