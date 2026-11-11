import { useCallback, useEffect, useRef, useState } from "react";
import { App } from "antd";
import {
  getActiveReaderListAPI,
  getReaderCardTypeListAPI,
  getReaderPatientInfoAPI,
} from "../api/card";
import { getPatientPropertyAPI } from "../api/patient";
import type { CardTypeItem, ReaderRow } from "../types/card";
import type { GetPatientPropertyRes } from "../types/patient";

/** 扫码枪 / 手动输入对应的卡类型 */
export const QRCODE_CARD_TYPE = "QRCode";

/** 读卡方式：读卡器类型 + 卡类型 */
export interface ReadCardMethod extends CardTypeItem {
  reader_type: string;
  reader_name?: string;
}

export interface UseReadCardOptions {
  /** 读卡并拉取患者属性成功后的回调（由父组件写入 store） */
  onPatientLoaded?: (data: GetPatientPropertyRes) => void;
  /** 非扫码类读卡方式点击时的占位处理，后续可替换为真实读卡逻辑 */
  onDeviceRead?: (method: ReadCardMethod) => void | Promise<void>;
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

  /** 扫码 / 手动输入 read_no 后读卡并定位患者 */
  const readByScan = useCallback(
    async (readNo: string, method?: ReadCardMethod) => {
      const trimmed = readNo.trim();
      if (!trimmed) {
        messageRef.current.warning("请输入或扫描读卡号");
        return null;
      }

      const {
        autoInsert = true,
        autoUpdate = true,
        onPatientLoaded,
      } = optionsRef.current;

      const target =
        method ??
        methodsRef.current.find((m) => m.card_type === QRCODE_CARD_TYPE) ??
        methodsRef.current[0];

      if (!target?.reader_type || !target.card_type) {
        messageRef.current.warning("暂无可用的扫码读卡方式");
        return null;
      }

      setReading(true);
      try {
        const infoRes = await getReaderPatientInfoAPI({
          reader_type: target.reader_type,
          input_req: {
            read_info: {
              card_type: target.card_type,
              reader_type: target.reader_type,
              read_no: trimmed,
            },
            auto_insert: autoInsert,
            auto_update: autoUpdate,
          },
        });

        const patientId = infoRes.patient_id;
        if (!patientId) {
          messageRef.current.warning(infoRes.message || "未匹配到患者");
          return null;
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

  /**
   * 非扫码类读卡方式（医保码 / 医保卡等）点击入口。
   * 当前为占位，后续可通过 onDeviceRead 对接真实读卡器逻辑。
   */
  const readByDevice = useCallback(async (method: ReadCardMethod) => {
    const { onDeviceRead } = optionsRef.current;
    if (onDeviceRead) {
      await onDeviceRead(method);
      return;
    }
    messageRef.current.info(
      `「${method.card_name || method.card_type || "读卡"}」功能开发中`,
    );
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
