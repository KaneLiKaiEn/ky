import { useEffect, useMemo } from "react";
import { getSessionId } from "comm/session";
import {
  App,
  Button,
  DatePicker,
  Divider,
  Form,
  Input,
  Select,
  Space,
  Typography,
} from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { newUser, saveUserProperty } from "@/api/user";
import type { UserDeptRow, UserRow } from "@/types/user";
import type { EditorProps } from "../types";
import type { References } from "../references";
import {
  generateUserNo,
  newUserDto,
  parseTags,
  propertyDto,
  WORK_TYPES,
} from "../dto";
import { useResource } from "@/hooks/useResource";
import { useEditor } from "@/hooks/useEditor";
import { assertResult } from "@/utils/result";
import { parseId } from "../navigation";
import DepartmentPicker from "./DepartmentPicker";
import PersonSelect from "./PersonSelect";
import { SaveError } from "@/components/Feedback";

interface Values extends Omit<
  UserRow,
  "user_tag" | "user_dob" | "work_date" | "valid_start" | "valid_end"
> {
  user_tag: string[];
  user_dob?: Dayjs | null;
  work_date?: Dayjs | null;
  validity?: [Dayjs | null, Dayjs | null];
  department?: UserDeptRow;
}

const dateValue = (value?: string) =>
  value && dayjs(value).isValid() ? dayjs(value) : undefined;
const required = [{ required: true, message: "请填写此项" }];
const textRequired = [
  { required: true, whitespace: true, message: "请填写此项" },
];

export default function PropertyForm(
  props: EditorProps & {
    reference: References;
    onSaved: (row: UserRow) => void;
  },
) {
  const { orgId, user, reference, onSaved } = props;
  const { message } = App.useApp();
  const [form] = Form.useForm<Values>();
  const editor = useEditor(props);
  const workType = Form.useWatch("work_type", form) ?? user.work_type;
  const skillsName =
    workType === "DOCTOR"
      ? "skill.level.doctor"
      : workType === "NURSE"
        ? "skill.level.nurse"
        : null;
  const dictionaries = useResource(`property-dicts:${orgId}`, async () => {
    const [levels, tags] = await Promise.all([
      reference.dictionary("work.level"),
      reference.dictionary("user.tag"),
    ]);
    return { levels, tags };
  });
  const skills = useResource(
    skillsName ? `skills:${orgId}:${skillsName}` : null,
    () => reference.dictionary(skillsName!),
  );
  const userSnapshot = JSON.stringify(user);
  const initialValues = useMemo<Values>(() => ({
    ...user,
    user_tag: parseTags(user.user_tag),
    user_dob: dateValue(user.user_dob),
    work_date: dateValue(user.work_date),
    validity: [
      dateValue(user.valid_start) ?? null,
      dateValue(user.valid_end) ?? null,
    ],
    department: user.dept_id
      ? { org_id: orgId, dept_id: user.dept_id, dept_name: user.dept_name }
      : undefined,
  }), [userSnapshot, orgId]);
  useEffect(() => {
    form.resetFields();
    form.setFieldsValue(initialValues);
    editor.dirty(false);
  }, [form, initialValues, editor.dirty]);
  const levels = (dictionaries.data?.levels ?? [])
    .filter((row) => row.item_name)
    .map((row) => ({ label: row.item_name!, value: row.item_name! }));
  const savedLevel = Form.useWatch("work_level", form) ?? user.work_level;
  if (savedLevel && !levels.some((option) => option.value === savedLevel))
    levels.push({ label: savedLevel, value: savedLevel });
  const tags = (dictionaries.data?.tags ?? [])
    .filter((row) => row.item_code)
    .map((row) => ({
      label: row.item_name || row.item_code!,
      value: row.item_code!,
    }));
  for (const value of Form.useWatch("user_tag", form) ??
    parseTags(user.user_tag))
    if (!tags.some((option) => option.value === value))
      tags.push({ value, label: value });
  const skillOptions = (skills.data ?? [])
    .filter((row) => row.item_name)
    .map((row) => ({ label: row.item_name!, value: row.item_name! }));
  const savedSkill = Form.useWatch("skill_level", form) ?? user.skill_level;
  if (savedSkill && !skillOptions.some((option) => option.value === savedSkill))
    skillOptions.push({ value: savedSkill, label: savedSkill });

  const save = (values: Values) =>
    editor.run(async () => {
      const requestSessionId = getSessionId();
      const { user_tag, user_dob, work_date, validity, department, ...fields } =
        values;
      const property = propertyDto(
        user,
        {
          ...fields,
          org_id: orgId,
          dept_id: department?.dept_id,
          dept_name: department?.dept_name,
          user_dob: user_dob?.format("YYYY-MM-DD"),
          work_date: work_date?.format("YYYY-MM-DD"),
          valid_start: validity?.[0]?.format("YYYY-MM-DD"),
          valid_end: validity?.[1]?.format("YYYY-MM-DD"),
        },
        user_tag,
      );
      let id = user.user_id!;
      if (id === 0) {
        const res = assertResult(await newUser(newUserDto(property)));
        const createdId = parseId(res.user_id);
        if (!createdId)
          throw new Error(
            "接口未返回有效用户 ID，请核实是否已创建，避免重复新增",
          );
        id = createdId;
      } else
        assertResult(
          await saveUserProperty({ user_id: id, user_property: property }),
        );
      if (!editor.mounted.current || getSessionId() !== requestSessionId) return;
      editor.dirty(false);
      message.success(
        user.user_id === 0
          ? "用户已创建，可继续分配角色和科室"
          : "用户属性已保存",
      );
      onSaved({ ...property, user_id: id, org_id: orgId });
    });

  return (
    <Form
      form={form}
      layout="horizontal"
      colon={false}
      labelAlign="right"
      labelCol={{ flex: "88px" }}
      wrapperCol={{ flex: "auto" }}
      className="user-form"
      initialValues={initialValues}
      disabled={props.disabled || editor.saving}
      onValuesChange={() => editor.dirty(true)}
      onFinish={save}
      scrollToFirstError
    >
      <SaveError prefix="user-page" error={editor.error} />
      <Divider titlePlacement="left">基本资料</Divider>
      <div className="user-form__grid">
        <Form.Item label="工号" name="user_no" rules={textRequired}>
          <Input
            suffix={
              <Button
                type="link"
                size="small"
                onClick={() => {
                  form.setFieldValue("user_no", generateUserNo());
                  editor.dirty(true);
                }}
              >
                生成
              </Button>
            }
          />
        </Form.Item>
        <Form.Item label="姓名" name="user_name" rules={textRequired}>
          <Input />
        </Form.Item>
        <Form.Item label="性别" name="user_gender" rules={required}>
          <Select
            options={["男", "女", "未知"].map((value) => ({
              value,
              label: value,
            }))}
          />
        </Form.Item>
        <Form.Item label="出生日期" name="user_dob">
          <DatePicker format="YYYY-MM-DD" />
        </Form.Item>
        <Form.Item label="身份证号" name="user_idno">
          <Input />
        </Form.Item>
        <Form.Item label="电话" name="user_telno">
          <Input />
        </Form.Item>
        <Form.Item label="用户代码" name="user_code">
          <Input />
        </Form.Item>
        <Form.Item label="用户标识" name="user_tag">
          <Select
            mode="multiple"
            options={tags}
            loading={dictionaries.loading}
            optionFilterProp="label"
            placeholder="请选择用户标识"
          />
        </Form.Item>
      </div>
      <Divider titlePlacement="left">任职资料</Divider>
      <div className="user-form__grid">
        <Form.Item
          className="user-form__wide"
          label="所属科室"
          name="department"
          rules={[
            {
              validator: (_, value?: UserDeptRow) =>
                value?.dept_type && !value.dept_id
                  ? Promise.reject(new Error("请选择科室名称"))
                  : Promise.resolve(),
            },
          ]}
        >
          <DepartmentPicker
            orgId={orgId}
            reference={reference}
            disabled={props.disabled || editor.saving}
          />
        </Form.Item>
        <Form.Item label="工作类型" name="work_type" rules={required}>
          <Select
            options={WORK_TYPES}
            onChange={() => form.setFieldValue("skill_level", undefined)}
          />
        </Form.Item>
        <Form.Item label="技能等级" name="skill_level">
          {skillsName ? (
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              options={skillOptions}
              loading={skills.loading}
              placeholder="请选择技能等级"
            />
          ) : (
            <Input />
          )}
        </Form.Item>
        <Form.Item label="职务" name="work_title">
          <Input />
        </Form.Item>
        <Form.Item label="职称" name="work_level">
          <Select
            allowClear
            showSearch
            options={levels}
            optionFilterProp="label"
            loading={dictionaries.loading}
          />
        </Form.Item>
        <Form.Item label="入职日期" name="work_date">
          <DatePicker format="YYYY-MM-DD" />
        </Form.Item>
        <Form.Item label="排序" name="sort_no">
          <Input />
        </Form.Item>
      </div>
      <Divider titlePlacement="left">关联信息与有效期</Divider>
      <div className="user-form__grid">
        <Form.Item label="关联员工" name="employee_id">
          <PersonSelect orgId={orgId} kind="employee" />
        </Form.Item>
        <Form.Item label="关联学生" name="student_id">
          <PersonSelect orgId={orgId} kind="student" />
        </Form.Item>
        <Form.Item
          className="user-form__wide"
          label="有效期"
          name="validity"
          rules={[
            {
              validator: (_, value?: [Dayjs, Dayjs]) => {
                if (!value?.[0] || !value[1])
                  return Promise.reject(new Error("请选择完整有效期"));
                return value[1].isBefore(value[0], "day")
                  ? Promise.reject(new Error("结束日期不能早于开始日期"))
                  : Promise.resolve();
              },
            },
          ]}
        >
          <DatePicker.RangePicker format="YYYY-MM-DD" />
        </Form.Item>
      </div>
      {(dictionaries.error || skills.error) && (
        <Typography.Text type="danger">
          字典加载失败，已有值已保留。
          <Button
            type="link"
            onClick={() => {
              dictionaries.reload();
              skills.reload();
            }}
          >
            重试
          </Button>
        </Typography.Text>
      )}
      <div className="user-form__actions">
        <Space>
          <Typography.Text type="secondary">
            {user.user_id === 0
              ? "保存后可设置授权、密码和头像"
              : "修改仅在保存后生效"}
          </Typography.Text>
          <Button
            type="primary"
            htmlType="submit"
            loading={editor.saving}
          >
            {user.user_id === 0 ? "创建用户" : "保存属性"}
          </Button>
        </Space>
      </div>
    </Form>
  );
}
