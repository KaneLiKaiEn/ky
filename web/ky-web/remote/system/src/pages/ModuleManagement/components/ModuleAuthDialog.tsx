import React, { useCallback, useEffect, useState } from "react";
import { App, Button, DatePicker, Modal, Select, Switch, Table } from "antd";
import dayjs from "dayjs";
import type { ColumnsType } from "antd/es/table";
import { PlusOutlined } from "@ant-design/icons";
import { getModuleAuthList, saveModuleAuthList } from "@/api/federation";
import { retrieveRoleList } from "@/api/org";
import { retrieveUserList } from "@/api/user";
import type { ModuleAuthRow } from "@/types/federation";

const AUTH_TYPE_ROLE = "ROLE";
const AUTH_TYPE_USER = "USER";

const AUTH_TYPE_OPTIONS = [
  { value: AUTH_TYPE_ROLE, label: "角色" },
  { value: AUTH_TYPE_USER, label: "用户" },
];

const DATE_FORMAT = "YYYY-MM-DD";
const DEFAULT_VALID_STATUS = "1";
const DEFAULT_VALID_START = "2000-01-01";
const DEFAULT_VALID_END = "2099-12-31";

interface AuthTableRow extends ModuleAuthRow {
  key: string;
}

interface NameOption {
  value: number;
  label: string;
}

interface ModuleAuthDialogProps {
  open: boolean;
  moduleId?: number;
  moduleName?: string;
  onClose: () => void;
}

const createEmptyRow = (): AuthTableRow => ({
  key: `new-${Date.now()}-${Math.random()}`,
  auth_type: AUTH_TYPE_ROLE,
  valid_status: DEFAULT_VALID_STATUS,
  valid_start: DEFAULT_VALID_START,
  valid_end: DEFAULT_VALID_END,
});

const ModuleAuthDialog: React.FC<ModuleAuthDialogProps> = ({
  open,
  moduleId,
  moduleName,
  onClose,
}) => {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState<AuthTableRow[]>([]);
  const [nameOptions, setNameOptions] = useState<Record<string, NameOption[]>>(
    {},
  );
  const [searchingKey, setSearchingKey] = useState<string | null>(null);

  const fetchAuthList = useCallback(async () => {
    if (moduleId == null) return;
    setLoading(true);
    try {
      const res = await getModuleAuthList({ module_id: moduleId });
      setRows(
        (res.row_list ?? []).map((row, index) => ({
          ...row,
          key: row.row_id != null ? String(row.row_id) : `loaded-${index}`,
        })),
      );
      setNameOptions({});
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [moduleId, message]);

  useEffect(() => {
    if (open) {
      fetchAuthList();
    } else {
      setRows([]);
      setNameOptions({});
    }
  }, [open, fetchAuthList]);

  const searchAuthName = async (
    rowKey: string,
    authType: string | undefined,
    input: string,
  ) => {
    if (!authType || !input.trim()) {
      setNameOptions((prev) => ({ ...prev, [rowKey]: [] }));
      return;
    }
    setSearchingKey(rowKey);
    try {
      if (authType === AUTH_TYPE_ROLE) {
        const res = await retrieveRoleList({
          retrieve_input: input,
          retrieve_limit: 20,
        });
        setNameOptions((prev) => ({
          ...prev,
          [rowKey]: (res.role_list ?? [])
            .filter((item) => item.role_id != null)
            .map((item) => ({
              value: item.role_id!,
              label: item.role_name ?? String(item.role_id),
            })),
        }));
      } else {
        const res = await retrieveUserList({
          retrieve_input: input,
          retrieve_limit: 20,
        });
        setNameOptions((prev) => ({
          ...prev,
          [rowKey]: (res.user_list ?? [])
            .filter((item) => item.user_id != null)
            .map((item) => ({
              value: item.user_id!,
              label: item.user_name ?? String(item.user_id),
            })),
        }));
      }
    } catch {
      setNameOptions((prev) => ({ ...prev, [rowKey]: [] }));
    } finally {
      setSearchingKey(null);
    }
  };

  const updateRow = (key: string, patch: Partial<AuthTableRow>) => {
    setRows((prev) =>
      prev.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );
  };

  const handleDeleteRow = (key: string) => {
    setRows((prev) => prev.filter((row) => row.key !== key));
    setNameOptions((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleAddRow = () => {
    setRows((prev) => [...prev, createEmptyRow()]);
  };

  const getNameOptions = (record: AuthTableRow): NameOption[] => {
    const searched = nameOptions[record.key] ?? [];
    if (record.auth_id == null) return searched;
    const current = {
      value: record.auth_id,
      label: record.auth_name ?? String(record.auth_id),
    };
    if (searched.some((item) => item.value === current.value)) return searched;
    return [current, ...searched];
  };

  const handleSave = async () => {
    if (moduleId == null) return;
    const invalidRow = rows.find(
      (row) => !row.auth_type || row.auth_id == null,
    );
    if (invalidRow) {
      message.warning("请完善类型和名称");
      return;
    }
    setSaving(true);
    try {
      await saveModuleAuthList({
        module_id: moduleId,
        row_list: rows.map(({ key: _key, ...row }) => ({
          ...row,
          module_id: moduleId,
        })),
      });
      message.success("保存成功");
      onClose();
    } catch {
      // 校验失败或接口错误由拦截器处理
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnsType<AuthTableRow> = [
    {
      title: "类型",
      dataIndex: "auth_type",
      width: 120,
      render: (_, record) => (
        <Select
          style={{ width: "100%" }}
          options={AUTH_TYPE_OPTIONS}
          value={record.auth_type}
          placeholder="请选择类型"
          onChange={(value) => {
            updateRow(record.key, {
              auth_type: value,
              auth_id: undefined,
              auth_name: undefined,
            });
            setNameOptions((prev) => ({ ...prev, [record.key]: [] }));
          }}
        />
      ),
    },
    {
      title: "名称",
      dataIndex: "auth_name",
      render: (_, record) => (
        <Select
          style={{ width: "100%" }}
          showSearch={{
            filterOption: false,
            onSearch: (input) =>
              searchAuthName(record.key, record.auth_type, input),
          }}
          disabled={!record.auth_type}
          placeholder="请输入搜索"
          value={record.auth_id}
          options={getNameOptions(record)}
          loading={searchingKey === record.key}
          onChange={(value) => {
            const option = getNameOptions(record).find(
              (item) => item.value === value,
            );
            updateRow(record.key, {
              auth_id: value,
              auth_name: option?.label,
            });
          }}
        />
      ),
    },
    {
      title: "状态",
      dataIndex: "valid_status",
      width: 70,
      align: "center",
      render: (_, record) => (
        <Switch
          checked={record.valid_status === "1"}
          onChange={(checked) =>
            updateRow(record.key, { valid_status: checked ? "1" : "0" })
          }
        />
      ),
    },
    {
      title: "开始日期",
      dataIndex: "valid_start",
      width: 150,
      render: (_, record) => (
        <DatePicker
          style={{ width: "100%" }}
          format={DATE_FORMAT}
          value={record.valid_start ? dayjs(record.valid_start) : null}
          onChange={(date) =>
            updateRow(record.key, {
              valid_start: date ? date.format(DATE_FORMAT) : undefined,
            })
          }
        />
      ),
    },
    {
      title: "结束日期",
      dataIndex: "valid_end",
      width: 150,
      render: (_, record) => (
        <DatePicker
          style={{ width: "100%" }}
          format={DATE_FORMAT}
          value={record.valid_end ? dayjs(record.valid_end) : null}
          onChange={(date) =>
            updateRow(record.key, {
              valid_end: date ? date.format(DATE_FORMAT) : undefined,
            })
          }
        />
      ),
    },
    {
      title: "操作",
      width: 80,
      render: (_, record) => (
        <Button
          color="danger"
          variant="outlined"
          size="small"
          onClick={() => handleDeleteRow(record.key)}
        >
          删除
        </Button>
      ),
    },
  ];

  return (
    <Modal
      title={`模块授权${moduleName ? ` - ${moduleName}` : ""}`}
      open={open}
      onCancel={onClose}
      onOk={handleSave}
      confirmLoading={saving}
      width={900}
      destroyOnHidden
    >
      <div className="flex justify-end mb-2">
        <Button
          size="small"
          color="primary"
          variant="outlined"
          icon={<PlusOutlined />}
          onClick={handleAddRow}
        >
          添加
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={rows}
        rowKey="key"
        loading={loading}
        pagination={false}
        size="small"
      />
    </Modal>
  );
};

export default ModuleAuthDialog;
