import type {
  GetDischargeListReq,
  GetDischargeListRes,
  GetIpListReq,
  GetIpListRes,
  GetTransferDeptList2Req,
  VisitRow,
} from "./type";

/** 拉取在院患者原始列表（不组织展示数据） */
export declare const fetchInPatientList: (
  params: GetIpListReq,
) => Promise<Pick<GetIpListRes, "visit_list" | "ip_list">>;

/** 拉取出院患者原始列表（不组织展示数据） */
export declare const fetchDischargeList: (
  params: GetDischargeListReq,
) => Promise<Pick<GetDischargeListRes, "visit_list" | "ip_list">>;

/**
 * 拉取转科列表，并映射为 visit_list（仅含 visit_id，供 VisitItem 懒加载）。
 */
export declare const fetchTransferDeptList: (
  params: GetTransferDeptList2Req,
) => Promise<Pick<GetIpListRes, "visit_list" | "ip_list">>;

export declare const fetchDischargeSearchList: (params: {
  retrieve_input: string;
  visit_start?: string;
  visit_end?: string;
  dept_id_list?: number[];
  ward_id_list?: number[];
  /** 返回 true 时停止后续日期请求（例如用户又发起了一次检索或点击中止） */
  isCancelled?: () => boolean;
  /** 每开始请求一天回调一次，供进度条展示 */
  onProgress?: (progress: {
    current: number;
    total: number;
    date: string;
  }) => void;
}) => Promise<VisitRow[]>;
