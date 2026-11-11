import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Table,
  Tag,
  Button,
  Popconfirm,
  Space,
  App,
  Modal,
  Form,
  Input,
  Select,
  Divider,
} from "antd";
import { useNavbarSlot } from "comm/navbarSlot";
import {
  newModule,
  deleteModule,
  getAppList,
  getAppEntryList,
  getModuleList,
  saveModuleProperty,
} from "@/api/federation";
import { renderMenuIcon } from "@/pages/ModuleManagement/renderMenuIcon";
import { useTableScrollY } from "@/hooks/useTableScrollY";
import menuConfig from "@/menuConfig";
import IconPicker, { DEFAULT_ICON } from "./components/IconPicker";
import ModuleAuthDialog from "./components/ModuleAuthDialog";
import type { AppEntryRow, AppRow, ModuleRow } from "@/types/federation";

const layout = {
  labelCol: { span: 6 },
  wrapperCol: { span: 18 },
};

const TABLE_HEADER_HEIGHT = 55;

const mergeAppEntries = (code: string, entries: AppEntryRow[]): AppEntryRow[] => {
  const localEntries: AppEntryRow[] = code === "system"
    ? menuConfig.map((entry) => ({
      app_code: "system",
      entry_code: entry.key,
      entry_name: entry.label,
      icon_name: entry.icon,
    }))
    : [];
  const merged = new Map<string, AppEntryRow>();
  for (const entry of [...entries, ...localEntries]) {
    if (entry.entry_code && !merged.has(entry.entry_code)) {
      merged.set(entry.entry_code, entry);
    }
  }
  return [...merged.values()];
};

const ModuleManagement: React.FC = () => {
  const { message } = App.useApp();
  const [form] = Form.useForm<ModuleRow>();
  const navbarSlot = useNavbarSlot();
  const { ref: tableContainerRef, scrollY } = useTableScrollY(TABLE_HEADER_HEIGHT);
  const entryRequestRef = useRef(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [moduleList, setModuleList] = useState<ModuleRow[]>([]);
  const [appList, setAppList] = useState<AppRow[]>([]);
  const [entryList, setEntryList] = useState<AppEntryRow[]>([]);
  const [appListLoading, setAppListLoading] = useState(false);
  const [entryListLoading, setEntryListLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<number | null>(null);
  const [authDialog, setAuthDialog] = useState<{
    open: boolean;
    moduleId?: number;
    moduleName?: string;
  }>({ open: false });
  const [filterAppCode, setFilterAppCode] = useState<string>();
  const appCode = Form.useWatch("app_code", form);

  const fetchModuleList = async (appCode = filterAppCode ?? "") => {
    setLoading(true);
    try {
      const res = await getModuleList({ app_code: appCode });
      setModuleList(res.row_list ?? []);
    } catch {
      message.error("获取模块列表失败");
      setModuleList([]);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingRecordId(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (record: ModuleRow) => {
    setEditingRecordId(record?.module_id ?? null);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const handleModalCancel = () => {
    setModalOpen(false);
    setEditingRecordId(null);
    form.resetFields();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      if (editingRecordId != null) {
        await saveModuleProperty({
          module_id: editingRecordId,
          module_property: {
            ...values,
          },
        });
        message.success("保存成功");
      } else {
        await newModule(values);
        message.success("新增成功");
      }

      handleModalCancel();
      fetchModuleList();
    } catch {
      // 校验失败或接口错误由拦截器处理
    } finally {
      setSubmitting(false);
    }
  };

  const openAuthDialog = (record: ModuleRow) => {
    if (record.module_id == null) return;
    setAuthDialog({
      open: true,
      moduleId: record.module_id,
      moduleName: record.module_name,
    });
  };

  const handleDelete = async (record: ModuleRow) => {
    setLoading(true);
    try {
      await deleteModule({ module_id: record.module_id });
      message.success("删除成功");
      fetchModuleList();
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const fetchAppList = async () => {
    setAppListLoading(true);
    try {
      const res = await getAppList({});
      setAppList(res.app_list ?? []);
    } catch {
      setAppList([]);
    } finally {
      setAppListLoading(false);
    }
  };

  const fetchEntryList = async (code: string) => {
    const requestId = ++entryRequestRef.current;
    if (!code) {
      setEntryList([]);
      setEntryListLoading(false);
      return;
    }
    setEntryList(mergeAppEntries(code, []));
    setEntryListLoading(true);
    try {
      const res = await getAppEntryList({ app_code: code });
      if (requestId === entryRequestRef.current) {
        setEntryList(mergeAppEntries(code, res.row_list ?? []));
      }
    } catch {
      if (requestId === entryRequestRef.current) {
        setEntryList(mergeAppEntries(code, []));
      }
    } finally {
      if (requestId === entryRequestRef.current) {
        setEntryListLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchAppList();
    fetchModuleList();
  }, []);

  useEffect(() => {
    if (modalOpen && appCode) {
      fetchEntryList(appCode);
    } else {
      entryRequestRef.current += 1;
      setEntryList([]);
      setEntryListLoading(false);
    }
    return () => { entryRequestRef.current += 1; };
  }, [modalOpen, appCode]);

  const columns = [
    {
      title: "模块ID",
      dataIndex: "module_id",
      key: "module_id",
      sorter: (a: ModuleRow, b: ModuleRow) => (a.module_id ?? 0) - (b.module_id ?? 0),
      width: 100,
    },
    {
      title: "图标",
      dataIndex: "icon_name",
      key: "icon_name",
      width: 60,
      render: (iconName: string) => renderMenuIcon(iconName),
    },
    { title: "模块名称", dataIndex: "module_name", key: "module_name" },
    { title: "页面名称", dataIndex: "entry_name", key: "entry_name" },
    { title: "页面代码", dataIndex: "entry_code", key: "entry_code" },
    {
      title: "状态",
      dataIndex: "valid_status",
      key: "valid_status",
      width: 60,
      render: (text: string) => (
        <Tag color={text === "1" ? "green" : "red"}>
          {text === "1" ? "有效" : "无效"}
        </Tag>
      ),
    },
    {
      title: "操作",
      key: "action",
      width: 180,
      render: (record: ModuleRow) => (
        <Space>
          <Button
            color="primary"
            variant="outlined"
            size="small"
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            color="primary"
            variant="outlined"
            size="small"
            onClick={() => openAuthDialog(record)}
          >
            授权
          </Button>
          <Popconfirm
            title="确定删除该模块吗？"
            onConfirm={() => handleDelete(record)}
          >
            <Button color="danger" variant="outlined" size="small">
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="box-border p-2 flex flex-col h-full min-h-0 min-w-0">
      <div className="flex justify-between mb-2 shrink-0">
        <Select
          className="w-50"
          placeholder="请选择应用"
          loading={appListLoading}
          showSearch
          allowClear
          value={filterAppCode}
          options={appList}
          fieldNames={{ value: "app_code", label: "app_name" }}
          onChange={(value?: string) => {
            setFilterAppCode(value);
            fetchModuleList(value ?? "");
          }}
        />
        <Button color="primary" variant="outlined" onClick={openCreateModal}>
          新增
        </Button>
      </div>
      <div className="flex-1 min-h-0 min-w-0" ref={tableContainerRef}>
        <Table
          columns={columns}
          dataSource={moduleList}
          rowKey="module_id"
          scroll={{ x: "max-content", y: scrollY }}
          pagination={false}
          loading={loading}
        />
      </div>
      <Modal
        title={editingRecordId ? "编辑模块" : "新增模块"}
        open={modalOpen}
        onCancel={handleModalCancel}
        onOk={handleSubmit}
        confirmLoading={submitting}
        destroyOnHidden
        width={600}
        styles={{ body: { maxHeight: "70vh", overflowY: "auto" } }}
      >
        <Form form={form} {...layout}>
          <Form.Item
            name="app_code"
            label="应用"
            rules={[{ required: true, message: "请选择应用" }]}
          >
            <Select
              placeholder="请选择应用"
              loading={appListLoading}
              showSearch
              options={appList}
              fieldNames={{ value: "app_code", label: "app_name" }}
              onChange={(value) => {
                const app = appList.find((item) => item.app_code === value);
                form.setFieldsValue({
                  app_name: app?.app_name,
                  entry_code: undefined,
                  entry_name: undefined,
                });
              }}
            />
          </Form.Item>
          <Form.Item name="app_name" hidden>
            <Input />
          </Form.Item>
          <Form.Item
            name="entry_code"
            label="页面"
            rules={[{ required: true, message: "请选择页面" }]}
          >
            <Select
              placeholder="请选择页面"
              loading={entryListLoading}
              disabled={!appCode}
              showSearch
              options={entryList}
              fieldNames={{ value: "entry_code", label: "entry_name" }}
              onChange={(value) => {
                const entry = entryList.find(
                  (item) => item.entry_code === value,
                );
                form.setFieldsValue({
                  entry_name: entry?.entry_name,
                  module_name: entry?.entry_name,
                });
              }}
            />
          </Form.Item>
          <Form.Item name="entry_name" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="entry_arg" label="页面参数">
            <Input.TextArea rows={3} placeholder="请输入页面参数" />
          </Form.Item>
          <Form.Item
            name="module_name"
            label="模块名称"
            rules={[{ required: true, message: "请输入模块名称" }]}
          >
            <Input placeholder="请输入模块名称" />
          </Form.Item>
          <Form.Item name="icon_name" label="图标" initialValue={DEFAULT_ICON}>
            <IconPicker variant="field" />
          </Form.Item>
          <Divider plain>外部超链接</Divider>
          <Form.Item name="ext_url" label="外部超链接">
            <Input placeholder="请输入外部超链接" maxLength={1000} />
          </Form.Item>
          <Divider plain>Windows外部应用</Divider>
          <Form.Item name="ext_file_win" label="文件名">
            <Input placeholder="请输入文件名" maxLength={100} />
          </Form.Item>
          <Form.Item name="ext_path_win" label="路径">
            <Input placeholder="请输入路径" maxLength={100} />
          </Form.Item>
          <Form.Item name="ext_arg_win" label="参数列表">
            <Input placeholder="请输入参数列表" maxLength={100} />
          </Form.Item>
          <Divider plain>Linux外部应用</Divider>
          <Form.Item name="ext_file_linux" label="路径">
            <Input placeholder="请输入路径" maxLength={100} />
          </Form.Item>
          <Form.Item name="ext_path_linux" label="文件名">
            <Input placeholder="请输入文件名" maxLength={100} />
          </Form.Item>
          <Form.Item name="ext_arg_linux" label="参数列表">
            <Input placeholder="请输入参数列表" maxLength={100} />
          </Form.Item>
          <Divider plain>Mac外部应用</Divider>
          <Form.Item name="ext_file_mac" label="路径">
            <Input placeholder="请输入路径" maxLength={100} />
          </Form.Item>
          <Form.Item name="ext_path_mac" label="文件名">
            <Input placeholder="请输入文件名" maxLength={100} />
          </Form.Item>
          <Form.Item name="ext_arg_mac" label="参数列表">
            <Input placeholder="请输入参数列表" maxLength={100} />
          </Form.Item>
        </Form>
      </Modal>
      <ModuleAuthDialog
        open={authDialog.open}
        moduleId={authDialog.moduleId}
        moduleName={authDialog.moduleName}
        onClose={() => setAuthDialog({ open: false })}
      />
      {navbarSlot &&
        !loading &&
        createPortal(
          <span className="text-sm text-white">
            共 {moduleList.length} 个模块
          </span>,
          navbarSlot,
        )}
    </div>
  );
};

export default ModuleManagement;
