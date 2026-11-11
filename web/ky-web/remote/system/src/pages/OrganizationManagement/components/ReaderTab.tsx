import {
  Alert,
  Button,
  Empty,
  Form,
  Input,
  Popconfirm,
  Select,
  Space,
  Spin,
  Table,
  Typography,
} from "antd";
import type { OrgReaderRow } from "@/types/card";
import {
  MAX_READER_ROWS as MAX_ROWS,
  useReaderData,
  type ReaderTabProps,
  type ReaderFormValues,
} from "../hooks/useReaderData";
import EditableCell from "./EditableCell";
import { useFixedTableColumns } from "../hooks/useFixedTableColumns";

export default function ReaderTab(props: ReaderTabProps) {
  const { orgId, disabled = false } = props;
  const {
    form,
    rows,
    editing,
    loading,
    loaded,
    saving,
    loadError,
    saveError,
    options,
    markDirty,
    handleSave,
    cancelEditing,
    changeReaderType,
    rowLimit,
    startEditing,
    retryLoading,
    createEmptyRow,
  } = useReaderData(props);
  const blocked = disabled || saving;
  const fixedColumns = useFixedTableColumns();
  if (orgId <= 0) return <Empty description="请先保存机构，再配置读卡器" />;
  return (
    <Spin spinning={loading}>
      <Typography.Paragraph type="secondary">
        {rows.length > MAX_ROWS
          ? `当前有 ${rows.length} 项历史配置，可编辑或移除；新增配置上限为 ${MAX_ROWS} 项。`
          : `配置当前机构使用的读卡器及押金，最多添加 ${MAX_ROWS} 项。`}
      </Typography.Paragraph>
      {loadError && (
        <Alert
          type="error"
          showIcon
          title={loadError}
          action={
            <Button size="small" disabled={blocked} onClick={retryLoading}>
              重试
            </Button>
          }
        />
      )}
      {saveError && <Alert type="warning" showIcon title={saveError} />}
      {loaded && !editing && (
        <>
          <div className="organization-table-toolbar">
            <Button disabled={blocked} onClick={startEditing}>
              编辑读卡器配置
            </Button>
          </div>
          <Table<OrgReaderRow>
            className="organization-table"
            size="small"
            pagination={false}
            rowKey={(_, index) => String(index)}
            dataSource={rows}
            scroll={{ x: 560 }}
            columns={[
              { title: "读卡器", dataIndex: "reader_type", width: 280 },
              { title: "押金", dataIndex: "deposit_amount", width: 160 },
              { title: "排序", dataIndex: "sort_no", width: 120 },
            ]}
          />
        </>
      )}
      {loaded && editing && (
        <Form<ReaderFormValues>
          form={form}
          layout="vertical"
          disabled={blocked}
          initialValues={{ rows: [] }}
          onValuesChange={markDirty}
          onFinish={() => void handleSave()}
          scrollToFirstError
        >
          <Form.List
            name="rows"
            rules={[
              {
                validator: (_, value: OrgReaderRow[]) =>
                  value?.length > rowLimit
                    ? Promise.reject(
                        new Error(`最多添加 ${MAX_ROWS} 项读卡器配置`),
                      )
                    : Promise.resolve(),
              },
            ]}
          >
            {(fields, { add, remove }, { errors }) => (
              <>
                <div className="organization-table-toolbar">
                  <Space wrap>
                    <Button
                      disabled={blocked || fields.length >= MAX_ROWS}
                      onClick={() => add(createEmptyRow())}
                    >
                      添加读卡器
                    </Button>
                    <Button
                      type="primary"
                      htmlType="submit"
                      disabled={blocked}
                      loading={saving}
                    >
                      保存
                    </Button>
                    <Button disabled={blocked} onClick={cancelEditing}>
                      取消编辑
                    </Button>
                  </Space>
                  <Typography.Text type="secondary">
                    Alt + Enter 快速保存
                  </Typography.Text>
                </div>
                <Table
                  className="organization-table"
                  size="small"
                  pagination={false}
                  dataSource={fields}
                  rowKey={(field) => String(field.key)}
                  scroll={{ x: 660 }}
                  locale={{
                    emptyText: "暂无读卡器配置，点击添加读卡器开始配置",
                  }}
                  columns={[
                    {
                      title: "读卡器 *",
                      key: "reader_type",
                      width: 280,
                      fixed: fixedColumns ? "left" : undefined,
                      render: (_, field) => (
                        <>
                          <EditableCell
                            name={[field.name, "reader_type"]}
                            label={`读卡器 ${field.name + 1}`}
                            disabled={blocked}
                            rules={[
                              {
                                required: true,
                                whitespace: true,
                                message: "请选择读卡器",
                              },
                            ]}
                          >
                            <Select
                              showSearch
                              options={options}
                              placeholder="选择读卡器"
                              filterOption={(input, option) =>
                                (option?.label ?? "")
                                  .toLowerCase()
                                  .includes(input.toLowerCase())
                              }
                              onChange={(readerType: string) =>
                                changeReaderType(field.name, readerType)
                              }
                            />
                          </EditableCell>
                          <Form.Item name={[field.name, "reader_tag"]} hidden>
                            <Input />
                          </Form.Item>
                        </>
                      ),
                    },
                    {
                      title: "押金",
                      key: "deposit_amount",
                      width: 160,
                      render: (_, field) => (
                        <EditableCell
                          name={[field.name, "deposit_amount"]}
                          label={`押金 ${field.name + 1}`}
                          disabled={blocked}
                        >
                          <Input inputMode="decimal" />
                        </EditableCell>
                      ),
                    },
                    {
                      title: "排序",
                      key: "sort_no",
                      width: 120,
                      render: (_, field) => (
                        <EditableCell
                          name={[field.name, "sort_no"]}
                          label={`排序 ${field.name + 1}`}
                          disabled={blocked}
                        >
                          <Input />
                        </EditableCell>
                      ),
                    },
                    {
                      title: "操作",
                      key: "action",
                      width: 100,
                      fixed: fixedColumns ? "right" : undefined,
                      render: (_, field) => (
                        <Popconfirm
                          title="确定移除此读卡器配置？"
                          okText="移除"
                          cancelText="取消"
                          disabled={blocked}
                          onConfirm={() => {
                            if (!blocked) remove(field.name);
                          }}
                        >
                          <Button
                            type="link"
                            danger
                            size="small"
                            disabled={blocked}
                          >
                            移除
                          </Button>
                        </Popconfirm>
                      ),
                    },
                  ]}
                />
                <Form.ErrorList errors={errors} />
              </>
            )}
          </Form.List>
        </Form>
      )}
    </Spin>
  );
}
