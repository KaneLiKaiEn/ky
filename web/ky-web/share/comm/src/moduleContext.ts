import { useMemo } from "react";
import { useLocation, useSearchParams } from "react-router-dom";

export const MODULE_ID_QUERY_KEY = "moduleId";

/** 构建带 moduleId 的模块路径，如 /system/user?moduleId=8 */
export const buildModulePath = (
  routePath: string,
  entryKey: string,
  moduleId: number,
): string => {
  const params = new URLSearchParams();
  params.set(MODULE_ID_QUERY_KEY, String(moduleId));
  return `${routePath}/${entryKey}?${params.toString()}`;
};

/** 用于菜单高亮：pathname + search */
export const getLocationPath = (location: {
  pathname: string;
  search: string;
}): string =>
  location.search ? `${location.pathname}${location.search}` : location.pathname;

export const parseModuleIdFromSearch = (search: string): number | null => {
  const value = new URLSearchParams(search).get(MODULE_ID_QUERY_KEY);
  if (value == null || value === "") return null;
  const id = Number(value);
  return Number.isFinite(id) && id > 0 ? id : null;
};

/** 子应用页面读取当前模块 ID */
export const useCurrentModuleId = (): number | null => {
  const [searchParams] = useSearchParams();
  return useMemo(
    () => parseModuleIdFromSearch(`?${searchParams.toString()}`),
    [searchParams],
  );
};

export const useLocationPath = (): string => {
  const location = useLocation();
  return getLocationPath(location);
};
