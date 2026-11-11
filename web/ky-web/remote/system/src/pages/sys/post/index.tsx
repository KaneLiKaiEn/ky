import { useState } from "react";
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
} from "antd";
import type { TableColumnsType } from "antd";
import {
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  addPost,
  deletePosts,
  exportPostExcel,
  getPostList,
  updatePost,
  type PostCommand,
  type PostDTO,
  type PostQuery,
} from "@/api/system/post";
import { OptionTag, STATUS_OPTIONS, formatTime, usePagedList } from "../shared";
import "../sys-page.scss";

type SearchValues = Pick<PostQuery, "postCode" | "postName" | "status">;

interface FormValues {
  postCode: string;
  postName: string;
  postSort: number;
  status: number;
  remark?: string;
}

export default function PostPage() {
  const { message } = App.useApp();
  const [searchForm] = Form.useForm<SearchValues>();
  const [editForm] = Form.useForm<FormValues>();
  const { query, rows, loading, pagination, search, reload } = usePagedList(
    getPostList,
    {} as PostQuery,
  );
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [editing, setEditing] = useState<PostDTO | null | undefined>();
  const [saving, setSaving] = useState(false);

  const remove = async (ids: number[]) => {
    await deletePosts(ids);
    message.success("删除成功");
    setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
    void reload();
  };

  const submit = async () => {
    const values = await editForm.validateFields();
    const data: PostCommand = { ...values, status: String(values.status) };
    setSaving(true);
    try {
      if (editing) await updatePost({ ...data, postId: editing.postId });
      else await addPost(data);
      message.success(editing ? "修改成功" : "新增成功");
      setEditing(undefined);
      void reload();
    } finally {
      setSaving(false);
    }
  };

  const columns: TableColumnsType<PostDTO> = [
    { title: "岗位编号", dataIndex: "postId", width: 100 },
    { title: "岗位编码", dataIndex: "postCode", width: 140 },
    { title: "岗位名称", dataIndex: "postName", width: 160 },
    { title: "岗位排序", dataIndex: "postSort", width: 100 },
    {
      title: "状态",
      dataIndex: "status",
      width: 90,
      render: (value) => <OptionTag options={STATUS_OPTIONS} value={value} />,
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
            onClick={() => setEditing(row)}
          >
            修改
          </Button>
          <Popconfirm
            title={`确认删除岗位「${row.postName}」吗？`}
            onConfirm={() => remove([row.postId])}
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
        <Form.Item name="postCode" label="岗位编码">
          <Input placeholder="请输入岗位编码" allowClear />
        </Form.Item>
        <Form.Item name="postName" label="岗位名称">
          <Input placeholder="请输入岗位名称" allowClear />
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
                  postCode: undefined,
                  postName: undefined,
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
          <span className="sys-page__title">岗位列表</span>
          <Space wrap>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setEditing(null)}
            >
              新增岗位
            </Button>
            <Popconfirm
              title={`确认删除选中的 ${selectedIds.length} 个岗位吗？`}
              disabled={selectedIds.length === 0}
              onConfirm={() => remove(selectedIds)}
            >
              <Button
                danger
                icon={<DeleteOutlined />}
                disabled={selectedIds.length === 0}
              >
                批量删除
              </Button>
            </Popconfirm>
            <Button
              icon={<DownloadOutlined />}
              onClick={() => void exportPostExcel(query)}
            >
              导出
            </Button>
          </Space>
        </div>
        <Table<PostDTO>
          rowKey="postId"
          size="middle"
          loading={loading}
          columns={columns}
          dataSource={rows}
          pagination={pagination}
          scroll={{ x: 1000 }}
          rowSelection={{
            selectedRowKeys: selectedIds,
            onChange: (keys) => setSelectedIds(keys as number[]),
          }}
        />
      </div>

      <Modal
        title={editing ? "修改岗位" : "新增岗位"}
        open={editing !== undefined}
        onCancel={() => setEditing(undefined)}
        onOk={() => void submit()}
        confirmLoading={saving}
        destroyOnHidden
        maskClosable={false}
      >
        <Form<FormValues>
          form={editForm}
          layout="vertical"
          preserve={false}
          initialValues={{
            postCode: editing?.postCode,
            postName: editing?.postName,
            postSort: editing?.postSort ?? 0,
            status: editing?.status ?? 1,
            remark: editing?.remark,
          }}
        >
          <Form.Item
            name="postCode"
            label="岗位编码"
            rules={[
              { required: true, whitespace: true, message: "请输入岗位编码" },
              { max: 64 },
            ]}
          >
            <Input placeholder="请输入岗位编码" />
          </Form.Item>
          <Form.Item
            name="postName"
            label="岗位名称"
            rules={[
              { required: true, whitespace: true, message: "请输入岗位名称" },
              { max: 64 },
            ]}
          >
            <Input placeholder="请输入岗位名称" />
          </Form.Item>
          <Form.Item
            name="postSort"
            label="岗位排序"
            rules={[{ required: true, message: "请输入岗位排序" }]}
          >
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Radio.Group options={STATUS_OPTIONS} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
