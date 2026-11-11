import { useEffect, useState } from "react";
import { retrieveDict2ItemList } from "@/api/sys";
import type { Dict2ItemRow } from "@/types/sys";
import {
  type ActionTypeOptionsMap,
  ACTION_TYPE_DICT_NAME,
  EMPTY_ACTION_TYPE_OPTIONS,
  STEP_WORK_TYPE_GROUPS,
  type StepWorkType,
} from "./constants";
import { hasBracketTag } from "./utils";

export function buildActionTypeOptions(
  rowList: Dict2ItemRow[],
): ActionTypeOptionsMap {
  const result: ActionTypeOptionsMap = { ...EMPTY_ACTION_TYPE_OPTIONS };

  const sorted = [...rowList].sort((a, b) =>
    String(a.sort_no ?? "").localeCompare(String(b.sort_no ?? ""), "zh", {
      numeric: true,
    }),
  );

  for (const item of sorted) {
    const name = item.item_name?.trim();
    if (!name) continue;
    const option = { label: name, value: name };
    for (const { value: workType } of STEP_WORK_TYPE_GROUPS) {
      if (hasBracketTag(item.item_tag, workType)) {
        result[workType as StepWorkType].push(option);
      }
    }
  }

  return result;
}

export function useActionTypeOptions(enabled = true) {
  const [actionTypeOptions, setActionTypeOptions] =
    useState<ActionTypeOptionsMap>(EMPTY_ACTION_TYPE_OPTIONS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const res = await retrieveDict2ItemList({
          dict_code: ACTION_TYPE_DICT_NAME,
        });
        if (cancelled) return;
        if (res.code === 0) {
          setActionTypeOptions(buildActionTypeOptions(res.row_list ?? []));
        } else {
          setActionTypeOptions(EMPTY_ACTION_TYPE_OPTIONS);
        }
      } catch {
        if (!cancelled) setActionTypeOptions(EMPTY_ACTION_TYPE_OPTIONS);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { actionTypeOptions, loading };
}
