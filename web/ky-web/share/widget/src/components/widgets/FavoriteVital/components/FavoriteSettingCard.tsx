import { HeartFilled, HeartOutlined } from "@ant-design/icons";
import { InputNumber, Select } from "antd";
import type { VitalSignItem } from "@/types/care";
import { formatObserveTime } from "../utils/format";

interface FavoriteSettingCardProps {
  item: VitalSignItem;
  onToggle: (elemId: number, tempChecked: boolean) => void;
  onUpdateDuration: (elemId: number, duration: number | null) => void;
  onUpdateUnit: (elemId: number, unit: string) => void;
}

const FavoriteSettingCard: React.FC<FavoriteSettingCardProps> = ({
  item,
  onToggle,
  onUpdateDuration,
  onUpdateUnit,
}) => {
  const isChecked = item.tempChecked;
  const elemId = item.elem_id ?? 0;

  const handleToggle = () => onToggle(elemId, !isChecked);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={isChecked}
      className={`group flex flex-col rounded-xl border-2 p-2 transition-all duration-200 ${
        isChecked
          ? "cursor-pointer border-red-400 shadow-sm"
          : "cursor-pointer border-(--app-theme-border) hover:shadow-sm"
      }`}
      onClick={handleToggle}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleToggle();
        }
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-(--app-theme-text)">
            {item.elem_name ?? "-"}
          </div>
        </div>
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${
            isChecked
              ? "bg-red-100 text-red-500"
              : "bg-(--app-theme-bg-layout) text-(--app-theme-text-secondary) group-hover:bg-red-50 group-hover:text-red-400"
          }`}
        >
          {isChecked ? (
            <HeartFilled className="text-base" />
          ) : (
            <HeartOutlined className="text-base" />
          )}
        </div>
      </div>

      <div className="my-2 flex items-center justify-between gap-2">
        {item.observe_value ? (
          <span className="truncate text-(--app-theme-text-secondary)">
            最新 {item.observe_value}
            {item.elem_unit ? item.elem_unit : ""}
          </span>
        ) : null}
      </div>

      {isChecked ? (
        <div
          className="text-xs mt-auto border-t pt-2"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mb-2 text-(--app-theme-text-secondary)">
            趋势图时长
            {item.observe_time ? (
              <span className="ml-2 opacity-60">
                最近观测 {formatObserveTime(item.observe_time)}
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <InputNumber
              min={1}
              size="small"
              className="w-16!"
              value={item.favorite_duration ?? 24}
              onChange={(val) => onUpdateDuration(elemId, val ?? 24)}
            />
            <Select
              size="small"
              className="min-w-18! flex-1"
              value={item.favorite_unit ?? "HOUR"}
              onChange={(val) => onUpdateUnit(elemId, val)}
              options={[
                { label: "小时", value: "HOUR" },
                { label: "天", value: "DAY" },
              ]}
            />
          </div>
        </div>
      ) : (
        <div className="mt-auto pt-2 text-(--app-theme-text-secondary) opacity-70">
          点击卡片添加关注
        </div>
      )}
    </div>
  );
};

export default FavoriteSettingCard;
