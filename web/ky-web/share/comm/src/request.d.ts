import { type AxiosInstance, type AxiosRequestConfig } from "axios";
import type { MessageInstance } from "antd/es/message/interface";
declare module "axios" {
    interface AxiosRequestConfig {
        /** 跳过统一响应拦截，直接返回原始 response.data（{ code, msg, data }） */
        rawResponse?: boolean;
        /** 由调用方处理错误，不提示或改变当前会话。 */
        errorMode?: "global" | "local";
    }
}
export declare const setMessageApi: (api: MessageInstance) => void;
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
export declare const API_BASE_URL = "/dev-api";
declare const instance: AxiosInstance;
type RequestClient = {
    get: <T>(url: string, config?: AxiosRequestConfig) => Promise<T>;
    post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) => Promise<T>;
    put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) => Promise<T>;
    delete: <T>(url: string, config?: AxiosRequestConfig) => Promise<T>;
    /** 以 GET 下载文件流并触发浏览器保存 */
    download: (url: string, fileName: string, config?: AxiosRequestConfig) => Promise<void>;
};
export declare const request: RequestClient;
export default instance;
