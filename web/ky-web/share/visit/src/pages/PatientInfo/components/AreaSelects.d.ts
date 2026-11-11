export interface AreaValue {
    state?: string;
    stateCode?: string;
    city?: string;
    cityCode?: string;
    county?: string;
    countyCode?: string;
    district?: string;
    /** 选中层级对应的邮政编码（优先最末级） */
    post?: string;
}
export interface AreaSelectsProps {
    value?: AreaValue;
    onChange?: (value: AreaValue) => void;
    disabled?: boolean;
    className?: string;
    placeholder?: string;
}
/**
 * 省 / 市 / 区 三级级联（基于 sys/RetrieveAreaList）
 * 懒加载下级；选中任一级时回填对应邮编
 */
declare const AreaSelects: React.FC<AreaSelectsProps>;
export default AreaSelects;
