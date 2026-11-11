import type { GetAreaPropertyReq, GetAreaPropertyRes, RetrieveAreaListReq, RetrieveAreaListRes, RetrieveDict2ItemListReq, RetrieveDict2ItemListRes } from "../types/sys";
/** 检索字典数据，retrieve_input 默认都为 * */
export declare const retrieveDict2ItemList: (params: RetrieveDict2ItemListReq) => Promise<RetrieveDict2ItemListRes>;
/** 检索区域列表 */
export declare const retrieveAreaListAPI: (params: RetrieveAreaListReq) => Promise<RetrieveAreaListRes>;
/** 获取区域属性（参保地） */
export declare const getAreaPropertyAPI: (params: GetAreaPropertyReq) => Promise<GetAreaPropertyRes>;
