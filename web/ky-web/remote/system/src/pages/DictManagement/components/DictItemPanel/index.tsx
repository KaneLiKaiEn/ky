import React, { useMemo } from "react";
import { Badge, Button, Empty, Input, Table, Tag } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useTableScrollY } from "@/hooks/useTableScrollY";
import type { Dict2ItemRow, Dict2Row } from "@/types/sys";
import { useDictItemList } from "../../hooks/useDictItemList";
import { useFormModal } from "../../hooks/useFormModal";
import DictItemFormModal from "../DictItemFormModal";
import { getDictItemColumns } from "./columns";

interface DictItemPanelProps {
  dict: Dict2Row | null;
  orgId?: number;
}

const DictItemPanel: React.FC<DictItemPanelProps> = ({ dict, orgId }) => {
  const dictId = dict?.dict_id ?? undefined;
  const { loading, list, filtered, keyword, setKeyword, refresh, remove } =
    useDictItemList(dictId);
  const modal = useFormModal<Dict2ItemRow>();
  const { ref, scrollY } = useTableScrollY();

  const columns = useMemo(
    () => getDictItemColumns({ onEdit: modal.openEdit, onDelete: remove }),
    [modal.openEdit, remove],
  );

  if (dictId == null) {
    return (
      <section className="dict-panel dict-page__main">
        <div className="dict-panel__empty">
          <Empty description="请选择左侧字典" />
        </div>
      </section>
    );
  }

  return (
    <section className="dict-panel dict-page__main">
      <header className="dict-panel__header">
        <div className="dict-panel__title">
          <span className="dict-panel__name">{dict?.dict_name}</span>
          {dict?.dict_code ? <Tag bordered={false}>{dict.dict_code}</Tag> : null}
          <Badge
            count={list.length}
            showZero
            overflowCount={999}
            color="#8c8c8c"
          />
        </div>
        <Button
          type="primary"
          size="small"
          icon={<PlusOutlined />}
          onClick={modal.openCreate}
        >
          新增字典项
        </Button>
      </header>
      <div className="dict-panel__toolbar">
        <Input.Search
          allowClear
          placeholder="搜索名称或编码"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />
      </div>
      <div className="dict-panel__body" ref={ref}>
        <Table<Dict2ItemRow>
          size="small"
          columns={columns}
          dataSource={filtered}
          rowKey={(row) => String(row.row_id ?? row.item_code)}
          loading={loading}
          pagination={false}
          scroll={{ x: "max-content", y: scrollY }}
        />
      </div>
      <DictItemFormModal
        open={modal.open}
        dictId={dictId}
        orgId={orgId}
        editingRecord={modal.editing}
        onCancel={modal.close}
        onSuccess={() => {
          modal.close();
          refresh();
        }}
      />
    </section>
  );
};

export default DictItemPanel;
