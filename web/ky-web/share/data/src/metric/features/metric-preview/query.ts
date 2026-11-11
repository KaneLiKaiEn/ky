import { dateBounds, defaultDate } from "./dates";
import type { Service } from "./service";
export async function loadQueryDefaults(
  service: Service,
  userId: number,
  signal: AbortSignal,
) {
  const defaults = await service.defaults({ user_id: userId }, signal);
  const roots = await service.units({ unit_level: -1 }, signal);
  const date = defaults.date_name || defaultDate(defaults.date_type);
  dateBounds(date);
  return {
    defaults: { ...defaults, date_name: date },
    roots: roots.row_list ?? [],
  };
}
