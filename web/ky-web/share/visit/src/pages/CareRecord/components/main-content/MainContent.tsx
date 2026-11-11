import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type MouseEvent,
  type SetStateAction,
} from "react";
import {
  Button,
  Checkbox,
  DatePicker,
  Empty,
  Modal,
  Select,
  Space,
  Splitter,
  Table,
  Tabs,
  Tag,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import {
  DeleteOutlined,
  EllipsisOutlined,
  LeftOutlined,
  ReloadOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { getSessionId } from "comm/session";
import { print, printPreview } from "@/pages/PrintList";
import AddCareMask from "../CareMask/AddCareMask";
import IoEditModal from "../IoEditModal";
import OxygenEditModal from "../OxygenEditModal";
import TransferCareLevel from "../transfer-care-level/TransferCareLevel";
import {
  shouldShowVitalForm,
  type CareRecordTableColumnKey,
} from "../../columns";
import { timeGapList } from "../../data/tabData";
import {
  getFormattedDate,
  getDateAfterDays,
  getPreviousDayDate,
  getNextDayDate,
  formatDateTimeMinute,
  getNextContinuousCareTime,
  getCurrentDateTime2,
  getCareTimePlusOneMinute,
} from "../../utils/time-func";
import {
  type CareRecordRow,
  type ElemProps,
  initElemProps,
  mergeCareRelatedLists,
  getRowDisplayStatus,
  isSelectableRow,
} from "../../utils/care-related";
import { loadElemProperty } from "../../utils/elem-property";
import {
  deleteCareAPI,
  deleteIo2API,
  deleteObserve2API,
  deleteOxygenAPI,
  getCareListAPI,
  getIoListAPI,
  getObserveListAPI,
  getOxygenListAPI,
  getSessionInfoAPI,
  getVisitPropertyAPI,
  newCareAPI,
  saveCarePropertyAPI,
  saveIoPropertyAPI,
  saveObserveListAPI,
  saveOxygenPropertyAPI,
  commitIoAPI,
  undoCommitIoAPI,
} from "../../api";

const initProps: ElemProps = initElemProps;

const initCareProperty = {
  care_time: "",
  care_content: "",
  health_level: "一般",
  link_name: undefined as string | undefined,
  link_value: undefined as number | undefined,
  link_tag: undefined as string | undefined,
};

const TABLE_HEADER_FALLBACK = 39;
const TABLE_BODY_MIN_H = 80;

type EntryTab = "vital" | "io" | "oxygen";

export type CareLinkFilter = {
  link_name: string;
  link_value: number | string;
  link_tag?: string;
};

export interface MainContentProps {
  visitId?: number;
  isEdit?: boolean;
  entryMode?: "panel" | "modal";
  linkFilter?: CareLinkFilter;
  onRowDoubleClick?: (record: CareRecordRow) => void;
  visibleColumns?: readonly CareRecordTableColumnKey[];
  vitalEntryInModal?: boolean;
  showTransferCareLevel?: boolean;
  showAddButton?: boolean;
  compactTableFont?: boolean;
  showLoad24HourInOut?: boolean;
  showLinkSurgery?: boolean;
  showReportReference?: boolean;
}

export type CareRecordHandle = {
  openAddModal: () => void;
};

const MainContent = forwardRef<CareRecordHandle, MainContentProps>(
  function MainContent(
    {
  visitId,
  isEdit = false,
  entryMode = "panel",
  linkFilter,
  onRowDoubleClick,
  visibleColumns,
  vitalEntryInModal = false,
  showTransferCareLevel = true,
  showAddButton = false,
  compactTableFont = true,
  showLoad24HourInOut = false,
  showLinkSurgery = true,
  showReportReference = false,
    },
    ref,
  ) {
  const visit_id = visitId != null ? Number(visitId) : NaN;
  const SessionId = getSessionId();
  const useModalEntry =
    isEdit && (entryMode === "modal" || vitalEntryInModal);

  const visibleColumnSet = useMemo(() => {
    if (!visibleColumns?.length) return null;
    return new Set<CareRecordTableColumnKey>(visibleColumns);
  }, [visibleColumns]);

  const showVitalForm = shouldShowVitalForm(visibleColumns);
  const useCompactTableFont = compactTableFont !== false;
  const customVisibleColumns = Boolean(visibleColumnSet);
  const tableScrollX = useMemo(() => {
    if (customVisibleColumns || linkFilter) return undefined;
    return 1200;
  }, [customVisibleColumns, linkFilter]);

  const baseInitCareProperty = useMemo(() => {
    if (!linkFilter) return { ...initCareProperty };
    return {
      ...initCareProperty,
      link_name: linkFilter.link_name,
      link_value: Number(linkFilter.link_value),
      ...(linkFilter.link_tag ? { link_tag: linkFilter.link_tag } : {}),
    };
  }, [linkFilter]);

  const buildLinkPayload = (property: typeof initCareProperty) => {
    if (linkFilter) {
      return {
        link_name: linkFilter.link_name,
        link_value: Number(linkFilter.link_value),
        ...(linkFilter.link_tag ? { link_tag: linkFilter.link_tag } : {}),
      };
    }
    if (property.link_value != null) {
      return {
        link_name: "手术",
        link_value: Number(property.link_value),
        ...(property.link_tag ? { link_tag: property.link_tag } : {}),
      };
    }
    return {};
  };

  const [newTime, setNewTime] = useState("");
  const [modifyTime, setModifyTime] = useState("");
  const [type, setType] = useState<"add" | "edit">("add");
  const [careId, setCareId] = useState("");
  const [pendingAddTime, setPendingAddTime] = useState<string | undefined>();
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [refreshSpinning, setRefreshSpinning] = useState(false);

  const [timeValue2, setTimeValue2] = useState("");
  const [careObserve, setCareObserve] = useState({
    start_time: "",
    time_gap: "1",
  });

  const [senseProperty, setSenseProperty] = useState<ElemProps>(initProps);
  const [tubeProperty, setTubeProperty] = useState<ElemProps>(initProps);
  const [leftPupilProperty, setLeftPupilProperty] =
    useState<ElemProps>(initProps);
  const [rightPupilProperty, setRightPupilProperty] =
    useState<ElemProps>(initProps);
  const [leftReflexProperty, setLeftReflexProperty] =
    useState<ElemProps>(initProps);
  const [rightReflexProperty, setRightReflexProperty] =
    useState<ElemProps>(initProps);
  const [tempProperty, setTempProperty] = useState<ElemProps>(initProps);
  const [plusProperty, setPlusProperty] = useState<ElemProps>(initProps);
  const [heartProperty, setHeartProperty] = useState<ElemProps>(initProps);
  const [breathProperty, setBreathProperty] = useState<ElemProps>(initProps);
  const [sBpProperty, setSbpProperty] = useState<ElemProps>(initProps);
  const [dBpProperty, setDbpProperty] = useState<ElemProps>(initProps);
  const [spo2Property, setSpo2Property] = useState<ElemProps>(initProps);
  const [careProperty, setCareProperty] = useState(initCareProperty);
  const [editOriginTime, setEditOriginTime] = useState("");
  const [entryTab, setEntryTab] = useState<EntryTab>("vital");
  const [relatedCareTime, setRelatedCareTime] = useState("");
  const [selectedRowKey, setSelectedRowKey] = useState("");
  const [transferCareOpen, setTransferCareOpen] = useState(false);
  const [addCareFormKey, setAddCareFormKey] = useState(0);
  const [formModalOpen, setFormModalOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [patientInfo, setPatientInfo] = useState({
    user_id: "",
    user_name: "",
  });
  const [allRecordList, setAllRecordList] = useState<CareRecordRow[]>([]);
  const [printLoading, setPrintLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  const tableRef = useRef<HTMLDivElement>(null);
  const observeLoadTokenRef = useRef(0);
  const [scrollY, setScrollY] = useState(200);

  useLayoutEffect(() => {
    if (!SessionId || !visitId) return;
    const el = tableRef.current;
    if (!el) return;

    const update = () => {
      const header =
        (el.querySelector(".ant-table-header") as HTMLElement | null) ??
        (el.querySelector(".ant-table-thead") as HTMLElement | null);
      const headerH = header?.offsetHeight || TABLE_HEADER_FALLBACK;
      const next = Math.max(Math.floor(el.clientHeight - headerH), TABLE_BODY_MIN_H);
      setScrollY((prev) => (prev === next ? prev : next));
    };

    const ro = new ResizeObserver(() => {
      requestAnimationFrame(update);
    });
    ro.observe(el);
    update();
    const rafId = requestAnimationFrame(update);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(rafId);
    };
  }, [SessionId, visitId, isEdit, entryMode, allRecordList.length]);

  const handleCheckboxChange = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedRowKeys((prev) => [...prev, id]);
    } else {
      setSelectedRowKeys((prev) => prev.filter((item) => item !== id));
    }
  };

  const handleSelectAllChange = (checked: boolean, careIds: string[]) => {
    setSelectedRowKeys(checked ? careIds : []);
  };

  /** 行单击：选中并进入编辑；再点同一行取消选中回到新增 */
  const handleRowClick = (record: CareRecordRow, e: MouseEvent) => {
    if (!isEdit) return;
    const target = e.target as HTMLElement;
    if (
      target.closest(".ant-checkbox-wrapper") ||
      target.closest(".ant-checkbox") ||
      target.closest("button") ||
      target.closest("a") ||
      target.closest("[data-care-cell]")
    ) {
      return;
    }
    if (selectedRowKey && record.row_key === selectedRowKey) {
      clearRowSelection();
      return;
    }
    openEditForm(record);
  };

  const clearObserveProperties = () => {
    const clear = (setter: Dispatch<SetStateAction<ElemProps>>) =>
      setter((prev) => ({ ...prev, observe_value: "" }));

    clear(setSenseProperty);
    clear(setTubeProperty);
    clear(setLeftPupilProperty);
    clear(setRightPupilProperty);
    clear(setLeftReflexProperty);
    clear(setRightReflexProperty);
    clear(setTempProperty);
    clear(setPlusProperty);
    clear(setHeartProperty);
    clear(setBreathProperty);
    clear(setSbpProperty);
    clear(setDbpProperty);
    clear(setSpo2Property);
  };

  const resetAddCareForm = () => {
    clearObserveProperties();
    setNewTime("");
    setModifyTime("");
    setCareId("");
    setEditOriginTime("");
    setCareProperty({ ...baseInitCareProperty });
  };

  const resetAddCareModal = () => {
    observeLoadTokenRef.current += 1;
    resetAddCareForm();
    setType("add");
    setAddCareFormKey((key) => key + 1);
  };

  const finishFormAndRefresh = () => {
    initGetData();
    setPendingAddTime(undefined);
    setFormModalOpen(false);
    resetAddCareModal();
  };

  const normalizeCareMinute = (time?: string) =>
    String(time || "")
      .trim()
      .slice(0, 16);

  /** 列表中是否已有同一分钟的护理记录 */
  const isCareTimeTaken = (
    time: string,
    options?: { excludeCareId?: string; extraTimes?: string[] },
  ) => {
    const minute = normalizeCareMinute(time);
    if (!minute) return false;
    if (
      (options?.extraTimes || []).some(
        (item) => normalizeCareMinute(item) === minute,
      )
    ) {
      return true;
    }
    return allRecordList.some(
      (item) =>
        Boolean(item.care_id) &&
        normalizeCareMinute(item.care_time) === minute &&
        (options?.excludeCareId == null ||
          String(item.care_id) !== String(options.excludeCareId)),
    );
  };

  /** 从候选时间起，跳过已占用分钟，得到可新增时间 */
  const resolveNonConflictAddTime = (
    preferred?: string,
    extraTakenTimes: string[] = [],
  ) => {
    let candidate = preferred || getCurrentDateTime2();
    for (let i = 0; i < 1440; i++) {
      if (
        !isCareTimeTaken(candidate, {
          extraTimes: extraTakenTimes,
        })
      ) {
        return candidate;
      }
      candidate = getCareTimePlusOneMinute(candidate);
    }
    return candidate;
  };

  const refreshAddCareFormAfterSave = (savedTime: string) => {
    initGetData();
    if (useModalEntry) {
      setPendingAddTime(undefined);
      setFormModalOpen(false);
      resetAddCareModal();
      return;
    }
    const nextPreferred = getNextContinuousCareTime(savedTime);
    setPendingAddTime(
      resolveNonConflictAddTime(nextPreferred, [savedTime]),
    );
    resetAddCareModal();
  };

  /** 进入新增：默认当前时刻；若与列表冲突则顺延到下一可用分钟 */
  const resolveOpenAddCareTime = () =>
    resolveNonConflictAddTime(getCurrentDateTime2());

  const clearRowSelection = () => {
    setSelectedRowKey("");
    setRelatedCareTime("");
    setPendingAddTime(resolveOpenAddCareTime());
    setFormModalOpen(false);
    resetAddCareModal();
  };

  const switchToAddMode = () => {
    clearRowSelection();
    setEntryTab("vital");
  };

  const openAddModal = () => {
    setSelectedRowKey("");
    setRelatedCareTime("");
    setPendingAddTime(resolveOpenAddCareTime());
    resetAddCareModal();
    setEntryTab("vital");
    setFormModalOpen(true);
  };

  useImperativeHandle(ref, () => ({
    openAddModal,
  }));

  const handleEntryTabChange = (key: string) => {
    const next = key as EntryTab;
    setEntryTab(next);
    if (selectedRowKey) return;
    const now =
      next === "vital" ? resolveOpenAddCareTime() : getCurrentDateTime2();
    setRelatedCareTime("");
    setNewTime(now);
    setPendingAddTime(now);
  };

  const loadEditForm = (record: CareRecordRow) => {
    setPendingAddTime(undefined);
    setType("edit");
    getObserveList2(record.care_time);
    setCareId(String(record.care_id));
    setModifyTime(record.care_time);
    setEditOriginTime(record.care_time);
    setRelatedCareTime(record.care_time);
    setSelectedRowKey(record.row_key);
    setAddCareFormKey((key) => key + 1);
  };

  const openEditForm = (record: CareRecordRow) => {
    if (!isEdit) return;
    setSelectedRowKey(record.row_key);
    setRelatedCareTime(record.care_time);
    if (!record.care_id) {
      setPendingAddTime(record.care_time);
      resetAddCareModal();
      setEntryTab("vital");
      if (useModalEntry) setFormModalOpen(true);
      return;
    }
    if (record.care_status !== "NEW") {
      message.warning("提交状态，不可编辑，请取消提交后编辑");
      return;
    }
    loadEditForm(record);
    setEntryTab("vital");
    if (useModalEntry) setFormModalOpen(true);
  };

  const openIoPanel = (record: CareRecordRow) => {
    if (!isEdit) return;
    setSelectedRowKey(record.row_key);
    setRelatedCareTime(record.care_time);
    setEntryTab("io");
    if (record.care_id && record.care_status === "NEW") {
      loadEditForm(record);
      setEntryTab("io");
    }
    if (useModalEntry) setFormModalOpen(true);
  };

  const openOxygenPanel = (record: CareRecordRow) => {
    if (!isEdit) return;
    setSelectedRowKey(record.row_key);
    setRelatedCareTime(record.care_time);
    setEntryTab("oxygen");
    if (record.care_id && record.care_status === "NEW") {
      loadEditForm(record);
      setEntryTab("oxygen");
    }
    if (useModalEntry) setFormModalOpen(true);
  };

  async function getPropertyReq() {
    const sessionId = getSessionId();
    const sessionInfo = await getSessionInfoAPI({
      session_id: sessionId,
    });

    if (sessionInfo.code == 0) {
      setPatientInfo({
        user_id: sessionInfo.session_info.user_id,
        user_name: sessionInfo.session_info.user_name,
      });
    } else {
      message.error(
        `${sessionInfo.message}${sessionInfo.hint ? `（${sessionInfo.hint}）` : ""}`,
      );
    }

    const visitProperty = await getVisitPropertyAPI({ visit_id });

    if (visitProperty && visitProperty.code == 0) {
      const timeStart = visitProperty?.visit_property?.visit_time.split(" ")[0];
      setTimeValue2(timeStart);
    } else {
      message.error(
        `${visitProperty.message}${visitProperty.hint ? `（${visitProperty.hint}）` : ""}`,
      );
    }
  }

  function initGetData() {
    setIsLoading(true);

    const useDateRange = !linkFilter && Boolean(careObserve.start_time);
    const rangeStart = useDateRange
      ? `${careObserve.start_time} 00:00:00`
      : "";
    const care_end =
      useDateRange && careObserve.time_gap
        ? `${getDateAfterDays(careObserve.start_time, Number(careObserve.time_gap) - 1)} 23:59:59`
        : "";
    const inRange = (time?: string) => {
      const value = String(time || "");
      if (!value) return false;
      if (!useDateRange) return true;
      if (value < rangeStart) return false;
      if (care_end && value > care_end) return false;
      return true;
    };

    Promise.all([
      getCareListAPI({
        visit_id,
        ...(useDateRange
          ? { care_start: rangeStart, care_end }
          : {}),
      })
        .then((res: any) => res?.row_list || [])
        .catch(() => []),
      getIoListAPI({
        visit_id,
        ...(useDateRange
          ? { io_start: rangeStart, io_end: care_end }
          : {}),
      })
        .then((ioRes) => ioRes?.row_list || [])
        .catch(() => []),
      getOxygenListAPI({
        visit_id,
        ...(useDateRange
          ? { oxygen_start: rangeStart, oxygen_end: care_end }
          : {}),
      })
        .then((oxygenRes) => oxygenRes?.row_list || [])
        .catch(() => []),
    ]).then(([careList, ioList, oxygenList]) => {
      const rangedIoList = (ioList || []).filter((item: any) =>
        inRange(item.io_time),
      );
      const rangedOxygenList = (oxygenList || []).filter((item: any) =>
        inRange(item.start_time),
      );
      const time_list = Array.from(
        new Set(
          [
            ...(careList || []).map((item: any) => item.care_time),
            ...rangedIoList.map((item: any) => item.io_time),
            ...rangedOxygenList.map((item: any) => item.start_time),
          ].filter(Boolean),
        ),
      );

      const loadObserve = time_list.length
        ? getObserveList(visit_id, time_list).catch(() => [])
        : Promise.resolve([]);

      loadObserve.then((observeList) => {
        setAllRecordList(
          mergeCareRelatedLists(
            observeList || [],
            rangedIoList,
            rangedOxygenList,
            careList || [],
          ),
        );
        setIsLoading(false);
      });
    });
  }

  async function getObserveList(visitIdParam: number, time_list: string[]) {
    return getObserveListAPI({
      visit_id: visitIdParam,
      observe_time_list: time_list,
    }).then((res) => res.row_list);
  }

  function mergeRelatedTimeRecords(fromTime: string, toTime: string) {
    if (!fromTime || fromTime === toTime) return;

    getIoListAPI({
      visit_id,
      io_start: fromTime,
      io_end: fromTime,
    }).then((res: any) => {
      (res?.row_list || []).forEach((item: any) => {
        saveIoPropertyAPI({
          io_id: Number(item.io_id),
          io_property: { io_time: toTime },
        });
      });
    });

    const editingRecord = allRecordList.find(
      (item) => String(item.care_id) === careId,
    );
    if (editingRecord?.has_oxygen && editingRecord.oxygen_id) {
      saveOxygenPropertyAPI({
        oxygen_id: Number(editingRecord.oxygen_id),
        oxygen_property: { start_time: toTime },
      });
    }
  }

  async function buildObserveRows(observeTime: string) {
    const fields: { name: string; item: ElemProps }[] = [
      { name: "神志", item: senseProperty },
      { name: "管道护理", item: tubeProperty },
      { name: "左瞳孔大小", item: leftPupilProperty },
      { name: "右瞳孔大小", item: rightPupilProperty },
      { name: "左对光反射", item: leftReflexProperty },
      { name: "右对光反射", item: rightReflexProperty },
      { name: "体温", item: tempProperty },
      { name: "呼吸", item: breathProperty },
      { name: "收缩压", item: sBpProperty },
      { name: "舒张压", item: dBpProperty },
      { name: "脉搏", item: plusProperty },
      { name: "心率", item: heartProperty },
      { name: "SpO2", item: spo2Property },
    ];

    const filled = fields.filter((field) => field.item?.observe_value);
    const rows = await Promise.all(
      filled.map(async (field) => {
        let elemId = Number(field.item.elem_id) || 0;
        if (!elemId) {
          const property = await loadElemProperty(field.name);
          elemId = Number(property?.elem_id) || 0;
        }
        if (!elemId) return null;
        return {
          visit_id,
          elem_id: elemId,
          observe_time: observeTime,
          observe_value: field.item.observe_value,
          observe_tag: "[护理记录]",
        };
      }),
    );
    return rows.filter((row) => row != null);
  }

  async function submitData(keepOpen = false) {
    if (type == "edit") {
      if (
        modifyTime &&
        normalizeCareMinute(modifyTime) !==
          normalizeCareMinute(editOriginTime) &&
        isCareTimeTaken(modifyTime, { excludeCareId: careId })
      ) {
        message.warning("存在相同时间，请选择其他时间");
        return;
      }

      const row_list = await buildObserveRows(modifyTime);
      mergeRelatedTimeRecords(editOriginTime, modifyTime);

      saveCarePropertyAPI({
        care_id: Number(careId),
        care_property: {
          health_level: careProperty.health_level,
          care_content: careProperty.care_content,
          care_time: modifyTime,
          user_id: Number(patientInfo.user_id),
          user_name: patientInfo.user_name,
          visit_id,
          ...(buildLinkPayload(careProperty) as any),
        },
      }).then((res: any) => {
        if (res.code != 0) {
          message.error(res.message);
        }
      });

      saveObserveListAPI({
        visit_id,
        observe_time: modifyTime,
        row_list,
      }).then((res: any) => {
        if (res.code == 0) {
          message.success("修改成功");
          if (keepOpen && !useModalEntry) {
            initGetData();
            setEditOriginTime(modifyTime);
          } else {
            finishFormAndRefresh();
          }
        } else {
          message.error(res.message);
        }
      });
    } else {
      if (newTime) {
        if (isCareTimeTaken(newTime)) {
          message.warning("存在相同时间，不能新建");
          return;
        }

        const row_list = await buildObserveRows(newTime);
        saveObserveListAPI({
          visit_id,
          observe_time: newTime,
          row_list,
        }).then((res: any) => {
          if (res.code == 0) {
            newCareAPI({
              visit_id,
              user_id: Number(patientInfo.user_id),
              user_name: patientInfo.user_name,
              care_time: newTime,
              care_content: careProperty.care_content
                ? careProperty.care_content
                : "",
              health_level: "一般",
              ...(buildLinkPayload(careProperty) as any),
            }).then((newRes) => {
              if (newRes.code == 0) {
                message.success("添加成功");
                // 新增始终连续：表单保留并自动落到下一可用时间
                refreshAddCareFormAfterSave(newTime);
              } else {
                message.error(newRes.message);
              }
            });
          } else {
            message.error(res.message);
          }
        });
      } else {
        message.warning("请选择时间");
      }
    }
  }

  function applyObserveValue(
    setter: Dispatch<SetStateAction<ElemProps>>,
    item?: any,
  ) {
    if (item) {
      setter({
        elem_id: item.elem_id,
        elem_code: item.elem_code,
        elem_name: item.elem_name,
        observe_value: item.observe_value,
      });
    } else {
      setter((prev) => ({ ...prev, observe_value: "" }));
    }
  }

  function getObserveList2(observe_time: string) {
    if (!observe_time) return;
    const loadToken = observeLoadTokenRef.current;
    getObserveListAPI({
      visit_id,
      observe_start: observe_time,
      observe_end: observe_time,
    }).then((res: any) => {
      if (loadToken !== observeLoadTokenRef.current) return;
      const rows = res.row_list || [];
      applyObserveValue(
        setSenseProperty,
        rows.find((item: any) => item.elem_name == "神志"),
      );
      applyObserveValue(
        setTubeProperty,
        rows.find((item: any) => item.elem_name == "管道护理"),
      );
      applyObserveValue(
        setLeftPupilProperty,
        rows.find((item: any) => item.elem_name == "左瞳孔大小"),
      );
      applyObserveValue(
        setRightPupilProperty,
        rows.find((item: any) => item.elem_name == "右瞳孔大小"),
      );
      applyObserveValue(
        setLeftReflexProperty,
        rows.find((item: any) => item.elem_name == "左对光反射"),
      );
      applyObserveValue(
        setRightReflexProperty,
        rows.find((item: any) => item.elem_name == "右对光反射"),
      );
      applyObserveValue(
        setTempProperty,
        rows.find((item: any) => item.elem_name == "体温"),
      );
      applyObserveValue(
        setPlusProperty,
        rows.find((item: any) => item.elem_name == "脉搏"),
      );
      applyObserveValue(
        setHeartProperty,
        rows.find((item: any) => item.elem_name == "心率"),
      );
      applyObserveValue(
        setSbpProperty,
        rows.find((item: any) => item.elem_name == "收缩压"),
      );
      applyObserveValue(
        setDbpProperty,
        rows.find((item: any) => item.elem_name == "舒张压"),
      );
      applyObserveValue(
        setSpo2Property,
        rows.find((item: any) => item.elem_name == "SpO2"),
      );
      applyObserveValue(
        setBreathProperty,
        rows.find((item: any) => item.elem_name == "呼吸"),
      );
    });
  }

  function deleteRecordListItem(record: CareRecordRow) {
    Modal.confirm({
      title: "确认删除",
      content: "是否确认删除整条数据？",
      okText: "确认",
      okType: "danger",
      onOk: () => {
        const tasks: Promise<any>[] = [
          deleteIo2API({ visit_id, io_time: record.care_time }),
        ];
        if (record.care_id) {
          tasks.unshift(
            deleteCareAPI({ care_id: Number(record.care_id) }),
            deleteObserve2API({ visit_id, observe_time: record.care_time }),
          );
        }
        if (record?.has_oxygen && record.oxygen_id) {
          tasks.push(deleteOxygenAPI({ oxygen_id: Number(record.oxygen_id) }));
        }
        return Promise.all(tasks).then((data: any) => {
          const errorArray: string[] = [];
          let success = true;
          data.forEach((res: any) => {
            if (
              res.code != "0" &&
              res.code != 0 &&
              !errorArray.includes(res.message)
            ) {
              errorArray.push(res.message);
              success = false;
            }
          });

          if (!success) {
            message.error(errorArray.join("；"));
          } else {
            message.success("已删除");
            if (record.care_id && String(record.care_id) === careId) {
              switchToAddMode();
            }
          }
          initGetData();
        });
      },
    });
  }

  function submitSelectedRecords() {
    const records = allRecordList.filter((item) =>
      selectedRowKeys.includes(item.row_key),
    );
    const promises: Promise<any>[] = [];

    records.forEach((record) => {
      if (record.care_id) {
        if (record.care_status === "NEW") {
          promises.push(
            saveCarePropertyAPI({
              care_id: Number(record.care_id),
              care_property: {
                visit_id,
                care_status: "COMMIT",
                care_time: record.care_time || "",
              },
            }),
          );
        }
        return;
      }
      (record.io_entries || [])
        .filter((item) => (item.io_status || "NEW") !== "COMMIT")
        .forEach((item) => {
          promises.push(commitIoAPI({ io_id: Number(item.io_id) }));
        });
    });

    if (!promises.length) return;

    Promise.all(promises).then((results: any) => {
      const hasError = results.some((res: any) => res.code != 0);
      if (!hasError) {
        message.success("提交成功");
        setSelectedRowKeys([]);
        if (
          records.some((item) => item.care_id && String(item.care_id) === careId)
        ) {
          switchToAddMode();
        }
        initGetData();
      } else {
        message.error("提交失败");
      }
    });
  }

  function cancelSubmitSelectedRecords() {
    const records = allRecordList.filter((item) =>
      selectedRowKeys.includes(item.row_key),
    );
    const promises: Promise<any>[] = [];

    records.forEach((record) => {
      if (record.care_id) {
        if (record.care_status === "COMMIT") {
          promises.push(
            saveCarePropertyAPI({
              care_id: Number(record.care_id),
              care_property: {
                visit_id,
                care_status: "NEW",
                care_time: record.care_time || "",
              },
            }),
          );
        }
        return;
      }
      (record.io_entries || [])
        .filter((item) => item.io_status === "COMMIT")
        .forEach((item) => {
          promises.push(undoCommitIoAPI({ io_id: Number(item.io_id) }));
        });
    });

    if (!promises.length) return;

    Promise.all(promises).then((results: any) => {
      const hasError = results.some((res: any) => res.code != 0);
      if (!hasError) {
        message.success("取消提交成功");
        setSelectedRowKeys([]);
        initGetData();
      } else {
        message.error("取消提交失败");
      }
    });
  }

  const handleRefresh = () => {
    setRefreshSpinning(true);
    initGetData();
    setTimeout(() => setRefreshSpinning(false), 500);
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "NEW":
        return "新建";
      case "COMMIT":
        return "提交";
      default:
        return status;
    }
  };

  const getStatusTagColor = (status: string) => {
    switch (status) {
      case "NEW":
        return "blue";
      case "COMMIT":
        return "green";
      default:
        return "default";
    }
  };

  const selectedRecords = useMemo(
    () =>
      allRecordList.filter((item) => selectedRowKeys.includes(item.row_key)),
    [allRecordList, selectedRowKeys],
  );

  const tableDataSource = useMemo(() => {
    if (!linkFilter) return allRecordList;
    return allRecordList.filter((row) => {
      if (!row.care_id) return false;
      if (row.link_name !== linkFilter.link_name) return false;
      if (String(row.link_value) !== String(linkFilter.link_value)) return false;
      if (
        linkFilter.link_tag != null &&
        String(row.link_tag || "") !== String(linkFilter.link_tag)
      ) {
        return false;
      }
      return true;
    });
  }, [allRecordList, linkFilter]);

  const canSubmit = useMemo(
    () =>
      selectedRecords.some((item) => {
        if (item.care_id) return item.care_status === "NEW";
        return (item.io_entries || []).some(
          (entry) => (entry.io_status || "NEW") !== "COMMIT",
        );
      }),
    [selectedRecords],
  );

  const canCancelSubmit = useMemo(
    () =>
      selectedRecords.some((item) => {
        if (item.care_id) return item.care_status === "COMMIT";
        return (item.io_entries || []).some(
          (entry) => entry.io_status === "COMMIT",
        );
      }),
    [selectedRecords],
  );

  const submitButtonTitle =
    selectedRecords.length === 1 &&
    getRowDisplayStatus(selectedRecords[0]) === "COMMIT"
      ? "不能重复提交"
      : undefined;
  const occupiedCareTimes = useMemo(
    () =>
      allRecordList
        .filter((item) => item.care_id)
        .map((item) => item.care_time)
        .filter(Boolean),
    [allRecordList],
  );

  const relatedTime =
    relatedCareTime ||
    (type === "edit" ? modifyTime : newTime || pendingAddTime || "");
  const relatedRecord = useMemo(() => {
    const minute = normalizeCareMinute(relatedTime);
    if (!minute) return undefined;
    return allRecordList.find(
      (item) => normalizeCareMinute(item.care_time) === minute,
    );
  }, [allRecordList, relatedTime]);

  const columns: ColumnsType<CareRecordRow> = useMemo(() => {
    const selectableRowKeys = tableDataSource
      .filter((item) => isSelectableRow(item))
      .map((item) => item.row_key);

    const selectColumn: ColumnsType<CareRecordRow>[number] = {
      title: (
        <Checkbox
          checked={
            selectableRowKeys.length > 0 &&
            selectedRowKeys.length === selectableRowKeys.length
          }
          indeterminate={
            selectedRowKeys.length > 0 &&
            selectedRowKeys.length < selectableRowKeys.length
          }
          onChange={(e) =>
            handleSelectAllChange(e.target.checked, selectableRowKeys)
          }
        />
      ),
      key: "select",
      width: 32,
      render: (_, record) =>
        isSelectableRow(record) ? (
          <Checkbox
            checked={selectedRowKeys.includes(record.row_key)}
            onChange={(e) =>
              handleCheckboxChange(record.row_key, e.target.checked)
            }
            onClick={(e) => e.stopPropagation()}
          />
        ) : null,
    };

    const actionsColumn: ColumnsType<CareRecordRow>[number] = {
      title: (
        <Button
          size="small"
          icon={<ReloadOutlined spin={refreshSpinning} />}
          title="刷新"
          onClick={handleRefresh}
        />
      ),
      key: "actions",
      width: 36,
      render: (_, record) =>
        record.care_time ? (
          <Button
            type="link"
            size="small"
            danger
            className="px-0!"
            icon={<DeleteOutlined />}
            title="删除"
            onClick={(e) => {
              e.stopPropagation();
              deleteRecordListItem(record);
            }}
          />
        ) : null,
    };

    const refreshOnlyColumn: ColumnsType<CareRecordRow>[number] = {
      title: (
        <Button
          size="small"
          icon={<ReloadOutlined spin={refreshSpinning} />}
          title="刷新"
          onClick={handleRefresh}
        />
      ),
      key: "refresh",
      width: 36,
      render: () => null,
    };

    const editCellProps = (record: CareRecordRow) =>
      isEdit
        ? {
            onClick: (e: MouseEvent) => {
              e.stopPropagation();
              openEditForm(record);
            },
            style: { cursor: "pointer" as const },
          }
        : {};

    const dataColumns: ColumnsType<CareRecordRow> = [
      {
        title: "时间",
        dataIndex: "care_time",
        key: "care_time",
        width: 100,
        fixed: "left",
        ellipsis: true,
        render: (text: string) => (
          <span className="whitespace-nowrap" title={text}>
            {text ? formatDateTimeMinute(text) : "-"}
          </span>
        ),
      },
      {
        title: "神志",
        dataIndex: "sense_observe_value",
        key: "sense",
        width: 56,
        ellipsis: true,
        onCell: editCellProps,
        render: (text: string) => (
          <span data-care-cell="1" title={text || undefined}>
            {text || "-"}
          </span>
        ),
      },
      {
        title: "体温",
        dataIndex: "temp_observe_value",
        key: "temp",
        width: 44,
        ellipsis: true,
        onCell: editCellProps,
        render: (text: string) => (
          <span data-care-cell="1" title={text || undefined}>
            {text || "-"}
          </span>
        ),
      },
      {
        title: "脉搏",
        dataIndex: "plus_observe_value",
        key: "plus",
        width: 44,
        ellipsis: true,
        onCell: editCellProps,
        render: (text: string) => (
          <span data-care-cell="1" title={text || undefined}>
            {text || "-"}
          </span>
        ),
      },
      {
        title: "心率",
        dataIndex: "heart_observe_value",
        key: "heart",
        width: 44,
        ellipsis: true,
        onCell: editCellProps,
        render: (text: string) => (
          <span data-care-cell="1" title={text || undefined}>
            {text || "-"}
          </span>
        ),
      },
      {
        title: "呼吸",
        dataIndex: "breath_observe_value",
        key: "breath",
        width: 44,
        ellipsis: true,
        onCell: editCellProps,
        render: (text: string) => (
          <span data-care-cell="1" title={text || undefined}>
            {text || "-"}
          </span>
        ),
      },
      {
        title: "血压",
        key: "bp",
        width: 72,
        ellipsis: true,
        onCell: editCellProps,
        render: (_, record) => {
          const text = record.dbp_observe_value
            ? `${record.sbp_observe_value || "-"}/${record.dbp_observe_value}`
            : record.sbp_observe_value || "-";
          return (
            <span data-care-cell="1" className="whitespace-nowrap" title={text}>
              {text}
            </span>
          );
        },
      },
      {
        title: "SPO2",
        dataIndex: "spo2_observe_value",
        key: "spo2",
        width: 44,
        ellipsis: true,
        onCell: editCellProps,
        render: (text: string) => (
          <span data-care-cell="1" title={text || undefined}>
            {text || "-"}
          </span>
        ),
      },
      {
        title: "吸氧",
        dataIndex: "oxygen_method",
        key: "oxygen",
        width: 80,
        ellipsis: false,
        onCell: (record) =>
          isEdit
            ? {
                onClick: (e: MouseEvent) => {
                  e.stopPropagation();
                  openOxygenPanel(record);
                },
                className: "care-wrap-cell",
                style: {
                  cursor: "pointer",
                  whiteSpace: "normal",
                  wordBreak: "break-word",
                },
              }
            : {
                className: "care-wrap-cell",
                style: {
                  whiteSpace: "normal",
                  wordBreak: "break-word",
                },
              },
        render: (text: string) => (
          <div
            data-care-cell="1"
            className="whitespace-pre-wrap wrap-break-word break-all"
          >
            {text || "-"}
          </div>
        ),
      },
      {
        title: "入量",
        key: "intake",
        width: 90,
        ellipsis: false,
        onCell: (record) =>
          isEdit
            ? {
                onClick: (e: MouseEvent) => {
                  e.stopPropagation();
                  openIoPanel(record);
                },
                className: "care-wrap-cell",
                style: {
                  cursor: "pointer",
                  whiteSpace: "normal",
                  wordBreak: "break-word",
                },
              }
            : {
                className: "care-wrap-cell",
                style: {
                  whiteSpace: "normal",
                  wordBreak: "break-word",
                },
              },
        render: (_, record) => (
          <div
            data-care-cell="1"
            className="whitespace-pre-wrap wrap-break-word break-all"
          >
            {record.i_text?.length
              ? record.i_text.map((text, index) => (
                  <div key={record.i_id?.[index] ?? index}>{text || "-"}</div>
                ))
              : "-"}
          </div>
        ),
      },
      {
        title: "出量",
        key: "output",
        width: 90,
        ellipsis: false,
        onCell: (record) =>
          isEdit
            ? {
                onClick: (e: MouseEvent) => {
                  e.stopPropagation();
                  openIoPanel(record);
                },
                className: "care-wrap-cell",
                style: {
                  cursor: "pointer",
                  whiteSpace: "normal",
                  wordBreak: "break-word",
                },
              }
            : {
                className: "care-wrap-cell",
                style: {
                  whiteSpace: "normal",
                  wordBreak: "break-word",
                },
              },
        render: (_, record) => (
          <div
            data-care-cell="1"
            className="whitespace-pre-wrap wrap-break-word break-all"
          >
            {record.o_text?.length
              ? record.o_text.map((text, index) => (
                  <div key={record.o_id?.[index] ?? index}>{text || "-"}</div>
                ))
              : "-"}
          </div>
        ),
      },
      {
        title: "管道",
        dataIndex: "tube_observe_value",
        key: "tube",
        width: 48,
        ellipsis: true,
        onCell: editCellProps,
        render: (text: string) => (
          <span data-care-cell="1" title={text || undefined}>
            {text || "-"}
          </span>
        ),
      },
      {
        title: "左瞳",
        dataIndex: "left_pupil_observe_value",
        key: "left_pupil",
        width: 44,
        ellipsis: true,
        onCell: editCellProps,
        render: (text: string) => (
          <span data-care-cell="1" title={text || undefined}>
            {text || "-"}
          </span>
        ),
      },
      {
        title: "右瞳",
        dataIndex: "right_pupil_observe_value",
        key: "right_pupil",
        width: 44,
        ellipsis: true,
        onCell: editCellProps,
        render: (text: string) => (
          <span data-care-cell="1" title={text || undefined}>
            {text || "-"}
          </span>
        ),
      },
      {
        title: "左反射",
        dataIndex: "left_reflex_observe_value",
        key: "left_reflex",
        width: 52,
        ellipsis: true,
        onCell: editCellProps,
        render: (text: string) => (
          <span data-care-cell="1" title={text || undefined}>
            {text || "-"}
          </span>
        ),
      },
      {
        title: "右反射",
        dataIndex: "right_reflex_observe_value",
        key: "right_reflex",
        width: 52,
        ellipsis: true,
        onCell: editCellProps,
        render: (text: string) => (
          <span data-care-cell="1" title={text || undefined}>
            {text || "-"}
          </span>
        ),
      },
      {
        title: "病情措施",
        dataIndex: "care_content",
        key: "care_content",
        width: 180,
        fixed: "right",
        ellipsis: false,
        onCell: (record) =>
          isEdit
            ? {
                onClick: (e: MouseEvent) => {
                  e.stopPropagation();
                  openEditForm(record);
                },
                className: "care-wrap-cell",
                style: {
                  cursor: "pointer",
                  whiteSpace: "normal",
                  wordBreak: "break-word",
                  overflowWrap: "anywhere",
                },
              }
            : {
                className: "care-wrap-cell",
                style: {
                  whiteSpace: "normal",
                  wordBreak: "break-word",
                  overflowWrap: "anywhere",
                },
              },
        render: (text: string, record: CareRecordRow) => (
          <div
            data-care-cell="1"
            className={`whitespace-pre-wrap wrap-break-word break-all ${
              record.care_tag === "[TRANSFER]"
                ? "text-(--app-theme-error)"
                : ""
            }`}
          >
            {text || "-"}
          </div>
        ),
      },
      {
        title: "状态",
        dataIndex: "care_status",
        key: "care_status",
        width: 52,
        fixed: "right",
        render: (_status: string, record: CareRecordRow) => {
          const status = getRowDisplayStatus(record);
          return status ? (
            <Tag
              className="m-0! px-1! leading-3!"
              color={getStatusTagColor(status)}
            >
              {getStatusText(status)}
            </Tag>
          ) : (
            "-"
          );
        },
      },
      {
        title: "登记人",
        dataIndex: "user_name",
        key: "user_name",
        width: 56,
        fixed: "right",
        ellipsis: true,
        render: (text: string) => (
          <span title={text || undefined}>{text || "-"}</span>
        ),
      },
    ];

    const filteredDataColumns = visibleColumnSet
      ? dataColumns.filter((col) =>
          visibleColumnSet.has(String(col.key) as CareRecordTableColumnKey),
        )
      : dataColumns;

    const mergedColumns: ColumnsType<CareRecordRow> = [
      ...(isEdit
        ? [
            {
              ...selectColumn,
              ...(customVisibleColumns ? {} : { fixed: "left" as const }),
            },
            {
              ...actionsColumn,
              ...(customVisibleColumns ? {} : { fixed: "left" as const }),
            },
          ]
        : [
            {
              ...refreshOnlyColumn,
              ...(customVisibleColumns ? {} : { fixed: "left" as const }),
            },
          ]),
      ...filteredDataColumns,
    ];

    return mergedColumns.map((col) => {
      const next = { ...col };
      const key = String(col.key ?? "");
      if (customVisibleColumns) {
        delete (next as { fixed?: string }).fixed;
        if (key === "care_content") {
          delete (next as { width?: number }).width;
          (next as { minWidth?: number }).minWidth = 420;
          next.className = "care-col-content";
        } else if (key === "care_time") {
          next.width = 148;
          next.ellipsis = false;
          next.className = "care-col-time";
        } else if (key === "care_status") {
          next.width = 72;
          next.ellipsis = false;
        } else if (key === "user_name") {
          next.width = 88;
          next.ellipsis = false;
        } else if (
          key !== "select" &&
          key !== "actions" &&
          key !== "refresh"
        ) {
          next.ellipsis = false;
        }
      }
      if (linkFilter) {
        delete (next as { width?: number }).width;
      }
      return next;
    });
  }, [
    tableDataSource,
    refreshSpinning,
    selectedRowKeys,
    isEdit,
    type,
    careId,
    selectedRowKey,
    linkFilter,
    visibleColumnSet,
    customVisibleColumns,
  ]);
  useEffect(() => {
    const time = getFormattedDate();
    setCareObserve((prev) => ({ ...prev, start_time: time }));
  }, []);

  useEffect(() => {
    setSelectedRowKeys([]);
    setSelectedRowKey("");
    setRelatedCareTime("");
    setEntryTab("vital");
    setPendingAddTime(undefined);
    resetAddCareModal();
    if (!visitId) {
      setAllRecordList([]);
      setTimeValue2("");
      return;
    }
    void getPropertyReq();
  }, [visitId]);

  useEffect(() => {
    if (visitId && careObserve.start_time) {
      initGetData();
    }
  }, [visitId, careObserve]);

  /** 列表刷新后：新增态若当前时间已被占用，自动顺延到下一可用分钟 */
  useEffect(() => {
    if (!isEdit || type !== "add") return;
    const current = pendingAddTime || newTime || getCurrentDateTime2();
    if (!isCareTimeTaken(current)) {
      if (!pendingAddTime) {
        setPendingAddTime(current);
      }
      return;
    }
    const next = resolveNonConflictAddTime(current);
    setPendingAddTime(next);
    setAddCareFormKey((key) => key + 1);
  }, [allRecordList, isEdit, type]);

  const carePrintUrl = `doc/visit3/${SessionId}?visit_id=${visit_id}&doc_type=${encodeURIComponent("护理文书")}&doc_name=${encodeURIComponent("护理记录")}&doc_tag=${encodeURIComponent("护理记录")}&auto_create=1&rebuild=1`;

  const handlePrint = async () => {
    setPrintLoading(true);
    try {
      await print(carePrintUrl);
    } finally {
      setPrintLoading(false);
    }
  };

  const handlePrintPreview = async () => {
    if (previewLoading) return;
    setPreviewLoading(true);
    try {
      await printPreview(carePrintUrl);
    } finally {
      setPreviewLoading(false);
    }
  };

  if (!SessionId) {
    return <Empty description="请先登录" />;
  }

  if (!visitId) {
    return <Empty description="请先选择患者" />;
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden p-2 bg-(--app-theme-bg-container)">
      <div className="mb-2 flex shrink-0 flex-wrap items-center justify-between gap-2">
        <Space wrap align="center">
          {!linkFilter ? (
            <>
              <Space size={4}>
                <Button
                  size="small"
                  icon={<LeftOutlined />}
                  onClick={() =>
                    setCareObserve({
                      ...careObserve,
                      start_time: getPreviousDayDate(careObserve.start_time),
                    })
                  }
                />
                <DatePicker
                  size="small"
                  value={
                    careObserve.start_time
                      ? dayjs(careObserve.start_time)
                      : null
                  }
                  onChange={(date) => {
                    if (date) {
                      setCareObserve({
                        ...careObserve,
                        start_time: date.format("YYYY-MM-DD"),
                      });
                    }
                  }}
                  format="YYYY-MM-DD"
                  allowClear={false}
                />
                <Button
                  size="small"
                  icon={<RightOutlined />}
                  onClick={() =>
                    setCareObserve({
                      ...careObserve,
                      start_time: getNextDayDate(careObserve.start_time),
                    })
                  }
                />
              </Space>

              <Space size={4} align="center">
                <Select
                  size="small"
                  value={careObserve.time_gap}
                  style={{ width: 64 }}
                  options={timeGapList.map((item) => ({
                    label: item.name,
                    value: item.value,
                  }))}
                  onChange={(value) =>
                    setCareObserve({ ...careObserve, time_gap: value })
                  }
                />
                <span>天</span>
              </Space>

              <Space size={4} align="center">
                <span>入院日期：</span>
                <Button
                  size="small"
                  onClick={() =>
                    setCareObserve({ ...careObserve, start_time: timeValue2 })
                  }
                >
                  {timeValue2}
                </Button>
              </Space>
            </>
          ) : null}
          {isEdit && !linkFilter && showTransferCareLevel ? (
            <Space size={4} align="center">
              <Button
                size="small"
                type="primary"
                onClick={() => setTransferCareOpen(true)}
              >
                转护理等级
              </Button>
            </Space>
          ) : null}
          {isEdit && useModalEntry && showAddButton ? (
            <Button type="primary" size="small" onClick={openAddModal}>
              新增
            </Button>
          ) : null}
        </Space>

        <Space wrap>
          {isEdit && (
            <>
              <Button
                type="primary"
                size="small"
                onClick={() => submitSelectedRecords()}
                disabled={!canSubmit}
                title={submitButtonTitle}
              >
                提交
              </Button>
              <Button
                size="small"
                onClick={() => cancelSubmitSelectedRecords()}
                disabled={!canCancelSubmit}
              >
                取消提交
              </Button>
            </>
          )}
          {!linkFilter ? (
            <Space.Compact>
              <Button
                size="small"
                loading={printLoading}
                disabled={previewLoading}
                onClick={() => void handlePrint()}
              >
                打印
              </Button>
              <Button
                size="small"
                loading={previewLoading}
                disabled={printLoading}
                icon={<EllipsisOutlined />}
                title="打印预览"
                onClick={() => void handlePrintPreview()}
              />
            </Space.Compact>
          ) : null}
        </Space>
      </div>

      {isEdit && !useModalEntry ? (
        <Splitter layout="vertical" className="care-record-splitter min-h-0 flex-1">
          <Splitter.Panel defaultSize="55%" min="20%" max="75%">
            <div
              ref={tableRef}
              className={`care-record-table h-full min-h-0 overflow-hidden [&_.ant-table-body]:min-h-(--care-table-min-h)${customVisibleColumns ? " care-record-table--custom-cols" : ""}`}
              style={{
                ["--care-table-min-h" as string]: `${Math.min(TABLE_BODY_MIN_H, scrollY)}px`,
              }}
            >
              <style>{`
                .care-record-splitter.ant-splitter,
                .care-record-splitter.ant-splitter-vertical {
                  height: 100%;
                  min-height: 0;
                }
                .care-record-splitter > .ant-splitter-bar {
                  flex: none;
                }
                .care-record-splitter > .ant-splitter-panel,
                .care-record-splitter .ant-splitter-panel-body {
                  overflow: hidden !important;
                  min-height: 0;
                }
                ${
                  useCompactTableFont
                    ? `
                .care-record-table .ant-table,
                .care-record-table .ant-table-thead > tr > th,
                .care-record-table .ant-table-tbody > tr > td,
                .care-record-table .ant-table-cell,
                .care-record-table .ant-btn,
                .care-record-table .ant-tag {
                  font-size: 11px !important;
                  line-height: 1.35 !important;
                }
                .care-record-table .ant-table-thead > tr > th,
                .care-record-table .ant-table-tbody > tr > td {
                  padding: 2px 4px !important;
                }
                `
                    : ""
                }
                .care-record-table .ant-table-tbody > tr.care-transfer-row > td {
                  box-shadow: inset 0 2px 0 0 var(--app-theme-error, #ff4d4f);
                }
                .care-record-table td.care-wrap-cell {
                  white-space: normal !important;
                  word-break: break-word !important;
                  overflow-wrap: anywhere !important;
                  overflow: visible !important;
                  text-overflow: clip !important;
                  vertical-align: top;
                }
                .care-record-table td.care-wrap-cell .ant-table-cell-content {
                  white-space: normal !important;
                  overflow: visible !important;
                  text-overflow: clip !important;
                }
                ${
                  customVisibleColumns
                    ? `
                .care-record-table--custom-cols th.care-col-time,
                .care-record-table--custom-cols td.care-col-time {
                  padding-right: 12px !important;
                  white-space: nowrap;
                }
                .care-record-table--custom-cols th.care-col-content,
                .care-record-table--custom-cols td.care-col-content {
                  min-width: 420px;
                  padding-left: 12px !important;
                }
                `
                    : ""
                }
              `}</style>
              <Table<CareRecordRow>
                size="small"
                rowKey="row_key"
                loading={isLoading}
                columns={columns}
                dataSource={tableDataSource}
                pagination={false}
                scroll={{
                  x: tableScrollX,
                  y: tableDataSource.length > 0 ? scrollY : undefined,
                }}
                rowClassName={(record) => {
                  const classes: string[] = [];
                  if (record.care_tag === "[TRANSFER]") {
                    classes.push("care-transfer-row");
                  }
                  if (isEdit && selectedRowKey && record.row_key === selectedRowKey) {
                    classes.push("bg-(--app-theme-primary-bg)");
                  }
                  if (isEdit) {
                    classes.push("cursor-pointer");
                  }
                  return classes.join(" ");
                }}
                onRow={(record) => ({
                  onClick: (e) => handleRowClick(record, e),
                  onDoubleClick: () => onRowDoubleClick?.(record),
                  style: {
                    cursor: isEdit || onRowDoubleClick ? "pointer" : undefined,
                  },
                })}
                locale={{
                  emptyText: <Empty description="暂无记录" />,
                }}
              />
            </div>
          </Splitter.Panel>
          <Splitter.Panel defaultSize="45%" min="25%">
            <div className="flex h-full min-h-0 flex-col overflow-hidden bg-(--app-theme-bg-container)">
              <Tabs
                size="small"
                activeKey={entryTab}
                onChange={handleEntryTabChange}
                className="care-entry-tabs shrink-0 [&_.ant-tabs-nav]:mb-0! [&_.ant-tabs-content-holder]:hidden"
                items={[
                  { key: "vital", label: "体征录入" },
                  { key: "io", label: "入出量" },
                  { key: "oxygen", label: "吸氧" },
                ]}
              />
              <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
                {entryTab === "vital" ? (
                  <div className="flex min-h-full flex-col">
                    <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between gap-2 border-b border-(--app-theme-border) bg-(--app-theme-bg-container) px-2 py-1.5">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <span>时间：</span>
                        <DatePicker
                          showTime={{ format: "HH:mm" }}
                          format="YYYY-MM-DD HH:mm"
                          value={
                            (type === "edit" ? modifyTime : newTime)
                              ? dayjs(type === "edit" ? modifyTime : newTime)
                              : null
                          }
                          onChange={(date) => {
                            const formatted = date
                              ? date.format("YYYY-MM-DD HH:mm:00")
                              : "";
                            if (type === "add") {
                              setNewTime(formatted);
                              getObserveList2(formatted);
                            } else {
                              setModifyTime(formatted);
                            }
                          }}
                          className="min-w-0 max-w-full"
                          size="small"
                        />
                      </div>
                      <div className="flex shrink-0 gap-2">
                        {type === "edit" ? (
                          <Button
                            size="small"
                            type="primary"
                            onClick={() => submitData(true)}
                          >
                            保存
                          </Button>
                        ) : (
                          <Button
                            size="small"
                            type="primary"
                            onClick={() => submitData(false)}
                          >
                            确定
                          </Button>
                        )}
                        <Button size="small" onClick={clearRowSelection}>
                          取消
                        </Button>
                      </div>
                    </div>
                    <div className="p-2">
                      <AddCareMask
                        key={addCareFormKey}
                        visitId={
                          Number.isFinite(visit_id) ? visit_id : undefined
                        }
                        type={type}
                        initialTime={pendingAddTime}
                        newTime={newTime}
                        setNewTime={setNewTime}
                        modifyTime={modifyTime}
                        setModifyTime={setModifyTime}
                        senseProperty={senseProperty}
                        setSenseProperty={setSenseProperty}
                        tubeProperty={tubeProperty}
                        setTubeProperty={setTubeProperty}
                        leftPupilProperty={leftPupilProperty}
                        setLeftPupilProperty={setLeftPupilProperty}
                        rightPupilProperty={rightPupilProperty}
                        setRightPupilProperty={setRightPupilProperty}
                        leftReflexProperty={leftReflexProperty}
                        setLeftReflexProperty={setLeftReflexProperty}
                        rightReflexProperty={rightReflexProperty}
                        setRightReflexProperty={setRightReflexProperty}
                        tempProperty={tempProperty}
                        setTempProperty={setTempProperty}
                        plusProperty={plusProperty}
                        setPlusProperty={setPlusProperty}
                        heartProperty={heartProperty}
                        setHeartProperty={setHeartProperty}
                        breathProperty={breathProperty}
                        setBreathProperty={setBreathProperty}
                        sBpProperty={sBpProperty}
                        setSbpProperty={setSbpProperty}
                        dBpProperty={dBpProperty}
                        setDbpProperty={setDbpProperty}
                        spo2Property={spo2Property}
                        setSpo2Property={setSpo2Property}
                        careId={careId}
                        initCareProperty={baseInitCareProperty}
                        careProperty={careProperty}
                        setCareProperty={setCareProperty}
                        lockedLink={linkFilter}
                        visibleColumns={visibleColumns}
                        compactLayout={useModalEntry}
                        showLoad24HourInOut={showLoad24HourInOut}
                        showLinkSurgery={showLinkSurgery}
                        showReportReference={showReportReference}
                      />
                    </div>
                  </div>
                ) : null}
                {entryTab === "io" ? (
                  <IoEditModal
                    active={entryTab === "io"}
                    visitId={visit_id}
                    careTime={relatedTime}
                    userId={patientInfo.user_id}
                    userName={patientInfo.user_name}
                    onChanged={initGetData}
                    onSaved={initGetData}
                    onTimeChange={setRelatedCareTime}
                    onCancel={clearRowSelection}
                  />
                ) : null}
                {entryTab === "oxygen" ? (
                  <OxygenEditModal
                    active={entryTab === "oxygen"}
                    visitId={visit_id}
                    careTime={relatedTime}
                    oxygenId={relatedRecord?.oxygen_id}
                    hasOxygen={relatedRecord?.has_oxygen}
                    onSaved={initGetData}
                    onCancel={clearRowSelection}
                  />
                ) : null}
              </div>
            </div>
          </Splitter.Panel>
        </Splitter>
      ) : (
        <div
          ref={tableRef}
          className={`care-record-table flex h-full min-h-0 flex-1 flex-col overflow-hidden [&_.ant-spin-nested-loading]:h-full [&_.ant-spin-container]:h-full [&_.ant-table]:h-full [&_.ant-table-container]:h-full [&_.ant-table-body]:min-h-(--care-table-min-h)${customVisibleColumns ? " care-record-table--custom-cols" : ""}`}
          style={{
            ["--care-table-min-h" as string]: `${Math.min(TABLE_BODY_MIN_H, scrollY)}px`,
          }}
        >
          <style>{`
            ${
              useCompactTableFont && !linkFilter
                ? `
            .care-record-table .ant-table,
            .care-record-table .ant-table-thead > tr > th,
            .care-record-table .ant-table-tbody > tr > td,
            .care-record-table .ant-table-cell,
            .care-record-table .ant-btn,
            .care-record-table .ant-tag {
              font-size: 11px !important;
              line-height: 1.35 !important;
            }
            .care-record-table .ant-table-thead > tr > th,
            .care-record-table .ant-table-tbody > tr > td {
              padding: 2px 4px !important;
            }
            `
                : ""
            }
            .care-record-table .ant-table-tbody > tr.care-transfer-row > td {
              box-shadow: inset 0 2px 0 0 var(--app-theme-error, #ff4d4f);
            }
            .care-record-table td.care-wrap-cell {
              white-space: normal !important;
              word-break: break-word !important;
              overflow-wrap: anywhere !important;
              overflow: visible !important;
              text-overflow: clip !important;
              vertical-align: top;
            }
            .care-record-table td.care-wrap-cell .ant-table-cell-content {
              white-space: normal !important;
              overflow: visible !important;
              text-overflow: clip !important;
            }
            ${
              customVisibleColumns
                ? `
            .care-record-table--custom-cols th.care-col-time,
            .care-record-table--custom-cols td.care-col-time {
              padding-right: 12px !important;
              white-space: nowrap;
            }
            .care-record-table--custom-cols th.care-col-content,
            .care-record-table--custom-cols td.care-col-content {
              min-width: 420px;
              padding-left: 12px !important;
            }
            `
                : ""
            }
          `}</style>
          <Table<CareRecordRow>
            size="small"
            rowKey="row_key"
            loading={isLoading}
            columns={columns}
            dataSource={tableDataSource}
            pagination={false}
            scroll={{
              x: tableScrollX,
              y: scrollY,
            }}
            rowClassName={(record) => {
              const classes: string[] = [];
              if (record.care_tag === "[TRANSFER]") {
                classes.push("care-transfer-row");
              }
              if (
                useModalEntry &&
                selectedRowKey &&
                record.row_key === selectedRowKey
              ) {
                classes.push("bg-(--app-theme-primary-bg)");
              }
              if (useModalEntry) {
                classes.push("cursor-pointer");
              }
              return classes.join(" ");
            }}
            onRow={(record) => ({
              onClick: useModalEntry
                ? (e) => handleRowClick(record, e)
                : undefined,
              onDoubleClick: () => onRowDoubleClick?.(record),
              style: {
                cursor:
                  useModalEntry || onRowDoubleClick ? "pointer" : undefined,
              },
            })}
            locale={{
              emptyText: <Empty description="暂无记录" />,
            }}
          />
        </div>
      )}

      {useModalEntry ? (
        <>
          <Modal
            title={type === "edit" ? "编辑护理记录" : "新增护理记录"}
            open={formModalOpen && entryTab === "vital"}
            width="90vw"
            style={{ maxWidth: 1100 }}
            destroyOnHidden
            footer={null}
            onCancel={clearRowSelection}
          >
            <div className="flex max-h-[75vh] flex-col overflow-hidden">
              <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between gap-2 border-b border-(--app-theme-border) bg-(--app-theme-bg-container) px-1 py-2">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span>时间：</span>
                  <DatePicker
                    showTime={{ format: "HH:mm" }}
                    format="YYYY-MM-DD HH:mm"
                    value={
                      (type === "edit" ? modifyTime : newTime)
                        ? dayjs(type === "edit" ? modifyTime : newTime)
                        : null
                    }
                    onChange={(date) => {
                      const formatted = date
                        ? date.format("YYYY-MM-DD HH:mm:00")
                        : "";
                      if (type === "add") {
                        setNewTime(formatted);
                        getObserveList2(formatted);
                      } else {
                        setModifyTime(formatted);
                      }
                    }}
                    className="min-w-0 max-w-full"
                    size="small"
                  />
                </div>
                <div className="flex shrink-0 gap-2">
                  {type === "edit" ? (
                    <Button
                      size="small"
                      type="primary"
                      onClick={() => submitData(true)}
                    >
                      保存
                    </Button>
                  ) : (
                    <Button
                      size="small"
                      type="primary"
                      onClick={() => submitData(false)}
                    >
                      确定
                    </Button>
                  )}
                  <Button size="small" onClick={clearRowSelection}>
                    取消
                  </Button>
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-2">
                <AddCareMask
                  key={addCareFormKey}
                  visitId={Number.isFinite(visit_id) ? visit_id : undefined}
                  type={type}
                  initialTime={pendingAddTime}
                  newTime={newTime}
                  setNewTime={setNewTime}
                  modifyTime={modifyTime}
                  setModifyTime={setModifyTime}
                  senseProperty={senseProperty}
                  setSenseProperty={setSenseProperty}
                  tubeProperty={tubeProperty}
                  setTubeProperty={setTubeProperty}
                  leftPupilProperty={leftPupilProperty}
                  setLeftPupilProperty={setLeftPupilProperty}
                  rightPupilProperty={rightPupilProperty}
                  setRightPupilProperty={setRightPupilProperty}
                  leftReflexProperty={leftReflexProperty}
                  setLeftReflexProperty={setLeftReflexProperty}
                  rightReflexProperty={rightReflexProperty}
                  setRightReflexProperty={setRightReflexProperty}
                  tempProperty={tempProperty}
                  setTempProperty={setTempProperty}
                  plusProperty={plusProperty}
                  setPlusProperty={setPlusProperty}
                  heartProperty={heartProperty}
                  setHeartProperty={setHeartProperty}
                  breathProperty={breathProperty}
                  setBreathProperty={setBreathProperty}
                  sBpProperty={sBpProperty}
                  setSbpProperty={setSbpProperty}
                  dBpProperty={dBpProperty}
                  setDbpProperty={setDbpProperty}
                  spo2Property={spo2Property}
                  setSpo2Property={setSpo2Property}
                  careId={careId}
                  initCareProperty={baseInitCareProperty}
                  careProperty={careProperty}
                  setCareProperty={setCareProperty}
                  lockedLink={linkFilter}
                  visibleColumns={visibleColumns}
                  compactLayout
                  showLoad24HourInOut={showLoad24HourInOut}
                  showLinkSurgery={showLinkSurgery}
                  showReportReference={showReportReference}
                />
              </div>
            </div>
          </Modal>

          <Modal
            title="入出量"
            open={formModalOpen && entryTab === "io"}
            width="90vw"
            style={{ maxWidth: 1100 }}
            destroyOnHidden
            footer={null}
            onCancel={clearRowSelection}
          >
            <IoEditModal
              active={formModalOpen && entryTab === "io"}
              visitId={visit_id}
              careTime={relatedTime}
              userId={patientInfo.user_id}
              userName={patientInfo.user_name}
              onChanged={initGetData}
              onSaved={initGetData}
              onTimeChange={setRelatedCareTime}
              onCancel={clearRowSelection}
            />
          </Modal>

          <Modal
            title="吸氧"
            open={formModalOpen && entryTab === "oxygen"}
            width={640}
            destroyOnHidden
            footer={null}
            onCancel={clearRowSelection}
          >
            <OxygenEditModal
              active={formModalOpen && entryTab === "oxygen"}
              visitId={visit_id}
              careTime={relatedTime}
              oxygenId={relatedRecord?.oxygen_id}
              hasOxygen={relatedRecord?.has_oxygen}
              onSaved={initGetData}
              onCancel={clearRowSelection}
            />
          </Modal>
        </>
      ) : null}

      {isEdit && !linkFilter && showTransferCareLevel && (
        <TransferCareLevel
          open={transferCareOpen}
          visitId={visit_id}
          userId={patientInfo.user_id}
          userName={patientInfo.user_name}
          occupiedCareTimes={occupiedCareTimes}
          onCancel={() => setTransferCareOpen(false)}
          onSuccess={() => {
            setTransferCareOpen(false);
            initGetData();
          }}
        />
      )}
    </div>
  );
});

export default MainContent;
