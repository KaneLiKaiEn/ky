import { useEffect, useState } from "react";
import { Empty, Radio, Spin } from "antd";
import { useEmrDocument } from "../hooks/useEmrDocument";
import { useEmrCreateFlow } from "../hooks/useEmrCreateFlow";
import { PROGRESS_NOTE_DOC_TYPE, type EmrRadioWorkspaceProps } from "../types";
import EmrContentArea from "./EmrContentArea";
import EmrCreateModal from "./EmrCreateModal";
import EmrEmptyCreate from "./EmrEmptyCreate";

/**
 * doc_type 单选：上下布局。
 * 有记录则锁定 Radio 到 emr.doc_name；无记录时展示空态 + 新建。
 */
const EmrRadioLayout = ({
  visit,
  listFilter,
  docType,
  names,
  workType,
  createModal,
  draftLink,
  resetKey,
  showNoRecordHint = true,
  emptyVisitDescription = "请先选择住院患者",
  className,
  onPrinted,
}: EmrRadioWorkspaceProps) => {
  const showRadio = names.length > 1;
  const [selectedName, setSelectedName] = useState(names[0]?.doc_name);

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

  useEffect(() => {
    if (emr?.doc_name) {
      setSelectedName(emr.doc_name);
      return;
    }
    setSelectedName((prev) =>
      prev && names.some((name) => name.doc_name === prev)
        ? prev
        : names[0]?.doc_name,
    );
  }, [emr?.doc_name, names]);

  useEffect(() => {
    clearDraft();
  }, [clearDraft, resetKey]);

  const refreshContent = () => {
    void handleRefresh();
  };

  const handleSelectName = (next: string) => {
    if (hasEmr) return;
    if (next !== selectedName) clearDraft();
    setSelectedName(next);
  };

  const modalDocType = createModal?.docType ?? docType;
  const modalDocName = createModal?.docName ?? selectedName;

  const content =
    visitId == null ? (
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
        disabled={!docType || !selectedName || visitId == null}
        onCreate={openCreate}
      />
    );

  return (
    <div className={["flex h-full min-h-0 flex-col p-2", className].filter(Boolean).join(" ")}>
      {showRadio ? (
        <div className="mb-2 flex shrink-0 items-center justify-between gap-2 border-b border-(--app-theme-border) pb-2">
          <Radio.Group
            size="small"
            value={selectedName}
            disabled={hasEmr}
            onChange={(e) => handleSelectName(e.target.value as string)}
          >
            {names.map((name) => (
              <Radio key={name.doc_name} value={name.doc_name}>
                {name.label}
              </Radio>
            ))}
          </Radio.Group>
          {showNoRecordHint && !hasEmr && !loading && draft == null ? (
            <span className="shrink-0 text-(length:--app-theme-font-sm) text-(--app-theme-error)">
              没有记录
            </span>
          ) : null}
        </div>
      ) : (
        showNoRecordHint &&
        !hasEmr &&
        !loading &&
        draft == null && (
          <div className="mb-2 shrink-0 border-b border-(--app-theme-border) pb-2 text-(length:--app-theme-font-sm) text-(--app-theme-error)">
            没有记录
          </div>
        )
      )}

      {/* 注意：这边如果是病程记录类型的话，div 不要加 h-full、min-h-0、overflow-hidden 等属性，不然内容太多会被截断 */}
      {/* 注意：由于 radio 单选类型上方会占据一点高度，所以需要 overflow-auto 来保证内容超出时外层不出现滚动条 */}
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

export default EmrRadioLayout;
