import React from "react";
export interface NotFoundProps {
    /** 自定义展示的来源路径，默认从 location.state.from 读取 */
    from?: string;
    /** 返回首页路径，默认 "/" */
    homePath?: string;
}
export declare const NotFound: React.FC<NotFoundProps>;
/** 携带当前路径跳转到全局 /404 */
export declare const NotFoundRedirect: React.FC;
