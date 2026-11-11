import { request } from "comm/request";

export const MENU_TYPE = {
  PAGE: 1,
  CATALOG: 2,
  IFRAME: 3,
  EXTERNAL: 4,
} as const;

export interface MenuMeta {
  title?: string;
  icon?: string;
  showLink?: boolean;
  showParent?: boolean;
  rank?: number;
  frameSrc?: string;
  isFrameSrcInternal?: boolean;
  keepAlive?: boolean;
  [key: string]: unknown;
}

export interface MenuDTO {
  id: number;
  parentId: number;
  menuName: string;
  routerName?: string;
  path?: string;
  rank?: number;
  menuType?: number;
  menuTypeStr?: string;
  isButton?: boolean;
  status: number;
  statusStr?: string;
  createTime?: string;
  icon?: string;
}

export interface MenuDetailDTO extends MenuDTO {
  permission?: string;
  meta?: MenuMeta;
}

/** AddMenuCommand / UpdateMenuCommand */
export interface MenuCommand {
  menuId?: number;
  parentId: number;
  menuName: string;
  routerName?: string;
  path?: string;
  status: number;
  menuType?: number;
  isButton: boolean;
  permission?: string;
  meta: MenuMeta;
}

export const getMenuList = (params?: { isButton?: boolean }) =>
  request.get<MenuDTO[]>("/system/menus", { params });

export const getMenuInfo = (menuId: number) =>
  request.get<MenuDetailDTO>(`/system/menus/${menuId}`);

export const addMenu = (data: MenuCommand) =>
  request.post<void>("/system/menus", data);

export const updateMenu = (menuId: number, data: MenuCommand) =>
  request.put<void>(`/system/menus/${menuId}`, { ...data, menuId });

export const deleteMenu = (menuId: number) =>
  request.delete<void>(`/system/menus/${menuId}`);
