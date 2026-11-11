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
import type { OrgDealerRow } from "@/types/pay";
import {
  MAX_PAYMENT_ROWS as MAX_ROWS,
  usePaymentData,
  type PaymentTabProps,
  type PaymentFormValues,
  type PaymentFormRow,
} from "../hooks/usePaymentData";
import EditableCell from "./EditableCell";
import { useFixedTableColumns } from "../hooks/useFixedTableColumns";

const textColumns = [
  { key: "account_type", title: "账户类型", width: 130 },
  { key: "account_id", title: "账户 ID", width: 120 },
  { key: "account_name", title: "账户名称", width: 180 },
  { key: "account_no", title: "账号", width: 200 },
  { key: "account_tag", title: "标签", width: 120 },
  { key: "account_note", title: "注释", width: 250 },
  { key: "sort_no", title: "排序", width: 100 },
] as const;

export default function PaymentTab(props: PaymentTabProps) {
  const { orgId, disabled = false } = props;
  const {
    form,
    rows,
    dealers,
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
    rowLimit,
    startEditing,
    retryLoading,
    createEmptyRow,
  } = usePaymentData(props);
  const blocked = disabled || saving;
  const fixedColumns = useFixedTableColumns();
  if (orgId <= 0) return <Empty description="请先保存机构，再配置支付方式" />;
  return (
    <Spin spinning={loading}>
      <Typography.Paragraph type="secondary">
        {rows.length > MAX_ROWS
          ? `当前有 ${rows.length} 项历史配置，可编辑或移除；新增配置上限为 ${MAX_ROWS} 项。`
          : `配置当前机构的支付账户，最多添加 ${MAX_ROWS} 项。`}
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
              编辑支付配置
            </Button>
          </div>
          <Table<OrgDealerRow>
            className="organization-table"
            size="small"
            pagination={false}
            rowKey={(_, index) => String(index)}
            dataSource={rows}
            scroll={{ x: 1400 }}
            columns={[
              {
                title: "支付方式",
                dataIndex: "pay_type",
                width: 200,
                fixed: fixedColumns ? "left" : undefined,
                render: (value) =>
                  dealers.find((dealer) => dealer.pay_type === value)
                    ?.pay_name ||
                  value ||
                  "—",
              },
              ...textColumns.map(({ key, title, width }) => ({
                title,
                dataIndex: key,
                width,
              })),
            ]}
          />
        </>
      )}
      {loaded && editing && (
        <Form<PaymentFormValues>
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
                validator: (_, value: PaymentFormRow[]) =>
                  value?.length > rowLimit
                    ? Promise.reject(
                        new Error(`最多添加 ${MAX_ROWS} 项支付配置`),
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
                      添加支付方式
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
                  scroll={{ x: 1500 }}
                  locale={{
                    emptyText: "暂无支付配置，点击添加支付方式开始配置",
                  }}
                  columns={[
                    {
                      title: "支付方式 *",
                      width: 200,
                      fixed: fixedColumns ? "left" : undefined,
                      key: "pay_type",
                      render: (_, field) => (
                        <EditableCell
                          name={[field.name, "pay_type"]}
                          label={`支付方式 ${field.name + 1}`}
                          disabled={blocked}
                          rules={[
                            {
                              required: true,
                              whitespace: true,
                              message: "请选择支付方式",
                            },
                          ]}
                        >
                          <Select
                            showSearch
                            options={options}
                            placeholder="选择支付方式"
                            filterOption={(input, option) =>
                              (option?.searchText ?? "")
                                .toLowerCase()
                                .includes(input.toLowerCase())
                            }
                          />
                        </EditableCell>
                      ),
                    },
                    ...textColumns.map(({ key, title, width }) => ({
                      title,
                      key,
                      width,
                      render: (_: unknown, field: (typeof fields)[number]) => (
                        <EditableCell
                          name={[field.name, key]}
                          label={`${title} ${field.name + 1}`}
                          disabled={blocked}
                          rules={
                            key === "account_id"
                              ? [
                                  {
                                    validator: (_, value) =>
                                      value == null ||
                                      value === "" ||
                                      (Number.isFinite(Number(value)) &&
                                        Number.isInteger(Number(value)))
                                        ? Promise.resolve()
                                        : Promise.reject(
                                            new Error(
                                              "请输入有效的整数账户 ID",
                                            ),
                                          ),
                                  },
                                ]
                              : undefined
                          }
                        >
                          {key === "account_note" ? (
                            <Input.TextArea
                              autoSize={{ minRows: 1, maxRows: 3 }}
                            />
                          ) : (
                            <Input
                              inputMode={
                                key === "account_id" ? "numeric" : undefined
                              }
                              placeholder={
                                key === "account_id"
                                  ? "留空按 0 保存"
                                  : undefined
                              }
                            />
                          )}
                        </EditableCell>
                      ),
                    })),
                    {
                      title: "操作",
                      key: "action",
                      width: 100,
                      fixed: fixedColumns ? "right" : undefined,
                      render: (_, field) => (
                        <Popconfirm
                          title="确定移除此支付配置？"
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
