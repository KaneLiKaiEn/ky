export type AddressPrefix = "org" | "branch";

export interface AddressNode {
  id: number;
  name: string;
}

/** 旧系统区域路径格式为 {省[id]}{市[id]}{区[id]}。 */
export const parseAddress = (value: string): AddressNode[] => {
  const nodes: AddressNode[] = [];
  for (const match of value.matchAll(/\{([^{}]*?)\[(\d+)\]\}/g)) {
    const id = Number(match[2]);
    if (Number.isSafeInteger(id) && id > 0) {
      nodes.push({ id, name: match[1] });
    }
  }
  return nodes;
};

export const serializeAddress = (nodes: AddressNode[]): string =>
  nodes
    .filter((node) => Number.isSafeInteger(node.id) && node.id > 0)
    .map((node) => `{${node.name}[${node.id}]}`)
    .join("");

/** 保留原始地图、坐标等非可见字段，并保持国家名称和区域路径兼容。 */
export function normalizeAddress<T extends object>(
  prefix: AddressPrefix,
  values: T,
  original: Partial<T> = {},
): T {
  const merged = { ...original, ...values } as Record<string, unknown>;
  const key = (field: string) => `${prefix}_address${field}`;
  const nation = String(merged[key("_nation")] || "中国");
  merged[key("_nation")] = nation;

  if (nation !== "中国") {
    merged[key("")] = "{0[0]}";
    for (const field of ["_state", "_city", "_county", "_post"]) {
      merged[key(field)] = "";
    }
  } else {
    const address = String(merged[key("")] || "");
    merged[key("")] = address === "{0[0]}" ? "" : address;
    const nodes = parseAddress(String(merged[key("")]));
    if (nodes.length || merged[key("")] === "") {
      merged[key("_state")] = nodes[0]?.name ?? "";
      merged[key("_city")] = nodes[1]?.name ?? "";
      merged[key("_county")] = nodes[2]?.name ?? "";
    }
  }

  for (const field of ["_district", "_long", "_lat", "_map"]) {
    const name = key(field);
    if (
      merged[name] == null &&
      (original as Record<string, unknown>)[name] != null
    ) {
      merged[name] = (original as Record<string, unknown>)[name];
    }
  }
  return merged as T;
}
