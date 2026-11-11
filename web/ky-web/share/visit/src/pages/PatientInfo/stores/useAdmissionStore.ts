import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { GetPatientPropertyRes } from "../types/patient";

interface AdmissionState {
  /** 当前读卡定位到的患者完整属性 */
  patientData: GetPatientPropertyRes | null;
  setPatientData: (data: GetPatientPropertyRes | null) => void;
  clearPatient: () => void;
}

export const useAdmissionStore = create<AdmissionState>()(
  devtools(
    (set) => ({
      patientData: null,
      setPatientData: (data) => set({ patientData: data }),
      clearPatient: () => set({ patientData: null }),
    }),
    { name: "AdmissionStore" },
  ),
);
