import React, { useEffect, useMemo, useState } from "react";
import { Button, Input, Popover, Tooltip, theme } from "antd";
import bootstrapIcons from "bootstrap-icons/font/bootstrap-icons.json";
import { renderMenuIcon } from "@/pages/ModuleManagement/renderMenuIcon";
import { appThemeVars } from "comm/theme";

interface IconPickerProps {
  value?: string;
  onChange?: (iconName: string) => void;
  /** compact: 表格等紧凑场景；field: 表单输入框风格 */
  variant?: "compact" | "field";
}

const ICON_NAMES: string[] = Object.keys(bootstrapIcons);

/** 每页约 12 行 × 8 列，滚动到底再加载下一批 */
const PAGE_SIZE = 96;
/** 无选中值时的默认图标（新增表单需用 initialValue 同步，否则仅展示、不会入库） */
export const DEFAULT_ICON = "question-octagon";

const IconPicker: React.FC<IconPickerProps> = ({
  value,
  onChange,
  variant = "compact",
}) => {
  const { token } = theme.useToken();
  const themeVars = appThemeVars(token);
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return ICON_NAMES;
    return ICON_NAMES.filter((name) => name.toLowerCase().includes(kw));
  }, [keyword]);

  useEffect(() => {
    setDisplayCount(PAGE_SIZE);
  }, [keyword]);

  const visible = filtered.slice(0, displayCount);
  const hasMore = displayCount < filtered.length;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!hasMore) return;
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 48) {
      setDisplayCount((count) =>
        Math.min(count + PAGE_SIZE, filtered.length),
      );
    }
  };

  const handlePick = (name: string) => {
    onChange?.(name);
    setOpen(false);
  };

  const content = (
    <div className="flex w-80 flex-col gap-2" style={themeVars}>
      <Input.Search
        placeholder="搜索图标名"
        allowClear
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        size="small"
      />
      <div
        className="grid max-h-[260px] grid-cols-8 gap-1 overflow-y-auto py-1"
        onScroll={handleScroll}
      >
        {visible.map((name) => (
          <Tooltip title={name} key={name} mouseEnterDelay={0.4}>
            <button
              type="button"
              className={`inline-flex aspect-square w-full cursor-pointer items-center justify-center rounded border bg-transparent text-base text-[var(--app-theme-text-secondary)] transition-colors duration-200 hover:bg-[var(--app-theme-primary-bg)] hover:text-[var(--app-theme-primary)] ${
                name === value
                  ? "border-[var(--app-theme-primary)] bg-[var(--app-theme-primary-bg)] text-[var(--app-theme-primary)]"
                  : "border-transparent"
              }`}
              onClick={() => handlePick(name)}
            >
              {renderMenuIcon(name)}
            </button>
          </Tooltip>
        ))}
        {visible.length === 0 ? (
          <div className="col-span-full py-4 text-center text-xs text-[var(--app-theme-text-secondary)]">
            未找到匹配图标
          </div>
        ) : null}
      </div>
      {hasMore ? (
        <div className="text-center text-xs text-[var(--app-theme-text-secondary)]">
          已显示 {visible.length} / {filtered.length}，继续滚动加载
        </div>
      ) : filtered.length > 0 ? (
        <div className="text-center text-xs text-[var(--app-theme-text-secondary)]">
          共 {filtered.length} 个
        </div>
      ) : null}
    </div>
  );

  const iconName = value || DEFAULT_ICON;

  const trigger =
    variant === "field" ? (
      <button
        type="button"
        className="flex h-8 w-full cursor-pointer items-center gap-2 rounded-md border border-[var(--app-theme-border)] bg-[var(--app-theme-bg-container)] px-3 text-left transition-colors hover:border-[var(--app-theme-primary)]"
      >
        <span className="flex shrink-0 items-center text-base text-[var(--app-theme-text-secondary)]">
          {renderMenuIcon(iconName)}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm text-[var(--app-theme-text)]">
          {iconName}
        </span>
        <span className="shrink-0 text-xs text-[var(--app-theme-text-secondary)]">
          选择
        </span>
      </button>
    ) : (
      <Button
        size="small"
        className="inline-flex h-8 w-8 items-center justify-center p-0 text-base text-[var(--app-theme-text-secondary)]"
      >
        {renderMenuIcon(iconName)}
      </Button>
    );

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setKeyword("");
          setDisplayCount(PAGE_SIZE);
        }
      }}
      trigger="click"
      placement="bottom"
      content={content}
    >
      <span style={themeVars}>{trigger}</span>
    </Popover>
  );
};

export default IconPicker;
