import { useEffect, useMemo, useRef } from "react";
import { theme } from "antd";
import {
  previewDocument,
  type PreviewResult,
} from "../../component-preview/model";
import { runtimeScripts } from "../../component-preview/runtime";
import { positiveId } from "../model";
import type { ArgValueRow } from "../../../types/references.d.ts";
export interface BoardActions {
  cascade: (
    code: string,
    value: string,
    source: number,
    target?: number,
  ) => void;
  openBoard: (boardId: number, args?: ArgValueRow[]) => void;
  openTarget?: (target: import("../runtime").PreviewTarget) => void;
  openReport?: (reportId: number, args?: ArgValueRow[]) => void;
  setBusy?: (key: string, busy: boolean) => void;
  busy?: boolean;
  depth?: number;
}
export default function ChartFrame({
  result,
  title,
  actions,
  source = 0,
  libraries = true,
  fit = true,
}: {
  result: PreviewResult;
  title: string;
  actions?: BoardActions;
  source?: number;
  libraries?: boolean;
  fit?: boolean;
}) {
  const ref = useRef<HTMLIFrameElement>(null);
  const channel = useMemo(() => crypto.randomUUID(), [result]);
  const latest = useRef(actions);
  latest.current = actions;
  const { token } = theme.useToken();
  const doc = useMemo(
    () =>
      previewDocument(
        result,
        libraries ? runtimeScripts : [],
        token.colorError,
        {
          bridgeId: actions ? channel : undefined,
          fit,
          color: token.colorText,
        },
      ),
    [
      result,
      libraries,
      token.colorError,
      token.colorText,
      channel,
      !!actions,
      fit,
    ],
  );
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (
        event.source !== ref.current?.contentWindow ||
        event.data?.kind !== "board-preview" ||
        event.data.channel !== channel
      )
        return;
      const payload = event.data.payload;
      if (!payload || typeof payload !== "object") return;
      if (
        event.data.action === "cascade" &&
        typeof payload.argCode === "string" &&
        payload.argCode.length <= 256 &&
        ["string", "number", "boolean"].includes(typeof payload.argValue)
      ) {
        // The source identity comes from the frame, not a caller-controlled argument.
        latest.current?.cascade(
          payload.argCode,
          String(payload.argValue),
          source,
        );
      } else if (event.data.action === "board") {
        const boardId = positiveId(payload.boardId);
        if (!boardId) return;
        const args = Array.isArray(payload.args)
          ? payload.args
              .filter(
                (row: any) =>
                  row &&
                  typeof row.arg_code === "string" &&
                  ["string", "number", "boolean"].includes(
                    typeof row.arg_value,
                  ),
              )
              .map((row: any) => ({
                arg_code: row.arg_code,
                arg_type:
                  typeof row.arg_type === "string" ? row.arg_type : undefined,
                arg_value: String(row.arg_value),
              }))
          : undefined;
        latest.current?.openBoard(boardId, args);
      }
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [channel, source]);
  return (
    <iframe
      ref={ref}
      title={title}
      sandbox="allow-scripts"
      className="bp-frame"
      srcDoc={doc}
    />
  );
}
