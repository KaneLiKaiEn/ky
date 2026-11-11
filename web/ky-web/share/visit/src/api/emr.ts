import { request } from "comm/request";
import type {
  AttachEmrStakeholderReq,
  AttachEmrStakeholderRes,
  CommitEmrReq,
  CommitEmrRes,
  CreateEmrReq,
  CreateEmrRes,
  DeleteEmrReq,
  DeleteEmrRes,
  DetachEmrStakeholderReq,
  DetachEmrStakeholderRes,
  GetEmrContentReq,
  GetEmrContentRes,
  GetEmrDiscussListReq,
  GetEmrDiscussListRes,
  GetEmrDiscussUserListReq,
  GetEmrDiscussUserListRes,
  GetEmrElemListReq,
  GetEmrElemListRes,
  GetEmrInitReq,
  GetEmrInitRes,
  GetEmrListReq,
  GetEmrListRes,
  GetEmrPropertyReq,
  GetEmrPropertyRes,
  GetEmrConsentListReq,
  GetEmrConsentListRes,
  GetEmrConsentPropertyReq,
  GetEmrConsentPropertyRes,
  GetEmrConsentSignContentReq,
  GetEmrConsentSignContentRes,
  GetEmrStakeholderListReq,
  GetEmrStakeholderListRes,
  SignEmrConsentReq,
  SignEmrConsentRes,
  SignEmrStakeholderReq,
  SignEmrStakeholderRes,
  SaveEmrDiscussListReq,
  SaveEmrDiscussListRes,
  SaveEmrDiscussUserListReq,
  SaveEmrDiscussUserListRes,
  SaveEmrReq,
  SaveEmrRes,
  SaveEmrPropertyReq,
  SaveEmrPropertyRes,
  SaveAsPrefabReq,
  SaveAsPrefabRes,
  UndoCommitEmrReq,
  UndoCommitEmrRes,
  GetQcItemListRes,
  GetQcItemListReq,
  DeleteTimeRuleReq,
  DeleteTimeRuleRes,
  GetTimeRuleDeptListReq,
  GetTimeRuleDeptListRes,
  GetTimeRuleListReq,
  GetTimeRuleListRes,
  GetTimeRulePropertyReq,
  GetTimeRulePropertyRes,
  NewTimeRuleReq,
  NewTimeRuleRes,
  SaveTimeRuleDeptListReq,
  SaveTimeRuleDeptListRes,
  SaveTimeRulePropertyReq,
  SaveTimeRulePropertyRes,
} from "@/types/emr";

// 创建病历
export const createEmr = (params: CreateEmrReq) => {
  return request.post<CreateEmrRes>("emr/CreateEmr", params);
};

// 获取新建病历初始化时间和标题
export const getEmrInit = (params: GetEmrInitReq) => {
  return request.post<GetEmrInitRes>("emr/GetEmrInit", params);
};

// 保存病历
export const saveEmr = (params: SaveEmrReq) => {
  return request.post<SaveEmrRes>("emr/SaveEmr", params);
};

// 提交病历
export const commitEmr = (params: CommitEmrReq) => {
  return request.post<CommitEmrRes>("emr/CommitEmr", params);
};

// 撤销提交病历
export const undoCommitEmr = (params: UndoCommitEmrReq) => {
  return request.post<UndoCommitEmrRes>("emr/UndoCommitEmr", params);
};

// 删除病历
export const deleteEmr = (params: DeleteEmrReq) => {
  return request.post<DeleteEmrRes>("emr/DeleteEmr", params);
};

// 获取病历属性
export const getEmrProperty = (params: GetEmrPropertyReq) => {
  return request.post<GetEmrPropertyRes>("emr/GetEmrProperty", params);
};

// 获取病历列表
export const getEmrList = (params: GetEmrListReq) => {
  return request.post<GetEmrListRes>("emr/GetEmrList", params);
};

// 获取病历内容
export const getEmrContent = (params: GetEmrContentReq) => {
  return request.post<GetEmrContentRes>("emr/GetEmrContent", params);
};

// 获取病历数据元列表
export const getEmrElemList = (params: GetEmrElemListReq) => {
  return request.post<GetEmrElemListRes>("emr/GetEmrElemList", params);
};

// 获取病历相关人列表
export const getEmrStakeholderList = (params: GetEmrStakeholderListReq) => {
  return request.post<GetEmrStakeholderListRes>(
    "emr/GetEmrStakeholderList",
    params,
  );
};

// 添加病历相关人
export const attachEmrStakeholder = (params: AttachEmrStakeholderReq) => {
  return request.post<AttachEmrStakeholderRes>(
    "emr/AttachEmrStakeholder",
    params,
  );
};

// 移除病历相关人
export const detachEmrStakeholder = (params: DetachEmrStakeholderReq) => {
  return request.post<DetachEmrStakeholderRes>(
    "emr/DetachEmrStakeholder",
    params,
  );
};

export const signEmrStakeholder = (params: SignEmrStakeholderReq) => {
  return request.post<SignEmrStakeholderRes>(
    "emr/SignEmrStakeholder",
    params,
  );
};

// 保存病历属性
export const saveEmrProperty = (params: SaveEmrPropertyReq) => {
  return request.post<SaveEmrPropertyRes>("emr/SaveEmrProperty", params);
};

// 获取讨论记录列表
export const getEmrDiscussList = (params: GetEmrDiscussListReq) => {
  return request.post<GetEmrDiscussListRes>("emr/GetEmrDiscussList", params);
};

// 保存讨论记录列表
export const saveEmrDiscussList = (params: SaveEmrDiscussListReq) => {
  return request.post<SaveEmrDiscussListRes>("emr/SaveEmrDiscussList", params);
};

// 获取讨论人员列表
export const getEmrDiscussUserList = (params: GetEmrDiscussUserListReq) => {
  return request.post<GetEmrDiscussUserListRes>(
    "emr/GetEmrDiscussUserList",
    params,
  );
};

// 保存讨论人员列表
export const saveEmrDiscussUserList = (params: SaveEmrDiscussUserListReq) => {
  return request.post<SaveEmrDiscussUserListRes>(
    "emr/SaveEmrDiscussUserList",
    params,
  );
};

export const getEmrConsentList = (params: GetEmrConsentListReq) => {
  return request.post<GetEmrConsentListRes>("emr/GetEmrConsentList", params);
};

export const getEmrConsentProperty = (params: GetEmrConsentPropertyReq) => {
  return request.post<GetEmrConsentPropertyRes>(
    "emr/GetEmrConsentProperty",
    params,
  );
};

export const getEmrConsentSignContent = (
  params: GetEmrConsentSignContentReq,
) => {
  return request.post<GetEmrConsentSignContentRes>(
    "emr/GetEmrConsentSignContent",
    params,
  );
};

export const signEmrConsent = (params: SignEmrConsentReq) => {
  return request.post<SignEmrConsentRes>("emr/SignEmrConsent", params);
};

export const saveAsPrefab = (params: SaveAsPrefabReq) => {
  return request.post<SaveAsPrefabRes>("emr/SaveAsPrefab", params);
};

// 获取质控项目列表
export const getQcItemList = (params: GetQcItemListReq) => {
  return request.post<GetQcItemListRes>("emr/qc/GetQcItemList", params);
};

// 时限规则
export const getTimeRuleListAPI = (params: GetTimeRuleListReq) =>
  request.post<GetTimeRuleListRes>("emr/time/GetTimeRuleList", params);

export const newTimeRuleAPI = (params: NewTimeRuleReq) =>
  request.post<NewTimeRuleRes>("emr/time/NewTimeRule", params);

export const deleteTimeRuleAPI = (params: DeleteTimeRuleReq) =>
  request.post<DeleteTimeRuleRes>("emr/time/DeleteTimeRule", params);

export const getTimeRulePropertyAPI = (params: GetTimeRulePropertyReq) =>
  request.post<GetTimeRulePropertyRes>("emr/time/GetTimeRuleProperty", params);

export const saveTimeRulePropertyAPI = (params: SaveTimeRulePropertyReq) =>
  request.post<SaveTimeRulePropertyRes>(
    "emr/time/SaveTimeRuleProperty",
    params,
  );

export const getTimeRuleDeptListAPI = (params: GetTimeRuleDeptListReq) =>
  request.post<GetTimeRuleDeptListRes>("emr/time/GetTimeRuleDeptList", params);

export const saveTimeRuleDeptListAPI = (params: SaveTimeRuleDeptListReq) =>
  request.post<SaveTimeRuleDeptListRes>(
    "emr/time/SaveTimeRuleDeptList",
    params,
  );
