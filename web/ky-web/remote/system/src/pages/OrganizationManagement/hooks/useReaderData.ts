import { useEffect, useMemo, useRef, useState } from "react";
import { App, Form } from "antd";
import { getReaderList, getOrgReaderList, saveOrgReaderList } from "@/api/card";
import type { ReaderRow, OrgReaderRow } from "@/types/card";
import { buildReaderList } from "../dto";
import { useSaveShortcut } from "@/hooks/useSaveShortcut";

export interface ReaderTabProps {
  orgId: number;
  orgName: string;
  disabled?: boolean;
  onDirtyChange: (dirty: boolean) => void;
  onBusyChange: (busy: boolean) => void;
}
export interface ReaderFormValues {
  rows: OrgReaderRow[];
}

export const MAX_READER_ROWS = 15;

function editableRows(rows: OrgReaderRow[]): OrgReaderRow[] {
  return rows.map((row) => ({
    ...row,
    reader_type: row.reader_type ?? "",
    reader_tag: row.reader_tag ?? "",
    deposit_amount: String(row.deposit_amount ?? ""),
    sort_no: String(row.sort_no ?? ""),
  }));
}

const rowsSignature = (rows: OrgReaderRow[]) =>
  JSON.stringify(editableRows(rows));

/** Owns reader data and preserves existing tags when dictionary entries are missing. */
export function useReaderData({
  orgId,
  orgName,
  disabled = false,
  onDirtyChange,
  onBusyChange,
}: ReaderTabProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm<ReaderFormValues>();
  const [rows, setRows] = useState<OrgReaderRow[]>([]);
  const [readers, setReaders] = useState<ReaderRow[]>([]);
  const [editing, setEditing] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [reload, setReload] = useState(0);
  const snapshotRef = useRef<OrgReaderRow[]>([]);
  const generationRef = useRef(0);
  const orgIdRef = useRef(orgId);
  const operationRef = useRef<symbol | null>(null);
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;
  const dirtyCallbackRef = useRef(onDirtyChange);
  const busyCallbackRef = useRef(onBusyChange);
  orgIdRef.current = orgId;
  dirtyCallbackRef.current = onDirtyChange;
  busyCallbackRef.current = onBusyChange;

  useEffect(() => {
    dirtyCallbackRef.current(dirty);
  }, [dirty]);
  useEffect(() => {
    busyCallbackRef.current(saving);
  }, [saving]);

  useEffect(() => {
    const generation = ++generationRef.current;
    const isCurrent = () =>
      generationRef.current === generation && orgIdRef.current === orgId;
    operationRef.current = null;
    snapshotRef.current = [];
    form.resetFields();
    setRows([]);
    setReaders([]);
    setDirty(false);
    setSaving(false);
    setEditing(false);
    setLoaded(false);
    setLoadError("");
    setSaveError("");
    setLoading(orgId > 0);

    if (orgId > 0) {
      void Promise.all([getOrgReaderList({ org_id: orgId }), getReaderList()])
        .then(([configuration, dictionary]) => {
          if (!isCurrent()) return;
          if (!configuration || !dictionary) {
            throw new Error("读卡器配置加载失败");
          }
          const nextRows = configuration.reader_list ?? [];
          snapshotRef.current = editableRows(nextRows);
          setRows(nextRows.map((row) => ({ ...row })));
          setReaders(dictionary.row_list ?? []);
          form.setFieldsValue({ rows: editableRows(nextRows) });
          setEditing(nextRows.length === 0);
          setLoaded(true);
        })
        .catch(() => {
          if (isCurrent()) setLoadError("读卡器配置加载失败，请重试。");
        })
        .finally(() => {
          if (isCurrent()) setLoading(false);
        });
    }

    return () => {
      ++generationRef.current;
      operationRef.current = null;
      dirtyCallbackRef.current(false);
      busyCallbackRef.current(false);
    };
  }, [form, orgId, reload]);

  const watchedRows = Form.useWatch("rows", form) as OrgReaderRow[] | undefined;
  const options = useMemo(() => {
    const values = new Map<string, { value: string; label: string }>();
    readers.forEach((reader) => {
      if (!reader.reader_type) return;
      values.set(reader.reader_type, {
        value: reader.reader_type,
        label: reader.reader_type,
      });
    });
    [...rows, ...(watchedRows ?? [])].forEach((row) => {
      if (row.reader_type && !values.has(row.reader_type)) {
        values.set(row.reader_type, {
          value: row.reader_type,
          label: row.reader_type,
        });
      }
    });
    return [...values.values()];
  }, [readers, rows, watchedRows]);

  const markDirty = () => {
    setDirty(
      rowsSignature(form.getFieldValue("rows") ?? []) !==
        rowsSignature(snapshotRef.current),
    );
  };

  const handleSave = async () => {
    if (
      disabledRef.current ||
      !orgId ||
      !loaded ||
      loading ||
      !editing ||
      operationRef.current
    )
      return;
    const operation = Symbol("save-readers");
    operationRef.current = operation;
    const generation = generationRef.current;
    const isCurrent = () =>
      generationRef.current === generation && orgIdRef.current === orgId;
    let writeSucceeded = false;
    setSaving(true);
    busyCallbackRef.current(true);
    try {
      const values = await form.validateFields();
      if (!isCurrent() || disabledRef.current) return;
      const payload = buildReaderList(orgId, orgName, values.rows ?? []);
      setSaveError("");
      const result = await saveOrgReaderList({
        org_id: orgId,
        delete_row: 0,
        reader_list: payload,
      });
      if (!isCurrent()) return;
      if (!result) throw new Error("读卡器配置保存失败");
      writeSucceeded = true;
      snapshotRef.current = editableRows(payload);
      setRows(payload.map((row) => ({ ...row })));
      form.setFieldsValue({ rows: editableRows(payload) });
      setDirty(false);
      dirtyCallbackRef.current(false);
      const latest = await getOrgReaderList({ org_id: orgId });
      if (!isCurrent()) return;
      if (!latest) throw new Error("读卡器配置刷新失败");
      const nextRows = latest.reader_list ?? [];
      snapshotRef.current = editableRows(nextRows);
      setRows(nextRows.map((row) => ({ ...row })));
      form.setFieldsValue({ rows: editableRows(nextRows) });
      setEditing(nextRows.length === 0);
      setDirty(false);
      message.success("读卡器配置已保存");
    } catch (error) {
      if (!isCurrent()) return;
      if (error && typeof error === "object" && "errorFields" in error) return;
      setSaveError(
        writeSucceeded
          ? "配置已保存，但刷新失败，当前输入已保留。可切换页签重新加载。"
          : "读卡器配置保存失败，当前输入已保留。请稍后重试。",
      );
    } finally {
      if (operationRef.current === operation) {
        operationRef.current = null;
        if (isCurrent()) {
          setSaving(false);
          busyCallbackRef.current(false);
        }
      }
    }
  };

  useSaveShortcut(
    () => {
      void handleSave();
    },
    !disabled && editing && loaded && !loading && !saving,
  );

  const cancelEditing = () => {
    if (disabled || saving) return;
    form.resetFields();
    form.setFieldsValue({ rows: editableRows(snapshotRef.current) });
    setDirty(false);
    setSaveError("");
    setEditing(snapshotRef.current.length === 0);
  };

  const changeReaderType = (rowIndex: number, readerType: string) => {
    if (disabled || saving) return;
    const reader = readers.find((item) => item.reader_type === readerType);
    const previousRow = snapshotRef.current[rowIndex];
    const original =
      previousRow?.reader_type === readerType
        ? previousRow
        : rows.find((item) => item.reader_type === readerType);
    form.setFieldValue(
      ["rows", rowIndex, "reader_tag"],
      (reader ? reader.reader_tag : original?.reader_tag) ?? "",
    );
    markDirty();
  };

  return {
    form,
    rows,
    editing,
    loading,
    loaded,
    saving,
    loadError,
    saveError,
    options,
    markDirty,
    handleSave,
    cancelEditing,
    changeReaderType,
    rowLimit: Math.max(MAX_READER_ROWS, snapshotRef.current.length),
    startEditing: () => {
      if (!disabled && !saving) setEditing(true);
    },
    retryLoading: () => {
      if (!disabled && !saving) setReload((value) => value + 1);
    },
    createEmptyRow: () => editableRows([{}])[0],
  };
}
