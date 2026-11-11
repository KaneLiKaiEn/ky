import { useEffect, useMemo } from "react";
import { Button, Checkbox, Form, Input, Spin } from "antd";
import type {
  PatientAddressData,
  PatientAddressRow,
} from "../../PatientInfo/types/patient";
import { useDict } from "../../PatientInfo/stores/useDictStore";
import AreaSelects, { type AreaValue } from "../components/AreaSelects";
import DictSelect from "../components/DictSelect";
import {
  DEFAULT_ADDRESS_TAB_TYPES,
  DEFAULT_COUNTRY,
  DICT,
  ADDRESS_TAB_EXCLUDED_TYPES,
} from "../constants";
import type { AddressFormValue } from "../types";
import {
  addressToForm,
  clearedAreaFields,
  findAddress,
  hasAddressContent,
  isChinaNation,
  mergeAddressList,
  toAddressData,
} from "../utils";

interface AddressInfoTabProps {
  addresses: PatientAddressRow[];
  patientId?: number | null;
  saving?: boolean;
  /** 勾选后，在「同步地址」打开时接收现住址内容 */
  syncTypes?: string[];
  onSyncTypesChange?: (types: string[]) => void;
  onSave: (list: PatientAddressData[]) => Promise<boolean>;
}

const isExcludedAddressType = (type?: string) =>
  !!type &&
  ADDRESS_TAB_EXCLUDED_TYPES.some(
    (item) => type === item || type.includes(item) || item.includes(type),
  );

const AddressInfoTab: React.FC<AddressInfoTabProps> = ({
  addresses,
  patientId,
  saving,
  syncTypes = [],
  onSyncTypesChange,
  onSave,
}) => {
  const [form] = Form.useForm<{ rows: AddressFormValue[] }>();
  const { rows: addressTypeRows, loading: loadingTypes } = useDict(
    DICT.ADDRESS_TYPE,
  );

  const typeNames = useMemo(() => {
    if (loadingTypes) return [];
    const names = addressTypeRows
      .map((item) => item.item_name || item.item_code || "")
      .filter((name) => name && !isExcludedAddressType(name));
    const unique = Array.from(new Set(names));
    return unique.length
      ? unique
      : DEFAULT_ADDRESS_TAB_TYPES.filter((n) => !isExcludedAddressType(n));
  }, [addressTypeRows, loadingTypes]);

  const rows = useMemo(() => {
    if (!typeNames.length) return [];
    return typeNames.map((typeName) => {
      const existing = findAddress(addresses, typeName);
      return {
        ...addressToForm(existing),
        address_type: typeName,
      };
    });
  }, [addresses, typeNames]);

  useEffect(() => {
    form.setFieldsValue({ rows });
  }, [form, rows]);

  const selectedSet = useMemo(() => new Set(syncTypes), [syncTypes]);
  const allChecked =
    typeNames.length > 0 && typeNames.every((name) => selectedSet.has(name));
  const someChecked = typeNames.some((name) => selectedSet.has(name));

  const handleToggleType = (typeName: string, checked: boolean) => {
    if (!typeName) return;
    onSyncTypesChange?.(
      checked
        ? Array.from(new Set([...syncTypes, typeName]))
        : syncTypes.filter((item) => item !== typeName),
    );
  };

  const handleToggleAll = (checked: boolean) => {
    onSyncTypesChange?.(checked ? [...typeNames] : []);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    const edited = (values.rows ?? [])
      .filter((row) => hasAddressContent(row))
      .map((row) => toAddressData(row, row.address_type || "", patientId));
    const merged = mergeAddressList(addresses, edited);
    await onSave(merged);
  };

  return (
    <Form form={form} disabled={saving} className="min-w-0">
      {loadingTypes ? (
        <div className="flex w-full h-40 items-center justify-center">
          <Spin />
        </div>
      ) : (
        <div>
          <Form.List name="rows">
            {(fields) => (
              <div className="flex flex-col gap-2">
                {fields.map((field) => {
                  const typeName =
                    form.getFieldValue(["rows", field.name, "address_type"]) ||
                    typeNames[field.name];
                  return (
                    <div
                      key={field.key}
                      className="grid grid-cols-[auto_88px_minmax(0,1fr)] items-start gap-2"
                    >
                      <Checkbox
                        className="pt-1"
                        disabled={saving || !typeName}
                        checked={!!typeName && selectedSet.has(typeName)}
                        onChange={(e) =>
                          handleToggleType(typeName, e.target.checked)
                        }
                      />
                      <div className="truncate pt-1 text-right text-(length:--app-theme-font-sm, 13px) text-(--app-theme-text-secondary, #666)">
                        {typeName}
                      </div>
                      <Form.Item
                        noStyle
                        shouldUpdate={(prev, next) =>
                          prev.rows?.[field.name]?.address_nation !==
                            next.rows?.[field.name]?.address_nation ||
                          prev.rows?.[field.name]?.address_nation_code !==
                            next.rows?.[field.name]?.address_nation_code ||
                          prev.rows?.[field.name]?.address_state !==
                            next.rows?.[field.name]?.address_state ||
                          prev.rows?.[field.name]?.address_city !==
                            next.rows?.[field.name]?.address_city ||
                          prev.rows?.[field.name]?.address_county !==
                            next.rows?.[field.name]?.address_county
                        }
                      >
                        {() => {
                          const row = form.getFieldValue([
                            "rows",
                            field.name,
                          ]) as AddressFormValue | undefined;
                          const china = isChinaNation(
                            row?.address_nation_code,
                            row?.address_nation,
                          );
                          const areaValue: AreaValue = {
                            state: row?.address_state,
                            stateCode: row?.address_state_code,
                            city: row?.address_city,
                            cityCode: row?.address_city_code,
                            county: row?.address_county,
                            countyCode: row?.address_county_code,
                            district: row?.address_district,
                          };
                          return (
                            <div
                              className={
                                china
                                  ? "grid min-w-0 grid-cols-1 gap-2 xl:grid-cols-[110px_minmax(220px,1.4fr)_minmax(160px,1.4fr)_88px]"
                                  : "grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-[110px_1fr]"
                              }
                            >
                              <Form.Item
                                name={[field.name, "address_type"]}
                                hidden
                              >
                                <Input />
                              </Form.Item>
                              <Form.Item
                                name={[field.name, "address_id"]}
                                hidden
                              >
                                <Input />
                              </Form.Item>
                              <Form.Item
                                name={[field.name, "address_nation"]}
                                hidden
                              >
                                <Input />
                              </Form.Item>
                              <Form.Item
                                name={[field.name, "address_state"]}
                                hidden
                              >
                                <Input />
                              </Form.Item>
                              <Form.Item
                                name={[field.name, "address_state_code"]}
                                hidden
                              >
                                <Input />
                              </Form.Item>
                              <Form.Item
                                name={[field.name, "address_city"]}
                                hidden
                              >
                                <Input />
                              </Form.Item>
                              <Form.Item
                                name={[field.name, "address_city_code"]}
                                hidden
                              >
                                <Input />
                              </Form.Item>
                              <Form.Item
                                name={[field.name, "address_county"]}
                                hidden
                              >
                                <Input />
                              </Form.Item>
                              <Form.Item
                                name={[field.name, "address_county_code"]}
                                hidden
                              >
                                <Input />
                              </Form.Item>
                              <Form.Item
                                name={[field.name, "address_district"]}
                                hidden
                              >
                                <Input />
                              </Form.Item>
                              <Form.Item
                                name={[field.name, "address_nation_code"]}
                                className="mb-0!"
                              >
                                <DictSelect
                                  dictName={DICT.COUNTRY}
                                  placeholder="国籍"
                                  className="w-full"
                                  valueLabel={row?.address_nation}
                                  extraOptions={[
                                    {
                                      label: DEFAULT_COUNTRY.name,
                                      value: DEFAULT_COUNTRY.code,
                                    },
                                  ]}
                                  onNameChange={(name) => {
                                    form.setFieldValue(
                                      ["rows", field.name, "address_nation"],
                                      name,
                                    );
                                    const code = form.getFieldValue([
                                      "rows",
                                      field.name,
                                      "address_nation_code",
                                    ]) as string | undefined;
                                    if (!isChinaNation(code, name)) {
                                      const cleared = clearedAreaFields();
                                      (
                                        Object.keys(cleared) as Array<
                                          keyof typeof cleared
                                        >
                                      ).forEach((key) => {
                                        form.setFieldValue(
                                          ["rows", field.name, key],
                                          cleared[key],
                                        );
                                      });
                                    }
                                  }}
                                />
                              </Form.Item>
                              {china ? (
                                <Form.Item className="mb-0!">
                                  <AreaSelects
                                    value={areaValue}
                                    onChange={(area) => {
                                      form.setFields([
                                        {
                                          name: [
                                            "rows",
                                            field.name,
                                            "address_state",
                                          ],
                                          value: area.state,
                                        },
                                        {
                                          name: [
                                            "rows",
                                            field.name,
                                            "address_state_code",
                                          ],
                                          value: area.stateCode,
                                        },
                                        {
                                          name: [
                                            "rows",
                                            field.name,
                                            "address_city",
                                          ],
                                          value: area.city,
                                        },
                                        {
                                          name: [
                                            "rows",
                                            field.name,
                                            "address_city_code",
                                          ],
                                          value: area.cityCode,
                                        },
                                        {
                                          name: [
                                            "rows",
                                            field.name,
                                            "address_county",
                                          ],
                                          value: area.county,
                                        },
                                        {
                                          name: [
                                            "rows",
                                            field.name,
                                            "address_county_code",
                                          ],
                                          value: area.countyCode,
                                        },
                                        {
                                          name: [
                                            "rows",
                                            field.name,
                                            "address_district",
                                          ],
                                          value: area.district,
                                        },
                                        {
                                          name: [
                                            "rows",
                                            field.name,
                                            "address_post",
                                          ],
                                          value: area.post,
                                        },
                                      ]);
                                    }}
                                  />
                                </Form.Item>
                              ) : null}
                              <Form.Item
                                name={[field.name, "address_detail"]}
                                className="mb-0!"
                              >
                                <Input
                                  allowClear
                                  placeholder="请输入详细地址信息，如道路、门牌号等"
                                />
                              </Form.Item>
                              {china ? (
                                <Form.Item
                                  name={[field.name, "address_post"]}
                                  className="mb-0!"
                                >
                                  <Input allowClear placeholder="邮政编码" />
                                </Form.Item>
                              ) : (
                                <Form.Item
                                  name={[field.name, "address_post"]}
                                  hidden
                                >
                                  <Input />
                                </Form.Item>
                              )}
                            </div>
                          );
                        }}
                      </Form.Item>
                    </div>
                  );
                })}
              </div>
            )}
          </Form.List>
          <div className="mt-2">
            <Checkbox
              indeterminate={someChecked && !allChecked}
              checked={allChecked}
              disabled={saving || !typeNames.length}
              onChange={(e) => handleToggleAll(e.target.checked)}
            >
              全选
            </Checkbox>
          </div>
          <div className="mt-3">
            <Button
              type="primary"
              loading={saving}
              onClick={() => void handleSave()}
            >
              保存
            </Button>
          </div>
        </div>
      )}
    </Form>
  );
};

export default AddressInfoTab;
