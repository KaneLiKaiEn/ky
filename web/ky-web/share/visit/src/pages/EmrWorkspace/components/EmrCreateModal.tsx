import { useCallback, useEffect, useState } from "react";
import { Checkbox, Empty, List, Modal, Spin, Switch, Tree, message } from "antd";
import type { DataNode, EventDataNode } from "antd/es/tree";
import { getMatchListAPI } from "@/api/cohort";
import { getDocNameListAPI, getDocTypeListAPI } from "@/api/doc";
import { getFormList, getPrefabList } from "@/api/form";
import type { DocNameRow, DocTypeRow } from "@/types/doc";
import type { FormRow, PrefabRow } from "@/types/form";
import type { EmrCreateSelection, EmrWorkspaceVisitContext, EmrWorkType } from "../types";

export type { EmrCreateSelection };

type DocTreeNode = DataNode & {
  nodeKind: "type" | "name";
  docType?: string;
  docName?: string;
  assessScore?: number;
};

type PrefabFilterOptions = {
  includeDept: boolean;
  includeOrg: boolean;
  includeDisease: boolean;
  includeGender: boolean;
  includeAge: boolean;
};

export interface EmrCreateModalProps {
  open: boolean;
  confirmLoading?: boolean;
  visit: EmrWorkspaceVisitContext;
  /** DOCTOR / NURSE；默认 DOCTOR */
  workType?: EmrWorkType;
  docType?: string;
  docName?: string;
  docTag?: string;
  onlyLink?: boolean;
  excludeLink?: boolean;
  /** 仅查询当前用户有权限使用的表单。 */
  onlyAuth?: boolean;
  /** GetPrefabList 的就诊类型和门诊子类型条件。 */
  prefabFilter?: { visitType?: string; opType?: string };
  onCancel: () => void;
  onConfirm?: (selection: EmrCreateSelection) => void | Promise<void>;
}

const normalizeWorkType = (value: string) =>
  value.replace(/^\[|\]$/g, "").toUpperCase();

/** `[NURSE][OTHER][DOCTOR]` → `["NURSE", "OTHER", "DOCTOR"]` */
const parseWorkTypeTags = (value: string): string[] => {
  const matches = value.match(/\[([^\]]+)\]/g);
  if (matches?.length) {
    return matches.map((tag) => tag.slice(1, -1).toUpperCase());
  }
  const plain = normalizeWorkType(value);
  return plain ? [plain] : [];
};

const matchesWorkType = (rowWorkType: string | undefined, workType: string) => {
  if (!rowWorkType) return true;
  const target = normalizeWorkType(workType);
  return parseWorkTypeTags(rowWorkType).includes(target);
};

const updateTreeData = (
  list: DocTreeNode[],
  key: React.Key,
  children: DocTreeNode[],
): DocTreeNode[] =>
  list.map((node) => {
    if (node.key === key) {
      return { ...node, children };
    }
    if (node.children?.length) {
      return {
        ...node,
        children: updateTreeData(node.children as DocTreeNode[], key, children),
      };
    }
    return node;
  });

const toTypeNodes = (rows: DocTypeRow[], workType: string): DocTreeNode[] =>
  rows
    // .filter((row) => row.doc_type && matchesWorkType(row.work_type, workType))
    .map((row) => ({
      key: `type-${row.type_id ?? row.doc_type}`,
      title: row.doc_type!,
      nodeKind: "type" as const,
      docType: row.doc_type,
      isLeaf: false,
    }));

const toNameNodes = (
  rows: DocNameRow[],
  docType: string,
  workType: string,
): DocTreeNode[] =>
  rows
    .filter((row) => row.doc_name && matchesWorkType(row.work_type, workType))
    .map((row) => ({
      key: `name-${row.name_id ?? row.doc_name}`,
      title: row.doc_name!,
      nodeKind: "name" as const,
      docType,
      docName: row.doc_name,
      assessScore: row.assess_score,
      isLeaf: true,
    }));

const EmrCreateModal = ({
  open,
  confirmLoading,
  visit,
  workType = "DOCTOR",
  docType,
  docName,
  docTag,
  onlyLink,
  excludeLink,
  onlyAuth,
  prefabFilter,
  onCancel,
  onConfirm,
}: EmrCreateModalProps) => {
  const lockedDoc = Boolean(docType && docName);
  const [treeLoading, setTreeLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [prefabLoading, setPrefabLoading] = useState(false);
  const [treeData, setTreeData] = useState<DocTreeNode[]>([]);
  const [selectedTreeKey, setSelectedTreeKey] = useState<React.Key>();
  const [formList, setFormList] = useState<FormRow[]>([]);
  const [prefabList, setPrefabList] = useState<PrefabRow[]>([]);
  const [selectedForm, setSelectedForm] = useState<FormRow | null>(null);
  const [selectedPrefab, setSelectedPrefab] = useState<PrefabRow | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<{
    docType: string;
    docName: string;
    assessScore?: number;
  } | null>(null);
  const [includeDept, setIncludeDept] = useState(true);
  const [includeOrg, setIncludeOrg] = useState(true);
  const [includeDisease, setIncludeDisease] = useState(true);
  const [includeGender, setIncludeGender] = useState(true);
  const [includeAge, setIncludeAge] = useState(true);

  const resetState = useCallback(() => {
    setTreeData([]);
    setSelectedTreeKey(undefined);
    setFormList([]);
    setPrefabList([]);
    setSelectedForm(null);
    setSelectedPrefab(null);
    setSelectedDoc(null);
    setIncludeDept(true);
    setIncludeOrg(true);
    setIncludeDisease(true);
    setIncludeGender(true);
    setIncludeAge(true);
  }, []);

  const loadDocTypes = useCallback(async () => {
    setTreeLoading(true);
    try {
      const res = await getDocTypeListAPI();
      if (res.code !== 0) {
        message.error(res.message || "获取文档类型失败");
        setTreeData([]);
        return;
      }
      setTreeData(toTypeNodes(res.row_list ?? [], workType));
    } catch {
      message.error("获取文档类型失败");
      setTreeData([]);
    } finally {
      setTreeLoading(false);
    }
  }, [workType]);

  const loadDocNames = useCallback(async (type: string) => {
    setTreeLoading(true);
    try {
      const res = await getDocNameListAPI({ doc_type: type, exclude_link: true });
      if (res.code !== 0) {
        message.error(res.message || "获取文档名称失败");
        setTreeData([]);
        return;
      }
      setTreeData(toNameNodes(res.row_list ?? [], type, workType));
    } catch {
      message.error("获取文档名称失败");
      setTreeData([]);
    } finally {
      setTreeLoading(false);
    }
  }, [workType]);

  const loadPrefabListForForm = useCallback(
    async (formId: number, filters: PrefabFilterOptions) => {
      setPrefabLoading(true);
      try {
        const params: Parameters<typeof getPrefabList>[0] = {
          form_id: formId,
          include_dept: filters.includeDept,
          include_org: filters.includeOrg,
          visit_type: prefabFilter?.visitType,
          op_type: prefabFilter?.opType,
        };

        if (filters.includeDisease && visit.visitId != null) {
          const matchRes = await getMatchListAPI({
            visit_id: visit.visitId,
            baby_id: visit.babyId ?? 0,
            disease_type: "病种",
          });
          if (matchRes.code !== 0) {
            message.error(matchRes.message || "获取匹配病种失败");
          } else {
            const diseaseIds = (matchRes.row_list ?? [])
              .map((row) => row.disease_id)
              .filter((id): id is number => id != null);
            if (diseaseIds.length > 0) {
              params.disease_id_list = diseaseIds;
            }
          }
        }

        if (filters.includeGender && visit.patientGender) {
          params.gender_name = visit.patientGender;
        }

        if (filters.includeAge) {
          const ageValue = visit.patientAgeYear ?? visit.patientAge;
          if (ageValue != null) {
            params.age_value = ageValue;
            params.age_unit = "岁";
          }
        }

        const res = await getPrefabList(params);
        if (res.code !== 0) {
          message.error(res.message || "获取模板列表失败");
          return;
        }
        setPrefabList(res.row_list ?? []);
      } catch {
      } finally {
        setPrefabLoading(false);
      }
    },
    [visit, prefabFilter?.visitType, prefabFilter?.opType],
  );

  const selectForm = useCallback(
    async (form: FormRow, filters: PrefabFilterOptions) => {
      setSelectedForm(form);
      setSelectedPrefab(null);
      setPrefabList([]);

      if (form.form_id == null) return;
      await loadPrefabListForForm(form.form_id, filters);
    },
    [loadPrefabListForForm],
  );

  const loadFormList = useCallback(
    async (
      type: string,
      name: string,
      tag: string | undefined,
      options?: { autoSelectFirst?: boolean },
    ) => {
      setFormLoading(true);
      setPrefabLoading(false);
      setFormList([]);
      setPrefabList([]);
      setSelectedForm(null);
      setSelectedPrefab(null);
      try {
        const res = await getFormList({
          doc_type: type,
          doc_name: name,
          doc_tag: tag,
          only_auth: onlyAuth,
          ...(onlyLink ? { only_link: true } : {}),
          ...(excludeLink ? { exclude_link: true } : {}),
        });
        if (res.code !== 0) {
          message.error(res.message || "获取表单列表失败");
          return;
        }
        const list = res.row_list ?? [];
        setFormList(list);
        if (options?.autoSelectFirst && list[0]) {
          await selectForm(list[0], {
            includeDept: true,
            includeOrg: true,
            includeDisease: true,
            includeGender: true,
            includeAge: true,
          });
        }
      } catch {
      } finally {
        setFormLoading(false);
      }
    },
    [excludeLink, onlyLink, onlyAuth, selectForm],
  );

  useEffect(() => {
    if (!open) {
      setFormLoading(false);
      setPrefabLoading(false);
      return;
    }
    resetState();
    if (docType && docName) {
      setSelectedDoc({ docType, docName });
      void loadFormList(docType, docName, docTag, { autoSelectFirst: true });
      return;
    }
    if (docType) {
      void loadDocNames(docType);
      return;
    }
    void loadDocTypes();
  }, [
    open,
    docType,
    docName,
    docTag,
    workType,
    loadDocNames,
    loadDocTypes,
    loadFormList,
    resetState,
  ]);

  const handleLoadTreeData = async (node: EventDataNode<DocTreeNode>) => {
    if (node.nodeKind !== "type" || !node.docType || node.children?.length) {
      return;
    }

    try {
      const res = await getDocNameListAPI({ doc_type: node.docType, exclude_link: true });
      if (res.code !== 0) {
        message.error(res.message || "获取文档名称失败");
        return;
      }
      const children = toNameNodes(res.row_list ?? [], node.docType, workType);
      setTreeData((origin) => updateTreeData(origin, node.key, children));
    } catch {
      message.error("获取文档名称失败");
    }
  };

  const handleSelectDocName = async (node: DocTreeNode) => {
    if (node.nodeKind !== "name" || !node.docType || !node.docName) return;

    setSelectedTreeKey(node.key);
    setSelectedDoc({
      docType: node.docType,
      docName: node.docName,
      assessScore: node.assessScore,
    });
    await loadFormList(node.docType, node.docName, undefined);
  };

  const handleSelectForm = async (form: FormRow) => {
    await selectForm(form, {
      includeDept,
      includeOrg,
      includeDisease,
      includeGender,
      includeAge,
    });
  };

  const handlePrefabFilterChange = (partial: Partial<PrefabFilterOptions>) => {
    const filters: PrefabFilterOptions = {
      includeDept: partial.includeDept ?? includeDept,
      includeOrg: partial.includeOrg ?? includeOrg,
      includeDisease: partial.includeDisease ?? includeDisease,
      includeGender: partial.includeGender ?? includeGender,
      includeAge: partial.includeAge ?? includeAge,
    };

    if (partial.includeDept !== undefined) setIncludeDept(partial.includeDept);
    if (partial.includeOrg !== undefined) setIncludeOrg(partial.includeOrg);
    if (partial.includeDisease !== undefined) {
      setIncludeDisease(partial.includeDisease);
    }
    if (partial.includeGender !== undefined) {
      setIncludeGender(partial.includeGender);
    }
    if (partial.includeAge !== undefined) setIncludeAge(partial.includeAge);

    if (selectedForm?.form_id == null) return;
    setSelectedPrefab(null);
    void loadPrefabListForForm(selectedForm.form_id, filters);
  };

  const handleOk = async () => {
    if (!selectedForm && !selectedPrefab) {
      message.warning("请选择表单或模板");
      return;
    }
    if (!selectedDoc) {
      message.warning("请选择文档");
      return;
    }

    await onConfirm?.({
      docType: selectedDoc.docType,
      docName: selectedDoc.docName,
      assessScore: selectedDoc.assessScore,
      form: selectedForm ?? undefined,
      prefab: selectedPrefab ?? undefined,
    });
  };

  const columnClass =
    "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border-r border-(--app-theme-border) last:border-r-0";

  return (
    <Modal
      title="新增病历"
      open={open}
      onCancel={onCancel}
      onOk={() => void handleOk()}
      confirmLoading={confirmLoading}
      okText="确定"
      cancelText="取消"
      width={lockedDoc ? "75%" : "80%"}
      destroyOnHidden
      styles={{ body: { height: 520, padding: 0 } }}
    >
      <div className="flex h-full min-h-0">
        {!lockedDoc ? (
          <div className={columnClass}>
            <div className="shrink-0 border-b border-(--app-theme-border) p-2 text-(--app-theme-text)">
              {docType ? "文档名称" : "文档类型"}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              <Spin spinning={treeLoading}>
                {treeData.length > 0 ? (
                  <Tree
                    blockNode
                    selectedKeys={selectedTreeKey ? [selectedTreeKey] : []}
                    treeData={treeData}
                    loadData={docType ? undefined : handleLoadTreeData}
                    onSelect={(_, { node }) => void handleSelectDocName(node)}
                  />
                ) : (
                  !treeLoading && (
                    <Empty
                      description={docType ? "暂无文档名称" : "暂无文档类型"}
                    />
                  )
                )}
              </Spin>
            </div>
          </div>
        ) : null}

        <div className={columnClass}>
          <div className="shrink-0 border-b border-(--app-theme-border) p-2 text-(--app-theme-text)">
            表单
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <Spin spinning={formLoading}>
              <List
                size="small"
                locale={{
                  emptyText: selectedDoc ? "暂无表单" : "请先选择文档",
                }}
                dataSource={formList}
                renderItem={(row) => {
                  const active =
                    row.form_id != null && row.form_id === selectedForm?.form_id;
                  return (
                    <List.Item
                      className={[
                        "cursor-pointer! px-3!",
                        active
                          ? "bg-(--app-theme-primary-bg)!"
                          : "hover:bg-(--app-theme-bg-fill-alter)!",
                      ].join(" ")}
                      onClick={() => void handleSelectForm(row)}
                    >
                      <span className="text-(length:--app-theme-font-default) text-(--app-theme-text)">
                        {row.form_name ?? `表单 ${row.form_id}`}
                      </span>
                    </List.Item>
                  );
                }}
              />
            </Spin>
          </div>
        </div>

        <div className={columnClass}>
          <div className="flex shrink-0 items-center gap-3 border-b border-(--app-theme-border) px-3 py-2">
            <span className="font-medium text-(--app-theme-text)">
              模板
            </span>
            <Checkbox
              checked={includeDept}
              onChange={(e) =>
                handlePrefabFilterChange({ includeDept: e.target.checked })
              }
            >
              科室
            </Checkbox>
            <Checkbox
              checked={includeOrg}
              onChange={(e) =>
                handlePrefabFilterChange({ includeOrg: e.target.checked })
              }
            >
              机构
            </Checkbox>
            <span className="flex items-center gap-1 text-(length:--app-theme-font-sm) text-(--app-theme-text)">
              病种
              <Switch
                size="small"
                checked={includeDisease}
                onChange={(checked) =>
                  handlePrefabFilterChange({ includeDisease: checked })
                }
              />
            </span>
            <span className="flex items-center gap-1 text-(length:--app-theme-font-sm) text-(--app-theme-text)">
              性别
              <Switch
                size="small"
                checked={includeGender}
                onChange={(checked) =>
                  handlePrefabFilterChange({ includeGender: checked })
                }
              />
            </span>
            <span className="flex items-center gap-1 text-(length:--app-theme-font-sm) text-(--app-theme-text)">
              年龄
              <Switch
                size="small"
                checked={includeAge}
                onChange={(checked) =>
                  handlePrefabFilterChange({ includeAge: checked })
                }
              />
            </span>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <Spin spinning={prefabLoading}>
              <List
                size="small"
                locale={{
                  emptyText: selectedForm ? "暂无模板" : "请先选择表单",
                }}
                dataSource={prefabList}
                renderItem={(row) => {
                  const active =
                    row.prefab_id != null &&
                    row.prefab_id === selectedPrefab?.prefab_id;
                  return (
                    <List.Item
                      className={[
                        "cursor-pointer! px-3!",
                        active
                          ? "bg-(--app-theme-primary-bg)!"
                          : "hover:bg-(--app-theme-bg-fill-alter)!",
                      ].join(" ")}
                      onClick={() => setSelectedPrefab(row)}
                    >
                      <span className="text-(length:--app-theme-font-default) text-(--app-theme-text)">
                        {row.prefab_name ?? `模板 ${row.prefab_id}`}
                      </span>
                    </List.Item>
                  );
                }}
              />
            </Spin>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default EmrCreateModal;
