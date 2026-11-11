export interface EmrTimeManagementProps {
  /**  DOCTOR | NURSE 传给 GetTimeRuleList 和 getQcItemList；未选质控项时 qc_id 传 0 */
  workType?: string;
}

export type TimeRuleEditor =
  | { type: "none" }
  | { type: "create" }
  | { type: "edit"; ruleId: number; ruleName?: string }
  | { type: "dept"; ruleId: number; ruleName?: string };
