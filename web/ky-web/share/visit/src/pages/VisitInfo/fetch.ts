import dayjs from "dayjs";
import { getDiagListAPI, getVisitPropertyAPI } from "./api";
import type {
  VisitInfoRow,
  VisitIpRow,
  VisitPatientProperty,
  VisitRow,
  VisitStatusRow,
} from "./types";
import { getClinicPropertyAPI } from "@/api/clinic";
import { ClinicRow } from "@/types/clinic";

const calcHospitalDays = (admissionTime?: string): number => {
  if (!admissionTime) return 0;

  const admissionDate = dayjs(admissionTime);

  if (!admissionDate.isValid()) return 0;

  // 只比较日期，入院当天算第 1 天
  return Math.max(1, dayjs().startOf("day").diff(admissionDate.startOf("day"), "day") + 1);
};

const toVisitInfoRow = (
  visitId: number,
  visit?: VisitRow,
  ip?: VisitIpRow,
  patient?: VisitPatientProperty,
  status?: VisitStatusRow,
  diagList: string[] = [],
  clinicProperty?: ClinicRow,
): VisitInfoRow => ({
  visit_id: visitId,
  patient_id: patient?.patient_id!,
  bed_no: ip?.bed_no ?? "",
  patient_name: patient?.patient_name ?? "",
  patient_no: visit?.patient_no ?? "",
  patient_gender: patient?.patient_gender ?? "",
  patient_age: patient?.age_year ?? 0,
  hospital_days: calcHospitalDays(ip?.admission_time),
  diag_list: diagList.length
    ? diagList
    : visit?.diag_info
      ? [visit.diag_info]
      : [],
  visit_no: visit?.visit_no,
  admission_time: ip?.admission_time,
  insurance_no: visit?.patient_xid,
  group_tag: visit?.visit_tag || undefined,
  ward_id: ip?.ward_id,
  ward_name: ip?.ward_name,
  dept_id: visit?.dept_id,
  dept_name: visit?.dept_name,
  status_property: status,
  // 新增病人信息和住院信息
  patient_property: patient,
  ip_property: ip,
  clinic_property: clinicProperty,
  // 新增患者就诊信息
  visit_property: visit,
});

/** 按 visitId 拉取就诊信息条所需数据 */
export const fetchVisitInfoById = async (
  visitId: number,
): Promise<VisitInfoRow | null> => {
  const [propertyRes, diagRes, clinicPropertyRes] = await Promise.all([
    getVisitPropertyAPI({
      visit_id: visitId,
      column_visit: "*",
      column_ip: "*",
      column_patient: "*",
      column_status: "*",
    }),
    getDiagListAPI({
      visit_id: visitId,
      diag_type: "*",
      column_list: "diag_name,visit_id,serial_no,diag_level",
    }).catch(() => null),
    getClinicPropertyAPI({
      visit_id: visitId,
    })
  ]);

  const visit = propertyRes.visit_property;
  const ip = propertyRes.ip_property;
  const patient = propertyRes.patient_property;
  const status = propertyRes.status_property;
  const clinicProperty = clinicPropertyRes.clinic_property;
  if (!visit && !ip && !patient) {
    return null;
  }

  const diagList = (diagRes?.diag_list ?? [])
    .map((item) => item.diag_name?.trim())
    .filter((name): name is string => !!name);

  return toVisitInfoRow(visitId, visit, ip, patient, status, diagList, clinicProperty);
};
