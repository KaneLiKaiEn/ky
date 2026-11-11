import { useCallback, useEffect, useState } from "react";
import { Checkbox, Form, Modal, Select, Spin, message } from "antd";
import type { ObserveRow } from "../../types";
import { getElemPropertyAPI } from "../../api";
import TempValueSelect from "./TempValueSelect";

const DEFAULT_TEMP_METHOD = "腋温";

const TEMP_TYPE_OPTIONS = [
  { value: "腋温", label: "腋温" },
  { value: "口温", label: "口温" },
  { value: "肛温", label: "肛温" },
];

export function parseObserveNote(note?: string) {
  const result = {
    suddenRise: "",
    physicalCooling: "",
    verified: false,
  };
  if (!note) return result;
  note.split(";").forEach((part) => {
    const idx = part.indexOf("=");
    if (idx < 0) return;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key === "突然升高") result.suddenRise = val;
    else if (key === "物理降温") result.physicalCooling = val;
    else if (key === "已校验") result.verified = val === "1";
  });
  return result;
}

export function buildObserveNote(
  suddenRise: string,
  physicalCooling: string,
  verified: boolean,
) {
  const parts: string[] = [];
  if (suddenRise.trim()) parts.push(`突然升高=${suddenRise.trim()}`);
  if (physicalCooling.trim()) parts.push(`物理降温=${physicalCooling.trim()}`);
  if (verified) parts.push("已校验=1");
  return parts.join(";");
}

export interface TempEditModalProps {
  open: boolean;
  observe?: ObserveRow;
  /** 当前单元格已有体温值（用于判断新增/编辑） */
  cellValue?: string;
  defaultMethod?: string;
  onClose: () => void;
  onSave: (payload: {
    observe_value: string;
    observe_method: string;
    observe_note: string;
  }) => Promise<void> | void;
}

interface FormValues {
  observe_value?: string;
  observe_method?: string;
  sudden_rise?: string;
  physical_cooling?: string;
  verified?: boolean;
}

/** 体温属性弹窗：有值=编辑，无值=新增 */
export default function TempEditModal({
  open,
  observe,
  cellValue,
  defaultMethod,
  onClose,
  onSave,
}: TempEditModalProps) {
  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [valueMin, setValueMin] = useState(35);
  const [valueMax, setValueMax] = useState(42);

  const existingValue = (cellValue ?? observe?.observe_value ?? "").trim();
  const isEdit = !!existingValue;

  const loadElemRange = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getElemPropertyAPI({
        elem_name: "体温",
      });
      if (res?.code !== 0) {
        message.error(
          `${res?.message || "获取体温范围失败"}${res?.hint ? `（${res.hint}）` : ""}`,
        );
        return;
      }
      const first = res?.elem_property;
      const min = Number(first?.value_min);
      const max = Number(first?.value_max);
      if (Number.isFinite(min)) setValueMin(min);
      if (Number.isFinite(max)) setValueMax(max);
    } catch {
      message.error("获取体温范围失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    void loadElemRange();
    const note = parseObserveNote(observe?.observe_note);
    form.setFieldsValue({
      observe_value: existingValue || undefined,
      observe_method:
        observe?.observe_method || defaultMethod || DEFAULT_TEMP_METHOD,
      sudden_rise: note.suddenRise || undefined,
      physical_cooling: note.physicalCooling || undefined,
      verified: note.verified,
    });
  }, [open, observe, defaultMethod, form, loadElemRange, existingValue]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const observe_value = (values.observe_value || "").trim();
      if (!observe_value) {
        message.warning("请选择体温");
        return;
      }
      const observe_method =
        values.observe_method || defaultMethod || DEFAULT_TEMP_METHOD;
      const observe_note = buildObserveNote(
        values.sudden_rise || "",
        values.physical_cooling || "",
        !!values.verified,
      );
      setSaving(true);
      await onSave({ observe_value, observe_method, observe_note });
      onClose();
    } catch (e: any) {
      if (e?.errorFields) return;
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={isEdit ? "编辑体温属性" : "新增体温属性"}
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={saving}
      destroyOnHidden
      width={620}
      okText="确定"
      cancelText="取消"
    >
      <Spin spinning={loading}>
        <Form
          form={form}
          layout="horizontal"
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 16 }}
          className="mt-2"
        >
          <Form.Item
            label="体温"
            name="observe_value"
            rules={[{ required: true, message: "请选择体温" }]}
          >
            <TempValueSelect
              valueMin={valueMin}
              valueMax={valueMax}
              allowClear={false}
            />
          </Form.Item>
          <Form.Item label="类型" name="observe_method">
            <Select options={TEMP_TYPE_OPTIONS} />
          </Form.Item>
          <Form.Item label="突然升高" name="sudden_rise">
            <TempValueSelect valueMin={valueMin} valueMax={valueMax} />
          </Form.Item>
          <Form.Item label="物理降温" name="physical_cooling">
            <TempValueSelect valueMin={valueMin} valueMax={valueMax} />
          </Form.Item>
          <Form.Item label="已校验" name="verified" valuePropName="checked">
            <Checkbox />
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  );
}

export { DEFAULT_TEMP_METHOD as TEMP_EDIT_DEFAULT_METHOD };
