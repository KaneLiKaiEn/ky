export declare const MODULE_ID_QUERY_KEY = "moduleId";
/** 构建带 moduleId 的模块路径，如 /system/user?moduleId=8 */
export declare const buildModulePath: (routePath: string, entryKey: string, moduleId: number) => string;
/** 用于菜单高亮：pathname + search */
export declare const getLocationPath: (location: {
    pathname: string;
    search: string;
}) => string;
export declare const parseModuleIdFromSearch: (search: string) => number | null;
/** 子应用页面读取当前模块 ID */
export declare const useCurrentModuleId: () => number | null;
export declare const useLocationPath: () => string;
