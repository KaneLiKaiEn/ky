import React, { useMemo } from "react";
import { Badge, Button, Input, Table } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useTableScrollY } from "@/hooks/useTableScrollY";
import type { Dict2Row } from "@/types/sys";
import { getDictColumns } from "./columns";

interface DictPanelProps {
  data: Dict2Row[];
  total: number;
  loading: boolean;
  selectedId?: number;
  keyword: string;
  createDisabled?: boolean;
  onKeywordChange: (value: string) => void;
  onSelect: (record: Dict2Row) => void;
  onCreate: () => void;
  onEdit: (record: Dict2Row) => void;
  onDelete: (record: Dict2Row) => void;
}

const DictPanel: React.FC<DictPanelProps> = ({
  data,
  total,
  loading,
  selectedId,
  keyword,
  createDisabled,
  onKeywordChange,
  onSelect,
  onCreate,
  onEdit,
  onDelete,
}) => {
  const { ref, scrollY } = useTableScrollY();
  const columns = useMemo(
    () => getDictColumns({ onEdit, onDelete }),
    [onEdit, onDelete],
  );

  return (
    <section className="dict-panel dict-page__aside">
      <header className="dict-panel__header">
        <div className="dict-panel__title">
          <span>字典</span>
          <Badge count={total} showZero overflowCount={999} color="#8c8c8c" />
        </div>
        <Button
          type="primary"
          size="small"
          icon={<PlusOutlined />}
          disabled={createDisabled}
          onClick={onCreate}
        >
          新增
        </Button>
      </header>
      <div className="dict-panel__toolbar">
        <Input.Search
          allowClear
          placeholder="搜索名称或编码"
          value={keyword}
          onChange={(event) => onKeywordChange(event.target.value)}
        />
      </div>
      <div className="dict-panel__body" ref={ref}>
        <Table<Dict2Row>
          size="small"
          columns={columns}
          dataSource={data}
          rowKey={(row) => String(row.dict_id ?? row.dict_code)}
          loading={loading}
          pagination={false}
          scroll={{ x: "max-content", y: scrollY }}
          rowClassName={(record) =>
            record.dict_id === selectedId ? "dict-row dict-row--active" : "dict-row"
          }
          onRow={(record) => ({ onClick: () => onSelect(record) })}
        />
      </div>
    </section>
  );
};

export default DictPanel;
