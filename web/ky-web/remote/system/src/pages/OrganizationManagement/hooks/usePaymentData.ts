import { useEffect, useMemo, useRef, useState } from "react";
import { App, Form } from "antd";
import { getDealerList, getOrgDealerList, saveOrgDealerList } from "@/api/pay";
import type { DealerRow, OrgDealerRow } from "@/types/pay";
import { buildDealerList } from "../dto";
import { useSaveShortcut } from "@/hooks/useSaveShortcut";

export interface PaymentTabProps {
  orgId: number;
  orgName: string;
  disabled?: boolean;
  onDirtyChange: (dirty: boolean) => void;
  onBusyChange: (busy: boolean) => void;
}

export type PaymentFormRow = Omit<OrgDealerRow, "account_id"> & {
  account_id?: number | string | null;
};
export interface PaymentFormValues {
  rows: PaymentFormRow[];
}

export const MAX_PAYMENT_ROWS = 15;

function editableRows(rows: PaymentFormRow[]): PaymentFormRow[] {
  return rows.map((row) => ({
    ...row,
    pay_type: row.pay_type ?? "",
    account_id: row.account_id ?? "",
    account_type: row.account_type ?? "",
    account_name: row.account_name ?? "",
    account_no: row.account_no ?? "",
    account_tag: row.account_tag ?? "",
    account_note: row.account_note ?? "",
    sort_no: row.sort_no ?? "",
  }));
}

function rowsSignature(rows: PaymentFormRow[]) {
  return JSON.stringify(
    editableRows(rows).map((row) => ({
      ...row,
      account_id: Number.isFinite(Number(row.account_id))
        ? Number(row.account_id)
        : String(row.account_id),
    })),
  );
}

/** Owns payment data, form snapshots, and requests for the selected organization. */
export function usePaymentData({
  orgId,
  orgName,
  disabled = false,
  onDirtyChange,
  onBusyChange,
}: PaymentTabProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm<PaymentFormValues>();
  const [rows, setRows] = useState<OrgDealerRow[]>([]);
  const [dealers, setDealers] = useState<DealerRow[]>([]);
  const [editing, setEditing] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [reload, setReload] = useState(0);
  const snapshotRef = useRef<PaymentFormRow[]>([]);
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
    setDealers([]);
    setDirty(false);
    setSaving(false);
    setEditing(false);
    setLoaded(false);
    setLoadError("");
    setSaveError("");
    setLoading(orgId > 0);

    if (orgId > 0) {
      void Promise.all([getOrgDealerList({ org_id: orgId }), getDealerList()])
        .then(([configuration, dictionary]) => {
          if (!isCurrent()) return;
          if (!configuration || !dictionary) {
            throw new Error("支付配置加载失败");
          }
          const nextRows = configuration.dealer_list ?? [];
          snapshotRef.current = editableRows(nextRows);
          setRows(nextRows.map((row) => ({ ...row })));
          setDealers(dictionary.row_list ?? []);
          form.setFieldsValue({ rows: editableRows(nextRows) });
          setEditing(nextRows.length === 0);
          setLoaded(true);
        })
        .catch(() => {
          if (isCurrent()) setLoadError("支付配置加载失败，请重试。");
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

  const watchedRows = Form.useWatch("rows", form) as
    | PaymentFormRow[]
    | undefined;
  const options = useMemo(() => {
    const values = new Map<
      string,
      { value: string; label: string; searchText: string }
    >();
    dealers.forEach((dealer) => {
      if (!dealer.pay_type) return;
      const label = dealer.pay_name || dealer.pay_type;
      values.set(dealer.pay_type, {
        value: dealer.pay_type,
        label,
        searchText: `${label} ${dealer.pay_type}`,
      });
    });
    [...rows, ...(watchedRows ?? [])].forEach((row) => {
      if (row.pay_type && !values.has(row.pay_type)) {
        const label = row.pay_type;
        values.set(row.pay_type, {
          value: row.pay_type,
          label,
          searchText: label,
        });
      }
    });
    return [...values.values()];
  }, [dealers, rows, watchedRows]);

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
    const operation = Symbol("save-payment");
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
      const payload = buildDealerList(
        orgId,
        orgName,
        (values.rows ?? []).map((row) => ({
          ...row,
          account_id: Number(row.account_id ?? 0),
        })),
      );
      setSaveError("");
      const result = await saveOrgDealerList({
        org_id: orgId,
        delete_row: 0,
        dealer_list: payload,
      });
      if (!isCurrent()) return;
      if (!result) throw new Error("支付配置保存失败");
      writeSucceeded = true;
      snapshotRef.current = editableRows(payload);
      setRows(payload.map((row) => ({ ...row })));
      form.setFieldsValue({ rows: editableRows(payload) });
      setDirty(false);
      dirtyCallbackRef.current(false);
      const latest = await getOrgDealerList({ org_id: orgId });
      if (!isCurrent()) return;
      if (!latest) throw new Error("支付配置刷新失败");
      const nextRows = latest.dealer_list ?? [];
      snapshotRef.current = editableRows(nextRows);
      setRows(nextRows.map((row) => ({ ...row })));
      form.setFieldsValue({ rows: editableRows(nextRows) });
      setEditing(nextRows.length === 0);
      setDirty(false);
      message.success("支付配置已保存");
    } catch (error) {
      if (!isCurrent()) return;
      if (error && typeof error === "object" && "errorFields" in error) return;
      setSaveError(
        writeSucceeded
          ? "配置已保存，但刷新失败，当前输入已保留。可切换页签重新加载。"
          : "支付配置保存失败，当前输入已保留。请稍后重试。",
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

  return {
    form,
    rows,
    dealers,
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
    rowLimit: Math.max(MAX_PAYMENT_ROWS, snapshotRef.current.length),
    startEditing: () => {
      if (!disabled && !saving) setEditing(true);
    },
    retryLoading: () => {
      if (!disabled && !saving) setReload((value) => value + 1);
    },
    createEmptyRow: () => editableRows([{}])[0],
  };
}
