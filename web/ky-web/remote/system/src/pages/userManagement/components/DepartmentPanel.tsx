import { getSessionId } from "comm/session";
import { useEffect } from "react";
import { App, Button, Empty, Form, Input, Table, Typography } from "antd";
import { getUserDeptList, saveUserDeptList } from "@/api/user";
import type { UserDeptRow } from "@/types/user";
import type { EditorProps } from "../types";
import type { References } from "../references";
import { useResource } from "@/hooks/useResource";
import { useEditor } from "@/hooks/useEditor";
import { assertResult, resultRows } from "@/utils/result";
import { deptDto, MAX_AUTH } from "../dto";
import { parseId } from "../navigation";
import DepartmentPicker from "./DepartmentPicker";
import { LoadFeedback, SaveError, RefreshFeedback } from "@/components/Feedback";

interface Row {
  department: UserDeptRow;
  sort_no?: string;
}

export default function DepartmentPanel(
  props: EditorProps & { reference: References },
) {
  const { user, orgId, reference } = props;
  const { message, modal } = App.useApp();
  const editor = useEditor(props);
  const [form] = Form.useForm<{ rows: Row[] }>();
  const resource = useResource(
    `dept-auth:${orgId}:${user.user_id}`,
    async () => {
      const res = assertResult(
        await getUserDeptList({
          user_id: user.user_id,
          dept_type: "",
          include_owner: false,
          column_list: "*",
        }),
      );
      const rows = resultRows(res.dept_list).map((row) => ({
        ...row,
        dept_id: parseId(row.dept_id) ?? undefined,
        org_id: parseId(row.org_id) ?? undefined,
      }));
      if (rows.some((row) => !row.dept_id || !row.org_id))
        throw new Error("已有科室授权缺少有效 ID，暂不能编辑");
      return rows;
    },
  );
  useEffect(() => {
    if (resource.data)
      form.setFieldsValue({
        rows: resource.data.map((department) => ({
          department,
          sort_no: department.sort_no,
        })),
      });
  }, [resource.data, form]);
  const resourceBlocked = resource.loading || Boolean(resource.error);
  if (!resource.data)
    return <LoadFeedback prefix="user-page" {...resource} retry={resource.reload} />;
  const save = ({ rows = [] }: { rows: Row[] }) =>
    editor.run(async () => {
      const requestSessionId = getSessionId();
      if (props.disabled || resourceBlocked) return;
      if (
        !rows.length &&
        resource.data!.length &&
        !(await modal.confirm({
          title: "清空全部科室授权？",
          content: "保存后，该用户的所有科室授权将被移除。",
          okText: "清空并保存",
          cancelText: "继续编辑",
          okButtonProps: { danger: true },
        }))
      )
        return;
      if (!editor.mounted.current || getSessionId() !== requestSessionId) return;
      const payload = deptDto(
        user.user_id!,
        rows.map(({ department, sort_no }) => {
          const original = resource.data!.find(
            (row) =>
              row.org_id === department.org_id &&
              row.dept_id === department.dept_id &&
              row.dept_type === department.dept_type,
          );
          return { ...original, ...department, sort_no: sort_no ?? "" };
        }),
      );
      assertResult(
        await saveUserDeptList({
          user_id: user.user_id,
          dept_type: "",
          delete_row: 0,
          dept_list: payload,
        }),
      );
      if (!editor.mounted.current || getSessionId() !== requestSessionId) return;
      editor.dirty(false);
      message.success("科室授权已保存");
      resource.reload();
    });
  return (
    <>
    <RefreshFeedback prefix="user-page" {...resource} retry={resource.reload} />
    <Form
      form={form}
      layout="vertical"
      className="user-panel"
      disabled={props.disabled || resourceBlocked || editor.saving}
      onValuesChange={() => editor.dirty(true)}
      onFinish={save}
      scrollToFirstError
    >
      <SaveError prefix="user-page" error={editor.error} />
      <Form.List name="rows">
        {(fields, { add, remove }) => (
          <>
            <div className="user-dept-toolbar">
              <div>
                <Typography.Title level={5}>科室授权</Typography.Title>
                <Typography.Text type="secondary">
                  已分配 {fields.length} / {MAX_AUTH} 项，所属科室在属性中单独维护。
                </Typography.Text>
              </div>
              <Button
                disabled={props.disabled || resourceBlocked || editor.saving || fields.length >= MAX_AUTH}
                onClick={() => {
                  add({ department: { org_id: orgId } });
                  editor.dirty(true);
                }}
              >
                添加科室
              </Button>
            </div>
            <Table
              className="user-dept-table"
              rowKey="key"
              size="small"
              dataSource={fields}
              pagination={false}
              scroll={{ x: 680 }}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="尚未分配科室，点击添加科室开始配置"
                  />
                ),
              }}
              columns={[
                {
                  title: "序号",
                  key: "index",
                  width: 60,
                  render: (_, { name }) => name + 1,
                },
                {
                  title: "授权科室",
                  key: "department",
                  width: 420,
                  render: (_, { name }) => (
                    <Form.Item
                      name={[name, "department"]}
                      rules={[
                        {
                          validator: (_, value?: UserDeptRow) =>
                            value?.dept_id && value.dept_type
                              ? Promise.resolve()
                              : Promise.reject(new Error("请选择完整科室")),
                        },
                      ]}
                    >
                      <DepartmentPicker
                        orgId={orgId}
                        reference={reference}
                        disabled={props.disabled || resourceBlocked || editor.saving}
                      />
                    </Form.Item>
                  ),
                },
                {
                  title: "排序",
                  key: "sort_no",
                  width: 100,
                  render: (_, { name }) => (
                    <Form.Item name={[name, "sort_no"]}>
                      <Input aria-label={`授权科室 ${name + 1} 排序`} />
                    </Form.Item>
                  ),
                },
                {
                  title: "操作",
                  key: "action",
                  width: 100,
                  render: (_, { name }) => (
                    <Button
                      type="link"
                      size="small"
                      danger
                      aria-label={`移除授权科室 ${name + 1}`}
                      onClick={() => {
                        remove(name);
                        editor.dirty(true);
                      }}
                    >
                      移除
                    </Button>
                  ),
                },
              ]}
            />
          </>
        )}
      </Form.List>
      <div className="user-form__actions">
        <Button
          type="primary"
          htmlType="submit"
          loading={editor.saving}
        >
          保存科室授权
        </Button>
      </div>
    </Form>
    </>
  );
}
