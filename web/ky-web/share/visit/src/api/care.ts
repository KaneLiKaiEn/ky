import { request } from "comm/request";
import type {
  DeleteCareReq,
  DeleteCareRes,
  GetCareListReq,
  GetCareListRes,
  NewCareReq,
  NewCareRes,
  SaveCarePropertyReq,
  SaveCarePropertyRes,
} from "@/types/care";

export const getCareList = (params: GetCareListReq) => {
  return request.post<GetCareListRes>("care/GetCareList", params);
};

export const newCare = (params: NewCareReq) => {
  return request.post<NewCareRes>("care/NewCare", params);
};

export const saveCareProperty = (params: SaveCarePropertyReq) => {
  return request.post<SaveCarePropertyRes>("care/SaveCareProperty", params);
};

export const deleteCare = (params: DeleteCareReq) => {
  return request.post<DeleteCareRes>("care/DeleteCare", params);
};
