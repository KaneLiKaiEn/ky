import type { FormInstance } from "antd/es/form";
import type {
  PatientAddressRow,
  PatientContactRow,
  PatientIndexRow,
  PatientRow,
  PatientStatusRow,
} from "./types/patient";

export interface PatientInfoProps {
  patientId?: number | null;
  visitId?: number | null;
  /** fromVisit 时可用：visit_no */
  visitNo?: string | null;
  /** fromVisit 时可用：就诊类型条件 */
  visitType?: string | null;
  /** true 时走 visit 服务接口，默认 false（patient 服务） */
  fromVisit?: boolean;
  className?: string;
  /** 保存成功回调；新建成功时会带上新 patientId */
  onSaved?: (patientId?: number | null) => void;
  /** 删除成功后的回调，由外层清空当前患者 */
  onDeleted?: () => void;
  /** 选择就诊记录后的回调（已切换到 visit 服务拉取） */
  onVisitSelect?: (visitId: number) => void;
  /** 隐藏顶部就诊记录操作条 */
  hideHeader?: boolean;
  /** 是否显示就诊记录选择按钮 */
  showVisitSelectBtn?: boolean;
  /** 是否显示就诊卡标签，默认关闭，患者档案入口再打开 */
  showCardTab?: boolean;
  /** 是否显示删除。仅患者档案入口打开；就诊维度不显示 */
  showDeleteBtn?: boolean;
}

export interface PatientInfoModalProps extends PatientInfoProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  width?: number | string;
}

export interface AddressFormValue {
  address_id?: number;
  address_type?: string;
  address_nation?: string;
  address_nation_code?: string;
  address_state?: string;
  address_state_code?: string;
  address_city?: string;
  address_city_code?: string;
  address_county?: string;
  address_county_code?: string;
  address_detail?: string;
  address_district?: string;
  address_post?: string;
  address_full?: string;
}

export interface ContactFormValue {
  contact_id?: number;
  contact_name?: string;
  contact_telno?: string;
  contact_kinship?: string;
  contact_idno_system?: string;
  contact_idno?: string;
  contact_org?: string;
  contact_address?: string;
}

export interface BasicFormValues {
  patient_no?: string;
  patient_name?: string;
  patient_gender?: string;
  patient_idno_system?: string;
  patient_idno?: string;
  birth_date?: string;
  birth_time?: string;
  /** 生产方式：顺产、剖宫产、未知 */
  birth_type?: string;
  patient_telno?: string;
  race_code?: string;
  race_name?: string;
  native_address?: AddressFormValue;
  current_address?: AddressFormValue;
  /** 是否将现住址同步到地址信息中已勾选的地址 */
  sync_current_address?: boolean;
  /** 患者类型 code：dict=insurance.type */
  insurance_type?: string;
  insurance_name?: string;
  /** 结算方式 code */
  settle_type?: string;
  settle_name?: string;
  insurance_no?: string;
  insurance_code?: string;
  insurance_bound?: boolean;
}

export interface ExtendedFormValues {
  country_code?: string;
  country_name?: string;
  edu_code?: string;
  edu_name?: string;
  work_code?: string;
  work_name?: string;
  work_org?: string;
  work_title?: string;
  work_telno?: string;
  marital_code?: string;
  marital_name?: string;
  lang_code?: string;
  lang_name?: string;
  faith_name?: string;
  blood_abo?: string;
  blood_rh?: string;
  partner_id?: number;
  partner_name?: string;
  body_height?: number | null;
  body_weight?: string;
  hukou_address?: AddressFormValue;
  birth_address?: AddressFormValue;
}

export interface PatientInfoContextValue {
  basicForm: FormInstance<BasicFormValues>;
  extendedForm: FormInstance<ExtendedFormValues>;
  patientProperty: PatientRow | null;
  statusProperty: PatientStatusRow | null;
  addressList: PatientAddressRow[];
  contactList: PatientContactRow[];
  indexList: PatientIndexRow[];
  ageText: string;
  saving: boolean;
}
