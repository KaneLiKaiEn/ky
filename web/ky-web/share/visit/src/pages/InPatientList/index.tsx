export { default } from "./InpatientList";

export type { InPatientListProps, ListMode, ListScope } from "./type";
export {
  fetchDischargeList,
  fetchDischargeSearchList,
  fetchInPatientList,
  fetchTransferDeptList,
} from "./fetch";
export interface InPatientListRef {
  load: () => Promise<void>;
}
