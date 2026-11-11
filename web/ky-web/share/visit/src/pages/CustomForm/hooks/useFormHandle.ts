import { useImperativeHandle, type ForwardedRef, type MutableRefObject } from "react";
import type { SectionRef } from "../components/Section/types";
import type { AssessResult, FormProperty, FormRef } from "../components/Form/types";

export const useFormHandle = (
  ref: ForwardedRef<FormRef>,
  sectionRefs: MutableRefObject<Map<string, SectionRef>>,
  formProp: FormProperty,
  assessment: AssessResult,
) => {
  useImperativeHandle(ref, () => ({
    getFormValues: () => Array.from(sectionRefs.current.values())
      .flatMap((section) => section.getSectionValue()),
    initFormValue: (link) => {
      sectionRefs.current.forEach((section) => section.initSectionValue({
        visit_id: formProp.visit_id ?? 0, baby_id: formProp.baby_id ?? 0, ...link,
      }));
    },
    getFormAssess: () => assessment,
    saveFormExtras: async () => {
      const tasks = Array.from(sectionRefs.current.values())
        .map((section) => section.saveSection)
        .filter((save): save is () => Promise<void> => typeof save === "function")
        .map((save) => save());
      await Promise.all(tasks);
    },
  }), [sectionRefs, formProp, assessment]);
};
