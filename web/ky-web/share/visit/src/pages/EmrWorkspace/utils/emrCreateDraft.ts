import { message } from "antd";
import { getPrefabValueList } from "@/api/form";
import type { EmrCreateSelection, FormElemValue } from "../types";
import { toFormValues } from "./emrFormat";

/** 弹窗确认后交给 EmrContent 的本地草稿 */
export type EmrCreateDraft = {
  key: number;
  form_id: number;
  form_version?: number;
  form_values?: FormElemValue[];
  emr_title?: string;
  doc_type?: string;
  doc_name?: string;
};

/**
 * 将文档/表单/模板选择结果转为 EmrContent 草稿。
 * 选了模板时会拉取模板值；创建病历仍由 EmrContent 内部负责。
 */
export const buildEmrCreateDraft = async (
  selection: EmrCreateSelection,
): Promise<EmrCreateDraft | null> => {
  const formId = selection.form?.form_id ?? selection.prefab?.form_id;
  if (formId == null) {
    message.warning("请选择表单");
    return null;
  }

  let formValues: FormElemValue[] | undefined;
  if (selection.prefab?.prefab_id != null) {
    const prefabRes = await getPrefabValueList({
      prefab_id: selection.prefab.prefab_id,
    });
    if (prefabRes.code !== 0) {
      message.error(prefabRes.message || "获取模板数据失败");
      return null;
    }
    formValues = toFormValues(prefabRes.value_list ?? []);
  }

  return {
    key: Date.now(),
    form_id: formId,
    form_version: selection.form?.form_version,
    form_values: formValues,
    emr_title: selection.docName,
    doc_type: selection.docType,
    doc_name: selection.docName,
  };
};
