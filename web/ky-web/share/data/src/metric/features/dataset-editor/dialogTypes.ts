import type { ReactNode } from "react";
import type { WorkspaceGuard } from "comm/management";
import type { DatasetRow } from "../../types/dataset.d.ts";

export interface DatasetEditorDialogProps {
  identity: string;
  sessionId: string;
  datasetId: number;
  orgId: number;
  guard: WorkspaceGuard;
  isCurrent: () => boolean;
  onSaved: (row: DatasetRow) => void;
  onClose: () => void;
  showTrans?: boolean;
  helpContent?: ReactNode;
}
