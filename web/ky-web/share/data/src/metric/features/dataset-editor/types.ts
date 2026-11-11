import type { useWorkspaceNavigation } from "comm/management";
import type { DatasetRow } from "../../types/dataset.d.ts";
import type { SourceRow } from "../../types/source.d.ts";
import type { CatalogRow } from "../../types/sys.d.ts";
export interface EditorContext {
  identity: string;
  isCurrent: () => boolean;
  dataset: DatasetRow;
  orgId: number;
  catalogs: CatalogRow[];
  sources: SourceRow[];
  guard: ReturnType<typeof useWorkspaceNavigation>;
  onSaved: (row?: DatasetRow) => void;
}
