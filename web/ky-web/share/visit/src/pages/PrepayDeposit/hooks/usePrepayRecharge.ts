import { useCallback, useRef, useState } from "react";
import { App } from "antd";
import {
  getPrepayPropertyAPI,
  newPrepayAPI,
  startPrepayPayAPI,
} from "@/api/account";
import { getPayDealListAPI, getPayListAPI } from "@/api/pay";
import type { NewPrepayRes, StartPrepayPayRes } from "@/types/account";
import type { DealerRow, PayDealRow } from "@/types/pay";
import {
  DEAL_TYPE_ACTIVE,
  DEAL_TYPE_PASSIVE,
  type QrDealMode,
} from "../utils/dealerTag";
import { formatAmount } from "../utils/amount";
import { useSessionInfo } from "./useSessionInfo";

const POLL_INTERVAL_MS = 1500;
const POLL_TIMEOUT_MS = 120000;

export interface PrepayPayResult {
  prepayId: number;
  /** 本次充值金额，供打印收据大写金额 */
  amount: string;
  dealList: PayDealRow[];
}

async function fetchPayDealList(prepayId: number): Promise<PayDealRow[]> {
  const payRes = await getPayListAPI({
    link_name: "prepay",
    link_value: prepayId,
  });
  const payId = payRes.row_list?.[0]?.pay_id;
  if (!payId) return [];
  const dealRes = await getPayDealListAPI({
    pay_id: payId,
    column_list: "*",
  });
  return dealRes.row_list ?? [];
}

export interface RechargePayload {
  patientId: number;
  prepayType: string;
  amount: string;
  dealer: DealerRow;
  /** 重新发起时传入已有 prepay_id，跳过 NewPrepay */
  prepayId?: number;
}

export interface PayDialogState {
  open: boolean;
  prepayId?: number;
  amount: string;
  dealer: DealerRow | null;
  /** 当前扫码模式；空表示未进入扫码 */
  qrMode: QrDealMode | null;
  /** dealer_tag 原文，用于弹窗内切换 ACTIVE/PASSIVE */
  dealerTag: string;
  qrImage?: string;
  submitting: boolean;
}

const EMPTY_DIALOG: PayDialogState = {
  open: false,
  amount: "0.00",
  dealer: null,
  qrMode: null,
  dealerTag: "",
  submitting: false,
};

function tagHas(tag: string, key: string) {
  return tag.indexOf(key) >= 0;
}

function buildQrSrc(res: StartPrepayPayRes) {
  if (!res.image_content) return undefined;
  if (res.image_content.startsWith("data:")) return res.image_content;
  const fmt = (res.image_format || "png").toLowerCase();
  return `data:image/${fmt};base64,${res.image_content}`;
}

async function waitUntilPaid(prepayId: number, signal?: AbortSignal) {
  const started = Date.now();
  while (Date.now() - started < POLL_TIMEOUT_MS) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    const res = await getPrepayPropertyAPI({
      prepay_id: prepayId,
      column_list: "*",
    });
    if (res.prepay_property?.pay_time) {
      return res.prepay_property;
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  throw new Error("支付超时，请稍后在流水中确认");
}

export function usePrepayRecharge(
  onSuccess?: (result: PrepayPayResult) => void | Promise<void>,
) {
  const { message } = App.useApp();
  const { session, orgId } = useSessionInfo();
  const [paying, setPaying] = useState(false);
  const [dialog, setDialog] = useState<PayDialogState>(EMPTY_DIALOG);
  const [payResult, setPayResult] = useState<PrepayPayResult | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const closeDialog = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setDialog(EMPTY_DIALOG);
  }, []);

  /** 统一轮询 GetPrepayProperty，直到 pay_time 有值 */
  const startPollPaid = useCallback(
    async (prepayId: number, amount: string) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      await waitUntilPaid(prepayId, controller.signal);
      message.success("支付成功");
      closeDialog();

      let dealList: PayDealRow[] = [];
      try {
        dealList = await fetchPayDealList(prepayId);
      } catch {
        message.warning("支付成功，但交易明细获取失败");
      }
      const result: PrepayPayResult = {
        prepayId,
        amount: formatAmount(amount),
        dealList,
      };
      setPayResult(result);
      await onSuccess?.(result);
    },
    [closeDialog, message, onSuccess],
  );

  /** StartPrepayPay + 展示二维码 + 轮询 */
  const startPassivePay = useCallback(
    async (prepayId: number, dealer: DealerRow, amount: string) => {
      setDialog((prev) => ({ ...prev, submitting: true, qrImage: undefined }));
      try {
        const res = await startPrepayPayAPI({
          prepay_id: prepayId,
          pay_type: dealer.pay_type,
          pay_name: dealer.pay_name,
          deal_type: DEAL_TYPE_PASSIVE,
          deal_code: "",
        });
        setDialog((prev) => ({
          ...prev,
          qrImage: buildQrSrc(res),
          submitting: false,
        }));
        await startPollPaid(prepayId, amount);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        message.error(err instanceof Error ? err.message : "生成二维码失败");
        setDialog((prev) => ({ ...prev, submitting: false }));
      }
    },
    [message, startPollPaid],
  );

  const openPopup = useCallback(
    (prepayId: number, amount: string, dealer: DealerRow, qrMode: QrDealMode) => {
      setDialog({
        open: true,
        prepayId,
        amount: formatAmount(amount),
        dealer,
        qrMode,
        dealerTag: dealer.dealer_tag ?? "",
        qrImage: undefined,
        submitting: false,
      });
    },
    [],
  );

  /** 主动扫码：扫码枪读到付款码后发起 */
  const submitActiveCode = useCallback(
    async (dealCode: string) => {
      if (!dialog.prepayId || !dialog.dealer) return;
      const code = dealCode.trim();
      if (!code) {
        message.warning("请扫描付款码");
        return;
      }
      setDialog((prev) => ({ ...prev, submitting: true }));
      try {
        await startPrepayPayAPI({
          prepay_id: dialog.prepayId,
          pay_type: dialog.dealer.pay_type,
          pay_name: dialog.dealer.pay_name,
          deal_type: DEAL_TYPE_ACTIVE,
          deal_code: code,
        });
        await startPollPaid(dialog.prepayId, dialog.amount);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        message.error(err instanceof Error ? err.message : "支付失败");
        setDialog((prev) => ({ ...prev, submitting: false }));
      }
    },
    [dialog.amount, dialog.dealer, dialog.prepayId, message, startPollPaid],
  );

  /** 弹窗内切换出示付款码 / 扫码付款 */
  const switchQrMode = useCallback(
    async (mode: QrDealMode) => {
      if (!dialog.prepayId || !dialog.dealer || mode === dialog.qrMode) return;
      abortRef.current?.abort();
      setDialog((prev) => ({
        ...prev,
        qrMode: mode,
        qrImage: undefined,
        submitting: false,
      }));
      if (mode === DEAL_TYPE_PASSIVE) {
        await startPassivePay(dialog.prepayId, dialog.dealer, dialog.amount);
      }
    },
    [
      dialog.amount,
      dialog.dealer,
      dialog.prepayId,
      dialog.qrMode,
      startPassivePay,
    ],
  );

  const createOrReusePrepay = useCallback(
    async (payload: RechargePayload): Promise<number> => {
      if (payload.prepayId) return payload.prepayId;
      if (!orgId) throw new Error("缺少机构信息");

      const res: NewPrepayRes = await newPrepayAPI({
        org_id: orgId,
        patient_id: payload.patientId,
        prepay_type: payload.prepayType,
        prepay_amount: formatAmount(payload.amount),
        pay_type: payload.dealer.pay_type,
        pay_name: payload.dealer.pay_name,
        pay_user_id: session?.user_id,
        pay_user_name: session?.user_name,
      });
      if (!res.prepay_id) throw new Error(res.message || "创建预交金失败");
      return res.prepay_id;
    },
    [orgId, session?.user_id, session?.user_name],
  );

  /**
   * 点击支付方式后调用。分支对齐门诊旧逻辑：
   * 1) 仅 QR_PASSIVE → StartPrepayPay 取码 → 弹窗展示 → 轮询
   * 2) 含 QR_ACTIVE → 弹窗等扫码枪，扫到再 StartPrepayPay
   * 3) 含 QR_PASSIVE（且上面未 return）→ 弹窗 + 取码
   * 4) 都没有 → StartPrepayPay(deal_type='') 现金等
   */
  const startRecharge = useCallback(
    async (payload: RechargePayload) => {
      const amountNum = Number(payload.amount);
      if (!payload.patientId) {
        message.warning("缺少患者信息");
        return false;
      }
      if (!amountNum || amountNum <= 0) {
        message.warning("请输入正确的充值金额");
        return false;
      }
      if (!payload.dealer?.pay_type) {
        message.warning("请选择支付方式");
        return false;
      }

      setPaying(true);
      setPayResult(null);
      const amount = formatAmount(payload.amount);
      try {
        const prepayId = await createOrReusePrepay(payload);
        const tag = payload.dealer.dealer_tag ?? "";
        const hasActive = tagHas(tag, DEAL_TYPE_ACTIVE);
        const hasPassive = tagHas(tag, DEAL_TYPE_PASSIVE);

        // 仅被动扫码：先取二维码，再开弹窗轮询
        if (!hasActive && hasPassive) {
          openPopup(prepayId, amount, payload.dealer, DEAL_TYPE_PASSIVE);
          // 不阻塞 paying：弹窗内继续
          void startPassivePay(prepayId, payload.dealer, amount);
          return false;
        }

        // 主动扫码（含 ACTIVE+PASSIVE 时默认出示付款码）
        if (hasActive) {
          openPopup(prepayId, amount, payload.dealer, DEAL_TYPE_ACTIVE);
          return false;
        }

        // 被动扫码
        if (hasPassive) {
          openPopup(prepayId, amount, payload.dealer, DEAL_TYPE_PASSIVE);
          void startPassivePay(prepayId, payload.dealer, amount);
          return false;
        }

        // 现金 / POS 等：StartPrepayPay 后统一轮询 pay_time
        await startPrepayPayAPI({
          prepay_id: prepayId,
          pay_type: payload.dealer.pay_type,
          pay_name: payload.dealer.pay_name,
          deal_type: "",
        });
        await startPollPaid(prepayId, amount);
        return true;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return false;
        }
        message.error(err instanceof Error ? err.message : "发起支付失败");
        return false;
      } finally {
        setPaying(false);
      }
    },
    [
      createOrReusePrepay,
      message,
      openPopup,
      startPassivePay,
      startPollPaid,
    ],
  );

  return {
    paying,
    dialog,
    payResult,
    closeDialog,
    startRecharge,
    submitActiveCode,
    switchQrMode,
  };
}
