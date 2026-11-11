import { eventBus } from "../../utils/eventBus";

/** 诊断等变更后，刷新就诊患者列表（护士站 / 医生站左侧公共列表） */
export const INPATIENT_LIST_REFRESH = "visit:inpatient-list-refresh";

export interface InPatientListRefreshPayload {
  /** 有值时只刷新该就诊的卡片；不传则刷新列表内全部卡片 */
  visit_id?: number;
}

export const emitInPatientListRefresh = (visitId?: number | null) => {
  const payload: InPatientListRefreshPayload = {};
  if (visitId != null && Number.isFinite(visitId) && visitId > 0) {
    payload.visit_id = visitId;
  }
  eventBus.emit(INPATIENT_LIST_REFRESH, payload);
};
