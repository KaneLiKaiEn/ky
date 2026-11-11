import type { RemoteAppConfig } from "@/config/remoteApps";
import { parseModuleIdFromSearch } from "comm/moduleContext";

export interface ModuleAccessIndex {
  /** pathname -> 允许的 moduleId 集合 */
  byPathname: Map<string, Set<number>>;
  /** 已授权子应用的 routePath 前缀，如 /system */
  appPrefixes: Set<string>;
}

const normalizePathname = (pathname: string): string => {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
};

const parseMenuItemPath = (
  path: string,
): { pathname: string; moduleId: number | null } => {
  const queryIndex = path.indexOf("?");
  const pathname = normalizePathname(
    queryIndex >= 0 ? path.slice(0, queryIndex) : path,
  );
  const search = queryIndex >= 0 ? path.slice(queryIndex) : "";
  return { pathname, moduleId: parseModuleIdFromSearch(search) };
};

/** 根据 GetMyModuleList 返回的菜单项构建访问白名单 */
export const buildModuleAccessIndex = (
  remoteApps: RemoteAppConfig[],
): ModuleAccessIndex => {
  const byPathname = new Map<string, Set<number>>();
  const appPrefixes = new Set<string>();

  for (const app of remoteApps) {
    appPrefixes.add(normalizePathname(app.routePath));

    for (const item of app.menuItems ?? []) {
      const { pathname, moduleId } = parseMenuItemPath(item.path);
      const id = moduleId ?? (item.moduleId > 0 ? item.moduleId : null);

      let allowed = byPathname.get(pathname);
      if (!allowed) {
        allowed = new Set();
        byPathname.set(pathname, allowed);
      }
      if (id) allowed.add(id);
    }
  }

  return { byPathname, appPrefixes };
};

/**
 * 在白名单中查找当前路径对应的已授权模块入口。
 * 支持精确匹配，以及「入口路径 + /」的子路径前缀匹配（取最长命中）。
 */
const findAuthorizedPath = (
  pathname: string,
  byPathname: Map<string, Set<number>>,
): string | null => {
  let matched: string | null = null;

  for (const allowedPath of byPathname.keys()) {
    if (
      pathname === allowedPath ||
      pathname.startsWith(`${allowedPath}/`)
    ) {
      if (matched == null || allowedPath.length > matched.length) {
        matched = allowedPath;
      }
    }
  }

  return matched;
};

/**
 * 校验当前路径是否在用户模块白名单内。
 * 已授权模块入口及其子路由均放行。
 * 非子应用路由（如 /、/404）返回 true，由其它 Route 处理。
 */
export const isModuleAccessAllowed = (
  pathname: string,
  search: string,
  index: ModuleAccessIndex,
): boolean => {
  const normalizedPath = normalizePathname(pathname);
  const moduleId = parseModuleIdFromSearch(search);
  const authorizedPath = findAuthorizedPath(normalizedPath, index.byPathname);

  if (authorizedPath != null) {
    const allowedIds = index.byPathname.get(authorizedPath);
    if (!allowedIds) return false;
    if (moduleId != null) {
      return allowedIds.has(moduleId);
    }
    return true;
  }

  for (const prefix of index.appPrefixes) {
    if (
      normalizedPath === prefix ||
      normalizedPath.startsWith(`${prefix}/`)
    ) {
      return false;
    }
  }

  return true;
};
