/** 编辑中的字段值；空值保持字符串，提交时由表单转换。 */
export interface FieldValue {
  value_text: string;
  value_code?: string;
  value_note?: string;
}

export type FieldValuePatch = Partial<FieldValue>;
