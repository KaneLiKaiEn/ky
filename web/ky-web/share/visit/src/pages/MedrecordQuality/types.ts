import type { ApiResult } from "@/types/comm";
import type { EmrRow } from "@/types/emr";

export type { EmrRow };

/** 护士站读护理提交时间，医生站读医生提交时间。 */
export type MedrecordQualityRole = "nurse" | "doctor";

export interface MedrecordQualityProps {
  /** 当前就诊号；为空时提示先选择患者 */
  visitId?: number | null;
  role?: MedrecordQualityRole;
  /** 提交质控或申请退回成功后回调，用于刷新患者列表 */
  onSuccess?: () => void;
}

export interface CommitQcReq {
  visit_id?: number;
  commit_time?: string;
  commit_tag?: string;
  commit_note?: string;
}

export interface CommitQcRes extends ApiResult {}

export interface RollbackQcReq {
  visit_id?: number;
  rollback_time?: string;
  rollback_tag?: string;
  rollback_note?: string;
}

export interface RollbackQcRes extends ApiResult {}
