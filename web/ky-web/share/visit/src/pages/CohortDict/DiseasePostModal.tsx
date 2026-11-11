import { useCallback, useEffect, useState } from "react";
import { App, Button, Input, Modal, Select, Space, Spin } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import {
  getDiseasePostListAPI,
  saveDiseasePostAPI,
} from "@/api/cohort";
import type { DiseasePostRow } from "@/types/cohort";
import { POST_BASE_OPTIONS } from "./constants";
import { createRowKey } from "./utils";

interface PostEditRow {
  rowKey: string;
  action_code: string;
  action_name: string;
  action_script: string;
  action_tag: string;
  sort_no: string;
}

export interface DiseasePostModalProps {
  open: boolean;
  diseaseType: string;
  diseaseId?: number;
  diseaseName?: string;
  /** type = 按类型；disease = 按病种 */
  scope: "type" | "disease";
  onCancel: () => void;
}

const { TextArea } = Input;

const toEditRows = (list: DiseasePostRow[]): PostEditRow[] =>
  list.map((item) => ({
    rowKey:
      item.action_code != null && item.action_code !== ""
        ? `code_${item.action_code}`
        : createRowKey(),
    action_code: item.action_code ?? "",
    action_name: item.action_name ?? "",
    action_script: item.action_script ?? "",
    action_tag: item.action_tag ?? "",
    sort_no: item.sort_no ?? "",
  }));

const DiseasePostModal = ({
  open,
  diseaseType,
  diseaseId,
  diseaseName,
  scope,
  onCancel,
}: DiseasePostModalProps) => {
  const { message, modal } = App.useApp();
  const [rows, setRows] = useState<PostEditRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (scope === "disease" && diseaseId == null) {
      setRows([]);
      return;
    }
    setLoading(true);
    try {
      const res = await getDiseasePostListAPI(
        scope === "type"
          ? { disease_type: diseaseType }
          : { disease_id: diseaseId },
      );
      setRows(toEditRows(res.row_list ?? []));
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [diseaseId, diseaseType, scope]);

  useEffect(() => {
    if (!open) {
      setRows([]);
      return;
    }
    void reload();
  }, [open, reload]);

  const patch = (rowKey: string, updates: Partial<PostEditRow>) => {
    setRows((prev) =>
      prev.map((row) => (row.rowKey === rowKey ? { ...row, ...updates } : row)),
    );
  };

  const handleAdd = () => {
    setRows((prev) => [
      ...prev,
      {
        rowKey: createRowKey(),
        action_code: "",
        action_name: "",
        action_script: "",
        action_tag: "",
        sort_no: "",
      },
    ]);
  };

  const buildScopeParams = () =>
    scope === "type"
      ? { disease_type: diseaseType }
      : { disease_id: diseaseId };

  const handleSaveItem = async (row: PostEditRow) => {
    if (!row.action_code.trim()) {
      message.warning("请填写动作代码");
      return;
    }
    setSavingKey(row.rowKey);
    try {
      await saveDiseasePostAPI({
        ...buildScopeParams(),
        action_code: row.action_code,
        post_property: {
          action_code: row.action_code,
          action_name: row.action_name,
          action_script: row.action_script,
          action_tag: row.action_tag,
          sort_no: row.sort_no,
        },
      });
      message.success("保存成功");
      await reload();
    } finally {
      setSavingKey(null);
    }
  };

  const handleDeleteItem = (row: PostEditRow) => {
    modal.confirm({
      title: "确认删除",
      content: `确定删除动作「${row.action_name || row.action_code || "未命名"}」吗？`,
      okButtonProps: { danger: true },
      onOk: async () => {
        if (!row.action_code) {
          setRows((prev) => prev.filter((item) => item.rowKey !== row.rowKey));
          return;
        }
        await saveDiseasePostAPI({
          ...buildScopeParams(),
          action_code: row.action_code,
        });
        message.success("删除成功");
        await reload();
      },
    });
  };

  const title =
    scope === "type"
      ? `类型上报 — ${diseaseType}`
      : diseaseName
        ? `上报 — ${diseaseName}`
        : "上报";

  return (
    <Modal
      title={title}
      open={open}
      onCancel={onCancel}
      footer={null}
      width={900}
      destroyOnHidden
      
    >
      <Spin spinning={loading}>
        <div className="mb-3 flex justify-end">
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增
          </Button>
        </div>
        <div className="flex max-h-[70vh] flex-col gap-3 overflow-auto">
        {rows.map((row) => (
          <div
            key={row.rowKey}
            className="rounded-md border border-(--app-theme-border) bg-(--app-theme-bg-elevated) p-3"
          >
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <Space wrap>
                <span className="font-medium">代码</span>
                <Input
                  value={row.action_code}
                  placeholder="动作代码"
                  className="w-64"
                  addonAfter={
                    <Select
                      placeholder="选择"
                      variant="borderless"
                      className="w-24"
                      options={POST_BASE_OPTIONS}
                      value={
                        POST_BASE_OPTIONS.some(
                          (item) => item.value === row.action_code,
                        )
                          ? row.action_code
                          : undefined
                      }
                      onChange={(value) => {
                        const selected = POST_BASE_OPTIONS.find(
                          (item) => item.value === value,
                        );
                        patch(row.rowKey, {
                          action_code: value,
                          action_name: selected?.label || value,
                        });
                      }}
                    />
                  }
                  onChange={(e) =>
                    patch(row.rowKey, { action_code: e.target.value })
                  }
                />
                <span className="font-medium">名称</span>
                <Input
                  value={row.action_name}
                  placeholder="动作名称"
                  className="w-36"
                  onChange={(e) =>
                    patch(row.rowKey, { action_name: e.target.value })
                  }
                />
                <span className="font-medium">标签</span>
                <Input
                  value={row.action_tag}
                  placeholder="标签"
                  className="w-28"
                  onChange={(e) =>
                    patch(row.rowKey, { action_tag: e.target.value })
                  }
                />
                <span className="font-medium">排序号</span>
                <Input
                  value={row.sort_no}
                  placeholder="排序号"
                  className="w-20"
                  onChange={(e) =>
                    patch(row.rowKey, { sort_no: e.target.value })
                  }
                />
              </Space>
              <Space>
                <Button
                  type="primary"
                  size="small"
                  loading={savingKey === row.rowKey}
                  onClick={() => void handleSaveItem(row)}
                >
                  保存
                </Button>
                <Button
                  danger
                  size="small"
                  onClick={() => handleDeleteItem(row)}
                >
                  删除
                </Button>
              </Space>
            </div>
            <TextArea
              value={row.action_script}
              rows={4}
              showCount
              placeholder={`请输入${row.action_name || "动作"}的脚本内容`}
              onChange={(e) =>
                patch(row.rowKey, { action_script: e.target.value })
              }
            />
          </div>
        ))}
        </div>
      </Spin>
    </Modal>
  );
};

export default DiseasePostModal;
