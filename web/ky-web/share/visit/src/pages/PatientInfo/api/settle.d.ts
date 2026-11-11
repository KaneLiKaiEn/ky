import type { GetDealerListReq, GetDealerListRes, GetSettleHandleInfoReq, GetSettleHandleInfoRes, GetSettleServiceInfoReq, GetSettleServiceInfoRes } from "../types/settle";
/** 结算系统列表 */
export declare const getDealerListAPI: (params?: GetDealerListReq) => Promise<GetDealerListRes>;
/** 获取结算服务 / 保险信息（医保状态） */
export declare const getSettleServiceInfoAPI: (params: GetSettleServiceInfoReq) => Promise<GetSettleServiceInfoRes>;
/** 获取结算登记信息（登记号） */
export declare const getSettleHandleInfoAPI: (params: GetSettleHandleInfoReq) => Promise<GetSettleHandleInfoRes>;
