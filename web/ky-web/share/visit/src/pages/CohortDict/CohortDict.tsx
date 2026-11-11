import { useCallback, useEffect, useMemo, useState } from "react";
import { App, Button, Input, Space, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { deleteDiseaseAPI, getDiseaseListAPI } from "@/api/cohort";
import type { DiseaseRow } from "@/types/cohort";
import { useSessionInfo } from "@/pages/PrepayDeposit/hooks/useSessionInfo";
import { AUTO_INCLUDE_TAG } from "./constants";
import DiseaseDeptModal from "./DiseaseDeptModal";
import DiseaseDiagModal from "./DiseaseDiagModal";
import DiseaseFollowupModal from "./DiseaseFollowupModal";
import DiseaseOpsModal from "./DiseaseOpsModal";
import DiseasePostModal from "./DiseasePostModal";
import DiseasePropertyModal from "./DiseasePropertyModal";
import DiseaseStepModal from "./DiseaseStepModal";
import { DISEASE_TYPE_CLINICAL_PATH } from "./constants";
import type { CohortDictProps, DiseaseEditor } from "./types";
import { formatGenderLabel, formatRange, hasBracketTag } from "./utils";

const CohortDict = ({ disease_type, work_type }: CohortDictProps) => {
  const { message, modal } = App.useApp();
  const { orgId } = useSessionInfo();
  const [rows, setRows] = useState<DiseaseRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [editor, setEditor] = useState<DiseaseEditor>({ type: "none" });

  const loadList = useCallback(async () => {
    if (!disease_type) {
      setRows([]);
      return;
    }
    setLoading(true);
    try {
      const res = await getDiseaseListAPI({ disease_type });
      setRows(res.row_list ?? []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [disease_type]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const filteredRows = useMemo(() => {
    const text = keyword.trim().toLowerCase();
    if (!text) return rows;
    return rows.filter((row) => {
      const haystack = [row.disease_name, row.disease_code, row.disease_no]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(text);
    });
  }, [keyword, rows]);

  const closeEditor = useCallback(() => {
    setEditor({ type: "none" });
  }, []);

  const handleSaved = useCallback(() => {
    closeEditor();
    void loadList();
  }, [closeEditor, loadList]);

  const openRowEditor = (
    type: Exclude<DiseaseEditor["type"], "none" | "create" | "typePost">,
    row: DiseaseRow,
  ) => {
    if (row.disease_id == null) {
      message.warning("缺少病种 ID");
      return;
    }
    setEditor({
      type,
      diseaseId: row.disease_id,
      diseaseName: row.disease_name,
    } as DiseaseEditor);
  };

  const handleDelete = (row: DiseaseRow) => {
    if (row.disease_id == null) return;
    modal.confirm({
      title: "确认删除",
      content: `确定删除病种「${row.disease_name || row.disease_id}」吗？`,
      okButtonProps: { danger: true },
      onOk: async () => {
        await deleteDiseaseAPI({ disease_id: row.disease_id as number });
        message.success("删除成功");
        await loadList();
      },
    });
  };

  const columns: ColumnsType<DiseaseRow> = [
    {
      title: "编号",
      dataIndex: "disease_no",
      render: (value?: string) => value || "-",
    },
    {
      title: "编码",
      dataIndex: "disease_code",
      render: (value?: string) => value || "-",
    },
    {
      title: "名称",
      dataIndex: "disease_name",
      render: (value?: string) => value || "-",
    },
    {
      title: "性别",
      dataIndex: "gender_name",
      render: (value?: string) => formatGenderLabel(value) || "-",
    },
    {
      title: "适用年龄",
      key: "age",
      render: (_value, record) =>
        formatRange(record.age_min, record.age_max, record.age_unit) || "-",
    },
    {
      title: "BMI",
      key: "bmi",
      render: (_value, record) =>
        formatRange(record.bmi_min, record.bmi_max) || "-",
    },
    {
      title: "自动纳入",
      dataIndex: "disease_tag",
      render: (value?: string) =>
        hasBracketTag(value, AUTO_INCLUDE_TAG) ? (
          <Tag color="blue">是</Tag>
        ) : (
          "否"
        ),
    },
    {
      title: "报卡",
      key: "doc",
      render: (_value, record) =>
        [record.doc_type, record.doc_name].filter(Boolean).join(" / ") || "-",
    },
    {
      title: "排序",
      dataIndex: "sort_no",
      render: (value?: string) => value || "-",
    },
    {
      title: "操作",
      key: "action",
      width: 200,
      fixed: "right",
      render: (_value, record) => (
        <Space size={0} wrap>
          <Button
            type="link"
            size="small"
            onClick={() => openRowEditor("edit", record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => openRowEditor("diag", record)}
          >
            诊断
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => openRowEditor("ops", record)}
          >
            手术
          </Button>
          {disease_type === DISEASE_TYPE_CLINICAL_PATH ? (
            <Button
              type="link"
              size="small"
              onClick={() => openRowEditor("step", record)}
            >
              路径
            </Button>
          ) : null}
          <Button
            type="link"
            size="small"
            onClick={() => openRowEditor("dept", record)}
          >
            授权
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => openRowEditor("post", record)}
          >
            上报
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => openRowEditor("followup", record)}
          >
            随访
          </Button>
          <Button
            type="link"
            size="small"
            danger
            onClick={() => handleDelete(record)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const currentDiseaseId =
    editor.type !== "none" &&
    editor.type !== "create" &&
    editor.type !== "typePost"
      ? editor.diseaseId
      : undefined;
  const currentDiseaseName =
    editor.type !== "none" &&
    editor.type !== "create" &&
    editor.type !== "typePost"
      ? editor.diseaseName
      : undefined;

  return (
    <div className="flex h-full min-h-0 flex-col bg-(--app-theme-bg-container) p-2">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="text-base font-medium">病种类型：{disease_type}</div>
        <Space wrap>
          <Input.Search
            allowClear
            placeholder="按名称 / 编码 / 编号筛选"
            className="w-60"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <Button icon={<ReloadOutlined />} onClick={() => void loadList()}>
            刷新
          </Button>
          <Button onClick={() => setEditor({ type: "typePost" })}>
            类型上报
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setEditor({ type: "create" })}
          >
            新增病种
          </Button>
        </Space>
      </div>

      <div className="min-h-0 flex-1">
        <Table<DiseaseRow>
          size="small"
          loading={loading}
          rowKey={(record) =>
            record.disease_id != null
              ? String(record.disease_id)
              : `${record.disease_code ?? ""}-${record.disease_name ?? ""}`
          }
          columns={columns}
          dataSource={filteredRows}
          scroll={{ x: 1280, y: "calc(100vh - 220px)" }}
          pagination={false}
        />
      </div>

      <DiseasePropertyModal
        open={editor.type === "create" || editor.type === "edit"}
        mode={editor.type === "edit" ? "edit" : "create"}
        diseaseType={disease_type}
        diseaseId={editor.type === "edit" ? editor.diseaseId : undefined}
        orgId={orgId}
        onCancel={closeEditor}
        onSaved={handleSaved}
      />
      <DiseaseDiagModal
        open={editor.type === "diag"}
        diseaseId={currentDiseaseId ?? 0}
        diseaseName={currentDiseaseName}
        orgId={orgId}
        onCancel={closeEditor}
      />
      <DiseaseOpsModal
        open={editor.type === "ops"}
        diseaseId={currentDiseaseId ?? 0}
        diseaseName={currentDiseaseName}
        orgId={orgId}
        onCancel={closeEditor}
      />
      <DiseaseStepModal
        open={editor.type === "step"}
        diseaseId={currentDiseaseId ?? 0}
        diseaseName={currentDiseaseName}
        workType={work_type}
        onCancel={closeEditor}
      />
      <DiseaseDeptModal
        open={editor.type === "dept"}
        diseaseId={currentDiseaseId ?? 0}
        diseaseName={currentDiseaseName}
        onCancel={closeEditor}
      />
      <DiseasePostModal
        open={editor.type === "post" || editor.type === "typePost"}
        scope={editor.type === "typePost" ? "type" : "disease"}
        diseaseType={disease_type}
        diseaseId={editor.type === "post" ? editor.diseaseId : undefined}
        diseaseName={currentDiseaseName}
        onCancel={closeEditor}
      />
      <DiseaseFollowupModal
        open={editor.type === "followup"}
        diseaseId={currentDiseaseId ?? 0}
        diseaseName={currentDiseaseName}
        onCancel={closeEditor}
      />
    </div>
  );
};

export default CohortDict;
