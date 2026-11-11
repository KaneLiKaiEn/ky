import { useCallback, useMemo, useState } from "react";
import ManagementSessionBoundary from "../../components/ManagementSessionBoundary/index";
import { useManagementStyle } from "../../hooks/useManagementStyle";
import {
  createLoadQueue,
  type RequestRunner,
  type PreviewTarget,
} from "./runtime";
import BoardView from "./components/BoardView";
import "./style.scss";

export interface EmbeddedBoardProps {
  boardId: number;
  argList?: { arg_code: string; arg_type: string; arg_value: string }[];
  active?: boolean;
  className?: string;
  refreshKey?: number;
  autoRefresh?: boolean;
  requestRunner?: RequestRunner;
  depth?: number;
  onBusyChange?: (busy: boolean) => void;
  onNavigate?: (target: PreviewTarget) => void;
}
export default function EmbeddedBoard({
  boardId,
  argList = [],
  className,
  refreshKey,
  autoRefresh,
  requestRunner,
  depth,
  onBusyChange,
  onNavigate,
}: EmbeddedBoardProps) {
  const [localQueue] = useState(() => createLoadQueue(2));
  const queue = useMemo(
    () => (requestRunner ? { run: requestRunner } : localQueue),
    [requestRunner, localQueue],
  );
  const busyChanged = useCallback(
    (value: boolean) => onBusyChange?.(value),
    [onBusyChange],
  );
  const style = useManagementStyle();
  return (
    <div className={`bp-embedded ${className || ""}`} style={style}>
      <ManagementSessionBoundary scope="embedded-board">
        {(session) => (
          <BoardView
            key={`${session.sessionId}:${session.orgId}:${boardId}`}
            boardId={boardId}
            queue={queue}
            inherited={argList}
            showLinks={false}
            embedded
            refreshKey={refreshKey}
            autoRefresh={autoRefresh}
            depth={depth}
            onBusyChange={busyChanged}
            onNavigate={onNavigate}
          />
        )}
      </ManagementSessionBoundary>
    </div>
  );
}
