import { forwardRef, useImperativeHandle } from "react";
import { Alert, Button, Table } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { useMultiRows } from "../../hooks/useMultiRows";
import { EMPTY_CELL, resolveColumnLabel, type TableRow } from "../../model/multiRowModel";
import MultiRowTableCell from "./MultiRowTableCell";
import type { MultiRowTableProps, MultiRowTableRef } from "./types";

const MultiRowTable = forwardRef<MultiRowTableRef, MultiRowTableProps>(
  (props, ref) => {
    const { section_id, formContext, elemList } = props;
    const {
      rows, initializing, initError,
      changeCell, changeCellScore, addRow, deleteRow,
      getSectionValue, initSectionValue,
    } = useMultiRows(props);

    useImperativeHandle(ref, () => ({
      getSectionValue,
      initSectionValue: (value, options) => { void initSectionValue(value, options); },
    }), [getSectionValue, initSectionValue]);

    const columns = [
      ...elemList.map((elem, index) => ({
        title: resolveColumnLabel(elem.elem_title, elem.elem_name),
        key: elem.row_id != null ? String(elem.row_id) : `${elem.elem_id}-${index}`,
        render: (_: unknown, record: TableRow) => (
          <MultiRowTableCell
            elem={elem}
            section_id={section_id}
            formContext={formContext}
            record={record}
            cellValue={record.values[elem.elem_id] ?? EMPTY_CELL}
            onChange={(next) => changeCell(record.id, elem.elem_id, next)}
            onScoreChange={(score) => changeCellScore(record.id, elem.elem_id, score)}
          />
        ),
      })),
      {
        title: <Button type="text" color="primary" icon={<PlusOutlined />} onClick={addRow} />,
        key: "action",
        width: 20,
        fixed: "right" as const,
        render: (_: unknown, record: TableRow) => (
          <Button type="text" danger icon={<DeleteOutlined />} onClick={() => deleteRow(record.id)} />
        ),
      },
    ];

    return (
      <>
        {initError ? <Alert type="error" title={initError} showIcon /> : null}
        <Table
          bordered
          size="small"
          pagination={false}
          rowKey="id"
          columns={columns}
          dataSource={rows}
          loading={initializing}
          scroll={{ x: "max-content" }}
          locale={{ emptyText: "暂无数据，点击上方+号按钮添加" }}
        />
      </>
    );
  },
);

export default MultiRowTable;
