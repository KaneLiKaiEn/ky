import { useDataThemeStyle } from "../../../../theme";
import { AdaptiveForm } from "../../../../form/AdaptiveForm";
import {
  getDatasetArgList,
  testDataset,
  testSubset,
} from "../../../api/dataset";
import { testArguments } from "../model";
import type { EditorContext } from "../types";
import { useResource } from "comm/resource";
import { errorText, text } from "comm/utils";
import type { DatasetArgRow } from "../../../types/dataset.d.ts";
import {
  Alert,
  App,
  Button,
  Checkbox,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
} from "antd";
import { useRef, useState } from "react";

import { formLayout } from "../../../styles/formLayout";

export default function TestDialog({
  context,
  subsetId,
  onClose,
}: {
  context: EditorContext;
  subsetId?: number | null;
  onClose: () => void;
}) {
  const themeStyle = useDataThemeStyle();
  const { message } = App.useApp();
  const resource = useResource(
    `test-args:${context.identity}:${subsetId || "dataset"}`,
    async () =>
      (
        await getDatasetArgList({
          dataset_id: context.dataset.dataset_id,
          replace_default: true,
          column_list: "*",
        })
      ).row_list ?? [],
  );
  const [values, setValues] = useState<Record<string, string>>({}),
    [noTrans, setNoTrans] = useState(false),
    [format, setFormat] = useState("");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<string>(),
    [result, setResult] = useState<string>();
  const lock = useRef(false);
  const run = async () => {
    if (lock.current || !resource.data || !context.isCurrent()) return;
    lock.current = true;
    setBusy(true);
    setError(undefined);
    context.guard.setPageBusy(true);
    try {
      const arg_list = testArguments(
        resource.data.map((row, index) => ({
          ...row,
          arg_value: values[String(index)] ?? row.arg_value,
        })),
      );
      const response = subsetId
        ? await testSubset({
            subset_id: subsetId,
            arg_list,
            no_trans: noTrans,
            return_format: format,
          })
        : await testDataset({
            dataset_id: context.dataset.dataset_id,
            arg_list,
            no_trans: noTrans,
            return_format: format,
          });
      if (!context.isCurrent()) return;
      setResult(
        typeof response.data === "string"
          ? response.data
          : JSON.stringify(response.data ?? null, null, 2),
      );
    } catch (err) {
      if (context.isCurrent()) setError(errorText(err));
    } finally {
      lock.current = false;
      setBusy(false);
      context.guard.setPageBusy(false);
    }
  };
  return (
    <Modal
      title={subsetId ? "测试子集" : "测试数据集"}
      open
      width={960}
      onCancel={() => !busy && onClose()}
      closable={!busy}
      mask={{ closable: !busy }}
      footer={
        <Space>
          <Button disabled={busy} onClick={onClose}>
            关闭
          </Button>
          <Button
            type="primary"
            loading={busy}
            disabled={resource.loading || !!resource.error}
            onClick={() => void run()}
          >
            运行测试
          </Button>
        </Space>
      }
      style={themeStyle}
    >
      {(error || resource.error) && (
        <Alert
          type="error"
          title={error || resource.error}
          action={
            resource.error && (
              <Button onClick={() => void resource.reload().catch(() => {})}>
                重试读取
              </Button>
            )
          }
        />
      )}
      <Table<DatasetArgRow>
        size="small"
        rowKey="__key"
        loading={resource.loading}
        dataSource={resource.data?.map((row, index) => ({
          ...row,
          __key: String(index),
        }))}
        pagination={false}
        scroll={{ y: 240 }}
        columns={[
          { title: "编码", dataIndex: "arg_code" },
          { title: "参数名", dataIndex: "arg_name" },
          { title: "类型", dataIndex: "arg_type" },
          {
            title: "临时值",
            render: (_, row, index) => (
              <Input
                aria-label={`测试参数 ${row.arg_code}`}
                disabled={busy}
                value={values[String(index)] ?? text(row.arg_value)}
                onChange={(event) =>
                  setValues((previous) => ({
                    ...previous,
                    [String(index)]: event.target.value,
                  }))
                }
              />
            ),
          },
        ]}
      />
      <Space wrap className="de-test-options">
        <Checkbox
          checked={noTrans}
          disabled={busy}
          onChange={(event) => setNoTrans(event.target.checked)}
        >
          跳过转换
        </Checkbox>
        <Select
          aria-label="测试返回格式"
          disabled={busy}
          value={format}
          onChange={setFormat}
          options={[
            { value: "", label: "数据集默认格式" },
            { value: "array" },
            { value: "column" },
          ]}
        />
      </Space>
      {result !== undefined && (
        <AdaptiveForm {...formLayout}>
          <Form.Item
            label={
              <Space>
                测试结果
                <Button
                  size="small"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(result);
                      void message.success("已复制");
                    } catch {
                      void message.error("复制失败，请手动选择结果复制");
                    }
                  }}
                >
                  复制
                </Button>
              </Space>
            }
          >
            <Input.TextArea
              aria-label="测试结果"
              className="de-code"
              rows={14}
              readOnly
              value={result}
            />
          </Form.Item>
        </AdaptiveForm>
      )}
    </Modal>
  );
}
