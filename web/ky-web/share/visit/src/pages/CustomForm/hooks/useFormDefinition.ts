import { useEffect, useState } from "react";
import { getFormProperty, getSectionList } from "@/api/form";
import { getDocNameProperty } from "@/api/doc";
import { getPatientAge, getPatientProperty } from "@/api/visit";
import type { SectionRow } from "@/types/form";
import type { FormProperty } from "../components/Form/types";
import { getFormDefinitionKey, getFormSessionKey } from "../model/formIdentity";
import {
  filterPatientSections,
  getFormLoadError,
  needsAgeFilter,
  needsGenderFilter,
  type AssessDocInfo,
} from "../model/formDefinition";

interface SectionDefinitionState {
  key: string;
  sections: SectionRow[];
  loading: boolean;
  error: string | null;
  eligibilityWarning: string | null;
}

interface AssessmentDefinitionState {
  key: string;
  docInfo: AssessDocInfo | null;
  error: string | null;
}

export const useFormDefinition = (formProp: FormProperty) => {
  const { form_id, form_version, visit_id } = formProp;
  const definitionKey = getFormDefinitionKey(formProp);
  // EMR binding does not change the configuration or patient eligibility.
  const loadKey = getFormSessionKey({ ...formProp, emr_id: undefined });
  const [sectionState, setSectionState] = useState<SectionDefinitionState>({
    key: loadKey, sections: [], loading: true, error: null, eligibilityWarning: null,
  });
  const [assessmentState, setAssessmentState] = useState<AssessmentDefinitionState>({
    key: definitionKey, docInfo: null, error: null,
  });

  useEffect(() => {
    let cancelled = false;
    setSectionState({ key: loadKey, sections: [], loading: true, error: null, eligibilityWarning: null });
    const load = async () => {
      try {
        // The existing API intentionally omits parent_version.
        const res = await getSectionList({ parent_type: "FORM", parent_id: form_id });
        if (cancelled) return;
        if (res.code !== 0) throw new Error(res.message || "表单区块加载失败");
        let sections = res.row_list ?? [];
        const genderNeeded = sections.some(needsGenderFilter);
        const ageNeeded = sections.some(needsAgeFilter);
        let eligibilityWarning: string | null = null;
        if (visit_id && (genderNeeded || ageNeeded)) {
          const [propertyRes, ageRes] = await Promise.all([
            genderNeeded ? getPatientProperty({ visit_id }).catch(() => null) : null,
            ageNeeded ? getPatientAge({ visit_id }).catch(() => null) : null,
          ]);
          if (cancelled) return;
          if ((genderNeeded && propertyRes?.code !== 0) || (ageNeeded && ageRes?.code !== 0)) {
            eligibilityWarning = "患者信息加载失败，部分表单区块未显示";
          }
          sections = filterPatientSections(
            sections,
            propertyRes?.code === 0 ? propertyRes.patient_property?.patient_gender : undefined,
            ageRes?.code === 0 ? ageRes : null,
          );
        }
        setSectionState({ key: loadKey, sections, loading: false, error: null, eligibilityWarning });
      } catch (error) {
        if (!cancelled) setSectionState({
          key: loadKey, sections: [], loading: false,
          error: getFormLoadError(error, "表单区块加载失败"),
          eligibilityWarning: null,
        });
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [form_id, form_version, visit_id, loadKey]);

  useEffect(() => {
    let cancelled = false;
    setAssessmentState({ key: definitionKey, docInfo: null, error: null });
    const load = async () => {
      try {
        const propertyRes = await getFormProperty({
          form_id, form_version, column_sheet: "doc_type,doc_name",
        });
        if (cancelled) return;
        if (propertyRes.code !== 0) throw new Error(propertyRes.message || "评估配置加载失败");
        const { doc_type, doc_name } = propertyRes.sheet_property ?? {};
        const doc_tag = propertyRes.form_property?.doc_tag ?? "";
        if (!doc_type || !doc_name || !doc_tag) return;
        const docRes = await getDocNameProperty({ doc_type, doc_name });
        if (cancelled) return;
        if (docRes.code !== 0) throw new Error(docRes.message || "评估配置加载失败");
        const property = docRes.name_property;
        const total = property?.assess_score ?? 0;
        const docInfo = total > 0 ? {
          doc_type, doc_name, doc_tag,
          assess_system: property?.assess_system ?? "",
          assess_method: property?.assess_method ?? "",
          assess_total: total,
        } : null;
        setAssessmentState({ key: definitionKey, docInfo, error: null });
      } catch (error) {
        if (!cancelled) setAssessmentState({
          key: definitionKey, docInfo: null,
          error: getFormLoadError(error, "评估配置加载失败"),
        });
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [form_id, form_version, definitionKey]);

  const currentSections = sectionState.key === loadKey ? sectionState : null;
  const currentAssessment = assessmentState.key === definitionKey ? assessmentState : null;
  return {
    loadKey,
    sectionList: currentSections?.sections ?? [],
    loading: currentSections?.loading ?? true,
    error: currentSections?.error ?? null,
    eligibilityWarning: currentSections?.eligibilityWarning ?? null,
    ready: currentSections != null && !currentSections.loading && !currentSections.error,
    docInfo: currentAssessment?.docInfo ?? null,
    assessmentError: currentAssessment?.error ?? null,
  };
};
