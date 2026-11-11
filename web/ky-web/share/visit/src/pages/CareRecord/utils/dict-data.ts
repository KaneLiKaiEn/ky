import { retrieveDict2ItemList } from "../api";

const cache = new Map<string, any[]>();
const inflight = new Map<string, Promise<any[] | null>>();

function sameDictList(current: { item_name?: string }[], cached: any[]) {
  if (current.length !== cached.length) return false;
  return current.every(
    (item, index) => item?.item_name === cached[index]?.item_name,
  );
}

function loadDictData(dictName: string) {
  const cached = cache.get(dictName);
  if (cached) return Promise.resolve(cached);

  const pending = inflight.get(dictName);
  if (pending) return pending;

  const task = retrieveDict2ItemList({
    dict_code: dictName,
    retrieve_input: "*",
  })
    .then((res: any) => {
      if (res?.code !== 0) return null;
      const rows = Array.isArray(res.row_list) ? res.row_list : [];
      cache.set(dictName, rows);
      return rows;
    })
    .catch(() => null)
    .finally(() => {
      inflight.delete(dictName);
    });

  inflight.set(dictName, task);
  return task;
}

/** 聚焦下拉框时加载字典。已缓存的名称不再请求。 */
export function ensureDictData(
  dictName: string,
  current: { item_name?: string }[],
  setter: (rows: any[]) => void,
) {
  const cached = cache.get(dictName);
  if (cached) {
    if (cached.length > 0 && !sameDictList(current, cached)) setter(cached);
    return;
  }
  void loadDictData(dictName).then((rows) => {
    if (rows && rows.length > 0) setter(rows);
  });
}
