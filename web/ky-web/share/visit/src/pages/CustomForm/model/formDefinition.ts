import type { SectionRow } from "@/types/form";
import type { GetPatientAgeRes } from "@/types/visit";

export interface AssessDocInfo {
  doc_type: string;
  doc_name: string;
  doc_tag: string;
  assess_system: string;
  assess_method: string;
  assess_total: number;
}

const isBothGender = (gender?: string) =>
  gender === "[男][女]" || gender === "[女][男]";

export const needsGenderFilter = (row: SectionRow): boolean =>
  !!row.gender_name && !isBothGender(row.gender_name);

export const needsAgeFilter = (row: SectionRow): boolean =>
  (row.age_min ?? 0) > 0 || (row.age_max ?? 0) > 0;

const getAgeByUnit = (
  age: GetPatientAgeRes | null,
  unit?: string,
): number | undefined => {
  switch (unit) {
    case "岁": return age?.age_year;
    case "月": return age?.total_month;
    case "周": return age?.total_week;
    case "天": return age?.total_day;
    case "小时": return age?.total_hour;
    case "分钟": return age?.total_minute;
    default: return undefined;
  }
};

export const filterPatientSections = (
  sections: SectionRow[],
  patientGender: string | undefined,
  patientAge: GetPatientAgeRes | null,
): SectionRow[] => sections.filter((row) => {
  if (needsGenderFilter(row) &&
    (!patientGender || !row.gender_name!.includes(`[${patientGender}]`))) return false;
  if (needsAgeFilter(row)) {
    const age = getAgeByUnit(patientAge, row.age_unit);
    if (age == null) return false;
    if ((row.age_min ?? 0) > 0 && age < row.age_min!) return false;
    if ((row.age_max ?? 0) > 0 && age > row.age_max!) return false;
  }
  return true;
});

export const getFormLoadError = (error: unknown, fallback: string): string =>
  error instanceof Error && error.message ? error.message : fallback;
