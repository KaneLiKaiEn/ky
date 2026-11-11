import { forwardRef, useImperativeHandle, useRef } from "react";
import DiagTcm, { type DiagTcmRef } from "@/pages/DiagTcm";
import type { DiagTcmApiType } from "@/types/diag";
import type { SectionCodeProps, SectionCodeRef } from "../types";
import { mapDiagTcmRowsToElemValues } from "./mapDiagTcmToElemValues";

/** 创建中医诊断类 SectionCode：始终表格可编辑，保存时汇总写入 elem_list */
export const createDiagTcmSection = (diagTypes: DiagTcmApiType[]) =>
  forwardRef<SectionCodeRef, SectionCodeProps>(function DiagTcmSection(
    { visit_id, section },
    ref,
  ) {
    const diagTcmRef = useRef<DiagTcmRef>(null);
    const section_id = section.section_id ?? 0;
    const sectionTitle = section.section_title ?? section.section_name;

    useImperativeHandle(
      ref,
      () => ({
        getSectionValue: () =>
          mapDiagTcmRowsToElemValues(
            section_id,
            diagTcmRef.current?.getDiagRows() ?? [],
            diagTypes,
            sectionTitle,
          ),
        initSectionValue: (initSectionValue) => {
          diagTcmRef.current?.initSectionValue(initSectionValue);
        },
      }),
      [section_id, diagTypes, sectionTitle],
    );

    return (
      <DiagTcm
        ref={diagTcmRef}
        visit_id={visit_id}
        isEdit={true}
        diag_type={diagTypes}
      />
    );
  });
