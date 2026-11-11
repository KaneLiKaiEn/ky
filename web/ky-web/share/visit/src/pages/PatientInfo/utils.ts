import dayjs from "dayjs";
import type {
  PatientAddressData,
  PatientAddressRow,
  PatientContactData,
  PatientContactRow,
  PatientIndexRow,
} from "./types/patient";
import type { AddressFormValue, ContactFormValue } from "./types";
import {
  ADDRESS_TYPE_ALIASES,
  ADDRESS_TYPE_NAME,
  DEFAULT_COUNTRY,
} from "./constants";

export const findAddress = (
  list: PatientAddressRow[] | undefined,
  typeName: string,
): PatientAddressRow | undefined => {
  if (!list?.length || !typeName) return undefined;
  const aliases = ADDRESS_TYPE_ALIASES[typeName] ?? [typeName];
  for (const alias of aliases) {
    const hit = list.find(
      (item) =>
        item.address_type === alias ||
        (!!item.address_type &&
          (item.address_type.includes(alias) ||
            alias.includes(item.address_type))),
    );
    if (hit) return hit;
  }
  return undefined;
};

/** 是否为中国（空值按中国处理，与 addressToForm 默认一致） */
export const isChinaNation = (code?: string, name?: string) => {
  if (!code && !name) return true;
  if (code === DEFAULT_COUNTRY.code) return true;
  if (!code && name === DEFAULT_COUNTRY.name) return true;
  return false;
};

/** 切换为非中国时清空省市区 / 邮编 */
export const clearedAreaFields = (): Pick<
  AddressFormValue,
  | "address_state"
  | "address_state_code"
  | "address_city"
  | "address_city_code"
  | "address_county"
  | "address_county_code"
  | "address_district"
  | "address_post"
> => ({
  address_state: undefined,
  address_state_code: undefined,
  address_city: undefined,
  address_city_code: undefined,
  address_county: undefined,
  address_county_code: undefined,
  address_district: undefined,
  address_post: undefined,
});

/** 地址表单赋值：国籍为空时默认中国；仅有「中国」名称时补 code */
export const addressToForm = (
  row?: PatientAddressRow | Partial<AddressFormValue>,
): AddressFormValue => {
  const nationCode = row?.address_nation_code;
  const nationName = row?.address_nation;
  const emptyNation = !nationCode && !nationName;
  const chinaByName = nationName === DEFAULT_COUNTRY.name;

  return {
    address_id: row?.address_id,
    address_type: row?.address_type,
    address_nation: emptyNation ? DEFAULT_COUNTRY.name : nationName,
    address_nation_code:
      nationCode ||
      (emptyNation || chinaByName ? DEFAULT_COUNTRY.code : undefined),
    address_state: row?.address_state,
    address_state_code: row?.address_state_code,
    address_city: row?.address_city,
    address_city_code: row?.address_city_code,
    address_county: row?.address_county,
    address_county_code: row?.address_county_code,
    address_detail: row?.address_detail,
    address_district: row?.address_district,
    address_post: row?.address_post,
    address_full: row?.address_full,
  };
};

const isBlankText = (value?: string) => value == null || value.trim() === "";

/** 空国籍或默认「中国」都视为未单独填写国籍 */
const isDefaultNation = (row?: AddressFormValue) => {
  const nationCode = row?.address_nation_code?.trim();
  const nationName = row?.address_nation?.trim();
  if (!nationCode && !nationName) return true;
  return (
    (!nationCode || nationCode === DEFAULT_COUNTRY.code) &&
    (!nationName || nationName === DEFAULT_COUNTRY.name)
  );
};

/** 用户是否填写了地址。address_id、仅默认国籍不算已填写 */
const hasUserAddressInput = (row?: AddressFormValue) => {
  if (!row) return false;
  if (
    !isBlankText(row.address_state) ||
    !isBlankText(row.address_city) ||
    !isBlankText(row.address_county) ||
    !isBlankText(row.address_district) ||
    !isBlankText(row.address_detail) ||
    !isBlankText(row.address_post)
  ) {
    return true;
  }
  return !isDefaultNation(row);
};

/** 籍贯采集、可回填到出生地址和户籍住址的字段。不含门牌 */
const NATIVE_PLACE_FIELDS = [
  "address_nation",
  "address_nation_code",
  "address_state",
  "address_state_code",
  "address_city",
  "address_city_code",
  "address_county",
  "address_county_code",
  "address_district",
  "address_post",
] as const satisfies readonly (keyof AddressFormValue)[];

const sameText = (left?: string, right?: string) =>
  (left ?? "").trim() === (right ?? "").trim();

const groupBlank = (
  row: AddressFormValue | undefined,
  nameKey: keyof AddressFormValue,
  codeKey?: keyof AddressFormValue,
) =>
  isBlankText(row?.[nameKey] as string | undefined) &&
  (codeKey == null || isBlankText(row?.[codeKey] as string | undefined));

/**
 * 籍贯某字段有值、目标地址对应字段未填时，把该字段补过去。
 * 已填写的目标字段、以及与籍贯省市区对不上的下级字段，保持不变。
 * 出生地址、户籍住址共用此逻辑。
 */
export const fillBirthAddressFromNative = (
  native?: AddressFormValue,
  target?: AddressFormValue,
): AddressFormValue | undefined => {
  if (!native || !hasUserAddressInput(native)) return target;
  const next: AddressFormValue = { ...(target ?? {}) };
  let filled = false;

  const copyText = (key: (typeof NATIVE_PLACE_FIELDS)[number]) => {
    const value = native[key];
    if (typeof value !== "string" || !value.trim()) return;
    next[key] = value;
    filled = true;
  };

  const targetNationBlank =
    isBlankText(target?.address_nation) &&
    isBlankText(target?.address_nation_code);
  const targetHasRegion =
    !groupBlank(target, "address_state", "address_state_code") ||
    !groupBlank(target, "address_city", "address_city_code") ||
    !groupBlank(target, "address_county", "address_county_code");
  const nativeForeign = !isDefaultNation(native);
  // 目标地址没填国籍时补籍贯国籍；仅默认「中国」且没有省市区时，才允许被非中国籍贯替换
  if (
    (targetNationBlank && !nativeForeign) ||
    (!targetHasRegion &&
      (targetNationBlank || isDefaultNation(target)) &&
      nativeForeign)
  ) {
    copyText("address_nation");
    copyText("address_nation_code");
  }

  const compatible = (current?: string, source?: string) =>
    isBlankText(current) || sameText(current, source);
  const levelAligned = (current?: string, source?: string) =>
    sameText(current, source) || (isBlankText(current) && isBlankText(source));

  const targetStateBlank = groupBlank(
    target,
    "address_state",
    "address_state_code",
  );
  const targetCityBlank = groupBlank(
    target,
    "address_city",
    "address_city_code",
  );
  const targetCountyBlank = groupBlank(
    target,
    "address_county",
    "address_county_code",
  );
  if (
    targetStateBlank &&
    compatible(target?.address_city, native.address_city) &&
    compatible(target?.address_county, native.address_county)
  ) {
    copyText("address_state");
    copyText("address_state_code");
  }
  const stateAligned = levelAligned(next.address_state, native.address_state);

  if (
    stateAligned &&
    targetCityBlank &&
    compatible(target?.address_county, native.address_county)
  ) {
    copyText("address_city");
    copyText("address_city_code");
  }
  const cityAligned =
    stateAligned && levelAligned(next.address_city, native.address_city);

  if (cityAligned && targetCountyBlank) {
    copyText("address_county");
    copyText("address_county_code");
  }
  const countyAligned =
    cityAligned && levelAligned(next.address_county, native.address_county);

  if (countyAligned && isBlankText(target?.address_district)) {
    copyText("address_district");
  }
  if (countyAligned && isBlankText(target?.address_post)) {
    copyText("address_post");
  }

  if (!filled) return target;
  next.address_full = undefined;
  return next;
};

/** 除默认国籍外是否还有有效地址内容（用于保存过滤） */
export const hasAddressContent = (row?: AddressFormValue) => {
  if (!row) return false;
  if (row.address_id) return true;
  if (
    row.address_state ||
    row.address_city ||
    row.address_county ||
    row.address_detail ||
    row.address_post
  ) {
    return true;
  }
  const nationCode = row.address_nation_code;
  const nationName = row.address_nation;
  if (!nationCode && !nationName) return false;
  // 仅有默认「中国」时不视为已填写
  const isDefaultNationOnly =
    (!nationCode || nationCode === DEFAULT_COUNTRY.code) &&
    (!nationName || nationName === DEFAULT_COUNTRY.name);
  return !isDefaultNationOnly;
};

export const findMedicalRecordNo = (
  indexList?: PatientIndexRow[],
): string => {
  if (!indexList?.length) return "";
  const hit = indexList.find(
    (item) =>
      item.index_name?.includes("病案") ||
      item.index_code?.toLowerCase().includes("patient_no") ||
      item.index_code === "病案号",
  );
  return hit?.index_value ?? "";
};

export const buildAddressFull = (row?: Partial<PatientAddressRow>) => {
  if (!row) return undefined;
  const parts = [
    row.address_nation,
    row.address_state,
    row.address_city,
    row.address_county,
    row.address_detail,
  ].filter(Boolean);
  return parts.length ? parts.join("") : undefined;
};

export const toAddressData = (
  row: Partial<PatientAddressRow> | undefined,
  addressType: string,
  patientId?: number | null,
): PatientAddressData => {
  const data: PatientAddressData = {
    address_id: row?.address_id,
    patient_id: row?.patient_id ?? patientId ?? undefined,
    address_type: row?.address_type || addressType,
    address_nation: row?.address_nation,
    address_nation_code: row?.address_nation_code,
    address_state: row?.address_state,
    address_state_code: row?.address_state_code,
    address_city: row?.address_city,
    address_city_code: row?.address_city_code,
    address_county: row?.address_county,
    address_county_code: row?.address_county_code,
    address_town: row?.address_town,
    address_town_code: row?.address_town_code,
    address_village: row?.address_village,
    address_village_code: row?.address_village_code,
    address_road_name: row?.address_road_name,
    address_road_no: row?.address_road_no,
    address_house: row?.address_house,
    address_detail: row?.address_detail,
    address_post: row?.address_post,
    address_district: row?.address_district,
    address_location: row?.address_location,
    sort_no: row?.sort_no,
    valid_status: row?.valid_status,
  };
  data.address_full = row?.address_full || buildAddressFull(data);
  return data;
};

export const mergeAddressList = (
  source: PatientAddressRow[],
  overrides: PatientAddressData[],
): PatientAddressData[] => {
  const map = new Map<string, PatientAddressData>();
  source.forEach((item) => {
    const key = item.address_type || String(item.address_id ?? "");
    map.set(key, toAddressData(item, item.address_type || ""));
  });
  overrides.forEach((item) => {
    const key = item.address_type || String(item.address_id ?? "");
    map.set(key, item);
  });
  return Array.from(map.values()).filter((item) => item.address_type);
};

export const getPrimaryAddressTypes = () => [
  ADDRESS_TYPE_NAME.NATIVE,
  ADDRESS_TYPE_NAME.CURRENT,
  ADDRESS_TYPE_NAME.HUKOU,
];

export const toContactData = (
  row: ContactFormValue | PatientContactRow | undefined,
  patientId?: number | null,
): PatientContactData => ({
  contact_id: row?.contact_id,
  patient_id:
    (row as PatientContactRow | undefined)?.patient_id ?? patientId ?? undefined,
  contact_name: row?.contact_name,
  contact_telno: row?.contact_telno,
  contact_kinship: row?.contact_kinship,
  contact_idno: row?.contact_idno,
  contact_idno_system: row?.contact_idno_system,
  contact_org: row?.contact_org,
  contact_address: row?.contact_address,
  contact_tag: (row as PatientContactRow | undefined)?.contact_tag,
  contact_note: (row as PatientContactRow | undefined)?.contact_note,
  sort_no: (row as PatientContactRow | undefined)?.sort_no,
  valid_status: (row as PatientContactRow | undefined)?.valid_status,
});

export const contactToForm = (row?: PatientContactRow): ContactFormValue => ({
  contact_id: row?.contact_id,
  contact_name: row?.contact_name,
  contact_telno: row?.contact_telno,
  contact_kinship: row?.contact_kinship,
  contact_idno_system: row?.contact_idno_system,
  contact_idno: row?.contact_idno,
  contact_org: row?.contact_org,
  contact_address: row?.contact_address,
});

export const formatVisitTime = (time?: string) => {
  if (!time) return "-";
  return dayjs(time).format("YYYY-MM-DD HH:mm");
};