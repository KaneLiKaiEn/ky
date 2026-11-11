import { getAreaList, retrieveAreaList, retrieveDict2ItemList } from "@/api/sys";
import type { AreaRow } from "@/types/sys";

const areaRows = new Map<number, AreaRow[]>();
const pendingAreas = new Map<number, Promise<AreaRow[]>>();
let countries: string[] | undefined;
let pendingCountries: Promise<string[]> | undefined;

const abortError = () => new DOMException("地址加载已取消", "AbortError");

/** 取消当前消费者的等待，避免一个表单关闭时中断另一表单的共享请求。 */
const withSignal = <T>(
  promise: Promise<T>,
  signal?: AbortSignal,
): Promise<T> => {
  if (!signal) return promise;
  if (signal.aborted) return Promise.reject(abortError());
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(abortError());
    signal.addEventListener("abort", onAbort, { once: true });
    promise.then(resolve, reject).finally(() => {
      signal.removeEventListener("abort", onAbort);
    });
  });
};

/** parentId=0 读取省份；其他 ID 只在展开时获取下级。失败不缓存，可重试。 */
export const loadAreaChildren = (
  parentId = 0,
  signal?: AbortSignal,
): Promise<AreaRow[]> => {
  if (signal?.aborted) return Promise.reject(abortError());
  const cached = areaRows.get(parentId);
  if (cached) return withSignal(Promise.resolve(cached), signal);

  let pending = pendingAreas.get(parentId);
  if (!pending) {
    const request =
      parentId === 0
        ? retrieveAreaList({
            area_level: 1,
            retrieve_input: "*",
            retrieve_limit: 0,
          })
        : getAreaList({ parent_id: parentId });
    pending = request
      .then((res) => {
        const rows = (res.row_list ?? []).flatMap((row): AreaRow[] => {
          const areaId = Number(row.area_id);
          if (!Number.isSafeInteger(areaId) || areaId <= 0) return [];
          const parentId = Number(row.parent_id);
          return [
            {
              ...row,
              area_id: areaId,
              ...(Number.isSafeInteger(parentId) && parentId >= 0
                ? { parent_id: parentId }
                : {}),
            },
          ];
        });
        areaRows.set(parentId, rows);
        return rows;
      })
      .finally(() => pendingAreas.delete(parentId));
    pendingAreas.set(parentId, pending);
  }
  return withSignal(pending, signal);
};

export const loadCountryNames = (signal?: AbortSignal): Promise<string[]> => {
  if (signal?.aborted) return Promise.reject(abortError());
  if (countries) return withSignal(Promise.resolve(countries), signal);
  pendingCountries ??= retrieveDict2ItemList({
    dict_code: "GB/T 2659-2000",
    retrieve_input: "*",
    retrieve_limit: 0,
  })
    .then((res) => {
      countries = [
        ...new Set([
          "中国",
          ...(res.row_list ?? [])
            .map((row) => row.item_name?.trim())
            .filter((name): name is string => Boolean(name)),
        ]),
      ];
      return countries;
    })
    .finally(() => {
      pendingCountries = undefined;
    });
  return withSignal(pendingCountries, signal);
};
