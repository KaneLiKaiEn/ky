import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { flushSync } from "react-dom";
import { Button, Input, Table, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs, { Dayjs } from "dayjs";
import { newObserveAPI, deleteObserveAPI } from "../../api";
import type { ObserveRow, VitalColumn } from "../../types";
import { TIME_SLOT_HOURS } from "../../utils";
import EventEditModal from "./EventEditModal";
import TempEditModal, { TEMP_EDIT_DEFAULT_METHOD } from "./TempEditModal";
import { TEMP_SPECIAL_VALUES } from "./TempValueSelect";

/** 与体温单 / sign-entry 一致的时间点 */
const TIME_SLOTS = TIME_SLOT_HOURS.map((h) => String(h).padStart(2, "0"));
const DAYS_COUNT = 7;
const ABNORMAL_TEMP = 37.3;
const DEFAULT_TEMP_METHOD = TEMP_EDIT_DEFAULT_METHOD;
const OBSERVE_TAG = "[体温单]";

const FIXED_VITAL_COLUMNS: VitalColumn[] = [
  { elem_name: "体温", item_unit: "℃" },
  { elem_name: "脉搏", item_unit: "次/分" },
  { elem_name: "呼吸", item_unit: "次/分" },
];

/** 列宽：表头单位换行后整体收窄 */
const COL_W_DATE = 45; //日期
const COL_W_TIME = 48; //时间（非整点要显示 HH:mm）
const COL_W_TEMP = 40; //体温
const COL_W_EVENT = 48; //床头事件
const COL_W_VITAL = 40; //其他体征

export interface EntryRow {
  key: string;
  date: string;
  fullDate: string;
  dayCount: number;
  time: string;
  tempMethod: string;
  /** elem_name → 展示值 */
  values: Record<string, string>;
  /** elem_name → 已有观察记录 */
  observes: Record<string, ObserveRow>;
  dateRowSpan: number;
}

interface EntryTableProps {
  visitId?: number;
  patientId?: number;
  orgId?: number;
  currentDate?: Dayjs | null;
  admissionTime?: string;
  /** 展示天数，默认 7（一周）；全部模式传总天数 */
  daysCount?: number;
  loading?: boolean;
  /** 字典动态列（含身高/体重/床头事件等，不含体温脉搏呼吸） */
  dynamicColumns?: VitalColumn[];
  observeList?: ObserveRow[];
  onSaved?: () => void;
  /** 床头事件保存后刷新体温单显示 */
  onEventSaved?: () => void;
}

function emptyRow(
  fullDate: string,
  dateLabel: string,
  dayCount: number,
  time: string,
  timeIndex: number,
): EntryRow {
  return {
    key: `${fullDate}-${time}`,
    date: dateLabel,
    fullDate,
    dayCount,
    time,
    tempMethod: DEFAULT_TEMP_METHOD,
    values: {},
    observes: {},
    dateRowSpan: timeIndex === 0 ? TIME_SLOTS.length : 0,
  };
}

function buildEmptyRows(
  currentDate: Dayjs,
  admissionTime: string,
  daysCount: number = DAYS_COUNT,
): EntryRow[] {
  const admissionStart = dayjs(admissionTime || undefined).startOf("day");
  const baseStart = currentDate.startOf("day");
  const baseHospitalDay = baseStart.diff(admissionStart, "day") + 1;
  const rows: EntryRow[] = [];

  for (let dayOffset = 0; dayOffset < daysCount; dayOffset++) {
    const date = baseStart.add(dayOffset, "day");
    TIME_SLOTS.forEach((time, timeIndex) => {
      rows.push(
        emptyRow(
          date.format("YYYY-MM-DD"),
          date.format("MM-DD"),
          baseHospitalDay + dayOffset,
          time,
          timeIndex,
        ),
      );
    });
  }
  return rows;
}

/**
 * 固定时点为 4 小时区间中点：
 * 02→[0,4)  06→[4,8)  10→[8,12)  14→[12,16)  18→[16,20)  22→[20,24)
 * 例：11:10 归入 10；16:20 归入 18。非整点不单独成行。
 */
function resolveSlotHour(t: Dayjs): string | null {
  const totalMinutes = t.hour() * 60 + t.minute();
  for (const slot of TIME_SLOT_HOURS) {
    const rangeStart = (slot - 2) * 60;
    const rangeEnd = (slot + 2) * 60;
    if (totalMinutes >= rangeStart && totalMinutes < rangeEnd) {
      return String(slot).padStart(2, "0");
    }
  }
  return null;
}

/** 是否为该行固定时点的整点记录（如 10:00） */
function isExactSlotObserve(
  obs: ObserveRow | undefined,
  row: EntryRow,
): boolean {
  if (!obs?.observe_time) return false;
  const t = dayjs(obs.observe_time);
  if (!t.isValid()) return false;
  return (
    t.format("YYYY-MM-DD") === row.fullDate &&
    t.hour() === Number(row.time) &&
    t.minute() === 0
  );
}

function slotDistanceMinutes(t: Dayjs, slotHour: number): number {
  return Math.abs(t.hour() * 60 + t.minute() - slotHour * 60);
}

function shouldPreferIncoming(
  existing: ObserveRow | undefined,
  incoming: ObserveRow,
  slotHour: string,
): boolean {
  if (!existing?.observe_time) return true;
  const existingTime = dayjs(existing.observe_time);
  const incomingTime = dayjs(incoming.observe_time);
  if (!existingTime.isValid()) return true;
  if (!incomingTime.isValid()) return false;

  const slot = Number(slotHour);
  const existingExact =
    existingTime.hour() === slot && existingTime.minute() === 0;
  const incomingExact =
    incomingTime.hour() === slot && incomingTime.minute() === 0;

  if (existingExact && !incomingExact) return false;
  if (!existingExact && incomingExact) return true;

  const existingDist = slotDistanceMinutes(existingTime, slot);
  const incomingDist = slotDistanceMinutes(incomingTime, slot);
  if (incomingDist !== existingDist) return incomingDist < existingDist;

  return incomingTime.valueOf() >= existingTime.valueOf();
}

function hasTemperatureTag(obs: ObserveRow): boolean {
  const tag = obs.observe_tag || "";
  return !tag || tag.includes(OBSERVE_TAG);
}

function fillRowsFromObserves(
  rows: EntryRow[],
  observeList: ObserveRow[],
): EntryRow[] {
  const rowMap = new Map(
    rows.map((r) => [
      r.key,
      {
        ...r,
        values: { ...r.values },
        observes: { ...r.observes },
      },
    ]),
  );

  observeList.forEach((obs) => {
    if (!obs.elem_name || !obs.observe_time) return;
    if (!hasTemperatureTag(obs)) return;
    const t = dayjs(obs.observe_time);
    if (!t.isValid()) return;

    const slotHour = resolveSlotHour(t);
    if (!slotHour) return;

    const key = `${t.format("YYYY-MM-DD")}-${slotHour}`;
    const row = rowMap.get(key);
    if (!row) return;

    if (!shouldPreferIncoming(row.observes[obs.elem_name], obs, slotHour)) {
      return;
    }

    const value = obs.observe_value ?? "";
    row.values[obs.elem_name] = value;
    row.observes[obs.elem_name] = obs;
    if (obs.elem_name === "体温") {
      row.tempMethod = obs.observe_method || DEFAULT_TEMP_METHOD;
    }
  });

  return Array.from(rowMap.values());
}

function cellInputClass(abnormal?: boolean) {
  return [
    "w-full text-center !border-0 !shadow-none !bg-transparent !px-0",
    abnormal ? "!text-red-500" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

type CellNavDir = "up" | "down" | "left" | "right";

function arrowDir(key: string): CellNavDir | null {
  if (key === "ArrowUp") return "up";
  if (key === "ArrowDown") return "down";
  if (key === "ArrowLeft") return "left";
  if (key === "ArrowRight") return "right";
  return null;
}

/** 左右到行首/行尾时换到上一行末格或下一行首格；上下停在首尾行 */
function resolveNextCell(
  rowIndex: number,
  colIndex: number,
  dir: CellNavDir,
  rowCount: number,
  colCount: number,
): { row: number; col: number } | null {
  if (rowCount <= 0 || colCount <= 0) return null;
  if (dir === "up") {
    return rowIndex > 0 ? { row: rowIndex - 1, col: colIndex } : null;
  }
  if (dir === "down") {
    return rowIndex < rowCount - 1
      ? { row: rowIndex + 1, col: colIndex }
      : null;
  }
  if (dir === "left") {
    if (colIndex > 0) return { row: rowIndex, col: colIndex - 1 };
    if (rowIndex <= 0) return null;
    return { row: rowIndex - 1, col: colCount - 1 };
  }
  if (colIndex < colCount - 1) return { row: rowIndex, col: colIndex + 1 };
  if (rowIndex >= rowCount - 1) return null;
  return { row: rowIndex + 1, col: 0 };
}

function scrollTableCellIntoView(el: HTMLElement | null) {
  if (!el) return;
  const td = el.closest("td");
  const body = (el.closest(".ant-table-body") ||
    el.closest(".ant-table-content")) as HTMLElement | null;
  if (!td || !body) return;
  const tdRect = td.getBoundingClientRect();
  const bodyRect = body.getBoundingClientRect();
  if (tdRect.top < bodyRect.top) {
    body.scrollTop -= bodyRect.top - tdRect.top;
  } else if (tdRect.bottom > bodyRect.bottom) {
    body.scrollTop += tdRect.bottom - bodyRect.bottom;
  }
  if (tdRect.left < bodyRect.left) {
    body.scrollLeft -= bodyRect.left - tdRect.left;
  } else if (tdRect.right > bodyRect.right) {
    body.scrollLeft += tdRect.right - bodyRect.right;
  }
}

function focusEditingInput(inst: {
  focus?: (opt?: { cursor?: "start" | "end" | "all" }) => void;
  select?: () => void;
  input?: HTMLInputElement | null;
  nativeElement?: HTMLElement | null;
} | null) {
  if (!inst) return;
  inst.focus?.({ cursor: "all" });
  const native =
    inst.input ?? (inst instanceof HTMLInputElement ? inst : null);
  native?.select?.();
  scrollTableCellIntoView(native ?? inst.nativeElement ?? null);
}

function focusEntryCell(
  root: HTMLElement | null,
  cellKey: string,
  elemName: string,
) {
  if (!root) return;
  const host = root.querySelector(
    `[data-entry-key="${CSS.escape(cellKey)}"][data-entry-elem="${CSS.escape(elemName)}"]`,
  );
  const input = host?.querySelector("input");
  if (!(input instanceof HTMLInputElement)) return;
  input.focus();
  input.select();
  scrollTableCellIntoView(input);
}

function getObserveTime(row: EntryRow) {
  return `${row.fullDate} ${row.time}:00:00`;
}

function isTempAbnormal(value: string) {
  const num = Number(value);
  const isSpecial = (TEMP_SPECIAL_VALUES as readonly string[]).includes(value);
  return (
    isSpecial || (value !== "" && !Number.isNaN(num) && num >= ABNORMAL_TEMP)
  );
}

/** 体征单元格：点击进入编辑，失焦/回车提交；方向键移到相邻格子 */
function VitalEntryCell({
  cellKey,
  elemName,
  value,
  isEditing,
  isSelected,
  enableAbnormal,
  onStartEdit,
  onCommit,
  onExitEdit,
  onNavigate,
}: {
  cellKey: string;
  elemName: string;
  value: string;
  isEditing: boolean;
  isSelected?: boolean;
  /** 体温列：按草稿/展示值标红异常 */
  enableAbnormal?: boolean;
  onStartEdit: () => void;
  onCommit: (value: string) => void;
  onExitEdit: () => void;
  onNavigate: (dir: CellNavDir, draft: string) => boolean;
}) {
  const [draft, setDraft] = useState(value);
  const [prevEditing, setPrevEditing] = useState(isEditing);
  const inputRef = useRef<any>(null);
  const ignoreBlurRef = useRef(false);

  if (isEditing !== prevEditing) {
    setPrevEditing(isEditing);
    if (isEditing) setDraft(value);
  }

  useEffect(() => {
    if (!isEditing) return;
    ignoreBlurRef.current = false;
    const id = window.setTimeout(() => {
      const inst = inputRef.current;
      const native: HTMLElement | null =
        inst?.input ??
        inst?.nativeElement ??
        (inst instanceof HTMLInputElement ? inst : null);
      if (native && document.activeElement === native) return;
      focusEditingInput(inst);
    }, 0);
    return () => window.clearTimeout(id);
  }, [isEditing]);

  const showAbnormal = enableAbnormal
    ? isTempAbnormal(isEditing ? draft : value)
    : false;

  const finish = () => {
    if (ignoreBlurRef.current) return;
    ignoreBlurRef.current = true;
    onCommit(draft.trim());
    onExitEdit();
  };

  if (!isEditing) {
    return (
      <div
        data-entry-key={cellKey}
        data-entry-elem={elemName}
        className={[
          "flex min-h-7 w-full cursor-pointer items-center justify-center px-1",
          showAbnormal ? "text-(--app-theme-error)" : "",
          isSelected ? "bg-(--app-theme-primary-bg)" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={(e) => {
          e.stopPropagation();
          onStartEdit();
        }}
      >
        {value || "\u00A0"}
      </div>
    );
  }

  return (
    <div
      data-entry-key={cellKey}
      data-entry-elem={elemName}
      className="min-h-7 w-full bg-(--app-theme-primary-bg)"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <Input
        ref={inputRef}
        size="small"
        value={draft}
        className={cellInputClass(showAbnormal)}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (ignoreBlurRef.current) {
            ignoreBlurRef.current = false;
            return;
          }
          finish();
        }}
        onPressEnter={finish}
        onKeyDown={(e) => {
          if (e.nativeEvent.isComposing) return;
          if (e.key === "Escape") {
            e.preventDefault();
            ignoreBlurRef.current = true;
            onExitEdit();
            return;
          }
          const dir = arrowDir(e.key);
          if (!dir) return;
          e.preventDefault();
          e.stopPropagation();
          ignoreBlurRef.current = true;
          const moved = onNavigate(dir, draft);
          if (!moved) ignoreBlurRef.current = false;
        }}
      />
    </div>
  );
}

export default function EntryTable({
  visitId,
  patientId,
  orgId,
  currentDate,
  admissionTime = "",
  daysCount = DAYS_COUNT,
  loading = false,
  dynamicColumns = [],
  observeList = [],
  onSaved,
  onEventSaved,
}: EntryTableProps) {
  const dateAnchor = useMemo(
    () => currentDate?.startOf("day") ?? dayjs().startOf("day"),
    [currentDate],
  );

  const allVitalColumns = useMemo(() => {
    const cols = [
      ...FIXED_VITAL_COLUMNS,
      ...dynamicColumns.filter((c) => c.item_tag !== "HIDE"),
    ];
    const eventIdx = cols.findIndex((c) => c.item_tag === "EVENT");
    if (eventIdx >= 0 && eventIdx !== cols.length - 1) {
      const [eventCol] = cols.splice(eventIdx, 1);
      cols.push(eventCol);
    }
    return cols;
  }, [dynamicColumns]);

  const [dataSource, setDataSource] = useState<EntryRow[]>(() =>
    buildEmptyRows(dateAnchor, admissionTime, daysCount),
  );
  const dataRef = useRef(dataSource);

  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [eventModalDate, setEventModalDate] = useState("");
  /** 当前选中的体温单元格（用于体温属性） */
  const [selectedTempKey, setSelectedTempKey] = useState<string | null>(null);
  /** 正在行内编辑的单元格 */
  const [editingCell, setEditingCell] = useState<{
    key: string;
    elemName: string;
  } | null>(null);
  const [tempAttrOpen, setTempAttrOpen] = useState(false);
  const tableWrapRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(400);

  useLayoutEffect(() => {
    const el = tableWrapRef.current;
    if (!el) return;

    const calc = () => {
      const header =
        (el.querySelector(".ant-table-header") as HTMLElement | null) ||
        (el.querySelector(".ant-table-thead") as HTMLElement | null);
      const toolbar = el.querySelector(
        ".entry-table-toolbar",
      ) as HTMLElement | null;
      const headerH = header?.offsetHeight ?? 32;
      const toolbarH = toolbar?.offsetHeight ?? 0;
      setScrollY(
        Math.max(80, Math.floor(el.clientHeight - headerH - toolbarH)),
      );
    };

    calc();
    const rafId = requestAnimationFrame(calc);
    const ro = new ResizeObserver(calc);
    ro.observe(el);
    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, []);

  useEffect(() => {
    const empty = buildEmptyRows(dateAnchor, admissionTime, daysCount);
    const filled = fillRowsFromObserves(empty, observeList);
    dataRef.current = filled;
    setDataSource(filled);
  }, [dateAnchor, admissionTime, observeList, daysCount]);

  useEffect(() => {
    const root = tableWrapRef.current;
    if (!root) return;
    const scrollTop = () => {
      const body = root.querySelector(".ant-table-body") as HTMLElement | null;
      body?.scrollTo({ top: 0, left: 0 });
    };
    scrollTop();
    const id = requestAnimationFrame(scrollTop);
    return () => cancelAnimationFrame(id);
  }, [dateAnchor, daysCount]);

  const updateValueLocal = useCallback(
    (
      key: string,
      elemName: string,
      value: string,
      extra?: Partial<EntryRow>,
    ) => {
      const next = dataRef.current.map((row) => {
        if (row.key !== key) return row;
        return {
          ...row,
          ...extra,
          values: { ...row.values, [elemName]: value },
        };
      });
      dataRef.current = next;
      setDataSource(next);
    },
    [],
  );

  const getLatestRow = useCallback((key: string) => {
    return dataRef.current.find((r) => r.key === key);
  }, []);

  const persistField = useCallback(
    async (
      row: EntryRow,
      elemName: string,
      value: string,
      extra?: { observe_method?: string; observe_note?: string },
    ): Promise<boolean> => {
      if (!visitId) return false;

      const trimmed = value.trim();
      const existing = row.observes[elemName];
      const exactSlot = isExactSlotObserve(existing, row);

      // 区间 fallback（如 11:10 显示在 10 行）：清空只清展示，不删原记录，等待整点新增
      if (!trimmed && existing && !exactSlot) {
        setDataSource((prev) => {
          const next = prev.map((r) => {
            if (r.key !== row.key) return r;
            const nextObserves = { ...r.observes };
            delete nextObserves[elemName];
            return {
              ...r,
              values: { ...r.values, [elemName]: "" },
              observes: nextObserves,
            };
          });
          dataRef.current = next;
          return next;
        });
        return true;
      }

      if (!trimmed && !existing?.observe_id) return false;

      const storedValue = existing?.observe_value || "";
      const storedMethod = existing?.observe_method ?? DEFAULT_TEMP_METHOD;
      const storedNote = existing?.observe_note || "";
      const nextMethod = extra?.observe_method ?? storedMethod;
      const nextNote =
        extra?.observe_note !== undefined ? extra.observe_note : storedNote;

      if (exactSlot) {
        if (elemName === "体温") {
          if (
            trimmed === storedValue &&
            nextMethod === storedMethod &&
            nextNote === storedNote
          ) {
            return true;
          }
        } else if (trimmed === storedValue) {
          return true;
        }
      }

      try {
        // 整点记录：先删；清空则只删，改值则删后再 NewObserve
        if (exactSlot && existing?.observe_id) {
          const delRes = await deleteObserveAPI({
            observe_id: existing.observe_id,
          });
          if (delRes?.code !== 0) {
            message.error(
              `${delRes?.message || "删除失败"}${delRes?.hint ? `（${delRes.hint}）` : ""}`,
            );
            return false;
          }

          if (!trimmed) {
            setDataSource((prev) => {
              const next = prev.map((r) => {
                if (r.key !== row.key) return r;
                const nextObserves = { ...r.observes };
                delete nextObserves[elemName];
                return {
                  ...r,
                  values: { ...r.values, [elemName]: "" },
                  observes: nextObserves,
                };
              });
              dataRef.current = next;
              return next;
            });
            message.success("删除成功");
            onSaved?.();
            return true;
          }
        } else if (!trimmed) {
          return false;
        }

        const res = await newObserveAPI({
          visit_id: visitId,
          patient_id: patientId,
          org_id: orgId,
          elem_name: elemName,
          observe_value: trimmed,
          observe_time: getObserveTime(row),
          observe_tag: OBSERVE_TAG,
          ...(elemName === "体温"
            ? { observe_method: nextMethod, observe_note: nextNote }
            : {}),
        });

        if (res?.code !== 0) {
          message.error(
            `${res?.message || "保存失败"}${res?.hint ? `（${res.hint}）` : ""}`,
          );
          return false;
        }

        const updatedObserve: ObserveRow = {
          observe_id: res.observe_id,
          observe_value: trimmed,
          observe_method:
            elemName === "体温" ? nextMethod : existing?.observe_method,
          observe_note: elemName === "体温" ? nextNote : existing?.observe_note,
          visit_id: visitId,
          elem_name: elemName,
          observe_time: getObserveTime(row),
        };

        setDataSource((prev) => {
          const next = prev.map((r) => {
            if (r.key !== row.key) return r;
            return {
              ...r,
              values: { ...r.values, [elemName]: trimmed },
              observes: { ...r.observes, [elemName]: updatedObserve },
              ...(elemName === "体温" ? { tempMethod: nextMethod } : {}),
            };
          });
          dataRef.current = next;
          return next;
        });
        message.success(exactSlot ? "修改成功" : "新增成功");
        onSaved?.();
        return true;
      } catch {
        message.error("保存失败");
        return false;
      }
    },
    [visitId, patientId, orgId, onSaved],
  );

  const openEventModal = (fullDate: string) => {
    setEventModalDate(fullDate);
    setEventModalOpen(true);
  };

  const selectedTempRow = useMemo(() => {
    if (!selectedTempKey) return undefined;
    return dataSource.find((r) => r.key === selectedTempKey);
  }, [dataSource, selectedTempKey]);

  const handleOpenTempAttr = () => {
    if (!selectedTempKey) {
      message.warning("请先点击选中一个体温单元格");
      return;
    }
    setTempAttrOpen(true);
  };

  const handleTempAttrSave = useCallback(
    async (payload: {
      observe_value: string;
      observe_method: string;
      observe_note: string;
    }) => {
      if (!selectedTempKey) throw new Error("missing row");
      const latest = getLatestRow(selectedTempKey);
      if (!latest) throw new Error("missing row");
      const ok = await persistField(latest, "体温", payload.observe_value, {
        observe_method: payload.observe_method,
        observe_note: payload.observe_note,
      });
      if (!ok) throw new Error("save failed");
    },
    [selectedTempKey, getLatestRow, persistField],
  );

  const commitVitalValue = useCallback(
    (record: EntryRow, elemName: string, nextValue: string) => {
      updateValueLocal(record.key, elemName, nextValue);
      const latest = getLatestRow(record.key);
      const rowForSave = latest
        ? {
            ...latest,
            values: { ...latest.values, [elemName]: nextValue },
          }
        : { ...record, values: { ...record.values, [elemName]: nextValue } };
      void persistField(rowForSave, elemName, nextValue);
    },
    [updateValueLocal, getLatestRow, persistField],
  );

  const editableElemNames = useMemo(
    () =>
      allVitalColumns
        .filter((col) => col.item_tag !== "EVENT")
        .map((col) => col.elem_name),
    [allVitalColumns],
  );

  const moveFromCell = useCallback(
    (key: string, elemName: string, dir: CellNavDir, draft: string) => {
      const rows = dataRef.current;
      const rowIndex = rows.findIndex((row) => row.key === key);
      const colIndex = editableElemNames.indexOf(elemName);
      if (rowIndex < 0 || colIndex < 0) return false;
      const next = resolveNextCell(
        rowIndex,
        colIndex,
        dir,
        rows.length,
        editableElemNames.length,
      );
      if (!next) return false;
      const current = rows[rowIndex];
      const nextRow = rows[next.row];
      const nextElem = editableElemNames[next.col];
      const trimmed = draft.trim();
      flushSync(() => {
        if ((current.values[elemName] ?? "") !== trimmed) {
          commitVitalValue(current, elemName, trimmed);
        }
        if (nextElem === "体温") setSelectedTempKey(nextRow.key);
        setEditingCell({ key: nextRow.key, elemName: nextElem });
      });
      focusEntryCell(tableWrapRef.current, nextRow.key, nextElem);
      return true;
    },
    [editableElemNames, commitVitalValue],
  );

  const renderVitalCell = (col: VitalColumn, record: EntryRow) => {
    if (col.item_tag === "EVENT") {
      if (record.dateRowSpan === 0) return null;
      return (
        <span
          className="cursor-pointer text-(--app-theme-primary) hover:underline"
          onClick={(e) => {
            e.stopPropagation();
            openEventModal(record.fullDate);
          }}
        >
          编辑
        </span>
      );
    }

    const elemName = col.elem_name;
    const value = record.values[elemName] ?? "";
    const isTemp = elemName === "体温";

    return (
      <VitalEntryCell
        cellKey={record.key}
        elemName={elemName}
        value={value}
        isEditing={
          editingCell?.key === record.key && editingCell.elemName === elemName
        }
        isSelected={
          !editingCell && isTemp && selectedTempKey === record.key
        }
        enableAbnormal={isTemp}
        onStartEdit={() => {
          if (isTemp) setSelectedTempKey(record.key);
          setEditingCell({ key: record.key, elemName });
        }}
        onExitEdit={() =>
          setEditingCell((cur) =>
            cur?.key === record.key && cur.elemName === elemName ? null : cur,
          )
        }
        onCommit={(nextValue) => commitVitalValue(record, elemName, nextValue)}
        onNavigate={(dir, draft) =>
          moveFromCell(record.key, elemName, dir, draft)
        }
      />
    );
  };

  const tableScrollX = useMemo(() => {
    const fixed = COL_W_DATE + COL_W_TIME;
    const vitals = allVitalColumns.reduce((sum, col) => {
      if (col.elem_name === "体温") return sum + COL_W_TEMP;
      if (col.item_tag === "EVENT") return sum + COL_W_EVENT;
      return sum + COL_W_VITAL;
    }, 0);
    return fixed + vitals;
  }, [allVitalColumns]);

  const columns: ColumnsType<EntryRow> = useMemo(() => {
    const base: ColumnsType<EntryRow> = [
      {
        title: "日期",
        dataIndex: "date",
        width: COL_W_DATE,
        align: "center",
        onCell: (record) => ({ rowSpan: record.dateRowSpan }),
        render: (_, record) => (
          <div className="leading-tight py-1">
            <div className="font-semibold text-(--app-theme-text)">
              {record.date}
            </div>
            <div className="text-xs text-gray-500">第{record.dayCount}天</div>
          </div>
        ),
      },
      {
        title: "时间",
        dataIndex: "time",
        width: COL_W_TIME,
        align: "center",
        render: (time: string) => (
          <span className="whitespace-nowrap">{time}</span>
        ),
      },
    ];

    const vitalCols: ColumnsType<EntryRow> = allVitalColumns.map((col) => ({
      title: (
        <div className="leading-tight">
          <div>{col.elem_name}</div>
          {col.item_unit ? (
            <div className="text-[10px] font-normal whitespace-nowrap">
              ({col.item_unit})
            </div>
          ) : null}
        </div>
      ),
      key: col.elem_name,
      width:
        col.elem_name === "体温"
          ? COL_W_TEMP
          : col.item_tag === "EVENT"
            ? COL_W_EVENT
            : COL_W_VITAL,
      align: "center" as const,
      onCell: (record: EntryRow) => {
        if (col.item_tag === "EVENT") {
          return { rowSpan: record.dateRowSpan };
        }
        const isActive =
          editingCell?.key === record.key &&
          editingCell.elemName === col.elem_name;
        const isTempIdleSelected =
          !editingCell &&
          col.elem_name === "体温" &&
          selectedTempKey === record.key;
        const className = [
          col.elem_name === "体温" ? "temp-cell-td" : "",
          isActive || isTempIdleSelected ? "entry-cell-active" : "",
        ]
          .filter(Boolean)
          .join(" ");
        if (col.elem_name === "体温") {
          return {
            className,
            onClick: () => {
              setSelectedTempKey(record.key);
              setEditingCell({ key: record.key, elemName: "体温" });
            },
          };
        }
        return className ? { className } : {};
      },
      render: (_: unknown, record: EntryRow) => renderVitalCell(col, record),
    }));

    return [...base, ...vitalCols];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allVitalColumns, selectedTempKey, editingCell, moveFromCell]);

  return (
    <div
      ref={tableWrapRef}
      className="entry-table flex h-full min-h-0 w-full flex-col overflow-hidden"
    >
      <div className="entry-table-toolbar mb-1 flex shrink-0 justify-end">
        <Button size="small" type="primary" onClick={handleOpenTempAttr}>
          体温属性
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        <Table<EntryRow>
          size="small"
          bordered
          pagination={false}
          rowKey="key"
          columns={columns}
          dataSource={dataSource}
          loading={loading}
          scroll={{ x: tableScrollX, y: scrollY }}
          className="entry-table-antd h-full"
        />
      </div>
      <EventEditModal
        open={eventModalOpen}
        visitId={visitId}
        selectedDate={eventModalDate}
        onClose={() => setEventModalOpen(false)}
        onSaved={onEventSaved}
      />
      <TempEditModal
        open={tempAttrOpen}
        observe={selectedTempRow?.observes?.["体温"]}
        cellValue={selectedTempRow?.values?.["体温"]}
        defaultMethod={selectedTempRow?.tempMethod || DEFAULT_TEMP_METHOD}
        onClose={() => setTempAttrOpen(false)}
        onSave={handleTempAttrSave}
      />
      <style>{`
        .entry-table-antd .ant-table {
          font-size: 12px;
        }
        .entry-table-antd .ant-table-thead > tr > th {
          background: var(--app-theme-primary-bg);
          color: var(--app-theme-primary);
          font-weight: 600;
          font-size: 12px;
          text-align: center;
          padding: 2px 1px !important;
          white-space: normal;
        }
        .entry-table-antd .ant-table-tbody > tr > td {
          padding: 0 1px !important;
          font-size: 12px;
        }
        .entry-table-antd .ant-input-number,
        .entry-table-antd .ant-input,
        .entry-table-antd .ant-input-number-input {
          font-size: 12px;
        }
        .entry-table-antd .ant-input-number,
        .entry-table-antd .ant-input {
          width: 100%;
        }
        .entry-table-antd .ant-input-number-input {
          text-align: center;
          padding: 0 2px;
        }
        .entry-table-antd .temp-cell-td {
          cursor: pointer;
        }
        .entry-table-antd .entry-cell-active {
          background: var(--app-theme-primary-bg) !important;
        }
        .entry-table-antd.ant-table-wrapper,
        .entry-table-antd .ant-spin-nested-loading,
        .entry-table-antd .ant-spin-container,
        .entry-table-antd .ant-table {
          height: 100%;
        }
        .entry-table-antd .ant-table-container {
          height: 100%;
        }
      `}</style>
    </div>
  );
}
