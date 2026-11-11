import type { DealerRow } from "@/types/pay";

export const DEAL_TYPE_ACTIVE = "QR_ACTIVE";
export const DEAL_TYPE_PASSIVE = "QR_PASSIVE";

export type QrDealMode = typeof DEAL_TYPE_ACTIVE | typeof DEAL_TYPE_PASSIVE;

export function parseDealerTags(dealerTag?: string): string[] {
  if (!dealerTag) return [];
  return dealerTag
    .split(/[,|;\s]+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

export function hasDealerTag(dealerTag: string | undefined, tag: string) {
  return parseDealerTags(dealerTag).includes(tag);
}

export function getAvailableQrModes(dealer?: DealerRow | null): QrDealMode[] {
  if (!dealer) return [];
  const modes: QrDealMode[] = [];
  if (hasDealerTag(dealer.dealer_tag, DEAL_TYPE_ACTIVE)) {
    modes.push(DEAL_TYPE_ACTIVE);
  }
  if (hasDealerTag(dealer.dealer_tag, DEAL_TYPE_PASSIVE)) {
    modes.push(DEAL_TYPE_PASSIVE);
  }
  return modes;
}

/** 默认扫码模式：优先 ACTIVE */
export function getDefaultQrMode(dealer?: DealerRow | null): QrDealMode | null {
  const modes = getAvailableQrModes(dealer);
  if (modes.includes(DEAL_TYPE_ACTIVE)) return DEAL_TYPE_ACTIVE;
  if (modes.includes(DEAL_TYPE_PASSIVE)) return DEAL_TYPE_PASSIVE;
  return null;
}

export function needsQrDialog(dealer?: DealerRow | null) {
  return getAvailableQrModes(dealer).length > 0;
}

/** 已支付：有 pay_time */
export function isPrepayPaid(row: { pay_time?: string } | null | undefined) {
  return Boolean(row?.pay_time?.trim());
}

/** 未支付完成的记录可删除 / 重新发起 */
export function canDeleteOrRestart(row: {
  pay_time?: string;
} | null | undefined) {
  if (!row) return false;
  return !isPrepayPaid(row);
}

/** 已支付且仍有可退余额时可退 */
export function canRefundRow(row: {
  pay_time?: string;
  prepay_amount?: string;
  refund_amount?: string;
} | null | undefined) {
  if (!isPrepayPaid(row)) return false;
  const amount = Number(row?.prepay_amount ?? 0);
  const refunded = Number(row?.refund_amount ?? 0);
  if (Number.isNaN(amount)) return false;
  return amount > 0 && refunded < amount;
}
