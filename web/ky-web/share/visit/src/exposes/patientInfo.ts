import { preloadRemotes } from "../preloadRemotes";

await preloadRemotes();
const mod = await import("../pages/PatientInfo/index");

export default mod.default;
export const PatientInfo = mod.PatientInfo;
export const PatientInfoModal = mod.PatientInfoModal;
export const VisitSelectModal = mod.VisitSelectModal;
export const DictSelect = mod.DictSelect;
export const AreaSelects = mod.AreaSelects;
export const AddressFields = mod.AddressFields;
export type * from "../pages/PatientInfo/index";
