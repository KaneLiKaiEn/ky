import { useEffect, useMemo, useState } from "react";
import { App, Empty, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { getItemPropertyAPI } from "@/api/drug";
import { getOrderPropertyAPI, getOrderSubListAPI } from "@/api/ordent";
import type { GetOrderSubListRes } from "@/types/ordent";
import type { OrderWorkspaceKind } from "./orderCatalogFilters";

/** 与 proto dec、orderAttachUtils 数量展示一致：最多保留位数，并去掉尾随 0 */
const MAX_DECIMAL_DIGITS = 6;

export interface OrderFeeDetailItemRow {
  key: string;
  item_name?: string;
  item_spec?: string;
  item_quantity?: string;
  item_unit?: string;
  amount_value?: string;
}

function formatDecimalValue(value?: string | number | null): string {
  if (value == null || value === "") return "-";
  const n = parseFloat(String(value));
  return Number.isFinite(n) ? parseFloat(n.toFixed(MAX_DECIMAL_DIGITS)).toString() : String(value);
}

function parseDecimal(value?: string | number | null): number {
  if (value == null || value === "") return 0;
  const n = parseFloat(String(value));
  return Number.isFinite(n) ? n : 0;
}

type SubListItem = {
  sub_id?: number;
  serial_no?: number;
  item_id?: number;
  item_name?: string;
  item_spec?: string;
  item_quantity?: string;
  item_unit?: string;
  amount_value?: string;
};

/** 长期医嘱药品没有后端金额，按 item_id 取目录最新价 */
async function fetchLongTermDrugPrices(
  drugList: GetOrderSubListRes["drug_list"],
): Promise<Map<number, string>> {
  const itemIds = [
    ...new Set(
      (drugList ?? [])
        .map((item) => item.item_id)
        .filter((id): id is number => id != null && id > 0),
    ),
  ];
  const priceByItemId = new Map<number, string>();
  if (itemIds.length === 0) return priceByItemId;

  const results = await Promise.all(
    itemIds.map((item_id) => getItemPropertyAPI({ item_id }).catch(() => null)),
  );
  itemIds.forEach((itemId, index) => {
    const res = results[index];
    if (res?.code !== 0) return;
    const prop = res.item_property;
    if (prop == null) return;
    const unitPrice = formatDecimalValue(
      parseDecimal(prop.price_latest) / parseDecimal(prop.price_quantity)
    );
    if (unitPrice != null) {
      priceByItemId.set(itemId, unitPrice);
    }
  });
  return priceByItemId;
}

function collectFeeDetailItems(
  res: GetOrderSubListRes,
  drugPriceByItemId?: ReadonlyMap<number, string>,
): OrderFeeDetailItemRow[] {
  const groups: Array<{ prefix: string; list?: SubListItem[] }> = [
    { prefix: "drug", list: res.drug_list },
    { prefix: "service", list: res.service_list },
    { prefix: "material", list: res.material_list },
    { prefix: "charge", list: res.charge_list },
    { prefix: "blood", list: res.blood_list },
    { prefix: "milk", list: res.milk_list },
    { prefix: "nutrition", list: res.nutrition_list },
  ];

  const rows: Array<OrderFeeDetailItemRow & { serial_no?: number }> = [];
  for (const { prefix, list } of groups) {
    if (!list?.length) continue;
    for (const item of list) {
      const subId = item.sub_id;
      const latestPrice =
        prefix === "drug" && item.item_id != null
          ? drugPriceByItemId?.get(item.item_id)
          : undefined;
      rows.push({
        key: `${prefix}-${subId ?? rows.length}`,
        serial_no: item.serial_no,
        item_name: item.item_name,
        item_spec: item.item_spec,
        item_quantity: item.item_quantity,
        item_unit: item.item_unit,
        amount_value:
          latestPrice != null && latestPrice !== ""
            ? latestPrice
            : item.amount_value,
      });
    }
  }

  rows.sort((a, b) => (a.serial_no ?? 0) - (b.serial_no ?? 0));
  return rows.map(({ serial_no: _serial, ...row }) => row);
}

interface OrderFeeDetailTableProps {
  orderId: number | null;
  kind: OrderWorkspaceKind;
}

const OrderFeeDetailTable = ({ orderId, kind }: OrderFeeDetailTableProps) => {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<OrderFeeDetailItemRow[]>([]);
  const [execDeptName, setExecDeptName] = useState<string>();

  useEffect(() => {
    if (orderId == null) {
      setItems([]);
      setExecDeptName(undefined);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void (async () => {
      try {
        const [propertyRes, subListRes] = await Promise.all([
          getOrderPropertyAPI({ order_id: orderId }),
          getOrderSubListAPI({ order_id: orderId, column_drug: "*", column_service: "*", column_material: "*", column_charge: "*" }),
        ]);

        if (cancelled) return;

        if (propertyRes.code !== 0) {
          message.error(
            propertyRes.message || propertyRes.hint || "获取医嘱属性失败",
          );
          setItems([]);
          setExecDeptName(undefined);
          return;
        }
        if (subListRes.code !== 0) {
          message.error(
            subListRes.message || subListRes.hint || "获取医嘱明细失败",
          );
          setItems([]);
          setExecDeptName(propertyRes.order_property?.exec_dept_name);
          return;
        }

        setExecDeptName(propertyRes.order_property?.exec_dept_name);
        const drugPriceByItemId =
          kind === "longTerm"
            ? await fetchLongTermDrugPrices(subListRes.drug_list)
            : undefined;
        if (cancelled) return;
        setItems(collectFeeDetailItems(subListRes, drugPriceByItemId));
      } catch {
        if (!cancelled) {
          message.error("获取医嘱明细失败");
          setItems([]);
          setExecDeptName(undefined);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [orderId, kind, message]);

  const amountTotal = useMemo(
    () =>
      items.reduce((sum, row) => sum + parseDecimal(row.amount_value), 0),
    [items],
  );

  const amountTitle =
    amountTotal > 0
      ? `金额（合计：${formatDecimalValue(amountTotal)}）`
      : "金额";

  const columns = useMemo<ColumnsType<OrderFeeDetailItemRow>>(
    () => [
      {
        title: "名称",
        dataIndex: "item_name",
        ellipsis: true,
        render: (value?: string) => value || "-",
      },
      {
        title: "规格",
        dataIndex: "item_spec",
        ellipsis: true,
        width: 180,
        render: (value?: string) => value || "-",
      },
      {
        title: "数量",
        dataIndex: "item_quantity",
        width: 72,
        align: "right",
        render: (value?: string) => formatDecimalValue(value),
      },
      {
        title: "单位",
        dataIndex: "item_unit",
        width: 64,
        align: "center",
        render: (value?: string) => value || "-",
      },
      {
        title: amountTitle,
        dataIndex: "amount_value",
        width: 180,
        align: "right",
        render: (value?: string) => formatDecimalValue(value),
      },
      {
        title: "执行科室",
        key: "exec_dept_name",
      },
      {
        title: "执行科室",
        key: "exec_dept_name",
        width: 180,
        ellipsis: true,
        render: () => execDeptName || "-",
      },
    ],
    [amountTitle, execDeptName],
  );

  return (
    <div className="mt-2 flex max-h-44 min-h-0 shrink-0 flex-col border-t border-(--app-theme-border) pt-2">
      <div className="mb-1 shrink-0 text-[12px] font-medium text-(--app-theme-text-secondary)">
        费用明细
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        <Table<OrderFeeDetailItemRow>
          size="small"
          bordered
          rowKey="key"
          loading={loading}
          columns={columns}
          dataSource={items}
          pagination={false}
          scroll={{ y: 120 }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={orderId == null ? "请选择医嘱" : "暂无明细"}
              />
            ),
          }}
          className="[&_.ant-table]:text-[12px]"
        />
      </div>
    </div>
  );
};

export default OrderFeeDetailTable;
