import { ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Input, Segmented, Select, Tooltip } from "antd";
import type { OrderListSortOption } from "./useOrderListSortOptions";

interface OrderListHeaderProps {
  catalogFilters: { label: string; value: string }[];
  catalog: string;
  onCatalogChange: (catalog: string) => void;
  statusFilters: { label: string; value: string }[];
  status: string;
  onStatusChange: (status: string) => void;
  searchKeyword: string;
  onSearchKeywordChange: (keyword: string) => void;
  onRefresh?: () => void;
  refreshLoading?: boolean;
  sortOptions?: OrderListSortOption[];
  sortValue?: string;
  sortLoading?: boolean;
  onSortChange?: (value: string | undefined) => void;
}

/** 医嘱列表头部：类别 + 状态 Segmented，右侧搜索 / 刷新 */
const OrderListHeader = ({
  catalogFilters,
  catalog,
  onCatalogChange,
  statusFilters,
  status,
  onStatusChange,
  searchKeyword,
  onSearchKeywordChange,
  onRefresh,
  refreshLoading,
  sortOptions = [],
  sortValue,
  sortLoading,
  onSortChange,
}: OrderListHeaderProps) => {
  return (
    <div className="flex shrink-0 flex-col gap-2 border-b border-(--app-theme-border) bg-(--app-theme-bg-container) px-3 py-2">
      <div className="flex min-w-0 flex-wrap items-center gap-4">
        <div className="flex min-w-0 items-center gap-1 overflow-x-auto">
          <span className="shrink-0 text-[12px] text-(--app-theme-primary)">
            类别：
          </span>
          <Segmented
            size="small"
            value={catalog}
            options={catalogFilters}
            onChange={(value) => onCatalogChange(String(value))}
            className="text-[12px]! [&_.ant-segmented-item-label]:px-1!"
          />
        </div>
        <div className="flex flex-1 min-w-0 items-center gap-1 overflow-x-auto mx-4">
          <span className="shrink-0 text-[12px] text-(--app-theme-primary)">
            状态：
          </span>
          <Segmented
            size="small"
            value={status}
            options={statusFilters}
            onChange={(value) => onStatusChange(String(value))}
            className="text-[12px]! [&_.ant-segmented-item-label]:px-1!"
          />
        </div>
         {/* 自定义检索下拉框 */}
        {sortOptions.length > 0 ? (
          <Select
            size="small"
            allowClear
            placeholder="快捷筛选"
            loading={sortLoading}
            value={sortValue}
            options={sortOptions}
            onChange={(value) => onSortChange?.(value)}
            className="min-w-28 max-w-40 shrink-0 text-[12px]!"
          />
        ) : null}
        <div className="flex shrink-0 items-center gap-1">
          <Input
            prefix={<SearchOutlined />}
            allowClear
            size="small"
            placeholder="搜索医嘱"
            value={searchKeyword}
            onChange={(e) => onSearchKeywordChange(e.target.value)}
            className="w-full max-w-35 sm:w-35"
          />
          <Tooltip title="刷新">
            <Button
              type="text"
              size="small"
              icon={<ReloadOutlined />}
              loading={refreshLoading}
              aria-label="刷新"
              onClick={onRefresh}
            />
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

export default OrderListHeader;
