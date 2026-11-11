import { useEffect, useState } from "react";
import { getSessionInfo } from "@/api/auth";
import {
  getToEndOrderList,
  getToTerminateOrderList,
  getToVerifyOrderList,
} from "@/api/ordent";
import { getVisitProperty2 } from "@/api/visit";
import type { OrderListRes } from "@/types/ordent";
import { buildSseOrderUrl } from "@/utils/buildSseOrderUrl";
import FloatingPanel from "@/components/FloatingPanel";
import "./index.scss";

const ORDER_SSE_TOPICS = new Set([
  "ordent.commitorder",
  "ordent.stoporder",
  "ordent.cancelorder",
]);
const RETRY_DELAY = 3000;

type NoticeData = {
  results: PromiseSettledResult<OrderListRes>[];
  visitInfoByVisitId: Map<number, string>;
};

const LIST_ROWS = [
  { label: "待校对医嘱", tone: "verify", fetchList: getToVerifyOrderList },
  { label: "待停止医嘱", tone: "end", fetchList: getToEndOrderList },
  { label: "待终止医嘱", tone: "terminate", fetchList: getToTerminateOrderList },
] as const;

type PatientLine = {
  key: string;
  content: string;
  count: number;
};

/** 同一 visit_id 合并为一行；没有 visit_id 的医嘱各自单独显示 */
function buildPatientLines(
  rows: NonNullable<OrderListRes["row_list"]>,
  visitInfoByVisitId: ReadonlyMap<number, string>,
): PatientLine[] {
  const lines: PatientLine[] = [];
  const indexByVisitId = new Map<number, number>();

  rows.forEach((row, index) => {
    const visitId = Number(row.visit_id);
    if (Number.isFinite(visitId) && visitId > 0) {
      const existing = indexByVisitId.get(visitId);
      if (existing != null) {
        lines[existing].count += 1;
        return;
      }
      indexByVisitId.set(visitId, lines.length);
      lines.push({
        key: String(visitId),
        content: visitInfoByVisitId.get(visitId)?.trim() || "",
        count: 1,
      });
      return;
    }

    lines.push({
      key: `missing-${row.order_id ?? index}`,
      content: "",
      count: 1,
    });
  });

  return lines;
}

type OrderListSectionProps = {
  label: string;
  tone: (typeof LIST_ROWS)[number]["tone"];
  result: PromiseSettledResult<OrderListRes> | undefined;
  visitInfoByVisitId: ReadonlyMap<number, string>;
};

const OrderListSection = ({
  label,
  tone,
  result,
  visitInfoByVisitId,
}: OrderListSectionProps) => {
  const failed = result?.status !== "fulfilled";
  const rows = failed ? [] : (result.value.row_list ?? []);
  const lines = buildPatientLines(rows, visitInfoByVisitId);
  const canToggle = !failed && rows.length > 0;
  const [open, setOpen] = useState(true);

  return (
    <section className={`order-notice__section order-notice__section--${tone}`}>
      <button
        type="button"
        className={
          canToggle
            ? "order-notice__head"
            : "order-notice__head order-notice__head--static"
        }
        aria-expanded={canToggle ? open : undefined}
        onClick={() => {
          if (canToggle) setOpen((value) => !value);
        }}
      >
        <span className="order-notice__title">
          {canToggle ? (
            <i
              className={
                open
                  ? "bi bi-chevron-right order-notice__chevron is-open"
                  : "bi bi-chevron-right order-notice__chevron"
              }
              aria-hidden
            />
          ) : null}
          <span className="order-notice__label">{label}</span>
        </span>
        <span className="order-notice__count">{failed ? "-" : rows.length}</span>
      </button>
      {canToggle && open
        ? lines.map((line) => (
            <div key={line.key} className="order-notice__item">
              <span
                className={
                  line.content
                    ? undefined
                    : "order-notice__item-text order-notice__item-text--empty"
                }
              >
                {line.content || "-"}
              </span>
              <span className="order-notice__item-count">共{line.count}条</span>
            </div>
          ))
        : null}
    </section>
  );
};

type OrderNoticeProps = {
  sessionId: string;
};

/** 登录或切换科室后监听医嘱 SSE，收到消息时提示三类待处理医嘱 */
const OrderNotice = ({ sessionId }: OrderNoticeProps) => {
  const [notice, setNotice] = useState<NoticeData | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const url = buildSseOrderUrl(sessionId);
    if (!url) return;

    let source: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let closed = false;
    let requestSeq = 0;

    const cleanup = () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      if (source) {
        source.close();
        source = null;
      }
    };

    const showLists = async () => {
      const requestId = ++requestSeq;
      let wardId = 0;
      try {
        const sessionRes = await getSessionInfo({ session_id: sessionId });
        wardId = Number(
          sessionRes.session_info?.dept_id ?? sessionRes.access_info?.dept_id,
        );
      } catch {
        return;
      }
      if (closed || requestId !== requestSeq) return;
      if (!Number.isFinite(wardId) || wardId <= 0) return;

      const results = await Promise.allSettled(
        LIST_ROWS.map((row) => row.fetchList({ ward_id: wardId })),
      );
      if (closed || requestId !== requestSeq) return;

      const visitIds = [
        ...new Set(
          results.flatMap((result) =>
            result.status === "fulfilled"
              ? (result.value.row_list ?? [])
                  .map((row) => Number(row.visit_id))
                  .filter((id) => Number.isFinite(id) && id > 0)
              : [],
          ),
        ),
      ];
      const visitInfoByVisitId = new Map<number, string>();
      if (visitIds.length > 0) {
        try {
          const visitRes = await getVisitProperty2({
            visit_id_list: visitIds,
          });
          if (closed || requestId !== requestSeq) return;
          for (const visit of visitRes.visit_list ?? []) {
            const visitId = Number(visit.visit_id);
            const info = visit.visit_info?.trim() ?? "";
            if (Number.isFinite(visitId) && visitId > 0) {
              visitInfoByVisitId.set(visitId, info);
            }
          }
        } catch {
          // 就诊信息查不到时，各行显示 -
        }
      }
      if (closed || requestId !== requestSeq) return;

      setNotice({ results, visitInfoByVisitId });
      setVisible(true);
    };

    const connect = () => {
      if (closed || source) return;

      source = new EventSource(url);
      source.onmessage = (event) => {
        let topic = "";
        try {
          topic = String(
            (JSON.parse(String(event.data)) as { topic?: unknown }).topic ?? "",
          );
        } catch {
          return;
        }
        if (!ORDER_SSE_TOPICS.has(topic)) return;
        void showLists();
      };
      source.onerror = () => {
        cleanup();
        if (!closed) {
          reconnectTimer = setTimeout(connect, RETRY_DELAY);
        }
      };
    };

    connect();

    return () => {
      closed = true;
      cleanup();
    };
  }, [sessionId]);

  return (
    <FloatingPanel
      title="医嘱提醒"
      open={visible && notice != null}
      onClose={() => setVisible(false)}
    >
      {notice ? (
        <div className="order-notice__body">
          {LIST_ROWS.map((row, index) => (
            <OrderListSection
              key={row.label}
              label={row.label}
              tone={row.tone}
              result={notice.results[index]}
              visitInfoByVisitId={notice.visitInfoByVisitId}
            />
          ))}
        </div>
      ) : null}
    </FloatingPanel>
  );
};

export default OrderNotice;
