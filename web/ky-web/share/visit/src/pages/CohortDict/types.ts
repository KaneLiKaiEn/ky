export interface CohortDictProps {
  /** 病种类型，由外部传入 */
  disease_type: string;
  /** 工作类型，由外部传入，控制路径动作各分栏的可编辑权限 */
  work_type?: string;
}

export type DiseaseEditor =
  | { type: "none" }
  | { type: "create" }
  | { type: "edit"; diseaseId: number; diseaseName?: string }
  | { type: "diag"; diseaseId: number; diseaseName?: string }
  | { type: "ops"; diseaseId: number; diseaseName?: string }
  | { type: "step"; diseaseId: number; diseaseName?: string }
  | { type: "dept"; diseaseId: number; diseaseName?: string }
  | { type: "post"; diseaseId: number; diseaseName?: string }
  | { type: "followup"; diseaseId: number; diseaseName?: string }
  | { type: "typePost" };
