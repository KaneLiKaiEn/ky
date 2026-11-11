import { useCallback, useEffect, useMemo, useState } from "react";
import { App } from "antd";
import { deleteDict2, retrieveDict2List } from "@/api/sys";
import type { Dict2Row } from "@/types/sys";
import { filterValidRows, matchKeyword } from "../utils";

/** 字典列表：加载、删除、选中项与本地搜索 */
export function useDictList(orgId?: number) {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<Dict2Row[]>([]);
  const [selected, setSelected] = useState<Dict2Row | null>(null);
  const [keyword, setKeyword] = useState("");

  const refresh = useCallback(async () => {
    if (orgId == null) {
      setList([]);
      return;
    }
    setLoading(true);
    try {
      const res = await retrieveDict2List({ org_id: orgId });
      setList(filterValidRows(res.row_list));
    } catch {
      message.error("获取字典列表失败");
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [message, orgId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // 切换机构时清空选中与搜索
  useEffect(() => {
    setSelected(null);
    setKeyword("");
  }, [orgId]);

  // 列表刷新后同步选中项最新数据，不存在则取消选中
  useEffect(() => {
    setSelected((current) => {
      if (current?.dict_id == null) return current;
      return list.find((row) => row.dict_id === current.dict_id) ?? null;
    });
  }, [list]);

  const remove = useCallback(
    async (record: Dict2Row) => {
      if (record.dict_id == null) return;
      setLoading(true);
      try {
        await deleteDict2({ dict_id: record.dict_id });
        message.success("删除成功");
        setSelected((current) =>
          current?.dict_id === record.dict_id ? null : current,
        );
        await refresh();
      } catch {
        setLoading(false);
      }
    },
    [message, refresh],
  );

  const filtered = useMemo(
    () =>
      list.filter((row) => matchKeyword(keyword, row.dict_name, row.dict_code)),
    [keyword, list],
  );

  return {
    loading,
    list,
    filtered,
    selected,
    setSelected,
    keyword,
    setKeyword,
    refresh,
    remove,
  };
}
