import { request } from "comm/request";
import type {
  CancelCohortStepActionReq,
  CancelCohortStepActionRes,
  DeleteDiseaseReq,
  DeleteDiseaseRes,
  DenyCohortReq,
  DenyCohortRes,
  EndCohortReq,
  EndCohortRes,
  EnterCohortReq,
  EnterCohortRes,
  FinishCohortStepActionReq,
  FinishCohortStepActionRes,
  GetCohortExceptionListReq,
  GetCohortExceptionListRes,
  GetCohortListReq,
  GetCohortListRes,
  GetCohortStepActionListReq,
  GetCohortStepActionListRes,
  GetCohortStepListReq,
  GetCohortStepListRes,
  GetDiseaseDeptListReq,
  GetDiseaseDeptListRes,
  GetDiseaseDiagListReq,
  GetDiseaseDiagListRes,
  GetDiseaseFollowupListReq,
  GetDiseaseFollowupListRes,
  GetDiseaseListReq,
  GetDiseaseListRes,
  GetDiseaseOpsListReq,
  GetDiseaseOpsListRes,
  GetDiseasePostListReq,
  GetDiseasePostListRes,
  GetDiseasePropertyReq,
  GetDiseasePropertyRes,
  GetDiseaseStepActionListReq,
  GetDiseaseStepActionListRes,
  GetDiseaseStepActionPropertyReq,
  GetDiseaseStepActionPropertyRes,
  GetDiseaseStepListReq,
  GetDiseaseStepListRes,
  GetDiseaseStepPropertyReq,
  GetDiseaseStepPropertyRes,
  GetMatchListReq,
  GetMatchListRes,
  NewCohortExceptionReq,
  NewCohortExceptionRes,
  SaveCohortExceptionPropertyReq,
  SaveCohortExceptionPropertyRes,
  DeleteCohortExceptionReq,
  DeleteCohortExceptionRes,
  DeleteDiseaseStepActionReq,
  DeleteDiseaseStepActionRes,
  DeleteDiseaseStepReq,
  DeleteDiseaseStepRes,
  NewDiseaseReq,
  NewDiseaseRes,
  NewDiseaseStepActionReq,
  NewDiseaseStepActionRes,
  NewDiseaseStepReq,
  NewDiseaseStepRes,
  SaveDiseaseDeptListReq,
  SaveDiseaseDeptListRes,
  SaveDiseaseDiagListReq,
  SaveDiseaseDiagListRes,
  SaveDiseaseFollowupListReq,
  SaveDiseaseFollowupListRes,
  SaveDiseaseOpsListReq,
  SaveDiseaseOpsListRes,
  SaveDiseasePostReq,
  SaveDiseasePostRes,
  SaveDiseasePropertyReq,
  SaveDiseasePropertyRes,
  SaveDiseaseStepActionPropertyReq,
  SaveDiseaseStepActionPropertyRes,
  SaveDiseaseStepPropertyReq,
  SaveDiseaseStepPropertyRes,
  UndoCohortStepActionReq,
  UndoCohortStepActionRes,
} from "@/types/cohort";

export const getMatchListAPI = (params: GetMatchListReq) =>
  request.post<GetMatchListRes>("cohort/GetMatchList", params);

/** 获取病种列表 */
export const getDiseaseListAPI = (params: GetDiseaseListReq) =>
  request.post<GetDiseaseListRes>("cohort/GetDiseaseList", params);

export const enterCohortAPI = (params: EnterCohortReq) =>
  request.post<EnterCohortRes>("cohort/EnterCohort", params);

export const denyCohortAPI = (params: DenyCohortReq) =>
  request.post<DenyCohortRes>("cohort/DenyCohort", params);

/** 获取临床路径队列列表 */
export const getCohortListAPI = (params: GetCohortListReq) =>
  request.post<GetCohortListRes>("cohort/GetCohortList", params);

/** 获取临床路径队列步骤列表 */
export const getCohortStepListAPI = (params: GetCohortStepListReq) =>
  request.post<GetCohortStepListRes>("cohort/GetCohortStepList", params);

/** 获取临床路径步骤动作列表 */
export const getCohortStepActionListAPI = (
  params: GetCohortStepActionListReq,
) =>
  request.post<GetCohortStepActionListRes>(
    "cohort/GetCohortStepActionList",
    params,
  );

/** 完成步骤动作 */
export const finishCohortStepActionAPI = (params: FinishCohortStepActionReq) =>
  request.post<FinishCohortStepActionRes>(
    "cohort/FinishCohortStepAction",
    params,
  );

/** 撤销步骤动作 */
export const undoCohortStepActionAPI = (params: UndoCohortStepActionReq) =>
  request.post<UndoCohortStepActionRes>("cohort/UndoCohortStepAction", params);

/** 作废步骤动作 */
export const cancelCohortStepActionAPI = (params: CancelCohortStepActionReq) =>
  request.post<CancelCohortStepActionRes>(
    "cohort/CancelCohortStepAction",
    params,
  );

/** 结束队列（完成/退出） */
export const endCohortAPI = (params: EndCohortReq) =>
  request.post<EndCohortRes>("cohort/EndCohort", params);

/** 获取临床路径变异列表 */
export const getCohortExceptionListAPI = (params: GetCohortExceptionListReq) =>
  request.post<GetCohortExceptionListRes>(
    "cohort/GetCohortExceptionList",
    params,
  );

/** 新增临床路径变异 */
export const newCohortExceptionAPI = (params: NewCohortExceptionReq) =>
  request.post<NewCohortExceptionRes>("cohort/NewCohortException", params);

/** 保存临床路径变异属性 */
export const saveCohortExceptionPropertyAPI = (
  params: SaveCohortExceptionPropertyReq,
) =>
  request.post<SaveCohortExceptionPropertyRes>(
    "cohort/SaveCohortExceptionProperty",
    params,
  );

/** 删除临床路径变异 */
export const deleteCohortExceptionAPI = (params: DeleteCohortExceptionReq) =>
  request.post<DeleteCohortExceptionRes>(
    "cohort/DeleteCohortException",
    params,
  );

/** 新建病种 */
export const newDiseaseAPI = (params: NewDiseaseReq) =>
  request.post<NewDiseaseRes>("cohort/NewDisease", params);

/** 删除病种 */
export const deleteDiseaseAPI = (params: DeleteDiseaseReq) =>
  request.post<DeleteDiseaseRes>("cohort/DeleteDisease", params);

/** 获取病种属性 */
export const getDiseasePropertyAPI = (params: GetDiseasePropertyReq) =>
  request.post<GetDiseasePropertyRes>("cohort/GetDiseaseProperty", params);

/** 保存病种属性 */
export const saveDiseasePropertyAPI = (params: SaveDiseasePropertyReq) =>
  request.post<SaveDiseasePropertyRes>("cohort/SaveDiseaseProperty", params);

/** 获取病种诊断列表 */
export const getDiseaseDiagListAPI = (params: GetDiseaseDiagListReq) =>
  request.post<GetDiseaseDiagListRes>("cohort/GetDiseaseDiagList", params);

/** 保存病种诊断列表 */
export const saveDiseaseDiagListAPI = (params: SaveDiseaseDiagListReq) =>
  request.post<SaveDiseaseDiagListRes>("cohort/SaveDiseaseDiagList", params);

/** 获取病种手术列表 */
export const getDiseaseOpsListAPI = (params: GetDiseaseOpsListReq) =>
  request.post<GetDiseaseOpsListRes>("cohort/GetDiseaseOpsList", params);

/** 保存病种手术列表 */
export const saveDiseaseOpsListAPI = (params: SaveDiseaseOpsListReq) =>
  request.post<SaveDiseaseOpsListRes>("cohort/SaveDiseaseOpsList", params);

/** 获取病种授权科室列表 */
export const getDiseaseDeptListAPI = (params: GetDiseaseDeptListReq) =>
  request.post<GetDiseaseDeptListRes>("cohort/GetDiseaseDeptList", params);

/** 保存病种授权科室列表 */
export const saveDiseaseDeptListAPI = (params: SaveDiseaseDeptListReq) =>
  request.post<SaveDiseaseDeptListRes>("cohort/SaveDiseaseDeptList", params);

/** 获取病种上报动作列表 */
export const getDiseasePostListAPI = (params: GetDiseasePostListReq) =>
  request.post<GetDiseasePostListRes>("cohort/GetDiseasePostList", params);

/** 保存或删除病种上报动作（不传 post_property 即删除） */
export const saveDiseasePostAPI = (params: SaveDiseasePostReq) =>
  request.post<SaveDiseasePostRes>("cohort/SaveDiseasePost", params);

/** 获取病种随访列表 */
export const getDiseaseFollowupListAPI = (params: GetDiseaseFollowupListReq) =>
  request.post<GetDiseaseFollowupListRes>(
    "cohort/GetDiseaseFollowupList",
    params,
  );

/** 保存病种随访列表 */
export const saveDiseaseFollowupListAPI = (
  params: SaveDiseaseFollowupListReq,
) =>
  request.post<SaveDiseaseFollowupListRes>(
    "cohort/SaveDiseaseFollowupList",
    params,
  );

/** 获取病种路径步骤列表 */
export const getDiseaseStepListAPI = (params: GetDiseaseStepListReq) =>
  request.post<GetDiseaseStepListRes>("cohort/GetDiseaseStepList", params);

/** 新建病种路径步骤 */
export const newDiseaseStepAPI = (params: NewDiseaseStepReq) =>
  request.post<NewDiseaseStepRes>("cohort/NewDiseaseStep", params);

/** 删除病种路径步骤 */
export const deleteDiseaseStepAPI = (params: DeleteDiseaseStepReq) =>
  request.post<DeleteDiseaseStepRes>("cohort/DeleteDiseaseStep", params);

/** 获取病种路径步骤属性 */
export const getDiseaseStepPropertyAPI = (params: GetDiseaseStepPropertyReq) =>
  request.post<GetDiseaseStepPropertyRes>(
    "cohort/GetDiseaseStepProperty",
    params,
  );

/** 保存病种路径步骤属性 */
export const saveDiseaseStepPropertyAPI = (
  params: SaveDiseaseStepPropertyReq,
) =>
  request.post<SaveDiseaseStepPropertyRes>(
    "cohort/SaveDiseaseStepProperty",
    params,
  );

/** 获取病种路径步骤动作列表 */
export const getDiseaseStepActionListAPI = (
  params: GetDiseaseStepActionListReq,
) =>
  request.post<GetDiseaseStepActionListRes>(
    "cohort/GetDiseaseStepActionList",
    params,
  );

/** 新建病种路径步骤动作 */
export const newDiseaseStepActionAPI = (params: NewDiseaseStepActionReq) =>
  request.post<NewDiseaseStepActionRes>("cohort/NewDiseaseStepAction", params);

/** 删除病种路径步骤动作 */
export const deleteDiseaseStepActionAPI = (
  params: DeleteDiseaseStepActionReq,
) =>
  request.post<DeleteDiseaseStepActionRes>(
    "cohort/DeleteDiseaseStepAction",
    params,
  );

/** 获取病种路径步骤动作属性 */
export const getDiseaseStepActionPropertyAPI = (
  params: GetDiseaseStepActionPropertyReq,
) =>
  request.post<GetDiseaseStepActionPropertyRes>(
    "cohort/GetDiseaseStepActionProperty",
    params,
  );

/** 保存病种路径步骤动作属性 */
export const saveDiseaseStepActionPropertyAPI = (
  params: SaveDiseaseStepActionPropertyReq,
) =>
  request.post<SaveDiseaseStepActionPropertyRes>(
    "cohort/SaveDiseaseStepActionProperty",
    params,
  );
