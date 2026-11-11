import { useCallback, useEffect, useRef, useState } from "react";
import { App } from "antd";
import type { MessageInstance } from "antd/es/message/interface";
import dayjs from "dayjs";
import {
  commitQcAPI,
  getEmrListAPI,
  getQcList3API,
  rawResponseConfig,
  rollbackQcAPI,
} from "../api";
import type { EmrRow, MedrecordQualityRole } from "../types";

const DATETIME_FORMAT = "YYYY-MM-DD HH:mm:ss";
const COMMIT_TIME_DISPLAY = "YYYY-MM-DD HH:mm";

type ApiBody = {
  code?: number | string | null;
  message?: string;
  hint?: string;
};

const formatCommitTime = (value?: string) => {
  const text = value?.trim() ?? "";
  if (!text) return "";
  const parsed = dayjs(text);
  return parsed.isValid() ? parsed.format(COMMIT_TIME_DISPLAY) : text;
};

const apiTip = (res?: ApiBody | null, fallback = "") => {
  const text = `${res?.message || ""}${res?.hint || ""}`.trim();
  return text || fallback;
};

/**
 * code === 0 成功；code > 0 警告但仍视为成功；code < 0 失败。
 * 返回 true 时调用方可以刷新或关闭弹窗。
 */
const notifyApiResult = (
  messageApi: MessageInstance,
  res: ApiBody | null | undefined,
  successText = "",
  failText = "操作失败",
) => {
  const code = Number(res?.code);
  if (code === 0) {
    if (successText) messageApi.success(successText);
    return true;
  }
  if (Number.isFinite(code) && code > 0) {
    messageApi.warning(apiTip(res) || "请注意");
    return true;
  }
  messageApi.error(apiTip(res, failText));
  return false;
};

export const useMedrecordQuality = (
  visitId?: number | null,
  role: MedrecordQualityRole = "nurse",
  onSuccess?: () => void,
) => {
  const { message } = App.useApp();
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;
  const commitTimeField =
    role === "doctor" ? "doctor_commit_time" : "nurse_commit_time";

  const [list, setList] = useState<EmrRow[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [commitLoading, setCommitLoading] = useState(false);
  const [rollbackLoading, setRollbackLoading] = useState(false);
  const [rollbackOpen, setRollbackOpen] = useState(false);
  const [commitTime, setCommitTime] = useState("");

  const loadQcStatus = useCallback(async () => {
    if (visitId == null) {
      setCommitTime("");
      return;
    }
    try {
      const res = await getQcList3API(
        { visit_id_list: [visitId] },
        rawResponseConfig,
      );
      if (!notifyApiResult(message, res, "", "查询质控提交状态失败")) {
        setCommitTime("");
        return;
      }
      const row =
        res.row_list?.find((item) => item.visit_id === visitId) ??
        res.row_list?.[0];
      setCommitTime(formatCommitTime(row?.[commitTimeField]));
    } catch (error) {
      console.error("查询质控提交状态失败:", error);
      setCommitTime("");
    }
  }, [commitTimeField, message, visitId]);

  const loadList = useCallback(async () => {
    if (visitId == null) {
      setList([]);
      return;
    }
    setListLoading(true);
    try {
      const res = await getEmrListAPI({ visit_id: visitId }, rawResponseConfig);
      if (!notifyApiResult(message, res, "", "加载病历列表失败")) {
        setList([]);
        return;
      }
      setList(res.row_list ?? []);
    } catch (error) {
      console.error("加载病历列表失败:", error);
      setList([]);
      message.error("加载病历列表失败");
    } finally {
      setListLoading(false);
    }
  }, [message, visitId]);

  useEffect(() => {
    void loadQcStatus();
    void loadList();
  }, [loadList, loadQcStatus]);

  const handleQcCheck = useCallback(() => {
    message.info("该功能开发中...");
  }, [message]);

  const handleCommitQc = useCallback(async () => {
    if (visitId == null) {
      message.error("请先选择住院患者");
      return;
    }
    setCommitLoading(true);
    try {
      const res = await commitQcAPI(
        {
          visit_id: visitId,
          commit_time: dayjs().format(DATETIME_FORMAT),
        },
        rawResponseConfig,
      );
      if (notifyApiResult(message, res, "提交质控成功", "提交质控失败")) {
        await loadQcStatus();
        onSuccessRef.current?.();
      }
    } catch (error) {
      console.error("提交质控失败:", error);
    } finally {
      setCommitLoading(false);
    }
  }, [loadQcStatus, message, visitId]);

  const openRollback = useCallback(() => {
    if (visitId == null) {
      message.error("请先选择住院患者");
      return;
    }
    setRollbackOpen(true);
  }, [message, visitId]);

  const closeRollback = useCallback(() => {
    if (rollbackLoading) return;
    setRollbackOpen(false);
  }, [rollbackLoading]);

  const handleRollbackQc = useCallback(
    async (note?: string) => {
      if (visitId == null) {
        message.error("请先选择住院患者");
        return;
      }
      setRollbackLoading(true);
      try {
        const res = await rollbackQcAPI(
          {
            visit_id: visitId,
            rollback_time: dayjs().format(DATETIME_FORMAT),
            rollback_note: note,
          },
          rawResponseConfig,
        );
        if (notifyApiResult(message, res, "申请退回成功", "申请退回失败")) {
          setRollbackOpen(false);
          await loadQcStatus();
          onSuccessRef.current?.();
        }
      } catch (error) {
        console.error("申请退回失败:", error);
        message.error("申请退回失败");
      } finally {
        setRollbackLoading(false);
      }
    },
    [loadQcStatus, message, visitId],
  );

  const refresh = useCallback(async () => {
    await Promise.all([loadQcStatus(), loadList()]);
  }, [loadList, loadQcStatus]);

  return {
    visitId,
    list,
    listLoading,
    commitLoading,
    commitTime,
    rollbackLoading,
    rollbackOpen,
    refresh,
    handleQcCheck,
    handleCommitQc,
    openRollback,
    closeRollback,
    handleRollbackQc,
  };
};
