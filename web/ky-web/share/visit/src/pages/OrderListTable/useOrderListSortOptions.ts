import { useEffect, useState } from "react";
import { retrieveDict2ItemList } from "@/api/sys";
import type { Dict2ItemRow } from "@/types/sys";
import { sortDict2Items } from "../InPatientList/inpatientListSort";
import {
  getOrderListSortSelectValue,
  ORDER_LIST_SORT_DICT_CODE,
} from "./orderListSortFilter";

export interface OrderListSortOption {
  label: string;
  value: string;
  item: Dict2ItemRow;
}

export function useOrderListSortOptions(enabled = true) {
  const [options, setOptions] = useState<OrderListSortOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const res = await retrieveDict2ItemList({
          dict_code: ORDER_LIST_SORT_DICT_CODE,
        });
        if (cancelled) return;
        if (res.code !== 0) {
          setOptions([]);
          return;
        }
        const items = sortDict2Items(res.row_list ?? []);
        setOptions(
          items
            .map((item) => {
              const label = item.item_name?.trim();
              if (!label) return null;
              return {
                label,
                value: getOrderListSortSelectValue(item),
                item,
              };
            })
            .filter((opt): opt is OrderListSortOption => opt != null),
        );
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
  }, [enabled]);

  return { options, loading };
}
