/** 与 AgileBoot LoginController 对齐的类型定义 */

export interface LoginReq {
  username: string;
  /** RSA 公钥加密后的密码（Base64） */
  password: string;
  captchaCode?: string;
  captchaCodeKey?: string;
}

export interface CurrentUserInfo {
  userId?: number;
  username?: string;
  nickname?: string;
  deptId?: number;
  deptName?: string;
  roleId?: number;
  roleName?: string;
  avatar?: string;
}

export interface CurrentLoginUserDTO {
  userInfo?: CurrentUserInfo;
  roleKey?: string;
  permissions?: string[];
}

export interface TokenDTO {
  token: string;
  currentUser?: CurrentLoginUserDTO;
}
