import dayjs from "dayjs";
import type { ClinicRow } from "@/types/clinic";
import type { ListMode } from "../InPatientList/type";
import type {
  AreaRow,
  CaseVisitRow,
  QcVisitRow,
  VisitIpRow,
  VisitItemRow,
  VisitItemTag,
  VisitPatientRow,
  VisitPredischargeRow,
  VisitRow,
  VisitStatusRow,
} from "./types";

/** 在院：当前日期 - 入院日期（入院当天算第 1 天） */
const calcInHospitalDays = (admissionTime?: string): number => {
  if (!admissionTime) return 0;

  const admissionDate = dayjs(admissionTime);

  if (!admissionDate.isValid()) return 0;

  // 只比较日期，入院当天算第 1 天
  return Math.max(
    1,
    dayjs().startOf("day").diff(admissionDate.startOf("day"), "day") + 1,
  );
};

/** 出院：出院日期 - 入院日期；差值为 0 时记为 1 */
const calcOutHospitalDays = (
  admissionTime?: string,
  dischargeTime?: string,
): number => {
  if (!admissionTime || !dischargeTime) return 0;

  const admissionDate = dayjs(admissionTime);
  const dischargeDate = dayjs(dischargeTime);

  if (!admissionDate.isValid() || !dischargeDate.isValid()) return 0;

  const days = dischargeDate
    .startOf("day")
    .diff(admissionDate.startOf("day"), "day");

  return days === 0 ? 1 : days;
};

const calcHospitalDays = (
  mode: ListMode = "in",
  admissionTime?: string,
  dischargeTime?: string,
): number => {
  if (mode === "transfer") return 0;
  if (mode === "out") return calcOutHospitalDays(admissionTime, dischargeTime);
  return calcInHospitalDays(admissionTime);
};

export const buildAllergyTags = (allergyInfo?: string): VisitItemTag[] => {
  const allergyInfoText = allergyInfo?.trim();
  if (!allergyInfoText) return [];

  // 不做成 一个过敏史 展示 一个标签 了，而是全部合并成一个标签
  return [allergyInfoText]
    .map((label) => ({
      label,
      // 「未发现」用默认色，有过敏史用红色
      color: label === "未发现" ? "default" : "volcano",
    }));
};

const hasTime = (value?: string) => Boolean(value?.trim());

const toDischargeTag = (label: string, time?: string): VisitItemTag => ({
  label,
  color: hasTime(time) ? "success" : "default",
});

/** 出院列表标签：对应 *_time 有值视为已完成 */
const buildDischargeTags = (
  qc?: QcVisitRow,
  caseRow?: CaseVisitRow,
): VisitItemTag[] => [
  toDischargeTag("医生提交", qc?.doctor_commit_time),
  toDischargeTag("护士提交", qc?.nurse_commit_time),
  toDischargeTag("医疗质控", qc?.doctor_qc_time),
  toDischargeTag("护理质控", qc?.nurse_qc_time),
  toDischargeTag("病案质控", caseRow?.approve_time),
  toDischargeTag("病案编码", caseRow?.code_time),
  toDischargeTag("病案归档", caseRow?.archive_time),
  toDischargeTag("纸质签收", caseRow?.receive_time),
];

/** 组装标签：在院且已预出院时，「预出院」置顶；出院追加质控/病案环节标签 */
const buildTagList = (
  mode: ListMode,
  allergyInfo?: string,
  predischarge?: VisitPredischargeRow,
  qc?: QcVisitRow,
  caseRow?: CaseVisitRow,
): VisitItemTag[] => {
  const tags = buildAllergyTags(allergyInfo);

  if (mode === "in" && predischarge?.discharge_time?.trim()) {
    return [{ label: "预出院", color: "orange" }, ...tags];
  }

  if (mode === "out") {
    return buildDischargeTags(qc, caseRow);
  }

  return tags;
};

/** 将接口原始数据组织为列表展示项 */
export const toVisitItemRow = (
  visitId: number,
  visit?: VisitRow,
  ip?: VisitIpRow,
  patient?: VisitPatientRow,
  status?: VisitStatusRow,
  allergyInfo?: string,
  mode: ListMode = "in",
  predischarge?: VisitPredischargeRow,
  clinicProperty?: ClinicRow,
  qc?: QcVisitRow,
  caseRow?: CaseVisitRow,
  areaProperty?: AreaRow,
): VisitItemRow => ({
  visit_id: visitId,
  patient_id: patient?.patient_id!,
  bed_no: ip?.bed_no ?? "",
  patient_name: patient?.patient_name ?? "",
  patient_no: visit?.patient_no ?? "",
  patient_gender: patient?.patient_gender ?? "",
  patient_age: patient?.age_year ?? 0,
  age_full: patient?.age_full ?? "",
  hospital_days: calcHospitalDays(mode, ip?.admission_time, ip?.discharge_time),
  diag_list: clinicProperty && clinicProperty.diag_full
      ? [clinicProperty.diag_full]
      : [],
  tag_list: buildTagList(mode, allergyInfo, predischarge, qc, caseRow),
  visit_no: visit?.visit_no,
  admission_time: ip?.admission_time,
  insurance_no: visit?.patient_xid,
  group_tag: visit?.visit_tag || undefined,
  ward_id: ip?.ward_id,
  ward_name: ip?.ward_name,
  dept_id: visit?.dept_id,
  dept_name: visit?.dept_name,
  visit_info: visit?.visit_info,
  doctor_name: ip?.doctor_name,
  status_property: status,
  // 新增病人信息、住院信息、门诊诊断信息
  patient_property: patient,
  ip_property: ip,
  clinic_property: clinicProperty,
  // 新增患者就诊信息
  visit_property: visit,
  area_property: areaProperty,
});
