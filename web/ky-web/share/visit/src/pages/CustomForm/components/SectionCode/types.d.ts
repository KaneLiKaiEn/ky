import type * as React from "react";
import type { FormProperty } from "@/pages/CustomForm/components/Form/types";
import type { ElemValue } from "@/pages/CustomForm/components/DataElem/types";
import type { SectionRow } from "@/types/form";
import type { SectionRef } from "@/pages/CustomForm/components/Section/types";

export interface SectionCodeProps {
  section: SectionRow;
  formProp: FormProperty;
  visit_id: number;
  baby_id: number;
  /** 病历头所选时间，格式 YYYY-MM-DD HH:mm:ss */
  recordTime?: string;
  formValues?: ElemValue[];
  onFormValueChanged?: (section_id: number, elem_id: number) => void;
}

/** 与普通 Section 对齐，便于 Form 统一收集/初始化 */
export type SectionCodeRef = SectionRef;

export type SectionCodeComponent = React.ForwardRefExoticComponent<
  SectionCodeProps & React.RefAttributes<SectionCodeRef>
>;
