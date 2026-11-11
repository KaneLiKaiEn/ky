import { useCallback, useEffect, useRef, useState } from "react";
import {
  Button,
  Spin,
  Space,
  Radio,
  Empty,
  Tag,
  Popconfirm,
  message,
  Tooltip,
} from "antd";
import dayjs from "dayjs";
import {
  EditOutlined,
  EllipsisOutlined,
  EyeOutlined,
  ReadOutlined,
} from "@ant-design/icons";
import { deleteEmr, getEmrProperty, undoCommitEmr } from "@/api/emr";
import { getCareList, newCare, saveCareProperty } from "@/api/care";
import { getDocNameProperty } from "@/api/doc";
import { getFormProperty } from "@/api/form";
import type { EmrRow } from "@/types/emr";
import EmrView from "../EmrView";
import type { EmrViewRef } from "../EmrView";
import EmrEdit from "../EmrEdit";
import type { EmrEditRef } from "../EmrEdit";
import EmrPreview from "../EmrPreview";
import type { RadioChangeEvent } from "antd";
import { getSessionInfo } from "@/api/auth";
import type { SessionRow } from "@/types/auth";
import { clearActiveId, getSessionId, setActiveId } from "comm/session";
import type { ElemValue } from "@/pages/CustomForm/components/DataElem/types";
import TemplateSaveModal from "./components/TemplateSaveModal";
import AssessCareExtra from "./components/AssessCareExtra";
import EmrStakeholderSign from "./components/EmrStakeholderSign";

export interface EmrContentProps {
  emr_id?: number;

  visit_id?: number;
  baby_id?: number;
  encounter_id?: number;
  form_id?: number;
  form_version?: number;
  form_values?: ElemValue[];

  link_name?: string;
  link_value?: number;
  link_data?: string;
  link_tag?: string;
  link_ext?: string;

  emr_time?: string;
  emr_title?: string;

  onSaved?: (emr_id: number) => void;
  onDeleted?: (emr_id: number) => void;
  onCommitted?: (emr_id: number) => void;
  onCommitCancelled?: (emr_id: number) => void;
  onPrinted?: (emr_id: number) => void;
}

const CARE_CONTENT_TAG = "[护理措施]";
const CARE_ORDER_TAG = "[执行医嘱]";
const CARE_LINK_NAME = "emr";
const DATETIME_FORMAT = "YYYY-MM-DD HH:mm:ss";

const hasSysTag = (sysTag: string | undefined, tag: string) =>
  (sysTag ?? "").includes(tag);

const EmrContent: React.FC<EmrContentProps> = ({
  emr_id,
  visit_id,
  baby_id,
  encounter_id,
  form_id,
  form_version,
  form_values,
  link_name,
  link_value,
  link_data,
  link_tag,
  link_ext,
  emr_time,
  emr_title,
  onSaved,
  onDeleted,
  onCommitted,
  onCommitCancelled,
  onPrinted,
}) => {
  const [emrProperty, setEmrProperty] = useState<EmrRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [saveCommitting, setSaveCommitting] = useState(false);
  const [undoing, setUndoing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [printLoading, setPrintLoading] = useState(false);
  const [savePrefabOpen, setSavePrefabOpen] = useState(false);
  const [browseType, setBrowseType] = useState<
    "edit" | "preview" | "view" | null
  >(null);
  const [showToolbar, setShowToolbar] = useState(true);
  const editRef = useRef<EmrEditRef>(null);
  const viewRef = useRef<EmrViewRef>(null);
  const [currentUser, setCurrentUser] = useState<SessionRow | null>(null);
  const [careId, setCareId] = useState<number>();
  const [careContent, setCareContent] = useState("");
  const [careOrder, setCareOrder] = useState("");
  const [draftSysTag, setDraftSysTag] = useState<string>();

  const effectiveSysTag = emr_id
    ? emrProperty?.sys_tag
    : (draftSysTag ?? emrProperty?.sys_tag);
  const showCareContent = hasSysTag(effectiveSysTag, CARE_CONTENT_TAG);
  const showCareOrder = hasSysTag(effectiveSysTag, CARE_ORDER_TAG);
  const showAssessCare = showCareContent || showCareOrder;
  const careReadOnly = browseType !== "edit";

  const resetCareState = useCallback(() => {
    setCareId(undefined);
    setCareContent("");
    setCareOrder("");
    setDraftSysTag(undefined);
  }, []);

  const loadProperty = useCallback(async () => {
    if (emr_id) {
      setLoading(true);
      try {
        const res = await getEmrProperty({ emr_id });
        if (res.code === 0 && res.emr_property) {
          setEmrProperty(res.emr_property);
          setBrowseType(
            res.emr_property.emr_status === "COMMIT" ? "view" : "edit",
          );
        } else {
          setEmrProperty(null);
        }
      } catch {
        setEmrProperty(null);
      } finally {
        setLoading(false);
      }
    } else {
      setEmrProperty({
        visit_id,
        baby_id,
        encounter_id,
        form_id,
        form_version,
        link_name,
        link_value,
        link_data,
        link_tag,
        link_ext,
        emr_time,
        emr_title,
        emr_status: "WRITE",
      });
      setBrowseType("edit");
    }
  }, [
    emr_id,
    visit_id,
    baby_id,
    encounter_id,
    form_id,
    form_version,
    link_name,
    link_value,
    link_data,
    link_tag,
    link_ext,
    emr_time,
    emr_title,
  ]);

  useEffect(() => {
    resetCareState();
    setEmrProperty(null);
    void loadProperty();
  }, [emr_id, loadProperty, resetCareState]);

  // useEffect(() => {
  //   if (!emrProperty?.emr_status) return;
  //   setShowToolbar(emrProperty.emr_status !== "COMMIT");
  // }, [emrProperty?.emr_status]);

  useEffect(() => {
    if (emr_id) return;

    const formId = emrProperty?.form_id ?? form_id;
    const formVersion = emrProperty?.form_version ?? form_version;
    if (!formId) {
      setDraftSysTag(undefined);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const sheetRes = await getFormProperty({
          form_id: formId,
          form_version: formVersion,
          column_sheet: "doc_type,doc_name",
        });
        if (cancelled) return;
        const { doc_type, doc_name } = sheetRes.sheet_property ?? {};
        if (!doc_type || !doc_name) {
          setDraftSysTag(undefined);
          return;
        }
        const docNameRes = await getDocNameProperty({ doc_type, doc_name });
        if (cancelled) return;
        setDraftSysTag(docNameRes.name_property?.sys_tag);
      } catch {
        if (!cancelled) setDraftSysTag(undefined);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    emr_id,
    emrProperty?.form_id,
    emrProperty?.form_version,
    form_id,
    form_version,
  ]);

  useEffect(() => {
    if (!showAssessCare) return;

    const targetEmrId = emrProperty?.emr_id ?? emr_id;
    const careType = emrProperty?.doc_type;
    if (!targetEmrId || !careType) return;

    let cancelled = false;
    void getCareList({
      visit_id: emrProperty?.visit_id,
      care_type: careType,
      link_name: CARE_LINK_NAME,
      link_value: targetEmrId,
    }).then((res) => {
      if (cancelled || res.code !== 0) return;
      const row = res.row_list?.[0];
      if (!row) return;
      setCareId(row.care_id);
      setCareContent(row.care_content ?? "");
      setCareOrder(row.care_order ?? "");
    });

    return () => {
      cancelled = true;
    };
  }, [
    emr_id,
    emrProperty?.doc_type,
    emrProperty?.emr_id,
    emrProperty?.visit_id,
    showAssessCare,
  ]);

  const upsertCare = useCallback(
    async (targetEmrId: number, property = emrProperty) => {
      if (!showAssessCare) return;

      let careType = property?.doc_type;
      if (!careType && (property?.form_id ?? form_id)) {
        const sheetRes = await getFormProperty({
          form_id: property?.form_id ?? form_id!,
          form_version: property?.form_version ?? form_version,
          column_sheet: "doc_type",
        });
        careType = sheetRes.sheet_property?.doc_type;
      }
      if (!careType) return;

      const nextContent = showCareContent ? careContent : "";
      const nextOrder = showCareOrder ? careOrder : "";
      const hasValue = Boolean(nextContent.trim() || nextOrder.trim());
      if (!careId && !hasValue) return;

      const careProperty = {
        care_type: careType,
        care_content: nextContent,
        care_order: nextOrder,
        link_name: CARE_LINK_NAME,
        link_value: targetEmrId,
        visit_id: property?.visit_id ?? visit_id,
        care_time: property?.emr_time ?? dayjs().format(DATETIME_FORMAT),
        user_id: currentUser?.user_id,
        user_name: currentUser?.user_name,
        health_level: "一般",
      };

      if (careId) {
        const res = await saveCareProperty({
          care_id: careId,
          care_property: careProperty,
        });
        if (res.code !== 0) {
          throw new Error(res.message || "护理记录保存失败");
        }
        return;
      }

      const res = await newCare(careProperty);
      if (res.code !== 0) {
        throw new Error(res.message || "护理记录创建失败");
      }
      if (res.care_id) {
        setCareId(res.care_id);
      }
    },
    [
      careContent,
      careId,
      careOrder,
      currentUser?.user_id,
      currentUser?.user_name,
      emrProperty,
      form_id,
      form_version,
      showAssessCare,
      showCareContent,
      showCareOrder,
      visit_id,
    ],
  );

  useEffect(() => {
    if (emr_id && emr_id > 0) {
      setActiveId({ key: "active_emr_id", value: String(emr_id) });
    }
  }, [emr_id]);

  useEffect(() => {
    const sessionId = getSessionId();
    if (!sessionId) return;
    void getSessionInfo({ session_id: sessionId }).then((res) => {
      if (res.code === 0) {
        setCurrentUser(res.session_info ?? null);
      }
    });
  }, []);

  const handleBrowseChange = async (e: RadioChangeEvent) => {
    const value = e.target.value;
    setBrowseType(value);
  };

  const applySavedProperty = async (savedId: number) => {
    const propertyRes = await getEmrProperty({ emr_id: savedId });
    const freshProperty = propertyRes.emr_property;
    if (freshProperty) {
      setEmrProperty(freshProperty);
      await upsertCare(savedId, freshProperty);
    }
    return freshProperty;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const savedId = await editRef.current?.save();
      if (savedId != null) {
        try {
          await applySavedProperty(savedId);
        } catch (error) {
          message.error(
            error instanceof Error ? error.message : "护理记录保存失败",
          );
          return;
        }
        onSaved?.(savedId);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCommit = async () => {
    setCommitting(true);
    try {
      const ok = await editRef.current?.commit();
      if (ok) {
        await loadProperty();
        onCommitted?.(emr_id!);
      }
    } finally {
      setCommitting(false);
    }
  };

  const handleSaveAndCommit = async () => {
    setSaveCommitting(true);
    try {
      const savedId = await editRef.current?.saveAndCommit();
      if (savedId != null) {
        try {
          const freshProperty = await applySavedProperty(savedId);
          if (freshProperty?.emr_status === "COMMIT") {
            setBrowseType("view");
          }
        } catch (error) {
          message.error(
            error instanceof Error ? error.message : "护理记录保存失败",
          );
          return;
        }
        onSaved?.(savedId);
        onCommitted?.(savedId);
      }
    } finally {
      setSaveCommitting(false);
    }
  };

  const handleUndoCommit = async () => {
    setUndoing(true);
    try {
      const res = await undoCommitEmr({ emr_id });
      if (res.code !== 0) {
        message.error(res.message || "取消提交失败");
        return;
      }
      message.success("已取消提交");
      await loadProperty();
      onCommitCancelled?.(emr_id!);
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "取消提交失败，请稍后重试",
      );
    } finally {
      setUndoing(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await deleteEmr({ emr_id: emr_id! });
      if (res.code !== 0) {
        message.error(res.message || "删除失败");
        return;
      }
      message.success("删除成功");
      clearActiveId("active_emr_id");
      await loadProperty();
      onDeleted?.(emr_id!);
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "删除失败，请稍后重试",
      );
    } finally {
      setDeleting(false);
    }
  };

  const handlePrint = async () => {
    setPrintLoading(true);
    try {
      const ok = await viewRef.current?.print();
      const printedId = emrProperty?.emr_id ?? emr_id;
      if (ok && printedId != null) {
        onPrinted?.(printedId);
      }
    } finally {
      setPrintLoading(false);
    }
  };

  const handlePrintPreview = () => {
    viewRef.current?.printPreview();
  };

  const handleStakeholderChanged = async () => {
    if (browseType === "view") {
      await viewRef.current?.reload();
    }
  };

  const hasEmrId = (emrProperty?.emr_id ?? emr_id ?? 0) > 0;
  const isProgressNote = emrProperty?.doc_type === "病程记录";
  const printDisabled = browseType !== "view" || !hasEmrId;
  const isCommitted = emrProperty?.emr_status === "COMMIT";
  const showStakeholderBar =
    browseType !== "preview" && !(isProgressNote && browseType === "view");

  return (
    <Spin
      spinning={loading}
      wrapperClassName="h-full min-h-0 [&_.ant-spin-container]:flex [&_.ant-spin-container]:h-full [&_.ant-spin-container]:min-h-0 [&_.ant-spin-container]:flex-col [&_.ant-spin-container]:overflow-hidden"
    >
      {emrProperty?.emr_status === "COMMIT" ||
      emrProperty?.emr_status === "WRITE" ? (
        <div className="flex h-full min-h-0 flex-col overflow-hidden">
          {showToolbar && (
            <div className="flex shrink-0 justify-between bg-(--app-theme-bg-container)">
              <Space className="p-2">
                <Tag color="blue">{emrProperty?.emr_id}</Tag>
                <Tag color="blue">{emrProperty?.user_name_list}</Tag>
                <Tag color="blue">{emrProperty?.emr_status}</Tag>
              </Space>
              <Space className="p-2">
                <Button
                  type="primary"
                  size="small"
                  loading={saving}
                  onClick={handleSave}
                  disabled={browseType !== "edit"}
                >
                  保存
                </Button>
                <Button
                  type="primary"
                  size="small"
                  loading={saveCommitting}
                  disabled={browseType !== "edit"}
                  onClick={handleSaveAndCommit}
                >
                  保存并提交
                </Button>
                {isCommitted ? (
                  <Button
                    size="small"
                    loading={undoing}
                    disabled={!hasEmrId}
                    onClick={handleUndoCommit}
                  >
                    取消提交
                  </Button>
                ) : (
                  <Button
                    size="small"
                    loading={committing}
                    disabled={!hasEmrId}
                    onClick={handleCommit}
                  >
                    提交
                  </Button>
                )}
                {!isProgressNote && (
                  <Space.Compact>
                    <Button
                      size="small"
                      loading={printLoading}
                      disabled={printDisabled}
                      onClick={handlePrint}
                    >
                      打印
                    </Button>
                    <Button
                      size="small"
                      disabled={printDisabled}
                      icon={<EllipsisOutlined />}
                      onClick={handlePrintPreview}
                    />
                  </Space.Compact>
                )}

                <Popconfirm
                  title="确认删除该病历？"
                  okText="删除"
                  cancelText="取消"
                  disabled={!hasEmrId}
                  okButtonProps={{ danger: true, loading: deleting }}
                  onConfirm={handleDelete}
                >
                  <Button
                    size="small"
                    danger
                    loading={deleting}
                    disabled={!hasEmrId}
                  >
                    删除
                  </Button>
                </Popconfirm>
                <Button
                  size="small"
                  disabled={!hasEmrId}
                  onClick={() => setSavePrefabOpen(true)}
                >
                  存为模板
                </Button>
                <Radio.Group
                  value={browseType}
                  onChange={handleBrowseChange}
                  size="small"
                >
                  <Radio.Button value="edit">
                    <Tooltip title="编辑">
                      <EditOutlined />
                    </Tooltip>
                  </Radio.Button>
                  <Radio.Button
                    disabled={!hasEmrId || isProgressNote}
                    value="preview"
                  >
                    <Tooltip title="预览">
                      <EyeOutlined />
                    </Tooltip>
                  </Radio.Button>
                  <Radio.Button disabled={!hasEmrId} value="view">
                    <Tooltip title="浏览">
                      <ReadOutlined />
                    </Tooltip>
                  </Radio.Button>
                </Radio.Group>
              </Space>
            </div>
          )}
          <div className="min-h-0 flex-1 overflow-auto">
            {browseType === "view" ? (
              <div className="h-full min-h-0">
                <EmrView
                  ref={viewRef}
                  emr_id={emr_id!}
                  showToolbar={showToolbar}
                  onToggleToolbar={() => setShowToolbar((v) => !v)}
                />
              </div>
            ) : browseType === "edit" ? (
              <EmrEdit
                encounter_id={emrProperty?.encounter_id ?? encounter_id}
                ref={editRef}
                emr_id={emr_id}
                visit_id={emrProperty?.visit_id}
                baby_id={emrProperty?.baby_id}
                form_id={emrProperty?.form_id}
                form_version={emrProperty?.form_version}
                form_values={form_values}
                link_name={emrProperty?.link_name}
                link_value={emrProperty?.link_value}
                link_data={emrProperty?.link_data}
                link_tag={emrProperty?.link_tag}
                link_ext={emrProperty?.link_ext}
                emr_time={emrProperty?.emr_time}
                emr_title={emrProperty?.emr_title}
              />
            ) : browseType === "preview" ? (
              <div className="h-full min-h-0">
                <EmrPreview emr_id={emr_id!} />
              </div>
            ) : (
              <Empty />
            )}
            {showAssessCare && (
              <AssessCareExtra
                showCareContent={showCareContent}
                showCareOrder={showCareOrder}
                careContent={careContent}
                careOrder={careOrder}
                onCareContentChange={setCareContent}
                onCareOrderChange={setCareOrder}
                readOnly={careReadOnly}
              />
            )}
          </div>
          {showStakeholderBar && (
            <EmrStakeholderSign
              emrId={emr_id}
              visitId={emrProperty?.visit_id ?? visit_id}
              emrStatus={emrProperty?.emr_status}
              className="shrink-0 px-2 py-1 border-t border-(--app-theme-primary) bg-(--app-theme-bg-container) text-(--app-theme-text) mt-2"
              onChanged={handleStakeholderChanged}
            />
          )}
        </div>
      ) : emrProperty?.emr_status === "CANCEL" ? (
        <div className="flex h-full min-h-0 items-center justify-center">
          <Empty description="病历已删除" />
        </div>
      ) : (
        <div className="flex h-full min-h-0 items-center justify-center">
          <Empty description="病历状态未知" />
        </div>
      )}
      <TemplateSaveModal
        open={savePrefabOpen}
        emrId={emrProperty?.emr_id ?? emr_id}
        defaultName={emrProperty?.emr_title || emrProperty?.doc_name}
        onCancel={() => setSavePrefabOpen(false)}
      />
    </Spin>
  );
};

export default EmrContent;
