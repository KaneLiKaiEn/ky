import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import type { MessageInstance } from "antd/es/message/interface";
import { getSessionId, clearSessionId } from "./session";

declare module "axios" {
  interface AxiosRequestConfig {
    /** 跳过统一响应拦截，直接返回原始 response.data（{ code, msg, data }） */
    rawResponse?: boolean;
    /** 由调用方处理错误，不提示或改变当前会话。 */
    errorMode?: "global" | "local";
  }
}

let messageApi: MessageInstance | null = null;

export const setMessageApi = (api: MessageInstance) => {
  messageApi = api;
};

const showError = (msg: string) => {
  messageApi?.error(msg);
};

/** AgileBoot 后端统一响应结构 */
export interface ApiResponse<T = unknown> {
  code: number;
  msg: string;
  data: T;
}

/** AgileBoot 分页结构 */
export interface PageDTO<T> {
  total: number;
  rows: T[];
}

const SUCCESS_CODE = 0;

/** 106 未授权 / 107 token 异常 / 108 token 处理失败 */
const SESSION_EXPIRED_CODES = new Set([106, 107, 108]);

const handleSessionExpired = () => {
  clearSessionId();
  if (window.location.pathname !== "/login") {
    window.location.replace("/login");
  }
};

export const API_BASE_URL = "/dev-api";

const instance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getSessionId();
    if (token && !config.headers.has("Authorization")) {
      config.headers.set("Authorization", `Bearer ${token}`);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

const readBlobJson = async (blob: Blob): Promise<ApiResponse | null> => {
  try {
    return JSON.parse(await blob.text()) as ApiResponse;
  } catch {
    return null;
  }
};

instance.interceptors.response.use(
  async (response) => {
    let body = response.data;

    if (body instanceof Blob) {
      if (body.type !== "application/json") return body;
      body = await readBlobJson(body);
    }

    if (body == null || typeof body !== "object" || !("code" in body)) {
      return body;
    }

    const { code, msg, data } = body as ApiResponse;
    if (code === SUCCESS_CODE) {
      return response.config.rawResponse ? body : data;
    }

    if (response.config.errorMode !== "local") {
      if (SESSION_EXPIRED_CODES.has(code)) {
        handleSessionExpired();
      }
      showError(msg || "请求失败");
    }
    return Promise.reject(new Error(msg || "请求失败"));
  },
  (error) => {
    if (axios.isCancel(error) || error.config?.errorMode === "local") {
      return Promise.reject(error);
    }
    const status = error.response?.status;
    const serverMsg = error.response?.data?.msg;

    const statusMessageMap: Record<number, string> = {
      401: "未登录或登录已过期",
      403: "没有权限",
      404: "请求的资源不存在",
    };

    let msg = serverMsg;

    if (!msg) {
      if (status && statusMessageMap[status]) {
        msg = statusMessageMap[status];
      } else if (status && status >= 500) {
        msg = "服务器错误";
      } else {
        msg = error.message || "网络异常";
      }
    }

    showError(msg);

    if (status === 401) {
      handleSessionExpired();
    }

    return Promise.reject(error);
  },
);

type RequestClient = {
  get: <T>(url: string, config?: AxiosRequestConfig) => Promise<T>;
  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) => Promise<T>;
  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) => Promise<T>;
  delete: <T>(url: string, config?: AxiosRequestConfig) => Promise<T>;
  /** 以 GET 下载文件流并触发浏览器保存 */
  download: (url: string, fileName: string, config?: AxiosRequestConfig) => Promise<void>;
};

const get = <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  return instance.get<T, T>(url, config) as Promise<T>;
};

const post = <T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> => {
  return instance.post<T, T>(url, data, config) as Promise<T>;
};

const put = <T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> => {
  return instance.put<T, T>(url, data, config) as Promise<T>;
};

const del = <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  return instance.delete<T, T>(url, config) as Promise<T>;
};

const download = async (
  url: string,
  fileName: string,
  config?: AxiosRequestConfig,
): Promise<void> => {
  const blob = await instance.get<Blob, Blob>(url, {
    ...config,
    responseType: "blob",
  });
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(href);
};

export const request: RequestClient = { get, post, put, delete: del, download };

export default instance;
