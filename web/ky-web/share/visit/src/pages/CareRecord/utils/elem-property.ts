import { message } from "antd";
import { getElemPropertyAPI } from "../api";

export interface ElemPropertySnapshot {
  elem_id?: number;
  elem_code?: string;
  elem_name?: string;
  value_min?: string;
  value_max?: string;
}

const cache = new Map<string, ElemPropertySnapshot>();
const inflight = new Map<string, Promise<ElemPropertySnapshot | null>>();

export function getCachedElemProperty(elemName: string) {
  return cache.get(elemName);
}

/** 按元素名取字典。同一名称只请求一次，进行中的请求会复用。 */
export function loadElemProperty(elemName: string) {
  const cached = cache.get(elemName);
  if (cached) return Promise.resolve(cached);

  const pending = inflight.get(elemName);
  if (pending) return pending;

  const task = getElemPropertyAPI({ elem_name: elemName })
    .then((res: any) => {
      if (res?.code === 0 && res?.elem_property) {
        cache.set(elemName, res.elem_property);
        return res.elem_property as ElemPropertySnapshot;
      }
      message.error(
        `${res?.message || "获取元素属性失败"}${res?.hint || ""}`,
      );
      return null;
    })
    .catch(() => {
      message.error("获取元素属性失败");
      return null;
    })
    .finally(() => {
      inflight.delete(elemName);
    });

  inflight.set(elemName, task);
  return task;
}
