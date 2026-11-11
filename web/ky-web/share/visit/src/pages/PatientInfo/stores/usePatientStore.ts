import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type {
  GetPatientAgeRes,
  PatientAddressRow,
  PatientContactRow,
  PatientExtRow,
  PatientGpRow,
  PatientIndexRow,
  PatientRow,
  PatientStatusRow,
} from "../types/patient";

export interface PatientStoreState {
  patientId: number | null;
  visitId: number | null;
  fromVisit: boolean;

  patientProperty: PatientRow | null;
  statusProperty: PatientStatusRow | null;
  addressList: PatientAddressRow[];
  contactList: PatientContactRow[];
  gpList: PatientGpRow[];
  indexList: PatientIndexRow[];
  extList: PatientExtRow[];
  age: GetPatientAgeRes | null;
  /** GetPatientNo 返回的病案号 */
  patientNo: string | null;

  loading: boolean;
  saving: boolean;

  setIdentity: (payload: {
    patientId?: number | null;
    visitId?: number | null;
    fromVisit?: boolean;
  }) => void;
  setPatientProperty: (data: PatientRow | null) => void;
  setStatusProperty: (data: PatientStatusRow | null) => void;
  setAddressList: (list: PatientAddressRow[]) => void;
  setContactList: (list: PatientContactRow[]) => void;
  setGpList: (list: PatientGpRow[]) => void;
  setIndexList: (list: PatientIndexRow[]) => void;
  setExtList: (list: PatientExtRow[]) => void;
  setAge: (age: GetPatientAgeRes | null) => void;
  setPatientNo: (patientNo: string | null) => void;
  setLoading: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;
  hydrateFromPropertyRes: (payload: {
    patientProperty?: PatientRow | null;
    statusProperty?: PatientStatusRow | null;
    addressList?: PatientAddressRow[];
    contactList?: PatientContactRow[];
    gpList?: PatientGpRow[];
    indexList?: PatientIndexRow[];
    extList?: PatientExtRow[];
  }) => void;
  /** 基本信息保存成功后原子回写，避免分字段更新触发表单闪回旧值 */
  applyBasicSave: (payload: {
    patientProperty: PatientRow;
    statusProperty?: PatientStatusRow;
    addressList?: PatientAddressRow[];
    contactList?: PatientContactRow[];
  }) => void;
  reset: () => void;
}

const initialState = {
  patientId: null as number | null,
  visitId: null as number | null,
  fromVisit: false,
  patientProperty: null as PatientRow | null,
  statusProperty: null as PatientStatusRow | null,
  addressList: [] as PatientAddressRow[],
  contactList: [] as PatientContactRow[],
  gpList: [] as PatientGpRow[],
  indexList: [] as PatientIndexRow[],
  extList: [] as PatientExtRow[],
  age: null as GetPatientAgeRes | null,
  patientNo: null as string | null,
  loading: false,
  saving: false,
};

/** 患者信息独立 store，不与 admission 业务耦合，后续可迁到 share */
export const usePatientStore = create<PatientStoreState>()(
  devtools(
    (set) => ({
      ...initialState,
      setIdentity: (payload) =>
        set((state) => ({
          patientId:
            payload.patientId !== undefined
              ? payload.patientId
              : state.patientId,
          visitId:
            payload.visitId !== undefined ? payload.visitId : state.visitId,
          fromVisit:
            payload.fromVisit !== undefined
              ? payload.fromVisit
              : state.fromVisit,
        })),
      setPatientProperty: (data) => set({ patientProperty: data }),
      setStatusProperty: (data) => set({ statusProperty: data }),
      setAddressList: (list) => set({ addressList: list }),
      setContactList: (list) => set({ contactList: list }),
      setGpList: (list) => set({ gpList: list }),
      setIndexList: (list) => set({ indexList: list }),
      setExtList: (list) => set({ extList: list }),
      setAge: (age) => set({ age }),
      setPatientNo: (patientNo) => set({ patientNo }),
      setLoading: (loading) => set({ loading }),
      setSaving: (saving) => set({ saving }),
      hydrateFromPropertyRes: (payload) =>
        set((state) => ({
          patientProperty: payload.patientProperty ?? null,
          statusProperty: payload.statusProperty ?? null,
          addressList: payload.addressList ?? [],
          contactList: payload.contactList ?? [],
          gpList: payload.gpList ?? [],
          indexList: payload.indexList ?? [],
          extList: payload.extList ?? [],
          patientId:
            payload.patientProperty?.patient_id ?? state.patientId ?? null,
          // 保留显式传入的 visitId，避免被「最新就诊 id」覆盖
          visitId: state.visitId ?? payload.patientProperty?.visit_id ?? null,
        })),
      // 基本信息保存成功后原子回写，避免分字段更新触发表单闪回旧值
      applyBasicSave: (payload) =>
        set((state) => ({
          patientProperty: {
            ...state.patientProperty,
            ...payload.patientProperty,
          },
          statusProperty: payload.statusProperty
            ? { ...state.statusProperty, ...payload.statusProperty }
            : state.statusProperty,
          addressList: payload.addressList ?? state.addressList,
          contactList: payload.contactList ?? state.contactList,
        })),
      reset: () => set({ ...initialState }),
    }),
    { name: "PatientStore" },
  ),
);
