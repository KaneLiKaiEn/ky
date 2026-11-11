import type { PatientContactData, PatientContactRow } from "../../PatientInfo/types/patient";
interface ContactTabProps {
    contacts: PatientContactRow[];
    patientId?: number | null;
    saving?: boolean;
    /** 为 false 时隐藏本页保存按钮，由外层扩展信息统一保存 */
    showSave?: boolean;
    onSave: (list: PatientContactData[]) => Promise<boolean>;
}
export interface ContactTabHandle {
    /** 读取联系人表单当前值，供左侧基本信息保存使用 */
    collectContacts: () => Promise<PatientContactData[]>;
}
declare const ContactTab: React.ForwardRefExoticComponent<ContactTabProps & React.RefAttributes<ContactTabHandle>>;
export default ContactTab;
