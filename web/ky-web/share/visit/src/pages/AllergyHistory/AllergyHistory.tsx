import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { App, Modal, Spin, Tag } from "antd";
import {
  deleteAllergyAPI,
  getAllergyListAPI,
  getItemListAPI,
  newAllergyAPI,
  retrieveDict2ItemList,
  saveAllergyPropertyAPI,
} from "@/api/allergy";
import type { AllergyRow, ItemRow } from "@/types/allergy";
import AllergyDeleteModal from "./AllergyDeleteModal";
import AllergyFormTable from "./AllergyFormTable";
import {
  ALLERGY_TYPE_DICT_NAME,
  HAS_ALLERGY_COLOR,
  NO_ALLERGY_COLOR,
  OTHER_ITEM,
} from "./constants";
import type { AllergyHistoryProps, AllergyTableRow } from "./types";
import { createRowKey } from "./utils";

const toTableRows = (list: AllergyRow[]): AllergyTableRow[] =>
  list.map((item) => ({
    ...item,
    rowKey: item.allergy_id ? `id_${item.allergy_id}` : createRowKey(),
  }));

const AllergyHistory = ({
  patientId,
  className,
  hasAllergyColor = HAS_ALLERGY_COLOR,
  noAllergyColor = NO_ALLERGY_COLOR,
  showLabel = true,
  allergyTypeDictName = ALLERGY_TYPE_DICT_NAME,
  includeEmpi,
  onSaved,
}: AllergyHistoryProps) => {
  const { message, modal } = App.useApp();
  const [open, setOpen] = useState(false);
  const [capsuleLoading, setCapsuleLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [displayRows, setDisplayRows] = useState<AllergyTableRow[]>([]);
  const [rows, setRows] = useState<AllergyTableRow[]>([]);
  const [typeOptions, setTypeOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [itemOptions, setItemOptions] = useState<ItemRow[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<{
    row: AllergyTableRow;
    index: number;
  } | null>(null);
  const dirtyRef = useRef(false);
  const rowsRef = useRef(rows);
  rowsRef.current = rows;

  const loadAllergyList = useCallback(async () => {
    if (!patientId) {
      setRows([]);
      setDisplayRows([]);
      return;
    }
    try {
      const res = await getAllergyListAPI({
        patient_id: patientId,
        allergy_type: "*",
        include_empi: includeEmpi,
      });
      const tableRows = toTableRows(res.row_list ?? []);
      setRows(tableRows);
      setDisplayRows(tableRows);
      dirtyRef.current = false;
    } catch (err) {
      console.log("err: ", err);
    }
  }, [includeEmpi, message, patientId]);

  const loadTypeOptions = useCallback(async () => {
    try {
      const res = await retrieveDict2ItemList({
        dict_code: allergyTypeDictName,
      });
      setTypeOptions(
        (res.row_list ?? [])
          .map((item) => item.item_name?.trim())
          .filter((name): name is string => !!name)
          .map((name) => ({ label: name, value: name })),
      );
    } catch (err) {
      console.log("err: ", err);
    }
  }, [allergyTypeDictName, message]);

  const loadItemOptions = useCallback(async () => {
    try {
      const res = await getItemListAPI();
      const list = [...(res.row_list ?? [])];
      if (!list.some((item) => item.item_id === OTHER_ITEM.item_id)) {
        list.push({ ...OTHER_ITEM });
      }
      setItemOptions(list);
    } catch (err) {
      setItemOptions((prev) => (prev.length ? prev : [{ ...OTHER_ITEM }]));
      console.log("err: ", err);
    }
  }, [message]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setCapsuleLoading(true);
      try {
        await loadAllergyList();
      } finally {
        if (!cancelled) setCapsuleLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [loadAllergyList]);

  const openModal = async () => {
    setOpen(true);
    setTableLoading(true);
    try {
      await Promise.all([
        loadAllergyList(),
        loadTypeOptions(),
        loadItemOptions(),
      ]);
    } finally {
      setTableLoading(false);
    }
  };

  const closeModal = () => {
    if (!dirtyRef.current) {
      setOpen(false);
      return;
    }
    modal.confirm({
      title: "有未保存的修改，确定关闭？",
      okText: "关闭",
      cancelText: "取消",
      onOk: () => {
        dirtyRef.current = false;
        setOpen(false);
      },
    });
  };

  const handlePatch = useCallback(
    (rowKey: string, patch: Partial<AllergyTableRow>) => {
      dirtyRef.current = true;
      setRows((prev) =>
        prev.map((row) => (row.rowKey === rowKey ? { ...row, ...patch } : row)),
      );
    },
    [],
  );

  const handleAdd = useCallback(() => {
    if (rowsRef.current.some((row) => !row.item_type)) {
      message.warning("有未选择的过敏类型");
      return;
    }
    dirtyRef.current = true;
    setRows((prev) => [
      ...prev,
      {
        rowKey: createRowKey(),
        item_type: "",
        allergy_name: "",
        item_name: "",
      },
    ]);
  }, [message]);

  const handleRemove = useCallback((row: AllergyTableRow, index: number) => {
    if (!row.allergy_id) {
      dirtyRef.current = true;
      setRows((prev) => prev.filter((item) => item.rowKey !== row.rowKey));
      return;
    }
    setDeleteTarget({ row, index });
  }, []);

  const handleConfirmDelete = async (deleteNote: string) => {
    if (!deleteTarget?.row.allergy_id) return;
    setDeleting(true);
    try {
      await deleteAllergyAPI({
        allergy_id: deleteTarget.row.allergy_id,
        delete_note: deleteNote,
      });
      message.success("删除成功");
      const removedKey = deleteTarget.row.rowKey;
      setRows((prev) => prev.filter((item) => item.rowKey !== removedKey));
      setDisplayRows((prev) =>
        prev.filter((item) => item.rowKey !== removedKey),
      );
      setDeleteTarget(null);
      onSaved?.();
    } catch (err) {
      console.log("err: ", err);
    } finally {
      setDeleting(false);
    }
  };

  const handleSave = async () => {
    const payloadRows = rows.filter((row) => row.allergy_name?.trim());
    const savedIdMap = new Map<string, number>();
    setSaving(true);
    try {
      for (const row of payloadRows) {
        const { rowKey, ...property } = row;
        if (row.allergy_id) {
          await saveAllergyPropertyAPI({
            allergy_id: row.allergy_id,
            allergy_property: property,
          });
        } else {
          const res = await newAllergyAPI({
            ...property,
            patient_id: patientId,
          });
          if (res.allergy_id) savedIdMap.set(rowKey, res.allergy_id);
        }
      }
      message.success("保存成功");
      dirtyRef.current = false;
      await loadAllergyList();
      onSaved?.();
    } catch (err) {
      if (savedIdMap.size > 0) {
        setRows((prev) =>
          prev.map((row) => {
            const allergyId = savedIdMap.get(row.rowKey);
            return allergyId ? { ...row, allergy_id: allergyId } : row;
          }),
        );
      }
      console.log("err: ", err);
    } finally {
      setSaving(false);
    }
  };

  const allergyNames = useMemo(
    () =>
      displayRows
        .map((row) => row.allergy_name?.trim())
        .filter((name): name is string => !!name),
    [displayRows],
  );
  const hasAllergy = allergyNames.length > 0;
  const contentText = hasAllergy ? allergyNames.join("、") : "未发现";
  const capsuleText = showLabel ? `过敏史：${contentText}` : contentText;

  return (
    <>
      <Spin spinning={capsuleLoading} size="small">
        <Tag
          title={capsuleText}
          variant="solid"
          color={hasAllergy ? hasAllergyColor : noAllergyColor}
          className={["max-w-full cursor-pointer", className]
            .filter(Boolean)
            .join(" ")}
          onClick={(e) => {
            e.stopPropagation();
            void openModal();
          }}
        >
          <span className="truncate">{capsuleText}</span>
        </Tag>
      </Spin>

      <Modal
        title="过敏史"
        open={open}
        width="80%"
        okText="保存"
        cancelText="取消"
        confirmLoading={saving}
        destroyOnHidden
        onCancel={closeModal}
        onOk={() => void handleSave()}
      >
        <AllergyFormTable
          rows={rows}
          typeOptions={typeOptions}
          itemOptions={itemOptions}
          loading={tableLoading}
          onAdd={handleAdd}
          onRemove={handleRemove}
          onPatch={handlePatch}
        />
      </Modal>

      <AllergyDeleteModal
        open={!!deleteTarget}
        submitting={deleting}
        rowIndex={deleteTarget?.index}
        onCancel={() => setDeleteTarget(null)}
        onSubmit={handleConfirmDelete}
      />
    </>
  );
};

export default AllergyHistory;
