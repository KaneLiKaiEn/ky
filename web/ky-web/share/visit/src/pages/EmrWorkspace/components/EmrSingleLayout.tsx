import { Empty, Spin } from "antd";
import { useEmrDocument } from "../hooks/useEmrDocument";
import { useEmrCreateFlow } from "../hooks/useEmrCreateFlow";
import { PROGRESS_NOTE_DOC_TYPE, type EmrSingleWorkspaceProps } from "../types";
import EmrContentArea from "./EmrContentArea";
import EmrCreateModal from "./EmrCreateModal";
import EmrEmptyCreate from "./EmrEmptyCreate";

/**
 * doc_name 级别：无记录时空态 + 新建弹窗选表单/模板，保存时才创建。
 */
const EmrSingleLayout = ({
  visit,
  listFilter,
  docType,
  docName,
  workType,
  createModal,
  draftLink,
  showNoRecordHint,
  guard,
  emptyVisitDescription = "请先选择住院患者",
  className,
  onPrinted,
}: EmrSingleWorkspaceProps) => {
  const { visitId, emr, hasEmr, loading, handleRefresh } = useEmrDocument({
    visit,
    listFilter,
    mode: "radio",
  });

  const {
    createOpen,
    openCreate,
    closeCreate,
    draftLoading,
    draft,
    clearDraft,
    handleConfirm,
  } = useEmrCreateFlow();

  const refreshContent = () => {
    void handleRefresh();
  };

  const modalDocType = createModal?.docType ?? docType;
  const modalDocName = createModal?.docName ?? docName;

  const content =
    guard != null ? (
      guard
    ) : visitId == null ? (
      <div className="flex h-full items-center justify-center">
        <Empty description={emptyVisitDescription} />
      </div>
    ) : loading ? (
      <div className="flex h-full items-center justify-center">
        <Spin />
      </div>
    ) : emr?.emr_id != null || draft != null ? (
      <EmrContentArea
        visitId={visitId}
        babyId={visit.babyId}
        encounterId={visit.encounterId}
        emrId={emr?.emr_id}
        draft={draft}
        link={draftLink}
        onRefresh={refreshContent}
        onDraftSaved={() => {
          clearDraft();
          refreshContent();
        }}
        clearDraft={clearDraft}
        onPrinted={onPrinted}
      />
    ) : (
      <EmrEmptyCreate
        disabled={!docType || !docName || visitId == null}
        onCreate={openCreate}
      />
    );

  return (
    <div className={["flex h-full min-h-0 flex-col p-2", className].filter(Boolean).join(" ")}>
      {showNoRecordHint && !hasEmr && !loading && draft == null && guard == null ? (
        <div className="mb-2 shrink-0 border-b border-(--app-theme-border) pb-2 text-(length:--app-theme-font-sm) text-(--app-theme-error)">
          没有记录
        </div>
      ) : null}

      {/* 这里不能加 overflow-xxx 和 min-h-0 ， 不然内部是 病程记录(以表格的形式展示) 的话内容会被截断 */}
      {/* 注意：这边如果是病程记录类型的话，div 不要加 h-full、min-h-0、overflow-hidden 等属性，不然内容太多会被截断 */}
      {/* <div className="min-h-0 flex-1 overflow-hidden">{content}</div> */}
      {/* 注意：病程记录 的病历 提交后不能加 任何类名(只能下面这个div的父级加上 overflow-auto 类名)，但是未提交前需要加 overflow-auto 来保证内容超出时可以滚动而不是被截断 */}
      <div className={`${docType === PROGRESS_NOTE_DOC_TYPE ? emr?.emr_status === "COMMIT" ? "" : "overflow-auto" : "h-full overflow-auto"}`}>{content}</div>

      <EmrCreateModal
        open={createOpen}
        confirmLoading={draftLoading}
        visit={visit}
        workType={workType}
        docType={modalDocType}
        docName={modalDocName}
        docTag={createModal?.docTag}
        onlyLink={createModal?.onlyLink}
        excludeLink={createModal?.excludeLink}
        onCancel={closeCreate}
        onConfirm={handleConfirm}
      />
    </div>
  );
};

export default EmrSingleLayout;
