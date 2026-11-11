import { getClinicPropertyAPI } from "@/api/clinic";
import type { ListMode } from "../InPatientList/type";
import {
  getAllergyInfo2API,
  getCaseList3API,
  getAreaPropertyAPI,
  getQcList3API,
  getVisitPropertyAPI,
} from "./api";
import { toVisitItemRow } from "./normalize";
import type { VisitItemRow } from "./types";

const QC_COLUMN_LIST =
  "visit_id,doctor_commit_time,nurse_commit_time,doctor_qc_time,nurse_qc_time";
const CASE_COLUMN_LIST =
  "visit_id,approve_time,code_time,archive_time,receive_time";

/**
 * 按 visitId 拉取完整展示数据：
 * GetVisitProperty（就诊/住院/患者）+ GetAllergyInfo2 + GetDiagList
 * 出院时额外拉取 GetQcList3 / GetCaseList3，用于出院环节标签
 */
export const fetchVisitItemById = async (
  visitId: number,
  mode: ListMode = "in",
): Promise<VisitItemRow | null> => {
  const propertyRes = await getVisitPropertyAPI({
    visit_id: visitId,
    column_visit: "*",
    column_ip: "*",
    column_patient: "*",
    column_status: "*",
    column_predischarge: "*"
  });

  const visit = propertyRes.visit_property;
  const ip = propertyRes.ip_property;
  const patient = propertyRes.patient_property;
  const status = propertyRes.status_property;
  const predischarge = propertyRes.predischarge_property;


  if (!visit && !ip && !patient && !status) {
    return null;
  }

  const patientId = visit?.patient_id ?? patient?.patient_id;
  const orgId = visit?.org_id ?? patient?.org_id;
  const shouldFetchDischargeTags = mode === "out" && orgId != null;

  const insuranceDistrict = status?.insurance_district?.trim();
  const insuranceDistrictAreaId =
    insuranceDistrict && !Number.isNaN(Number(insuranceDistrict))
      ? Number(insuranceDistrict)
      : null;

  const [allergyRes, clinicPropertyRes, qcRes, caseRes, areaRes] =
    await Promise.all([
    patientId != null
      ? getAllergyInfo2API({
          patient_id_list: [patientId],
          allergy_type: "*",
        }).catch(() => null)
      : Promise.resolve(null),
    getClinicPropertyAPI({
      visit_id: visitId,
    }),
    shouldFetchDischargeTags
      ? getQcList3API({
          org_id: orgId,
          visit_id_list: [visitId],
          column_list: QC_COLUMN_LIST,
        }).catch(() => null)
      : Promise.resolve(null),
    shouldFetchDischargeTags
      ? getCaseList3API({
          org_id: orgId,
          visit_id_list: [visitId],
          column_list: CASE_COLUMN_LIST,
        }).catch(() => null)
      : Promise.resolve(null),
    insuranceDistrictAreaId != null
      ? getAreaPropertyAPI({ area_id: insuranceDistrictAreaId }).catch(
          () => null,
        )
      : Promise.resolve(null),
  ]);

  const allergyInfo =
    patientId != null ? (allergyRes?.allergy_info?.[0] ?? "") : undefined;

  const clinicProperty = clinicPropertyRes.clinic_property;
  const qcRow = qcRes?.row_list?.find((row) => row.visit_id === visitId);
  const caseRow = caseRes?.row_list?.find((row) => row.visit_id === visitId);
  const areaProperty = areaRes?.area_property;

  return toVisitItemRow(
    visitId,
    visit,
    ip,
    patient,
    status,
    allergyInfo,
    mode,
    predischarge,
    clinicProperty,
    qcRow,
    caseRow,
    areaProperty,
  );
};
