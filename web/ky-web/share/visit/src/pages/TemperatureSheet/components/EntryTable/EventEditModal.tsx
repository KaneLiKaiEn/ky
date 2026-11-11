import { useState, useEffect, useCallback } from "react";
import { AutoComplete, Button, Modal, Radio, Select, Table, message } from "antd";
import {
  saveVisitValueListAPI,
  getVisitValueListAPI,
  getElemListAPI,
  retrieveCatalogListAPI,
} from "../../api";
import type { VisitValueRow } from "../../types";

const TIME_POINT_OPTIONS = [
  { value: "2" },
  { value: "6" },
  { value: "10" },
  { value: "14" },
  { value: "18" },
  { value: "22" },
];

interface EventRow {
  _key: string;
  valueId?: number;
  elemId?: number;
  elemName: string;
  date: string;
  time: string;
  valueScore: string;
  valueText: string;
}

/** 当前时间 HH:mm，供空白行默认填写 */
const getCurrentTime = () => {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
};

const createEmptyRow = (selectedDate: string): EventRow => ({
  _key: String(Date.now()),
  elemName: "",
  date: selectedDate,
  time: getCurrentTime(),
  valueScore: "",
  valueText: "否",
});

export interface EventEditModalProps {
  open: boolean;
  visitId?: number;
  onClose: () => void;
  onSaved?: () => void;
  selectedDate: string;
}

/** 床头事件编辑弹窗（参考 sign-entry EventEditModal） */
export default function EventEditModal({
  open,
  visitId,
  onClose,
  onSaved,
  selectedDate,
}: EventEditModalProps) {
  const [rows, setRows] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [elemList, setElemList] = useState<{ value: number; label: string }[]>(
    [],
  );

  const fetchElemList = useCallback(async () => {
    try {
      const res = await retrieveCatalogListAPI({
        catalog_type: "ELEM.CLINIC",
        retrieve_input: "床头事件",
      });
      const catalog = res.catalog_list?.[0];
      if (!catalog) return;
      const elemRes = await getElemListAPI({ catalog_id: catalog.catalog_id });
      setElemList(
        (elemRes.row_list ?? []).map((item: any) => ({
          value: item.elem_id,
          label: item.elem_name_last,
        })),
      );
    } catch {
      setElemList([]);
    }
  }, []);

  const fetchData = useCallback(async () => {
    if (!visitId) return;
    setLoading(true);
    try {
      const res: any = await getVisitValueListAPI({
        visit_id: visitId,
        link_value: visitId,
        link_name: "bpt",
      });
      const list: VisitValueRow[] = res?.value_list || [];
      const mapped = list.map((item) => {
        const [date, timePart] = (item.value_time || "").split(" ");
        const time = timePart ? timePart.substring(0, 5) : "";
        return {
          _key: String(item.value_id ?? Math.random()),
          valueId: item.value_id,
          elemId: item.elem_id,
          elemName: item.elem_name ? item.elem_name.split("|").pop()! : "",
          date: date || selectedDate,
          time,
          valueScore:
            item.value_score !== undefined ? String(item.value_score) : "",
          valueText: item.value_text || "否",
        };
      });
      setRows([...mapped, createEmptyRow(selectedDate)]);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [visitId, selectedDate]);

  useEffect(() => {
    if (open && visitId) {
      void fetchElemList();
      void fetchData();
    }
  }, [open, visitId, fetchElemList, fetchData]);

  const addRow = () => {
    setRows((prev) => [...prev, createEmptyRow(selectedDate)]);
  };

  const deleteRow = (_key: string) => {
    setRows((prev) => prev.filter((r) => r._key !== _key));
  };

  const updateRow = (_key: string, field: keyof EventRow, value: any) => {
    setRows((prev) =>
      prev.map((r) => (r._key === _key ? { ...r, [field]: value } : r)),
    );
  };

  const handleSave = async () => {
    if (!visitId) return;
    setSaving(true);
    try {
      const value_list: VisitValueRow[] = rows
        .filter((r) => r.elemId)
        .map((r) => ({
          value_id: r.valueId,
          elem_id: r.elemId,
          elem_name: r.elemName,
          value_time:
            r.date && r.time
              ? `${r.date} ${r.time}:00`
              : r.date
                ? `${r.date} 00:00:00`
                : undefined,
          value_score: r.valueScore !== "" ? Number(r.valueScore) : undefined,
          value_text: r.valueText,
        }));
      const res = await saveVisitValueListAPI({
        visit_id: visitId,
        link_value: visitId,
        link_name: "bpt",
        value_list,
      });
      if (res?.code !== 0) {
        message.error(
          `${res?.message || "保存失败"}${res?.hint ? `（${res.hint}）` : ""}`,
        );
        return;
      }
      message.success("保存成功");
      onSaved?.();
      onClose();
    } catch {
      message.error("保存失败");
    } finally {
      setSaving(false);
    }
  };

  const eventTableColumns = [
    {
      title: "事件名称",
      key: "elemName",
      width: 120,
      render: (_: any, row: EventRow) => (
        <Select
          value={row.elemName || undefined}
          showSearch
          options={elemList}
          style={{ width: "100%" }}
          size="small"
          placeholder="请选择"
          onChange={(v, option: any) => {
            updateRow(row._key, "elemId", v);
            updateRow(row._key, "elemName", option.label);
            setRows((prev) => {
              const last = prev[prev.length - 1];
              if (last._key === row._key) {
                return [...prev, createEmptyRow(selectedDate)];
              }
              return prev;
            });
          }}
          filterOption={(input, option) =>
            (option?.label as string)?.includes(input)
          }
        />
      ),
    },
    {
      title: "事件记录日期",
      key: "date",
      width: 140,
      render: (_: any, row: EventRow) => (
        <input
          type="date"
          className="w-full border-0 bg-transparent text-center outline-none"
          value={row.date}
          onChange={(e) => updateRow(row._key, "date", e.target.value)}
        />
      ),
    },
    {
      title: "事件记录时间",
      key: "time",
      width: 120,
      render: (_: any, row: EventRow) => (
        <input
          type="time"
          className="w-full border-0 bg-transparent text-center outline-none"
          value={row.time}
          onChange={(e) => updateRow(row._key, "time", e.target.value)}
        />
      ),
    },
    {
      title: "事件时间点",
      key: "valueScore",
      width: 90,
      render: (_: any, row: EventRow) => (
        <AutoComplete
          value={row.valueScore || undefined}
          options={TIME_POINT_OPTIONS}
          style={{ width: "100%" }}
          size="small"
          placeholder="请选择"
          allowClear
          onChange={(v) => updateRow(row._key, "valueScore", v ?? "")}
          filterOption={(input, option) =>
            String(option?.value ?? "").includes(input)
          }
        />
      ),
    },
    {
      title: "是否隐藏",
      key: "valueText",
      width: 110,
      render: (_: any, row: EventRow) => (
        <Radio.Group
          value={row.valueText}
          onChange={(e) => updateRow(row._key, "valueText", e.target.value)}
          size="small"
        >
          <Radio value="否">否</Radio>
          <Radio value="是">是</Radio>
        </Radio.Group>
      ),
    },
    {
      title: "操作",
      key: "action",
      width: 60,
      align: "center" as const,
      render: (_: any, row: EventRow) => (
        <Button
          type="link"
          danger
          size="small"
          onClick={() => deleteRow(row._key)}
        >
          删除
        </Button>
      ),
    },
  ];

  return (
    <Modal
      title="编辑床头事件"
      open={open}
      onCancel={onClose}
      width={960}
      footer={null}
      destroyOnHidden
    >
      <div>
        <div className="mb-2 text-gray-500">当前记录的所有床头事件</div>
        <Table
          columns={eventTableColumns}
          dataSource={rows}
          rowKey="_key"
          loading={loading}
          pagination={false}
          size="small"
          bordered
          locale={{ emptyText: "暂无床头事件" }}
        />
        <div className="mt-3 flex justify-end gap-2">
          <Button onClick={addRow}>添 加</Button>
          <Button type="primary" loading={saving} onClick={handleSave}>
            保 存
          </Button>
        </div>
      </div>
    </Modal>
  );
}
