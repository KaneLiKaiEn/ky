import { useEffect, useState } from "react";
import { retrieveDict2ItemList } from "@/api/sys";
import type { Dict2ItemRow } from "@/types/sys";

export interface DictOption {
  label: string;
  value: string;
}

function toOptions(rowList: Dict2ItemRow[]): DictOption[] {
  const sorted = [...rowList].sort((a, b) =>
    String(a.sort_no ?? "").localeCompare(String(b.sort_no ?? ""), "zh", {
      numeric: true,
    }),
  );
  const result: DictOption[] = [];
  const seen = new Set<string>();
  for (const item of sorted) {
    const name = item.item_name?.trim();
    if (!name || seen.has(name)) continue;
    seen.add(name);
    result.push({ label: name, value: name });
  }
  return result;
}

export function useDictOptions(dictCode: string, enabled = true) {
  const [options, setOptions] = useState<DictOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !dictCode) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const res = await retrieveDict2ItemList({ dict_code: dictCode });
        if (cancelled) return;
        setOptions(res.code === 0 ? toOptions(res.row_list ?? []) : []);
      } catch {
        if (!cancelled) setOptions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [dictCode, enabled]);

  return { options, loading };
}
