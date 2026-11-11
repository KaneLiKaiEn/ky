import { useCallback, useEffect, useMemo, useState } from "react";
import {
  App,
  Button,
  Checkbox,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs, { type Dayjs } from "dayjs";
import debounce from "lodash/debounce";
import {
  deleteGuaranteeAPI,
  getGuaranteeListAPI,
  newGuaranteeAPI,
} from "@/api/account";
import { retrieveUserList } from "@/api/user";
import { useSessionInfo } from "../PrepayDeposit";
import { formatAmount } from "../PrepayDeposit";
import type { GuaranteeRow } from "@/types/account";
import type { UserRow } from "@/types/user";

interface AddFormValues {
  user_id: number;
  user_name: string;
  guarantee_time: Dayjs;
  guarantee_amount: number;
  guarantee_note?: string;
  guarantee_tag?: string[];
}

interface DeleteFormValues {
  delete_note?: string;
}
export interface GuaranteeListProps {
    visit_id?: number;
    /** 外部递增以静默刷新列表 */
    refreshKey?: number;
    /** 新增/删除成功后通知外部 */
    onChange?: () => void;
    className?: string;
  }
/**
 * 入院办理页担保记录：列表展示 + 新增弹窗 + 删除（填 delete_note），无修改。
 */
const AdmissionGuarantee = (
    {visit_id, refreshKey, onChange, className}: GuaranteeListProps
) => {
  const { message } = App.useApp();
  const { orgId } = useSessionInfo();

  const [rows, setRows] = useState<GuaranteeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [currentRow, setCurrentRow] = useState<GuaranteeRow | null>(null);

  const [userOptions, setUserOptions] = useState<UserRow[]>([]);
  const [userLoading, setUserLoading] = useState(false);

  const [addForm] = Form.useForm<AddFormValues>();
  const [deleteForm] = Form.useForm<DeleteFormValues>();
  const [guaranteeTag, setGuaranteeTag] = useState<{label:string, value:string}[]>([
    {label:"药品费", value:"[DRUG]"},
    {label:"材料费",value:"[MATERIAL]"},
    {label:"血制品费",value:"[BLOOD]"},
  ]);
  
  const refresh = useCallback(async () => {
    if (!visit_id || !orgId) {
      setRows([]);
      return;
    }
    setLoading(true);
    try {
      const res = await getGuaranteeListAPI({
        visit_id: visit_id,
        column_list: "*",
      });
      const list = res.row_list ?? [];
      setRows(
        list.sort((a, b) =>
          dayjs(b.guarantee_time || b.input_time).diff(
            dayjs(a.guarantee_time || a.input_time),
          ),
        ),
      );
    } catch {
      message.error("获取担保记录失败");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [message, orgId, visit_id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const searchUsers = useCallback(async (keyword: string) => {
    setUserLoading(true);
    try {
      const res = await retrieveUserList({
        retrieve_input: keyword.trim() || "*",
        retrieve_limit: 20,
        column_list: "*",
      });
      setUserOptions(res.code === 0 ? (res.user_list ?? []) : []);
    } catch {
      setUserOptions([]);
    } finally {
      setUserLoading(false);
    }
  }, []);

  const handleUserSearch = useMemo(
    () => debounce((keyword: string) => {
      void searchUsers(keyword);
    }, 300),
    [searchUsers],
  );

  useEffect(
    () => () => {
      handleUserSearch.cancel();
    },
    [handleUserSearch],
  );

  const openAddModal = () => {
    if (!visit_id) {
      message.warning("缺少就诊 ID，无法新增担保");
      return;
    }
    addForm.resetFields();
    addForm.setFieldsValue({
      guarantee_time: dayjs(),
      guarantee_tag: [],
    });
    setUserOptions([]);
    setAddOpen(true);
    void searchUsers("");
  };

  const openDeleteModal = useCallback(
    (row: GuaranteeRow) => {
      if (row.guarantee_id == null) {
        message.warning("缺少担保记录 ID，无法删除");
        return;
      }
      setCurrentRow(row);
      deleteForm.resetFields();
      setDeleteOpen(true);
    },
    [deleteForm, message],
  );

  const handleAddSubmit = async () => {
    if (!visit_id) return;
    try {
      const values = await addForm.validateFields();
      if (!values.user_name) {
        message.warning("请重新选择担保人");
        return;
      }
      setSubmitting(true);
      await newGuaranteeAPI({
        visit_id: visit_id,
        user_id: values.user_id,
        user_name: values.user_name,
        guarantee_tag: values.guarantee_tag?.join(""),
        guarantee_time: values.guarantee_time.format("YYYY-MM-DD HH:mm:ss"),
        guarantee_amount: formatAmount(values.guarantee_amount),
        guarantee_note: values.guarantee_note?.trim() || undefined,
      });
      message.success("新增担保成功");
      setAddOpen(false);
      await refresh();
    } catch (err) {
      if (err && typeof err === "object" && "errorFields" in err) return;
      message.error("新增担保失败");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (currentRow?.guarantee_id == null) return;
    try {
      const values = await deleteForm.validateFields();
      setSubmitting(true);
      await deleteGuaranteeAPI({
        guarantee_id: currentRow.guarantee_id,
        delete_note: values.delete_note?.trim() || undefined,
      });
      message.success("删除担保成功");
      setDeleteOpen(false);
      setCurrentRow(null);
      await refresh();
    } catch (err) {
      if (err && typeof err === "object" && "errorFields" in err) return;
      message.error("删除担保失败");
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnsType<GuaranteeRow> = useMemo(
    () => [
      {
        title: "担保人",
        dataIndex: "user_name",
        key: "user_name",
        width: 120,
        render: (value?: string) => value || "-",
      },
      {
        title: "担保时间",
        dataIndex: "guarantee_time",
        key: "guarantee_time",
        width: 170,
        render: (value?: string) => value || "-",
      },
      {
        title: "担保金额 (元)",
        dataIndex: "guarantee_amount",
        key: "guarantee_amount",
        width: 130,
        align: "right",
        render: (value?: string) => (value ? formatAmount(value) : "-"),
      },
      {
        title: "备注",
        dataIndex: "guarantee_note",
        key: "guarantee_note",
        ellipsis: true,
        render: (value?: string) => value || "-",
      },
      {
        title: "录入时间",
        dataIndex: "input_time",
        key: "input_time",
        width: 170,
        render: (value?: string) => value || "-",
      },
      {
        title: "操作",
        key: "action",
        width: 80,
        fixed: "right",
        render: (_, row) => (
          <Button
            type="link"
            danger
            className="px-0"
            onClick={() => openDeleteModal(row)}
          >
            删除
          </Button>
        ),
      },
    ],
    [openDeleteModal],
  );

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded bg-(--app-theme-bg-container) p-2">
      <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
        <Space size="middle">
          <span className="font-medium text-(--app-theme-text)">
            担保记录
          </span>
          <span className=" text-(--app-theme-text-secondary)">
            共 {rows.length} 条
          </span>
        </Space>
        <Button type="primary" onClick={openAddModal} disabled={!visit_id}>
          新增担保
        </Button>
      </div>

      {/* 不需要内部滚：去掉这层 overflow-auto(不然表格没数据也会出现 y 轴滚动条)，并去掉不必要的 sticky，交给外层页面滚。 */}
      <div className="min-h-0 flex-1">
        <Table<GuaranteeRow>
          rowKey={(row) => String(row.guarantee_id ?? `${row.user_id}-${row.guarantee_time}`)}
          columns={columns}
          dataSource={rows}
          loading={loading}
          pagination={false}
          size="middle"
        />
      </div>

      <Modal
        title="新增担保"
        open={addOpen}
        okText="确定"
        cancelText="取消"
        confirmLoading={submitting}
        destroyOnHidden
        onCancel={() => setAddOpen(false)}
        onOk={() => void handleAddSubmit()}
      >
        <Form form={addForm} layout="vertical" className="pt-2">
          <Form.Item
            label="担保人"
            name="user_id"
            rules={[{ required: true, message: "请选择担保人" }]}
          >
            <Select
              showSearch
              allowClear
              placeholder="请输入姓名检索用户"
              loading={userLoading}
              filterOption={false}
              onSearch={handleUserSearch}
              onChange={(userId) => {
                if (userId == null) {
                  addForm.setFieldValue("user_name", undefined);
                  return;
                }
                const matched = userOptions.find((u) => u.user_id === userId);
                addForm.setFieldValue("user_name", matched?.user_name);
              }}
              options={userOptions
                .filter((u) => u.user_id != null)
                .map((u) => ({
                  value: u.user_id as number,
                  label: u.dept_name
                    ? `${u.user_name}（${u.dept_name}）`
                    : (u.user_name ?? String(u.user_id)),
                }))}
            />
          </Form.Item>
          <Form.Item name="user_name" hidden>
            <Input />
          </Form.Item>
          <Form.Item
            label="担保时间"
            name="guarantee_time"
            rules={[{ required: true, message: "请选择担保时间" }]}
          >
            <DatePicker
              showTime
              className="w-full"
              format="YYYY-MM-DD HH:mm"
            />
          </Form.Item>
          <Form.Item
            label="标识"
            name="guarantee_tag"
          >
            <Checkbox.Group options={guaranteeTag} />


          </Form.Item>
          <Form.Item
            label="担保金额"
            name="guarantee_amount"
            rules={[{ required: true, message: "请输入担保金额" }]}
          >
            <InputNumber
              className="w-full"
              min={0.01}
              precision={2}
              placeholder="请输入担保金额"
              addonAfter="元"
            />
          </Form.Item>
          <Form.Item label="备注" name="guarantee_note">
            <Input.TextArea
              rows={3}
              placeholder="请输入备注（可选）"
              maxLength={200}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="删除担保"
        open={deleteOpen}
        okText="确认删除"
        okButtonProps={{ danger: true }}
        cancelText="取消"
        confirmLoading={submitting}
        destroyOnHidden
        onCancel={() => {
          setDeleteOpen(false);
          setCurrentRow(null);
        }}
        onOk={() => void handleDeleteSubmit()}
      >
        <Form form={deleteForm} layout="vertical" className="pt-2">
          <Form.Item label="删除原因" name="delete_note">
            <Input.TextArea
              rows={4}
              placeholder="请输入删除原因（可选）"
              maxLength={200}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdmissionGuarantee;
