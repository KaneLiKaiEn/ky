import EmrListLayout from "./components/EmrListLayout";
import EmrRadioLayout from "./components/EmrRadioLayout";
import EmrSingleLayout from "./components/EmrSingleLayout";
import type { EmrWorkspaceProps } from "./types";

export type {
  AutoCreateForm,
  EmrAssessmentSidePanel,
  EmrCreateModalConfig,
  EmrCreateSelection,
  EmrDocNameOption,
  EmrWorkType,
  EmrLinkFields,
  EmrListFilter,
  EmrListUiOptions,
  EmrListWorkspaceProps,
  EmrProgressNotePrint,
  EmrRadioWorkspaceProps,
  EmrSingleWorkspaceProps,
  EmrWorkspaceProps,
  EmrWorkspaceVisitContext,
  FormElemValue,
} from "./types";

export type { EmrCreateDraft } from "./utils/emrCreateDraft";
export { buildEmrCreateDraft } from "./utils/emrCreateDraft";
export {
  formatCreateTime,
  isCommitted,
  toFormValues,
} from "./utils/emrFormat";
export { useEmrCreateFlow } from "./hooks/useEmrCreateFlow";
export {
  useEmrDocument,
  type UseEmrDocumentOptions,
} from "./hooks/useEmrDocument";

export { default as EmrCreateModal } from "./components/EmrCreateModal";
export { default as EmrEmptyCreate } from "./components/EmrEmptyCreate";
export { default as EmrListLayout } from "./components/EmrListLayout";
export { default as EmrRadioLayout } from "./components/EmrRadioLayout";
export { default as EmrSingleLayout } from "./components/EmrSingleLayout";
export { default as EmrContentArea } from "./components/EmrContentArea";
export { default as PrintToolbar } from "./components/PrintToolbar";

/**
 * 病历工作台：list / radio / single 布局 + 创建弹窗 + 草稿 + EmrContent。
 * 宿主传入 visit 上下文与 listFilter，不依赖各站 store。
 */
const EmrWorkspace = (props: EmrWorkspaceProps) => {
  switch (props.mode) {
    case "list":
      return <EmrListLayout {...props} />;
    case "radio":
      return <EmrRadioLayout {...props} />;
    case "single":
      return <EmrSingleLayout {...props} />;
    default:
      return null;
  }
};

export default EmrWorkspace;
