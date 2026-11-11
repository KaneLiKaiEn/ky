import type {
  DeleteCatalogReq,
  DeleteCatalogRes,
  GetCatalogListReq,
  GetCatalogListRes,
  GetCatalogPropertyReq,
  GetCatalogPropertyRes,
  NewCatalogReq,
  NewCatalogRes,
  RetrieveDict2ItemListReq,
  RetrieveDict2ItemListRes,
  SaveCatalogPropertyReq,
  SaveCatalogPropertyRes,
} from "../types/sys.d.ts";
import { request } from "comm/request";

export const getCatalogList = (
  params: GetCatalogListReq,
  signal?: AbortSignal,
) => {
  return request.post<GetCatalogListRes>("sys/GetCatalogList", params, {
    signal,
  });
};

export const getCatalogProperty = (params: GetCatalogPropertyReq) => {
  return request.post<GetCatalogPropertyRes>("sys/GetCatalogProperty", params);
};

export const newCatalog = (params: NewCatalogReq) => {
  return request.post<NewCatalogRes>("sys/NewCatalog", params);
};

export const deleteCatalog = (params: DeleteCatalogReq) => {
  return request.post<DeleteCatalogRes>("sys/DeleteCatalog", params);
};

export const saveCatalogProperty = (params: SaveCatalogPropertyReq) => {
  return request.post<SaveCatalogPropertyRes>(
    "sys/SaveCatalogProperty",
    params,
  );
};

export const retrieveDict2ItemList = (
  params: RetrieveDict2ItemListReq,
  signal?: AbortSignal,
) => {
  return request.post<RetrieveDict2ItemListRes>("sys/RetrieveDict2ItemList", params, {
    signal,
  });
};
