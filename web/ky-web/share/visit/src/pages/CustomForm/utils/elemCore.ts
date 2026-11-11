import { getEmrElemList } from "@/api/emr";
import { ElemCore, type ElemCoreOptions } from "../runtime/elemCore";

export type { ElemCoreAdapter, ExtraFormDocInfo } from "../runtime/elemCore";
export { ElemCore } from "../runtime/elemCore";

export const createElemCore = (options: Partial<ElemCoreOptions> = {}) => new ElemCore({
  loadValues: async (emrId) => (await getEmrElemList({ emr_id: emrId })).value_list ?? [],
  ...options,
});

/** Compatibility export. Form scripts use their own scoped instances. */
export const ELEM_CORE = createElemCore();
