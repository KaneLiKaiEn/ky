import type { PatientAddressData, PatientAddressRow } from "../../PatientInfo/types/patient";
interface AddressInfoTabProps {
    addresses: PatientAddressRow[];
    patientId?: number | null;
    saving?: boolean;
    /** 勾选后，在「同步地址」打开时接收现住址内容 */
    syncTypes?: string[];
    onSyncTypesChange?: (types: string[]) => void;
    onSave: (list: PatientAddressData[]) => Promise<boolean>;
}
declare const AddressInfoTab: React.FC<AddressInfoTabProps>;
export default AddressInfoTab;
