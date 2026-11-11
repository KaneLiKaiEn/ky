import { ClinicRow } from './../../types/clinic.d';
import type { ListMode } from "../InPatientList/type";
import type { CaseVisitRow, QcVisitRow, VisitIpRow, VisitItemRow, VisitItemTag, VisitPatientRow, VisitPredischargeRow, VisitRow, VisitStatusRow } from "./types";
export declare const buildAllergyTags: (allergyInfo?: string) => VisitItemTag[];
/** 将接口原始数据组织为列表展示项 */
export declare const toVisitItemRow: (visitId: number, visit?: VisitRow, ip?: VisitIpRow, patient?: VisitPatientRow, status?: VisitStatusRow, allergyInfo?: string, mode?: ListMode, predischarge?: VisitPredischargeRow, clinicProperty?: ClinicRow, qc?: QcVisitRow, caseRow?: CaseVisitRow, insuranceDistrictAreaName?: string) => VisitItemRow;
