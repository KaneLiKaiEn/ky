import DiagInit from "./Diag/DiagInit";
import DiagAdmission from "./Diag/DiagAdmission";
import DiagDischarge from "./Diag/DiagDischarge";
import DiagTcmActive from "./DiagTcm/DiagTcmActive";
import DiagTcmClinic from "./DiagTcm/DiagTcmClinic";
import DiagTcmInit from "./DiagTcm/DiagTcmInit";
import DiagTcmAdmission from "./DiagTcm/DiagTcmAdmission";
import DiagTcmDischarge from "./DiagTcm/DiagTcmDischarge";
import AllergyHistorySection from "./AllergyHistory/AllergyHistorySection";
import VitalSignsEntry from "./VitalSignsEntry";
import type { SectionCodeComponent } from "./types";

const sectionCodeRegistry: Record<string, SectionCodeComponent> = {
  diag_init: DiagInit,
  diag_admission: DiagAdmission,
  diag_discharge: DiagDischarge,
  diag_tcm_active: DiagTcmActive,
  diag_tcm_clinic: DiagTcmClinic,
  diag_tcm_init: DiagTcmInit,
  diag_tcm_admission: DiagTcmAdmission,
  diag_tcm_discharge: DiagTcmDischarge,
  allergy_history: AllergyHistorySection,
  vital_signs_entry: VitalSignsEntry,
};

export const getSectionCodeComponent = (
  sectionCode: string,
): SectionCodeComponent | undefined => {
  if (!sectionCode) return undefined;
  return sectionCodeRegistry[sectionCode];
};
