import { useEffect, useMemo, useRef, useState } from "react";
import { Cascader } from "antd";
import type { CascaderProps } from "antd";
import { useAreaStore } from "../stores/useAreaStore";
import type { AreaRow } from "../../PatientInfo/types/sys";

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

interface AreaOption {
  value: string;
  label: string;
  isLeaf?: boolean;
  loading?: boolean;
  children?: AreaOption[];
  raw: AreaRow;
}

type CascaderValue = NonNullable<CascaderProps<AreaOption>["value"]>;

const toOption = (item: AreaRow): AreaOption => {
  const level = item.area_level ?? 0;
  return {
    value: String(item.area_id ?? ""),
    label: item.area_name || "",
    isLeaf: level >= 3,
    raw: item,
  };
};

/** 按名称或 area_id 匹配；码为空时不参与比较，避免 undefined === undefined 误命中首项 */
const matchArea = (item: AreaRow, name?: string, code?: string): boolean => {
  if (name && item.area_name === name) return true;
  if (code && item.area_id != null && String(item.area_id) === String(code)) {
    return true;
  }
  return false;
};

const findPost = (...rows: Array<AreaRow | undefined>) => {
  for (let i = rows.length - 1; i >= 0; i -= 1) {
    const post = rows[i]?.area_post?.trim();
    if (post) return post;
  }
  return undefined;
};

const areaIdStr = (row?: AreaRow) =>
  row?.area_id != null ? String(row.area_id) : undefined;

const areaValueToEmit = (selected: AreaOption[]): AreaValue => {
  const state = selected[0]?.raw;
  const city = selected[1]?.raw;
  const county = selected[2]?.raw;
  return {
    state: state?.area_name,
    stateCode: areaIdStr(state),
    city: city?.area_name,
    cityCode: areaIdStr(city),
    county: county?.area_name,
    countyCode: areaIdStr(county),
    district: areaIdStr(county) || areaIdStr(city) || areaIdStr(state),
    post: findPost(state, city, county),
  };
};

const cloneOptions = (list: AreaOption[]): AreaOption[] =>
  list.map((item) => ({
    ...item,
    children: item.children ? cloneOptions(item.children) : undefined,
  }));

const updateChildren = (
  list: AreaOption[],
  path: string[],
  children: AreaOption[],
): AreaOption[] => {
  if (!path.length) return list;
  return list.map((item) => {
    if (item.value !== path[0]) return item;
    if (path.length === 1) {
      return {
        ...item,
        loading: false,
        isLeaf: children.length === 0 ? true : item.isLeaf,
        children,
      };
    }
    return {
      ...item,
      children: updateChildren(item.children ?? [], path.slice(1), children),
    };
  });
};

const findOptionPath = (
  list: AreaOption[],
  ids: string[],
): AreaOption[] | undefined => {
  if (!ids.length) return [];
  const head = list.find((item) => item.value === ids[0]);
  if (!head) return undefined;
  if (ids.length === 1) return [head];
  const rest = findOptionPath(head.children ?? [], ids.slice(1));
  if (!rest) return undefined;
  return [head, ...rest];
};

const previewRaw = (name: string, code?: string): AreaRow => ({
  area_id: code != null && code !== "" && !Number.isNaN(Number(code))
    ? Number(code)
    : undefined,
  area_name: name,
});

/** 未请求区域列表时，用已保存的省市区名称拼出展示路径 */
const buildAreaPreview = (value?: AreaValue) => {
  const empty = { options: [] as AreaOption[], ids: [] as string[] };
  if (!value?.state) return empty;

  const stateId = value.stateCode || value.state;
  const stateOpt: AreaOption = {
    value: stateId,
    label: value.state,
    isLeaf: !value.city,
    raw: previewRaw(value.state, value.stateCode),
  };
  const ids = [stateId];

  if (value.city) {
    const cityId = value.cityCode || value.city;
    const cityOpt: AreaOption = {
      value: cityId,
      label: value.city,
      isLeaf: !value.county,
      raw: previewRaw(value.city, value.cityCode),
    };
    ids.push(cityId);
    stateOpt.children = [cityOpt];
    if (value.county) {
      const countyId = value.countyCode || value.county;
      cityOpt.children = [
        {
          value: countyId,
          label: value.county,
          isLeaf: true,
          raw: previewRaw(value.county, value.countyCode),
        },
      ];
      ids.push(countyId);
    }
  }

  return { options: [stateOpt], ids };
};

/**
 * 省 / 市 / 区 三级级联（基于 sys/RetrieveAreaList）
 * 展开时再拉省级；展开下级时懒加载；选中任一级时回填对应邮编
 */
const AreaSelects: React.FC<AreaSelectsProps> = ({
  value,
  onChange,
  disabled,
  className,
  placeholder = "请选择省 / 市 / 区",
}) => {
  const ensureArea = useAreaStore((s) => s.ensureArea);
  const [options, setOptions] = useState<AreaOption[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const optionsRef = useRef<AreaOption[]>([]);
  const lastSyncKeyRef = useRef("");

  optionsRef.current = options;

  const preview = useMemo(
    () => buildAreaPreview(value),
    [
      value?.state,
      value?.stateCode,
      value?.city,
      value?.cityCode,
      value?.county,
      value?.countyCode,
    ],
  );
  const fallbackLabel = [value?.state, value?.city, value?.county]
    .filter(Boolean)
    .join(" / ");

  const handleOpenChange = (open: boolean) => {
    if (!open || optionsRef.current.length) return;
    void ensureArea(0, 1).then((rows) => {
      setOptions((prev) => (prev.length ? prev : rows.map(toOption)));
    });
  };

  // 展开并拿到省级列表后，按已选地址补齐市 / 区，便于回显选中路径
  useEffect(() => {
    if (!optionsRef.current.length) return;

    const syncKey = [
      value?.state ?? "",
      value?.stateCode ?? "",
      value?.city ?? "",
      value?.cityCode ?? "",
      value?.county ?? "",
      value?.countyCode ?? "",
    ].join("|");

    if (!value?.state) {
      setSelectedIds((prev) => (prev.length ? [] : prev));
      lastSyncKeyRef.current = syncKey;
      return;
    }
    if (syncKey === lastSyncKeyRef.current) return;

    let cancelled = false;

    const sync = async () => {
      let nextOptions = cloneOptions(optionsRef.current);

      const state = nextOptions
        .map((o) => o.raw)
        .find((item) => matchArea(item, value.state, value.stateCode));
      if (!state?.area_id) {
        lastSyncKeyRef.current = syncKey;
        return;
      }

      const pathIds = [String(state.area_id)];
      let stateOpt = nextOptions.find((o) => o.value === pathIds[0]);
      if (stateOpt && !stateOpt.children?.length && !stateOpt.isLeaf) {
        const cities = await ensureArea(state.area_id);
        if (cancelled) return;
        const cityOpts = cities.map(toOption);
        nextOptions = updateChildren(nextOptions, pathIds, cityOpts);
        stateOpt = nextOptions.find((o) => o.value === pathIds[0]);
      }

      if (value.city && stateOpt?.children?.length) {
        const city = stateOpt.children
          .map((o) => o.raw)
          .find((item) => matchArea(item, value.city, value.cityCode));
        if (city?.area_id) {
          pathIds.push(String(city.area_id));
          const cityOpt = stateOpt.children.find((o) => o.value === pathIds[1]);
          if (cityOpt && !cityOpt.children?.length && !cityOpt.isLeaf) {
            const counties = await ensureArea(city.area_id);
            if (cancelled) return;
            const countyOpts = counties.map(toOption);
            nextOptions = updateChildren(nextOptions, pathIds, countyOpts);
          }
        }
      }

      if (value.county) {
        const cityOpt = findOptionPath(nextOptions, pathIds.slice(0, 2))?.[1];
        const county = cityOpt?.children
          ?.map((o) => o.raw)
          .find((item) => matchArea(item, value.county, value.countyCode));
        if (county?.area_id) pathIds.push(String(county.area_id));
      }

      if (cancelled) return;
      setOptions(nextOptions);
      setSelectedIds(pathIds);
      lastSyncKeyRef.current = syncKey;
    };

    void sync();
    return () => {
      cancelled = true;
    };
  }, [
    options.length,
    value?.state,
    value?.stateCode,
    value?.city,
    value?.cityCode,
    value?.county,
    value?.countyCode,
    ensureArea,
  ]);

  const loadData: CascaderProps<AreaOption>["loadData"] = (selectedOptions) => {
    const target = selectedOptions[selectedOptions.length - 1];
    if (!target || target.children?.length || target.isLeaf) return;

    const path = selectedOptions.map((item) => String(item.value));
    target.loading = true;
    setOptions((prev) => cloneOptions(prev));

    void ensureArea(Number(target.value)).then((rows) => {
      const children = rows.map(toOption);
      setOptions((prev) => updateChildren(prev, path, children));
    });
  };

  const handleChange: CascaderProps<AreaOption>["onChange"] = (
    nextValue,
    selectedOptions,
  ) => {
    const ids = (nextValue ?? []).map(String);
    setSelectedIds(ids);
    lastSyncKeyRef.current = [
      selectedOptions?.[0]?.raw.area_name ?? "",
      areaIdStr(selectedOptions?.[0]?.raw) ?? "",
      selectedOptions?.[1]?.raw.area_name ?? "",
      areaIdStr(selectedOptions?.[1]?.raw) ?? "",
      selectedOptions?.[2]?.raw.area_name ?? "",
      areaIdStr(selectedOptions?.[2]?.raw) ?? "",
    ].join("|");

    if (!selectedOptions?.length) {
      onChange?.({});
      return;
    }
    onChange?.(areaValueToEmit(selectedOptions as AreaOption[]));
  };

  return (
    <Cascader
      className={["w-full", className].filter(Boolean).join(" ")}
      allowClear
      changeOnSelect
      disabled={disabled}
      placeholder={placeholder}
      options={options.length ? options : preview.options}
      loadData={loadData}
      value={
        (selectedIds.length
          ? selectedIds
          : preview.ids.length
            ? preview.ids
            : undefined) as CascaderValue
      }
      onOpenChange={handleOpenChange}
      onChange={handleChange}
      showSearch={{
        filter: (inputValue, path) =>
          path.some((option) =>
            String(option.label ?? "")
              .toLowerCase()
              .includes(inputValue.toLowerCase()),
          ),
      }}
      displayRender={(labels) => {
        if (!selectedIds.length && fallbackLabel) return fallbackLabel;
        return labels.join(" / ");
      }}
    />
  );
};

export default AreaSelects;
