import type { AddressFormValue } from "../types";
export interface AddressFieldsProps {
    label: string;
    value?: AddressFormValue;
    onChange?: (value: AddressFormValue) => void;
    /** 右侧附加操作 */
    extra?: React.ReactNode;
    showSameCheckbox?: boolean;
    sameChecked?: boolean;
    onSameChange?: (checked: boolean) => void;
    sameLabel?: string;
    sameTip?: string;
    disabled?: boolean;
    /** 是否显示详细地址。籍贯不采集门牌，仅现住址展示 */
    showDetail?: boolean;
    /** 与地址信息页一致：标签和输入控件排在同一行 */
    singleRow?: boolean;
}
declare const AddressFields: React.FC<AddressFieldsProps>;
export default AddressFields;
