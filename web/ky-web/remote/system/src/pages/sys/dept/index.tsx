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
  Table,
  TreeSelect,
} from "antd";
import type { TableColumnsType } from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  addDept,
  deleteDept,
  getDeptInfo,
  getDeptList,
  updateDept,
  type DeptCommand,
  type DeptDTO,
} from "@/api/system/dept";
import {
  OptionTag,
  STATUS_OPTIONS,
  collectTreeKeys,
  formatTime,
  toTree,
  type TreeNode,
  type TreeOption,
} from "../shared";
import "../sys-page.scss";

interface SearchValues {
  deptName?: string;
  status?: number;
}

type FormValues = Omit<DeptCommand, "deptId">;

interface EditState {
  dept?: DeptDTO;
  parentId: number;
}

/** 部门下拉树；禁用已停用部门及正在编辑的部门自身（及其子树） */
const toTreeOptions = (
  nodes: TreeNode<DeptDTO>[],
  excludeId?: number,
): TreeOption[] =>
  nodes
    .filter((node) => node.id !== excludeId)
    .map((node) => ({
      value: node.id,
      title: node.deptName,
      disabled: node.status === 0,
      children: node.children && toTreeOptions(node.children, excludeId),
    }));

const filterTree = (
  nodes: TreeNode<DeptDTO>[],
  match: (dept: DeptDTO) => boolean,
): TreeNode<DeptDTO>[] =>
  nodes.flatMap((node) => {
    const children = node.children && filterTree(node.children, match);
    if (match(node) || children?.length)
      return [{ ...node, children: children?.length ? children : undefined }];
    return [];
  });

export default function DeptPage() {
  const { message } = App.useApp();
  const [searchForm] = Form.useForm<SearchValues>();
  const [editForm] = Form.useForm<FormValues>();
  const [list, setList] = useState<DeptDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<SearchValues>({});
  const [expandedKeys, setExpandedKeys] = useState<Key[]>([]);
  const [editing, setEditing] = useState<EditState>();
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setList((await getDeptList()) ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const tree = useMemo(
    () => toTree(list, "id", "parentId", "orderNum"),
    [list],
  );

  const visibleTree = useMemo(() => {
    const keyword = filters.deptName?.trim();
    if (!keyword && filters.status == null) return tree;
    return filterTree(
      tree,
      (dept) =>
        (!keyword || dept.deptName.includes(keyword)) &&
        (filters.status == null || dept.status === filters.status),
    );
  }, [tree, filters]);

  useEffect(() => {
    setExpandedKeys(collectTreeKeys(visibleTree, "id"));
  }, [visibleTree]);

  const parentOptions = useMemo<TreeOption[]>(
    () => [
      {
        value: 0,
        title: "顶级部门",
        children: toTreeOptions(tree, editing?.dept?.id),
      },
    ],
    [tree, editing],
  );

  const openEdit = async (dept: DeptDTO) => {
    const detail = await getDeptInfo(dept.id);
    setEditing({ dept: detail ?? dept, parentId: (detail ?? dept).parentId });
  };

  const remove = async (dept: DeptDTO) => {
    await deleteDept(dept.id);
    message.success("删除成功");
    void load();
  };

  const submit = async () => {
    const values = await editForm.validateFields();
    setSaving(true);
    try {
      if (editing?.dept) await updateDept(editing.dept.id, values);
      else await addDept(values);
      message.success(editing?.dept ? "修改成功" : "新增成功");
      setEditing(undefined);
      void load();
    } finally {
      setSaving(false);
    }
  };

  const columns: TableColumnsType<TreeNode<DeptDTO>> = [
    { title: "部门名称", dataIndex: "deptName", width: 240 },
    { title: "部门编号", dataIndex: "id", width: 100 },
    { title: "负责人", dataIndex: "leaderName", width: 120 },
    { title: "联系电话", dataIndex: "phone", width: 140 },
    {
      title: "状态",
      dataIndex: "status",
      width: 90,
      render: (value) => <OptionTag options={STATUS_OPTIONS} value={value} />,
    },
    { title: "排序", dataIndex: "orderNum", width: 80 },
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
      width: 220,
      render: (_, row) => (
        <Space size={0}>
          <Button
            type="link"
            size="small"
            icon={<PlusOutlined />}
            disabled={row.status === 0}
            onClick={() => setEditing({ parentId: row.id })}
          >
            新增
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => void openEdit(row)}
          >
            修改
          </Button>
          <Popconfirm
            title={`确认删除部门「${row.deptName}」吗？`}
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
        onFinish={setFilters}
      >
        <Form.Item name="deptName" label="部门名称">
          <Input placeholder="请输入部门名称" allowClear />
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
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
              搜索
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                searchForm.resetFields();
                setFilters({});
                void load();
              }}
            >
              重置
            </Button>
          </Space>
        </Form.Item>
      </Form>

      <div className="sys-page__panel">
        <div className="sys-page__toolbar">
          <span className="sys-page__title">部门列表</span>
          <Space wrap>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setEditing({ parentId: 0 })}
            >
              新增部门
            </Button>
            <Button
              onClick={() =>
                setExpandedKeys((keys) =>
                  keys.length ? [] : collectTreeKeys(visibleTree, "id"),
                )
              }
            >
              {expandedKeys.length ? "折叠全部" : "展开全部"}
            </Button>
          </Space>
        </div>
        <Table<TreeNode<DeptDTO>>
          rowKey="id"
          size="middle"
          loading={loading}
          columns={columns}
          dataSource={visibleTree}
          pagination={false}
          scroll={{ x: 1100 }}
          expandable={{
            expandedRowKeys: expandedKeys,
            onExpandedRowsChange: (keys) => setExpandedKeys([...keys]),
          }}
        />
      </div>

      <Modal
        title={editing?.dept ? "修改部门" : "新增部门"}
        open={editing !== undefined}
        onCancel={() => setEditing(undefined)}
        onOk={() => void submit()}
        confirmLoading={saving}
        destroyOnHidden
        maskClosable={false}
        width={640}
      >
        <Form<FormValues>
          form={editForm}
          layout="vertical"
          preserve={false}
          className="sys-form__grid"
          initialValues={{
            parentId: editing?.parentId ?? 0,
            deptName: editing?.dept?.deptName,
            leaderName: editing?.dept?.leaderName,
            phone: editing?.dept?.phone,
            email: editing?.dept?.email,
            orderNum: editing?.dept?.orderNum ?? 0,
            status: editing?.dept?.status ?? 1,
          }}
        >
          <Form.Item
            name="parentId"
            label="上级部门"
            className="sys-form__wide"
            rules={[{ required: true, message: "请选择上级部门" }]}
          >
            <TreeSelect
              treeData={parentOptions}
              treeDefaultExpandAll
              showSearch={{ treeNodeFilterProp: "title" }}
              placeholder="请选择上级部门"
            />
          </Form.Item>
          <Form.Item
            name="deptName"
            label="部门名称"
            rules={[
              { required: true, whitespace: true, message: "请输入部门名称" },
              { max: 30 },
            ]}
          >
            <Input placeholder="请输入部门名称" />
          </Form.Item>
          <Form.Item name="leaderName" label="负责人">
            <Input placeholder="请输入负责人" />
          </Form.Item>
          <Form.Item
            name="phone"
            label="联系电话"
            rules={[
              { pattern: /^1[3-9]\d{9}$/, message: "请输入正确的手机号码" },
            ]}
          >
            <Input placeholder="请输入联系电话" maxLength={11} />
          </Form.Item>
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { type: "email", message: "请输入正确的邮箱" },
              { max: 50 },
            ]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item
            name="orderNum"
            label="排序"
            rules={[{ required: true, message: "请输入排序" }]}
          >
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Radio.Group options={STATUS_OPTIONS} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
