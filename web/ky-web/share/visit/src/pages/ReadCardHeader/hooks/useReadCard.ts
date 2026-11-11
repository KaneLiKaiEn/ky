import { useCallback, useEffect, useRef, useState } from "react";
import { App } from "antd";
import {
  getActiveReaderListAPI,
  getReaderCardTypeListAPI,
  getReaderPatientInfoAPI,
} from "../api/card";
import { getPatientPropertyAPI } from "../api/patient";
import type { CardReadInfo, CardTypeItem, ReaderRow } from "../types/card";
import type { GetPatientPropertyRes } from "../types/patient";
import { getSessionInfoAPI } from "../api/auth";
import { getSessionId } from "comm/session";
import axios from "axios";

/** 扫码枪 / 手动输入对应的卡类型 */
export const QRCODE_CARD_TYPE = "QRCode";

/** 读卡方式：读卡器类型 + 卡类型 */
export interface ReadCardMethod extends CardTypeItem, ReaderRow {
  reader_type: string;
  reader_name?: string;
}

export interface UseReadCardOptions {
  /** 读卡并拉取患者属性成功后的回调（由父组件写入 store） */
  onPatientLoaded?: (data: GetPatientPropertyRes) => void;
  /**
   * 仅读卡回调：读卡并匹配患者后，将 read_info + patient_id 交给业务处理，不再走定位患者流程。
   * 用于「刷卡更新医保身份」等场景。
   */
  onReadInfo?: (
    readInfo: CardReadInfo,
    patientId: number,
    patientIds?: number[],
  ) => void | Promise<void>;
  autoInsert?: boolean;
  autoUpdate?: boolean;
}

const PATIENT_PROPERTY_COLUMNS = {
  column_list: "*",
  column_status: "*",
  column_address: "*",
  column_contact: "*",
  column_gp: "*",
  column_index: "*",
  column_ext: "*",
} as const;

/** 拉取患者完整属性（column_xxx 传 *） */
export const fetchPatientProperty = async (
  patientId: number,
): Promise<GetPatientPropertyRes> => {
  return getPatientPropertyAPI({
    patient_id: patientId,
    ...PATIENT_PROPERTY_COLUMNS,
  });
};

/**
 * 读卡业务流程：
 * GetActiveReaderList → GetReaderCardTypeList → GetReaderPatientInfo → GetPatientProperty
 */
export const useReadCard = (options: UseReadCardOptions = {}) => {
  const { message } = App.useApp();
  const messageRef = useRef(message);
  messageRef.current = message;
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const methodsRef = useRef<ReadCardMethod[]>([]);

  const [methods, setMethods] = useState<ReadCardMethod[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(false);
  const [reading, setReading] = useState(false);

  const loadMethods = useCallback(async () => {
    setLoadingMethods(true);
    try {
      const readerRes = await getActiveReaderListAPI();
      const readers = readerRes.row_list ?? [];
      if (!readers.length) {
        methodsRef.current = [];
        setMethods([]);
        return;
      }

      const lists = await Promise.all(
        readers.map(async (reader: ReaderRow) => {
          const readerType = reader.reader_type;
          if (!readerType) return [] as ReadCardMethod[];
          const cardRes = await getReaderCardTypeListAPI({
            reader_type: readerType,
          });
          return (cardRes.row_list ?? []).map((card: CardTypeItem) => ({
            ...card,
            ...reader,
            reader_type: readerType,
            reader_name: reader.reader_name,
          }));
        }),
      );

      const next = lists.flat();
      methodsRef.current = next;
      setMethods(next);
    } catch {
      messageRef.current.error("获取读卡方式失败");
      methodsRef.current = [];
      setMethods([]);
    } finally {
      setLoadingMethods(false);
    }
  }, []);

  useEffect(() => {
    void loadMethods();
  }, [loadMethods]);

  /** 扫码 / 手动输入 read_no 后读卡；有 onReadInfo 时回传卡信息+患者ID，否则定位患者 */
  const readByScan = useCallback(
    async (readNo: string, method?: ReadCardMethod) => {
      const trimmed = readNo.trim();
      if (!trimmed) {
        messageRef.current.warning("请输入或扫描读卡号");
        return null;
      }

      const {
        autoInsert = false,
        autoUpdate = false,
        onPatientLoaded,
        onReadInfo,
      } = optionsRef.current;

      const target =
        method ??
        methodsRef.current.find((m) => m.card_type === QRCODE_CARD_TYPE) ??
        methodsRef.current[0];

      if (!target?.reader_type || !target.card_type) {
        messageRef.current.warning("暂无可用的扫码读卡方式");
        return null;
      }

      const readInfo: CardReadInfo = {
        card_type: target.card_type,
        reader_type: target.reader_type,
        read_no: trimmed,
      };

      setReading(true);
      try {
        const infoRes = await getReaderPatientInfoAPI({
          reader_type: target.reader_type,
          input_req: {
            read_info: readInfo,
            auto_insert: autoInsert,
            auto_update: autoUpdate,
          },
        });

        const patientId = infoRes.patient_id;
        const patientIds = infoRes.patient_id_list;
        if (!patientId) {
          messageRef.current.warning(infoRes.message || "未匹配到患者");
          return null;
        }

        if (onReadInfo) {
          await onReadInfo(readInfo, patientId, patientIds ?? []);
          return true;
        }

        const propertyRes = await fetchPatientProperty(patientId);
        if (!propertyRes.patient_property) {
          messageRef.current.warning("未获取到患者属性");
          return null;
        }

        onPatientLoaded?.(propertyRes);
        return propertyRes;
      } catch {
        messageRef.current.error("读卡失败，请重试");
        return null;
      } finally {
        setReading(false);
      }
    },
    [],
  );

  /** 非扫码类读卡方式（医保码 / 医保卡等） */
  const readByDevice = useCallback(async (method: ReadCardMethod) => {
    setLoadingMethods(true);
    try {
      const sessionId = getSessionId();
      const res = await getSessionInfoAPI({ session_id: sessionId! });
      const sessionInfo = res.session_info || {};
      const localReadUrl = [
        `http://localhost:${method.reader_port}/read`,
        `?ct=${method.card_type}`,
        `&session_id=${sessionId}`,
        `&org_name=${encodeURIComponent(String(sessionInfo.org_name ?? ""))}`,
        `&dept_no=${sessionInfo.dept_no ?? ""}`,
        `&dept_name=${encodeURIComponent(String(sessionInfo.dept_name ?? ""))}`,
        `&user_no=${sessionInfo.user_no ?? ""}`,
        `&user_name=${encodeURIComponent(String(sessionInfo.user_name ?? ""))}`,
      ].join("");

      const result = await axios.post(localReadUrl);
      if (result.status !== 200) {
        messageRef.current.error("读卡失败，请重试");
        return;
      }

      const data = result.data;
      if (data?.code != null && data.code !== 0) {
        messageRef.current.error(
          [data.message, data.hint].filter(Boolean).join("") || "读卡失败",
        );
        return;
      }

      const {
        autoInsert = false,
        autoUpdate = false,
        onReadInfo,
        onPatientLoaded,
      } = optionsRef.current;

      const readInfo = data as CardReadInfo;
      const infoRes = await getReaderPatientInfoAPI({
        reader_type: method.reader_type,
        input_req: {
          read_info: readInfo,
          auto_insert: autoInsert,
          auto_update: autoUpdate,
        },
      });
      const patientId = infoRes.patient_id;
      const patientIds = infoRes.patient_id_list;
      if (!patientId) {
        messageRef.current.warning(infoRes.message || "未匹配到患者");
        return;
      }

      if (onReadInfo) {
        await onReadInfo(readInfo, patientId, patientIds ?? []);
        return;
      }

      const propertyRes = await fetchPatientProperty(patientId);
      if (!propertyRes.patient_property) {
        messageRef.current.warning("未获取到患者属性");
        return;
      }
      onPatientLoaded?.(propertyRes);
    } catch (error) {
      messageRef.current.error(
        error instanceof Error ? error.message : "读卡失败，请重试",
      );
    } finally {
      setLoadingMethods(false);
    }
  }, []);

  /** 按 patient_id 拉取患者属性并回调 */
  const loadByPatientId = useCallback(async (patientId: number) => {
    if (!patientId) {
      messageRef.current.warning("患者ID无效");
      return null;
    }

    const { onPatientLoaded } = optionsRef.current;
    setReading(true);
    try {
      const propertyRes = await fetchPatientProperty(patientId);
      if (!propertyRes.patient_property) {
        messageRef.current.warning("未获取到患者属性");
        return null;
      }
      onPatientLoaded?.(propertyRes);
      return propertyRes;
    } catch {
      messageRef.current.error("获取患者信息失败");
      return null;
    } finally {
      setReading(false);
    }
  }, []);

  return {
    methods,
    loadingMethods,
    reading,
    reloadMethods: loadMethods,
    readByScan,
    readByDevice,
    loadByPatientId,
    fetchPatientProperty,
  };
};
