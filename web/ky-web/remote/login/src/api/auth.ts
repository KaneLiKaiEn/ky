import { request } from "comm/request";
import type { LoginReq, TokenDTO } from "@/types/auth";

/** 账号密码登录（password 需先经 RSA 公钥加密） */
export const login = (params: LoginReq) =>
  request.post<TokenDTO>("/login", params, { errorMode: "local" });
