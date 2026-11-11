import { useCallback, useMemo, type MutableRefObject } from "react";
import type { SectionRow } from "@/types/form";
import Section from "../Section";
import type { SectionRef } from "../Section/types";
import { getSectionCodeComponent } from "../SectionCode/registry";
import type { FormProps } from "./types";

interface SectionRendererProps extends Omit<FormProps, "initialAssess" | "onReady"> {
  sectionList: SectionRow[];
  sectionRefs: MutableRefObject<Map<string, SectionRef>>;
}

const SectionEntry = ({
  section, index, sectionRefs, formProp, formValues, recordTime, onFormValueChanged,
}: Omit<SectionRendererProps, "sectionList"> & { section: SectionRow; index: number }) => {
  const sectionId = section.section_id ?? 0;
  const rowKey = `${sectionId}:${section.section_code ?? ""}:${index}`;
  const sectionValues = useMemo(
    () => formValues?.filter((value) => value.section_id === section.section_id) ?? [],
    [formValues, section.section_id],
  );
  const registerSection = useCallback((instance: SectionRef | null) => {
    if (instance) sectionRefs.current.set(rowKey, instance);
    else sectionRefs.current.delete(rowKey);
  }, [rowKey, sectionRefs]);
  const SectionCode = getSectionCodeComponent(section.section_code ?? "");
  return (
    <div className="mx-2">
      {SectionCode ? (
        <SectionCode
          ref={registerSection}
          section={section}
          formProp={formProp}
          visit_id={formProp.visit_id ?? 0}
          baby_id={formProp.baby_id ?? 0}
          recordTime={recordTime}
          formValues={formValues}
          onFormValueChanged={onFormValueChanged}
        />
      ) : (
        <Section
          ref={registerSection}
          sectionProp={{
            ...formProp, section_id: sectionId, section_version: formProp.form_version,
            section_title: section.section_title ?? "", section_tag: section.section_tag ?? "",
            section_init: section.section_init, column_width: section.column_width,
          }}
          sectionValues={sectionValues}
          onSectionValueChanged={onFormValueChanged}
        />
      )}
    </div>
  );
};

const SectionRenderer = ({ sectionList, ...props }: SectionRendererProps) =>
  sectionList.map((section, index) => (
    <SectionEntry
      key={`${section.section_id ?? ""}:${section.section_code ?? ""}:${index}`}
      section={section}
      index={index}
      {...props}
    />
  ));

export default SectionRenderer;
