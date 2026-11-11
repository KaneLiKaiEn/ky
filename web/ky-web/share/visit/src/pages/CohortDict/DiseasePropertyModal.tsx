import { useCallback, useEffect, useState } from "react";
import {
  App,
  Checkbox,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Spin,
} from "antd";
import {
  getDiseasePropertyAPI,
  newDiseaseAPI,
  saveDiseasePropertyAPI,
} from "@/api/cohort";
import { getDocNameListAPI, getDocTypeListAPI } from "@/api/doc";
import type { DiseaseRow } from "@/types/cohort";
import type { DocNameRow, DocTypeRow } from "@/types/doc";
import {
  AGE_UNIT_OPTIONS,
  AUTO_INCLUDE_TAG,
  GENDER_OPTIONS,
} from "./constants";
import {
  hasBracketTag,
  parseBracketTags,
  toBracketTags,
  uniqueBy,
} from "./utils";

interface DiseasePropertyForm {
  disease_no?: string;
  disease_code?: string;
  disease_name?: string;
  gender_name?: string[];
  age_min?: number | null;
  age_max?: number | null;
  age_unit?: string;
  bmi_min?: string;
  bmi_max?: string;
  auto_include?: boolean;
  disease_interval?: number | null;
  doc_type?: number;
  doc_name?: number;
  sort_no?: string;
}

export interface DiseasePropertyModalProps {
  open: boolean;
  mode: "create" | "edit";
  diseaseType: string;
  diseaseId?: number;
  orgId?: number;
  onCancel: () => void;
  onSaved: () => void;
}

const FORM_LAYOUT = {
  labelCol: { span: 6 },
  wrapperCol: { span: 18 },
};

const toBmiText = (value?: string | number) =>
  value == null || value === "" ? undefined : String(value);

const DiseasePropertyModal = ({
  open,
  mode,
  diseaseType,
  diseaseId,
  orgId,
  onCancel,
  onSaved,
}: DiseasePropertyModalProps) => {
  const { message } = App.useApp();
  const [form] = Form.useForm<DiseasePropertyForm>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [docTypeList, setDocTypeList] = useState<DocTypeRow[]>([]);
  const [docNameList, setDocNameList] = useState<DocNameRow[]>([]);
  const selectedDocType = Form.useWatch("doc_type", form);

  const loadDocNames = useCallback(async (typeId: number) => {
    const res = await getDocNameListAPI({ type_id: typeId });
    const names = uniqueBy(res.row_list ?? [], (item) => item.doc_name);
    setDocNameList(names);
    return names;
  }, []);

  const fillForm = useCallback(
    async (property: DiseaseRow, types: DocTypeRow[]) => {
      const values: DiseasePropertyForm = {
        disease_no: property.disease_no,
        disease_code: property.disease_code,
        disease_name: property.disease_name,
        gender_name: parseBracketTags(property.gender_name),
        age_min: property.age_min,
        age_max: property.age_max,
        age_unit: property.age_unit,
        bmi_min: toBmiText(property.bmi_min),
        bmi_max: toBmiText(property.bmi_max),
        auto_include: hasBracketTag(property.disease_tag, AUTO_INCLUDE_TAG),
        disease_interval: property.disease_interval,
        sort_no: property.sort_no,
      };

      if (property.doc_type) {
        const matchedType = types.find(
          (item) => item.doc_type === property.doc_type,
        );
        if (matchedType?.type_id != null) {
          values.doc_type = matchedType.type_id;
          const names = await loadDocNames(matchedType.type_id);
          if (property.doc_name) {
            const matchedName = names.find(
              (item) => item.doc_name === property.doc_name,
            );
            values.doc_name = matchedName?.name_id;
          }
        }
      }

      form.setFieldsValue(values);
    },
    [form, loadDocNames],
  );

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      form.resetFields();
      setDocNameList([]);
      try {
        const typeRes = await getDocTypeListAPI({});
        if (cancelled) return;
        const types = uniqueBy(typeRes.row_list ?? [], (item) => item.doc_type);
        setDocTypeList(types);

        if (mode === "edit" && diseaseId != null) {
          const res = await getDiseasePropertyAPI({ disease_id: diseaseId });
          if (cancelled) return;
          if (res.disease_property) {
            await fillForm(res.disease_property, types);
          }
        }
      } catch {
        // 错误由 comm/request 提示
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [diseaseId, fillForm, form, mode, open]);

  const handleDocTypeChange = (typeId: number | undefined) => {
    form.setFieldValue("doc_name", undefined);
    setDocNameList([]);
    if (typeId != null) {
      void loadDocNames(typeId);
    }
  };

  const buildPayload = (values: DiseasePropertyForm): DiseaseRow => {
    const docType = docTypeList.find((item) => item.type_id === values.doc_type);
    const docName = docNameList.find((item) => item.name_id === values.doc_name);
    return {
      disease_no: values.disease_no,
      disease_code: values.disease_code,
      disease_name: values.disease_name,
      gender_name: toBracketTags(values.gender_name),
      age_min: values.age_min ?? undefined,
      age_max: values.age_max ?? undefined,
      age_unit: values.age_unit,
      bmi_min: values.bmi_min,
      bmi_max: values.bmi_max,
      disease_tag: values.auto_include ? `[${AUTO_INCLUDE_TAG}]` : "",
      disease_interval: values.disease_interval ?? undefined,
      doc_type: docType?.doc_type ?? "",
      doc_name: docName?.doc_name ?? "",
      sort_no: values.sort_no,
      disease_type: diseaseType,
    };
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const payload = buildPayload(values);
      setSaving(true);
      if (mode === "create") {
        await newDiseaseAPI({
          ...payload,
          org_id: orgId,
          group_id: -1,
          catalog_id: -1,
          bmi_min: toBmiText(payload.bmi_min),
          bmi_max: toBmiText(payload.bmi_max),
        });
        message.success("新增成功");
      } else if (diseaseId != null) {
        await saveDiseasePropertyAPI({
          disease_id: diseaseId,
          disease_property: payload,
        });
        message.success("保存成功");
      }
      onSaved();
    } catch (err) {
      if (err && typeof err === "object" && "errorFields" in err) return;
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={mode === "create" ? "新增病种" : "编辑病种属性"}
      open={open}
      onCancel={onCancel}
      onOk={() => void handleOk()}
      confirmLoading={saving}
      width={720}
      destroyOnHidden
      
    >
      <Spin spinning={loading}>
        <Form form={form} {...FORM_LAYOUT} className="pt-2">
          <Form.Item name="disease_no" label="病种编号">
            <Input placeholder="请输入病种编号" maxLength={100} />
          </Form.Item>
          <Form.Item name="disease_code" label="病种编码">
            <Input placeholder="请输入病种编码" maxLength={100} />
          </Form.Item>
          <Form.Item
            name="disease_name"
            label="病种名称"
            rules={[{ required: true, message: "请输入病种名称" }]}
          >
            <Input placeholder="请输入病种名称" maxLength={100} />
          </Form.Item>
          <Form.Item name="gender_name" label="适用患者性别">
            <Checkbox.Group options={GENDER_OPTIONS} />
          </Form.Item>
          <Form.Item label="适用年龄">
            <Space align="center">
              <Form.Item name="age_min" noStyle>
                <InputNumber placeholder="最小值" className="w-28" />
              </Form.Item>
              <span>～</span>
              <Form.Item name="age_max" noStyle>
                <InputNumber placeholder="最大值" className="w-28" />
              </Form.Item>
              <Form.Item name="age_unit" noStyle>
                <Select
                  allowClear
                  placeholder="单位"
                  options={AGE_UNIT_OPTIONS}
                  className="w-20"
                />
              </Form.Item>
            </Space>
          </Form.Item>
          <Form.Item label="适用BMI">
            <Space align="center">
              <Form.Item name="bmi_min" noStyle>
                <Input placeholder="最小值" className="w-28" />
              </Form.Item>
              <span>～</span>
              <Form.Item name="bmi_max" noStyle>
                <Input placeholder="最大值" className="w-28" />
              </Form.Item>
            </Space>
          </Form.Item>
          <Form.Item
            name="auto_include"
            label="标签"
            valuePropName="checked"
          >
            <Checkbox>自动纳入</Checkbox>
          </Form.Item>
          <Form.Item name="disease_interval" label="无需重复纳入天数">
            <InputNumber placeholder="请输入天数" className="w-full" />
          </Form.Item>
          <Form.Item label="报卡">
            <Space align="center" wrap>
              <Form.Item name="doc_type" noStyle>
                <Select
                  allowClear
                  placeholder="请选择报卡类型"
                  className="w-48"
                  options={docTypeList.map((item) => ({
                    label: item.doc_type,
                    value: item.type_id,
                  }))}
                  onChange={handleDocTypeChange}
                />
              </Form.Item>
              <Form.Item name="doc_name" noStyle>
                <Select
                  allowClear
                  placeholder="请选择报卡名称"
                  className="w-48"
                  disabled={selectedDocType == null}
                  options={docNameList.map((item) => ({
                    label: item.doc_name,
                    value: item.name_id,
                  }))}
                />
              </Form.Item>
            </Space>
          </Form.Item>
          <Form.Item name="sort_no" label="排序">
            <Input placeholder="请输入排序" maxLength={100} />
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  );
};

export default DiseasePropertyModal;
