import { request } from "comm/request";
import type {
  GetObserveFavoriteListReq,
  GetObserveFavoriteListRes,
  GetObserveLatestReq,
  GetObserveLatestRes,
  GetObserveListReq,
  GetObserveListRes,
  SaveObserveFavoriteListReq,
  SaveObserveFavoriteListRes,
} from "@/types/care";

export const getObserveLatest = (params: GetObserveLatestReq) =>
  request.post<GetObserveLatestRes>("care/observe/GetObserveLatest", params);

export const getObserveFavoriteList = (params: GetObserveFavoriteListReq) =>
  request.post<GetObserveFavoriteListRes>(
    "care/observe/GetObserveFavoriteList",
    params,
  );

export const saveObserveFavoriteList = (params: SaveObserveFavoriteListReq) =>
  request.post<SaveObserveFavoriteListRes>(
    "care/observe/SaveObserveFavoriteList",
    params,
  );

export const getObserveList = (params: GetObserveListReq) =>
  request.post<GetObserveListRes>("care/observe/GetObserveList", params);
