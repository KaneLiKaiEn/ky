import { Checkbox, Input, Tooltip } from "antd";
import AreaSelects, { type AreaValue } from "./AreaSelects";
import DictSelect from "./DictSelect";
import {
  DEFAULT_COUNTRY,
  DICT,
  SYNC_ADDRESS_LABEL,
  SYNC_ADDRESS_TIP,
} from "../constants";
import type { AddressFormValue } from "../types";
import { clearedAreaFields, isChinaNation } from "../utils";

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

const AddressFields: React.FC<AddressFieldsProps> = ({
  label,
  value,
  onChange,
  extra,
  showSameCheckbox,
  sameChecked,
  onSameChange,
  sameLabel = SYNC_ADDRESS_LABEL,
  sameTip = SYNC_ADDRESS_TIP,
  disabled,
  showDetail = true,
  singleRow = false,
}) => {
  const patch = (partial: Partial<AddressFormValue>) =>
    onChange?.({ ...value, ...partial });

  const china = isChinaNation(
    value?.address_nation_code,
    value?.address_nation,
  );

  const areaValue: AreaValue = {
    state: value?.address_state,
    stateCode: value?.address_state_code,
    city: value?.address_city,
    cityCode: value?.address_city_code,
    county: value?.address_county,
    countyCode: value?.address_county_code,
    district: value?.address_district,
    post: value?.address_post,
  };

  const handleAreaChange = (area: AreaValue) => {
    patch({
      address_state: area.state,
      address_state_code: area.stateCode,
      address_city: area.city,
      address_city_code: area.cityCode,
      address_county: area.county,
      address_county_code: area.countyCode,
      address_district: area.district,
      address_post: area.post,
    });
  };

  const controls = (
    <>
      <DictSelect
        disabled={disabled}
        dictName={DICT.COUNTRY}
        className={
          singleRow
            ? "w-full"
            : china
              ? "w-[110px]! shrink-0"
              : "min-w-0 flex-1"
        }
        placeholder={singleRow ? "国籍" : "请选择国籍"}
        value={value?.address_nation_code}
        valueLabel={value?.address_nation}
        extraOptions={[
          { label: DEFAULT_COUNTRY.name, value: DEFAULT_COUNTRY.code },
        ]}
        onChange={(code, option) => {
          const opt = Array.isArray(option) ? option[0] : option;
          const name =
            (opt as { name?: string; label?: string } | undefined)?.name ??
            (opt as { label?: string } | undefined)?.label;
          const nextChina = isChinaNation(code as string | undefined, name);
          patch({
            address_nation_code: code as string | undefined,
            address_nation: name ?? value?.address_nation,
            ...(nextChina ? {} : clearedAreaFields()),
          });
        }}
      />
      {china ? (
        <AreaSelects
          disabled={disabled}
          className="min-w-0"
          value={areaValue}
          onChange={handleAreaChange}
        />
      ) : null}
      {showDetail ? (
        <Input
          disabled={disabled}
          className="min-w-0"
          placeholder={
            singleRow ? "请输入详细地址信息，如道路、门牌号等" : "详细地址"
          }
          value={value?.address_detail}
          onChange={(e) => patch({ address_detail: e.target.value })}
        />
      ) : null}
      {china ? (
        <Input
          disabled={disabled}
          className={singleRow ? undefined : "w-28!"}
          placeholder={singleRow ? "邮政编码" : "邮编"}
          value={value?.address_post}
          onChange={(e) => patch({ address_post: e.target.value })}
        />
      ) : null}
    </>
  );

  if (singleRow) {
    return (
      <div
        className={
          china
            ? "grid min-w-0 grid-cols-1 gap-2 xl:grid-cols-[110px_minmax(220px,1.4fr)_minmax(160px,1.4fr)_88px]"
            : "grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-[110px_1fr]"
        }
      >
        {controls}
      </div>
    );
  }

  return (
    <div className="rounded  p-2">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="">{label}</span>
        <div className="flex items-center gap-2">
          {showSameCheckbox ? (
            <Tooltip title={sameTip}>
              <Checkbox
                checked={sameChecked}
                disabled={disabled}
                onChange={(e) => onSameChange?.(e.target.checked)}
              >
                {sameLabel}
              </Checkbox>
            </Tooltip>
          ) : null}
          {extra}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex min-w-0 gap-2">
          <DictSelect
            disabled={disabled}
            dictName={DICT.COUNTRY}
            className={china ? "w-[110px]! shrink-0" : "min-w-0 flex-1"}
            placeholder="请选择国籍"
            value={value?.address_nation_code}
            valueLabel={value?.address_nation}
            extraOptions={[
              { label: DEFAULT_COUNTRY.name, value: DEFAULT_COUNTRY.code },
            ]}
            onChange={(code, option) => {
              const opt = Array.isArray(option) ? option[0] : option;
              const name =
                (opt as { name?: string; label?: string } | undefined)?.name ??
                (opt as { label?: string } | undefined)?.label;
              const nextChina = isChinaNation(code as string | undefined, name);
              patch({
                address_nation_code: code as string | undefined,
                address_nation: name ?? value?.address_nation,
                ...(nextChina ? {} : clearedAreaFields()),
              });
            }}
          />
          {china ? (
            <AreaSelects
              disabled={disabled}
              className="min-w-0 flex-1"
              value={areaValue}
              onChange={handleAreaChange}
            />
          ) : null}
        </div>
        {showDetail || china ? (
          <div className="flex gap-2">
            {showDetail ? (
              <Input
                disabled={disabled}
                className="min-w-0 flex-1"
                placeholder="详细地址"
                value={value?.address_detail}
                onChange={(e) => patch({ address_detail: e.target.value })}
              />
            ) : null}
            {china ? (
              <Input
                disabled={disabled}
                className="w-28!"
                placeholder="邮编"
                value={value?.address_post}
                onChange={(e) => patch({ address_post: e.target.value })}
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default AddressFields;
