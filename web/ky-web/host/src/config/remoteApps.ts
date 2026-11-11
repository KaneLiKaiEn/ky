import { getRouters } from "@/api/login";
import type { RouterDTO } from "@/types/login";

/** 侧边栏菜单项（由 /getRouters 映射） */
export interface MenuModuleItem {
  moduleId: number;
  key: string;
  label: string;
  icon: string;
  path: string;
}

/** 联邦子应用配置（按菜单路径的首段聚合，如 /system/** → system 子应用） */
export interface RemoteAppConfig {
  name: string;
  appName: string;
  entry: string;
  moduleId: string;
  routePath: string;
  menuItems: MenuModuleItem[];
}

/**
 * 已迁移为 React 的页面：子应用 → 页面 key → bootstrap-icons 图标名。
 * 后端菜单中其余页面（参数设置、通知公告、日志、监控等）暂不展示。
 */
const IMPLEMENTED_PAGES: Record<string, Record<string, string>> = {
  system: {
    user: "person",
    role: "people",
    menu: "list-ul",
    dept: "diagram-3",
    post: "person-badge",
  },
};

const resolveAppEntryFromEnv = (appCode: string): string => {
  const envKey = `VITE_${appCode.toUpperCase().replace(/-/g, "_")}_ENTRY`;
  return (import.meta.env[envKey] as string | undefined) ?? "";
};

const resolveAppEntry = (appCode: string): string => {
  if (import.meta.env.DEV) {
    return resolveAppEntryFromEnv(appCode);
  }

  return `${appCode}/${appCode}.js`;
};

/** /system/user/index → ["system", "user"] */
const splitMenuPath = (path: string): [string, string] | null => {
  const segments = path
    .replace(/\/index$/, "")
    .split("/")
    .filter(Boolean);
  if (segments.length < 2) return null;
  return [segments[0], segments.slice(1).join("/")];
};

interface MenuLeaf {
  router: RouterDTO;
  groupTitle: string;
}

const collectLeaves = (routers: RouterDTO[]): MenuLeaf[] => {
  const leaves: MenuLeaf[] = [];
  const walk = (node: RouterDTO, groupTitle: string) => {
    if (node.meta?.showLink === false) return;
    if (node.children?.length) {
      node.children.forEach((child) => walk(child, groupTitle));
    } else {
      leaves.push({ router: node, groupTitle });
    }
  };
  for (const root of routers) {
    walk(root, root.meta?.title ?? "");
  }
  return leaves;
};

export const buildRemoteAppsFromRouters = (
  routers: RouterDTO[],
): RemoteAppConfig[] => {
  const apps = new Map<string, RemoteAppConfig>();
  let nextId = 1;

  for (const { router, groupTitle } of collectLeaves(routers)) {
    const parts = router.path ? splitMenuPath(router.path) : null;
    if (!parts) continue;
    const [appCode, key] = parts;
    const icon = IMPLEMENTED_PAGES[appCode]?.[key];
    if (!icon) continue;

    let app = apps.get(appCode);
    if (!app) {
      app = {
        name: appCode,
        appName: groupTitle || appCode,
        entry: resolveAppEntry(appCode),
        moduleId: `${appCode}/${appCode}`,
        routePath: `/${appCode}`,
        menuItems: [],
      };
      apps.set(appCode, app);
    }
    app.menuItems.push({
      moduleId: nextId++,
      key,
      label: router.meta?.title ?? key,
      icon,
      path: `/${appCode}/${key}`,
    });
  }

  return [...apps.values()];
};

/** 从 /getRouters 加载远程子应用配置 */
export const fetchRemoteApps = async (): Promise<RemoteAppConfig[]> =>
  buildRemoteAppsFromRouters((await getRouters()) ?? []);
