import { request } from "comm/request";
import type {
  GetAreaPropertyReq,
  GetAreaPropertyRes,
  RetrieveAreaListReq,
  RetrieveAreaListRes,
  RetrieveDict2ItemListReq,
  RetrieveDict2ItemListRes,
} from "../types/sys";

/** 检索字典数据，retrieve_input 默认都为 * */
// 1. 国籍字典 dict_code 传 GB/T 2659-2000
// 2. 地址类别字典 dict_code 传 CV02.01.205
// 3. 身份识别类别字典 dict_code 传 CV02.01.101
// 4. 患者类型字典 dict_code 传 insurance.type
// 5. 民族字典 dict_code 传 GB/T 3304
// 6. 文化程度字典 dict_code 传 GB/T 4658-2006
// 7. 职业字典 dict_code 传 GB/T 6565-2009
// 8. 语言字典 dict_code 传 GB/T 4880.1-2005
// 9. 婚姻状况字典 dict_code 传 GB/T 2261.2-2003
// 10. 家庭关系字典 dict_code 传 GB/T 4761-2008
export const retrieveDict2ItemList = (params: RetrieveDict2ItemListReq) => {
  return request.post<RetrieveDict2ItemListRes>("sys/RetrieveDict2ItemList", params);
};

/** 检索区域列表 */
export const retrieveAreaListAPI = (params: RetrieveAreaListReq) =>
  request.post<RetrieveAreaListRes>("sys/RetrieveAreaList", params);

/** 获取区域属性（参保地） */
export const getAreaPropertyAPI = (params: GetAreaPropertyReq) =>
  request.post<GetAreaPropertyRes>("sys/GetAreaProperty", params);
