import type { GetPatientAgeRes, PatientAddressRow, PatientContactRow, PatientExtRow, PatientGpRow, PatientIndexRow, PatientRow, PatientStatusRow } from "../types/patient";
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
    }) => void;
    reset: () => void;
}
/** 患者信息独立 store，不与 admission 业务耦合，后续可迁到 share */
export declare const usePatientStore: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<PatientStoreState>, "setState" | "devtools"> & {
    setState(partial: PatientStoreState | Partial<PatientStoreState> | ((state: PatientStoreState) => PatientStoreState | Partial<PatientStoreState>), replace?: false | undefined, action?: (string | {
        [x: string]: unknown;
        [x: number]: unknown;
        [x: symbol]: unknown;
        type: string;
    }) | undefined): void;
    setState(state: PatientStoreState | ((state: PatientStoreState) => PatientStoreState), replace: true, action?: (string | {
        [x: string]: unknown;
        [x: number]: unknown;
        [x: symbol]: unknown;
        type: string;
    }) | undefined): void;
    devtools: {
        cleanup: () => void;
    };
}>;
