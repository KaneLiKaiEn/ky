import { useMemo, useState } from "react";
import { App, Button, Input, Space, Spin } from "antd";
import { CloseOutlined, SearchOutlined, EditOutlined } from "@ant-design/icons";
import {
  QRCODE_CARD_TYPE,
  useReadCard,
  type ReadCardMethod,
} from "./hooks/useReadCard";
import { retrievePatientList2API } from "./api/patient";
import { renderMenuIcon } from "./utils/renderMenuIcon";
import type { PatientRow } from "./types/patient";
import type { ReadCardHeaderProps } from "./types";
import PatientSearchModal from "./PatientSearchModal";

export type { ReadCardHeaderProps } from "./types";

const calcAge = (birthDate?: string): number | null => {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age >= 0 ? age : null;
};

const PatientSummary: React.FC<{
  patient: PatientRow;
  onClear?: () => void;
}> = ({ patient, onClear }) => {
  const age = calcAge(patient.birth_date);
  const ageText = age != null ? `${age}岁` : null;

  return (
    <div className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden px-3">
      <span className="shrink-0">{patient.patient_name || "-"}</span>
      <span className="shrink-0 opacity-90">
        {[patient.patient_gender, ageText].filter(Boolean).join(" ") || "-"}
      </span>
      {patient.patient_idno ? (
        <span
          className="min-w-0 truncate opacity-90"
          title={patient.patient_idno}
        >
          {patient.patient_idno}
        </span>
      ) : null}
      {patient.patient_telno ? (
        <span className="shrink-0 opacity-90">{patient.patient_telno}</span>
      ) : null}
      {onClear ? (
        <Button
          type="text"
          size="small"
          shape="circle"
          icon={<CloseOutlined />}
          title="清空患者"
          aria-label="清空患者"
          className="ms-1! h-5! w-5! min-w-5!"
          onClick={onClear}
        />
      ) : null}
    </div>
  );
};

/**
 * 通用读卡条：内部完成读卡方式拉取、扫码读卡、设备读卡、患者检索。
 * 父组件只需传入 patient 展示，并通过 onPatientLoaded / onClear / onEditInfo 处理业务数据。
 */
const ReadCardHeader: React.FC<ReadCardHeaderProps> = ({
  patient,
  className,
  onPatientLoaded,
  onReadInfo,
  onClear,
  onEditInfo,
  autoInsert,
  autoUpdate,
  showPatientActions = true,
  showPatientSummary = true,
  extra,
}) => {
  const { message } = App.useApp();
  const [readNo, setReadNo] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchSelecting, setSearchSelecting] = useState(false);
  const [searchModalKeyword, setSearchModalKeyword] = useState("");
  const [searchList, setSearchList] = useState<PatientRow[]>([]);

  const { methods, loadingMethods, reading, readByScan, readByDevice, loadByPatientId } =
    useReadCard({
      autoInsert,
      autoUpdate,
      onPatientLoaded,
      onReadInfo,
    });

  const qrMethod = useMemo(
    () => methods.find((m) => m.card_type === QRCODE_CARD_TYPE),
    [methods],
  );

  const deviceMethods = useMemo(
    () => methods.filter((m) => m.card_type !== QRCODE_CARD_TYPE),
    [methods],
  );

  const busy = loadingMethods || reading || searchLoading || searchSelecting;

  const handleScanSubmit = async () => {
    if (!qrMethod || busy) return;
    const result = await readByScan(readNo, qrMethod);
    if (result) setReadNo("");
  };

  const handleSearchSubmit = async () => {
    if (busy) return;
    const trimmed = searchKeyword.trim();
    if (!trimmed) {
      message.warning("请输入检索条件");
      return;
    }

    setSearchModalKeyword(trimmed);
    setSearchLoading(true);
    const hide = message.loading("检索中...", 0);
    try {
      const res = await retrievePatientList2API({
        retrieve_input: trimmed,
        retrieve_limit: 50,
        column_list: "*",
      });
      const list = res.patient_list ?? [];
      if (!list.length) {
        message.info("未检索到患者");
        return;
      }
      setSearchList(list);
      setSearchOpen(true);
    } catch {
      message.error("检索患者失败");
    } finally {
      hide();
      setSearchLoading(false);
    }
  };

  const handleSelectPatient = async (row: PatientRow) => {
    if (row.patient_id == null) {
      message.warning("该患者缺少患者ID");
      return;
    }

    setSearchSelecting(true);
    try {
      const data = await loadByPatientId(row.patient_id);
      if (data) {
        setSearchOpen(false);
        setSearchList([]);
      }
    } finally {
      setSearchSelecting(false);
    }
  };

  const handleMethodClick = (method: ReadCardMethod) => {
    if (busy) return;
    void readByDevice(method);
  };

  const handleEditInfo = () => {
    if (!patient?.patient_id) {
      message.warning("请先读取患者");
      return;
    }
    onEditInfo?.();
  };

  return (
    <>
      <div
        className={[
          "flex h-10 shrink-0 items-center gap-2 px-2 bg-(--app-theme-bg-container)",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <Spin spinning={busy} size="small">
          <div className="flex items-center gap-2">
            {qrMethod ? (
              <div className="w-[240px]">
                <Space.Compact className="w-full">
                  <Space.Addon>患者</Space.Addon>
                  <Input
                    autoFocus
                    value={readNo}
                    disabled={busy}
                    placeholder="扫码"
                    allowClear
                    onChange={(e) => setReadNo(e.target.value)}
                    onPressEnter={() => void handleScanSubmit()}
                  />
                </Space.Compact>
              </div>
            ) : null}

            {deviceMethods.map((method) => (
              <Button
                key={`${method.reader_type}-${method.card_type}`}
                disabled={busy}
                className="bg-(--app-theme-bg-container)! text-(--app-theme-text)! hover:bg-(--app-theme-bg-elevated)!"
                icon={
                  method.icon_name ? renderMenuIcon(method.icon_name) : undefined
                }
                onClick={() => handleMethodClick(method)}
              >
                {method.card_name || method.card_type}
              </Button>
            ))}
          </div>
        </Spin>

        {patient && showPatientSummary ? (
          <PatientSummary patient={patient} onClear={onClear} />
        ) : (
          <div className="min-w-0 flex-1" />
        )}

        {extra || showPatientActions ? (
          <div className="flex shrink-0 items-center gap-1">
            {extra}
            {showPatientActions ? (
              <>
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  className="hover:bg-(--app-theme-bg-container)/15!"
                  disabled={!patient}
                  onClick={handleEditInfo}
                >
                  编辑信息
                </Button>
                <Input
                  allowClear
                  disabled={busy}
                  prefix={<SearchOutlined className="opacity-60" />}
                  placeholder="搜索患者"
                  value={searchKeyword}
                  className="w-[180px]"
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onPressEnter={() => void handleSearchSubmit()}
                />
              </>
            ) : null}
          </div>
        ) : null}
      </div>

      {showPatientActions ? (
        <PatientSearchModal
          open={searchOpen}
          loading={searchLoading}
          selecting={searchSelecting}
          keyword={searchModalKeyword}
          dataSource={searchList}
          onClose={() => {
            if (searchSelecting) return;
            setSearchOpen(false);
          }}
          onSelect={(row) => void handleSelectPatient(row)}
        />
      ) : null}
    </>
  );
};

export default ReadCardHeader;
