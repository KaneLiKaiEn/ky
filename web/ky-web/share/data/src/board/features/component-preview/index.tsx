import { AdaptiveForm } from "../../../form/AdaptiveForm";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Button,
  Checkbox,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  theme,
} from "antd";
import { useResource } from "comm/resource";
import Feedback from "../../components/Feedback/index";
import { errorText } from "comm/utils";
import { formLayout } from "../../styles/formLayout";
import { useManagementStyle } from "../../hooks/useManagementStyle";
import { previewDocument, type PreviewResult } from "./model";
import { runtimeScripts } from "./runtime";

export interface PreviewParameter {
  code?: string;
  label: string;
  value?: string;
  type?: string;
}
export interface PreviewSettings {
  width: number;
  height: number;
  theme: string;
  decoration?: boolean;
}
export interface PreviewContext {
  identity: string;
  isCurrent: () => boolean;
  setPageBusy: (busy: boolean) => void;
}

export default function ComponentPreview({
  context,
  close,
  loadParameters,
  runPreview,
  title,
  frameTitle,
  showDecoration = false,
}: {
  context: PreviewContext;
  close: () => void;
  loadParameters: () => Promise<PreviewParameter[]>;
  runPreview: (
    settings: PreviewSettings,
    parameters: PreviewParameter[],
  ) => Promise<PreviewResult>;
  title: string;
  frameTitle: string;
  showDecoration?: boolean;
}) {
  const [form] = Form.useForm();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [doc, setDoc] = useState("");
  const lock = useRef(false);
  const mounted = useRef(true);
  const { token } = theme.useToken();
  const style = useManagementStyle();
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const parameters = useResource(
    `${context.identity}:preview-parameters`,
    loadParameters,
  );
  const closePreview = () => {
    if (!busy) {
      mounted.current = false;
      close();
    }
  };
  const run = async () => {
    if (lock.current || !context.isCurrent()) return;
    let started = false;
    try {
      const values = await form.validateFields();
      if (lock.current || !mounted.current || !context.isCurrent()) return;
      lock.current = true;
      started = true;
      setBusy(true);
      setError(undefined);
      setDoc("");
      context.setPageBusy(true);
      const result = await runPreview(
        values,
        (parameters.data ?? []).map((row, index) => ({
          ...row,
          value: String(values.parameters?.[index] ?? row.value ?? ""),
        })),
      );
      if (mounted.current && context.isCurrent())
        setDoc(previewDocument(result, runtimeScripts, token.colorError));
    } catch (err) {
      if (
        mounted.current &&
        context.isCurrent() &&
        !(err && typeof err === "object" && "errorFields" in err)
      )
        setError(errorText(err));
    } finally {
      if (started) {
        lock.current = false;
        if (mounted.current && context.isCurrent()) {
          setBusy(false);
          context.setPageBusy(false);
        }
      }
    }
  };
  return (
    <Modal
      title={title}
      open
      width="min(1200px, 96vw)"
      style={style}
      destroyOnHidden
      styles={{ body: { maxHeight: "calc(100vh - 240px)", overflowY: "auto" } }}
      mask={{ closable: false }}
      onCancel={closePreview}
      footer={
        <Space>
          <Button disabled={busy} onClick={closePreview}>
            关闭
          </Button>
          <Button
            type="primary"
            loading={busy}
            disabled={parameters.loading || !!parameters.error}
            onClick={() => void run()}
          >
            运行测试
          </Button>
        </Space>
      }
    >
      <Feedback
        loading={parameters.loading}
        error={parameters.error}
        retry={() => void parameters.reload().catch(() => {})}
      />
      {error && <Alert type="error" title={error} showIcon />}
      <AdaptiveForm
        form={form}
        {...formLayout}
        initialValues={{ width: 500, height: 400, theme: "default" }}
        disabled={busy}
      >
        <div className="bw-test-settings">
          <Form.Item
            name="width"
            label="宽度（px）"
            rules={[{ required: true }]}
          >
            <InputNumber min={1} max={10000} precision={0} />
          </Form.Item>
          <Form.Item
            name="height"
            label="高度（px）"
            rules={[{ required: true }]}
          >
            <InputNumber min={1} max={10000} precision={0} />
          </Form.Item>
          <Form.Item name="theme" label="主题">
            <Select
              options={["default", "light", "dark"].map((value) => ({
                value,
                label: value,
              }))}
            />
          </Form.Item>
          {showDecoration && (
            <Form.Item name="decoration" valuePropName="checked">
              <Checkbox>使用边框和标题装饰</Checkbox>
            </Form.Item>
          )}
        </div>
        {(parameters.data ?? []).map((row, index) => (
          <Form.Item
            key={`${row.code}:${index}`}
            name={["parameters", index]}
            label={row.label}
            initialValue={row.value ?? ""}
          >
            <Input.TextArea autoSize={{ minRows: 1, maxRows: 5 }} />
          </Form.Item>
        ))}
      </AdaptiveForm>
      {doc && (
        <iframe
          className="bw-preview-frame"
          title={frameTitle}
          sandbox="allow-scripts"
          srcDoc={doc}
        />
      )}
    </Modal>
  );
}
