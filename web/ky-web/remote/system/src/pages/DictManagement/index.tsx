import React, { useEffect } from "react";
import { Select } from "antd";
import type { Dict2Row } from "@/types/sys";
import DictFormModal from "./components/DictFormModal";
import DictItemPanel from "./components/DictItemPanel";
import DictPanel from "./components/DictPanel";
import { useDictList } from "./hooks/useDictList";
import { useFormModal } from "./hooks/useFormModal";
import { useOrgOptions } from "./hooks/useOrgOptions";
import { RefreshFeedback } from "@/components/Feedback";
import "./style.scss";

const DictManagement: React.FC = () => {
  const { orgId, setOrgId, options, loading, error, reload } = useOrgOptions();
  const dicts = useDictList(orgId);
  const modal = useFormModal<Dict2Row>();
  const { close: closeModal } = modal;

  useEffect(() => {
    closeModal();
  }, [orgId, closeModal]);

  return (
    <div className="dict-page">
      <header className="dict-page__header">
        <h2 className="dict-page__title">字典管理</h2>
        <Select
          className="dict-page__org"
          placeholder="请选择机构"
          showSearch
          optionFilterProp="label"
          loading={loading}
          value={orgId}
          options={options}
          fieldNames={{ value: "org_id", label: "org_name" }}
          onChange={setOrgId}
        />
      </header>
      <RefreshFeedback prefix="dict-page" loading={loading} error={error} retry={reload} />
      <div className="dict-page__body">
        <DictPanel
          data={dicts.filtered}
          total={dicts.list.length}
          loading={dicts.loading}
          selectedId={dicts.selected?.dict_id}
          keyword={dicts.keyword}
          createDisabled={orgId == null}
          onKeywordChange={dicts.setKeyword}
          onSelect={dicts.setSelected}
          onCreate={modal.openCreate}
          onEdit={modal.openEdit}
          onDelete={dicts.remove}
        />
        <DictItemPanel dict={dicts.selected} orgId={orgId} />
      </div>
      <DictFormModal
        open={modal.open}
        orgId={orgId}
        editingRecord={modal.editing}
        onCancel={modal.close}
        onSuccess={() => {
          modal.close();
          dicts.refresh();
        }}
      />
    </div>
  );
};

export default DictManagement;
