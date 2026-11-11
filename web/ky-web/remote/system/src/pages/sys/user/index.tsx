import { useEffect, useState } from "react";
import {
  App,
  Button,
  Dropdown,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Upload,
} from "antd";
import type { TableColumnsType } from "antd";
import {
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  KeyOutlined,
  MoreOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { request } from "comm/request";
import { getDeptList, type DeptDTO } from "@/api/system/dept";
import { getPostList, type PostDTO } from "@/api/system/post";
import { getRoleList, type RoleDTO } from "@/api/system/role";
import {
  changeUserStatus,
  deleteUsers,
  exportUserExcel,
  getUserList,
  resetUserPassword,
  type UserDTO,
  type UserQuery,
} from "@/api/system/user";
import {
  OptionTag,
  SEX_OPTIONS,
  USER_STATUS_OPTIONS,
  formatTime,
  usePagedList,
} from "../shared";
import DeptTree from "./DeptTree";
import UserFormModal from "./UserFormModal";
import "../sys-page.scss";

type SearchValues = Pick<
  UserQuery,
  "userId" | "username" | "phoneNumber" | "status"
>;

/** 后端分页上限 MAX_PAGE_SIZE */
const ALL_OPTIONS = { pageNum: 1, pageSize: 500 };

export default function UserPage() {
  const { message, modal } = App.useApp();
  const [searchForm] = Form.useForm<SearchValues>();
  const [passwordForm] = Form.useForm<{ password: string }>();
  const { query, rows, loading, pagination, search, reload } = usePagedList(
    getUserList,
    {} as UserQuery,
  );
  const [depts, setDepts] = useState<DeptDTO[]>([]);
  const [deptLoading, setDeptLoading] = useState(false);
  const [roles, setRoles] = useState<RoleDTO[]>([]);
  const [posts, setPosts] = useState<PostDTO[]>([]);
  const [formState, setFormState] = useState<{ user?: UserDTO }>();
  const [passwordUser, setPasswordUser] = useState<UserDTO>();
  const [savingPassword, setSavingPassword] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    setDeptLoading(true);
    getDeptList()
      .then((list) => setDepts(list ?? []))
      .catch(() => undefined)
      .finally(() => setDeptLoading(false));
    getRoleList(ALL_OPTIONS)
      .then((page) => setRoles(page?.rows ?? []))
      .catch(() => undefined);
    getPostList(ALL_OPTIONS)
      .then((page) => setPosts(page?.rows ?? []))
      .catch(() => undefined);
  }, []);

  const remove = async (user: UserDTO) => {
    await deleteUsers([user.userId]);
    message.success("删除成功");
    void reload();
  };

  const toggleStatus = (user: UserDTO, enabled: boolean) => {
    modal.confirm({
      title: "系统提示",
      content: `确认要${enabled ? "启用" : "禁用"}用户「${user.username}」吗？`,
      onOk: async () => {
        await changeUserStatus(user.userId, enabled ? 1 : 2);
        message.success("已修改用户状态");
        void reload();
      },
    });
  };

  const submitPassword = async () => {
    if (!passwordUser) return;
    const { password } = await passwordForm.validateFields();
    setSavingPassword(true);
    try {
      await resetUserPassword(passwordUser.userId, password);
      message.success(`已重置用户「${passwordUser.username}」的密码`);
      setPasswordUser(undefined);
    } finally {
      setSavingPassword(false);
    }
  };

  const importExcel = async (file: File) => {
    const data = new FormData();
    data.append("file", file);
    setImporting(true);
    try {
      await request.post<void>("/system/users/excel", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      message.success("导入成功");
      void reload();
    } finally {
      setImporting(false);
    }
  };

  const columns: TableColumnsType<UserDTO> = [
    { title: "用户编号", dataIndex: "userId", width: 90, fixed: "left" },
    { title: "用户名", dataIndex: "username", width: 130 },
    { title: "昵称", dataIndex: "nickname", width: 130 },
    {
      title: "性别",
      dataIndex: "sex",
      width: 80,
      render: (value: number) => {
        const option = SEX_OPTIONS.find((item) => item.value === value);
        return option ? <Tag>{option.label}</Tag> : null;
      },
    },
    { title: "部门", dataIndex: "deptName", width: 140 },
    { title: "手机号码", dataIndex: "phoneNumber", width: 130 },
    { title: "角色", dataIndex: "roleName", width: 120 },
    {
      title: "状态",
      dataIndex: "status",
      width: 110,
      render: (value: number, row) =>
        value === 1 || value === 2 ? (
          <Switch
            checked={value === 1}
            checkedChildren="正常"
            unCheckedChildren="禁用"
            onChange={(checked) => toggleStatus(row, checked)}
          />
        ) : (
          <OptionTag options={USER_STATUS_OPTIONS} value={value} />
        ),
    },
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
      width: 190,
      render: (_, row) => (
        <Space size={0}>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => setFormState({ user: row })}
          >
            修改
          </Button>
          <Popconfirm
            title={`确认删除用户「${row.username}」吗？`}
            onConfirm={() => remove(row)}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
          <Dropdown
            menu={{
              items: [
                { key: "password", icon: <KeyOutlined />, label: "重置密码" },
              ],
              onClick: () => setPasswordUser(row),
            }}
          >
            <Button type="link" size="small" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      ),
    },
  ];

  return (
    <div className="sys-page">
      <div className="sys-page__body">
        <aside className="sys-page__aside">
          <DeptTree
            depts={depts}
            loading={deptLoading}
            value={query.deptId}
            onChange={(deptId) => search({ deptId })}
          />
        </aside>

        <div className="sys-page__main">
          <Form
            form={searchForm}
            layout="inline"
            className="sys-page__search"
            onFinish={search}
          >
            <Form.Item name="userId" label="用户编号">
              <InputNumber
                placeholder="请输入用户编号"
                min={1}
                style={{ width: 160 }}
              />
            </Form.Item>
            <Form.Item name="username" label="用户名">
              <Input placeholder="请输入用户名" allowClear />
            </Form.Item>
            <Form.Item name="phoneNumber" label="手机号码">
              <Input placeholder="请输入手机号码" allowClear />
            </Form.Item>
            <Form.Item name="status" label="状态">
              <Select
                placeholder="请选择"
                allowClear
                options={USER_STATUS_OPTIONS}
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
                      userId: undefined,
                      username: undefined,
                      phoneNumber: undefined,
                      status: undefined,
                      deptId: undefined,
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
              <span className="sys-page__title">用户列表</span>
              <Space wrap>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setFormState({})}
                >
                  新增用户
                </Button>
                <Upload
                  accept=".xls,.xlsx"
                  showUploadList={false}
                  beforeUpload={(file) => {
                    void importExcel(file);
                    return false;
                  }}
                >
                  <Button icon={<UploadOutlined />} loading={importing}>
                    导入
                  </Button>
                </Upload>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={() =>
                    void request.download(
                      "/system/users/excelTemplate",
                      "用户导入模板.xlsx",
                    )
                  }
                >
                  导入模板
                </Button>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={() => void exportUserExcel(query)}
                >
                  导出
                </Button>
              </Space>
            </div>
            <Table<UserDTO>
              rowKey="userId"
              size="middle"
              loading={loading}
              columns={columns}
              dataSource={rows}
              pagination={pagination}
              scroll={{ x: 1300 }}
            />
          </div>
        </div>
      </div>

      <UserFormModal
        open={formState !== undefined}
        user={formState?.user}
        defaultDeptId={query.deptId}
        depts={depts}
        roles={roles}
        posts={posts}
        onClose={() => setFormState(undefined)}
        onSaved={() => {
          setFormState(undefined);
          void reload();
        }}
      />

      <Modal
        title={`重置密码${passwordUser ? `：${passwordUser.username}` : ""}`}
        open={passwordUser !== undefined}
        onCancel={() => setPasswordUser(undefined)}
        onOk={() => void submitPassword()}
        confirmLoading={savingPassword}
        destroyOnHidden
        maskClosable={false}
      >
        <Form form={passwordForm} layout="vertical" preserve={false}>
          <Form.Item
            name="password"
            label="新密码"
            rules={[{ required: true, message: "请输入新密码" }]}
          >
            <Input.Password
              placeholder="请输入新密码"
              autoComplete="new-password"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
