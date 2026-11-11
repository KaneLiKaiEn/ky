import type { FormRow } from "@/types/form";
import type { VisitPatientRow } from "@/types/visit";

function isFormWithoutAgeLimit(form: FormRow) {
  const min = form.age_min ?? 0;
  const max = form.age_max ?? 0;
  const unit = (form.age_unit ?? "").trim();
  return !unit || (min === 0 && max === 0);
}

function getPatientAgeValue(patient: VisitPatientRow, ageUnit: string) {
  switch (ageUnit.trim()) {
    case "岁":
      return patient.age_year;
    case "月":
      return patient.age_month;
    case "天":
      return patient.age_day;
    default:
      return undefined;
  }
}

function isPatientAgeInFormRange(patient: VisitPatientRow, form: FormRow) {
  const unit = (form.age_unit ?? "").trim();
  if (!unit) return false;
  const ageValue = getPatientAgeValue(patient, unit);
  if (ageValue === undefined || ageValue === null || Number.isNaN(ageValue)) {
    return false;
  }
  const min = form.age_min ?? 0;
  const max = form.age_max ?? 0;
  return ageValue >= min && ageValue < max;
}

/** 优先匹配年龄区间，否则取第一个未限制年龄的表单 */
export function matchFormByPatientAge(
  formList: FormRow[],
  patient?: VisitPatientRow,
) {
  if (!formList.length) return undefined;
  if (!patient) return formList[0];

  const withAgeLimit = formList.filter((form) => !isFormWithoutAgeLimit(form));
  const matched = withAgeLimit.find((form) =>
    isPatientAgeInFormRange(patient, form),
  );
  if (matched) return matched;

  return formList.find((form) => isFormWithoutAgeLimit(form)) ?? formList[0];
}
