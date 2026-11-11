import { message, Space, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { getVisitProperty2API } from "@/api/visit";
import "./orderHandle.scss";

const TABLE_HEADER_FALLBACK = 39;
/** 列宽合计（含勾选列），用于横向滚动阈值 */
const TABLE_SCROLL_X = 1428;

const patientColumns: ColumnsType<any> = [
  {
    title: "床号",
    dataIndex: "bed_no",
    key: "bed_no",
    width: 72,
    render: (text: string) => text || "-",
  },
  {
    title: "姓名",
    dataIndex: "patient_name",
    key: "patient_name",
    width: 80,
    render: (text: string) => text || "-",
  },
  {
    title: "住院号",
    dataIndex: "visit_no",
    key: "visit_no",
    width: 96,
    render: (text: string | number) => text || "-",
  },
];

const baseColumns: ColumnsType<any> = [
  {
    title: "类型",
    dataIndex: "order_type",
    key: "order_type",
    width: 80,
  },
  {
    title: "类别",
    dataIndex: "order_catalog",
    key: "order_catalog",
    width: 64,
  },
  {
    title: "医嘱内容",
    dataIndex: "order_content",
    key: "order_content",
  },
  {
    title: "用法",
    dataIndex: "order_usage",
    key: "order_usage",
    width: 200,
  },
  {
    title: "医嘱时间",
    dataIndex: "order_time",
    key: "order_time",
    width: 136,
    render: (text: string) =>
      text ? dayjs(text).format("YYYY-MM-DD HH:mm") : "-",
  },
  {
    title: "标记",
    dataIndex: "order_tag",
    key: "order_tag",
    width: 80,
    render: (text: string) => {
      if (!text) return null;
      const tags = [...text.matchAll(/\[([^\]]+)\]/g)].map((m) => m[1]);
      if (!tags.length) return null;
      return (
        <Space size={2} wrap>
          {tags.map((tag) => (
            <Tag key={tag} color="error" className="m-0! px-1! text-xs">
              {tag}
            </Tag>
          ))}
        </Space>
      );
    },
  },
];

export type OrderHandleReload = () => Promise<void>;

export interface OrderHandleTableActionCtx {
  actingId: string | number | null;
  setActingId: (id: string | number | null) => void;
  reload: OrderHandleReload;
}

export interface OrderHandleTableExtraCtx {
  selectedRowKeys: (string | number)[];
  reload: OrderHandleReload;
  clearSelection: () => void;
}

interface OrderHandleTableProps {
  wardId: number;
  fetchList: (params: { ward_id: number }) => Promise<any>;
  refreshKey?: number;
  showSelection?: boolean;
  rowFilter?: (row: any) => boolean;
  hideOrderType?: boolean;
  extraColumns?: (ctx: OrderHandleTableActionCtx) => ColumnsType<any>;
  extra?: (ctx: OrderHandleTableExtraCtx) => ReactNode;
}

function collectVisitIds(rows: any[]): number[] {
  return [
    ...new Set(
      rows
        .map((row) => Number(row?.visit_id))
        .filter((id) => Number.isFinite(id) && id > 0),
    ),
  ];
}

function mergeVisitProperty(rows: any[], propertyRes: any) {
  const patientByVisitId = new Map<number, any>();
  for (const patient of propertyRes?.patient_list || []) {
    const visitId = Number(patient?.visit_id);
    if (Number.isFinite(visitId) && visitId > 0) {
      patientByVisitId.set(visitId, patient);
    }
  }
  const ipByVisitId = new Map<number, any>();
  for (const ip of propertyRes?.ip_list || []) {
    const visitId = Number(ip?.visit_id);
    if (Number.isFinite(visitId) && visitId > 0) {
      ipByVisitId.set(visitId, ip);
    }
  }
  const visitByVisitId = new Map<number, any>();
  for (const visit of propertyRes?.visit_list || []) {
    const visitId = Number(visit?.visit_id);
    if (Number.isFinite(visitId) && visitId > 0) {
      visitByVisitId.set(visitId, visit);
    }
  }
  return rows.map((row) => {
    const visitId = Number(row?.visit_id);
    const patient = patientByVisitId.get(visitId);
    const ip = ipByVisitId.get(visitId);
    const visit = visitByVisitId.get(visitId);
    return {
      ...row,
      patient_name: patient?.patient_name ?? "",
      bed_no: ip?.bed_no ?? "",
      // 住院号来自 GetVisitProperty2.visit_list；业务仍用 visit_id
      visit_no: visit?.visit_no ?? "",
    };
  });
}

export default function OrderHandleTable({
  wardId,
  fetchList,
  refreshKey = 0,
  showSelection = false,
  rowFilter,
  hideOrderType = false,
  extraColumns,
  extra,
}: OrderHandleTableProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actingId, setActingId] = useState<string | number | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<(string | number)[]>(
    [],
  );
  const tableWrapRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(200);

  const loadList = useCallback(async () => {
    if (!wardId) {
      setData([]);
      setSelectedRowKeys([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetchList({ ward_id: wardId });
      if (res?.code !== 0) {
        message.error(`${res?.message || ""}${res?.hint || ""}`);
        setData([]);
        return;
      }
      const rowList = res.row_list || [];
      const visitIdList = collectVisitIds(rowList);
      if (!visitIdList.length) {
        setData(rowList);
        setSelectedRowKeys([]);
        return;
      }
      const propertyRes = await getVisitProperty2API({
        visit_id_list: visitIdList,
        column_ip: "*",
        column_patient: "*",
        column_visit: "*",
      });
      if (propertyRes?.code !== 0) {
        message.error(
          `${propertyRes?.message || ""}${propertyRes?.hint || ""}`,
        );
        setData(rowList);
        setSelectedRowKeys([]);
        return;
      }
      setData(mergeVisitProperty(rowList, propertyRes));
      setSelectedRowKeys([]);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [fetchList, wardId, refreshKey]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const filteredData = useMemo(
    () => (rowFilter ? data.filter(rowFilter) : data),
    [data, rowFilter],
  );

  const visibleSelectedRowKeys = useMemo(() => {
    const visibleKeys = new Set(
      filteredData.map((row) => row.order_id ?? row.implement_id ?? row.key),
    );
    return selectedRowKeys.filter((key) => visibleKeys.has(key));
  }, [filteredData, selectedRowKeys]);

  const columns: ColumnsType<any> = [
    ...patientColumns,
    ...(hideOrderType
      ? baseColumns.filter((col) => col.key !== "order_type")
      : baseColumns),
    ...(extraColumns?.({ actingId, setActingId, reload: loadList }) ?? []),
  ];

  // 与 DeptPatientWidget 一致：按容器实测高度设置表格纵轴滚动
  useLayoutEffect(() => {
    const el = tableWrapRef.current;
    if (!el) return;

    const update = () => {
      const header =
        (el.querySelector(".ant-table-header") as HTMLElement | null) ??
        (el.querySelector(".ant-table-thead") as HTMLElement | null);
      const headerH = header?.offsetHeight || TABLE_HEADER_FALLBACK;
      const next = Math.max(el.clientHeight - headerH, 80);
      setScrollY((prev) => (prev === next ? prev : next));
    };

    const ro = new ResizeObserver(update);
    ro.observe(el);
    update();
    return () => ro.disconnect();
  }, [loading, filteredData.length]);

  return (
    <div className="order-handle-widget p-2">
      {extra ? (
        <div className="order-handle-widget__toolbar">
          {extra({
            selectedRowKeys: visibleSelectedRowKeys,
            reload: loadList,
            clearSelection: () => setSelectedRowKeys([]),
          })}
        </div>
      ) : null}
      <div
        ref={tableWrapRef}
        className="order-handle-widget__table-wrap"
        style={
          {
            "--table-body-height": `${scrollY}px`,
          } as CSSProperties
        }
      >
        <Table
          size="small"
          dataSource={filteredData}
          columns={columns}
          loading={loading}
          rowKey={(record) =>
            record.order_id ?? record.implement_id ?? record.key
          }
          pagination={false}
          scroll={{ x: TABLE_SCROLL_X, y: scrollY }}
          rowSelection={
            showSelection
              ? {
                  fixed: true,
                  selectedRowKeys,
                  onChange: (keys) =>
                    setSelectedRowKeys(
                      keys.map((key) =>
                        typeof key === "bigint" ? Number(key) : key,
                      ),
                    ),
                }
              : undefined
          }
        />
      </div>
    </div>
  );
}
