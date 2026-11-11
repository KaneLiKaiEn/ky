import EmrContent from "../../EmrContent";
import type { EmrLinkFields } from "../types";
import type { EmrCreateDraft } from "../utils/emrCreateDraft";

type EmrContentAreaProps = {
  visitId: number;
  babyId?: number | null;
  encounterId?: number | null;
  emrId?: number;
  draft?: EmrCreateDraft | null;
  draftTitle?: string;
  link?: EmrLinkFields;
  onRefresh: () => void;
  onDraftSaved: (emrId: number) => void;
  clearDraft: () => void;
  onPrinted?: (emrId: number) => void;
};

/** 已有病历 / 草稿 / 回调的统一 EmrContent 封装 */
const EmrContentArea = ({
  visitId,
  babyId,
  encounterId,
  emrId,
  draft,
  draftTitle,
  link,
  onRefresh,
  onDraftSaved,
  clearDraft,
  onPrinted,
}: EmrContentAreaProps) => {
  if (emrId != null) {
    return (
      <EmrContent
        key={emrId}
        emr_id={emrId}
        baby_id={babyId ?? undefined}
        encounter_id={encounterId ?? undefined}
        onSaved={onRefresh}
        onCommitted={onRefresh}
        onCommitCancelled={onRefresh}
        onDeleted={onRefresh}
        onPrinted={onPrinted}
      />
    );
  }

  if (draft != null) {
    return (
      <EmrContent
        key={`draft-${draft.key}`}
        visit_id={visitId}
        baby_id={babyId ?? undefined}
        encounter_id={encounterId ?? undefined}
        form_id={draft.form_id}
        form_version={draft.form_version}
        form_values={draft.form_values}
        emr_title={draftTitle ?? draft.emr_title}
        link_name={link?.link_name}
        link_value={link?.link_value}
        link_data={link?.link_data}
        link_tag={link?.link_tag}
        link_ext={link?.link_ext}
        onSaved={onDraftSaved}
        onCommitted={onDraftSaved}
        onCommitCancelled={onDraftSaved}
        onDeleted={() => {
          clearDraft();
          onRefresh();
        }}
        onPrinted={onPrinted}
      />
    );
  }

  return null;
};

export default EmrContentArea;
