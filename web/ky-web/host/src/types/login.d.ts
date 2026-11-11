/** 与 AgileBoot LoginController 对齐的类型定义 */

export interface CurrentUserInfo {
  userId?: number;
  username?: string;
  nickname?: string;
  deptId?: number;
  deptName?: string;
  roleId?: number;
  roleName?: string;
  postId?: number;
  postName?: string;
  avatar?: string;
}

export interface CurrentLoginUserDTO {
  userInfo?: CurrentUserInfo;
  roleKey?: string;
  permissions?: string[];
}

export interface RouterMeta {
  title?: string;
  icon?: string;
  showLink?: boolean;
  showParent?: boolean;
  rank?: number;
  auths?: string[];
  frameSrc?: string;
  isFrameSrcInternal?: boolean;
}

/** /getRouters 返回的菜单路由树（RouterDTO） */
export interface RouterDTO {
  name?: string;
  path?: string;
  redirect?: string;
  component?: string;
  rank?: number;
  meta?: RouterMeta;
  children?: RouterDTO[];
}
