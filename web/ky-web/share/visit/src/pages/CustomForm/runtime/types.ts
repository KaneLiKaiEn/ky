export interface ElemEventValuePatch {
  value_text?: string;
  value_code?: string;
  value_note?: string;
}

export interface ElemEventAdapter {
  elem_id: number;
  section_id: number;
  row_no?: number;
  isEventTrigger: boolean;
  getLatestVal: () => string;
  getValueCode: () => string;
  getScore: () => number;
  set: (patch: ElemEventValuePatch) => void;
  setRenderHtml: (html: string) => void;
}

export interface FireInputEventParams {
  elem_id: number;
  section_id?: number;
  value_text: string;
  value_code?: string | null;
  row_no?: number;
  debounce?: boolean;
}

export interface RunScriptTrigger {
  elemId?: number;
  sectionId?: number;
  rowNo?: number;
  valueCode?: string | null;
}

export const getAdapterKey = (elemId: number, rowNo?: number, sectionId?: number) =>
  `${sectionId ?? ""}:${elemId}:${rowNo ?? 0}`;
