import type { GetPatientAgeRes, PatientAddressData, PatientAddressRow, PatientContactData, PatientRow, PatientStatusRow } from "../../PatientInfo/types/patient";
export interface UsePatientInfoOptions {
    /** 默认按患者维度拉取 */
    patientId?: number | null;
    /** 就诊记录 ID；fromVisit=true 时优先使用 */
    visitId?: number | null;
    /** fromVisit 时可用：visit_no + org 维度 */
    visitNo?: string | null;
    /** fromVisit 时可用：就诊类型条件 */
    visitType?: string | null;
    /** true 时走 visit 服务接口 */
    fromVisit?: boolean;
    /** 打开时自动加载，默认 true */
    autoLoad?: boolean;
}
export declare const formatPatientAge: (age?: GetPatientAgeRes | null) => string;
/**
 * 患者信息数据钩子：按 patientId / visitId 拉取与保存。
 * fromVisit=true 时使用 visit 服务，否则默认 patient 服务。
 */
export declare const usePatientInfo: (options?: UsePatientInfoOptions) => {
    loading: boolean;
    saving: boolean;
    patientId: number | null;
    visitId: number | null;
    fromVisit: boolean;
    patientProperty: PatientRow | null;
    statusProperty: PatientStatusRow | null;
    addressList: PatientAddressRow[];
    contactList: import("../../PatientInfo/types/patient").PatientContactRow[];
    indexList: import("../../PatientInfo/types/patient").PatientIndexRow[];
    age: GetPatientAgeRes | null;
    ageText: string;
    patientNo: string | null;
    load: () => Promise<import("../../PatientInfo/types/patient").VisitGetPatientPropertyRes | import("../../PatientInfo/types/patient").GetPatientPropertyRes | null>;
    savePatientProperty: (nextProperty: PatientRow) => Promise<boolean>;
    saveStatusProperty: (nextStatus: PatientStatusRow) => Promise<boolean>;
    saveAddressList: (nextAddresses: PatientAddressData[], address_type?: string) => Promise<boolean>;
    saveContactList: (nextContacts: PatientContactData[]) => Promise<boolean>;
    saveBasicBundle: (payload: {
        patient_property: PatientRow;
        status_property?: PatientStatusRow;
        address_list?: PatientAddressData[];
    }) => Promise<boolean>;
    reset: () => void;
};
