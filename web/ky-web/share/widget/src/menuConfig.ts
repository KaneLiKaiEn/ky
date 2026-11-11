export interface SubMenuItem {
  key: string;
  label: string;
  icon: string;
  order: number;
}

const menuConfig: SubMenuItem[] = [
  { key: "user-home", label: "工作台", icon: "AppstoreOutlined", order: 1 },
];

export default menuConfig;
