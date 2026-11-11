import { dateBounds, defaultDate } from "./dates";
import { positiveId } from "./model";
import type { PreviewArgument, Query } from "./types";
import type { Service } from "./service";

function argument(
  args: PreviewArgument[],
  names: string[],
  types: string[] = [],
) {
  for (const name of names) {
    const row = args.find((item) => item.arg_code === name);
    if (row) return row.arg_value;
  }
  const rows = args.filter((row) => types.includes(row.arg_type));
  if (rows.length > 1)
    throw new Error(
      `无法确定指标参数：${rows.map((r) => r.arg_code).join("、")}`,
    );
  return rows[0]?.arg_value;
}
export function embeddedArguments(args: PreviewArgument[]) {
  const unit = argument(args, ["arg_unit", "unit_id"], ["UNIT"]);
  const entity = argument(args, ["arg_entity", "entity_id"]);
  const date =
    argument(args, ["arg_period", "arg_date", "date_name"], ["PERIOD"]) ??
    argument(args, [], ["DATE"]);
  const requiredId = (value: string | undefined, name: string) => {
    if (value === undefined) return undefined;
    const id = positiveId(value);
    if (!id) throw new Error(`${name}不能为空`);
    return id;
  };
  if (date !== undefined) dateBounds(date);
  return {
    unitId: requiredId(unit, "指标单元"),
    entityId: requiredId(entity, "指标实体"),
    date,
  };
}

/** Fill only missing values. Explicit invalid arguments must never become a default query. */
export async function embeddedQuery(
  service: Service,
  userId: number,
  args: PreviewArgument[],
  signal: AbortSignal,
): Promise<Query> {
  const selected = embeddedArguments(args);
  let { unitId, date } = selected;
  let unitName = "";
  if (!unitId || !date) {
    const defaults = await service.defaults({ user_id: userId }, signal);
    unitId ??= defaults.unit_id || undefined;
    unitName = defaults.unit_id === unitId ? defaults.unit_name || "" : "";
    date ??= defaults.date_name || defaultDate(defaults.date_type);
    if (!unitId) {
      const roots = await service.units({ unit_level: -1 }, signal);
      unitId = roots.row_list?.[0]?.unit_id;
      unitName = roots.row_list?.[0]?.unit_name || "";
    }
  }
  if (!unitId || !date)
    throw new Error("没有可查询的绩效单元，请配置指标默认参数");
  dateBounds(date);
  if (!unitName) {
    const unit = await service.unit({ unit_id: unitId }, signal);
    unitName = unit.unit_property?.unit_name || `单元 ${unitId}`;
  }
  return { unitId, unitName, date, entityId: selected.entityId };
}
