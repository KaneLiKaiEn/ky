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
import {
  Button,
  Empty,
  Modal,
  Space,
  Table,
  Tag,
  Tooltip,
  message,
} from "antd";
import dayjs from "dayjs";
import { getSessionId } from "comm/session";
import { getSessionInfo } from "@/api/auth";
import { getDeadPropertyAPI } from "@/api/dead";
import {
  addDiagAPI,
  cloneDiagAPI,
  deleteDiagAPI,
  getDiagListAPI,
  moveDiagDownAPI,
  moveDiagUpAPI,
  saveDiagPropertyAPI,
} from "@/api/diag";
import { getVisitPropertyAPI } from "@/api/visit";
import type { DeadRow } from "@/types/dead";
import type { DiagApiType, DiagRow, GetDiagListReq } from "@/types/diag";
import type { InitValue } from "@/pages/CustomForm/components/DataElem/types";
import { emitInPatientListRefresh } from "../InPatientList/events"; // 就诊患者列表刷新事件

/** 诊断写入后延时刷新左侧患者列表，避免GetClinicProperty数据未更新 */
const INPATIENT_LIST_REFRESH_DELAY_MS = 500;

const emitInPatientListRefreshLater = (visitId?: number | null) => {
  window.setTimeout(() => {
    emitInPatientListRefresh(visitId);
  }, INPATIENT_LIST_REFRESH_DELAY_MS);
};
import DiagEditModal, {
  type DiagFormFieldKey,
  type DiagFormValues,
  isDeathDiagType,
  parseDiagTag,
} from "./DiagEditModal";

/** 可选择的诊断表头列。操作列不在此列，始终保留 */
export const DIAG_COLUMN_KEYS = [
  "diag_desc",
  "diag_name",
  "diag_time",
  "admission_issue",
  "treat_issue",
  "discharge_issue",
  "diag_status",
  "diag_tag",
  "create_doctor_name",
  "create_time",
  "input_time",
] as const;

export type DiagColumnKey = (typeof DIAG_COLUMN_KEYS)[number];

export interface DiagnosisProps {
  visit_id?: number;
  patient_id?: number;
  isEdit?: boolean;
  /** 诊断类型。传入则只展示对应类型；不传则按全部类型分表展示（不含术前/术中/术后） */
  diag_type?: DiagApiType | DiagApiType[];
  /** 关联过滤：与 GetDiagList / 新增诊断的 link_* 一致；也可通过 ref.initSectionValue 注入 */
  link_name?: string;
  link_value?: number;
  link_data?: string;
  link_tag?: string;
  link_ext?: string;
  /** 是否显示表头的克隆来源按钮，默认显示 */
  showClone?: boolean;
  /**
   * 进入页面时，术前 / 术中 / 术后诊断为空则自动克隆。
   * 术前 ← 当前诊断；术中 ← 术前诊断；术后 ← 术中诊断，术中为空时 ← 术前诊断。
   * 默认关闭。
   */
  autoClone?: boolean;
  /**
   * 需要展示的表头列，按传入顺序显示。
   * 不传则展示全部数据列。操作列始终保留。
   */
  columnList?: DiagColumnKey[];
  /** 是否显示诊断类型标签，默认显示 */
  showTypeTag?: boolean;
  /**
   * 弹窗需要展示的表单项，按传入顺序显示。
   * 不传则展示全部。类型专属项仍只在对应诊断类型下出现。
   */
  formFieldList?: DiagFormFieldKey[];
  /**
   * 列表加载或变更后回调，参数为当前展示范围内的诊断行。
   * 初次加载成功，以及新增、修改、删除、排序、克隆、导入、刷新后都会触发。
   */
  onChange?: (rows: DiagRow[]) => void;
  /** 诊断表格滚动高度。传入后表格使用 scroll.y */
  height?: number | string;
}

/** 供 SectionCode 收集诊断行并触发初始化刷新 */
export interface DiagnosisRef {
  getDiagRows: () => DiagRow[];
  initSectionValue: (initSectionValue: InitValue) => void;
  /** 刷新列表。传入类型时只刷新该类型 */
  refresh: (type?: DiagApiType) => Promise<void>;
  /** 打开新增弹窗。只展示一种类型时可以不传 */
  openAdd: (type?: DiagApiType) => void;
}

type DiagLinkQuery = Pick<
  GetDiagListReq,
  "link_name" | "link_value" | "link_data" | "link_tag" | "link_ext"
>;

const DIAG_TYPE_META: Record<DiagApiType, { label: string; color: string }> = {
  ACTIVE: { label: "当前诊断", color: "blue" },
  CLINIC: { label: "门诊诊断", color: "orange" },
  INIT: { label: "初步诊断", color: "cyan" },
  ADMISSION: { label: "入院诊断", color: "green" },
  DISCHARGE: { label: "出院诊断", color: "purple" },
  OPS_BEFORE: { label: "术前诊断", color: "geekblue" },
  OPS: { label: "术中诊断", color: "volcano" },
  OPS_AFTER: { label: "术后诊断", color: "lime" },
  PATHOLOGY: { label: "病理诊断", color: "magenta" },
  INJURY: { label: "损伤中毒外部因素", color: "gold" },
  DEAD: { label: "死因", color: "error" },
};

/** 初步 / 入院 / 出院变更后，后端会同步当前诊断 */
const TYPES_REFRESH_ACTIVE: readonly DiagApiType[] = [
  "INIT",
  "ADMISSION",
  "DISCHARGE",
];

const DIAG_STATUS_MAP: Record<string, { text: string; color: string }> = {
  CONFIRM: { text: "确诊", color: "success" },
  DOUBT: { text: "疑似", color: "warning" },
  // CANCEL: { text: "取消", color: "error" },
};

/** 展示顺序：当前 → 门诊 → 初步 → 入院 → 出院 → 术前 → 术中 → 术后 → 病理 → 损伤中毒外部因素 → 死因 */
const ALL_DIAG_TYPES: DiagApiType[] = [
  "ACTIVE",
  "CLINIC",
  "INIT",
  "ADMISSION",
  "DISCHARGE",
  "OPS_BEFORE",
  "OPS",
  "OPS_AFTER",
  "PATHOLOGY",
  "INJURY",
  "DEAD",
];
const BASE_DIAG_TYPES = ALL_DIAG_TYPES.filter((type) => type !== "DEAD");
/** 手术相关诊断：仅在显式传入 diag_type 时展示 */
const OPS_DIAG_TYPES: DiagApiType[] = ["OPS_BEFORE", "OPS", "OPS_AFTER"];
const isOpsDiagType = (type: DiagApiType) => OPS_DIAG_TYPES.includes(type);

/** 自动克隆顺序：先补术前，再补术中，最后补术后，后面的类型能用到刚克隆出来的来源 */
const OPS_AUTO_CLONE_ORDER: DiagApiType[] = ["OPS_BEFORE", "OPS", "OPS_AFTER"];
/** 来源按优先级排列。术后优先术中，术中为空再用术前 */
const OPS_AUTO_CLONE_SOURCES: Partial<Record<DiagApiType, DiagApiType[]>> = {
  OPS_BEFORE: ["ACTIVE"],
  OPS: ["OPS_BEFORE"],
  OPS_AFTER: ["OPS", "OPS_BEFORE"],
};

const softHeaderTitle = (title: string) => (
  <span className="font-normal opacity-25">{title}</span>
);

const isDeadPropertyPresent = (prop?: DeadRow | null) => {
  if (prop == null) return false;
  return Object.values(prop).some((value) => value != null && value !== "");
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

const normalizeDiagTypes = (
  diagType?: DiagApiType | DiagApiType[],
): DiagApiType[] => {
  if (diagType == null) return ALL_DIAG_TYPES;
  const requested = Array.isArray(diagType) ? diagType : [diagType];
  return ALL_DIAG_TYPES.filter((type) => requested.includes(type));
};

const buildDiagRowData = (
  type: DiagApiType,
  values: DiagFormValues,
  existing?: DiagRow | null,
): Partial<DiagRow> => {
  const diagRowData: Partial<DiagRow> = {
    item_id: values.item_id,
    diag_name: values.diag_name,
    diag_code: values.diag_code,
    diag_status: values.diag_status,
    diag_desc: values.diag_desc || values.diag_name,
    diag_tag: values.diag_tag?.length
      ? values.diag_tag.map((tag) => `[${tag}]`).join("")
      : "",
    diag_type: type,
  };

  if (isDeathDiagType(type)) {
    diagRowData.diag_time = values.diag_time
      ? values.diag_time.format("YYYY-MM-DD HH:mm")
      : undefined;
  } else {
    diagRowData.diag_time = existing?.diag_time
      ? dayjs(existing.diag_time).format("YYYY-MM-DD HH:mm")
      : dayjs().format("YYYY-MM-DD HH:mm");
  }

  if (type === "ADMISSION") {
    diagRowData.admission_issue = values.admission_issue;
    diagRowData.treat_issue = values.treat_issue;
  }
  if (type === "DISCHARGE") {
    diagRowData.admission_issue = values.admission_issue;
    diagRowData.discharge_issue = values.discharge_issue;
  }

  return diagRowData;
};

/** 门诊当前诊断转成住院门诊诊断的新增行，不带源记录的主键和审计字段 */
const buildClinicDiagFromOutpatient = (
  row: DiagRow,
  link: DiagLinkQuery,
): Partial<DiagRow> => ({
  diag_level: row.diag_level,
  body_position: row.body_position,
  body_name: row.body_name,
  body_code: row.body_code,
  body_code_system: row.body_code_system,
  diag_time: row.diag_time
    ? dayjs(row.diag_time).format("YYYY-MM-DD HH:mm")
    : dayjs().format("YYYY-MM-DD HH:mm"),
  diag_desc: row.diag_desc || row.diag_name,
  diag_name: row.diag_name,
  diag_code: row.diag_code,
  item_id: row.item_id,
  diag_name2: row.diag_name2,
  diag_code2: row.diag_code2,
  item_id2: row.item_id2,
  diag_code_system: row.diag_code_system,
  diag_status: row.diag_status,
  diag_tag: row.diag_tag,
  diag_note: row.diag_note,
  diag_catalog: row.diag_catalog,
  diag_stage: row.diag_stage,
  diag_grade: row.diag_grade,
  diag_degree: row.diag_degree,
  diag_group: row.diag_group,
  admission_issue: row.admission_issue,
  treat_issue: row.treat_issue,
  discharge_issue: row.discharge_issue,
  diag_type: "CLINIC",
  ...link,
});

/**
 * 诊断管理。
 * 传入 diag_type 时只展示对应类型；不传则展示全部类型（不含术前/术中/术后）。
 * 未传类型时，死因仅在 dead/GetDeadProperty 返回 dead_property 非空时展示。
 * isEdit 为 true 时可新增/编辑；为 false 时仅查看。
 * autoClone 为 true 时，进入页面若术前/术中/术后为空则按来源自动克隆。
 * 可通过 props 或 ref.initSectionValue 传入 link_*，用于列表过滤与新增关联。
 */
const Diagnosis = forwardRef<DiagnosisRef, DiagnosisProps>(function Diagnosis(
  {
    visit_id,
    patient_id,
    isEdit = false,
    diag_type,
    link_name,
    link_value,
    link_data,
    link_tag,
    link_ext,
    showClone = true,
    autoClone = false,
    columnList,
    showTypeTag = true,
    formFieldList,
    onChange,
    height,
  },
  ref,
) {
  const validVisitId =
    visit_id != null && Number.isFinite(visit_id) && visit_id > 0
      ? visit_id
      : null;
  const SessionId = getSessionId();
  const linkQueryFromProps = useMemo<DiagLinkQuery>(
    () => ({
      link_name,
      link_value,
      link_data,
      link_tag,
      link_ext,
    }),
    [link_name, link_value, link_data, link_tag, link_ext],
  );
  const hasLinkProps =
    link_name != null ||
    link_value != null ||
    link_data != null ||
    link_tag != null ||
    link_ext != null;
  const linkQueryRef = useRef<DiagLinkQuery>(
    hasLinkProps ? linkQueryFromProps : {},
  );
  const [showDeath, setShowDeath] = useState(false);
  const displayTypes = useMemo(() => {
    if (diag_type != null) return normalizeDiagTypes(diag_type);
    // 未传 diag_type 时不展示术前/术中/术后诊断
    const types = showDeath ? ALL_DIAG_TYPES : BASE_DIAG_TYPES;
    return types.filter((type) => !isOpsDiagType(type));
  }, [diag_type, showDeath]);
  const showClinic = displayTypes.includes("CLINIC");

  const [dataSource, setDataSource] = useState<DiagRow[]>([]);
  const [refreshingType, setRefreshingType] = useState<DiagApiType | null>(
    null,
  );
  const [orgId, setOrgId] = useState<number>(0);
  const [workType, setWorkType] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSaving, setModalSaving] = useState(false);
  /** 克隆中的 from->as 键，避免重复点击 */
  const [cloningKey, setCloningKey] = useState<string | null>(null);
  /** 同一就诊只询问一次是否导入门诊诊断 */
  const clinicImportCheckedVisitRef = useRef<number | null>(null);
  /** 同一就诊、关联和展示类型只自动克隆一次 */
  const autoCloneDoneRef = useRef<string | null>(null);
  /** 只让最后一次进入页面的检查去克隆，避免重复写入 */
  const autoCloneAttemptRef = useRef(0);
  const [modalType, setModalType] = useState<DiagApiType>("ACTIVE");
  const [editingRecord, setEditingRecord] = useState<DiagRow | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  /** 至少成功拉到一次列表后才回调，避免挂载时把空数组抛给外部 */
  const listReadyRef = useRef(false);

  // props 传入 link_* 时同步到查询条件；未传时保留 initSectionValue 注入的值
  useEffect(() => {
    if (!hasLinkProps) return;
    linkQueryRef.current = linkQueryFromProps;
  }, [hasLinkProps, linkQueryFromProps]);

  const loadData = useCallback(
    async (
      forceRefresh = false,
      type?: DiagApiType,
    ): Promise<DiagRow[] | null> => {
      if (validVisitId == null) return null;
      if (forceRefresh && type) setRefreshingType(type);
      try {
        const queryType =
          type ?? (displayTypes.length === 1 ? displayTypes[0] : undefined);
        const res = await getDiagListAPI({
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
          return list;
        }
        message.error(res.message || "获取诊断列表失败");
        return null;
      } catch (error) {
        console.error("获取诊断列表失败:", error);
        return null;
      } finally {
        if (forceRefresh && type) setRefreshingType(null);
      }
    },
    // linkQueryFromProps：props 变更时重新拉取关联诊断
    [validVisitId, displayTypes, linkQueryFromProps],
  );

  /** 初步 / 入院 / 出院变更后，再拉一次当前诊断 */
  const reloadActiveIfNeeded = async (type?: DiagApiType) => {
    if (
      type &&
      TYPES_REFRESH_ACTIVE.includes(type) &&
      displayTypes.includes("ACTIVE")
    ) {
      await loadData(true, "ACTIVE");
    }
  };

  useEffect(() => {
    if (!listReadyRef.current) return;
    onChangeRef.current?.(
      dataSource.filter((item) =>
        displayTypes.includes((item.diag_type as DiagApiType) || "ACTIVE"),
      ),
    );
  }, [dataSource, displayTypes]);

  useImperativeHandle(
    ref,
    () => ({
      getDiagRows: () =>
        dataSource.filter((item) =>
          displayTypes.includes((item.diag_type as DiagApiType) || "ACTIVE"),
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
      refresh: async (type?: DiagApiType) => {
        await loadData(true, type);
      },
      openAdd: (type?: DiagApiType) => {
        if (!isEdit) return;
        const target =
          type ?? (displayTypes.length === 1 ? displayTypes[0] : undefined);
        if (!target) return;
        setModalType(target);
        setEditingRecord(null);
        setModalOpen(true);
      },
    }),
    [dataSource, displayTypes, isEdit, loadData],
  );

  const closeModal = () => {
    setModalOpen(false);
    setEditingRecord(null);
  };

  const handleAdd = (tableType: DiagApiType) => {
    if (!isEdit) return;
    setModalType(tableType);
    setEditingRecord(null);
    setModalOpen(true);
  };

  const handleEdit = (record: DiagRow) => {
    if (!isEdit) return;
    setModalType((record.diag_type as DiagApiType) || modalType);
    setEditingRecord(record);
    setModalOpen(true);
  };

  const handleModalSubmit = async (
    values: DiagFormValues,
    closeAfterSave: boolean,
  ): Promise<boolean> => {
    if (validVisitId == null) return false;
    const requireName = !formFieldList || formFieldList.includes("diag_name");
    const requireStatus =
      !formFieldList || formFieldList.includes("diag_status");
    if (
      (requireName && !values.item_id) ||
      (requireStatus && !values.diag_status)
    ) {
      message.warning("请完善诊断名称和状态");
      return false;
    }
    setModalSaving(true);
    try {
      const diagRowData = buildDiagRowData(modalType, values, editingRecord);
      const isEditRow = Boolean(editingRecord?.diag_id);
      const res =
        isEditRow && editingRecord?.diag_id
          ? await saveDiagPropertyAPI({
              diag_id: editingRecord.diag_id,
              diag_property: diagRowData,
            })
          : await addDiagAPI({
              visit_id: validVisitId,
              diag_type: modalType,
              diag_info: {
                diag_row: {
                  ...diagRowData,
                  ...linkQueryRef.current,
                },
              },
            });
      if (!handleResponse(res, isEditRow ? "修改成功" : "新增成功")) {
        return false;
      }
      emitInPatientListRefreshLater(validVisitId);
      await loadData(true, modalType);
      await reloadActiveIfNeeded(modalType);
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

  const handleDeleteRow = async (record: DiagRow) => {
    if (!isEdit || !record.diag_id) return;
    const res = await deleteDiagAPI({ diag_id: record.diag_id });
    if (handleResponse(res, "删除成功")) {
      emitInPatientListRefreshLater(validVisitId);
      const diagType = record.diag_type as DiagApiType;
      await loadData(true, diagType);
      await reloadActiveIfNeeded(diagType);
    }
  };

  const handleMoveResult = async (
    res: { code: number; message: string; hint?: string },
    successText: string,
    type?: DiagApiType,
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

  const handleMoveRowUp = async (record: DiagRow) => {
    if (!record.diag_id) return;
    const res = await moveDiagUpAPI({ diag_id: record.diag_id });
    await handleMoveResult(res, "上移成功", record.diag_type as DiagApiType);
  };

  const handleMoveRowDown = async (record: DiagRow) => {
    if (!record.diag_id) return;
    const res = await moveDiagDownAPI({ diag_id: record.diag_id });
    await handleMoveResult(res, "下移成功", record.diag_type as DiagApiType);
  };

  const handleCloneDiag = async (
    fromType: DiagApiType,
    asType: DiagApiType,
  ) => {
    if (!isEdit || validVisitId == null || cloningKey) return;
    const key = `${fromType}->${asType}`;
    setCloningKey(key);
    try {
      const { link_name: cloneLinkName, link_value: cloneLinkValue } =
        linkQueryRef.current;
      const res = await cloneDiagAPI({
        visit_id: validVisitId,
        from_type: fromType,
        as_type: asType,
        link_name: cloneLinkName,
        link_value: cloneLinkValue,
      });
      if (handleResponse(res, "克隆成功")) {
        emitInPatientListRefreshLater(validVisitId);
        await loadData(true, asType);
        await reloadActiveIfNeeded(asType);
      }
    } catch (error) {
      console.error("克隆诊断失败:", error);
    } finally {
      setCloningKey(null);
    }
  };
  // 导入门诊诊断
  const importClinicDiagList = useCallback(
    async (sourceList: DiagRow[]) => {
      if (validVisitId == null || sourceList.length === 0) return;
      let added = false;
      for (const row of sourceList) {
        const res = await addDiagAPI({
          visit_id: validVisitId,
          diag_type: "CLINIC",
          diag_info: {
            diag_row: buildClinicDiagFromOutpatient(row, linkQueryRef.current),
          },
        });
        if (res.code !== 0) {
          message.error(res.message + res.hint);
          if (added) emitInPatientListRefreshLater(validVisitId);
          await loadData(true, "CLINIC");
          return;
        }
        added = true;
      }
      message.success("已导入门诊诊断");
      emitInPatientListRefreshLater(validVisitId);
      await loadData(true, "CLINIC");
    },
    [validVisitId, loadData],
  );

  /** 各诊断表头「获取来源诊断」按钮，与出院诊断获取当前诊断同逻辑 */
  const getCloneSourceButtons = (
    tableType: DiagApiType,
  ): { from: DiagApiType; label: string }[] => {
    if (tableType === "INIT") return [{ from: "CLINIC", label: "门诊诊断" }];
    if (tableType === "ADMISSION") return [{ from: "INIT", label: "初步诊断" }];
    if (tableType === "DISCHARGE")
      return [{ from: "ACTIVE", label: "当前诊断" }];
    if (tableType === "OPS_BEFORE")
      return [{ from: "ACTIVE", label: "当前诊断" }];
    if (tableType === "OPS") return [{ from: "OPS_BEFORE", label: "术前诊断" }];
    if (tableType === "OPS_AFTER")
      return [
        { from: "OPS", label: "术中诊断" },
        { from: "OPS_BEFORE", label: "术前诊断" },
      ];
    return [];
  };

  const getColumns = useCallback(
    (tableType: DiagApiType): ColumnsType<DiagRow> => {
      const showDiagTime = isDeathDiagType(tableType);
      const showAdmissionIssue =
        tableType === "ADMISSION" || tableType === "DISCHARGE";
      const showTreatIssue = tableType === "ADMISSION";
      const showDischargeIssue = tableType === "DISCHARGE";

      // 各诊断类型共用同一套列宽与列序，专属字段在不适用的表中留空占位，保证上下对齐
      const allColumns: ColumnsType<DiagRow> = [
        {
          title: softHeaderTitle("临床诊断"),
          dataIndex: "diag_desc",
          key: "diag_desc",
          width: 240,
          ellipsis: true,
          render: (text: string) => <span>{text || "-"}</span>,
        },
        {
          title: softHeaderTitle("诊断字典"),
          dataIndex: "diag_name",
          key: "diag_name",
          width: 280,
          ellipsis: true,
          render: (_text: string, record) => {
            if (!record.diag_name && !record.diag_code) return "-";
            return (
              <div className="flex min-w-0 max-w-full items-center gap-2 overflow-hidden">
                <span
                  className="min-w-0 flex-1 truncate opacity-50"
                  title={record.diag_name || undefined}
                >
                  {record.diag_name || "-"}
                </span>
                <span
                  className="min-w-0 max-w-[40%] shrink truncate text-(--app-theme-text-tertiary)"
                  title={record.diag_code || undefined}
                >
                  {record.diag_code || "-"}
                </span>
              </div>
            );
          },
        },
        {
          title: showDiagTime ? softHeaderTitle("诊断时间") : null,
          dataIndex: "diag_time",
          key: "diag_time",
          width: 130,
          render: (time: string) => {
            if (!showDiagTime) return null;
            return time ? dayjs(time).format("YYYY-MM-DD HH:mm") : "-";
          },
        },
        {
          title: showAdmissionIssue ? softHeaderTitle("入院病情") : null,
          dataIndex: "admission_issue",
          key: "admission_issue",
          width: 100,
          ellipsis: true,
          render: (text: string) =>
            showAdmissionIssue ? <span>{text || "-"}</span> : null,
        },
        {
          title: showTreatIssue ? softHeaderTitle("是否治疗") : null,
          dataIndex: "treat_issue",
          key: "treat_issue",
          width: 50,
          render: (text: string) =>
            showTreatIssue ? <span>{text || "-"}</span> : null,
        },
        {
          title: showDischargeIssue ? softHeaderTitle("出院转归") : null,
          dataIndex: "discharge_issue",
          key: "discharge_issue",
          width: 100,
          ellipsis: true,
          render: (text: string) =>
            showDischargeIssue ? <span>{text || "-"}</span> : null,
        },
        {
          title: softHeaderTitle("状态"),
          dataIndex: "diag_status",
          key: "diag_status",
          width: 50,

          render: (text: string) => {
            const config = DIAG_STATUS_MAP[text] || {
              text: text || "-",
              color: "default",
            };
            return <Tag color={config.color}>{config.text}</Tag>;
          },
        },
        {
          title: softHeaderTitle("标签"),
          dataIndex: "diag_tag",
          key: "diag_tag",
          width: 130,
          render: (text: string) => {
            const tags = parseDiagTag(text);
            if (!tags.length) return "";
            return (
              <Space size={4} wrap>
                {tags.map((tag) => (
                  <Tag key={tag} color="red">
                    {tag}
                  </Tag>
                ))}
              </Space>
            );
          },
        },
        {
          title: softHeaderTitle("诊断医生"),
          dataIndex: "create_doctor_name",
          key: "create_doctor_name",
          width: 80,
          render: (text: string) => <span>{text || ""}</span>,
        },
        {
          title: softHeaderTitle("录入时间"),
          dataIndex: "create_time",
          key: "create_time",
          width: 130,
          render: (time: string) =>
            time ? dayjs(time).format("YYYY-MM-DD HH:mm") : "",
        },
        {
          title: softHeaderTitle("修改时间"),
          dataIndex: "input_time",
          key: "input_time",
          width: 130,
          render: (time: string) =>
            time ? dayjs(time).format("YYYY-MM-DD HH:mm") : "",
        },
        {
          title: (
            <div className="flex w-full justify-end">
              <Space size={0}>
                {showClone &&
                  isEdit &&
                  getCloneSourceButtons(tableType).map(({ from, label }) => {
                    const key = `${from}->${tableType}`;
                    return (
                      <Button
                        key={key}
                        title={`克隆${label}`}
                        type="link"
                        size="small"
                        className="p-0!"
                        loading={cloningKey === key}
                        disabled={Boolean(cloningKey) && cloningKey !== key}
                        onClick={() => {
                          void handleCloneDiag(from, tableType);
                        }}
                      >
                        {label}
                      </Button>
                    );
                  })}
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
          width: isEdit ? (tableType === "OPS_AFTER" ? 300 : 220) : 64,
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
                  onClick={() => handleDeleteRow(record)}
                  className="p-0!"
                >
                  删除
                </Button>
                <Space size={2}>
                  <Button
                    type="link"
                    size="small"
                    onClick={() => handleMoveRowUp(record)}
                    className="p-0!"
                  >
                    上移
                  </Button>
                  <span className="text-(--app-theme-text-secondary)">|</span>
                  <Button
                    type="link"
                    size="small"
                    onClick={() => handleMoveRowDown(record)}
                    className="p-0!"
                  >
                    下移
                  </Button>
                </Space>
              </Space>
            );
          },
        },
      ];
      const actionColumn = allColumns[allColumns.length - 1];
      if (!columnList) return allColumns;
      const picked = columnList.flatMap((key) => {
        const column = allColumns.find((item) => item.key === key);
        return column ? [column] : [];
      });
      return [...picked, actionColumn];
    },
    [isEdit, refreshingType, cloningKey, loadData, showClone, columnList],
  );

  useEffect(() => {
    if (diag_type != null) return;
    let cancelled = false;

    const resolvePatientId = async () => {
      if (patient_id != null && Number.isFinite(patient_id) && patient_id > 0) {
        return patient_id;
      }
      if (validVisitId == null) return null;
      const visitRes = await getVisitPropertyAPI({
        visit_id: validVisitId,
        column_visit: "*",
        column_patient: "*",
      });
      return (
        visitRes.visit_property?.patient_id ??
        visitRes.patient_property?.patient_id ??
        null
      );
    };

    const loadDeadProperty = async () => {
      try {
        const pid = await resolvePatientId();
        if (pid == null || pid <= 0) {
          if (!cancelled) setShowDeath(false);
          return;
        }
        const res = await getDeadPropertyAPI({ patient_id: pid });
        if (cancelled) return;
        setShowDeath(
          res.code === 0 && isDeadPropertyPresent(res.dead_property),
        );
      } catch (error) {
        console.error("获取死亡属性失败:", error);
        if (!cancelled) setShowDeath(false);
      }
    };

    void loadDeadProperty();
    return () => {
      cancelled = true;
    };
  }, [diag_type, patient_id, validVisitId]);

  useEffect(() => {
    if (!isEdit || !SessionId) return;
    getSessionInfo({ session_id: SessionId }).then((res) => {
      if (res.code === 0) {
        const info = res.session_info ?? res.access_info;
        setOrgId(info?.org_id ?? 0);
        setWorkType(info?.work_type ?? "");
      }
    });
  }, [SessionId, isEdit]);
  //同一就诊只询问一次是否导入门诊诊断
  useEffect(() => {
    if (
      !isEdit ||
      !SessionId ||
      validVisitId == null ||
      !showClinic ||
      workType.toUpperCase() !== "DOCTOR"
    ) {
      return;
    }
    if (clinicImportCheckedVisitRef.current === validVisitId) return;

    let cancelled = false;

    const promptImportClinicDiag = async () => {
      try {
        const clinicRes = await getDiagListAPI({
          visit_id: validVisitId,
          diag_type: "CLINIC",
          ...linkQueryRef.current,
        });
        if (cancelled || clinicRes.code !== 0) return;
        if ((clinicRes.diag_list || []).length > 0) {
          clinicImportCheckedVisitRef.current = validVisitId;
          return;
        }

        const visitRes = await getVisitPropertyAPI({
          visit_id: validVisitId,
          column_visit: "*",
          column_ip: "*",
        });
        if (cancelled) return;
        const clinicId = visitRes.ip_property?.clinic_id;
        if (clinicId == null || clinicId <= 0) {
          clinicImportCheckedVisitRef.current = validVisitId;
          return;
        }

        const sourceRes = await getDiagListAPI({
          visit_id: clinicId,
          diag_type: "ACTIVE",
        });
        if (cancelled || sourceRes.code !== 0) return;
        const sourceList = sourceRes.diag_list || [];
        clinicImportCheckedVisitRef.current = validVisitId;
        if (sourceList.length === 0) return;

        Modal.confirm({
          title: "导入门诊诊断",
          content: "是否导入门诊诊断？",
          okText: "是",
          cancelText: "否",
          onOk: () => importClinicDiagList(sourceList),
        });
      } catch (error) {
        console.error("检查门诊诊断失败:", error);
      }
    };

    void promptImportClinicDiag();
    return () => {
      cancelled = true;
    };
  }, [
    isEdit,
    SessionId,
    validVisitId,
    showClinic,
    workType,
    importClinicDiagList,
  ]);

  useEffect(() => {
    const attempt = ++autoCloneAttemptRef.current;
    let cancelled = false;
    const stale = () => cancelled || attempt !== autoCloneAttemptRef.current;

    const run = async () => {
      const list = await loadData();
      if (
        stale() ||
        list == null ||
        !autoClone ||
        !isEdit ||
        validVisitId == null
      )
        return;
      if (!displayTypes.some(isOpsDiagType)) return;

      const scope = [
        validVisitId,
        link_name ?? "",
        link_value ?? "",
        link_data ?? "",
        link_tag ?? "",
        link_ext ?? "",
        displayTypes.join(","),
      ].join("|");
      if (autoCloneDoneRef.current === scope) return;

      // 页面刚拉过的类型直接计数，避免同一 diag_type 再请求一次
      const counts = new Map<DiagApiType, number>();
      if (displayTypes.length === 1) {
        counts.set(displayTypes[0], list.length);
      } else {
        for (const type of displayTypes) counts.set(type, 0);
        for (const row of list) {
          const type = row.diag_type as DiagApiType;
          if (counts.has(type)) counts.set(type, (counts.get(type) ?? 0) + 1);
        }
      }

      const typesToLoad = new Set<DiagApiType>();
      for (const target of OPS_AUTO_CLONE_ORDER) {
        if (!displayTypes.includes(target)) continue;
        if ((counts.get(target) ?? 0) > 0) continue;
        for (const source of OPS_AUTO_CLONE_SOURCES[target] ?? []) {
          if (!counts.has(source)) typesToLoad.add(source);
        }
      }

      if (typesToLoad.size > 0) {
        try {
          const loaded = await Promise.all(
            [...typesToLoad].map(async (type) => {
              const res = await getDiagListAPI({
                visit_id: validVisitId,
                diag_type: type,
                // 当前诊断不挂手术关联，带上 link 会查不到可克隆来源
                ...(type === "ACTIVE" ? {} : linkQueryRef.current),
              });
              return { type, res };
            }),
          );
          if (stale()) return;
          for (const { type, res } of loaded) {
            if (res.code !== 0) {
              message.error(res.message || "获取诊断列表失败");
              return;
            }
            counts.set(type, (res.diag_list || []).length);
          }
        } catch (error) {
          console.error("自动克隆前获取诊断失败:", error);
          return;
        }
      }

      for (const target of OPS_AUTO_CLONE_ORDER) {
        if (stale()) return;
        if (!displayTypes.includes(target)) continue;
        if ((counts.get(target) ?? 0) > 0) continue;
        const from = (OPS_AUTO_CLONE_SOURCES[target] ?? []).find(
          (source) => (counts.get(source) ?? 0) > 0,
        );
        if (!from) continue;

        setCloningKey(`${from}->${target}`);
        try {
          const { link_name: cloneLinkName, link_value: cloneLinkValue } =
            linkQueryRef.current;
          const res = await cloneDiagAPI({
            visit_id: validVisitId,
            from_type: from,
            as_type: target,
            link_name: cloneLinkName,
            link_value: cloneLinkValue,
          });
          if (stale()) return;
          if (!handleResponse(res, `已自动克隆${DIAG_TYPE_META[from].label}`)) {
            return;
          }
          counts.set(target, 1);
          emitInPatientListRefreshLater(validVisitId);
          await loadData(true, target);
        } catch (error) {
          console.error("自动克隆诊断失败:", error);
          return;
        } finally {
          setCloningKey(null);
        }
        if (stale()) return;
      }

      if (!stale()) autoCloneDoneRef.current = scope;
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [
    loadData,
    autoClone,
    isEdit,
    validVisitId,
    link_name,
    link_value,
    link_data,
    link_tag,
    link_ext,
    displayTypes,
  ]);

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
          const meta = DIAG_TYPE_META[type];
          const rows = dataSource.filter((item) => item.diag_type === type);
          // 未指定类型时，出院诊断无数据不展示；section_code 指定 diag_discharge 时始终展示
          if (type === "DISCHARGE" && rows.length === 0 && diag_type == null) {
            return null;
          }
          return (
            <div key={type} className="px-2 py-2">
              {showTypeTag && (
                <div className="mb-1">
                  <Tag color={meta.color}>{meta.label}</Tag>
                </div>
              )}
              <Table
                size="small"
                tableLayout="fixed"
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
      <DiagEditModal
        open={modalOpen}
        saving={modalSaving}
        title={`${editingRecord ? "编辑" : "新增"}${DIAG_TYPE_META[modalType].label}`}
        diagType={modalType}
        record={editingRecord}
        orgId={orgId}
        visitId={validVisitId}
        patientId={patient_id}
        formFieldList={formFieldList}
        onCancel={closeModal}
        onSubmit={handleModalSubmit}
      />
    </div>
  );
});

export default Diagnosis;
