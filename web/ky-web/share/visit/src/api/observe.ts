import { request } from "comm/request";
import type {
  DeleteObserveReq,
  DeleteObserveRes,
  GetObserveListReq,
  GetObserveListRes,
  NewObserveReq,
  NewObserveRes,
  ObserveRow,
  SaveObservePropertyRes,
} from "@/types/observe";

export const getObserveList = (params: GetObserveListReq) =>
  request.post<GetObserveListRes>("care/observe/GetObserveList", {
    include_except: false,
    include_cancel: false,
    ...params,
  });

export const newObserve = (data: NewObserveReq) =>
  request.post<NewObserveRes>("care/observe/NewObserve", data);

export const saveObserveProperty = (
  observe_id: number,
  observe_property: ObserveRow,
) =>
  request.post<SaveObservePropertyRes>("care/observe/SaveObserveProperty", {
    observe_id,
    observe_property,
  });

export const deleteObserve = (data: DeleteObserveReq) =>
  request.post<DeleteObserveRes>("care/observe/DeleteObserve", data);
