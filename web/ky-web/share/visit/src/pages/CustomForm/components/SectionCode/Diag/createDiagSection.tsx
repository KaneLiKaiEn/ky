import { forwardRef, useImperativeHandle, useRef } from "react";
import Diagnosis, { type DiagnosisRef } from "@/pages/Diagnosis";
import type { DiagApiType } from "@/types/diag";
import type { SectionCodeProps, SectionCodeRef } from "../types";
import { mapDiagRowsToElemValues } from "./mapDiagToElemValues";

/** 创建诊断类 SectionCode：始终表格可编辑，保存时汇总写入 elem_list */
export const createDiagSection = (diagTypes: DiagApiType[]) =>
  forwardRef<SectionCodeRef, SectionCodeProps>(function DiagSection(
    { visit_id, section },
    ref,
  ) {
    const diagnosisRef = useRef<DiagnosisRef>(null);
    const section_id = section.section_id ?? 0;
    const sectionTitle = section.section_title ?? section.section_name;

    useImperativeHandle(
      ref,
      () => ({
        getSectionValue: () =>
          mapDiagRowsToElemValues(
            section_id,
            diagnosisRef.current?.getDiagRows() ?? [],
            diagTypes,
            sectionTitle,
          ),
        initSectionValue: (initSectionValue) => {
          diagnosisRef.current?.initSectionValue(initSectionValue);
        },
      }),
      [section_id, diagTypes, sectionTitle],
    );

    return (
      <Diagnosis
        ref={diagnosisRef}
        visit_id={visit_id}
        isEdit={true}
        diag_type={diagTypes}
      />
    );
  });
