import type { ReactNode } from "react";
import type { FormRow, PrefabRow } from "@/types/form";

/** 宿主传入的就诊上下文（公共组件不依赖各站 store） */
export type EmrWorkspaceVisitContext = {
  visitId?: number | null;
  patientId?: number | null;
  babyId?: number | null;
  encounterId?: number | null;
  patientGender?: string;
  patientAge?: number;
  patientAgeYear?: number;
};

export type EmrDocNameOption = {
  doc_name: string;
  label: string;
};

export type EmrListFilter = {
  doc_type?: string;
  doc_name?: string;
  doc_tag?: string;
  /** 关联业务（如手术 link_name="手术"、抢救、死亡等） */
  link_name?: string;
  link_value?: number;
};

export type EmrLinkFields = {
  link_name?: string;
  link_value?: number;
  link_data?: string;
  link_tag?: string;
  link_ext?: string;
};

/** 弹窗创建时的选择结果 */
export type EmrCreateSelection = {
  docType: string;
  docName: string;
  assessScore?: number;
  form?: FormRow;
  prefab?: PrefabRow;
};

export type EmrCreateModalConfig = {
  docType?: string;
  docName?: string;
  docTag?: string;
  onlyLink?: boolean;
  excludeLink?: boolean;
};

export type FormElemValue = {
  section_id: number;
  elem_id?: number;
  row_no?: number;
  value_time?: string;
  value_score?: number;
  value_text: string;
  value_code?: string;
  value_code_system?: string;
  value_tag?: string;
  value_note?: string;
};

export type AutoCreateForm = {
  doc_type: string;
  doc_name: string;
  doc_tag?: string;
  assess_total?: number;
};

export type EmrListUiOptions = {
  /** 默认 true：电子病历列表使用 Listy */
  useListy?: boolean;
  /** 默认 true */
  showAscendingToggle?: boolean;
  /** 默认 true */
  defaultAscending?: boolean;
  /** 默认 true：左侧「分组」复选框初始勾选状态 */
  groupByDocTypeAndName?: boolean;
  createButtonType?: "primary" | "link";
};

export type EmrAssessmentSidePanel = {
  docType?: string;
  workType?: string;
};

export type EmrProgressNotePrint = {
  buildPrintUrl: (ctx: {
    visitId: number;
    babyId?: number | null;
  }) => string;
  label?: string;
};

export type EmrWorkType = "DOCTOR" | "NURSE";

export type EmrListWorkspaceProps = {
  mode: "list";
  visit: EmrWorkspaceVisitContext;
  /** 创建弹窗按 work_type 过滤文档；默认 DOCTOR */
  workType?: EmrWorkType;
  listFilter: EmrListFilter;
  label: string;
  names?: EmrDocNameOption[];
  /** 「所有病历」：不按 doc_type 过滤，创建弹窗不锁 docType */
  allRecords?: boolean;
  /** doc_name 级别菜单：列表按 doc_name 过滤 */
  filterByDocName?: boolean;
  docType?: string;
  docName?: string;
  /** 病程记录：右侧堆叠展示全部 EmrContent */
  progressNote?: boolean;
  /** 患者评估：右侧展示 AssessmentTimeline */
  assessment?: EmrAssessmentSidePanel;
  createModal?: EmrCreateModalConfig;
  draftLink?: EmrLinkFields;
  /** 电子病历 list 创建弹窗 exclude_link 的 doc_type 集合 */
  excludeLinkDocTypes?: string[];
  /** 新建前校验，返回非空字符串则阻断并提示 */
  onBeforeCreate?: () => string | void;
  progressNotePrint?: EmrProgressNotePrint;
  listUi?: EmrListUiOptions;
  emptyVisitDescription?: string;
  className?: string;
  // 打印成功后的回调
  onPrinted?: (emrId: number) => void;
};

export type EmrRadioWorkspaceProps = {
  mode: "radio";
  visit: EmrWorkspaceVisitContext;
  workType?: EmrWorkType;
  listFilter: EmrListFilter;
  docType: string;
  names: EmrDocNameOption[];
  createModal?: EmrCreateModalConfig;
  draftLink?: EmrLinkFields;
  /** 切换菜单/业务时清草稿，传 path 或 id */
  resetKey?: string;
  showNoRecordHint?: boolean;
  emptyVisitDescription?: string;
  className?: string;
  onPrinted?: (emrId: number) => void;
};

export type EmrSingleWorkspaceProps = {
  mode: "single";
  visit: EmrWorkspaceVisitContext;
  workType?: EmrWorkType;
  listFilter: EmrListFilter;
  docType: string;
  docName: string;
  createModal?: EmrCreateModalConfig;
  draftLink?: EmrLinkFields;
  showNoRecordHint?: boolean;
  /** 阻断渲染内容，展示 guard（如抢救未保存） */
  guard?: ReactNode;
  emptyVisitDescription?: string;
  className?: string;
  onPrinted?: (emrId: number) => void;
};

export type EmrWorkspaceProps =
  | EmrListWorkspaceProps
  | EmrRadioWorkspaceProps
  | EmrSingleWorkspaceProps;

export const PROGRESS_NOTE_DOC_TYPE = "病程记录";
 
