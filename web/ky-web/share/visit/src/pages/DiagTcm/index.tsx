import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ColumnsType } from "antd/es/table";
import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { Button, Empty, Space, Table, Tag, Tooltip, message } from "antd";
import dayjs from "dayjs";
import { getSessionId } from "comm/session";
import { getSessionInfo } from "@/api/auth";
import {
  addDiagTcmAPI,
  deleteDiagTcmAPI,
  getDiagListTcmAPI,
  moveDiagDownTcmAPI,
  moveDiagUpTcmAPI,
  saveDiagPropertyTcmAPI,
} from "@/api/diag";
import type { InitValue } from "@/pages/CustomForm/components/DataElem/types";
import type {
  DiagTcmApiType,
  DiagTcmRow,
  GetDiagListTcmReq,
} from "@/types/diag";
import DiagTcmEditModal, { type DiagTcmFormValues } from "./DiagTcmEditModal";

export interface DiagTcmProps {
  visit_id?: number;
  isEdit?: boolean;
  /** 诊断类型。传入则只展示对应类型；不传则按全部中医诊断类型分表展示 */
  diag_type?: DiagTcmApiType | DiagTcmApiType[];
  /**是否展示表格的标签 */
  showTypeTag?: boolean;
  /**
   * 列表加载或变更后回调，参数为当前展示范围内的中医诊断行。
   * 初次加载成功，以及新增、修改、删除、排序、刷新后都会触发。
   */
  onChange?: (rows: DiagTcmRow[]) => void;
  /** 诊断表格滚动高度。传入后表格使用 scroll.y */
  height?: number | string;
}

/** 供 SectionCode 收集中医诊断行并触发初始化刷新 */
export interface DiagTcmRef {
  getDiagRows: () => DiagTcmRow[];
  initSectionValue: (initSectionValue: InitValue) => void;
}

type DiagTcmLinkQuery = Pick<
  GetDiagListTcmReq,
  "link_name" | "link_value" | "link_data" | "link_tag" | "link_ext"
>;

const DIAG_TCM_TYPE_META: Record<
  DiagTcmApiType,
  { label: string; color: string }
> = {
  ACTIVE: { label: "当前中医诊断", color: "blue" },
  CLINIC: { label: "门诊中医诊断", color: "orange" },
  INIT: { label: "初步中医诊断", color: "cyan" },
  ADMISSION: { label: "入院中医诊断", color: "green" },
  DISCHARGE: { label: "出院中医诊断", color: "purple" },
};

const DEFAULT_DIAG_STATUS = "CONFIRM";

const DIAG_STATUS_MAP: Record<string, { text: string; color: string }> = {
  CONFIRM: { text: "确诊", color: "success" },
  DOUBT: { text: "疑似", color: "warning" },
};

/** 展示顺序：当前 → 门诊 → 初步 → 入院 → 出院 */
const ALL_DIAG_TCM_TYPES: DiagTcmApiType[] = [
  "ACTIVE",
  "CLINIC",
  "INIT",
  "ADMISSION",
  "DISCHARGE",
];

const softHeaderTitle = (title: string) => (
  <span className="font-normal opacity-25">{title}</span>
);

const normalizeDiagTypes = (
  diagType?: DiagTcmApiType | DiagTcmApiType[],
): DiagTcmApiType[] => {
  if (diagType == null) return ALL_DIAG_TCM_TYPES;
  const requested = Array.isArray(diagType) ? diagType : [diagType];
  return ALL_DIAG_TCM_TYPES.filter((type) => requested.includes(type));
};

const handleResponse = (
  res: { code: number; message?: string; hint?: string },
  successMessage: string,
) => {
  if (res.code === 0) {
    message.success(successMessage);
    return true;
  }
  message.error(res.message || "操作失败");
  return false;
};

const renderNameCode = (name?: string, code?: string) => {
  if (!name && !code) return "-";
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="min-w-0 truncate">{name || "-"}</span>
      <span className="shrink-0 text-(--app-theme-text-tertiary)">
        {code || "-"}
      </span>
    </div>
  );
};

const buildDiagTcmRowData = (
  type: DiagTcmApiType,
  values: DiagTcmFormValues,
  existing?: DiagTcmRow | null,
): Partial<DiagTcmRow> => ({
  bing_id: values.bing_id,
  bing_name: values.bing_name,
  bing_code: values.bing_code,
  bing_desc: values.bing_name,
  zheng_id: values.zheng_id ?? 0,
  zheng_name: values.zheng_name,
  zheng_code: values.zheng_code,
  zheng_desc: values.zheng_name,
  diag_status: values.diag_status || DEFAULT_DIAG_STATUS,
  diag_type: type,
  diag_time: existing?.diag_time
    ? dayjs(existing.diag_time).format("YYYY-MM-DD HH:mm")
    : dayjs().format("YYYY-MM-DD HH:mm"),
});

/**
 * 中医诊断列表。
 * 传入 diag_type 时只展示对应类型；不传则展示全部中医诊断类型。
 * isEdit 为 true 时可新增/编辑/删除/上移/下移；为 false 时仅查看。
 */
const DiagTcm = forwardRef<DiagTcmRef, DiagTcmProps>(function DiagTcm(
  { visit_id, isEdit = false, diag_type, showTypeTag = true, onChange, height },
  ref,
) {
  const validVisitId =
    visit_id != null && Number.isFinite(visit_id) && visit_id > 0
      ? visit_id
      : null;
  const SessionId = getSessionId();
  const linkQueryRef = useRef<DiagTcmLinkQuery>({});
  const displayTypes = useMemo(
    () => normalizeDiagTypes(diag_type),
    [diag_type],
  );

  const [dataSource, setDataSource] = useState<DiagTcmRow[]>([]);
  const [refreshingType, setRefreshingType] = useState<DiagTcmApiType | null>(
    null,
  );
  const [orgId, setOrgId] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSaving, setModalSaving] = useState(false);
  const [modalType, setModalType] = useState<DiagTcmApiType>("ACTIVE");
  const [editingRecord, setEditingRecord] = useState<DiagTcmRow | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  /** 至少成功拉到一次列表后才回调，避免挂载时把空数组抛给外部 */
  const listReadyRef = useRef(false);

  const loadData = useCallback(
    async (forceRefresh = false, type?: DiagTcmApiType) => {
      if (validVisitId == null) return;
      if (forceRefresh && type) setRefreshingType(type);
      try {
        const queryType =
          type ?? (displayTypes.length === 1 ? displayTypes[0] : undefined);
        const res = await getDiagListTcmAPI({
          visit_id: validVisitId,
          ...linkQueryRef.current,
          ...(queryType ? { diag_type: queryType } : {}),
        });
        if (res.code === 0) {
          const list = res.diag_list || [];
          listReadyRef.current = true;
          if (queryType) {
            setDataSource((prev) => [
              ...prev.filter((item) => item.diag_type !== queryType),
              ...list,
            ]);
          } else {
            setDataSource(list);
          }
        } else {
          message.error(res.message || "获取中医诊断列表失败");
        }
      } catch (error) {
        console.error("获取中医诊断列表失败:", error);
      } finally {
        if (forceRefresh && type) setRefreshingType(null);
      }
    },
    [validVisitId, displayTypes],
  );

  useEffect(() => {
    if (!listReadyRef.current) return;
    onChangeRef.current?.(
      dataSource.filter((item) =>
        displayTypes.includes((item.diag_type as DiagTcmApiType) || "ACTIVE"),
      ),
    );
  }, [dataSource, displayTypes]);

  useImperativeHandle(
    ref,
    () => ({
      getDiagRows: () =>
        dataSource.filter((item) =>
          displayTypes.includes((item.diag_type as DiagTcmApiType) || "ACTIVE"),
        ),
      initSectionValue: (initSectionValue: InitValue) => {
        linkQueryRef.current = {
          link_name: initSectionValue.link_name,
          link_value: initSectionValue.link_value,
          link_data: initSectionValue.link_data,
          link_tag: initSectionValue.link_tag,
          link_ext: initSectionValue.link_ext,
        };
        void loadData(true);
      },
    }),
    [dataSource, displayTypes, loadData],
  );

  const closeModal = () => {
    setModalOpen(false);
    setEditingRecord(null);
  };

  const handleAdd = (tableType: DiagTcmApiType) => {
    if (!isEdit) return;
    setModalType(tableType);
    setEditingRecord(null);
    setModalOpen(true);
  };

  const handleEdit = (record: DiagTcmRow) => {
    if (!isEdit) return;
    setModalType((record.diag_type as DiagTcmApiType) || modalType);
    setEditingRecord(record);
    setModalOpen(true);
  };

  const handleModalSubmit = async (
    values: DiagTcmFormValues,
    closeAfterSave: boolean,
  ): Promise<boolean> => {
    if (validVisitId == null) return false;
    if (!values.bing_id || !values.diag_status) {
      message.warning("请完善病字典和诊断状态");
      return false;
    }
    setModalSaving(true);
    try {
      const diagRowData = buildDiagTcmRowData(modalType, values, editingRecord);
      const isEditRow = Boolean(editingRecord?.diag_id);
      const res =
        isEditRow && editingRecord?.diag_id
          ? await saveDiagPropertyTcmAPI({
              diag_id: editingRecord.diag_id,
              diag_property: diagRowData,
            })
          : await addDiagTcmAPI({
              visit_id: validVisitId,
              diag_type: modalType,
              diag_info: { diag_row: diagRowData },
            });
      if (!handleResponse(res, isEditRow ? "修改成功" : "新增成功")) {
        return false;
      }
      await loadData(true, modalType);
      if (closeAfterSave) {
        closeModal();
      } else {
        setEditingRecord(null);
      }
      return true;
    } catch (error) {
      console.error(
        editingRecord?.diag_id ? "编辑保存失败:" : "新增保存失败:",
        error,
      );
      return false;
    } finally {
      setModalSaving(false);
    }
  };

  const handleDeleteRow = async (record: DiagTcmRow) => {
    if (!isEdit || !record.diag_id) return;
    const res = await deleteDiagTcmAPI({ diag_id: record.diag_id });
    if (handleResponse(res, "删除成功")) {
      await loadData(true, record.diag_type as DiagTcmApiType);
    }
  };

  const handleMoveResult = async (
    res: { code: number; message: string; hint?: string },
    successText: string,
    type?: DiagTcmApiType,
  ) => {
    if (res.code === 0) {
      message.success(successText);
      await loadData(true, type);
    } else if (res.code < 0) {
      message.warning(`${res.message ?? ""}${res.hint ?? ""}`);
    } else {
      message.error(`${res.message ?? ""}${res.hint ?? ""}` || "操作失败");
    }
  };

  const handleMoveRowUp = async (record: DiagTcmRow) => {
    if (!record.diag_id) return;
    const res = await moveDiagUpTcmAPI({ diag_id: record.diag_id });
    await handleMoveResult(res, "上移成功", record.diag_type as DiagTcmApiType);
  };

  const handleMoveRowDown = async (record: DiagTcmRow) => {
    if (!record.diag_id) return;
    const res = await moveDiagDownTcmAPI({ diag_id: record.diag_id });
    await handleMoveResult(res, "下移成功", record.diag_type as DiagTcmApiType);
  };

  const getColumns = useCallback(
    (tableType: DiagTcmApiType): ColumnsType<DiagTcmRow> => [
      {
        title: softHeaderTitle("病"),
        dataIndex: "bing_name",
        key: "bing_name",
        width: 240,
        render: (_text: string, record) =>
          renderNameCode(record.bing_name, record.bing_code),
      },
      {
        title: softHeaderTitle("证"),
        dataIndex: "zheng_name",
        key: "zheng_name",
        width: 240,
        render: (_text: string, record) =>
          renderNameCode(record.zheng_name, record.zheng_code),
      },
      {
        title: softHeaderTitle("诊断医生"),
        dataIndex: "create_doctor_name",
        key: "create_doctor_name",
        width: 100,
        render: (text: string) => <span>{text || "-"}</span>,
      },
      {
        title: softHeaderTitle("诊断状态"),
        dataIndex: "diag_status",
        key: "diag_status",
        width: 100,
        render: (text: string) => {
          const status = text || DEFAULT_DIAG_STATUS;
          const config = DIAG_STATUS_MAP[status] || {
            text: status,
            color: "default",
          };
          return <Tag color={config.color}>{config.text}</Tag>;
        },
      },
      {
        title: (
          <div className="flex w-full justify-end">
            <Space size={0}>
              {isEdit && (
                <Tooltip title="新增">
                  <Button
                    type="link"
                    size="small"
                    icon={<PlusOutlined />}
                    className="p-0!"
                    onClick={() => handleAdd(tableType)}
                  />
                </Tooltip>
              )}
              <Tooltip title="刷新">
                <Button
                  type="link"
                  size="small"
                  icon={<ReloadOutlined />}
                  loading={refreshingType === tableType}
                  className="p-0!"
                  onClick={() => {
                    void loadData(true, tableType);
                  }}
                />
              </Tooltip>
            </Space>
          </div>
        ),
        key: "action",
        width: isEdit ? 160 : 64,
        fixed: "right",
        onHeaderCell: () => ({
          style: { textAlign: "right" },
        }),
        render: (_, record) => {
          if (!isEdit) return null;
          return (
            <Space size="small">
              <Button
                type="link"
                size="small"
                onClick={() => handleEdit(record)}
                className="p-0!"
              >
                编辑
              </Button>
              <Button
                type="link"
                size="small"
                danger
                onClick={() => {
                  void handleDeleteRow(record);
                }}
                className="p-0!"
              >
                删除
              </Button>
              <Space size={2}>
                <Button
                  type="link"
                  size="small"
                  onClick={() => {
                    void handleMoveRowUp(record);
                  }}
                  className="p-0!"
                >
                  上移
                </Button>
                <span className="text-(--app-theme-text-secondary)">|</span>
                <Button
                  type="link"
                  size="small"
                  onClick={() => {
                    void handleMoveRowDown(record);
                  }}
                  className="p-0!"
                >
                  下移
                </Button>
              </Space>
            </Space>
          );
        },
      },
    ],
    [isEdit, refreshingType, loadData],
  );

  useEffect(() => {
    if (!isEdit || !SessionId) return;
    getSessionInfo({ session_id: SessionId }).then((res) => {
      if (res.code === 0) {
        const info = res.session_info ?? res.access_info;
        setOrgId(info?.org_id ?? 0);
      }
    });
  }, [SessionId, isEdit]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!isEdit) closeModal();
  }, [isEdit]);

  if (!SessionId) {
    return <Empty description="请先登录" />;
  }

  if (validVisitId == null) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center bg-(--app-theme-bg-container)">
        <Empty description="请先选择患者" />
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 overflow-auto bg-(--app-theme-bg-container)">
      <div className="m-2 flex flex-col gap-6 rounded-lg">
        {displayTypes.map((type) => {
          const meta = DIAG_TCM_TYPE_META[type];
          const rows = dataSource.filter((item) => item.diag_type === type);
          // 出院中医诊断：无数据时不展示
          if (type === "DISCHARGE" && rows.length === 0) return null;
          return (
            <div key={type} className="px-2 py-2">
              <div className="mb-1">
                {showTypeTag && <Tag color={meta.color}>{meta.label}</Tag>}
              </div>
              <Table
                size="small"
                dataSource={rows}
                columns={getColumns(type)}
                rowKey={(record) => String(record.diag_id)}
                pagination={false}
                scroll={height != null ? { y: height } : undefined}
              />
            </div>
          );
        })}
      </div>
      <DiagTcmEditModal
        open={modalOpen}
        saving={modalSaving}
        title={`${editingRecord ? "编辑" : "新增"}${DIAG_TCM_TYPE_META[modalType].label}`}
        diagType={modalType}
        record={editingRecord}
        orgId={orgId}
        onCancel={closeModal}
        onSubmit={handleModalSubmit}
      />
    </div>
  );
});

export default DiagTcm;
