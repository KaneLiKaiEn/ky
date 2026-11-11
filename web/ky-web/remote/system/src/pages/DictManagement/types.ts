export type SourceKind = "elem" | "drug" | "lab" | "exam" | "treat" | "bill";

export interface SourceItemFill {
  item_id?: number;
  item_name?: string;
  item_code?: string;
  item_no?: string;
  item_unit?: string;
  item_value?: string;
  item_tag?: string;
  item_note?: string;
  sort_no?: string;
}

export interface SourceItemOption {
  value: string;
  label: string;
  item_name?: string;
  item_code?: string;
  fill: SourceItemFill;
}
