import type { PatientAddressData, PatientAddressRow, PatientContactData, PatientContactRow, PatientIndexRow } from "./types/patient";
import type { AddressFormValue, ContactFormValue } from "./types";
export declare const findAddress: (list: PatientAddressRow[] | undefined, typeName: string) => PatientAddressRow | undefined;
/** 是否为中国（空值按中国处理，与 addressToForm 默认一致） */
export declare const isChinaNation: (code?: string, name?: string) => boolean;
/** 切换为非中国时清空省市区 / 邮编 */
export declare const clearedAreaFields: () => Pick<AddressFormValue, "address_state" | "address_state_code" | "address_city" | "address_city_code" | "address_county" | "address_county_code" | "address_district" | "address_post">;
/** 地址表单赋值：国籍为空时默认中国；仅有「中国」名称时补 code */
export declare const addressToForm: (row?: PatientAddressRow | Partial<AddressFormValue>) => AddressFormValue;
/** 除默认国籍外是否还有有效地址内容（用于保存过滤） */
export declare const hasAddressContent: (row?: AddressFormValue) => boolean;
/** 籍贯有内容且目标地址未填写时，用籍贯字段补目标地址（出生地址、户籍住址） */
export declare const fillBirthAddressFromNative: (native?: AddressFormValue, target?: AddressFormValue) => AddressFormValue | undefined;
export declare const findMedicalRecordNo: (indexList?: PatientIndexRow[]) => string;
export declare const buildAddressFull: (row?: Partial<PatientAddressRow>) => string | undefined;
export declare const toAddressData: (row: Partial<PatientAddressRow> | undefined, addressType: string, patientId?: number | null) => PatientAddressData;
export declare const mergeAddressList: (source: PatientAddressRow[], overrides: PatientAddressData[]) => PatientAddressData[];
export declare const getPrimaryAddressTypes: () => ("籍贯" | "户籍地址" | "现住址")[];
export declare const toContactData: (row: ContactFormValue | PatientContactRow | undefined, patientId?: number | null) => PatientContactData;
export declare const contactToForm: (row?: PatientContactRow) => ContactFormValue;
export declare const formatVisitTime: (time?: string) => string;
