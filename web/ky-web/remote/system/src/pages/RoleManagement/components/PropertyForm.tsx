import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  App,
  Button,
  Form,
  Input,
  Select,
  Space,
  Typography,
} from "antd";
import { newRole, saveRoleProperty } from "@/api/org";
import { getSessionId } from "comm/session";
import type { RoleRow } from "@/types/org";
import { notifyRolesChanged } from "@/pages/RoleManagement/roleEvents";
import { parseTags, propertyDto, type RoleValues } from "../dto";
import { useEditor } from "@/hooks/useEditor";
import { parseId } from "../navigation";
import { assertResult } from "@/utils/result";
import type { RoleEditorProps } from "../types";
import { SaveError } from "@/components/Feedback";

export default function PropertyForm(
  props: RoleEditorProps & {
    onSaved: (role: RoleRow & { role_id: number }) => void;
  },
) {
  const { role, orgId, onSaved } = props;
  const { message } = App.useApp();
  const [form] = Form.useForm<RoleValues>();
  const editor = useEditor(props);
  const [creationUncertain, setCreationUncertain] = useState(false);
  const roleSnapshot = JSON.stringify(role);
  const initialValues = useMemo(() => ({
    role_name: role.role_name ?? "",
    role_note: role.role_note ?? "",
    role_tag: parseTags(role.role_tag),
    sort_no: role.sort_no ?? "",
  }), [roleSnapshot]);
  useEffect(() => {
    form.resetFields();
    form.setFieldsValue(initialValues);
    editor.dirty(false);
  }, [form, initialValues, editor.dirty]);
  const save = (values: RoleValues) =>
    editor.run(async () => {
      if (creationUncertain) return;
      const sessionId = getSessionId();
      const property = propertyDto(orgId, values);
      let id = role.role_id;
      if (id === 0) {
        const response = assertResult(await newRole(property));
        const createdId = parseId(response.role_id);
        if (!createdId) {
          setCreationUncertain(true);
          throw new Error(
            "接口未返回有效角色 ID，请刷新角色列表核实创建结果，避免重复新增",
          );
        }
        id = createdId;
      } else {
        assertResult(
          await saveRoleProperty({ role_id: id, role_property: property }),
        );
      }
      if (getSessionId() !== sessionId) {
        if (editor.mounted.current && role.role_id === 0)
          setCreationUncertain(true);
        throw new Error("会话已变化，请刷新角色列表核实保存结果");
      }
      notifyRolesChanged(orgId, id);
      if (!editor.mounted.current) return;
      editor.dirty(false);
      message.success(
        role.role_id === 0 ? "角色已创建，可继续分配成员" : "角色属性已保存",
      );
      onSaved({ ...role, ...property, role_id: id });
    });

  return (
    <Form<RoleValues>
      form={form}
      className="role-form"
      layout="horizontal"
      colon={false}
      labelAlign="right"
      labelCol={{ flex: "88px" }}
      wrapperCol={{ flex: "auto" }}
      initialValues={initialValues}
      disabled={props.disabled || editor.saving || creationUncertain}
      onValuesChange={() => editor.dirty(true)}
      onFinish={save}
      scrollToFirstError
    >
      <SaveError prefix="role-page" error={editor.error} />
      {creationUncertain && (
        <Alert
          className="role-page__error"
          type="warning"
          showIcon
          title="请先核实创建结果"
          description="请使用顶部刷新按钮重新加载角色列表，再选择已创建的角色继续编辑。"
        />
      )}
      <div className="role-form__grid">
        <Form.Item
          name="role_name"
          label="角色名称"
          rules={[
            { required: true, whitespace: true, message: "请填写角色名称" },
          ]}
        >
          <Input placeholder="请输入角色名称" />
        </Form.Item>
        <Form.Item name="sort_no" label="排序号">
          <Input placeholder="例如：001" />
        </Form.Item>
        <Form.Item
          className="role-form__wide"
          name="role_tag"
          label="角色标签"
          rules={[
            {
              validator: (_, tags?: string[]) =>
                tags && tags.length > 10
                  ? Promise.reject(new Error("最多可填写 10 个标签"))
                  : Promise.resolve(),
            },
            {
              validator: (_, tags?: string[]) =>
                tags?.some((tag) => /[\[\]]/.test(tag))
                  ? Promise.reject(new Error("标签不能包含方括号"))
                  : Promise.resolve(),
            },
          ]}
        >
          <Select
            mode="tags"
            tokenSeparators={[" "]}
            maxCount={10}
            placeholder="输入标签后按回车或空格，最多 10 个"
          />
        </Form.Item>
        <Form.Item
          className="role-form__wide"
          name="role_note"
          label="角色备注"
        >
          <Input.TextArea
            autoSize={{ minRows: 4, maxRows: 10 }}
            placeholder="填写角色说明"
          />
        </Form.Item>
      </div>
      <div className="role-form__actions">
        <Space wrap>
          <Typography.Text type="secondary">
            {role.role_id === 0 ? "创建角色后可设置成员" : "修改仅在保存后生效"}
          </Typography.Text>
          <Button
            type="primary"
            htmlType="submit"
            loading={editor.saving}
            disabled={props.disabled || editor.saving || creationUncertain}
          >
            {role.role_id === 0 ? "创建角色" : "保存属性"}
          </Button>
        </Space>
      </div>
    </Form>
  );
}
