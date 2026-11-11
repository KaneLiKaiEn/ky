import { useCallback, useEffect, useMemo, useState } from "react";
import { App } from "antd";
import { deleteDict2Item, retrieveDict2ItemList } from "@/api/sys";
import type { Dict2ItemRow } from "@/types/sys";
import { filterValidRows, matchKeyword } from "../utils";

/** 字典项列表：加载、删除与本地搜索 */
export function useDictItemList(dictId?: number) {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<Dict2ItemRow[]>([]);
  const [keyword, setKeyword] = useState("");

  const refresh = useCallback(async () => {
    if (dictId == null) {
      setList([]);
      return;
    }
    setLoading(true);
    try {
      const res = await retrieveDict2ItemList({ dict_id: dictId });
      setList(filterValidRows(res.row_list));
    } catch {
      message.error("获取字典项失败");
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [dictId, message]);

  useEffect(() => {
    setKeyword("");
    refresh();
  }, [refresh]);

  const remove = useCallback(
    async (record: Dict2ItemRow) => {
      if (record.row_id == null) return;
      setLoading(true);
      try {
        await deleteDict2Item({ row_id: record.row_id });
        message.success("删除成功");
        await refresh();
      } catch {
        setLoading(false);
      }
    },
    [message, refresh],
  );

  const filtered = useMemo(
    () =>
      list.filter((row) => matchKeyword(keyword, row.item_name, row.item_code)),
    [keyword, list],
  );

  return { loading, list, filtered, keyword, setKeyword, refresh, remove };
}
