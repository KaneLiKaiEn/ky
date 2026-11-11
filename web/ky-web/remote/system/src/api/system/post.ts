import { request } from "comm/request";
import type { PageDTO, PageQuery } from "./common";

export interface PostQuery extends PageQuery {
  postCode?: string;
  postName?: string;
  status?: number;
}

export interface PostDTO {
  postId: number;
  postCode: string;
  postName: string;
  postSort: number;
  remark?: string;
  status: number;
  statusStr?: string;
  createTime?: string;
}

/** AddPostCommand / UpdatePostCommand */
export interface PostCommand {
  postId?: number;
  postCode: string;
  postName: string;
  postSort: number;
  remark?: string;
  status?: string;
}

export const getPostList = (params: PostQuery) =>
  request.get<PageDTO<PostDTO>>("/system/post/list", { params });

export const addPost = (data: PostCommand) =>
  request.post<void>("/system/post", data);

export const updatePost = (data: PostCommand) =>
  request.put<void>("/system/post", data);

/** ids 需以逗号拼接，否则 axios 会序列化成 ids[]=1 导致后端绑定失败 */
export const deletePosts = (ids: number[]) =>
  request.delete<void>("/system/post", { params: { ids: ids.join(",") } });

export const exportPostExcel = (params: PostQuery) =>
  request.download("/system/post/excel", "岗位数据.xlsx", { params });
