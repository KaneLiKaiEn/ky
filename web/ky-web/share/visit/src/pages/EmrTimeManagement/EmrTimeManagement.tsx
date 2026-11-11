import { useCallback, useEffect, useMemo, useState } from "react";
import { App, Button, Input, Space, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import {
  deleteTimeRuleAPI,
  getTimeRuleListAPI,
} from "@/api/emr";
import type { TimeRuleRow } from "@/types/emr";
import { useSessionInfo } from "@/pages/PrepayDeposit/hooks/useSessionInfo";
import TimeRuleDeptModal from "./TimeRuleDeptModal";
import TimeRulePropertyModal from "./TimeRulePropertyModal";
import type { EmrTimeManagementProps, TimeRuleEditor } from "./types";

const EmrTimeManagement = ({ workType = "DOCTOR" }: EmrTimeManagementProps) => {
  const { message, modal } = App.useApp();
  const { orgId } = useSessionInfo();
  const [rows, setRows] = useState<TimeRuleRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [editor, setEditor] = useState<TimeRuleEditor>({ type: "none" });

  const loadList = useCallback(async () => {
    if (!workType || orgId == null) {
      setRows([]);
      return;
    }
    setLoading(true);
    try {
      const res = await getTimeRuleListAPI({
        org_id: orgId,
        rule_type: workType,
      });
      setRows(res.row_list ?? []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [orgId, workType]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const filteredRows = useMemo(() => {
    const text = keyword.trim().toLowerCase();
    if (!text) return rows;
    return rows.filter((row) => {
      const haystack = [row.rule_name, row.rule_code, row.rule_no]
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
    type: Exclude<TimeRuleEditor["type"], "none" | "create">,
    row: TimeRuleRow,
  ) => {
    if (row.rule_id == null) {
      message.warning("缺少规则 ID");
      return;
    }
    setEditor({
      type,
      ruleId: row.rule_id,
      ruleName: row.rule_name,
    });
  };

  const handleDelete = (row: TimeRuleRow) => {
    if (row.rule_id == null) return;
    modal.confirm({
      title: "确认删除",
      content: `确定删除时限规则「${row.rule_name || row.rule_id}」吗？`,
      okButtonProps: { danger: true },
      onOk: async () => {
        await deleteTimeRuleAPI({ rule_id: row.rule_id as number });
        message.success("删除成功");
        await loadList();
      },
    });
  };

  const columns: ColumnsType<TimeRuleRow> = [
    {
      title: "编号",
      dataIndex: "rule_no",
      render: (value?: string) => value || "-",
    },
    {
      title: "名称",
      dataIndex: "rule_name",
      render: (value?: string) => value || "-",
    },
    {
      title: "患者类型",
      dataIndex: "patient_type",
      render: (value?: string) => value || "-",
    },
    {
      title: "时间类型",
      dataIndex: "time_type",
      render: (value?: string) => value || "-",
    },
    {
      title: "时限",
      key: "time",
      render: (_value, record) => {
        const duration =
          record.time_duration == null ? "" : String(record.time_duration);
        const unit = record.time_unit ?? "";
        if (!duration && !unit) return "-";
        return `${duration}${unit}`;
      },
    },
    {
      title: "文档类型",
      key: "doc",
      render: (_value, record) =>
        [record.doc_type, record.doc_name].filter(Boolean).join(" / ") || "-",
    },
    {
      title: "扣分项",
      dataIndex: "qc_name",
      render: (value?: string) => value || "-",
    },
    {
      title: "操作",
      key: "action",
      width: 180,
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
            onClick={() => openRowEditor("dept", record)}
          >
            科室
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

  const currentRuleId =
    editor.type !== "none" && editor.type !== "create"
      ? editor.ruleId
      : undefined;
  const currentRuleName =
    editor.type !== "none" && editor.type !== "create"
      ? editor.ruleName
      : undefined;

  return (
    <div className="flex h-full min-h-0 flex-col bg-(--app-theme-bg-container) p-2">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="text-base font-medium">时限规则类型：{workType}</div>
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
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setEditor({ type: "create" })}
          >
            新增规则
          </Button>
        </Space>
      </div>

      <div className="min-h-0 flex-1">
        <Table<TimeRuleRow>
          size="small"
          loading={loading}
          rowKey={(record) =>
            record.rule_id != null
              ? String(record.rule_id)
              : `${record.rule_code ?? ""}-${record.rule_name ?? ""}`
          }
          columns={columns}
          dataSource={filteredRows}
          scroll={{ x: 1200, y: "calc(100vh - 220px)" }}
          pagination={false}
        />
      </div>

      <TimeRulePropertyModal
        open={editor.type === "create" || editor.type === "edit"}
        mode={editor.type === "edit" ? "edit" : "create"}
        ruleType={workType}
        ruleId={editor.type === "edit" ? editor.ruleId : undefined}
        orgId={orgId}
        workType={workType}
        onCancel={closeEditor}
        onSaved={handleSaved}
      />
      <TimeRuleDeptModal
        open={editor.type === "dept"}
        ruleId={currentRuleId ?? 0}
        ruleName={currentRuleName}
        onCancel={closeEditor}
      />
    </div>
  );
};

export default EmrTimeManagement;
