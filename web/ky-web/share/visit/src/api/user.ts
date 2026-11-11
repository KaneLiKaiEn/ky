import { request } from "comm/request";
import type {
  GetUserList2Req,
  GetUserList2Res,
  GetUserListReq,
  GetUserListRes,
  GetUserWriteImageReq,
  GetUserWriteImageRes,
  RetrieveUserListReq,
  RetrieveUserListRes,
} from "@/types/user";

// 获取用户列表
export const getUserList = (params: GetUserListReq) => {
  return request.post<GetUserListRes>("user/GetUserList", params);
};

export const getUserList2 = (params: GetUserList2Req) => {
  return request.post<GetUserList2Res>("user/GetUserList2", params);
};

// 检索用户列表
export const retrieveUserList = (params: RetrieveUserListReq) => {
  return request.post<RetrieveUserListRes>("user/RetrieveUserList", params);
};

export const getUserWriteImage = (params: GetUserWriteImageReq) => {
  return request.post<GetUserWriteImageRes>("user/GetUserWriteImage", params);
};
