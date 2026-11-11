import { Checkbox, Form, Input, InputNumber, Select, Space, Spin } from "antd";
import type { FormInstance } from "antd";
import {
  PREFAB_AGE_UNIT_OPTIONS,
  PREFAB_GENDER_OPTIONS,
  PREFAB_VISIT_TYPE_OPTIONS,
  PREFAB_SHARE_OPTIONS,
} from "./enum";
import { useTemplateSaveFormOptions } from "./useTemplateSaveFormOptions";

export type TemplateSaveFormType = "EMR" | "ORDER";

export type TemplateSaveFormValues = {
  prefab_name: string;
  age_min: number;
  age_max: number;
  age_unit: string;
  gender_name: string[];
  op_type: string[];
  visit_type: string[];
  disease_id?: number;
  disease_name?: string;
  share_tag: string[];
  sort_no: string;
  prefab_note: string;
};

export type TemplateSaveFormProps = {
  form: FormInstance<TemplateSaveFormValues>;
  type: TemplateSaveFormType;
  disabled?: boolean;
  deptId?: number;
  userId?: number;
};

export const DEFAULT_TEMPLATE_SAVE_FORM_VALUES: Partial<TemplateSaveFormValues> = {
  age_unit: "岁",
  age_min: 0,
  age_max: 120,
  gender_name: ["男", "女"],
  visit_type: ["O", "E", "I"],
  op_type: [],
  share_tag: ["DEPT", "ORG"],
};

/**
 * 模板属性表单：新建/维护模板时复用。
 */
const TemplateSaveForm = ({
  form,
  type,
  disabled,
  deptId,
  userId,
}: TemplateSaveFormProps) => {
  const isEmr = type === "EMR";
  const {
    visitOpTypeOptions,
    diseaseOptions,
    visitTypeLoading,
    diseaseLoading,
  } = useTemplateSaveFormOptions({
    deptId,
    userId,
    enabled: isEmr,
  });

  return (
    <Form
      form={form}
      layout="horizontal"
      labelCol={{ flex: "88px" }}
      wrapperCol={{ flex: 1 }}
      disabled={disabled}
      colon={false}
    >
      <Form.Item
        label="名称"
        name="prefab_name"
        rules={[{ required: true, message: "请输入模板名称" }]}
      >
        <Input placeholder="请输入模板名称" maxLength={100} />
      </Form.Item>

      {isEmr ? (
        <Form.Item label="病种" name="disease_id">
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="请选择病种"
            options={diseaseOptions}
            loading={diseaseLoading}
            onChange={(value) => {
              const option = diseaseOptions.find((item) => item.value === value);
              form.setFieldValue("disease_name", option?.label);
            }}
            onClear={() => {
              form.setFieldValue("disease_name", undefined);
            }}
          />
        </Form.Item>
      ) : null}

      <Form.Item label="年龄范围">
        <Space.Compact className="w-full">
          <Form.Item name="age_min" noStyle>
            <InputNumber
              className="w-1/3!"
              min={0}
              placeholder="最小"
              controls={false}
            />
          </Form.Item>

          <Form.Item name="age_max" noStyle>
            <InputNumber
              className="w-1/3!"
              min={0}
              placeholder="最大"
              controls={false}
            />
          </Form.Item>
          <Form.Item name="age_unit" noStyle>
            <Select
              className="w-1/3!"
              options={[...PREFAB_AGE_UNIT_OPTIONS]}
              placeholder="单位"
            />
          </Form.Item>
        </Space.Compact>
      </Form.Item>

      <Form.Item label="性别" name="gender_name">
        <Checkbox.Group options={[...PREFAB_GENDER_OPTIONS]} />
      </Form.Item>

      {isEmr ? (
        <>
          <Form.Item label="就诊类型" name="visit_type">
            <Checkbox.Group options={[...PREFAB_VISIT_TYPE_OPTIONS]} />
          </Form.Item>

          <Form.Item label="门诊类型" name="op_type">
            <Checkbox.Group options={visitOpTypeOptions} />
          </Form.Item>

          <Form.Item name="disease_name" hidden>
            <Input />
          </Form.Item>
        </>
      ) : null}

      <Form.Item label="共享" name="share_tag">
        <Checkbox.Group options={[...PREFAB_SHARE_OPTIONS]} />
      </Form.Item>

      <Form.Item label="排序号" name="sort_no">
        <Input placeholder="请输入排序号" maxLength={20} />
      </Form.Item>

      <Form.Item label="备注" name="prefab_note">
        <Input.TextArea
          placeholder="请输入备注"
          maxLength={500}
          autoSize={{ minRows: 2, maxRows: 4 }}
        />
      </Form.Item>
    </Form>
  );
};

export default TemplateSaveForm;
