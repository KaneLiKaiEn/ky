import { useEffect, useMemo, useState, type Key } from "react";
import {
  App,
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Radio,
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Tree,
} from "antd";
import type { TableColumnsType, TreeDataNode } from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { eventBus } from "comm/eventBus";
import { getSessionId } from "comm/session";
import {
  addRole,
  changeRoleStatus,
  deleteRole,
  getRoleInfo,
  getRoleList,
  updateRole,
  type RoleDTO,
  type RoleQuery,
} from "@/api/system/role";
import { getMenuList, type MenuDTO } from "@/api/system/menu";
import {
  OptionTag,
  STATUS_OPTIONS,
  formatTime,
  toTree,
  type TreeNode,
  usePagedList,
} from "../shared";
import "../sys-page.scss";

type SearchValues = Pick<RoleQuery, "roleName" | "roleKey" | "status">;

interface FormValues {
  roleName: string;
  roleKey: string;
  roleSort: number;
  status: number;
  remark?: string;
}

const toTreeData = (nodes: TreeNode<MenuDTO>[]): TreeDataNode[] =>
  nodes.map((node) => ({
    key: node.id,
    title: node.menuName,
    children: node.children && toTreeData(node.children),
  }));

/** 角色权限变更后通知 Host 刷新菜单 */
const notifyRolesChanged = () => {
  const sessionId = getSessionId();
  if (sessionId) eventBus.emit("system:roles-changed", { sessionId });
};

export default function RolePage() {
  const { message, modal } = App.useApp();
  const [searchForm] = Form.useForm<SearchValues>();
  const [editForm] = Form.useForm<FormValues>();
  const { rows, loading, pagination, search, reload } = usePagedList(
    getRoleList,
    {} as RoleQuery,
  );
  const [menus, setMenus] = useState<MenuDTO[]>([]);
  const [editing, setEditing] = useState<RoleDTO | null | undefined>();
  const [detailLoading, setDetailLoading] = useState(false);
  const [checkedMenuIds, setCheckedMenuIds] = useState<Key[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getMenuList()
      .then((list) => setMenus(list ?? []))
      .catch(() => undefined);
  }, []);

  const menuTree = useMemo(
    () => toTreeData(toTree(menus, "id", "parentId", "rank")),
    [menus],
  );

  const openAdd = () => {
    setCheckedMenuIds([]);
    setEditing(null);
  };

  const openEdit = async (role: RoleDTO) => {
    setCheckedMenuIds([]);
    setEditing(role);
    setDetailLoading(true);
    try {
      const detail = await getRoleInfo(role.roleId);
      setEditing(detail ?? role);
      setCheckedMenuIds(detail?.selectedMenuList ?? []);
    } finally {
      setDetailLoading(false);
    }
  };

  const remove = async (role: RoleDTO) => {
    await deleteRole(role.roleId);
    message.success("删除成功");
    void reload();
  };

  const toggleStatus = (role: RoleDTO, enabled: boolean) => {
    modal.confirm({
      title: "系统提示",
      content: `确认要${enabled ? "启用" : "停用"}角色「${role.roleName}」吗？`,
      onOk: async () => {
        await changeRoleStatus(role.roleId, enabled ? 1 : 0);
        message.success("已修改角色状态");
        void reload();
      },
    });
  };

  const submit = async () => {
    const values = await editForm.validateFields();
    setSaving(true);
    try {
      const data = {
        ...values,
        status: String(values.status),
        menuIds: checkedMenuIds.map(Number),
      };
      if (editing) {
        await updateRole({
          ...data,
          roleId: editing.roleId,
          dataScope:
            editing.dataScope == null ? undefined : String(editing.dataScope),
        });
      } else {
        await addRole(data);
      }
      message.success(editing ? "修改成功" : "新增成功");
      setEditing(undefined);
      notifyRolesChanged();
      void reload();
    } finally {
      setSaving(false);
    }
  };

  const columns: TableColumnsType<RoleDTO> = [
    { title: "角色编号", dataIndex: "roleId", width: 100 },
    { title: "角色名称", dataIndex: "roleName", width: 160 },
    { title: "角色标识", dataIndex: "roleKey", width: 160 },
    { title: "排序", dataIndex: "roleSort", width: 80 },
    {
      title: "状态",
      dataIndex: "status",
      width: 100,
      render: (value: number, row) => (
        <Switch
          checked={value === 1}
          checkedChildren="正常"
          unCheckedChildren="停用"
          onChange={(checked) => toggleStatus(row, checked)}
        />
      ),
    },
    { title: "备注", dataIndex: "remark", ellipsis: true },
    {
      title: "创建时间",
      dataIndex: "createTime",
      width: 180,
      render: formatTime,
    },
    {
      title: "操作",
      key: "actions",
      fixed: "right",
      width: 150,
      render: (_, row) => (
        <Space size={0}>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => void openEdit(row)}
          >
            修改
          </Button>
          <Popconfirm
            title={`确认删除角色「${row.roleName}」吗？`}
            onConfirm={() => remove(row)}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="sys-page">
      <Form
        form={searchForm}
        layout="inline"
        className="sys-page__search"
        onFinish={search}
      >
        <Form.Item name="roleName" label="角色名称">
          <Input placeholder="请输入角色名称" allowClear />
        </Form.Item>
        <Form.Item name="roleKey" label="角色标识">
          <Input placeholder="请输入角色标识" allowClear />
        </Form.Item>
        <Form.Item name="status" label="状态">
          <Select
            placeholder="请选择"
            allowClear
            options={STATUS_OPTIONS}
            style={{ width: 140 }}
          />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SearchOutlined />}
              loading={loading}
            >
              搜索
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                searchForm.resetFields();
                search({
                  roleName: undefined,
                  roleKey: undefined,
                  status: undefined,
                });
              }}
            >
              重置
            </Button>
          </Space>
        </Form.Item>
      </Form>

      <div className="sys-page__panel">
        <div className="sys-page__toolbar">
          <span className="sys-page__title">角色列表</span>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
            新增角色
          </Button>
        </div>
        <Table<RoleDTO>
          rowKey="roleId"
          size="middle"
          loading={loading}
          columns={columns}
          dataSource={rows}
          pagination={pagination}
          scroll={{ x: 1000 }}
        />
      </div>

      <Modal
        title={editing ? "修改角色" : "新增角色"}
        open={editing !== undefined}
        onCancel={() => setEditing(undefined)}
        onOk={() => void submit()}
        confirmLoading={saving}
        okButtonProps={{ disabled: detailLoading }}
        destroyOnHidden
        maskClosable={false}
        width={640}
      >
        <Spin spinning={detailLoading}>
          <Form<FormValues>
            key={editing?.roleId ?? "new"}
            form={editForm}
            layout="vertical"
            preserve={false}
            className="sys-form__grid"
            initialValues={{
              roleName: editing?.roleName,
              roleKey: editing?.roleKey,
              roleSort: editing?.roleSort ?? 0,
              status: editing?.status ?? 1,
              remark: editing?.remark,
            }}
          >
            <Form.Item
              name="roleName"
              label="角色名称"
              rules={[
                { required: true, whitespace: true, message: "请输入角色名称" },
                { max: 30 },
              ]}
            >
              <Input placeholder="请输入角色名称" />
            </Form.Item>
            <Form.Item
              name="roleKey"
              label="权限字符"
              rules={[
                { required: true, whitespace: true, message: "请输入权限字符" },
                { max: 100 },
              ]}
            >
              <Input placeholder="如 admin" />
            </Form.Item>
            <Form.Item
              name="roleSort"
              label="角色顺序"
              rules={[{ required: true, message: "请输入角色顺序" }]}
            >
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="status" label="角色状态">
              <Radio.Group options={STATUS_OPTIONS} />
            </Form.Item>
            <Form.Item label="菜单权限" className="sys-form__wide">
              <div className="sys-form__tree">
                <Tree
                  checkable
                  checkStrictly
                  defaultExpandAll
                  treeData={menuTree}
                  checkedKeys={checkedMenuIds}
                  onCheck={(keys) =>
                    setCheckedMenuIds(Array.isArray(keys) ? keys : keys.checked)
                  }
                />
              </div>
            </Form.Item>
            <Form.Item name="remark" label="备注" className="sys-form__wide">
              <Input.TextArea rows={3} placeholder="请输入备注" />
            </Form.Item>
          </Form>
        </Spin>
      </Modal>
    </div>
  );
}
