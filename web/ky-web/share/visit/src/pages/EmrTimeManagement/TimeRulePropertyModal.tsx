import { useCallback, useEffect, useState } from "react";
import {
  App,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Spin,
} from "antd";
import {
  getQcItemList,
  getTimeRulePropertyAPI,
  newTimeRuleAPI,
  saveTimeRulePropertyAPI,
} from "@/api/emr";
import { getDocNameListAPI, getDocTypeListAPI } from "@/api/doc";
import type { DocNameRow, DocTypeRow } from "@/types/doc";
import type { QcItemRow, TimeRuleRow } from "@/types/emr";
import { uniqueBy } from "../CohortDict/utils";
import { ALERT_FIELDS, DICT_PATIENT_TYPE, DICT_TIME_TYPE, DICT_TIME_UNIT } from "./constants";
import { useDictOptions } from "./useDictOptions";

interface TimeRulePropertyForm {
  patient_type?: string;
  rule_no?: string;
  rule_name?: string;
  rule_code?: string;
  rule_code_system?: string;
  rule_desc?: string;
  rule_tag?: string;
  rule_note?: string;
  time_type?: string;
  time_duration?: number | null;
  time_unit?: string;
  doc_type?: number;
  doc_name?: number;
  alert_user?: number | null;
  alert_leader?: number | null;
  alert_director?: number | null;
  alert_manager?: number | null;
  alert_president?: number | null;
  qc_id?: number;
  sort_no?: string;
}

export interface TimeRulePropertyModalProps {
  open: boolean;
  mode: "create" | "edit";
  ruleType: string;
  ruleId?: number;
  orgId?: number;
  workType?: string;
  onCancel: () => void;
  onSaved: () => void;
}

const toAlertString = (value?: number | null) =>
  value == null ? "" : String(value);

const parseAlertNumber = (value?: string) => {
  if (value == null || value === "") return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
};

const TimeRulePropertyModal = ({
  open,
  mode,
  ruleType,
  ruleId,
  orgId,
  workType,
  onCancel,
  onSaved,
}: TimeRulePropertyModalProps) => {
  const { message } = App.useApp();
  const [form] = Form.useForm<TimeRulePropertyForm>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [docTypeList, setDocTypeList] = useState<DocTypeRow[]>([]);
  const [docNameList, setDocNameList] = useState<DocNameRow[]>([]);
  const [qcItemList, setQcItemList] = useState<QcItemRow[]>([]);
  const selectedDocType = Form.useWatch("doc_type", form);

  const { options: patientTypeOptions, loading: patientTypeLoading } =
    useDictOptions(DICT_PATIENT_TYPE, open);
  const { options: timeTypeOptions, loading: timeTypeLoading } =
    useDictOptions(DICT_TIME_TYPE, open);
  const { options: timeUnitOptions, loading: timeUnitLoading } =
    useDictOptions(DICT_TIME_UNIT, open);

  const loadDocNames = useCallback(async (typeId: number) => {
    const res = await getDocNameListAPI({ type_id: typeId });
    const names = uniqueBy(res.row_list ?? [], (item) => item.doc_name);
    setDocNameList(names);
    return names;
  }, []);

  const fillForm = useCallback(
    async (property: TimeRuleRow, types: DocTypeRow[]) => {
      const values: TimeRulePropertyForm = {
        patient_type: property.patient_type,
        rule_no: property.rule_no,
        rule_name: property.rule_name,
        rule_code: property.rule_code,
        rule_code_system: property.rule_code_system,
        rule_desc: property.rule_desc,
        rule_tag: property.rule_tag,
        rule_note: property.rule_note,
        time_type: property.time_type,
        time_duration: property.time_duration,
        time_unit: property.time_unit,
        alert_user: parseAlertNumber(property.alert_user),
        alert_leader: parseAlertNumber(property.alert_leader),
        alert_director: parseAlertNumber(property.alert_director),
        alert_manager: parseAlertNumber(property.alert_manager),
        alert_president: parseAlertNumber(property.alert_president),
        qc_id: property.qc_id && property.qc_id > 0 ? property.qc_id : undefined,
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
        const [typeRes, qcRes] = await Promise.all([
          getDocTypeListAPI({}),
          getQcItemList({ work_type: workType }),
        ]);
        if (cancelled) return;

        const types = uniqueBy(typeRes.row_list ?? [], (item) => item.doc_type);
        setDocTypeList(types);
        setQcItemList(qcRes.item_list ?? []);

        if (mode === "edit" && ruleId != null) {
          const res = await getTimeRulePropertyAPI({ rule_id: ruleId });
          if (cancelled) return;
          if (res.rule_property) {
            await fillForm(res.rule_property, types);
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
  }, [fillForm, form, mode, open, ruleId, workType]);

  const handleDocTypeChange = (typeId: number | undefined) => {
    form.setFieldValue("doc_name", undefined);
    setDocNameList([]);
    if (typeId != null) {
      void loadDocNames(typeId);
    }
  };

  const buildPayload = (values: TimeRulePropertyForm): TimeRuleRow => {
    const docType = docTypeList.find((item) => item.type_id === values.doc_type);
    const docName = docNameList.find((item) => item.name_id === values.doc_name);
    const qcItem = qcItemList.find((item) => item.item_id === values.qc_id);

    return {
      patient_type: values.patient_type,
      rule_type: ruleType,
      rule_no: values.rule_no,
      rule_name: values.rule_name,
      rule_code: values.rule_code,
      rule_code_system: values.rule_code_system,
      rule_desc: values.rule_desc,
      rule_tag: values.rule_tag,
      rule_note: values.rule_note,
      time_type: values.time_type,
      time_duration: values.time_duration ?? undefined,
      time_unit: values.time_unit,
      doc_type: docType?.doc_type ?? "",
      doc_name: docName?.doc_name ?? "",
      alert_user: toAlertString(values.alert_user),
      alert_leader: toAlertString(values.alert_leader),
      alert_director: toAlertString(values.alert_director),
      alert_manager: toAlertString(values.alert_manager),
      alert_president: toAlertString(values.alert_president),
      qc_id: values.qc_id ?? 0,
      qc_name: qcItem?.item_name,
      qc_score: qcItem?.item_score,
      sort_no: values.sort_no,
    };
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const payload = buildPayload(values);
      setSaving(true);
      if (mode === "create") {
        await newTimeRuleAPI({
          ...payload,
          org_id: orgId ?? 0,
          patient_type: payload.patient_type ?? "",
          rule_type: ruleType,
          rule_name: payload.rule_name ?? "",
          time_type: payload.time_type ?? "",
          time_duration: payload.time_duration ?? 0,
          time_unit: payload.time_unit ?? "",
          doc_type: payload.doc_type ?? "",
          doc_name: payload.doc_name ?? "",
          alert_user: payload.alert_user ?? "",
          alert_leader: payload.alert_leader ?? "",
          alert_director: payload.alert_director ?? "",
          alert_manager: payload.alert_manager ?? "",
          alert_president: payload.alert_president ?? "",
        });
        message.success("新增成功");
      } else if (ruleId != null) {
        await saveTimeRulePropertyAPI({
          rule_id: ruleId,
          rule_property: payload,
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
      title={mode === "create" ? "新增时限规则" : "编辑时限规则"}
      open={open}
      onCancel={onCancel}
      onOk={() => void handleOk()}
      confirmLoading={saving}
      width={920}
      destroyOnHidden
    >
      <Spin spinning={loading}>
        <Form form={form} layout="vertical" className="pt-2">
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item
                name="patient_type"
                label="患者类型"
                rules={[{ required: true, message: "请选择患者类型" }]}
              >
                <Select
                  allowClear
                  placeholder="请选择"
                  loading={patientTypeLoading}
                  options={patientTypeOptions}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="rule_no" label="规则编号">
                <Input placeholder="请输入" maxLength={100} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="rule_name"
                label="规则名称"
                rules={[{ required: true, message: "请输入规则名称" }]}
              >
                <Input placeholder="请输入" maxLength={100} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="rule_code" label="规则编码">
                <Input placeholder="请输入" maxLength={100} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="rule_code_system" label="编码体系">
                <Input placeholder="请输入" maxLength={100} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="sort_no" label="排序号">
                <Input placeholder="请输入" maxLength={100} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={24}>
              <Form.Item name="rule_desc" label="规则描述">
                <Input.TextArea rows={2} placeholder="请输入规则描述" maxLength={200} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={8}>
              <Form.Item
                name="time_type"
                label="时间类型"
                rules={[{ required: true, message: "请选择时间类型" }]}
              >
                <Select
                  allowClear
                  placeholder="请选择"
                  loading={timeTypeLoading}
                  options={timeTypeOptions}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="时限时长" required>
                <Space.Compact className="w-full">
                  <Form.Item
                    name="time_duration"
                    noStyle
                    rules={[{ required: true, message: "请输入时长" }]}
                  >
                    <InputNumber placeholder="时长" className="w-full" min={0} />
                  </Form.Item>
                  <Form.Item
                    name="time_unit"
                    noStyle
                    rules={[{ required: true, message: "请选择单位" }]}
                  >
                    <Select
                      allowClear
                      placeholder="单位"
                      loading={timeUnitLoading}
                      options={timeUnitOptions}
                      className="min-w-24"
                    />
                  </Form.Item>
                </Space.Compact>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="qc_id" label="扣分项">
                <Select
                  allowClear
                  placeholder="可不选"
                  options={qcItemList.map((item) => ({
                    label: item.item_name,
                    value: item.item_id,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="doc_type"
                label="文档类型"
                rules={[{ required: true, message: "请选择文档类型" }]}
              >
                <Select
                  allowClear
                  placeholder="请选择"
                  options={docTypeList.map((item) => ({
                    label: item.doc_type,
                    value: item.type_id,
                  }))}
                  onChange={handleDocTypeChange}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="doc_name"
                label="文档名称"
                rules={[{ required: true, message: "请选择文档名称" }]}
              >
                <Select
                  allowClear
                  placeholder="请选择"
                  disabled={selectedDocType == null}
                  options={docNameList.map((item) => ({
                    label: item.doc_name,
                    value: item.name_id,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            {ALERT_FIELDS.map((field) => (
              <Col flex="1 1 0" key={field.name}>
                <Form.Item
                  name={field.name}
                  label={field.label}
                  rules={[{ required: true, message: `请输入${field.label}` }]}
                >
                  <InputNumber placeholder="请输入" className="w-full" />
                </Form.Item>
              </Col>
            ))}
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="rule_tag" label="规则标签">
                <Input placeholder="请输入" maxLength={100} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="rule_note" label="规则备注">
                <Input placeholder="请输入" maxLength={200} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Spin>
    </Modal>
  );
};

export default TimeRulePropertyModal;
