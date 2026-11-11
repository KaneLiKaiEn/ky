import { useDataThemeStyle } from "../../../theme";
import { useCallback } from "react";
import { App } from "antd";
import { useManagementSession } from "comm/management";
import Feedback from "../../components/Feedback";
import { errorText } from "comm/utils";
import type { ArgValueRow } from "../../types/source.d.ts";
import {
  linkValues,
  webUrl,
  type DataRow,
  type Link,
  type Values,
} from "./model";
import type { RequestRunner } from "./runtime";
import ReportView from "./components/ReportView";
import { linkedTarget, type PreviewTarget } from "./drill";
export type { PreviewTarget } from "./drill";
import "./style.scss";

type Argument = { arg_code: string; arg_type: string; arg_value: string };
export interface EmbeddedReportProps {
  reportId: number;
  argList?: Argument[];
  active?: boolean;
  className?: string;
  refreshKey?: number;
  autoRefresh?: boolean;
  requestRunner?: RequestRunner;
  depth?: number;
  onBusyChange?: (busy: boolean) => void;
  onNavigate?: (target: PreviewTarget) => void;
}
export default function EmbeddedReport({
  reportId,
  argList = [],
  className,
  refreshKey,
  autoRefresh,
  requestRunner,
  depth = 0,
  onBusyChange,
  onNavigate,
}: EmbeddedReportProps) {
  const style = useDataThemeStyle();
  const session = useManagementSession(true),
    { message } = App.useApp();
  const onLock = useCallback(
    (_key: string, busy: boolean) => onBusyChange?.(busy),
    [onBusyChange],
  );
  const onLink = useCallback(
    (link: Link, row: DataRow, values: Values, queried: ArgValueRow[] = []) => {
      try {
        const args = linkValues(link.la, row, values);
        if (link.ln === "WEB") {
          window.open(
            webUrl(link.lv || "", args, window.location.origin),
            "_blank",
            "noopener,noreferrer",
          );
          return;
        }
        if (!onNavigate) throw new Error("当前嵌入页面未接入钻取处理");
        onNavigate(linkedTarget(link, row, values, queried, argList, depth));
      } catch (err) {
        void message.error(errorText(err));
      }
    },
    [message, onNavigate, depth, argList],
  );
  const initial = Object.fromEntries(
    argList.map((arg) => [arg.arg_code, arg.arg_value]),
  );
  return (
    <div className={`rp-embedded ${className || ""}`} style={style}>
      {session.data ? (
        <ReportView
          key={`${session.data.sessionId}:${session.data.orgId}:${reportId}`}
          reportId={reportId}
          initial={initial}
          active
          instance={`embedded:${reportId}`}
          onLock={onLock}
          onLink={onLink}
          embedded
          previewOptions={{ refreshKey, autoRefresh, requestRunner, depth }}
        />
      ) : (
        <Feedback
          loading={session.loading}
          error={session.error}
          retry={() => void session.reload().catch(() => {})}
        />
      )}
    </div>
  );
}
