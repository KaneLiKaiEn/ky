import React, { useMemo, useState } from "react";
import { Button, Empty, Listy, Modal, Spin, Tooltip } from "antd";
import { PlusCircleOutlined, ReloadOutlined } from "@ant-design/icons";
import type { VitalSignItem } from "@/types/care";
import FavoriteSettingCard from "./components/FavoriteSettingCard";
import VitalSignLineChart from "./components/VitalSignLineChart";
import { useFavoriteObserve } from "./useFavoriteObserve";
import {
  formatObserveTime,
  getVitalSignRowKey,
  isAbnormalValue,
} from "./utils/format";

export interface FavoriteVitalProps {
  visit_id?: number;
  baby_id?: number;
}

const ITEM_CLASS =
  "flex w-full cursor-pointer items-center gap-3 rounded-md border border-transparent px-2 py-2 transition-colors hover:border-(--app-theme-border) hover:bg-(--app-theme-bg-layout)";

const FavoriteVital: React.FC<FavoriteVitalProps> = ({
  visit_id,
  baby_id,
}) => {
  const visitId = Number(visit_id) || 0;
  const babyId = Number(baby_id) || 0;

  const {
    items,
    checkedItems,
    loading,
    saving,
    modalVisible,
    openModal,
    closeModal,
    toggleFavorite,
    updateDuration,
    updateUnit,
    saveFavorites,
    refresh,
  } = useFavoriteObserve({ visitId, babyId });

  const [refreshing, setRefreshing] = useState(false);
  const [chartItem, setChartItem] = useState<VitalSignItem | null>(null);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  };

  const listyItems = useMemo(() => checkedItems, [checkedItems]);

  if (visitId <= 0) {
    return (
      <div className="flex h-full items-center justify-center p-3 text-(--app-theme-text-secondary)">
        请先选择就诊患者
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden p-3">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-(--app-theme-border) pb-2">
        <span
          className="inline-flex cursor-default items-center gap-1 rounded-xl border px-2 py-1 text-xs font-medium whitespace-nowrap text-(--app-theme-primary)"
        >
          <span aria-hidden>❤️</span>
          <span>关注生命体征 {checkedItems.length} 项</span>
        </span>
        <div className="ml-auto flex items-center gap-1">
          <Tooltip title="管理关注项">
            <Button
              type="text"
              size="small"
              icon={<PlusCircleOutlined />}
              onClick={openModal}
            />
          </Tooltip>
          <Tooltip title="刷新">
            <Button
              type="text"
              size="small"
              icon={<ReloadOutlined spin={refreshing || loading} />}
              onClick={() => void handleRefresh()}
            />
          </Tooltip>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <Spin spinning={loading || refreshing}>
          {listyItems.length > 0 ? (
            <Listy<VitalSignItem>
              items={listyItems}
              rowKey={getVitalSignRowKey}
              styles={{ item: { padding: 0 } }}
              itemRender={(item) => {
                const abnormal = isAbnormalValue(
                  item.observe_value,
                  item.value_min,
                  item.value_max,
                );
                return (
                  <div
                    className={`vital-item ${ITEM_CLASS}`}
                    onClick={() => setChartItem(item)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setChartItem(item);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <div className="truncate text-(--app-theme-text-secondary)">
                        {item.elem_name ?? "-"}
                      </div>
                      <div
                        className={`text-lg leading-tight font-semibold ${abnormal ? "text-red-500" : "text-(--app-theme-text)"
                          }`}
                      >
                        {item.observe_value ?? "-"}
                        {item.elem_unit ? (
                          <span className="ml-1 text-xs font-normal text-(--app-theme-text-secondary)">
                            {item.elem_unit}
                          </span>
                        ) : null}
                      </div>
                      <div className="text-xs text-(--app-theme-text-secondary)">
                        {formatObserveTime(item.observe_time)}
                      </div>
                    </div>
                    <div className="min-w-30 shrink-0 self-center">
                      <VitalSignLineChart
                        data={item.observeList ?? []}
                      />
                    </div>
                  </div>
                );
              }}
            />
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="暂无关注的生命体征"
            >
              <Button size="small" icon={<PlusCircleOutlined />} onClick={openModal}>
                添加关注
              </Button>
            </Empty>
          )}
        </Spin>
      </div>

      <Modal
        title="关注生命体征"
        open={modalVisible}
        onOk={() => void saveFavorites()}
        onCancel={closeModal}
        okText="保存"
        cancelText="取消"
        width={760}
        confirmLoading={saving}
        destroyOnHidden
      >
        <Spin spinning={loading && items.length === 0}>
          {items.length > 0 ? (
            <div className="flex max-h-[62vh] flex-col gap-3">
              <div className="flex shrink-0 items-center justify-between text-xs text-(--app-theme-text-secondary)">
                <span>点击卡片即可添加或取消关注，已选项可配置趋势图时长</span>
                <span className="shrink-0 font-medium text-red-500">
                  已关注 {items.filter((item) => item.tempChecked).length} /{" "}
                  {items.length}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3">
                {items.map((item) => (
                  <FavoriteSettingCard
                    key={item.elem_id ?? item.elem_name}
                    item={item}
                    onToggle={toggleFavorite}
                    onUpdateDuration={updateDuration}
                    onUpdateUnit={updateUnit}
                  />
                ))}
              </div>
            </div>
          ) : (
            <Empty description="暂无可选的生命体征" />
          )}
        </Spin>
      </Modal>

      <Modal
        title={`生命体征趋势 - ${chartItem?.elem_name ?? ""}`}
        open={chartItem != null}
        onCancel={() => setChartItem(null)}
        onOk={() => setChartItem(null)}
        okText="关闭"
        cancelText="取消"
        width={960}
        destroyOnHidden
      >
        {chartItem ? (
          <div className="h-80 w-full">
            <VitalSignLineChart
              key={getVitalSignRowKey(chartItem)}
              data={chartItem.observeList ?? []}
              minHeight={320}
            />
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default FavoriteVital;
