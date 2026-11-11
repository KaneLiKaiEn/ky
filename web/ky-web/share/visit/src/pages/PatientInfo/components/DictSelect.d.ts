import type { SelectProps } from "antd";
export interface DictSelectProps extends Omit<SelectProps, "options" | "loading" | "showSearch" | "filterOption" | "optionFilterProp"> {
    /** 字典编码；保留公开属性名，查询时传给 dict2 的 dict_code。 */
    dictName: string;
    /** 选中后回传 name（item_name） */
    onNameChange?: (name?: string) => void;
    /** 预置选项（如默认国籍等） */
    extraOptions?: {
        label: string;
        value: string;
    }[];
    /** 字典未加载时用来显示已选名称，避免裸显 code */
    valueLabel?: string;
}
/**
 * 字典下拉：同 dictName 全量缓存复用，本地过滤，value=item_code
 */
declare const DictSelect: React.FC<DictSelectProps>;
export default DictSelect;
