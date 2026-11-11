import type { ListMode } from "../InPatientList/type";
import type { VisitItemRow } from "./types";
/**
 * 按 visitId 拉取完整展示数据：
 * GetVisitProperty（就诊/住院/患者）+ GetAllergyInfo2 + GetDiagList
 * 出院时额外拉取 GetQcList3 / GetCaseList3，用于出院环节标签
 */
export declare const fetchVisitItemById: (visitId: number, mode?: ListMode) => Promise<VisitItemRow | null>;
