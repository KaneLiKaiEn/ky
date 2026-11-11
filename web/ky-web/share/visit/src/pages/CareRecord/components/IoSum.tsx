import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import {
  Button,
  Checkbox,
  DatePicker,
  Empty,
  Listy,
  Modal,
  Spin,
  Table,
  message,
} from "antd";
import TextArea from "antd/es/input/TextArea";
import type { ColumnsType } from "antd/es/table";
import dayjs, { type Dayjs } from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { getSessionId } from "comm/session";
import {
  deleteIoSumAPI,
  getIoListAPI,
  getIoSumListAPI,
  getIoSumPropertyAPI,
  getSessionInfoAPI,
  newCareAPI,
  newIoSumAPI,
} from "../api";
import { formatDateTimeMinute } from "../utils/time-func";

interface IoSumRow {
  sum_id: number;
  org_id?: number;
  visit_id?: number;
  user_id?: number;
  user_name?: string;
  sum_time?: string;
  sum_start?: string;
  sum_end?: string;
  sum_in?: string;
  sum_in_detail?: string;
  sum_out?: string;
  sum_out_detail?: string;
  sum_note?: string;
}

interface IoListRow {
  io_id: number;
  io_type?: string;
  io_time?: string;
  item_name?: string;
  item_unit?: string;
  io_quantity?: string;
  io_ml?: string;
  item_trait?: string;
  item_color?: string;
  item_note?: string;
}

interface DetailDisplayRow {
  key: string;
  time: string;
  intake: string;
  output: string;
}

interface IoSumProps {
  open: boolean;
  onClose: () => void;
  visitId: number;
  userId: string | number;
  userName: string;
  onChanged?: () => void;
}

const fmtApi = (d: Dayjs) => d.format("YYYY-MM-DD HH:mm:00");

const defaultRange = () => {
  const end = dayjs().hour(7).minute(0).second(0).millisecond(0);
  const start = end.subtract(1, "day");
  return { start, end, careTime: end };
};

const rangeHours = (start: Dayjs, end: Dayjs) => {
  const hours = Math.round(end.diff(start, "hour", true));
  return hours > 0 ? hours : 24;
};

const hoursFromSum = (sum?: Pick<IoSumRow, "sum_start" | "sum_end"> | null) => {
  if (!sum?.sum_start || !sum?.sum_end) return 24;
  const start = dayjs(sum.sum_start);
  const end = dayjs(sum.sum_end);
  if (!start.isValid() || !end.isValid()) return 24;
  return rangeHours(start, end);
};

const buildCareContent = (
  sum?: Pick<
    IoSumRow,
    "sum_start" | "sum_end" | "sum_in_detail" | "sum_out_detail"
  > | null,
) => {
  if (!sum) return "";
  const hours = hoursFromSum(sum);
  return `${hours}H${sum.sum_in_detail || ""}${sum.sum_out_detail || ""}`;
};

const formatQuantity = (value?: string) => {
  if (value == null || value === "") return "";
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return String(parseFloat(num.toFixed(4)));
};

const formatItemText = (item: IoListRow) => {
  const name = item.item_name || "";
  const qty = formatQuantity(item.io_quantity || item.io_ml);
  const unit = item.item_unit || "";
  if (!name && !qty) return "";
  if (!qty) return name;
  return `${name}: ${qty}${unit}`;
};

/** 接口返回几条就展示几行 */
const buildDetailRows = (items: IoListRow[]): DetailDisplayRow[] =>
  [...items]
    .sort((a, b) => {
      const ta = dayjs(a.io_time || "").valueOf() || 0;
      const tb = dayjs(b.io_time || "").valueOf() || 0;
      return ta - tb;
    })
    .map((item) => {
      const text = formatItemText(item);
      const isOut = item.io_type === "O";
      return {
        key: String(item.io_id),
        time: formatDateTimeMinute(item.io_time || ""),
        intake: isOut ? "" : text,
        output: isOut ? text : "",
      };
    });

export default function IoSum({
  open,
  onClose,
  visitId,
  userId,
  userName,
  onChanged,
}: IoSumProps) {
  const [loading, setLoading] = useState(false);
  const [itemLoading, setItemLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [orgId, setOrgId] = useState<number>(0);
  const [sumList, setSumList] = useState<IoSumRow[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [ioItemList, setIoItemList] = useState<IoListRow[]>([]);
  const [detailText, setDetailText] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [writeCare, setWriteCare] = useState(true);
  const [sumStart, setSumStart] = useState<Dayjs | null>(null);
  const [sumEnd, setSumEnd] = useState<Dayjs | null>(null);
  const [careTime, setCareTime] = useState<Dayjs | null>(null);

  const selected = useMemo(
    () => sumList.find((item) => item.sum_id === selectedId) || null,
    [sumList, selectedId],
  );

  const detailRows = useMemo(() => buildDetailRows(ioItemList), [ioItemList]);

  const detailTitle = selected
    ? `入出量明细: ${formatDateTimeMinute(selected.sum_start || "")} ~ ${formatDateTimeMinute(selected.sum_end || "")}`
    : "入出量明细:";

  const detailColumns: ColumnsType<DetailDisplayRow> = [
    {
      title: "时间",
      dataIndex: "time",
      key: "time",
      width: 140,
    },
    {
      title: "入量",
      dataIndex: "intake",
      key: "intake",
      render: (value: string) =>
        value ? (
          <span className="text-(--app-theme-primary)">{value}</span>
        ) : (
          ""
        ),
    },
    {
      title: "出量",
      dataIndex: "output",
      key: "output",
      render: (value: string) =>
        value ? (
          <span className="text-(--app-theme-primary)">{value}</span>
        ) : (
          ""
        ),
    },
  ];

  const ensureOrgId = async () => {
    if (orgId) return orgId;
    const sessionRes = await getSessionInfoAPI({
      session_id: getSessionId(),
    });
    if (sessionRes.code == 0) {
      const nextOrgId = Number(sessionRes.session_info?.org_id) || 0;
      setOrgId(nextOrgId);
      return nextOrgId;
    }
    return 0;
  };

  const loadItemList = async (sum: IoSumRow | null) => {
    if (!sum?.sum_id) {
      setIoItemList([]);
      setDetailText("");
      return;
    }
    setItemLoading(true);
    try {
      const nextOrgId = await ensureOrgId();
      const res = await getIoListAPI({
        org_id: nextOrgId,
        visit_id: visitId,
        io_start: sum.sum_start,
        io_end: sum.sum_end,
      });
      if (res.code != 0) {
        message.error(res.message || "加载明细失败");
        setIoItemList([]);
        return;
      }
      const rows: IoListRow[] = (res.row_list || []).map((item: any) => ({
        ...item,
        io_id: Number(item.io_id),
      }));
      setIoItemList(rows);
      setDetailText(buildCareContent(sum));
    } catch {
      setIoItemList([]);
    } finally {
      setItemLoading(false);
    }
  };

  const loadList = async (preferId?: number) => {
    if (!visitId) return;
    setLoading(true);
    try {
      const nextOrgId = await ensureOrgId();
      const res = await getIoSumListAPI({
        org_id: nextOrgId,
        visit_id: visitId,
      });
      if (res.code != 0) {
        message.error(res.message || "加载统计列表失败");
        setSumList([]);
        setSelectedId(null);
        setIoItemList([]);
        setDetailText("");
        return;
      }
      const rows: IoSumRow[] = (res.row_list || []).map((item: any) => ({
        ...item,
        sum_id: Number(item.sum_id),
      }));
      setSumList(rows);
      const nextSelected =
        preferId && rows.some((item) => item.sum_id === preferId)
          ? preferId
          : rows[0]?.sum_id || null;
      setSelectedId(nextSelected);
      const current = rows.find((item) => item.sum_id === nextSelected) || null;
      await loadItemList(current);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    void loadList();
  }, [open, visitId]);

  const openAddModal = () => {
    const range = defaultRange();
    setSumStart(range.start);
    setSumEnd(range.end);
    setCareTime(range.careTime);
    setWriteCare(true);
    setAddOpen(true);
  };

  const handleSelect = (item: IoSumRow) => {
    setSelectedId(item.sum_id);
    void loadItemList(item);
  };

  const handleAddOk = async () => {
    if (!sumStart || !sumEnd) {
      message.warning("请选择统计时间");
      return;
    }
    if (writeCare && !careTime) {
      message.warning("请选择写入护理记录时间");
      return;
    }

    setSaving(true);
    try {
      const nextOrgId = await ensureOrgId();
      const startText = fmtApi(sumStart);
      const endText = fmtApi(sumEnd);
      const createRes = await newIoSumAPI({
        org_id: nextOrgId,
        visit_id: visitId,
        sum_start: startText,
        sum_end: endText,
      });
      if (createRes.code != 0) {
        message.error(createRes.message || "新增统计失败");
        return;
      }

      const sum_id = Number(createRes.sum_id);
      const propRes = await getIoSumPropertyAPI({ sum_id });
      if (propRes.code != 0 || !propRes.sum_property) {
        message.error(propRes.message || "获取统计详情失败");
        await loadList(sum_id);
        return;
      }

      const property = propRes.sum_property;
      const careContent = buildCareContent({
        sum_start: startText,
        sum_end: endText,
        sum_in_detail: property.sum_in_detail,
        sum_out_detail: property.sum_out_detail,
      });
      let careFailed = false;
      if (writeCare) {
        try {
          const careRes = await newCareAPI({
            visit_id: visitId,
            user_id: Number(userId),
            user_name: userName,
            care_time: fmtApi(careTime!),
            care_content: careContent,
            health_level: "一般",
          });
          if (careRes.code != 0) {
            careFailed = true;
            message.error(careRes.message || "写入护理记录失败");
          }
        } catch {
          // request 拦截器已弹出 /care/NewCare 的错误信息，这里继续走关闭刷新流程
          careFailed = true;
        }
      }

      onChanged?.();
      setAddOpen(false);
      await loadList(sum_id);
      setDetailText(careContent);
      if (!careFailed) {
        message.success("新增成功");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!selectedId) {
      message.warning("请先选择一条统计记录");
      return;
    }
    Modal.confirm({
      title: "确认删除",
      content: "是否确认删除该统计记录？",
      okText: "确认",
      okType: "danger",
      onOk: async () => {
        const res = await deleteIoSumAPI({ sum_id: selectedId });
        if (res.code == 0) {
          message.success("已删除");
          await loadList();
        } else {
          message.error(res.message || "删除失败");
        }
      },
    });
  };

  const renderSumItem = (item: IoSumRow) => {
    const active = item.sum_id === selectedId;
    return (
      <div
        onClick={() => handleSelect(item)}
        className={[
          "cursor-pointer px-2 py-2",
          active
            ? "bg-(--app-theme-primary-bg)!"
            : "hover:bg-(--app-theme-bg-fill-alter)!",
        ].join(" ")}
      >
        <div className="flex w-max min-w-full flex-col gap-1">
          <div
            className="whitespace-nowrap text-(length:--app-theme-font-default) text-(--app-theme-text)"
            title={`${formatDateTimeMinute(item.sum_start || "")} 到 ${formatDateTimeMinute(item.sum_end || "")}`}
          >
            {formatDateTimeMinute(item.sum_start || "")} 到{" "}
            {formatDateTimeMinute(item.sum_end || "")}
          </div>
          <div
            className="whitespace-nowrap text-(length:--app-theme-font-sm) text-(--app-theme-text-secondary)"
            title={`${item.user_name || "-"} ${formatDateTimeMinute(item.sum_time || "")}`}
          >
            {item.user_name || "-"} {formatDateTimeMinute(item.sum_time || "")}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Modal
        title="统计"
        open={open}
        onCancel={onClose}
        width={1000}
        footer={
          <div className="flex justify-end gap-2">
            <Button size="small" onClick={onClose}>
              关闭
            </Button>
          </div>
        }
        destroyOnHidden
      >
        <div className="flex h-[440px] w-full items-stretch gap-3">
          <div className="flex w-1/3 min-w-0 flex-col">
            <div className="mb-2 flex shrink-0 items-center justify-between">
              <span>统计记录</span>
              <div className="flex items-center gap-2">
                <Button
                  size="small"
                  type="primary"
                  icon={<PlusOutlined />}
                  title="新增"
                  onClick={openAddModal}
                />
                <Button
                  size="small"
                  type="primary"
                  danger
                  icon={<DeleteOutlined />}
                  title="删除"
                  onClick={handleDelete}
                />
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-auto border border-(--app-theme-border)">
              {loading ? (
                <div className="flex h-full items-center justify-center py-8">
                  <Spin />
                </div>
              ) : sumList.length === 0 ? (
                <div className="flex h-full items-center justify-center p-2">
                  <Empty description="请先新增统计" />
                </div>
              ) : (
                <Listy<IoSumRow>
                  items={sumList}
                  className="inline-block min-w-full"
                  rowKey={(row) => String(row.sum_id)}
                  styles={{ item: { padding: 0 } }}
                  itemRender={(row) => renderSumItem(row)}
                />
              )}
            </div>
          </div>

          <div className="flex w-2/3 min-w-0 flex-col">
            {!selectedId ? (
              <div className="flex h-full items-center justify-center">
                <Empty description="请先选择统计记录" />
              </div>
            ) : (
              <>
                <div className="mb-1 shrink-0">{detailTitle}</div>
                <Table
                  size="small"
                  bordered
                  pagination={false}
                  rowKey="key"
                  loading={itemLoading}
                  dataSource={detailRows}
                  columns={detailColumns}
                  scroll={{ y: 260 }}
                  className="h-[312px]"
                  locale={{ emptyText: "暂无明细" }}
                />
                <TextArea
                  rows={4}
                  className="mt-2"
                  value={detailText}
                  onChange={(e) => setDetailText(e.target.value)}
                />
              </>
            )}
          </div>
        </div>
      </Modal>

      <Modal
        title="新增统计"
        open={addOpen}
        onCancel={() => setAddOpen(false)}
        width={720}
        confirmLoading={saving}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setAddOpen(false)}>取消</Button>
            <Button
              type="primary"
              loading={saving}
              onClick={() => void handleAddOk()}
            >
              确定
            </Button>
          </div>
        }
        destroyOnHidden
      >
        <div className="flex flex-col gap-3 py-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="shrink-0">统计时间:</span>
            <DatePicker
              showTime={{ format: "HH:mm" }}
              format="MM-DD HH:mm"
              value={sumStart}
              onChange={(date) => setSumStart(date)}
              allowClear={false}
            />
            <span>到</span>
            <DatePicker
              showTime={{ format: "HH:mm" }}
              format="MM-DD HH:mm"
              value={sumEnd}
              onChange={(date) => setSumEnd(date)}
              allowClear={false}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Checkbox
              checked={writeCare}
              onChange={(e) => setWriteCare(e.target.checked)}
            >
              写入护理记录:
            </Checkbox>
            <DatePicker
              showTime={{ format: "HH:mm" }}
              format="MM-DD HH:mm"
              value={careTime}
              onChange={(date) => setCareTime(date)}
              disabled={!writeCare}
              allowClear={false}
            />
          </div>
        </div>
      </Modal>
    </>
  );
}
