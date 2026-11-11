import type { AllergyRow } from "@/types/allergy";

export interface AllergyTableRow extends AllergyRow {
  rowKey: string;
}

export interface AllergyHistoryProps {
  patientId: number;
  className?: string;
  /** 有过敏史时 Tag 的 color，默认 volcano；无过敏史时用 Tag 默认底色 */
  hasAllergyColor?: string;
  noAllergyColor?: string;
  /** 是否展示「过敏史」前缀 label，默认 true */
  showLabel?: boolean;
  /** 过敏类型字典编码，默认 allergy.type；保留公开属性名。 */
  allergyTypeDictName?: string;
  includeEmpi?: boolean;
  onSaved?: () => void;
}
