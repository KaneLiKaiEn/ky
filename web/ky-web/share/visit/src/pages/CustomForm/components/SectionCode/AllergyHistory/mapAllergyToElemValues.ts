import type { ElemValue } from "@/pages/CustomForm/components/DataElem/types";
import type { AllergyRow } from "@/types/allergy";

/** 过敏史 → elem_id */
export const ALLERGY_HISTORY_ELEM_ID = -200;

/**
 * 过敏史 → elem_list：
 * { elem_id: -200, elem_name: "过敏史", value_text: "青霉素、头孢" }
 * 无过敏时 value_text 为「无」
 */
export const mapAllergyRowsToElemValues = (
  section_id: number,
  allergyRows: AllergyRow[],
  sectionTitle?: string,
): ElemValue[] => {
  const names = allergyRows
    .map((row) => row.allergy_name?.trim())
    .filter((name): name is string => !!name);
  const title = sectionTitle?.trim();

  return [
    {
      section_id,
      elem_id: ALLERGY_HISTORY_ELEM_ID,
      elem_name: title || "过敏史",
      value_text: names.length ? names.join("、") : "无",
    },
  ];
};
