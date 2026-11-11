import { useDataThemeStyle } from "../../../../theme";
import { AdaptiveForm } from "../../../../form/AdaptiveForm";
import {
  deleteSubset,
  getSubsetList,
  getSubsetProperty,
  newSubset,
} from "../../../api/dataset";
import type { EditorContext } from "../types";
import { useResource } from "comm/resource";
import { cleanRow, errorText, id, text } from "comm/utils";
import { CopyOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import {
  Alert,
  App,
  Button,
  Empty,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Tabs,
} from "antd";
import { useEffect, useRef, useState } from "react";

import { formLayout } from "../../../styles/formLayout";
import PropertyPanel from "./PropertyPanel";
import TransPanel from "./TransPanel";
import { Feedback } from "../../../components/ManagementEditor/index";

export default function SubsetsPanel({
  context,
  subsetId,
  onSelect,
}: {
  context: EditorContext;
  subsetId: number | null;
  onSelect: (value: number | null) => void;
}) {
  const themeStyle = useDataThemeStyle();
  const { modal } = App.useApp();
  const resource = useResource(
    `subsets:${context.identity}`,
    async () =>
      (
        await getSubsetList({
          dataset_id: context.dataset.dataset_id,
          column_list: "*",
        })
      ).row_list ?? [],
  );
  const [tab, setTab] = useState("property"),
    [creating, setCreating] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<string>();
  const [form] = Form.useForm();
  const lock = useRef(false);
  const createdId = useRef<number | undefined>(undefined);
  const copied = useRef<{ source: number; id: number } | undefined>(undefined);
  useEffect(() => {
    setTab("property");
  }, [subsetId]);
  const selected = resource.data?.find((row) => id(row.subset_id) === subsetId);
  const subsetContext: EditorContext = {
    ...context,
    onSaved: (row) => {
      if (!context.isCurrent()) return;
      context.onSaved(row);
      void resource.reload().catch(() => {});
    },
  };
  useEffect(() => {
    if (
      resource.data &&
      !resource.loading &&
      !resource.error &&
      subsetId &&
      !selected
    )
      onSelect(null);
  }, [resource.data, resource.loading, resource.error, subsetId, selected]);
  const run = async (action: () => Promise<void>) => {
    if (lock.current || !(await context.guard.ensureSaved())) return;
    if (lock.current || !context.isCurrent()) return;
    lock.current = true;
    setBusy(true);
    setError(undefined);
    context.guard.setPageBusy(true);
    try {
      await action();
    } catch (err) {
      setError(errorText(err));
    } finally {
      lock.current = false;
      setBusy(false);
      context.guard.setPageBusy(false);
    }
  };
  const create = async () => {
    let values: { subset_name: string; source_id: number };
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    await run(async () => {
      const response = createdId.current
        ? { subset_id: createdId.current }
        : await newSubset({
            dataset_id: context.dataset.dataset_id,
            subset_name: values.subset_name.trim(),
            source_id: values.source_id,
            sort_no: "0",
          });
      const nextId = id(response.subset_id);
      if (!nextId) throw new Error("服务未返回新子集 ID");
      createdId.current = nextId;
      if (!context.isCurrent()) return;
      await resource.reload();
      if (!context.isCurrent()) return;
      setCreating(false);
      context.guard.setPageBusy(false);
      onSelect(nextId);
    });
  };
  return (
    <section className="mw-editor">
      <div className="mw-section-heading">
        <div>
          <h3>子集</h3>
          <p>选择子集后配置属性和转换脚本。</p>
        </div>
        <Space wrap>
          <Button
            icon={<PlusOutlined />}
            disabled={busy || context.guard.busy}
            onClick={async () => {
              if (await context.guard.ensureSaved()) {
                form.resetFields();
                createdId.current = undefined;
                setCreating(true);
              }
            }}
          >
            新建子集
          </Button>
          <Button
            icon={<CopyOutlined />}
            disabled={!selected || busy || context.guard.busy}
            onClick={() =>
              void run(async () => {
                if (copied.current?.source === subsetId) {
                  await resource.reload();
                  if (!context.isCurrent()) return;
                  context.guard.setPageBusy(false);
                  onSelect(copied.current.id);
                  copied.current = undefined;
                  return;
                }
                const row = (
                  await getSubsetProperty({
                    subset_id: subsetId!,
                    column_list: "*",
                  })
                ).subset_property;
                if (!context.isCurrent()) return;
                if (!row) throw new Error("未取得子集属性");
                const {
                  subset_id: _id,
                  input_time: _time,
                  input_session: _session,
                  input_note: _note,
                  ...values
                } = row;
                const response = await newSubset(
                  cleanRow({
                    ...values,
                    dataset_id: context.dataset.dataset_id,
                    subset_name: `${row.subset_name || "子集"} 副本`,
                  }),
                );
                const nextId = id(response.subset_id);
                if (!nextId) throw new Error("服务未返回新子集 ID");
                copied.current = { source: subsetId!, id: nextId };
                if (!context.isCurrent()) return;
                await resource.reload();
                if (!context.isCurrent()) return;
                context.guard.setPageBusy(false);
                onSelect(nextId);
                copied.current = undefined;
              })
            }
          >
            复制属性
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            disabled={!selected || busy || context.guard.busy}
            onClick={() =>
              modal.confirm({
                title: `删除子集“${selected?.subset_name || ""}”？`,
                okButtonProps: { danger: true },
                onOk: () =>
                  run(async () => {
                    await deleteSubset({ subset_id: subsetId! });
                    if (!context.isCurrent()) return;
                    await resource.reload();
                    context.guard.setPageBusy(false);
                    onSelect(null);
                  }),
              })
            }
          >
            删除
          </Button>
        </Space>
      </div>
      <Feedback
        loading={resource.loading}
        error={resource.error}
        retry={() => void resource.reload().catch(() => {})}
      />
      {error && <Alert type="error" title={error} />}
      <Select
        aria-label="选择子集"
        className="de-subset-select"
        placeholder="选择子集"
        value={selected ? subsetId : undefined}
        disabled={busy || context.guard.busy}
        options={(resource.data ?? []).map((row) => ({
          value: id(row.subset_id)!,
          label: `${row.subset_name || "未命名"}${row.subset_code ? ` · ${row.subset_code}` : ""}`,
        }))}
        onChange={onSelect}
      />
      {selected ? (
        <>
          <Tabs
            activeKey={tab}
            items={[
              { key: "property", label: "属性" },
              { key: "trans", label: "转换脚本" },
            ]}
            onChange={async (next) => {
              if (await context.guard.allow()) setTab(next);
            }}
          />
          {tab === "property" ? (
            <PropertyPanel
              key={`${subsetId}:property`}
              context={subsetContext}
              subsetId={subsetId!}
            />
          ) : (
            <TransPanel
              key={`${subsetId}:trans`}
              context={context}
              subsetId={subsetId!}
            />
          )}
        </>
      ) : (
        !resource.loading && <Empty description="请选择或创建子集" />
      )}
      <Modal
        title="新建子集"
        open={creating}
        confirmLoading={busy}
        okText={createdId.current ? "重试读取" : "确定"}
        onOk={() => void create()}
        onCancel={() => !busy && setCreating(false)}
        destroyOnHidden
        style={themeStyle}
      >
        {error && <Alert type="error" title={error} />}
        <AdaptiveForm
          labelSizing="group"
          {...formLayout}
          form={form}
          disabled={busy || !!createdId.current}
        >
          <Form.Item
            name="subset_name"
            label="名称"
            rules={[{ required: true, whitespace: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="source_id"
            label="数据源"
            rules={[{ required: true }]}
          >
            <Select
              options={context.sources.map((row) => ({
                value: id(row.source_id)!,
                label: text(row.source_name),
              }))}
            />
          </Form.Item>
        </AdaptiveForm>
      </Modal>
    </section>
  );
}
