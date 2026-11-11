const BRACKET_TAG_RE = /\[([^\]]+)\]/g;

export const parseElemTags = (
  elem_tag: string | null | undefined,
): Set<string> => {
  const tags = new Set<string>();
  if (!elem_tag) return tags;
  for (const match of elem_tag.matchAll(BRACKET_TAG_RE)) {
    const inner = match[1]?.trim();
    if (inner) tags.add(inner);
  }
  return tags;
};

/** 子串匹配，保持现有 [多选]/[单选] 等控件路由语义 */
export const hasTag = (
  elem_tag: string | null | undefined,
  tag: string,
): boolean => (elem_tag ?? "").includes(tag);

/** 按括号内容精确匹配，避免 [触发事件] 误匹配 [触发事件结果渲染] */
export const hasExactElemTag = (
  elem_tag: string | null | undefined,
  inner: string,
): boolean => parseElemTags(elem_tag).has(inner);

export interface ElemTagBehavior {
  isRequired: boolean;
  isMustSelect: boolean;
  isReadOnly: boolean;
  isMultiCheckboxVertical: boolean;
  isRadioCancelable: boolean;
  isMultiLine: boolean;
  isPiece: boolean;
  isReference: boolean;
  isEventTrigger: boolean;
  isEventTriggerResultRender: boolean;
}

export const computeElemTagBehavior = (
  elem_tag: string | null | undefined,
): ElemTagBehavior => {
  const exact = parseElemTags(elem_tag);
  return {
    isRequired: hasTag(elem_tag, "[必填]"),
    isMustSelect:
      hasTag(elem_tag, "[必选]") || hasTag(elem_tag, "[单选选项换行展示]"),
    isReadOnly: hasTag(elem_tag, "[只读]"),
    isMultiCheckboxVertical: hasTag(elem_tag, "[多选选项换行展示]"),
    isRadioCancelable: hasTag(elem_tag, "[单选选项可取消]"),
    isMultiLine: hasTag(elem_tag, "[多行]"),
    isPiece: hasTag(elem_tag, "[片段]"),
    isReference: hasTag(elem_tag, "[引用]"),
    isEventTrigger: exact.has("触发事件"),
    isEventTriggerResultRender: exact.has("触发事件结果渲染"),
  };
};

/** 文本类输入防抖；选择 / 日期 / 勾选立即触发 */
export const shouldDebounceElemEvent = (
  value_type: string | null | undefined,
  elem_tag: string | null | undefined,
): boolean => {
  const valueType = value_type ?? "";
  if (
    valueType === "DATE" ||
    valueType === "DATETIME" ||
    valueType === "TIME" ||
    valueType === "BOOL" ||
    valueType === "BOOL_NOTE" ||
    valueType === "BOOL0_NOTE" ||
    valueType === "BOOL1_NOTE" ||
    valueType === "ADDRESS3" ||
    valueType === "ADDRESS4"
  ) {
    return false;
  }
  if (
    hasTag(elem_tag, "[单选]") ||
    hasTag(elem_tag, "[多选]") ||
    hasTag(elem_tag, "[多级下拉]")
  ) {
    return false;
  }
  return true;
};

export const getSectionDomId = (section_id: number): string =>
  `app-builderclient-section-${section_id}`;
