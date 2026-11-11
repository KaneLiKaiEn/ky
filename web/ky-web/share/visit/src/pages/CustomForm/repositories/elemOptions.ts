import { getElemOptionList, getElemOptionSubList } from "@/api/elem";
import type { ElemOptionRow, ElemOptionSubRow } from "@/types/elem";

// 共享进行中的请求和成功结果，避免多行表格重复加载同一元素。
const optionListCache = new Map<number, Promise<ElemOptionRow[]>>();
const optionSubListCache = new Map<string, Promise<ElemOptionSubRow[]>>();

/** 表单配置刷新时可主动失效；进行中的调用仍返回各自结果。 */
export const invalidateElemOptions = (elem_id?: number): void => {
  if (elem_id === undefined) {
    optionListCache.clear();
    optionSubListCache.clear();
    return;
  }
  optionListCache.delete(elem_id);
  const prefix = `${elem_id}|`;
  for (const key of optionSubListCache.keys()) {
    if (key.startsWith(prefix)) optionSubListCache.delete(key);
  }
};

export const loadElemOptions = (elem_id: number): Promise<ElemOptionRow[]> => {
  const cached = optionListCache.get(elem_id);
  if (cached) return cached;
  const promise: Promise<ElemOptionRow[]> = getElemOptionList({ elem_id, expand_item: true })
    .then((res) => {
      if (res.code !== 0) throw new Error(res.message || "加载选项失败");
      return res.row_list ?? [];
    })
    .catch((error) => {
      // 已失效的旧请求不能删除后来创建的新请求。
      if (optionListCache.get(elem_id) === promise) optionListCache.delete(elem_id);
      throw error;
    });
  optionListCache.set(elem_id, promise);
  return promise;
};

export const loadElemOptionSubList = (
  elem_id: number,
  option_code: string,
): Promise<ElemOptionSubRow[]> => {
  const key = `${elem_id}|${option_code}`;
  const cached = optionSubListCache.get(key);
  if (cached) return cached;
  const promise: Promise<ElemOptionSubRow[]> = getElemOptionSubList({ elem_id, option_code })
    .then((res) => {
      if (res.code !== 0) throw new Error(res.message || "加载子选项失败");
      return res.row_list ?? [];
    })
    .catch((error) => {
      if (optionSubListCache.get(key) === promise) optionSubListCache.delete(key);
      throw error;
    });
  optionSubListCache.set(key, promise);
  return promise;
};
