import {
  getDischargeListAPI,
  getIpListAPI,
  getTransferDeptList2API,
  retrieveVisitListAPI,
} from "./api";
import { listDatesInclusive } from "./inpatientListSearch";
import type {
  GetDischargeListReq,
  GetDischargeListRes,
  GetIpListReq,
  GetIpListRes,
  GetTransferDeptList2Req,
  VisitRow,
} from "./type";

/** 拉取在院患者原始列表（不组织展示数据） */
export const fetchInPatientList = async (
  params: GetIpListReq,
): Promise<Pick<GetIpListRes, "visit_list" | "ip_list">> => {
  const res = await getIpListAPI(params);
  return {
    visit_list: res.visit_list ?? [],
    ip_list: res.ip_list ?? [],
  };
};

/** 拉取出院患者原始列表（不组织展示数据） */
export const fetchDischargeList = async (
  params: GetDischargeListReq,
): Promise<Pick<GetDischargeListRes, "visit_list" | "ip_list">> => {
  const res = await getDischargeListAPI(params);
  return {
    visit_list: res.visit_list ?? [],
    ip_list: res.ip_list ?? [],
  };
};

/**
 * 拉取转科列表，并映射为 visit_list（仅含 visit_id，供 VisitItem 懒加载）。
 */
export const fetchTransferDeptList = async (
  params: GetTransferDeptList2Req,
): Promise<Pick<GetIpListRes, "visit_list" | "ip_list">> => {
  const res = await getTransferDeptList2API(params);
  const transferList = (res.transfer_list ?? []).filter(
    (row) => row.visit_id != null && row.visit_id > 0,
  );
  const visit_list: VisitRow[] = transferList.map((row) => ({
    visit_id: row.visit_id,
  }));
  return {
    visit_list,
    // 转科接口没有 ip_list，用转出床号供列表按床号排序
    ip_list: transferList.map((row) => ({
      visit_id: row.visit_id,
      bed_no: row.from_bed_no || row.to_bed_no,
    })),
  };
};

/**
 * 出院检索：按天依次调用 RetrieveVisitList（一月约 30 次）。
 * 上一天返回后再请求下一天，单日失败跳过，合并去重后只保留 visit_id。
 */
export const fetchDischargeSearchList = async (params: {
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
}): Promise<VisitRow[]> => {
  const dates = listDatesInclusive(params.visit_start, params.visit_end);
  const visitList: VisitRow[] = [];
  const seen = new Set<number>();

  for (let i = 0; i < dates.length; i++) {
    if (params.isCancelled?.()) break;
    const visit_date = dates[i];
    params.onProgress?.({
      current: i + 1,
      total: dates.length,
      date: visit_date,
    });
    try {
      const res = await retrieveVisitListAPI({
        retrieve_input: params.retrieve_input,
        retrieve_like: true,
        visit_date,
        visit_status: "DISCHARGE",
        visit_type: "I",
        ...(params.dept_id_list?.length
          ? { dept_id_list: params.dept_id_list }
          : {}),
        ...(params.ward_id_list?.length
          ? { ward_id_list: params.ward_id_list }
          : {}),
      });
      for (const row of res.result_list ?? []) {
        const visitId = row.visit_row?.visit_id;
        if (visitId == null || visitId <= 0 || seen.has(visitId)) continue;
        seen.add(visitId);
        visitList.push({ visit_id: visitId });
      }
    } catch {
      // 单日失败跳过，继续下一天
    }
  }

  return visitList;
};
