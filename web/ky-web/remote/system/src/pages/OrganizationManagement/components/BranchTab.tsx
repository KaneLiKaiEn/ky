import {
  Alert,
  Button,
  Empty,
  Form,
  Input,
  Space,
  Table,
  Typography,
  type FormItemProps,
  type TableProps,
} from "antd";
import type { BranchRow } from "@/types/org";
import { useBranchData, type BranchDataOptions } from "../hooks/useBranchData";
import {
  AddressRegion,
  CountrySelect,
  useAddressEditorFields,
} from "./AddressControls";
import { parseAddress } from "./address";
import { useFixedTableColumns } from "../hooks/useFixedTableColumns";
import EditableCell, { type EditableControl } from "./EditableCell";

const propertyColumns = [
  { key: "branch_name", title: "院区名称", width: 200, required: true },
  { key: "branch_name_abbr", title: "名称缩写", width: 130 },
  { key: "branch_code", title: "代码", width: 130 },
  { key: "branch_no", title: "编号", width: 110 },
  { key: "branch_name_alias", title: "别名", width: 140 },
  { key: "branch_telno", title: "电话", width: 160 },
  { key: "branch_name_legend", title: "描述", width: 240 },
] as const;

type BranchData = ReturnType<typeof useBranchData>;

function BranchTable({
  branchId,
  data,
}: {
  branchId: number | null;
  data: BranchData;
}) {
  const {
    form,
    tableRows,
    loaded,
    detailLoading,
    busy,
    saving,
    deletingId,
    changeBranch,
    cancelEditing,
    confirmDelete,
  } = data;
  const { isChina, handleCountryChange, handleAreaSelect } =
    useAddressEditorFields("branch");
  const fixedColumns = useFixedTableColumns();
  const isEditing = (row: BranchRow) =>
    branchId !== null && row.branch_id === branchId;
  const blocked = busy || !loaded || detailLoading;
  const cell = (
    row: BranchRow,
    name: keyof BranchRow,
    label: string,
    input: EditableControl,
    rules?: FormItemProps["rules"],
  ) =>
    isEditing(row) ? (
      <EditableCell name={name} label={label} disabled={blocked} rules={rules}>
        {input}
      </EditableCell>
    ) : (
      String(row[name] ?? "") || "—"
    );
  const columns: TableProps<BranchRow>["columns"] = [
    ...propertyColumns.map((column) => ({
      title: column.title,
      dataIndex: column.key,
      width: column.width,
      fixed:
        fixedColumns && column.key === "branch_name"
          ? ("left" as const)
          : undefined,
      render: (_: unknown, row: BranchRow) =>
        cell(
          row,
          column.key,
          column.title,
          column.key === "branch_name_legend" ? (
            <Input.TextArea autoSize={{ minRows: 1, maxRows: 3 }} />
          ) : (
            <Input />
          ),
          "required" in column
            ? [{ required: true, whitespace: true, message: "请输入院区名称" }]
            : undefined,
        ),
    })),
    {
      title: "国家 / 地区",
      dataIndex: "branch_address_nation",
      width: 170,
      render: (_, row) =>
        cell(
          row,
          "branch_address_nation",
          "国家 / 地区",
          <CountrySelect onChange={handleCountryChange} />,
        ),
    },
    {
      title: "省 / 市 / 区县",
      key: "region",
      width: 280,
      render: (_, row) => {
        if (!isEditing(row))
          return row.branch_address_nation &&
            row.branch_address_nation !== "中国"
            ? "—"
            : [
                row.branch_address_state,
                row.branch_address_city,
                row.branch_address_county,
              ]
                .filter(Boolean)
                .join(" / ") ||
                parseAddress(row.branch_address ?? "")
                  .map((node) => node.name)
                  .join(" / ") ||
                "—";
        return (
          <EditableCell
            name="branch_address"
            label="省 / 市 / 区县"
            disabled={blocked || !isChina}
          >
            <AddressRegion
              onSelect={handleAreaSelect}
              placeholder={isChina ? "请选择省 / 市 / 区县" : "—"}
            />
          </EditableCell>
        );
      },
    },
    {
      title: "详细地址",
      dataIndex: "branch_address_detail",
      width: 300,
      render: (_, row) =>
        cell(
          row,
          "branch_address_detail",
          "详细地址",
          <Input.TextArea autoSize={{ minRows: 1, maxRows: 3 }} />,
        ),
    },
    {
      title: "邮政编码",
      dataIndex: "branch_address_post",
      width: 130,
      render: (_, row) => {
        if (isEditing(row))
          return (
            <EditableCell
              name="branch_address_post"
              label="邮政编码"
              disabled={blocked || !isChina}
            >
              <Input maxLength={12} placeholder={isChina ? undefined : "—"} />
            </EditableCell>
          );
        return row.branch_address_nation && row.branch_address_nation !== "中国"
          ? "—"
          : row.branch_address_post || "—";
      },
    },
    {
      title: "操作",
      key: "action",
      fixed: fixedColumns ? "right" : undefined,
      width: 210,
      render: (_, row) => (
        <Space size={0} wrap>
          {isEditing(row) ? (
            <>
              <Button
                type="link"
                size="small"
                disabled={blocked}
                loading={saving}
                onClick={() => form.submit()}
              >
                保存
              </Button>
              <Button
                type="link"
                size="small"
                disabled={busy}
                onClick={cancelEditing}
              >
                取消
              </Button>
            </>
          ) : (
            <Button
              type="link"
              size="small"
              disabled={busy || data.listLoading}
              onClick={() => changeBranch(row.branch_id ?? null)}
            >
              编辑
            </Button>
          )}
          {row.branch_id === 0 ? (
            <Button
              type="link"
              size="small"
              danger
              disabled={busy}
              onClick={cancelEditing}
            >
              移除
            </Button>
          ) : (
            <Button
              type="link"
              size="small"
              danger
              disabled={busy}
              loading={deletingId === row.branch_id}
              onClick={() => void confirmDelete(row)}
            >
              删除
            </Button>
          )}
        </Space>
      ),
    },
  ];
  return (
    <Table<BranchRow>
      className="organization-table"
      rowKey={(row) => String(row.branch_id)}
      size="small"
      loading={data.listLoading}
      dataSource={tableRows}
      columns={columns}
      scroll={{ x: 2300 }}
      pagination={{
        current: data.page,
        pageSize: data.pageSize,
        showSizeChanger: true,
        disabled: busy || branchId !== null,
        showTotal: (total) => `共 ${total} 个院区`,
        onChange: data.changePage,
      }}
      locale={{
        emptyText: (
          <Empty
            description={
              data.query ? "没有匹配的院区" : "暂无院区，点击新增院区开始创建"
            }
          />
        ),
      }}
    />
  );
}

export default function BranchTab(props: BranchDataOptions) {
  const { orgId, branchId } = props;
  const data = useBranchData(props);
  if (orgId <= 0) return <Empty description="请先保存机构后再添加院区" />;
  return (
    <>
      <div className="organization-table-toolbar">
        <Input.Search
          allowClear
          aria-label="搜索院区"
          value={data.query}
          placeholder="搜索院区名称、缩写、代码或编号"
          style={{ maxWidth: 380 }}
          disabled={data.busy || branchId !== null}
          onChange={(event) => data.search(event.target.value)}
        />
        <Space wrap>
          {branchId !== null && (
            <Typography.Text type="secondary">
              Alt + Enter 保存当前行
            </Typography.Text>
          )}
          <Button
            onClick={data.retryList}
            disabled={data.busy || branchId !== null}
            loading={data.listLoading}
          >
            刷新
          </Button>
          <Button
            type="primary"
            onClick={() => data.changeBranch(0)}
            disabled={data.busy || data.listLoading || branchId === 0}
          >
            新增院区
          </Button>
        </Space>
      </div>
      {data.listError && (
        <Alert type="error" showIcon title="院区列表加载失败，请点击刷新重试" />
      )}
      {data.detailError && (
        <Alert
          type="error"
          showIcon
          title="院区信息加载失败，当前行尚未读取完整数据"
          action={
            <Button
              size="small"
              disabled={data.busy}
              onClick={data.retryDetail}
            >
              重试
            </Button>
          }
        />
      )}
      <Form
        form={data.form}
        layout="vertical"
        disabled={data.busy || !data.loaded}
        onFinish={data.handleSave}
        scrollToFirstError
      >
        <BranchTable branchId={branchId} data={data} />
      </Form>
    </>
  );
}
