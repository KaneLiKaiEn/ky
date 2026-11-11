import { request } from "comm/request";
import type {
  DeleteGuaranteeReq,
  DeleteGuaranteeRes,
  DeletePrepayReq,
  DeletePrepayRes,
  GetAccountReq,
  GetAccountRes,
  GetGuaranteeListReq,
  GetGuaranteeListRes,
  GetPrepayAccountReq,
  GetPrepayAccountRes,
  GetPrepayListReq,
  GetPrepayListRes,
  GetPrepayPropertyReq,
  GetPrepayPropertyRes,
  NewGuaranteeReq,
  NewGuaranteeRes,
  NewPrepayReq,
  NewPrepayRes,
  RefundPrepay2Req,
  RefundPrepay2Res,
  RefundPrepayReq,
  RefundPrepayRes,
  StartPrepayPayReq,
  StartPrepayPayRes,
  GetCreditReq,
  GetCreditRes,
  SaveCreditReq,
} from "@/types/account";

/** 新建预交金 */
export const newPrepayAPI = (params: NewPrepayReq) =>
  request.post<NewPrepayRes>("account/NewPrepay", params);

/** 发起预交金支付 */
export const startPrepayPayAPI = (params: StartPrepayPayReq) =>
  request.post<StartPrepayPayRes>("account/StartPrepayPay", params);

/** 预交金流水列表 */
export const getPrepayListAPI = (params: GetPrepayListReq) =>
  request.post<GetPrepayListRes>("account/GetPrepayList", params);

/** 预交金单条属性 */
export const getPrepayPropertyAPI = (params: GetPrepayPropertyReq) =>
  request.post<GetPrepayPropertyRes>("account/GetPrepayProperty", params);

/** 预交金账户余额 */
export const getPrepayAccountAPI = (params: GetPrepayAccountReq) =>
  request.post<GetPrepayAccountRes>("account/GetPrepayAccount", params);

/** 按就诊取账户余额（预交金 / 信用 / 担保） */
export const getAccountAPI = (params: GetAccountReq) =>
  request.post<GetAccountRes>("account/GetAccount", params);

/** 按 prepay_id 退款 */
export const refundPrepayAPI = (params: RefundPrepayReq) =>
  request.post<RefundPrepayRes>("account/RefundPrepay", params);

/** 按患者+类型退款 */
export const refundPrepay2API = (params: RefundPrepay2Req) =>
  request.post<RefundPrepay2Res>("account/RefundPrepay2", params);

/** 删除预交金 */
export const deletePrepayAPI = (params: DeletePrepayReq) =>
  request.post<DeletePrepayRes>("account/DeletePrepay", params);

/** 担保记录列表 */
export const getGuaranteeListAPI = (params: GetGuaranteeListReq) =>
  request.post<GetGuaranteeListRes>("account/guarantee/GetGuaranteeList", params);

/** 新增担保记录 */
export const newGuaranteeAPI = (params: NewGuaranteeReq) =>
  request.post<NewGuaranteeRes>("account/guarantee/NewGuarantee", params);

/** 删除担保记录 */
export const deleteGuaranteeAPI = (params: DeleteGuaranteeReq) =>
  request.post<DeleteGuaranteeRes>("account/guarantee/DeleteGuarantee", params);

/** 获取信用额 **/
export const getCreditAPI = (params: GetCreditReq) =>
  request.post<GetCreditRes>("account/credit/GetCredit", params);

/** 保存信用额 **/
export const saveCreditAPI = (params: SaveCreditReq) =>
  request.post<void>("account/credit/SaveCredit", params);