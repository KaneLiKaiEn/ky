import { useMemo, type ReactNode } from "react";
import { Button, Select } from "antd";
import type { UnitRow } from "../../../types/factor.d.ts";
import {
  UnitSelect,
  DateFields,
  type UnitSource,
} from "../../query-controls/index";
import { usePreview } from "../context";
import { useRead } from "../hooks/useRead";

export default function QueryBar({
  roots,
  title,
  actions,
  showEntities = true,
}: {
  roots: UnitRow[];
  title?: ReactNode;
  actions?: ReactNode;
  showEntities?: boolean;
}) {
  const { service, query, setQuery, dynamic, busy } = usePreview();
  const source = useMemo<UnitSource>(
    () => ({
      roots: async (signal) =>
        (await service.units({ unit_level: -1 }, signal)).row_list ?? [],
      children: async (parentId, signal) =>
        (await service.childUnits({ parent_id: parentId }, signal)).row_list ??
        [],
      search: async (keyword, signal) =>
        (await service.searchUnits({ retrieve_input: keyword }, signal))
          .row_list ?? [],
      detail: async (id, signal) =>
        (await service.unit({ unit_id: id }, signal)).unit_property,
    }),
    [service],
  );
  const entities = useRead(
    showEntities ? `entities:${query.unitId}` : null,
    (signal) => service.entities({ unit_id: query.unitId }, signal),
  );
  return (
    <div
      className={`mp-query-bar ${title !== undefined || actions ? "mp-query-heading" : ""}`}
    >
      <div
        className="mp-query-fields"
        style={
          title === undefined && !actions ? { display: "contents" } : undefined
        }
      >
        <UnitSelect
          roots={roots}
          source={source}
          value={query.unitId}
          valueName={query.unitName}
          disabled={busy}
          onChange={(id, row) => {
            if (id)
              setQuery({
                ...query,
                unitId: id,
                unitName: row?.unit_name || "",
                entityId: undefined,
              });
          }}
        />
        {!dynamic && (
          <DateFields
            value={query.date}
            disabled={busy}
            onChange={(date) => setQuery({ ...query, date })}
          />
        )}
        {showEntities &&
          !!entities.data?.row_list?.length &&
          entities.data.row_list.length > 1 && (
            <Select
              aria-label="查询实体"
              disabled={busy}
              style={{ width: 160 }}
              value={query.entityId ?? 0}
              options={[
                { value: 0, label: "全部" },
                ...entities.data.row_list.map((row) => ({
                  value: row.entity_id!,
                  label: row.entity_name || `实体 ${row.entity_id}`,
                })),
              ]}
              onChange={(id) =>
                setQuery({ ...query, entityId: id || undefined })
              }
            />
          )}
        {entities.error && (
          <Button danger onClick={() => void entities.reload().catch(() => {})}>
            重试读取实体
          </Button>
        )}
      </div>
      {title !== undefined && <div className="mp-query-title">{title}</div>}
      {actions && <div className="mp-query-actions">{actions}</div>}
    </div>
  );
}
