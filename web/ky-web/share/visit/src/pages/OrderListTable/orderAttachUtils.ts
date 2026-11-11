import type {
  OrderRow,
  OrderSubChargeRow,
  OrderSubMaterialRow,
} from "@/types/ordent";
import type { PrefabDetailRow } from "@/types/medicate";
import { normalizeOrderStatus } from "./orderStatus";

const SELF_PAY_TAG = "[自费]";

const HIDDEN_ATTACH_STATUSES = new Set(["ORDER", "DRAFT", "CANCEL"]);

export function canShowOrderAttachIcon(row: OrderRow): boolean {
  if (row.order_id == null) return false;
  const status = normalizeOrderStatus(row.order_status);
  return !HIDDEN_ATTACH_STATUSES.has(status);
}

export function hasOrderAttachItems(row: OrderRow): boolean {
  return (row.charge_count ?? 0) + (row.material_count ?? 0) > 0;
}

export interface RetrieveAttachItem {
  item_id?: number;
  item_name?: string;
  item_desc?: string;
  item_spec?: string;
  item_model?: string;
  item_unit?: string;
  price_latest?: string;
  item_name_order?: string;
}

function formatQuantity(qty: string | number | undefined): string {
  if (qty == null || String(qty).trim() === "") return "1";
  const n = parseFloat(String(qty));
  if (!Number.isFinite(n)) return String(qty);
  if (Number.isInteger(n)) return String(n);
  return String(parseFloat(n.toFixed(6)));
}

export function buildChargeRowFromRetrieveItem(
  item: RetrieveAttachItem,
  quantity: string | number | undefined,
  selfPay: boolean,
): OrderSubChargeRow {
  const name = item.item_name ?? "";
  return {
    item_id: item.item_id,
    item_name: name,
    item_spec: item.item_desc,
    item_unit: item.item_unit,
    item_quantity: formatQuantity(quantity),
    price_value: item.price_latest,
    order_name: item.item_name_order || name,
    order_tag: selfPay ? SELF_PAY_TAG : undefined,
  };
}

export type OrderAttatchSelectedItem = {
  item_id?: number;
  item_name?: string;
  item_spec?: string;
  item_quantity?: number;
  _categoryType?: string;
};

export function buildAttachSubListsFromSelectedItems(
  items: OrderAttatchSelectedItem[],
): {
  charge_list: OrderSubChargeRow[];
  material_list: OrderSubMaterialRow[];
} {
  const charge_list: OrderSubChargeRow[] = [];
  const material_list: OrderSubMaterialRow[] = [];

  items.forEach((item) => {
    if (item.item_id == null) return;
    const row = {
      item_id: item.item_id,
      item_name: item.item_name,
      item_spec: item.item_spec,
      item_quantity: formatQuantity(item.item_quantity),
    };
    if (item._categoryType === "MATERIAL") {
      material_list.push(row);
    } else {
      charge_list.push(row);
    }
  });

  return { charge_list, material_list };
}

export function isPrefabMaterialItemType(itemType?: string): boolean {
  return itemType === "输液器" || itemType === "注射器";
}

function buildChargeRowFromPrefabItem(
  item: PrefabDetailRow,
  selfPay: boolean,
): OrderSubChargeRow {
  const name = item.item_name ?? "";
  return {
    item_id: item.item_id,
    item_name: name,
    item_tag: item.item_tag,
    item_note: item.item_note,
    item_quantity: formatQuantity(item.item_quantity),
    order_name: name,
    order_tag: selfPay ? SELF_PAY_TAG : undefined,
  };
}

function buildMaterialRowFromPrefabItem(
  item: PrefabDetailRow,
  selfPay: boolean,
): OrderSubMaterialRow {
  const name = item.item_name ?? "";
  return {
    item_id: item.item_id,
    item_name: name,
    item_tag: item.item_tag,
    item_note: item.item_note,
    item_quantity: formatQuantity(item.item_quantity),
    order_name: name,
    order_tag: selfPay ? SELF_PAY_TAG : undefined,
  };
}

export function buildAttachRowsFromPrefabDetail(
  rowList: PrefabDetailRow[],
  selfPay: boolean,
): {
  charge_list: OrderSubChargeRow[];
  material_list: OrderSubMaterialRow[];
} {
  const charge_list: OrderSubChargeRow[] = [];
  const material_list: OrderSubMaterialRow[] = [];

  for (const item of rowList) {
    if (item.item_id == null) continue;
    if (isPrefabMaterialItemType(item.item_type)) {
      material_list.push(buildMaterialRowFromPrefabItem(item, selfPay));
    } else {
      charge_list.push(buildChargeRowFromPrefabItem(item, selfPay));
    }
  }

  return { charge_list, material_list };
}

export function buildMaterialRowFromRetrieveItem(
  item: RetrieveAttachItem,
  quantity: string | number | undefined,
  selfPay: boolean,
): OrderSubMaterialRow {
  const name = item.item_name ?? "";
  return {
    item_id: item.item_id,
    item_name: name,
    item_spec: item.item_spec,
    item_model: item.item_model,
    item_unit: item.item_unit,
    item_quantity: formatQuantity(quantity),
    price_value: item.price_latest,
    order_name: item.item_name_order || name,
    order_tag: selfPay ? SELF_PAY_TAG : undefined,
  };
}
