import type { ElemValue } from "@/pages/CustomForm/components/DataElem/types";
import type { InitValue } from "@/pages/CustomForm/components/DataElem/types";

export interface SectionProp {
  form_id: number;
  section_id: number;
  section_version?: number;
  section_title?: string;
  section_tag?: string;
  section_init?: string;
  column_width?: string;
  visit_id?: number;
  baby_id?: number;
  emr_id?: number;
}

export interface SectionRef {
  getSectionValue: () => ElemValue[];
  initSectionValue: (initSectionValue: InitValue) => void;
  saveSection?: () => Promise<void>;
}

export interface SectionProps {
  sectionProp: SectionProp;
  sectionValues?: ElemValue[];
  onSectionValueChanged?: (
    section_id: SectionProp["section_id"],
    elem_id: number,
  ) => void;
}
