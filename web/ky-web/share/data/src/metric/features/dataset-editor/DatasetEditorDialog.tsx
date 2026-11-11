import { useDataThemeStyle } from "../../../theme";
import { useEffect, useRef, useState } from "react";
import { Button, Modal, Space } from "antd";
import { getDatasetProperty } from "../../api/dataset";
import { getCatalogList } from "../../api/sys";
import { getSourceList } from "../../api/source";
import { useResource } from "comm/resource";
import { id } from "comm/utils";
import { Feedback } from "../../components/ManagementEditor/index";
import PropertyPanel from "./components/PropertyPanel";
import ArgumentsPanel from "./components/ArgumentsPanel";
import SubsetsPanel from "./components/SubsetsPanel";
import TransPanel from "./components/TransPanel";
import TestDialog from "./components/TestDialog";
import type { EditorContext } from "./types";
import type { DatasetEditorDialogProps } from "./dialogTypes";
import "./style.scss";

export default function DatasetEditorDialog({
  identity,
  sessionId,
  datasetId,
  orgId,
  guard,
  isCurrent: hostIsCurrent,
  onSaved,
  onClose,
  showTrans = true,
  helpContent,
}: DatasetEditorDialogProps) {
  const themeStyle = useDataThemeStyle();
  const [panel, setPanel] = useState("property"),
    [subsetId, setSubsetId] = useState<number | null>(null),
    [testing, setTesting] = useState(false),
    [savedName, setSavedName] = useState<string>();
  const mounted = useRef(true),
    latest = useRef(identity);
  latest.current = identity;
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const isCurrent = () =>
    mounted.current && latest.current === identity && hostIsCurrent();
  const detail = useResource(`embedded-dataset:${identity}`, async () => {
    const row = (
      await getDatasetProperty({ dataset_id: datasetId, column_list: "*" })
    ).dataset_property;
    if (id(row?.dataset_id) !== datasetId)
      throw new Error("未取得有效的数据集属性");
    return row!;
  });
  const owner = id(detail.data?.org_id) || orgId;
  const catalogs = useResource(
    detail.data ? `embedded-catalogs:${sessionId}:${owner}` : null,
    async () =>
      (
        await getCatalogList({
          org_id: owner,
          catalog_type: "dataset",
          parent_id: 0,
          include_descendant: true,
          column_list: "*",
        })
      ).catalog_list ?? [],
  );
  const sources = useResource(
    detail.data ? `embedded-sources:${sessionId}:${owner}` : null,
    async () =>
      (
        await getSourceList({
          org_id: owner,
          column_list: "source_id,source_name",
        })
      ).row_list ?? [],
  );
  const editor: EditorContext | undefined =
    detail.data && catalogs.data && sources.data
      ? {
          identity,
          isCurrent,
          dataset: detail.data,
          orgId: owner,
          catalogs: [
            { catalog_id: 0, catalog_name: "未分类" },
            ...catalogs.data,
          ],
          sources: sources.data,
          guard,
          onSaved: (row) => {
            if (!isCurrent() || !row) return;
            setSavedName(row.dataset_name);
            onSaved(row);
          },
        }
      : undefined;
  const close = async () => {
    if ((await guard.allow()) && isCurrent()) onClose();
  };
  return (
    <Modal
      open
      width={1100}
      className="de-dialog"
      title={`编辑数据集 · ${savedName || detail.data?.dataset_name || `#${datasetId}`}`}
      onCancel={() => void close()}
      destroyOnHidden
      closable={!guard.busy}
      mask={{ closable: !guard.busy }}
      footer={
        <Space>
          <Button
            disabled={!editor || guard.busy}
            onClick={async () => {
              if ((await guard.ensureSaved()) && isCurrent()) setTesting(true);
            }}
          >
            测试{subsetId && panel === "subsets" ? "子集" : "数据集"}
          </Button>
          <Button disabled={guard.busy} onClick={() => void close()}>
            关闭
          </Button>
        </Space>
      }
      style={themeStyle}
    >
      <div className="de-editor de-embedded-editor">
        <Feedback
          loading={detail.loading || catalogs.loading || sources.loading}
          error={detail.error || catalogs.error || sources.error}
          retry={() => {
            void detail.reload().catch(() => {});
            void catalogs.reload().catch(() => {});
            void sources.reload().catch(() => {});
          }}
        />
        {editor && (
          <>
            <div
              className="de-navigation"
              role="tablist"
              aria-label="数据集编辑导航"
            >
              {[
                { key: "property", label: "属性" },
                { key: "args", label: "参数" },
                { key: "subsets", label: "子集" },
                ...(showTrans ? [{ key: "trans", label: "Trans" }] : []),
                ...(helpContent ? [{ key: "help", label: "说明" }] : []),
              ].map((item) => (
                <button
                  key={item.key}
                  role="tab"
                  aria-selected={panel === item.key}
                  className={panel === item.key ? "active" : ""}
                  disabled={guard.busy}
                  onClick={async () => {
                    if ((await guard.allow()) && isCurrent()) {
                      setPanel(item.key);
                      setSubsetId(null);
                    }
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div key={panel}>
              {panel === "property" ? (
                <PropertyPanel context={editor} />
              ) : panel === "args" ? (
                <ArgumentsPanel context={editor} />
              ) : panel === "trans" ? (
                <TransPanel context={editor} />
              ) : panel === "help" ? (
                helpContent
              ) : (
                <SubsetsPanel
                  context={editor}
                  subsetId={subsetId}
                  onSelect={async (next) => {
                    if ((await guard.allow()) && isCurrent()) setSubsetId(next);
                  }}
                />
              )}
            </div>
            {testing && (
              <TestDialog
                context={editor}
                subsetId={panel === "subsets" ? subsetId : null}
                onClose={() => setTesting(false)}
              />
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
