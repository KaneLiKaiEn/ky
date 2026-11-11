import { getSessionInfo } from "@/api/auth";
import { getActiveModuleList, getFavoriteModuleList } from "@/api/federation";
import { getSessionId } from "comm/session";

/** 常用模块展示数量，对应 GetActiveModuleListReq.top_n */
export const ACTIVE_MODULE_TOP_N = 8;

export interface FavoriteMenuItem {
  moduleId: number;
  path: string;
  label: string;
  icon: string;
}

export interface ActiveMenuItem {
  moduleId: number;
  path: string;
  label: string;
  icon: string;
}

export interface ModuleMenuMeta {
  path: string;
  label: string;
  icon: string;
}

export const resolveSessionUserId = async (): Promise<number | null> => {
  const sessionId = getSessionId();
  if (!sessionId) return null;

  const res = await getSessionInfo({ session_id: sessionId });
  return res.session_info?.user_id ?? res.access_info?.user_id ?? null;
};

export const fetchFavoriteMenuItems = async (
  moduleIndex: Map<number, ModuleMenuMeta>,
): Promise<FavoriteMenuItem[]> => {
  const userId = await resolveSessionUserId();
  if (userId == null) return [];

  const res = await getFavoriteModuleList({ user_id: userId });
  return (res.row_list ?? [])
    .map((row) => {
      const moduleId = row.module_id;
      if (moduleId == null) return null;

      const meta = moduleIndex.get(moduleId);
      if (!meta) return null;

      return {
        moduleId,
        path: meta.path,
        label: row.module_name ?? meta.label,
        icon: row.icon_name || meta.icon,
      };
    })
    .filter((item): item is FavoriteMenuItem => item != null);
};

export const fetchActiveMenuItems = async (
  moduleIndex: Map<number, ModuleMenuMeta>,
  topN = ACTIVE_MODULE_TOP_N,
): Promise<ActiveMenuItem[]> => {
  const userId = await resolveSessionUserId();
  if (userId == null) return [];

  const res = await getActiveModuleList({ user_id: userId, top_n: topN });
  return (res.row_list ?? [])
    .map((row) => {
      const moduleId = row.module_id;
      if (moduleId == null) return null;

      const meta = moduleIndex.get(moduleId);
      if (!meta) return null;

      return {
        moduleId,
        path: meta.path,
        label: row.module_name ?? meta.label,
        icon: meta.icon,
      };
    })
    .filter((item): item is ActiveMenuItem => item != null);
};
