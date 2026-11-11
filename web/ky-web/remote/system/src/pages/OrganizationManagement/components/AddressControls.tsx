import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Button, Cascader, Form, Select, Space } from "antd";
import type { AreaRow } from "@/types/sys";
import { loadAreaChildren, loadCountryNames } from "./areaCache";
import { parseAddress, serializeAddress, type AddressPrefix } from "./address";
import {
  toOption,
  updateOption,
  withSavedPath,
  hydrateAreaOptions,
  type AreaOption,
} from "./areaOptions";

interface AddressRegionProps {
  "aria-label"?: string;
  placeholder?: string;
  id?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSelect: (rows: AreaRow[]) => void;
  disabled?: boolean;
}

export const AddressRegion = ({
  id,
  value,
  onChange,
  onSelect,
  disabled,
  placeholder = "请选择省 / 市 / 区县",
  "aria-label": ariaLabel,
}: AddressRegionProps) => {
  const [roots, setRoots] = useState<AreaOption[]>([]);
  const [options, setOptions] = useState<AreaOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const lifetimeRef = useRef<AbortController | null>(null);
  const generationRef = useRef(0);
  const nodes = useMemo(() => parseAddress(value ?? ""), [value]);

  useEffect(() => {
    const controller = new AbortController();
    lifetimeRef.current = controller;
    setLoading(true);
    setFailed(false);
    void loadAreaChildren(0, controller.signal)
      .then((rows) => {
        if (!controller.signal.aborted) setRoots(rows.map(toOption));
      })
      .catch((error: unknown) => {
        if (
          !controller.signal.aborted &&
          !(error instanceof DOMException && error.name === "AbortError")
        ) {
          setFailed(true);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [retry]);

  // 按旧路径逐级回显；切换记录时取消旧消费者，避免旧机构地址覆盖新表单。
  useEffect(() => {
    const controller = new AbortController();
    generationRef.current += 1;
    setOptions(withSavedPath(roots, nodes));
    if (!roots.length) {
      return () => controller.abort();
    }
    void hydrateAreaOptions(roots, nodes, loadAreaChildren, controller.signal)
      .then((next) => {
        if (!controller.signal.aborted) {
          setOptions(next);
          setFailed(false);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setOptions(withSavedPath(roots, nodes));
          setFailed(true);
        }
      });
    return () => controller.abort();
  }, [roots, nodes, retry]);

  const loadData = async (selected: AreaOption[]) => {
    const last = selected[selected.length - 1];
    if (!last || last.isLeaf) return;
    const controller = lifetimeRef.current;
    if (!controller || controller.signal.aborted) return;
    const generation = generationRef.current;
    const ids = selected.map((item) => item.value);
    setOptions((current) => updateOption(current, ids, { loading: true }));
    try {
      const rows = await loadAreaChildren(last.value, controller.signal);
      if (controller.signal.aborted || generation !== generationRef.current)
        return;
      setOptions((current) =>
        updateOption(current, ids, {
          children: rows.map(toOption),
          loading: false,
          isLeaf: rows.length === 0,
        }),
      );
      setFailed(false);
    } catch {
      if (controller.signal.aborted || generation !== generationRef.current)
        return;
      setOptions((current) => updateOption(current, ids, { loading: false }));
      setFailed(true);
    }
  };

  return (
    <Space orientation="vertical" style={{ width: "100%" }}>
      <Cascader<AreaOption>
        id={id}
        aria-label={ariaLabel}
        options={options}
        value={nodes.map((node) => node.id)}
        changeOnSelect
        allowClear
        loading={loading}
        disabled={disabled}
        placeholder={placeholder}
        style={{ width: "100%" }}
        loadData={(selected) => void loadData(selected)}
        onChange={(_ids, selected) => {
          const rows = (selected ?? []) as AreaOption[];
          onChange?.(
            serializeAddress(
              rows.map((item) => ({ id: item.value, name: item.label })),
            ),
          );
          onSelect(rows.map((item) => item.raw));
        }}
      />
      {failed ? (
        <Alert
          type="warning"
          showIcon
          title="区域列表加载失败，已保存的地址会保留"
          action={
            <Button
              size="small"
              disabled={disabled}
              onClick={() => setRetry((n) => n + 1)}
            >
              重试
            </Button>
          }
        />
      ) : null}
    </Space>
  );
};

interface CountrySelectProps {
  id?: string;
  value?: string;
  onChange?: (country: string) => void;
  disabled?: boolean;
  "aria-label"?: string;
}

export function CountrySelect({
  id,
  value,
  onChange,
  disabled,
  "aria-label": ariaLabel,
}: CountrySelectProps) {
  const [names, setNames] = useState<string[]>(["中国"]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setFailed(false);
    void loadCountryNames(controller.signal)
      .then((next) => {
        if (!controller.signal.aborted) setNames(next);
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [retry]);
  return (
    <Space orientation="vertical" style={{ width: "100%" }}>
      <Select
        id={id}
        aria-label={ariaLabel}
        showSearch
        optionFilterProp="label"
        value={value}
        onChange={onChange}
        loading={loading}
        disabled={disabled}
        style={{ width: "100%" }}
        placeholder="请选择国家 / 地区"
        options={[...new Set([...names, ...(value ? [value] : [])])].map(
          (name) => ({ value: name, label: name }),
        )}
      />
      {failed && (
        <Alert
          type="warning"
          showIcon
          title="国家列表加载失败"
          action={
            <Button
              size="small"
              disabled={disabled}
              onClick={() => setRetry((n) => n + 1)}
            >
              重试
            </Button>
          }
        />
      )}
    </Space>
  );
}

/** One address policy for both the property form and the editable branch cells. */
export function useAddressEditorFields(prefix: AddressPrefix) {
  const form = Form.useFormInstance();
  const field = (suffix: string) => `${prefix}_address${suffix}`;
  const nation = Form.useWatch(field("_nation"), { form, preserve: true }) as
    | string
    | undefined;
  const handleCountryChange = (country: string) => {
    form.setFieldsValue({
      [field("")]: country === "中国" ? "" : "{0[0]}",
      [field("_state")]: "",
      [field("_city")]: "",
      [field("_county")]: "",
      [field("_post")]: "",
    });
  };
  const handleAreaSelect = (rows: AreaRow[]) => {
    form.setFieldsValue({
      [field("_state")]: rows[0]?.area_name ?? "",
      [field("_city")]: rows[1]?.area_name ?? "",
      [field("_county")]: rows[2]?.area_name ?? "",
      [field("_post")]:
        [...rows].reverse().find((row) => row.area_post)?.area_post ?? "",
    });
  };
  return {
    field,
    nation,
    isChina: !nation || nation === "中国",
    handleCountryChange,
    handleAreaSelect,
  };
}
