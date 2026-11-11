import type { EntityRow, GroupRow } from "../../types/factor.d.ts";
import type { MetricValue } from "../../types/metric.d.ts";
import type { Filters, ValueRow } from "./types";

export function groupEntities(groups: GroupRow[], entities: EntityRow[]) {
  return groups.map((group, index) => {
    const entity = entities.find(
      (entity) =>
        entity.entity_no === group.group_no &&
        (!group.group_code || entity.entity_code === group.group_code),
    );
    return {
      key: `group:${group.group_no}:${group.group_code}:${index}`,
      entity_id: entity?.entity_id,
      entity_name: group.group_name || entity?.entity_name,
      group_no: group.group_no,
      group_code: group.group_code,
    };
  });
}
export function mergeEntities(
  entities: {
    key: string;
    entity_id?: number;
    entity_name?: string;
    group_no?: number;
    group_code?: string;
  }[],
  values: MetricValue[],
  filters: Filters,
  group = false,
): ValueRow[] {
  const mapped = values.flatMap((value, index) => {
    const entity = entities.find(
      (entity) => entity.entity_id === value.object_id,
    );
    return entity
      ? [
          {
            ...value,
            ...entity,
            key: entity.key,
            object_name: entity.entity_name || value.object_name,
            kind: group ? ("group" as const) : ("entity" as const),
            children: group ? [] : undefined,
          },
        ]
      : [];
  });
  const includeMissing =
    filters.showNull && !filters.top && !filters.finish && !filters.yoy;
  return includeMissing
    ? [
        ...mapped,
        ...entities
          .filter(
            (entity) =>
              !values.some((value) => value.object_id === entity.entity_id),
          )
          .map((entity) => ({
            ...entity,
            object_id: entity.entity_id,
            object_name: entity.entity_name,
            kind: group ? ("group" as const) : ("entity" as const),
            children: group ? [] : undefined,
          })),
      ]
    : mapped;
}
