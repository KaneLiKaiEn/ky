import type { UnitSource } from "../../../metric/features/query-controls/index";
import {
  getUnitList,
  getUnitList2,
  retrieveUnitList,
  getUnitProperty,
} from "../../api/factor";
import type { RequestRunner } from "./runtime";

export function createUnitSource(runner?: RequestRunner): UnitSource {
  const run = async <
    T extends { code?: number; message?: string; hint?: string },
  >(
    signal: AbortSignal,
    task: () => Promise<T>,
  ): Promise<T> => {
    const checked = () => {
      signal.throwIfAborted();
      return task();
    };
    const response = await (runner ? runner(signal, checked) : checked());
    signal.throwIfAborted();
    if (response.code !== 0)
      throw new Error(response.message || response.hint || "单元读取失败");
    return response;
  };
  return {
    roots: async (signal) =>
      (await run(signal, () => getUnitList({ unit_level: 1 }, signal)))
        .row_list ?? [],
    children: async (id, signal) =>
      (await run(signal, () => getUnitList2({ parent_id: id }, signal)))
        .row_list ?? [],
    search: async (keyword, signal) =>
      (
        await run(signal, () =>
          retrieveUnitList({ retrieve_input: keyword }, signal),
        )
      ).row_list ?? [],
    detail: async (id, signal) =>
      (await run(signal, () => getUnitProperty({ unit_id: id }, signal)))
        .unit_property,
  };
}
