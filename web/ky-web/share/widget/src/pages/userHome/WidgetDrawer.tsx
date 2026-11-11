import React, { useMemo, useState } from "react";
import { App, Button, Drawer, Empty, Input, Skeleton } from "antd";
import {
  AppstoreOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import type { WidgetRow } from "@/types/federation";
import "./WidgetDrawer.scss";

interface WidgetDrawerProps {
  open: boolean;
  loading: boolean;
  catalog: WidgetRow[];
  addedCodes: ReadonlySet<string>;
  onClose: () => void;
  onAdd: (row: WidgetRow) => void;
  onRemove: (code: string) => void;
  onClear: () => void;
}

const ALL_CATEGORY = "ALL";

const WidgetDrawer: React.FC<WidgetDrawerProps> = ({
  open,
  loading,
  catalog,
  addedCodes,
  onClose,
  onAdd,
  onRemove,
  onClear,
}) => {
  const { modal } = App.useApp();
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedTag, setSelectedTag] = useState(ALL_CATEGORY);

  // 提取分类标签
  const availableTags = useMemo(() => {
    const set = new Set<string>();
    for (const item of catalog) {
      if (item.widget_tag?.trim()) {
        set.add(item.widget_tag.trim());
      }
    }
    return Array.from(set);
  }, [catalog]);

  // 过滤后的列表
  const filteredCatalog = useMemo(() => {
    const kw = searchKeyword.trim().toLowerCase();
    return catalog.filter((item) => {
      // 标签过滤
      if (selectedTag !== ALL_CATEGORY) {
        if (item.widget_tag?.trim() !== selectedTag) return false;
      }
      // 关键词过滤
      if (!kw) return true;
      const name = (item.widget_name ?? "").toLowerCase();
      const code = (item.widget_code ?? "").toLowerCase();
      const kb = (item.kb_code ?? "").toLowerCase();
      const note = (item.widget_note ?? "").toLowerCase();
      const tag = (item.widget_tag ?? "").toLowerCase();
      return (
        name.includes(kw) ||
        code.includes(kw) ||
        kb.includes(kw) ||
        note.includes(kw) ||
        tag.includes(kw)
      );
    });
  }, [catalog, searchKeyword, selectedTag]);

  // 已添加数量统计
  const addedCount = useMemo(() => {
    return catalog.reduce((acc, cur) => {
      return cur.widget_code && addedCodes.has(cur.widget_code) ? acc + 1 : acc;
    }, 0);
  }, [catalog, addedCodes]);

  const handleClearClick = () => {
    modal.confirm({
      title: "清空布局",
      content: "确认清空布局？",
      okText: "清空",
      okButtonProps: { danger: true },
      cancelText: "取消",
      onOk: onClear,
    });
  };

  const customHeader = (
    <div className="widget-drawer__header">
      <div className="widget-drawer__header-title">
        <div className="widget-drawer__header-main">编辑小组件</div>
      </div>
      <div className="widget-drawer__header-actions">
        <Button
          danger
          size="small"
          disabled={addedCodes.size === 0}
          onClick={handleClearClick}
        >
          清空布局
        </Button>
        <div className="widget-drawer__header-badge">
          已添加 {addedCount} / {catalog.length}
        </div>
      </div>
    </div>
  );

  return (
    <Drawer
      className="widget-drawer"
      title={customHeader}
      open={open}
      onClose={onClose}
      destroyOnHidden
      size={440}
    >
      <div className="widget-drawer__toolbar">
        <Input
          placeholder="搜索组件名称 / 编码 / 拼音码"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          size="small"
        />

        {availableTags.length > 0 && (
          <div className="widget-drawer__tags">
            <div
              className={`widget-drawer__tags-item ${
                selectedTag === ALL_CATEGORY
                  ? "widget-drawer__tags-item--active"
                  : ""
              }`}
              onClick={() => setSelectedTag(ALL_CATEGORY)}
            >
              全部 ({catalog.length})
            </div>
            {availableTags.map((tag) => {
              const count = catalog.filter(
                (c) => c.widget_tag?.trim() === tag,
              ).length;
              return (
                <div
                  key={tag}
                  className={`widget-drawer__tags-item ${
                    selectedTag === tag
                      ? "widget-drawer__tags-item--active"
                      : ""
                  }`}
                  onClick={() => setSelectedTag(tag)}
                >
                  {tag} ({count})
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="widget-drawer__list">
        {loading ? (
          Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="widget-drawer__skeleton">
              <Skeleton
                active
                avatar={{ shape: "square", size: "large" }}
                paragraph={{ rows: 2 }}
              />
            </div>
          ))
        ) : filteredCatalog.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center py-16">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                searchKeyword || selectedTag !== ALL_CATEGORY
                  ? "未找到匹配的小组件"
                  : "暂无可用的小组件"
              }
            >
              {(searchKeyword || selectedTag !== ALL_CATEGORY) && (
                <Button
                  size="small"
                  onClick={() => {
                    setSearchKeyword("");
                    setSelectedTag(ALL_CATEGORY);
                  }}
                >
                  重置筛选条件
                </Button>
              )}
            </Empty>
          </div>
        ) : (
          filteredCatalog.map((item) => {
            const code = item.widget_code ?? "";
            const isAdded = Boolean(code) && addedCodes.has(code);

            return (
              <div
                key={code}
                className={`widget-drawer__card ${
                  isAdded ? "widget-drawer__card--added" : ""
                }`}
              >
                <div className="widget-drawer__card-icon">
                  <AppstoreOutlined />
                </div>

                <div className="widget-drawer__card-content">
                  <div className="widget-drawer__card-header">
                    <span className="widget-drawer__card-title">
                      {item.widget_name || item.widget_code}
                    </span>
                    {item.widget_tag && (
                      <span className="widget-drawer__card-tag">
                        {item.widget_tag}
                      </span>
                    )}
                    {isAdded && (
                      <span className="widget-drawer__card-status-badge">
                        <CheckOutlined style={{ fontSize: 10 }} /> 已在工作台
                      </span>
                    )}
                  </div>

                  <div className="widget-drawer__card-desc">
                    {item.widget_note || "暂无组件描述说明"}
                  </div>
                </div>

                <div className="widget-drawer__card-action">
                  {isAdded ? (
                    <Button danger size="small" onClick={() => onRemove(code)}>
                      移除
                    </Button>
                  ) : (
                    <Button
                      type="primary"
                      size="small"
                      onClick={() => onAdd(item)}
                    >
                      添加
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </Drawer>
  );
};

export default WidgetDrawer;
