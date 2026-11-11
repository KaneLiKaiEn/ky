export interface SubMenuItem {
  key: string;
  label: string;
  icon: string;
  order: number;
}

const menuConfig: SubMenuItem[] = [
  { key: "user", label: "用户管理", icon: "UserOutlined", order: 0 },
  { key: "role", label: "角色管理", icon: "TeamOutlined", order: 1 },
  { key: "menu", label: "菜单管理", icon: "MenuOutlined", order: 2 },
  { key: "dept", label: "部门管理", icon: "ApartmentOutlined", order: 3 },
  { key: "post", label: "岗位管理", icon: "IdcardOutlined", order: 4 },
];

export default menuConfig;
