import { request } from "comm/request";
import type {
  AddDiagReq,
  AddDiagRes,
  AddDiagTcmReq,
  AddDiagTcmRes,
  CloneDiagReq,
  CloneDiagRes,
  DeleteDiagReq,
  DeleteDiagRes,
  DeleteDiagTcmReq,
  DeleteDiagTcmRes,
  GetDiagListReq,
  GetDiagListRes,
  GetDiagListTcmReq,
  GetDiagListTcmRes,
  MoveDiagReq,
  MoveDiagRes,
  MoveDiagTcmReq,
  MoveDiagTcmRes,
  RetrieveBingListReq,
  RetrieveBingListRes,
  RetrieveDiagItemListReq,
  RetrieveDiagItemListRes,
  RetrieveZhengListReq,
  RetrieveZhengListRes,
  SaveDiagPropertyReq,
  SaveDiagPropertyRes,
  SaveDiagPropertyTcmReq,
  SaveDiagPropertyTcmRes,
} from "@/types/diag";

export const getDiagListAPI = (params: GetDiagListReq) =>
  request.post<GetDiagListRes>("diag/GetDiagList", params);

export const getDiagListTcmAPI = (params: GetDiagListTcmReq) =>
  request.post<GetDiagListTcmRes>("diag/GetDiagListTcm", params);

export const addDiagTcmAPI = (params: AddDiagTcmReq) =>
  request.post<AddDiagTcmRes>("diag/AddDiagTcm", params);

export const retrieveBingListAPI = (params: RetrieveBingListReq) =>
  request.post<RetrieveBingListRes>("diag/RetrieveBingList", params);

export const retrieveZhengListAPI = (params: RetrieveZhengListReq) =>
  request.post<RetrieveZhengListRes>("diag/RetrieveZhengList", params);

export const addDiagAPI = (params: AddDiagReq) =>
  request.post<AddDiagRes>("diag/AddDiag", params);

export const saveDiagPropertyAPI = (params: SaveDiagPropertyReq) =>
  request.post<SaveDiagPropertyRes>("diag/SaveDiagProperty", params);

export const retrieveDiagItemListAPI = (params: RetrieveDiagItemListReq) =>
  request.post<RetrieveDiagItemListRes>("diag/RetrieveItemList", params);

export const deleteDiagAPI = (params: DeleteDiagReq) =>
  request.post<DeleteDiagRes>("diag/DeleteDiag", params);

export const moveDiagUpAPI = (params: MoveDiagReq) =>
  request.post<MoveDiagRes>("diag/MoveDiagUp", params);

export const moveDiagDownAPI = (params: MoveDiagReq) =>
  request.post<MoveDiagRes>("diag/MoveDiagDown", params);

export const cloneDiagAPI = (params: CloneDiagReq) =>
  request.post<CloneDiagRes>("diag/CloneDiag", params);

export const saveDiagPropertyTcmAPI = (params: SaveDiagPropertyTcmReq) =>
  request.post<SaveDiagPropertyTcmRes>("diag/SaveDiagPropertyTcm", params);

export const deleteDiagTcmAPI = (params: DeleteDiagTcmReq) =>
  request.post<DeleteDiagTcmRes>("diag/DeleteDiagTcm", params);

export const moveDiagUpTcmAPI = (params: MoveDiagTcmReq) =>
  request.post<MoveDiagTcmRes>("diag/MoveDiagUpTcm", params);

export const moveDiagDownTcmAPI = (params: MoveDiagTcmReq) =>
  request.post<MoveDiagTcmRes>("diag/MoveDiagDownTcm", params);
