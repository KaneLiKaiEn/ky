import type { WorkspaceActions } from "../hooks/useWorkspaceActions";
import FavoriteDialog from "./FavoriteDialog";
import { PreviewDialogs } from "./EmbeddedPreview";
export default function WorkspaceDialogs({
  actions,
}: {
  actions: WorkspaceActions;
}) {
  return (
    <>
      {actions.favoriteId && (
        <FavoriteDialog
          key={actions.favoriteId}
          metricId={actions.favoriteId}
          close={() => actions.setFavoriteId(undefined)}
          saved={actions.saved}
        />
      )}
      <PreviewDialogs
        targets={actions.targets}
        setTargets={actions.setTargets}
      />
    </>
  );
}
