import { useDataThemeStyle } from "../../../../theme";
import { AdaptiveForm } from "../../../../form/AdaptiveForm";
import { getDatasetArgList, saveDatasetArgList } from "../../../api/dataset";
import { argumentPayload, argumentTypes, sourceTypes } from "../model";
import type { EditorContext } from "../types";
import { useManagementEditor } from "comm/management";
import { decodeTags, encodeTags, id, sameId, text } from "comm/utils";
import type { DatasetArgRow } from "../../../types/dataset.d.ts";
import { PlusOutlined, SelectOutlined } from "@ant-design/icons";
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
  Table,
  Typography,
} from "antd";
import { useCallback, useEffect, useRef, useState } from "react";

import { formLayout } from "../../../styles/formLayout";
import OptionPicker, { type PickedOption } from "./OptionPicker";
import Editor from "../../../components/ManagementEditor/index";

type Argument = DatasetArgRow & { __key: string; __sourceName?: string };
export default function ArgumentsPanel({
  context,
}: {
  context: EditorContext;
}) {
  const themeStyle = useDataThemeStyle();
  const { dataset, identity, guard } = context;
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const persisted = useRef<Argument[]>([]),
    deleted = useRef(new Set<number>());
  const pendingCodes = useRef<string[] | undefined>(undefined);
  const [refreshPending, setRefreshPending] = useState(false);
  const onDirtyChange = useCallback(
    (dirty: boolean) =>
      guard.onDirtyChange(
        dirty || (mounted.current && pendingCodes.current !== undefined),
      ),
    [guard.onDirtyChange],
  );
  const registerSave = useCallback(
    (save: (() => Promise<boolean>) | null) => {
      guard.registerSave(
        save
          ? async () => (await save()) && pendingCodes.current === undefined
          : null,
      );
    },
    [guard.registerSave],
  );
  const editor = useManagementEditor<Argument[]>(
    {
      identity: `args:${identity}`,
      isCurrent: context.isCurrent,
      guard: { ...guard, onDirtyChange, registerSave },
    },
    async () => {
      const rows =
        (
          await getDatasetArgList({
            dataset_id: dataset.dataset_id,
            replace_default: false,
            column_list: "*",
          })
        ).row_list ?? [];
      if (
        pendingCodes.current &&
        (rows.length !== pendingCodes.current.length ||
          rows.some((row) => !id(row.arg_id)) ||
          new Set(rows.map((row) => id(row.arg_id))).size !== rows.length ||
          JSON.stringify(rows.map((row) => row.arg_code?.trim()).sort()) !==
            JSON.stringify([...pendingCodes.current].sort()))
      )
        throw new Error("服务未返回完整的参数 ID，请重新读取");
      const next = rows.map((row) => ({
        ...row,
        __key: row.arg_id ? String(row.arg_id) : crypto.randomUUID(),
      }));
      if (mounted.current && context.isCurrent()) {
        persisted.current = next;
        deleted.current.clear();
        if (pendingCodes.current) guard.onDirtyChange(false);
        pendingCodes.current = undefined;
        setRefreshPending(false);
      }
      return next;
    },
    async (rows) => {
      const payload = argumentPayload(rows, dataset.dataset_id!);
      for (const row of persisted.current) {
        const argId = id(row.arg_id);
        if (
          argId &&
          !rows.some((candidate) => sameId(candidate.arg_id, argId)) &&
          !deleted.current.has(argId)
        ) {
          if (!context.isCurrent()) throw new Error("会话或资源已切换");
          await saveDatasetArgList({
            dataset_id: dataset.dataset_id,
            delete_row: argId,
          });
          deleted.current.add(argId);
        }
      }
      if (!context.isCurrent()) throw new Error("会话或资源已切换");
      await saveDatasetArgList({
        dataset_id: dataset.dataset_id,
        row_list: payload,
      });
      if (mounted.current && context.isCurrent()) {
        pendingCodes.current = payload.map((row) => row.arg_code!.trim());
        setRefreshPending(true);
      }
    },
    async () => context.onSaved(),
  );
  const [picker, setPicker] = useState<{
    key: string;
    kind: "source" | "dataset";
  }>();
  const [editing, setEditing] = useState<string>();
  const update = (key: string, changes: Partial<Argument>) =>
    editor.setValue((rows) =>
      rows?.map((row) => (row.__key === key ? { ...row, ...changes } : row)),
    );
  const current = editor.value?.find((row) => row.__key === picker?.key);
  const selected: PickedOption | undefined =
    current && id(current.source_id)
      ? {
          value: id(current.source_id)!,
          label:
            current.__sourceName ||
            context.sources.find((row) =>
              sameId(row.source_id, current.source_id),
            )?.source_name ||
            String(current.source_id),
        }
      : undefined;
  const extra = editor.value?.find((row) => row.__key === editing);
  return (
    <Editor
      title="参数"
      readOnly={refreshPending}
      recoveryAction={refreshPending ? { run: editor.reload } : undefined}
      description="配置参数类型、默认值和选项来源。选择弹窗仅用于选择现有资源。"
      {...editor}
      retry={() => void editor.reload().catch(() => {})}
    >
      {refreshPending && (
        <Alert
          type="info"
          title="参数已提交，需重新读取服务分配的 ID；读取完成前暂不能继续编辑。"
        />
      )}
      <Button
        icon={<PlusOutlined />}
        disabled={editor.busy || refreshPending}
        onClick={() =>
          editor.setValue((rows) => [
            ...(rows ?? []),
            {
              __key: crypto.randomUUID(),
              arg_type: "STR",
              source_type: "OPTION",
              source_id: 0,
            },
          ])
        }
      >
        新建参数
      </Button>
      <Table<Argument>
        className="de-table"
        size="small"
        rowKey="__key"
        dataSource={editor.value}
        pagination={false}
        scroll={{ x: 1560 }}
        columns={[
          {
            title: "编码",
            width: 150,
            render: (_, row) => (
              <Input
                aria-label="参数编码"
                value={row.arg_code}
                onChange={(event) =>
                  update(row.__key, { arg_code: event.target.value })
                }
              />
            ),
          },
          {
            title: "参数名",
            width: 150,
            render: (_, row) => (
              <Input
                aria-label="参数名"
                value={row.arg_name}
                onChange={(event) =>
                  update(row.__key, { arg_name: event.target.value })
                }
              />
            ),
          },
          {
            title: "类型",
            width: 125,
            render: (_, row) => (
              <Select
                aria-label="参数类型"
                value={row.arg_type}
                options={argumentTypes.map((value) => ({ value }))}
                onChange={(arg_type) => update(row.__key, { arg_type })}
              />
            ),
          },
          {
            title: "默认值",
            width: 160,
            render: (_, row) => (
              <Input
                aria-label="参数默认值"
                value={row.arg_value}
                onChange={(event) =>
                  update(row.__key, { arg_value: event.target.value })
                }
              />
            ),
          },
          {
            title: "显示值",
            width: 150,
            render: (_, row) => (
              <Input
                value={row.arg_text}
                onChange={(event) =>
                  update(row.__key, { arg_text: event.target.value })
                }
              />
            ),
          },
          {
            title: "来源类型",
            width: 140,
            render: (_, row) => (
              <Select
                aria-label="来源类型"
                value={row.source_type}
                options={sourceTypes.map((value) => ({ value }))}
                onChange={(source_type) => {
                  setPicker(undefined);
                  update(row.__key, {
                    source_type,
                    source_id: 0,
                    __sourceName: "",
                  });
                }}
              />
            ),
          },
          {
            title: "来源",
            width: 200,
            render: (_, row) =>
              ["SQL", "DATASET"].includes(row.source_type || "") ? (
                <Button
                  block
                  icon={<SelectOutlined />}
                  onClick={() =>
                    setPicker({
                      key: row.__key,
                      kind: row.source_type === "SQL" ? "source" : "dataset",
                    })
                  }
                >
                  {row.__sourceName ||
                    context.sources.find(
                      (source) =>
                        row.source_type === "SQL" &&
                        sameId(source.source_id, row.source_id),
                    )?.source_name ||
                    (id(row.source_id) ? `#${row.source_id}` : "选择来源")}
                </Button>
              ) : (
                <Typography.Text type="secondary">无需选择</Typography.Text>
              ),
          },
          {
            title: "来源值",
            width: 170,
            render: (_, row) => (
              <Input
                value={row.source_value}
                onChange={(event) =>
                  update(row.__key, { source_value: event.target.value })
                }
              />
            ),
          },
          {
            title: "传入检索词",
            width: 110,
            render: (_, row) => (
              <Checkbox
                aria-label="传入检索词"
                checked={decodeTags(row.source_tag).includes("RETRIEVE_INPUT")}
                onChange={(event) =>
                  update(row.__key, {
                    source_tag: encodeTags([
                      ...decodeTags(row.source_tag).filter(
                        (tag) => tag !== "RETRIEVE_INPUT",
                      ),
                      ...(event.target.checked ? ["RETRIEVE_INPUT"] : []),
                    ]),
                  })
                }
              />
            ),
          },
          {
            title: "操作",
            fixed: "right",
            width: 120,
            render: (_, row) => (
              <Space size={0}>
                <Button
                  type="link"
                  size="small"
                  onClick={() => setEditing(row.__key)}
                >
                  更多
                </Button>
                <Button
                  type="link"
                  size="small"
                  danger
                  aria-label="删除参数"
                  onClick={() => {
                    setPicker(undefined);
                    editor.setValue((rows) =>
                      rows?.filter((item) => item.__key !== row.__key),
                    );
                  }}
                >
                  删除
                </Button>
              </Space>
            ),
          },
        ]}
      />
      {picker && current && (
        <OptionPicker
          key={`${identity}:${picker.key}`}
          kind={picker.kind}
          identity={`${identity}:${picker.key}`}
          open
          orgId={context.orgId}
          catalogs={context.catalogs}
          sources={context.sources}
          value={selected}
          onCancel={() => setPicker(undefined)}
          onSelect={(option) => {
            update(picker.key, {
              source_id: option.value,
              __sourceName: option.label,
            });
            setPicker(undefined);
          }}
        />
      )}
      <Modal
        title="参数补充配置"
        open={!!extra}
        onCancel={() => setEditing(undefined)}
        footer={
          <Button type="primary" onClick={() => setEditing(undefined)}>
            完成
          </Button>
        }
        style={themeStyle}
      >
        {extra && (
          <AdaptiveForm labelSizing="group" {...formLayout}>
            <div className="mw-form-grid" data-form-label-group>
              <Form.Item label="最小值">
                <InputNumber
                  stringMode
                  value={text(extra.value_min) || null}
                  onChange={(value) =>
                    update(extra.__key, { value_min: text(value) })
                  }
                />
              </Form.Item>
              <Form.Item label="最大值">
                <InputNumber
                  stringMode
                  value={text(extra.value_max) || null}
                  onChange={(value) =>
                    update(extra.__key, { value_max: text(value) })
                  }
                />
              </Form.Item>
              {(
                [
                  ["arg_desc", "描述"],
                  ["arg_note", "备注"],
                  ["sort_no", "排序号"],
                ] as const
              ).map(([field, label]) => (
                <Form.Item
                  className={field === "sort_no" ? undefined : "mw-form-wide"}
                  label={label}
                  key={field}
                >
                  {field === "sort_no" ? (
                    <Input
                      value={text(extra[field])}
                      onChange={(event) =>
                        update(extra.__key, { [field]: event.target.value })
                      }
                    />
                  ) : (
                    <Input.TextArea
                      rows={3}
                      value={text(extra[field])}
                      onChange={(event) =>
                        update(extra.__key, { [field]: event.target.value })
                      }
                    />
                  )}
                </Form.Item>
              ))}
            </div>
          </AdaptiveForm>
        )}
      </Modal>
    </Editor>
  );
}
