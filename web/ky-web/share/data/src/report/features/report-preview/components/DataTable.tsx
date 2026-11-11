import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
} from "react";
import {
  Alert,
  Button,
  Input,
  Pagination,
  Select,
  Space,
  Table,
  type TableProps,
} from "antd";
import type { ColumnsType, ColumnType } from "antd/es/table/interface";
import { errorText } from "comm/utils";
import {
  canvasLayout,
  distinctSpans,
  hasTag,
  leaves,
  replaceTitle,
  sortRows,
  type Column,
  type DataRow,
  type Link,
  type PageSize,
  type Result,
  type Snapshot,
  type Sort,
} from "../model";

interface RecordRow {
  index: number;
  data: DataRow;
}
interface HeaderProps extends HTMLAttributes<HTMLTableCellElement> {
  width?: number;
  resize?: (width: number) => void;
}
function Header({ width, resize, children, ...props }: HeaderProps) {
  const cleanup = useRef<(() => void) | undefined>(undefined);
  useEffect(() => () => cleanup.current?.(), []);
  return (
    <th {...props}>
      {children}
      {resize && (
        <span
          role="separator"
          aria-label="调整列宽"
          className="rp-resize"
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
            cleanup.current?.();
            const start = event.clientX,
              initial = width || 140;
            const move = (event: PointerEvent) =>
              resize(Math.max(50, initial + event.clientX - start));
            const finish = () => {
              document.removeEventListener("pointermove", move);
              document.removeEventListener("pointerup", finish);
              document.removeEventListener("pointercancel", finish);
            };
            cleanup.current = finish;
            document.addEventListener("pointermove", move);
            document.addEventListener("pointerup", finish);
            document.addEventListener("pointercancel", finish);
          }}
        />
      )}
    </th>
  );
}
export default function DataTable({
  result,
  snapshot,
  reportType,
  reportTag,
  loading,
  working,
  active,
  sorts,
  onSort,
  onPage,
  onEdit,
  onEditing,
  onLink,
}: {
  result: Result;
  snapshot: Snapshot;
  reportType: string;
  reportTag?: string;
  loading: boolean;
  working: boolean;
  active: boolean;
  sorts: Sort[];
  onSort: (sorts: Sort[]) => void;
  onPage: (page: number, size: PageSize) => void;
  onEdit: (index: number, column: Column, value: string) => Promise<boolean>;
  onEditing: (editing: boolean) => void;
  onLink: (link: Link, row: DataRow) => void;
}) {
  const [widths, setWidths] = useState<Record<string, number>>({});
  const [edit, setEdit] = useState<{
    index: number;
    column: Column;
    value: string;
    error?: string;
  }>();
  const [saving, setSaving] = useState(false),
    saveLock = useRef(false);
  useEffect(() => {
    onEditing(!!edit);
  }, [!!edit, onEditing]);
  useEffect(() => () => onEditing(false), [onEditing]);
  const canvas = reportType === "CANVAS",
    flat = useMemo(() => leaves(result.columns), [result.columns]);
  const rows = useMemo(() => {
    const indexes = new Map(result.rows.map((row, index) => [row, index]));
    return sortRows(result.rows, canvas ? [] : sorts).map((row) => ({
      index: indexes.get(row)!,
      data: row,
    }));
  }, [result.rows, sorts, canvas]);
  const layout = useMemo(
    () =>
      canvasLayout(
        canvas ? result.cells : [],
        canvas ? rows.length : 0,
        flat.length,
      ),
    [canvas, result.cells, rows.length, flat.length],
  );
  const spans = useMemo(
    () =>
      new Map(
        flat
          .filter((col) => col.distinct)
          .map((col) => [
            col.key,
            distinctSpans(
              rows.map((row) => row.data),
              col.key,
            ),
          ]),
      ),
    [flat, rows],
  );
  const save = async () => {
    if (!edit || saveLock.current) return;
    saveLock.current = true;
    setSaving(true);
    try {
      if (await onEdit(edit.index, edit.column, edit.value)) setEdit(undefined);
    } catch (error) {
      setEdit(
        (previous) => previous && { ...previous, error: errorText(error) },
      );
    } finally {
      saveLock.current = false;
      setSaving(false);
    }
  };
  const busy = loading || working || !!edit;
  const tableColumns = useMemo<ColumnsType<RecordRow>>(() => {
    let priority = flat.length;
    const convert = (list: Column[]): ColumnsType<RecordRow> =>
      list.map((column) => {
        if (column.children?.length)
          return {
            key: column.key,
            title: replaceTitle(column.name, snapshot.values),
            children: convert(column.children),
          };
        const columnIndex = flat.findIndex((item) => item.key === column.key);
        const width = widths[column.key] || column.width;
        const converted: ColumnType<RecordRow> = {
          key: column.key,
          title: replaceTitle(column.name, snapshot.values),
          width,
          align: column.align,
          fixed: column.frozen ? "left" : undefined,
          sorter: canvas ? undefined : { multiple: priority-- },
          sortOrder:
            sorts.find((sort) => sort.key === column.key)?.order || null,
          onHeaderCell: () =>
            ({
              width,
              resize: (width: number) =>
                setWidths((previous) => ({ ...previous, [column.key]: width })),
            }) as HeaderProps,
          render: (_value, record) => {
            if (edit?.index === record.index && edit.column.key === column.key)
              return (
                <div className="rp-cell-editor">
                  <Input
                    aria-label={`编辑 ${column.name}`}
                    autoFocus
                    value={edit.value}
                    disabled={saving}
                    onChange={(event) =>
                      setEdit({
                        ...edit,
                        value: event.target.value,
                        error: undefined,
                      })
                    }
                    onPressEnter={() => void save()}
                    onKeyDown={(event) => {
                      if (event.key === "Escape" && !saving) setEdit(undefined);
                    }}
                  />
                  <Space size={4}>
                    <Button
                      size="small"
                      type="primary"
                      loading={saving}
                      onClick={() => void save()}
                    >
                      保存
                    </Button>
                    <Button
                      size="small"
                      disabled={saving}
                      onClick={() => setEdit(undefined)}
                    >
                      取消
                    </Button>
                  </Space>
                  {edit.error && <Alert type="error" title={edit.error} />}
                </div>
              );
            const cell = canvas
              ? layout.positions.get(`${record.index + 1}:${columnIndex + 1}`)
              : undefined;
            const link = cell || column;
            const value = record.data[column.key];
            const content = value == null ? "" : String(value);
            return link.lv ? (
              <button
                className="rp-cell-link"
                disabled={busy || !active}
                title={link.lo || content}
                onClick={() => onLink(link, record.data)}
              >
                {content || link.lo || "打开"}
              </button>
            ) : (
              <span title={content}>{content}</span>
            );
          },
          onCell: (record, displayIndex = 0) => {
            const position = `${record.index + 1}:${columnIndex + 1}`,
              cell = canvas ? layout.positions.get(position) : undefined;
            const style: CSSProperties = {
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",
            };
            if (cell) {
              if (["left", "center", "right"].includes(cell.ah || ""))
                style.textAlign = cell.ah as CSSProperties["textAlign"];
              style.verticalAlign =
                cell.av === "top"
                  ? "top"
                  : cell.av === "bottom"
                    ? "bottom"
                    : "middle";
              style.color = cell.cf || undefined;
              style.backgroundColor = cell.cb || undefined;
              style.fontFamily = cell.ff || undefined;
              if (Number(cell.fs) > 0) style.fontSize = Number(cell.fs);
            }
            return {
              style,
              colSpan: canvas
                ? layout.covered.has(position)
                  ? 0
                  : Math.min(flat.length - columnIndex, (cell?.mh || 0) + 1)
                : undefined,
              rowSpan: canvas
                ? layout.covered.has(position)
                  ? 0
                  : Math.min(rows.length - record.index, (cell?.mv || 0) + 1)
                : spans.get(column.key)?.[displayIndex],
              className: !canvas && column.editable ? "rp-editable" : undefined,
              title: !canvas && column.editable ? "双击编辑" : undefined,
              onDoubleClick: () => {
                if (!canvas && column.editable && !busy && active)
                  setEdit({
                    index: record.index,
                    column,
                    value: String(record.data[column.key] ?? ""),
                  });
              },
            };
          },
        };
        return converted;
      });
    const converted = convert(result.columns);
    if (!hasTag(reportTag, "NONUM"))
      converted.unshift({
        key: "rp-number",
        title: "No",
        width: 60,
        fixed: "left",
        align: "center",
        render: (_, row) =>
          (reportType === "TABLE" && snapshot.size !== "all"
            ? (snapshot.page - 1) * snapshot.size
            : 0) +
          row.index +
          1,
      });
    return converted;
  }, [
    result.columns,
    flat,
    widths,
    canvas,
    sorts,
    snapshot,
    edit,
    saving,
    layout,
    spans,
    busy,
    active,
    reportTag,
    reportType,
    onLink,
  ]);
  const handleChange: TableProps<RecordRow>["onChange"] = (
    _page,
    _filter,
    sorter,
  ) => {
    if (busy) return;
    const items = Array.isArray(sorter) ? sorter : [sorter];
    onSort(
      items
        .filter((item) => item.order && item.columnKey)
        .map((item) => ({ key: String(item.columnKey), order: item.order! })),
    );
  };
  const numbered = !hasTag(reportTag, "NONUM");
  return (
    <div className="rp-table">
      <Table<RecordRow>
        bordered
        size="small"
        components={{ header: { cell: Header } }}
        columns={tableColumns}
        dataSource={rows}
        rowKey="index"
        loading={loading}
        pagination={false}
        onChange={handleChange}
        scroll={{ x: "max-content" }}
        tableLayout="fixed"
        summary={
          flat.some((col) => col.sum)
            ? () => (
                <Table.Summary>
                  <Table.Summary.Row>
                    {numbered && (
                      <Table.Summary.Cell index={0}>合计</Table.Summary.Cell>
                    )}
                    {flat.map((col, index) => (
                      <Table.Summary.Cell
                        index={index + Number(numbered)}
                        key={col.key}
                        align={col.align}
                      >
                        {col.sum
                          ? Number(
                              rows
                                .reduce((sum, row) => {
                                  const number = Number(row.data[col.key]);
                                  return (
                                    sum + (Number.isFinite(number) ? number : 0)
                                  );
                                }, 0)
                                .toFixed(8),
                            )
                          : ""}
                      </Table.Summary.Cell>
                    ))}
                  </Table.Summary.Row>
                </Table.Summary>
              )
            : undefined
        }
      />
      {reportType === "TABLE" && (
        <div className="rp-pagination">
          <span>共 {result.total} 条</span>
          <Select<PageSize>
            aria-label="每页条数"
            disabled={busy}
            value={snapshot.size}
            options={[
              ...[1000, 2000, 5000].map((value) => ({
                value,
                label: `${value} 条/页`,
              })),
              { value: "all", label: "全部" },
            ]}
            onChange={(size) => onPage(1, size)}
          />
          <Pagination
            disabled={busy || snapshot.size === "all"}
            current={snapshot.page}
            total={result.total}
            pageSize={
              snapshot.size === "all"
                ? Math.max(1, result.total)
                : snapshot.size
            }
            showSizeChanger={false}
            showQuickJumper
            onChange={(page) => onPage(page, snapshot.size)}
          />
        </div>
      )}
    </div>
  );
}
