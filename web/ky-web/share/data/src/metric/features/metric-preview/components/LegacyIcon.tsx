import {
  ApartmentOutlined,
  AreaChartOutlined,
  BankOutlined,
  BarChartOutlined,
  BranchesOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  DashboardOutlined,
  DollarOutlined,
  ExperimentOutlined,
  FallOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  FolderOutlined,
  FundOutlined,
  HeartOutlined,
  LineChartOutlined,
  MedicineBoxOutlined,
  PieChartOutlined,
  RiseOutlined,
  SafetyCertificateOutlined,
  SwapOutlined,
  TeamOutlined,
  UserOutlined,
  UsergroupAddOutlined,
} from "@ant-design/icons";

const icons = {
  AreaChartOutlined,
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  FundOutlined,
  DashboardOutlined,
  RiseOutlined,
  FallOutlined,
  ExperimentOutlined,
  MedicineBoxOutlined,
  HeartOutlined,
  TeamOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
  DollarOutlined,
  FileTextOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  "fa-building": BankOutlined,
  "fa-code-branch": BranchesOutlined,
  "fa-folder": FolderOutlined,
  "fa-folder-open": FolderOpenOutlined,
  "fa-folder-tree": ApartmentOutlined,
  "fa-cube": ApartmentOutlined,
  "fa-users": TeamOutlined,
  "fa-user-group": UsergroupAddOutlined,
  "fa-user": UserOutlined,
  "fa-flask": ExperimentOutlined,
  "fa-sort": SwapOutlined,
  "fa-chart-bar": BarChartOutlined,
  "fa-chart-line": LineChartOutlined,
  "fa-chart-pie": PieChartOutlined,
  "fa-chart-area": AreaChartOutlined,
  "fa-heart": HeartOutlined,
  "fa-file": FileTextOutlined,
  "fa-file-lines": FileTextOutlined,
  "fa-calendar": CalendarOutlined,
  "fa-circle-check": CheckCircleOutlined,
};

const hasIcon = (name: string): name is keyof typeof icons =>
  Object.prototype.hasOwnProperty.call(icons, name);

export default function LegacyIcon({ name }: { name?: unknown }) {
  const key =
    typeof name === "string"
      ? name.split(/\s+/).find(hasIcon) || `fa-${name}`
      : "";
  const Icon = hasIcon(key) ? icons[key] : FolderOutlined;
  return <Icon aria-hidden="true" className="mp-legacy-icon" />;
}
