import { useEffect, useMemo, useState } from "react";
import { App, Form, Input, Modal, Radio, Select, Spin, TreeSelect } from "antd";
import type { DeptDTO } from "@/api/system/dept";
import type { PostDTO } from "@/api/system/post";
import type { RoleDTO } from "@/api/system/role";
import {
  addUser,
  getUserDetail,
  updateUser,
  type UserCommand,
  type UserDTO,
} from "@/api/system/user";
import {
  SEX_OPTIONS,
  USER_STATUS_OPTIONS,
  toTree,
  type TreeNode,
  type TreeOption,
} from "../shared";

type FormValues = Omit<UserCommand, "userId">;

const toDeptOptions = (nodes: TreeNode<DeptDTO>[]): TreeOption[] =>
  nodes.map((node) => ({
    value: node.id,
    title: node.deptName,
    disabled: node.status === 0,
    children: node.children && toDeptOptions(node.children),
  }));

export default function UserFormModal({
  open,
  user,
  defaultDeptId,
  depts,
  roles,
  posts,
  onClose,
  onSaved,
}: {
  open: boolean;
  /** 为空表示新增 */
  user?: UserDTO;
  defaultDeptId?: number;
  depts: DeptDTO[];
  roles: RoleDTO[];
  posts: PostDTO[];
  onClose(): void;
  onSaved(): void;
}) {
  const { message } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  const [detail, setDetail] = useState<UserDTO>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDetail(undefined);
    if (!open || !user) return;
    let cancelled = false;
    setLoading(true);
    getUserDetail(user.userId)
      .then((res) => {
        if (!cancelled) setDetail(res?.user ?? user);
      })
      .catch(() => {
        if (!cancelled) setDetail(user);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, user]);

  const deptOptions = useMemo(
    () => toDeptOptions(toTree(depts, "id", "parentId", "orderNum")),
    [depts],
  );

  const submit = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      if (user) await updateUser(user.userId, values);
      else await addUser(values);
      message.success(user ? "修改成功" : "新增成功");
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  const source = user ? detail : undefined;
  const ready = !user || !!detail;

  return (
    <Modal
      title={user ? "修改用户" : "新增用户"}
      open={open}
      onCancel={onClose}
      onOk={() => void submit()}
      confirmLoading={saving}
      okButtonProps={{ disabled: !ready }}
      destroyOnHidden
      maskClosable={false}
      width={720}
    >
      <Spin spinning={loading}>
        {ready && (
          <Form<FormValues>
            form={form}
            layout="vertical"
            preserve={false}
            className="sys-form__grid"
            initialValues={{
              username: source?.username,
              nickname: source?.nickname,
              deptId: source?.deptId ?? defaultDeptId,
              phoneNumber: source?.phoneNumber,
              email: source?.email,
              sex: source?.sex,
              postId: source?.postId,
              roleId: source?.roleId,
              status: source?.status ?? 1,
              remark: source?.remark,
            }}
          >
            <Form.Item
              name="username"
              label="用户名"
              rules={[
                { required: true, whitespace: true, message: "请输入用户名" },
              ]}
            >
              <Input placeholder="请输入用户名" disabled={!!user} />
            </Form.Item>
            <Form.Item
              name="nickname"
              label="昵称"
              rules={[
                { required: true, whitespace: true, message: "请输入昵称" },
              ]}
            >
              <Input placeholder="请输入昵称" />
            </Form.Item>
            <Form.Item
              name="deptId"
              label="部门"
              rules={[{ required: true, message: "请选择部门" }]}
            >
              <TreeSelect
                treeData={deptOptions}
                treeDefaultExpandAll
                showSearch={{ treeNodeFilterProp: "title" }}
                placeholder="请选择部门"
                allowClear
              />
            </Form.Item>
            <Form.Item
              name="phoneNumber"
              label="手机号码"
              rules={[
                { pattern: /^1[3-9]\d{9}$/, message: "请输入正确的手机号码" },
              ]}
            >
              <Input placeholder="请输入手机号码" maxLength={11} />
            </Form.Item>
            <Form.Item
              name="email"
              label="邮箱"
              rules={[{ type: "email", message: "请输入正确的邮箱" }]}
            >
              <Input placeholder="请输入邮箱" />
            </Form.Item>
            <Form.Item name="sex" label="性别">
              <Select
                placeholder="请选择性别"
                allowClear
                options={SEX_OPTIONS}
              />
            </Form.Item>
            <Form.Item name="postId" label="岗位">
              <Select
                placeholder="请选择岗位"
                allowClear
                options={posts.map((post) => ({
                  label: post.postName,
                  value: post.postId,
                  disabled: post.status === 0,
                }))}
              />
            </Form.Item>
            <Form.Item name="roleId" label="角色">
              <Select
                placeholder="请选择角色"
                allowClear
                options={roles.map((role) => ({
                  label: role.roleName,
                  value: role.roleId,
                  disabled: role.status === 0,
                }))}
              />
            </Form.Item>
            <Form.Item name="status" label="状态">
              <Radio.Group options={USER_STATUS_OPTIONS} />
            </Form.Item>
            {!user && (
              <Form.Item
                name="password"
                label="密码"
                rules={[{ required: true, message: "请输入密码" }]}
              >
                <Input.Password
                  placeholder="请输入密码"
                  autoComplete="new-password"
                />
              </Form.Item>
            )}
            <Form.Item name="remark" label="备注" className="sys-form__wide">
              <Input.TextArea rows={3} placeholder="请输入备注" />
            </Form.Item>
          </Form>
        )}
      </Spin>
    </Modal>
  );
}
