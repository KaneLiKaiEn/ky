import React, { useCallback, useEffect, useState } from "react";
import {
  App,
  Button,
  Input,
  List,
  Modal,
  Popconfirm,
  Space,
  Spin,
  theme,
} from "antd";
import { SnippetsOutlined } from "@ant-design/icons";
import {
  deletePiece,
  getPieceList,
  newPiece,
  savePieceProperty,
} from "@/api/form";
import type { PieceRow } from "@/types/form";

export interface PiecePickerContext {
  form_id?: number;
  org_id?: number;
}

export interface PieceModalProps {
  open: boolean;
  onCancel: () => void;
  elem_id: number;
  elem_name?: string;
  context?: PiecePickerContext;
  currentValue?: string;
  /** false = 仅管理，无「确定」；默认 true */
  selectMode?: boolean;
  onSelect?: (content: string) => void;
}

export interface PiecePickerAddonProps {
  elem_id: number;
  elem_name: string;
  context?: PiecePickerContext;
  currentValue: string;
  disabled?: boolean;
  onSelect: (content: string) => void;
}

const pieceLabel = (piece: PieceRow): string => {
  const content = piece.piece_content?.trim();
  if (content) {
    const firstLine = content.split("\n")[0] ?? content;
    return firstLine.length > 40 ? `${firstLine.slice(0, 40)}…` : firstLine;
  }
  return piece.piece_name?.trim() || `模板 ${piece.piece_id ?? ""}`;
};

export const PieceModal: React.FC<PieceModalProps> = ({
  open,
  onCancel,
  elem_id,
  elem_name,
  context,
  currentValue = "",
  selectMode = true,
  onSelect,
}) => {
  const { message } = App.useApp();
  const { token } = theme.useToken();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pieces, setPieces] = useState<PieceRow[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editContent, setEditContent] = useState("");

  const loadPieces = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPieceList({
        elem_id,
        form_id: context?.form_id,
        org_id: context?.org_id,
      });
      setPieces(res.row_list ?? []);
    } catch {
      message.error("加载模板列表失败");
    } finally {
      setLoading(false);
    }
  }, [context?.form_id, context?.org_id, elem_id, message]);

  useEffect(() => {
    if (!open) return;
    setSelectedId(null);
    setEditName("");
    setEditContent(currentValue);
    void loadPieces();
  }, [open, currentValue, loadPieces]);

  const selectPiece = (piece: PieceRow) => {
    setSelectedId(piece.piece_id ?? null);
    setEditName(piece.piece_name ?? "");
    setEditContent(piece.piece_content ?? "");
  };

  const handleConfirm = () => {
    onSelect?.(editContent);
    onCancel();
  };

  const handleNew = async () => {
    setSaving(true);
    try {
      const res = await newPiece({
        form_id: context?.form_id,
        org_id: context?.org_id,
        elem_id,
        piece_name: editName.trim() || "新模板",
        piece_content: editContent,
      });
      message.success("新建成功");
      await loadPieces();
      if (res.piece_id != null) {
        setSelectedId(res.piece_id);
      }
    } catch {
      message.error("新建模板失败");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (selectedId == null) return;
    setSaving(true);
    try {
      await deletePiece({ piece_id: selectedId });
      message.success("删除成功");
      setSelectedId(null);
      setEditName("");
      setEditContent("");
      await loadPieces();
    } catch {
      message.error("删除模板失败");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (selectedId == null) return;
    setSaving(true);
    try {
      await savePieceProperty({
        piece_id: selectedId,
        piece_property: {
          piece_id: selectedId,
          form_id: context?.form_id,
          elem_id,
          elem_name,
          piece_name: editName,
          piece_content: editContent,
        },
      });
      message.success("保存成功");
      await loadPieces();
    } catch {
      message.error("保存模板失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={selectMode ? "选择模板" : "模板管理"}
      open={open}
      width={560}
      destroyOnHidden
      onCancel={onCancel}
      footer={
        <Space>
          <Button onClick={onCancel}>{selectMode ? "取消" : "关闭"}</Button>
          {selectMode && (
            <Button type="primary" onClick={handleConfirm}>
              确定
            </Button>
          )}
        </Space>
      }
    >
      <Space className="mb-3">
        <Button loading={saving} onClick={() => void handleNew()}>
          新建
        </Button>
        <Popconfirm
          title="确定删除该模板？"
          disabled={selectedId == null}
          onConfirm={() => void handleDelete()}
        >
          <Button danger disabled={selectedId == null} loading={saving}>
            删除
          </Button>
        </Popconfirm>
        <Button
          disabled={selectedId == null}
          loading={saving}
          onClick={() => void handleSave()}
        >
          保存
        </Button>
      </Space>
      <Spin spinning={loading}>
        <div className="flex gap-3" style={{ minHeight: 240 }}>
          <List
            className="flex-1 rounded overflow-auto"
            style={{
              maxHeight: 280,
              border: `1px solid ${token.colorBorderSecondary}`,
            }}
            size="small"
            dataSource={pieces}
            locale={{ emptyText: "暂无模板" }}
            renderItem={(item) => (
              <List.Item
                className="cursor-pointer px-3!"
                style={{
                  background:
                    item.piece_id === selectedId
                      ? token.colorPrimaryBg
                      : undefined,
                }}
                onClick={() => selectPiece(item)}
              >
                {pieceLabel(item)}
              </List.Item>
            )}
          />
          <div className="flex-1 flex flex-col gap-2">
            <Input
              placeholder="模板名称"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
            <Input.TextArea
              className="flex-1"
              placeholder="模板内容"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              autoSize={{ minRows: 8, maxRows: 12 }}
            />
          </div>
        </div>
      </Spin>
    </Modal>
  );
};

export const PiecePickerAddon: React.FC<PiecePickerAddonProps> = ({
  elem_id,
  elem_name,
  context,
  currentValue,
  disabled,
  onSelect,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="text"
        size="small"
        icon={<SnippetsOutlined />}
        disabled={disabled}
        title="模板"
        onClick={() => setOpen(true)}
      />
      <PieceModal
        open={open}
        onCancel={() => setOpen(false)}
        elem_id={elem_id}
        elem_name={elem_name}
        context={context}
        currentValue={currentValue}
        selectMode
        onSelect={onSelect}
      />
    </>
  );
};
