import { request } from "comm/request";
import type {
  ReadStringReq,
  ReadStringRes,
  WriteStringReq,
  WriteStringRes,
} from "@/types/file";

export const readString = (params: ReadStringReq) => {
  return request.post<ReadStringRes>("file/ReadString", params);
};

export const writeString = (params: WriteStringReq) => {
  return request.post<WriteStringRes>("file/WriteString", params);
};
