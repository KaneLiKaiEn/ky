import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Form, Modal, message } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { deleteCare, getCareList, newCare, saveCareProperty } from "@/api/care";
import { deleteEmr, getEmrList } from "@/api/emr";
import { getElemOptionList2, getElemProperty2 } from "@/api/elem";
import {
  getParamValue,
  retrieveDict2ItemList,
  retrieveDict2List,
} from "@/api/sys";
import { getPatientProperty } from "@/api/visit";
import { getSessionInfo } from "@/api/auth";
import { getSessionId } from "comm/session";
import type { CareRow } from "@/types/care";
import type { EmrRow } from "@/types/emr";
import type { ElemOptionRow, ElemRow } from "@/types/elem";
import type { Dict2ItemRow, Dict2Row, GetParamValueRes } from "@/types/sys";
import {
  buildRows,
  careContentOf,
  toOption,
  type DictItem,
} from "../buildRows";
import { notifyApi } from "../notify";
import {
  filterTimesByType,
  generateTimeList,
  getQueryRange,
  getShiftByTime,
  mergeDateWithNowTime,
  mergeTimeList,
} from "../time";
import type {
  CellValue,
  ColumnCopy,
  CopyInfo,
  EmrDialogState,
  HeaderAction,
  NursingPage,
  NursingRow,
  ShiftType,
} from "../types";

const DOC_TYPE = "患者评估";

async function resolveOrgId() {
  const sessionId = getSessionId();
  if (!sessionId) return 0;
  const res = await getSessionInfo({ session_id: sessionId });
  const orgId = Number(res.session_info?.org_id);
  if (Number.isFinite(orgId) && orgId > 0) return orgId;
  const stored = Number(localStorage.getItem("SITE_AUTH_CA_ORG_ID"));
  return Number.isFinite(stored) && stored > 0 ? stored : 0;
}

export default function useNursingMatrix(visitId: number, page: NursingPage) {
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(() => dayjs());
  const [shift, setShift] = useState<ShiftType>(() => getShiftByTime());
  const [dictItems, setDictItems] = useState<DictItem[]>([]);
  const [dictReady, setDictReady] = useState(false);
  const [records, setRecords] = useState<Array<CareRow | EmrRow>>([]);
  const [extraTimes, setExtraTimes] = useState<string[]>([]);
  const [sourceData, setSourceData] = useState<ColumnCopy>();
  const [nursingTip, setNursingTip] = useState("");
  const [timeOpen, setTimeOpen] = useState(false);
  const [timeForm] = Form.useForm();
  const [emrDialog, setEmrDialog] = useState<EmrDialogState>({
    open: false,
    emrId: 0,
    docName: "",
    emrTime: "",
  });
  const copyInfoRef = useRef<CopyInfo | undefined>(undefined);
  const pageRef = useRef(page);
  const visitRef = useRef(visitId);
  const dateRef = useRef(date);
  pageRef.current = page;
  visitRef.current = visitId;
  dateRef.current = date;

  const derivedRows = useMemo(
    () => buildRows(dictItems, records, page),
    [dictItems, records, page],
  );
  const [rows, setRows] = useState<NursingRow[]>([]);
  const rowsRef = useRef(rows);
  rowsRef.current = rows;

  useEffect(() => {
    setRows(derivedRows);
  }, [derivedRows]);

  const recordTimes = useMemo(() => {
    if (page === "护理评估") {
      return (records as EmrRow[])
        .map((item) => item.emr_time)
        .filter((time): time is string => !!time);
    }
    return (records as CareRow[])
      .map((item) => item.care_time)
      .filter((time): time is string => !!time);
  }, [page, records]);

  const times = useMemo(() => {
    const merged = mergeTimeList(generateTimeList(date.toDate()), [
      ...recordTimes,
      ...extraTimes,
    ]);
    return filterTimesByType(merged, shift, date);
  }, [date, extraTimes, recordTimes, shift]);

  const loadRecords = useCallback(
    async (showLoading = true) => {
      if (!visitId) return;
      if (showLoading) setLoading(true);
      const { start, end } = getQueryRange(date);
      try {
        if (page === "护理评估") {
          const res = await getEmrList({
            visit_id: visitId,
            doc_type: DOC_TYPE,
            emr_start: start,
            emr_end: end,
          });
          if (!notifyApi(res)) return;
          setRecords(res.row_list ?? []);
        } else {
          const res = await getCareList({
            visit_id: visitId,
            care_type: "*",
            care_start: start,
            care_end: end,
          });
          if (!notifyApi(res)) return;
          setRecords(res.row_list ?? []);
        }
      } catch {
        message.error("加载数据失败");
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [date, page, visitId],
  );

  const loadDict = useCallback(async () => {
    setDictReady(false);
    setLoading(true);
    try {
      const orgId = await resolveOrgId();
      const res = await retrieveDict2List({ org_id: orgId || undefined });
      if (!notifyApi(res)) {
        setDictItems([]);
        return;
      }
      const list = res.row_list ?? [];
      const parent = list.find(
        (item: Dict2Row) =>
          item.dict_name === page &&
          item.valid_status === "1" &&
          item.catalog_id === 0,
      );
      if (!parent?.dict_id) {
        message.warning(`未找到${page}字典`);
        setDictItems([]);
        return;
      }
      const groups = list.filter(
        (item: Dict2Row) =>
          item.catalog_id === parent.dict_id && item.valid_status === "1",
      );
      const items: DictItem[] = [];
      for (const group of groups) {
        if (!group.dict_id) continue;
        const itemRes = await retrieveDict2ItemList({ dict_id: group.dict_id });
        if (itemRes.code !== 0) continue;
        const validItems = (itemRes.row_list ?? []).filter(
          (item: Dict2ItemRow) => item.valid_status === "1",
        );
        const elemIds = validItems
          .map((item: Dict2ItemRow) => item.item_id)
          .filter((id: number | undefined): id is number => !!id);
        const [propertyRes, optionRes] = await Promise.all([
          elemIds.length
            ? getElemProperty2({ id_list: elemIds })
            : Promise.resolve({ code: 0, message: "", elem_list: [] }),
          elemIds.length
            ? getElemOptionList2({ elem_id_list: elemIds })
            : Promise.resolve({ code: 0, message: "", row_list: [] }),
        ]);
        validItems.forEach((item: DictItem) => {
          items.push({
            ...item,
            dict_name: group.dict_name,
            dict_note: group.dict_note,
            elemProperty: propertyRes.elem_list?.find(
              (elem: ElemRow) => elem.elem_id === item.item_id,
            ),
            elemOptions: (optionRes.row_list ?? [])
              .filter(
                (option: ElemOptionRow) => option.elem_id === item.item_id,
              )
              .map(toOption),
          });
        });
      }
      setDictItems(items);
    } catch {
      message.error("加载字典失败");
      setDictItems([]);
    } finally {
      setDictReady(true);
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    if (!visitId) return;
    setRecords([]);
    setExtraTimes([]);
    setSourceData(undefined);
    copyInfoRef.current = undefined;
    void loadDict();
  }, [loadDict, visitId]);

  useEffect(() => {
    if (!dictReady) return;
    void loadRecords(true);
  }, [dictReady, loadRecords]);

  useEffect(() => {
    if (page !== "护理评估") {
      setNursingTip("");
      return;
    }
    void getParamValue({ item_code: "ICU_NURSING_TIP" }).then(
      (res: GetParamValueRes) => {
        if (res.code === 0) setNursingTip(res.item_value ?? "");
      },
    );
  }, [page]);

  const refresh = useCallback(
    (showLoading = false) => loadRecords(showLoading),
    [loadRecords],
  );

  const updateCell = useCallback(
    (row: NursingRow, time: string, value: CellValue, isBlur = false) => {
      setRows((prev) =>
        prev.map((item) =>
          item.id !== row.id
            ? item
            : { ...item, values: { ...item.values, [time]: value } },
        ),
      );
      if (!isBlur || pageRef.current !== "基础护理") return;

      const content = careContentOf(value);
      const property: CareRow = {
        visit_id: visitRef.current,
        care_content: content,
        care_time: time,
        care_type: row.label,
      };
      const id = value[0];
      void (async () => {
        if (id > 0) {
          const res = await saveCareProperty({
            care_id: id,
            care_property: property,
          });
          if (notifyApi(res, "保存成功")) void refresh(false);
          return;
        }
        if (!content) return;
        const res = await newCare(property);
        if (notifyApi(res, "新增成功")) void refresh(false);
      })().catch(() => message.error("保存失败"));
    },
    [refresh],
  );

  const deleteCell = useCallback(async (row: NursingRow, time: string) => {
    const id = row.values[time]?.[0];
    if (!id) return;
    try {
      if (pageRef.current === "基础护理") {
        const res = await deleteCare({ care_id: id });
        if (!notifyApi(res, "删除成功")) return;
        setRecords((prev) =>
          (prev as CareRow[]).filter((item) => item.care_id !== id),
        );
        return;
      }
      const res = await deleteEmr({
        emr_id: id,
        delete_note: "护理评估页面删除",
      });
      if (!notifyApi(res, "删除成功")) return;
      setRecords((prev) =>
        (prev as EmrRow[]).filter((item) => item.emr_id !== id),
      );
    } catch {
      message.error("删除失败");
    }
  }, []);

  const pasteCell = useCallback(
    async (info: CopyInfo, pasteTime: string) => {
      const content = careContentOf(info.row.values[info.time]);
      if (!content) return;
      try {
        const res = await newCare({
          visit_id: visitRef.current,
          care_content: content,
          care_time: pasteTime,
          care_type: info.row.label,
        });
        if (notifyApi(res, "粘贴成功")) {
          copyInfoRef.current = undefined;
          void refresh(false);
        }
      } catch {
        message.error("粘贴失败");
      }
    },
    [refresh],
  );

  const openEmr = useCallback(
    async (row: NursingRow, time: string, value?: CellValue) => {
      try {
        const res = await getPatientProperty({ visit_id: visitRef.current });
        setEmrDialog({
          open: true,
          emrId: value?.[0] ?? 0,
          docName: row.label ?? "",
          emrTime: time,
          patient: res.code === 0 ? res.patient_property : undefined,
          elemOptions: row.elemOptions ?? [],
        });
      } catch {
        message.error("加载患者信息失败");
      }
    },
    [],
  );

  const showAddTime = () => {
    timeForm.setFieldsValue({
      care_time: mergeDateWithNowTime(dateRef.current),
    });
    setTimeOpen(true);
  };

  const confirmAddTime = async () => {
    const values = await timeForm.validateFields();
    const careTime = dayjs(values.care_time as Dayjs).format(
      "YYYY-MM-DD HH:mm:ss",
    );
    const current = dateRef.current;
    const min = current
      .hour(8)
      .minute(0)
      .second(0)
      .format("YYYY-MM-DD HH:mm:ss");
    const max = current
      .add(1, "day")
      .hour(8)
      .minute(0)
      .second(0)
      .format("YYYY-MM-DD HH:mm:ss");
    if (careTime < min || careTime > max) {
      message.warning("时间点需要在限定的范围内");
      return;
    }
    setExtraTimes((prev) => [...prev, careTime]);
    setTimeOpen(false);
    timeForm.resetFields();
  };

  const copyColumn = (sourceTime: string) => {
    if (pageRef.current === "护理评估") {
      message.warning("暂不支持对护理评估项目进行复制");
      return;
    }
    const sourceRows: NursingRow[] = [];
    rowsRef.current.forEach((item) => {
      const value = item.values[sourceTime];
      if (!value || !value[0]) return;
      if (item.type?.includes("SUM")) return;
      sourceRows.push({
        ...item,
        values: { [sourceTime]: value },
      });
    });
    if (!sourceRows.length) {
      message.warning("该时间点没有数据，请切换其他时间点进行复制");
      return;
    }
    setSourceData({ time: sourceTime, rows: sourceRows });
    message.success(`已选中源时间：${sourceTime}，请点击目标时间进行复制`);
  };

  const pasteColumn = (targetTime: string) => {
    if (pageRef.current === "护理评估") {
      message.warning("暂不支持对护理评估项目进行复制");
      return;
    }
    if (!sourceData) {
      message.warning("请先进行复制操作");
      return;
    }
    if (sourceData.time === targetTime) {
      setSourceData(undefined);
      message.warning("源时间和目标时间相同，无需复制");
      return;
    }
    const sourceTime = sourceData.time;
    Modal.confirm({
      title: "确认进行粘贴操作？",
      content: `确定要将 ${sourceTime} 的数据粘贴到 ${targetTime} 吗？`,
      okText: "确认粘贴",
      cancelText: "取消",
      onOk: async () => {
        const pending = sourceData.rows.filter((source) => {
          const current = rowsRef.current.find((item) => item.id === source.id);
          const targetValue = current?.values[targetTime];
          return !(targetValue && targetValue[0] > 0);
        });
        if (!pending.length) {
          message.warning("该时间点已有数据，无法进行粘贴操作");
          return;
        }
        const results = await Promise.all(
          pending.map((item) =>
            newCare({
              visit_id: visitRef.current,
              care_content: careContentOf(item.values[sourceTime]),
              care_time: targetTime,
              care_type: item.label,
            }),
          ),
        );
        const failed = results.filter(
          (res: { code?: number; message?: string; hint?: string }) =>
            res.code !== 0,
        );
        if (failed.length) {
          message.warning(
            failed
              .map(
                (res: { message?: string; hint?: string }) =>
                  res.message || res.hint || "粘贴失败",
              )
              .join("、"),
          );
        } else {
          message.success("粘贴成功");
        }
        setSourceData(undefined);
        await refresh(true);
      },
    });
  };

  const deleteColumn = (sourceTime: string) => {
    const targets = rowsRef.current.filter((item) => {
      const value = item.values[sourceTime];
      return value && value[0] > 0 && !item.type?.includes("SUM");
    });
    if (!targets.length) {
      message.warning("该时间点没有可删除的数据");
      return;
    }
    Modal.confirm({
      title: "确认进行删除操作？",
      content: `确定要删除 ${sourceTime} 的数据吗？`,
      okText: "确认删除",
      cancelText: "取消",
      onOk: async () => {
        const results = await Promise.all(
          targets.map((item) => {
            const id = item.values[sourceTime][0];
            if (pageRef.current === "基础护理") {
              return deleteCare({ care_id: id });
            }
            return deleteEmr({ emr_id: id, delete_note: "护理评估页面删除" });
          }),
        );
        const failed = results.filter(
          (res: { code?: number; message?: string }) => res.code !== 0,
        );
        if (failed.length) {
          message.error(failed[0].message || "删除失败");
        } else {
          message.success("删除成功");
        }
        await refresh(true);
      },
    });
  };

  const handleHeaderAction = (action: HeaderAction, time: string) => {
    if (action === "add") showAddTime();
    if (action === "copy") copyColumn(time);
    if (action === "paste") pasteColumn(time);
    if (action === "delete") deleteColumn(time);
  };

  return {
    loading,
    date,
    setDate,
    shift,
    setShift,
    rows,
    times,
    sourceTime: sourceData?.time,
    nursingTip,
    refresh,
    copyInfoRef,
    updateCell,
    deleteCell,
    pasteCell,
    openEmr,
    emrDialog,
    setEmrDialog,
    records,
    timeOpen,
    setTimeOpen,
    timeForm,
    confirmAddTime,
    handleHeaderAction,
  };
}
