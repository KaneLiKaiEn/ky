import { App, message } from "antd";
import { getSessionId } from "comm/session";
import { loadSessionInfo } from "../hooks/useSessionInfo";
import { print, printPreview } from "@/pages/PrintList";
import { amountToChineseUpper, formatAmount } from "./amount";

export type PrepayPrintScene = "recharge" | "refund";

export interface PrepayPrintItem {
  prepayId: number;
  /** 该条金额（元），用于生成 link_value 大写 */
  amount?: string | number | null;
}

const PRINT_COPY: Record<
  PrepayPrintScene,
  { title: string; content: string }
> = {
  recharge: {
    title: "打印收据",
    content: "充值成功，是否打印收据？",
  },
  refund: {
    title: "打印收据",
    content: "退款成功，是否打印收据？",
  },
};

function normalizePrintItems(items: PrepayPrintItem[]): PrepayPrintItem[] {
  const seen = new Set<number>();
  const result: PrepayPrintItem[] = [];
  for (const item of items) {
    const id = item.prepayId;
    if (!Number.isFinite(id) || id <= 0 || seen.has(id)) continue;
    seen.add(id);
    result.push(item);
  }
  return result;
}

/** 预交金收据 PDF：给 print / printPreview 使用（不要带 /api/ 前缀） */
export async function buildPrepayReceiptUrl(
  prepayId: number,
  amount?: string | number | null,
): Promise<string | null> {
  if (!prepayId) return null;
  const sessionId = getSessionId();
  if (!sessionId) return null;
  const session = await loadSessionInfo();
  const deptId = session?.dept_id;
  if (deptId == null) return null;

  const linkValue =
    amount != null && amount !== ""
      ? amountToChineseUpper(amount)
      : "";
  const linkValueQuery = linkValue
    ? `&link_data=${encodeURIComponent(linkValue)}`
    : "";

  return (
    `doc/work2/${sessionId}` +
    `?dept_id=${deptId}` +
    `&doc_type=工作文档&doc_name=预交金收据&doc_tag=预交金收据` +
    `&link_value=${prepayId}${linkValueQuery}&rebuild=1&auto_create=1`
  );
}

export async function previewPrepayReceipt(
  prepayId: number,
  amount?: string | number | null,
) {
  const url = await buildPrepayReceiptUrl(prepayId, amount);
  if (!url) {
    message.warning("请先登录");
    return;
  }
  await printPreview(url);
}

/** 静默打印，本机 7890 失败时回退为浏览器打印预览 */
export async function printPrepayReceipt(
  prepayId: number,
  amount?: string | number | null,
) {
  const url = await buildPrepayReceiptUrl(prepayId, amount);
  if (!url) {
    message.warning("请先登录");
    return;
  }
  try {
    await print(url);
  } catch {
    try {
      await printPreview(url);
    } catch {
      // print / printPreview 内部已提示
    }
  }
}

export async function printPrepayReceipts(items: PrepayPrintItem[]) {
  const printItems = normalizePrintItems(items);
  if (printItems.length === 0) {
    message.warning("缺少收据信息");
    return;
  }
  for (const item of printItems) {
    await printPrepayReceipt(item.prepayId, item.amount);
  }
}

type AppModal = ReturnType<(typeof App)["useApp"]>["modal"];

/** 充值/退款成功后确认是否打印；无有效 id 则不弹 */
export function confirmPrintPrepay(
  modal: AppModal,
  items: PrepayPrintItem[],
  scene: PrepayPrintScene,
) {
  const printItems = normalizePrintItems(items);
  if (printItems.length === 0) return;
  const copy = PRINT_COPY[scene];
  modal.confirm({
    title: copy.title,
    content: copy.content,
    okText: "打印",
    cancelText: "暂不打印",
    onOk: () => printPrepayReceipts(printItems),
  });
}

/** 多个 prepay_id 共用同一金额时构造打印项 */
export function buildPrintItemsWithAmount(
  ids: number[],
  amount?: string | number | null,
): PrepayPrintItem[] {
  const formatted =
    amount != null && amount !== "" ? formatAmount(amount) : undefined;
  return ids.map((prepayId) => ({ prepayId, amount: formatted }));
}
