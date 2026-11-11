import PropertyForm from "../../../components/PropertyForm/index";
import {
  getDatasetProperty,
  getSubsetProperty,
  saveDatasetProperty,
  saveSubsetProperty,
} from "../../../api/dataset";
import { retrieveFactorList } from "../../../api/factor";
import { retrieveMetricList } from "../../../api/metric";
import { propertyPayload } from "../model";
import type { EditorContext } from "../types";
import { decodeTags, encodeTags, id, text } from "comm/utils";
import type { DatasetRow, SubsetRow } from "../../../types/dataset.d.ts";
import { Form, Input, Select } from "antd";

import { formLayout } from "../../../styles/formLayout";
import Editor from "../../../components/ManagementEditor/index";
import { useManagementEditor } from "comm/management";
import { useResource } from "comm/resource";

type Property = DatasetRow & SubsetRow;
export default function PropertyPanel({
  context,
  subsetId,
}: {
  context: EditorContext;
  subsetId?: number;
}) {
  const editor = useManagementEditor<Property>(
    {
      identity: `property:${context.identity}:${subsetId || "dataset"}`,
      isCurrent: context.isCurrent,
      guard: context.guard,
    },
    async (): Promise<Property> => {
      if (subsetId) {
        const row = (
          await getSubsetProperty({ subset_id: subsetId, column_list: "*" })
        ).subset_property;
        if (id(row?.subset_id) !== subsetId)
          throw new Error("未取得有效的子集属性");
        return row!;
      }
      const row = (
        await getDatasetProperty({
          dataset_id: context.dataset.dataset_id,
          column_list: "*",
        })
      ).dataset_property;
      if (id(row?.dataset_id) !== id(context.dataset.dataset_id))
        throw new Error("未取得有效的数据集属性");
      return row!;
    },
    async (value) => {
      if (!text(value[`${prefix}_name`]).trim())
        throw new Error("名称不能为空");
      if (subsetId && !id(value.source_id)) throw new Error("请选择数据源");
      if (subsetId && !value.subset_stmt?.trim())
        throw new Error("请输入语句或选择引用的因子/指标");
      const payload = propertyPayload(editor.baseline!, value);
      if (subsetId)
        await saveSubsetProperty({
          subset_id: subsetId,
          subset_property: payload,
        });
      else
        await saveDatasetProperty({
          dataset_id: context.dataset.dataset_id,
          dataset_property: payload,
        });
    },
    async (): Promise<void> => {
      context.onSaved(
        subsetId ? undefined : propertyPayload(editor.baseline!, editor.value!),
      );
    },
  );
  const prefix = subsetId ? "subset" : "dataset";
  const value = editor.value;
  const change = (field: string, next: unknown) =>
    editor.setValue((row) => (row ? { ...row, [field]: next } : row));
  const tags = decodeTags(value?.[`${prefix}_tag`]);
  const reference = tags.includes("FACTOR")
    ? "factor"
    : tags.includes("METRIC")
      ? "metric"
      : null;
  const choices = useResource(
    subsetId && reference ? `${context.identity}:ref:${reference}` : null,
    async () => {
      if (reference === "factor")
        return (
          (
            await retrieveFactorList({
              retrieve_input: "*",
              retrieve_limit: 500,
              column_list: "factor_id,factor_name",
            })
          ).row_list ?? []
        ).map((row) => ({
          value: id(row.factor_id)!,
          label: text(row.factor_name),
        }));
      return (
        (
          await retrieveMetricList({
            retrieve_input: "*",
            retrieve_limit: 500,
            column_list: "metric_id,metric_name",
          })
        ).row_list ?? []
      ).map((row) => ({
        value: id(row.metric_id)!,
        label: text(row.metric_name),
      }));
    },
  );
  const field = (name: string, label: string, required = false) => (
    <Form.Item label={label} required={required}>
      <Input
        aria-label={label}
        value={text(value?.[name])}
        onChange={(event) => change(name, event.target.value)}
      />
    </Form.Item>
  );
  return (
    <Editor
      title={subsetId ? "子集属性" : "数据集属性"}
      hideTitle
      statusFooter
      {...editor}
      retry={() => void editor.reload().catch(() => {})}
    >
      {value && (
        <PropertyForm {...formLayout}>
          <div className="mw-section" data-form-label-group>
            <h3>基础信息</h3>
            <div className="mw-form-grid">
              {field(`${prefix}_name`, "名称", true)}
              {field(`${prefix}_code`, "编码")}
              {!subsetId && (
                <>
                  <Form.Item label="目录" required>
                    <Select
                      value={
                        value.catalog_id === 0 || value.catalog_id === -1
                          ? value.catalog_id
                          : (id(value.catalog_id) ?? undefined)
                      }
                      options={[
                        ...(value.catalog_id === 0 || value.catalog_id === -1
                          ? [
                              {
                                value: value.catalog_id,
                                label: "未分类（历史数据集）",
                              },
                            ]
                          : []),
                        ...context.catalogs
                          .filter(
                            (row) =>
                              (value.catalog_id !== 0 &&
                                value.catalog_id !== -1) ||
                              row.catalog_id !== value.catalog_id,
                          )
                          .map((row) => ({
                            value:
                              row.catalog_id === 0 ? 0 : id(row.catalog_id)!,
                            label: text(row.catalog_name),
                          })),
                      ]}
                      onChange={(next) => change("catalog_id", next)}
                    />
                  </Form.Item>
                  <Form.Item label="返回格式">
                    <Select
                      value={value.dataset_format || ""}
                      options={[
                        { value: "", label: "默认" },
                        { value: "column" },
                        { value: "array" },
                      ]}
                      onChange={(next) => change("dataset_format", next)}
                    />
                  </Form.Item>
                </>
              )}
              {subsetId && (
                <>
                  <Form.Item label="数据源" required>
                    <Select
                      aria-label="子集数据源"
                      value={id(value.source_id)}
                      options={context.sources.map((row) => ({
                        value: id(row.source_id)!,
                        label: text(row.source_name),
                      }))}
                      onChange={(next) => {
                        change("source_id", next);
                        change(
                          "source_name",
                          context.sources.find(
                            (row) => id(row.source_id) === next,
                          )?.source_name || "",
                        );
                      }}
                    />
                  </Form.Item>
                  <Form.Item label="关联方式">
                    <Select
                      allowClear
                      value={value.link_name || undefined}
                      options={["LEFT", "INNER", "UNION", "EXCLUDE"].map(
                        (next) => ({ value: next }),
                      )}
                      onChange={(next) => change("link_name", next || "")}
                    />
                  </Form.Item>
                  {field("link_param", "关联参数")}
                </>
              )}
              {field("sort_no", "排序号")}
            </div>
          </div>
          <div className="mw-section" data-form-label-group>
            <h3>标签与说明</h3>
            <div className="mw-form-grid">
              <Form.Item className="mw-form-wide" label="标签">
                <Select
                  mode="tags"
                  value={tags}
                  options={(subsetId
                    ? ["LOWER", "UPPER", "FACTOR", "METRIC", "YOY", "POP"]
                    : ["LOWER", "UPPER"]
                  ).map((tag) => ({
                    value: tag,
                    disabled:
                      (tag === "FACTOR" && tags.includes("METRIC")) ||
                      (tag === "METRIC" && tags.includes("FACTOR")),
                  }))}
                  onChange={(next) => change(`${prefix}_tag`, encodeTags(next))}
                />
              </Form.Item>
              <Form.Item className="mw-form-wide" label="备注">
                <Input.TextArea
                  aria-label="备注"
                  rows={4}
                  value={text(value[`${prefix}_note`])}
                  onChange={(event) =>
                    change(`${prefix}_note`, event.target.value)
                  }
                />
              </Form.Item>
            </div>
          </div>
          {subsetId && (
            <div className="mw-section" data-form-label-group>
              <h3>子集查询</h3>
              <div className="mw-form-grid">
                <Form.Item
                  className="mw-form-wide"
                  label={
                    reference === "factor"
                      ? "因子"
                      : reference === "metric"
                        ? "指标"
                        : "语句"
                  }
                  required
                >
                  {reference ? (
                    <Select
                      showSearch
                      optionFilterProp="label"
                      loading={choices.loading}
                      value={value.subset_stmt || undefined}
                      options={choices.data}
                      onChange={(next) => change("subset_stmt", next)}
                    />
                  ) : (
                    <Input.TextArea
                      className="de-code"
                      rows={14}
                      value={value.subset_stmt}
                      onChange={(event) =>
                        change("subset_stmt", event.target.value)
                      }
                    />
                  )}
                  {choices.error && <span role="alert">{choices.error}</span>}
                </Form.Item>
              </div>
            </div>
          )}
        </PropertyForm>
      )}
    </Editor>
  );
}
