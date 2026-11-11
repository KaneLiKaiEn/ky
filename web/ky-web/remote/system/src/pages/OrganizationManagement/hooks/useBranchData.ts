import { useEffect, useMemo, useRef, useState } from "react";
import { App, Form } from "antd";
import {
  deleteBranch,
  getBranchList,
  getBranchProperty,
  newBranch,
  saveBranchProperty,
} from "@/api/org";
import type { BranchRow } from "@/types/org";
import { InvalidOrganizationResponse } from "@/api/organizationResult";
import { buildBranchPayload, toNewBranchRequest } from "../dto";
import { normalizeAddress } from "../components/address";
import { useSaveShortcut } from "@/hooks/useSaveShortcut";

export interface BranchDataOptions {
  orgId: number;
  disabled?: boolean;
  branchId: number | null;
  onBranchChange: (id: number | null) => void;
  onDirtyChange: (dirty: boolean) => void;
  onBusyChange: (busy: boolean) => void;
}

/** Owns branch data and editor transitions; the component only renders Antd layout. */
export function useBranchData({
  orgId,
  branchId,
  disabled = false,
  onBranchChange,
  onDirtyChange,
  onBusyChange,
}: BranchDataOptions) {
  const { message, modal } = App.useApp();
  const [form] = Form.useForm<BranchRow>();
  const [rows, setRows] = useState<BranchRow[]>([]);
  const [original, setOriginal] = useState<BranchRow>({});
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [reloadList, setReloadList] = useState(0);
  const [reloadDetail, setReloadDetail] = useState(0);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const entityEpoch = useRef(0);
  const dirtyRef = useRef(false);
  const busyRef = useRef(false);
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;
  const values = Form.useWatch((store) => store, {
    form,
    preserve: true,
  }) as BranchRow | undefined;
  const busy = disabled || saving || deletingId !== null;

  // The active editor must stay visible even after reload or deep-link navigation.
  useEffect(() => {
    if (branchId === null) return;
    setQuery("");
    const index = rows.findIndex((row) => row.branch_id === branchId);
    setPage(index < 0 ? 1 : Math.floor(index / pageSize) + 1);
  }, [branchId, rows, pageSize]);

  useEffect(() => {
    setQuery("");
    setPage(1);
    setRows([]);
  }, [orgId]);

  useEffect(() => {
    let cancelled = false;
    if (orgId <= 0) return;
    setListLoading(true);
    setListError(false);
    getBranchList({ org_id: orgId })
      .then((response) => {
        if (!cancelled) {
          setRows(
            (response.branch_list ?? [])
              .filter(
                (row) =>
                  Number(row.branch_id) > 0 &&
                  (row.org_id == null || Number(row.org_id) === orgId),
              )
              .map((row) => ({
                ...row,
                branch_id: Number(row.branch_id),
                org_id: Number(row.org_id ?? orgId),
              })),
          );
        }
      })
      .catch(() => {
        if (!cancelled) setListError(true);
      })
      .finally(() => {
        if (!cancelled) setListLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [orgId, reloadList]);

  useEffect(() => {
    const epoch = ++entityEpoch.current;
    dirtyRef.current = false;
    busyRef.current = false;
    onDirtyChange(false);
    onBusyChange(false);
    setSaving(false);
    setDeletingId(null);
    setLoaded(false);
    setOriginal({});
    setDetailError(false);
    setDetailLoading(false);
    form.resetFields();

    const apply = (data: BranchRow) => {
      const initial: BranchRow = {
        ...normalizeAddress("branch", data, data),
        org_id: orgId,
        branch_id: branchId ?? 0,
        branch_address_nation: data.branch_address_nation || "中国",
      };
      setOriginal(initial);
      form.setFieldsValue(initial);
      setLoaded(true);
    };

    if (orgId > 0 && branchId !== null) {
      if (branchId === 0) {
        apply({ org_id: orgId, branch_id: 0 });
      } else {
        setDetailLoading(true);
        getBranchProperty({ branch_id: branchId })
          .then((response) => {
            if (epoch !== entityEpoch.current) return;
            if (
              !response.branch_property ||
              (response.branch_property.org_id != null &&
                Number(response.branch_property.org_id) !== orgId) ||
              (response.branch_property.branch_id != null &&
                Number(response.branch_property.branch_id) !== branchId)
            ) {
              setDetailError(true);
              return;
            }
            apply(response.branch_property);
          })
          .catch(() => {
            if (epoch === entityEpoch.current) setDetailError(true);
          })
          .finally(() => {
            if (epoch === entityEpoch.current) setDetailLoading(false);
          });
      }
    }

    return () => {
      ++entityEpoch.current;
      dirtyRef.current = false;
      busyRef.current = false;
      onDirtyChange(false);
      onBusyChange(false);
    };
  }, [orgId, branchId, reloadDetail, form, onDirtyChange, onBusyChange]);

  useEffect(() => {
    if (!loaded || branchId === null || !values) return;
    const current = buildBranchPayload(values, original, orgId, branchId);
    const baseline = buildBranchPayload(original, original, orgId, branchId);
    dirtyRef.current = JSON.stringify(current) !== JSON.stringify(baseline);
    onDirtyChange(dirtyRef.current);
  }, [values, original, orgId, branchId, loaded, onDirtyChange]);

  const changeBranch = (id: number | null) => {
    if (disabledRef.current || busyRef.current || id === branchId) return;
    if (dirtyRef.current) {
      const epoch = entityEpoch.current;
      modal.confirm({
        title: "放弃未保存的修改？",
        content: "当前院区的修改尚未保存。",
        okText: "放弃修改",
        cancelText: "继续编辑",
        onOk: () => {
          if (
            disabledRef.current ||
            epoch !== entityEpoch.current ||
            busyRef.current
          )
            return;
          dirtyRef.current = false;
          onDirtyChange(false);
          onBranchChange(id);
        },
      });
    } else {
      onBranchChange(id);
    }
  };

  const handleSave = async (formValues: BranchRow) => {
    if (
      disabledRef.current ||
      !loaded ||
      detailLoading ||
      busyRef.current ||
      branchId === null
    )
      return;
    const epoch = entityEpoch.current;
    const payload = buildBranchPayload(formValues, original, orgId, branchId);
    busyRef.current = true;
    setSaving(true);
    onBusyChange(true);
    try {
      let saved = payload;
      if (branchId === 0) {
        const response = await newBranch(toNewBranchRequest(payload));
        if (epoch !== entityEpoch.current) return;
        const savedId = Number(response.branch_id);
        if (!Number.isSafeInteger(savedId) || savedId <= 0) {
          message.error("院区创建结果缺少有效 ID，请刷新院区列表后确认");
          return;
        }
        saved = { ...payload, branch_id: savedId };
      } else {
        await saveBranchProperty({
          branch_id: branchId,
          branch_property: payload,
        });
        if (epoch !== entityEpoch.current) return;
      }
      setOriginal(saved);
      form.setFieldsValue(saved);
      setRows((current) =>
        current.some((row) => row.branch_id === saved.branch_id)
          ? current.map((row) =>
              row.branch_id === saved.branch_id ? saved : row,
            )
          : [saved, ...current],
      );
      dirtyRef.current = false;
      onDirtyChange(false);
      setReloadList((value) => value + 1);
      message.success(branchId === 0 ? "院区创建成功" : "院区保存成功");
      onBranchChange(null);
    } catch (error) {
      if (error instanceof InvalidOrganizationResponse)
        message.error(error.message);
      // 接口错误由请求拦截器提示，保留输入供重试。
    } finally {
      if (epoch === entityEpoch.current) {
        busyRef.current = false;
        setSaving(false);
        onBusyChange(false);
      }
    }
  };

  const cancelEditing = () => {
    if (disabledRef.current || busyRef.current) return;
    form.setFieldsValue(original);
    dirtyRef.current = false;
    onDirtyChange(false);
    onBranchChange(null);
  };

  const confirmDelete = async (row: BranchRow) => {
    if (disabledRef.current || !row.branch_id || busyRef.current) return;
    const targetId = row.branch_id;
    const intentEpoch = entityEpoch.current;
    // Await mode lets Antd keep the dialog open after an API rejection without
    // emitting an unhandled promise; the shared interceptor reports the error.
    await modal.confirm({
      title: `删除院区“${row.branch_name || targetId}”？`,
      content: "删除后将无法恢复。",
      okText: "删除",
      okButtonProps: { danger: true },
      cancelText: "取消",
      onOk: async () => {
        if (
          disabledRef.current ||
          busyRef.current ||
          intentEpoch !== entityEpoch.current
        )
          return;
        const epoch = entityEpoch.current;
        busyRef.current = true;
        setDeletingId(targetId);
        onBusyChange(true);
        try {
          await deleteBranch({ branch_id: targetId });
          if (epoch !== entityEpoch.current) return;
          setRows((current) =>
            current.filter((item) => item.branch_id !== targetId),
          );
          setReloadList((value) => value + 1);
          message.success("院区删除成功");
          if (branchId === targetId) onBranchChange(null);
        } catch (error) {
          if (error instanceof InvalidOrganizationResponse)
            message.error(error.message);
          throw error;
        } finally {
          if (epoch === entityEpoch.current) {
            busyRef.current = false;
            setDeletingId(null);
            onBusyChange(false);
          }
        }
      },
    });
  };

  useSaveShortcut(
    () => form.submit(),
    branchId !== null && loaded && !detailLoading && !busy,
  );

  const filteredRows = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase();
    if (!keyword) return rows;
    return rows.filter((row) =>
      [
        row.branch_name,
        row.branch_name_abbr,
        row.branch_code,
        row.branch_no,
      ].some((value) =>
        String(value ?? "")
          .toLocaleLowerCase()
          .includes(keyword),
      ),
    );
  }, [rows, query]);

  const tableRows = useMemo(() => {
    if (branchId === null) return filteredRows;
    const active = {
      org_id: orgId,
      branch_id: branchId,
      ...(loaded ? original : {}),
    };
    if (!filteredRows.some((row) => row.branch_id === branchId))
      return [active, ...filteredRows];
    return filteredRows.map((row) =>
      row.branch_id === branchId && loaded ? { ...row, ...active } : row,
    );
  }, [filteredRows, branchId, orgId, loaded, original]);

  useEffect(() => {
    if (branchId === null)
      setPage((current) =>
        Math.min(
          current,
          Math.max(1, Math.ceil(filteredRows.length / pageSize)),
        ),
      );
  }, [branchId, filteredRows.length, pageSize]);

  return {
    form,
    listLoading,
    listError,
    detailLoading,
    detailError,
    loaded,
    saving,
    deletingId,
    busy,
    query,
    page,
    pageSize,
    tableRows,
    changeBranch,
    handleSave,
    confirmDelete,
    cancelEditing,
    retryList: () => {
      if (branchId === null && !disabledRef.current && !busyRef.current)
        setReloadList((value) => value + 1);
    },
    retryDetail: () => {
      if (!disabledRef.current && !busyRef.current)
        setReloadDetail((value) => value + 1);
    },
    search: (keyword: string) => {
      if (branchId !== null || disabledRef.current || busyRef.current) return;
      setQuery(keyword);
      setPage(1);
    },
    changePage: (nextPage: number, nextSize: number) => {
      if (branchId !== null || disabledRef.current || busyRef.current) return;
      setPage(nextPage);
      setPageSize(nextSize);
    },
  };
}
