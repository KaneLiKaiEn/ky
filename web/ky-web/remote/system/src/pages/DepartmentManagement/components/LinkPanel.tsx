import { useSaveShortcut } from "@/hooks/useSaveShortcut";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  App,
  Button,
  Empty,
  Form,
  Input,
  Select,
  Space,
  Spin,
  Table,
  Typography,
} from "antd";
import type { FormInstance } from "antd";
import { saveDeptLinkList } from "@/api/org";
import type { DeptRow } from "@/types/org";
import { departmentOptions } from "../model";
import { assertResultWithHint as assertResult, errorText } from "@/utils/result";
import { parseId } from "@/utils/selection";
import { loadLinks, type DepartmentReferences } from "../references";
import { useResource } from "@/hooks/useResource";
import {
  copyLinks,
  linkFingerprint,
  linkPayload,
  MAX_LINKS,
  validateLinks,
  type LinkDraft,
} from "../linkDto";

interface LinkPanelProps {
  orgId: number;
  department: DeptRow;
  reference: DepartmentReferences;
  disabled?: boolean;
  onDirtyChange: (dirty: boolean) => void;
  onBusyChange: (busy: boolean) => void;
}

interface Values {
  rows: LinkDraft[];
}

function DepartmentCell({
  form,
  index,
  orgId,
  reference,
  disabled,
  changed,
}: {
  form: FormInstance<Values>;
  index: number;
  orgId: number;
  reference: DepartmentReferences;
  disabled: boolean;
  changed: () => void;
}) {
  const type = Form.useWatch(["rows", index, "link_type"], form) as
    | string
    | undefined;
  const id = Form.useWatch(["rows", index, "link_id"], form) as
    | number
    | undefined;
  const name = Form.useWatch(["rows", index, "link_name"], form) as
    | string
    | undefined;
  const departments = useResource(
    type ? `link-departments:${orgId}:${type}` : null,
    () => reference.departments(type!),
  );
  const options = departmentOptions(departments.data ?? []);
  if (id && !options.some((option) => option.value === id))
    options.unshift({
      value: id,
      label: name || `已存科室 ${id}`,
      searchText: `${name ?? ""} ${id}`.toLocaleLowerCase(),
    });
  return (
    <div className="department-link-picker">
      <Form.Item
        name={[index, "link_id"]}
        dependencies={[["rows", index, "link_name"]]}
        rules={[
          {
            validator: (_, value) =>
              parseId(value) && form.getFieldValue(["rows", index, "link_name"])
                ? Promise.resolve()
                : Promise.reject(new Error("请选择对照科室")),
          },
        ]}
      >
        <Select
          aria-label={`对照 ${index + 1} 科室`}
          style={{ width: "100%" }}
          allowClear
          showSearch
          placeholder={type ? "请选择对照科室" : "请先选择科室类型"}
          loading={departments.loading}
          disabled={disabled || !type}
          options={options}
          filterOption={(input, option) =>
            (option?.searchText ?? "").includes(
              input.trim().toLocaleLowerCase(),
            )
          }
          onChange={(value) => {
            const target = departments.data?.find(
              (row) => row.dept_id === value,
            );
            form.setFieldValue(
              ["rows", index, "link_name"],
              target?.dept_name || (value === id ? name : undefined),
            );
            changed();
          }}
          notFoundContent={
            departments.loading ? <Spin size="small" /> : "暂无匹配科室"
          }
        />
      </Form.Item>
      <Form.Item name={[index, "link_name"]} hidden>
        <Input />
      </Form.Item>
      {departments.error && (
        <Typography.Text type="danger">
          科室加载失败
          <Button
            type="link"
            size="small"
            disabled={disabled}
            onClick={departments.reload}
          >
            重试
          </Button>
        </Typography.Text>
      )}
    </div>
  );
}

export default function LinkPanel({
  orgId,
  department,
  reference,
  disabled = false,
  onDirtyChange,
  onBusyChange,
}: LinkPanelProps) {
  const { message, modal } = App.useApp();
  const [form] = Form.useForm<Values>();
  const deptId = parseId(department.dept_id) ?? 0;
  const identity = `${orgId}:${deptId}`;
  const identityRef = useRef(identity);
  identityRef.current = identity;
  const callbacks = useRef({ onDirtyChange, onBusyChange });
  callbacks.current = { onDirtyChange, onBusyChange };
  const epoch = useRef(0);
  const savingRef = useRef(false);
  const resettingRef = useRef(false);
  const baseline = useRef<LinkDraft[]>([]);
  const [loadedKey, setLoadedKey] = useState<string>();
  const [loadState, setLoadState] = useState<{
    key: string;
    loading: boolean;
    error?: string;
  }>();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>();
  const [dirty, setDirty] = useState(false);
  const [reload, setReload] = useState(0);
  const watched = Form.useWatch("rows", { form, preserve: true }) as
    | LinkDraft[]
    | undefined;
  const loaded = loadedKey === identity;
  const loading = !loadState || loadState.key !== identity || loadState.loading;
  const loadError = loadState?.key === identity ? loadState.error : undefined;
  const types = useResource(`link-types:${orgId}`, () =>
    reference.dictionary("dept.type"),
  );
  const typeOptions = [
    ...new Set(
      [
        ...(types.data ?? []).map((row) => row.item_name),
        ...(watched ?? []).map((row) => row.link_type),
      ].filter((value): value is string => Boolean(value)),
    ),
  ].map((value) => ({ value, label: value }));

  useEffect(() => {
    const requestEpoch = ++epoch.current;
    const isCurrent = () =>
      requestEpoch === epoch.current && identityRef.current === identity;
    setLoadedKey(undefined);
    setLoadState({ key: identity, loading: true });
    setSaveError(undefined);
    setSaving(false);
    setDirty(false);
    savingRef.current = false;
    resettingRef.current = false;
    callbacks.current.onDirtyChange(false);
    callbacks.current.onBusyChange(false);
    form.resetFields();
    baseline.current = [];
    if (!deptId) {
      setLoadState({
        key: identity,
        loading: false,
        error: "请先保存科室后再配置科室对照",
      });
      return () => {
        ++epoch.current;
      };
    }
    void loadLinks(deptId, reference).then(
      (rows) => {
        if (!isCurrent()) return;
        baseline.current = copyLinks(rows);
        form.setFieldsValue({ rows: copyLinks(rows) });
        setLoadedKey(identity);
        setLoadState({ key: identity, loading: false });
      },
      (error) => {
        if (isCurrent())
          setLoadState({
            key: identity,
            loading: false,
            error: errorText(error),
          });
      },
    );
    return () => {
      ++epoch.current;
      callbacks.current.onDirtyChange(false);
      callbacks.current.onBusyChange(false);
    };
  }, [identity, deptId, reference, reload, form]);

  useEffect(() => {
    if (!loaded || !watched) return;
    const changed =
      linkFingerprint(watched) !== linkFingerprint(baseline.current);
    setDirty(changed);
    callbacks.current.onDirtyChange(changed);
  }, [watched, loaded]);

  const changed = () => {
    setSaveError(undefined);
    callbacks.current.onDirtyChange(true);
  };

  const reset = async () => {
    if (
      disabled ||
      !loaded ||
      loading ||
      savingRef.current ||
      resettingRef.current
    )
      return;
    resettingRef.current = true;
    const requestEpoch = epoch.current;
    try {
      const accepted =
        !dirty ||
        (await modal.confirm({
          title: "重置科室对照？",
          content: "将恢复为最近一次加载或保存的科室对照，当前修改将被丢弃。",
          okText: "重置",
          cancelText: "继续编辑",
        }));
      if (
        !accepted ||
        requestEpoch !== epoch.current ||
        identityRef.current !== identity ||
        savingRef.current
      )
        return;
      form.resetFields();
      form.setFieldsValue({ rows: copyLinks(baseline.current) });
      setSaveError(undefined);
      setDirty(false);
      callbacks.current.onDirtyChange(false);
    } finally {
      if (requestEpoch === epoch.current && identityRef.current === identity)
        resettingRef.current = false;
    }
  };

  const save = async () => {
    if (
      disabled ||
      !loaded ||
      loading ||
      savingRef.current ||
      resettingRef.current
    )
      return;
    savingRef.current = true;
    setSaving(true);
    setSaveError(undefined);
    callbacks.current.onBusyChange(true);
    const requestEpoch = epoch.current;
    const isCurrent = () =>
      requestEpoch === epoch.current && identityRef.current === identity;
    try {
      // Read the full store so unregistered snapshot metadata remains available.
      const rows = copyLinks(
        (form.getFieldValue("rows") as LinkDraft[] | undefined) ?? [],
      );
      const payload = linkPayload(deptId, department.dept_name ?? "", rows);
      if (!payload.length && baseline.current.length) {
        const accepted = await modal.confirm({
          title: "清空全部科室对照？",
          content: "保存后，该科室的所有对照关系将被移除。",
          okText: "清空并保存",
          cancelText: "继续编辑",
          okButtonProps: { danger: true },
        });
        if (!accepted || !isCurrent()) return;
      }
      assertResult(
        await saveDeptLinkList({
          dept_id: deptId,
          delete_row: 0,
          link_list: payload,
        }),
      );
      if (!isCurrent()) return;
      const saved = payload.map((original) => ({
        original,
        link_type: original.link_type,
        link_id: original.link_id,
        link_name: original.link_name,
      }));
      baseline.current = copyLinks(saved);
      form.setFieldsValue({ rows: copyLinks(saved) });
      setDirty(false);
      callbacks.current.onDirtyChange(false);
      message.success(payload.length ? "科室对照已保存" : "科室对照已清空");
    } catch (error) {
      if (isCurrent()) setSaveError(errorText(error));
    } finally {
      if (isCurrent()) {
        savingRef.current = false;
        setSaving(false);
        callbacks.current.onBusyChange(false);
      }
    }
  };

  useSaveShortcut(() => form.submit(), !disabled && loaded && !loading && !saving);

  return (
    <Form
      form={form}
      layout="vertical"
      className="department-form"
      disabled={disabled || saving || !loaded}
      onValuesChange={changed}
      onFinish={save}
      scrollToFirstError
    >
      {!loaded ? (
        loading ? (
          <div
            role="status"
            aria-label="正在加载科室对照"
            style={{ padding: 48, textAlign: "center" }}
          >
            <Spin />
          </div>
        ) : (
          <Alert
            type="error"
            showIcon
            title="科室对照加载失败"
            description={loadError}
            action={
              <Button
                disabled={disabled || !deptId}
                onClick={() => setReload((value) => value + 1)}
              >
                重试
              </Button>
            }
          />
        )
      ) : (
        <>
          {saveError && (
            <Alert
              className="department-form__notice"
              type="error"
              showIcon
              title="科室对照保存失败"
              description={saveError}
            />
          )}
          {types.error && (
            <Alert
              className="department-form__notice"
              type="warning"
              showIcon
              title="科室类型加载失败，已有选项已保留"
              description={types.error}
              action={
                <Button disabled={disabled || saving} onClick={types.reload}>
                  重试
                </Button>
              }
            />
          )}
          <Form.List
            name="rows"
            rules={[
              {
                validator: (_, rows: LinkDraft[] | undefined) => {
                  const error = validateLinks(rows);
                  return error
                    ? Promise.reject(new Error(error))
                    : Promise.resolve();
                },
              },
            ]}
          >
            {(fields, { add, remove }, { errors }) => (
              <>
                <div className="department-link-toolbar">
                  <div>
                    <Typography.Text strong>科室对照</Typography.Text>
                    <Typography.Paragraph
                      type="secondary"
                      style={{ margin: "4px 0 0" }}
                    >
                      已配置 {fields.length} / {MAX_LINKS}{" "}
                      项，先选择科室类型，再选择对照科室。
                    </Typography.Paragraph>
                  </div>
                  <Space wrap>
                    <Button
                      disabled={disabled || saving || fields.length >= MAX_LINKS}
                      onClick={() => {
                        add({});
                        changed();
                      }}
                    >
                      添加对照科室
                    </Button>
                    <Button
                      danger
                      disabled={disabled || saving || !fields.length}
                      onClick={() => {
                        remove(fields.map((field) => field.name));
                        changed();
                      }}
                    >
                      清空
                    </Button>
                  </Space>
                </div>
                <Table
                  className="department-link-table"
                  dataSource={fields}
                  rowKey="key"
                  pagination={false}
                  size="small"
                  scroll={{ x: 650 }}
                  locale={{
                    emptyText: (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="暂无科室对照，可添加对照科室"
                      />
                    ),
                  }}
                  columns={[
                    {
                      title: "序号",
                      key: "index",
                      width: 60,
                      render: (_, field) => field.name + 1,
                    },
                    {
                      title: "科室类型",
                      key: "type",
                      width: 180,
                      render: (_, field) => {
                        const current = watched?.[field.name]?.link_type;
                        const options = [...typeOptions];
                        if (
                          current &&
                          !options.some((option) => option.value === current)
                        )
                          options.push({ value: current, label: current });
                        return (
                          <Form.Item
                            name={[field.name, "link_type"]}
                            rules={[
                              {
                                required: true,
                                whitespace: true,
                                message: "请选择科室类型",
                              },
                            ]}
                          >
                            <Select
                              aria-label={`对照 ${field.name + 1} 科室类型`}
                              style={{ width: "100%" }}
                              allowClear
                              showSearch
                              optionFilterProp="label"
                              placeholder="请选择科室类型"
                              loading={types.loading}
                              options={options}
                              onChange={() => {
                                form.setFields([
                                  {
                                    name: ["rows", field.name, "link_id"],
                                    value: undefined,
                                    errors: [],
                                  },
                                  {
                                    name: ["rows", field.name, "link_name"],
                                    value: undefined,
                                    errors: [],
                                  },
                                ]);
                                changed();
                              }}
                            />
                          </Form.Item>
                        );
                      },
                    },
                    {
                      title: "对照科室",
                      key: "department",
                      render: (_, field) => (
                        <DepartmentCell
                          form={form}
                          index={field.name}
                          orgId={orgId}
                          reference={reference}
                          disabled={disabled || saving}
                          changed={changed}
                        />
                      ),
                    },
                    {
                      title: "操作",
                      key: "action",
                      width: 80,
                      render: (_, field) => (
                        <Button
                          type="link"
                          danger
                          size="small"
                          disabled={disabled || saving}
                          aria-label={`移除对照 ${field.name + 1}`}
                          onClick={() => {
                            remove(field.name);
                            changed();
                          }}
                        >
                          移除
                        </Button>
                      ),
                    },
                  ]}
                />
                <Form.ErrorList errors={errors} />
              </>
            )}
          </Form.List>
          <Space className="department-form__actions" wrap>
            <Typography.Text type="secondary">
              Alt + Enter 快速保存
            </Typography.Text>
            <Button disabled={disabled || saving || !dirty} onClick={() => void reset()}>
              重置
            </Button>
            <Button type="primary" htmlType="submit" loading={saving}>
              保存科室对照
            </Button>
          </Space>
        </>
      )}
    </Form>
  );
}
