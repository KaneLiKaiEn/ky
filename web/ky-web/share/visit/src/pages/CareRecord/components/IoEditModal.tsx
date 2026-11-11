import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  AutoComplete,
  Button,
  DatePicker,
  Input,
  Modal,
  Table,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import {
  deleteIoAPI,
  getIoListAPI,
  newIoAPI,
  saveIoPropertyAPI,
} from "../api";
import { dictOptions } from "../utils/care-related";
import { ensureDictData } from "../utils/dict-data";
import { getCurrentDateTime2 } from "../utils/time-func";
import IoSum from "./IoSum";

interface IoItem {
  row_key: string;
  io_id: number;
  io_type: "I" | "O";
  item_name: string;
  item_unit: string;
  io_quantity: string;
  item_note: string;
  io_ml: number;
  item_trait: string;
  item_color: string;
  io_method: string;
}

let rowSeed = 0;
const nextRowKey = (prefix: string) => `${prefix}-${Date.now()}-${++rowSeed}`;

const emptyIoItem = (ioType: "I" | "O"): IoItem => ({
  row_key: nextRowKey(ioType),
  io_id: 0,
  io_type: ioType,
  item_name: "",
  item_unit: "ml",
  io_quantity: "",
  item_note: "",
  io_ml: 0,
  item_trait: "",
  item_color: "",
  io_method: "",
});

const isBlankIoItem = (item?: IoItem) =>
  !item ||
  (!item.item_name &&
    !item.io_quantity &&
    !item.item_note &&
    !item.io_method &&
    !item.item_color &&
    !item.item_trait);

const NEAR_BOTTOM_PX = 48;
const TABLE_BODY_MIN_H = 80;

const toQty2 = (value: string | number) => {
  const num = parseFloat(String(value));
  if (Number.isNaN(num)) return "";
  return num.toFixed(2);
};

const isQtyInput = (value: string) => /^\d*\.?\d{0,2}$/.test(value);

const mapIoRow = (item: any, ioType: "I" | "O"): IoItem => ({
  row_key: `id-${item.io_id}`,
  io_id: Number(item.io_id),
  io_type: ioType,
  item_name: item.item_name || "",
  item_unit: item.item_unit || "ml",
  io_quantity:
    item.io_quantity == null || item.io_quantity === ""
      ? ""
      : toQty2(item.io_quantity),
  item_note: item.item_note || "",
  io_ml: Number(toQty2(item.io_quantity || item.io_ml || 0)) || 0,
  item_trait: item.item_trait || "",
  item_color: item.item_color || "",
  io_method: item.io_method || "",
});

interface IoEditModalProps {
  active: boolean;
  visitId: number;
  careTime: string;
  userId: string | number;
  userName: string;
  onChanged: () => void;
  onSaved: () => void;
  onTimeChange?: (time: string) => void;
  onCancel?: () => void;
}

export default function IoEditModal(props: IoEditModalProps) {
  const {
    active,
    visitId,
    careTime,
    userId,
    userName,
    onChanged,
    onSaved,
    onTimeChange,
    onCancel,
  } = props;
  const [ioTime, setIoTime] = useState(() => careTime || getCurrentDateTime2());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [iList, setIList] = useState<IoItem[]>([]);
  const [oList, setOList] = useState<IoItem[]>([]);
  const [iNameList, setINameList] = useState<any[]>([]);
  const [oNameList, setONameList] = useState<any[]>([]);
  const [iNoteList, setINoteList] = useState<any[]>([]);
  const [oNoteList, setONoteList] = useState<any[]>([]);
  const [ioColor, setIoColor] = useState<any[]>([]);
  const [ioTrait, setIoTrait] = useState<any[]>([]);
  const [ioMethod, setIoMethod] = useState<any[]>([]);
  const iListRef = useRef(iList);
  const oListRef = useRef(oList);
  iListRef.current = iList;
  oListRef.current = oList;
  const iWrapRef = useRef<HTMLDivElement>(null);
  const oWrapRef = useRef<HTMLDivElement>(null);
  const [iScrollY, setIScrollY] = useState(TABLE_BODY_MIN_H);
  const [oScrollY, setOScrollY] = useState(TABLE_BODY_MIN_H);
  const [sumOpen, setSumOpen] = useState(false);

  const loadList = (keepDrafts?: { i: IoItem[]; o: IoItem[] }) => {
    if (!ioTime) {
      setIList([emptyIoItem("I")]);
      setOList([emptyIoItem("O")]);
      return;
    }
    setLoading(true);
    getIoListAPI({
      visit_id: visitId,
      io_start: ioTime,
      io_end: ioTime,
    })
      .then((res: any) => {
        const rows = res?.row_list || [];
        const savedI = rows
          .filter((item: any) => item.io_type === "I")
          .map((item: any) => mapIoRow(item, "I"));
        const savedO = rows
          .filter((item: any) => item.io_type === "O")
          .map((item: any) => mapIoRow(item, "O"));
        const draftI =
          keepDrafts?.i.filter(
            (item) => !item.io_id && (item.item_name || item.io_quantity),
          ) || [];
        const draftO =
          keepDrafts?.o.filter(
            (item) => !item.io_id && (item.item_name || item.io_quantity),
          ) || [];
        setIList(
          savedI.length || draftI.length
            ? [...savedI, ...draftI]
            : [emptyIoItem("I")],
        );
        setOList(
          savedO.length || draftO.length
            ? [...savedO, ...draftO]
            : [emptyIoItem("O")],
        );
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!active) return;
    if (careTime) {
      setIoTime(careTime);
      return;
    }
    setIoTime((prev) => prev || getCurrentDateTime2());
  }, [active, careTime]);

  useEffect(() => {
    if (!active) return;
    loadList();
  }, [active, visitId, ioTime]);

  useLayoutEffect(() => {
    if (!active) return;

    const measure = (
      wrap: HTMLDivElement | null,
      setter: (next: number) => void,
    ) => {
      if (!wrap) return;
      const title = wrap.querySelector(
        ".ant-table-title",
      ) as HTMLElement | null;
      const header =
        (wrap.querySelector(".ant-table-header") as HTMLElement | null) ||
        (wrap.querySelector(".ant-table-thead") as HTMLElement | null);
      const next = Math.max(
        TABLE_BODY_MIN_H,
        Math.floor(
          wrap.clientHeight -
            (title?.offsetHeight || 0) -
            (header?.offsetHeight || 0),
        ),
      );
      setter(next);
    };

    const update = () => {
      measure(iWrapRef.current, (next) =>
        setIScrollY((prev) => (prev === next ? prev : next)),
      );
      measure(oWrapRef.current, (next) =>
        setOScrollY((prev) => (prev === next ? prev : next)),
      );
    };

    const wraps = [iWrapRef.current, oWrapRef.current].filter(
      Boolean,
    ) as HTMLDivElement[];
    const ro = new ResizeObserver(() => requestAnimationFrame(update));
    wraps.forEach((el) => ro.observe(el));
    update();
    const rafId = requestAnimationFrame(update);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(rafId);
    };
  }, [active, loading, iList.length, oList.length]);

  useEffect(() => {
    if (!active) return;

    const bindNearBottom = (
      wrap: HTMLDivElement | null,
      listRef: { current: IoItem[] },
      setter: (next: IoItem[] | ((prev: IoItem[]) => IoItem[])) => void,
      ioType: "I" | "O",
    ) => {
      const body = wrap?.querySelector(".ant-table-body") as HTMLElement | null;
      if (!body) return () => {};
      const onScroll = () => {
        const distance = body.scrollHeight - body.scrollTop - body.clientHeight;
        if (distance > NEAR_BOTTOM_PX) return;
        const list = listRef.current;
        if (isBlankIoItem(list[list.length - 1])) return;
        setter((prev) => [...prev, emptyIoItem(ioType)]);
      };
      body.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
      return () => body.removeEventListener("scroll", onScroll);
    };

    const unbindI = bindNearBottom(iWrapRef.current, iListRef, setIList, "I");
    const unbindO = bindNearBottom(oWrapRef.current, oListRef, setOList, "O");
    return () => {
      unbindI();
      unbindO();
    };
  }, [
    active,
    iScrollY,
    oScrollY,
    iList.length,
    oList.length,
    iList[iList.length - 1]?.item_name,
    iList[iList.length - 1]?.io_quantity,
    oList[oList.length - 1]?.item_name,
    oList[oList.length - 1]?.io_quantity,
  ]);

  const patchIo = (
    setter: (next: IoItem[] | ((prev: IoItem[]) => IoItem[])) => void,
    rowKey: string,
    patch: Partial<IoItem>,
  ) => {
    setter((list) =>
      list.map((item) => {
        if (item.row_key !== rowKey) return item;
        const next = { ...item, ...patch };
        if (patch.io_quantity != null) {
          next.io_ml =
            next.item_unit === "ml"
              ? Number(toQty2(patch.io_quantity)) || 0
              : 0;
        }
        return next;
      }),
    );
  };

  const buildNewPayload = (item: IoItem) => ({
    visit_id: visitId,
    user_id: Number(userId),
    user_name: userName,
    io_time: ioTime,
    io_type: item.io_type,
    item_name: item.item_name,
    item_unit: item.item_unit || "ml",
    item_trait: item.item_trait,
    item_color: item.item_color,
    item_note: item.item_note,
    io_method: item.io_method,
    io_quantity: toQty2(item.io_quantity),
    io_ml: String(
      item.item_unit === "ml"
        ? Number(toQty2(item.io_quantity)) || 0
        : item.io_ml || 0,
    ),
    io_status: "NEW",
  });

  const saveRow = async (item: IoItem) => {
    if (!ioTime) {
      message.warning("请选择时间");
      return;
    }
    if (!item.item_name || !item.io_quantity) {
      message.warning("名称和量不能为空");
      return;
    }
    if (item.io_id) {
      const res = await saveIoPropertyAPI({
        io_id: item.io_id,
        io_property: {
          io_time: ioTime,
          io_type: item.io_type,
          item_name: item.item_name,
          item_unit: item.item_unit,
          item_trait: item.item_trait,
          item_color: item.item_color,
          item_note: item.item_note,
          io_ml: String(item.io_ml),
          io_quantity: toQty2(item.io_quantity),
          io_method: item.io_method,
        },
      });
      if (res.code == 0) {
        message.success("修改成功");
        loadList({ i: iListRef.current, o: oListRef.current });
        onChanged();
      } else {
        message.error(res.message || "修改失败");
      }
      return;
    }

    const res = await newIoAPI(buildNewPayload(item));
    if (res.code == 0) {
      message.success("添加成功");
      loadList({
        i: iListRef.current.filter((row) => row.row_key !== item.row_key),
        o: oListRef.current.filter((row) => row.row_key !== item.row_key),
      });
      onChanged();
    } else {
      message.error(res.message || "添加失败");
    }
  };

  const removeRow = (item: IoItem, ioType: "I" | "O") => {
    const setter = ioType === "I" ? setIList : setOList;
    if (!item.io_id) {
      setter((list) => {
        const next = list.filter((row) => row.row_key !== item.row_key);
        return next.length ? next : [emptyIoItem(ioType)];
      });
      return;
    }

    Modal.confirm({
      title: "确认删除",
      content: "是否删除该项入出量？",
      okText: "确认",
      okType: "danger",
      onOk: async () => {
        const res = await deleteIoAPI({ io_id: item.io_id });
        if (res.code == 0) {
          message.success("已删除");
          loadList({
            i: iListRef.current.filter((row) => row.row_key !== item.row_key),
            o: oListRef.current.filter((row) => row.row_key !== item.row_key),
          });
          onChanged();
        } else {
          message.error(res.message || "删除失败");
        }
      },
    });
  };

  const buildUpdatePayload = (item: IoItem) => ({
    io_id: item.io_id,
    io_property: {
      io_time: ioTime,
      io_type: item.io_type,
      item_name: item.item_name,
      item_unit: item.item_unit,
      item_trait: item.item_trait,
      item_color: item.item_color,
      item_note: item.item_note,
      io_ml: String(
        item.item_unit === "ml"
          ? Number(toQty2(item.io_quantity)) || 0
          : item.io_ml || 0,
      ),
      io_quantity: toQty2(item.io_quantity),
      io_method: item.io_method,
    },
  });

  /** 确定：批量新增未保存行 + 批量保存已有行 */
  const handleOk = async () => {
    if (!ioTime) {
      message.warning("请选择时间");
      return;
    }
    const allItems = [...iList, ...oList];
    const toCreate = allItems.filter(
      (item) => !item.io_id && (item.item_name || item.io_quantity),
    );
    const toUpdate = allItems.filter((item) => Boolean(item.io_id));

    const incomplete = [...toCreate, ...toUpdate].filter(
      (item) => !item.item_name || !item.io_quantity,
    );
    if (incomplete.length > 0) {
      message.warning("名称和量不能为空");
      return;
    }

    if (toCreate.length === 0 && toUpdate.length === 0) {
      message.warning("没有需要保存的入出量");
      return;
    }

    setSaving(true);
    try {
      const results = await Promise.all([
        ...toCreate.map((item) => newIoAPI(buildNewPayload(item))),
        ...toUpdate.map((item) => saveIoPropertyAPI(buildUpdatePayload(item))),
      ]);
      const error = results.find((res: any) => res.code != 0);
      if (error) {
        message.error(error.message || "保存失败");
        return;
      }
      message.success("保存成功");
      loadList();
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  const cellAuto = (
    record: IoItem,
    setter: (next: IoItem[] | ((prev: IoItem[]) => IoItem[])) => void,
    field: keyof IoItem,
    options: any[],
    setOptions: (list: any[]) => void,
    dictName: string,
    placeholder?: string,
    className = "w-full min-w-[70px]",
  ) => (
    <AutoComplete
      size="small"
      className={className}
      placeholder={placeholder}
      value={String(record[field] ?? "")}
      options={dictOptions(options)}
      allowClear
      filterOption={(input, option) =>
        String(option?.value ?? "")
          .toLowerCase()
          .includes(input.toLowerCase())
      }
      onFocus={() => ensureDictData(dictName, options, setOptions)}
      onChange={(value) =>
        patchIo(setter, record.row_key, { [field]: value || "" })
      }
    />
  );

  const cellQty = (
    record: IoItem,
    setter: (next: IoItem[] | ((prev: IoItem[]) => IoItem[])) => void,
  ) => (
    <Input
      size="small"
      className="w-[90px]"
      suffix="ml"
      value={record.io_quantity}
      onChange={(e) => {
        const value = e.target.value;
        if (value !== "" && !isQtyInput(value)) return;
        patchIo(setter, record.row_key, { io_quantity: value });
      }}
      onBlur={() => {
        if (record.io_quantity === "") return;
        patchIo(setter, record.row_key, {
          io_quantity: toQty2(record.io_quantity),
        });
      }}
    />
  );

  const renderActions = (item: IoItem, ioType: "I" | "O") => (
    <div className="flex items-center whitespace-nowrap">
      <Button size="small" type="link" onClick={() => void saveRow(item)}>
        保存
      </Button>
      {item.io_id ? (
        <Button
          size="small"
          type="link"
          danger
          onClick={() => removeRow(item, ioType)}
        >
          删除
        </Button>
      ) : (
        <Button
          size="small"
          type="text"
          danger
          icon={<MinusCircleOutlined />}
          onClick={() => removeRow(item, ioType)}
        />
      )}
    </div>
  );

  const iColumns: ColumnsType<IoItem> = useMemo(
    () => [
      {
        title: "名称",
        dataIndex: "item_name",
        render: (_value, record) =>
          cellAuto(
            record,
            setIList,
            "item_name",
            iNameList,
            setINameList,
            "i.type",
            "入量名称",
          ),
      },
      {
        title: "数量",
        dataIndex: "io_quantity",
        width: 110,
        render: (_value, record) => cellQty(record, setIList),
      },
      {
        title: "途径",
        dataIndex: "io_method",
        render: (_value, record) =>
          cellAuto(
            record,
            setIList,
            "io_method",
            ioMethod,
            setIoMethod,
            "io.method",
            "途径",
          ),
      },
      {
        title: "备注",
        dataIndex: "item_note",
        render: (_value, record) =>
          cellAuto(
            record,
            setIList,
            "item_note",
            iNoteList,
            setINoteList,
            "i.item_note",
            "备注",
          ),
      },
      {
        title: "操作",
        dataIndex: "row_key",
        width: 120,
        render: (_value, record) => renderActions(record, "I"),
      },
    ],
    [iNameList, iNoteList, ioMethod],
  );

  const oColumns: ColumnsType<IoItem> = useMemo(
    () => [
      {
        title: "名称",
        dataIndex: "item_name",
        render: (_value, record) =>
          cellAuto(
            record,
            setOList,
            "item_name",
            oNameList,
            setONameList,
            "o.type",
            "出量名称",
          ),
      },
      {
        title: "数量",
        dataIndex: "io_quantity",
        width: 110,
        render: (_value, record) => cellQty(record, setOList),
      },
      {
        title: "颜色",
        dataIndex: "item_color",
        render: (_value, record) =>
          cellAuto(
            record,
            setOList,
            "item_color",
            ioColor,
            setIoColor,
            "io.color",
            "颜色",
          ),
      },
      {
        title: "性状",
        dataIndex: "item_trait",
        render: (_value, record) =>
          cellAuto(
            record,
            setOList,
            "item_trait",
            ioTrait,
            setIoTrait,
            "io.trait",
            "性状",
          ),
      },
      {
        title: "备注",
        dataIndex: "item_note",
        render: (_value, record) =>
          cellAuto(
            record,
            setOList,
            "item_note",
            oNoteList,
            setONoteList,
            "o.item_note",
            "备注",
          ),
      },
      {
        title: "操作",
        dataIndex: "row_key",
        width: 120,
        render: (_value, record) => renderActions(record, "O"),
      },
    ],
    [oNameList, oNoteList, ioColor, ioTrait],
  );

  const handleTimeChange = (date: dayjs.Dayjs | null) => {
    const formatted = date ? date.format("YYYY-MM-DD HH:mm:00") : "";
    setIoTime(formatted);
    onTimeChange?.(formatted);
  };

  const tableTitle = (label: string, onAdd: () => void) => (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <Button size="small" type="link" icon={<PlusOutlined />} onClick={onAdd}>
        新增
      </Button>
    </div>
  );

  return (
    <div className="flex min-h-full flex-col">
      <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between gap-2 border-b border-(--app-theme-border) bg-(--app-theme-bg-container) px-2 py-1.5">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span>时间：</span>
          <DatePicker
            showTime={{ format: "HH:mm" }}
            format="YYYY-MM-DD HH:mm"
            value={ioTime ? dayjs(ioTime) : null}
            onChange={handleTimeChange}
            className="min-w-0 max-w-full"
            size="small"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button size="small" type="primary" onClick={() => setSumOpen(true)}>
            统计
          </Button>
          <Button
            size="small"
            type="primary"
            loading={saving}
            onClick={() => void handleOk()}
          >
            确定
          </Button>

          <Button size="small" onClick={() => onCancel?.()}>
            取消
          </Button>
        </div>
      </div>
      <IoSum
        open={sumOpen}
        onClose={() => setSumOpen(false)}
        visitId={visitId}
        userId={userId}
        userName={userName}
        onChanged={onChanged}
      />
      <div className="flex min-h-[280px] flex-1 flex-row items-stretch gap-2 overflow-hidden p-1">
        <div
          ref={iWrapRef}
          className="io-inner-table min-h-[280px] min-w-0 flex-1 overflow-hidden"
        >
          <Table<IoItem>
            size="small"
            bordered={false}
            pagination={false}
            rowKey="row_key"
            loading={loading}
            dataSource={iList}
            columns={iColumns}
            scroll={{ x: "max-content", y: iScrollY }}
            className="[&_.ant-table-cell]:border-0 [&_.ant-table-title]:border-0"
            title={() =>
              tableTitle("入量", () =>
                setIList((list) => [...list, emptyIoItem("I")]),
              )
            }
          />
        </div>
        <div
          ref={oWrapRef}
          className="io-inner-table min-h-[280px] min-w-0 flex-1 overflow-hidden"
        >
          <Table<IoItem>
            size="small"
            bordered={false}
            pagination={false}
            rowKey="row_key"
            loading={loading}
            dataSource={oList}
            columns={oColumns}
            scroll={{ x: "max-content", y: oScrollY }}
            className="[&_.ant-table-cell]:border-0 [&_.ant-table-title]:border-0"
            title={() =>
              tableTitle("出量", () =>
                setOList((list) => [...list, emptyIoItem("O")]),
              )
            }
          />
        </div>
      </div>
    </div>
  );
}
