import React, { useState } from "react";
import { Dropdown, MenuProps, message, Tag } from "antd";
import dayjs from "dayjs";
import { getSessionId } from "comm/session";
import { print } from "../utils/print";
import { fetchSessionInfo } from "../utils/session";
import { PreDischarge } from "./PreDischarge";
import { EmergencyAdmitDept } from "./EmergencyAdmitDept";
import { UpdateAdmissionTimeModal } from "./UpdateAdmissionTimeModal";
import { ChangeBedModal } from "./ChangeBedModal";
import { TransferDeptModal } from "./TransferDeptModal";
import { getInsuranceTagInfo } from "../utils/insuranceTag";

const formatMoney = (value?: number | string | null): string => {
  if (value == null || value === "") return "";
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return "-";
  return n.toFixed(2);
};

const formatDateTime = (time?: string | null): string => {
  if (!time) return "";
  const parsed = dayjs(time);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD HH:mm") : time;
};

interface BedCardProps {
  bed: any;
  onClick?: (bed: any) => void;
  onSuccess?: (bed: any) => void;
}

export default function BedCard({ bed, onClick, onSuccess }: BedCardProps) {
  const getBedStatus = () => {
    if (bed?.is_unassigned) return "unassigned";
    // 增加 visit_id 兜底判断，兼容结构化数据丢失 visit_info 的场景
    if (bed?.visit_id || bed?.visit_info) return "occupied";
    if (bed?.appoint_info) return "appointed";
    return "empty";
  };

  const bedStatus = getBedStatus();
  const isOccupied = bedStatus === "occupied";
  const isEmpty = bedStatus === "empty";

  const getStatusConfig = () => {
    switch (bedStatus) {
      case "unassigned":
        return {
          text: "待分配",
          status: "warning" as const,
          color: "text-orange-500",
        };
      case "occupied":
        return {
          text: "已占用",
          status: "processing" as const,
          color: "text-blue-600",
        };
      case "appointed":
        return {
          text: "已预约",
          status: "warning" as const,
          color: "text-orange-500",
        };
      case "empty":
        return {
          text: "空床",
          status: "success" as const,
          color: "text-green-500",
        };
      default:
        return {
          text: "未知",
          status: "default" as const,
          color: "text-gray-500",
        };
    }
  };

  const statusConfig = getStatusConfig();
  const insuranceTag = getInsuranceTagInfo(bed?.status_info);
  const statusProperty = bed?.status_info ?? bed?.status_property;
  /** 仅保险名称为「医保」时展示：区划 3503 开头为本地，否则异地 */
  const medicareDistrictTag =
    statusProperty?.insurance_name === "医保"
      ? String(statusProperty?.insurance_district ?? "").startsWith("3502")
        ? { text: "本地", color: "cyan" as const }
        : { text: "异地", color: "blue" as const }
      : null;
  /** 与科室患者列表一致：预交金 + 担保金 < 0 显示欠费标识 */
  const prepayAmount = Number(bed?.prepay_amount ?? 0);
  const guaranteeAmount = Number(bed?.guarantee_amount ?? 0);
  const isArrears =
    Number.isFinite(prepayAmount) &&
    Number.isFinite(guaranteeAmount) &&
    prepayAmount + guaranteeAmount < 0;

  const [openBedChangeModal, setOpenBedChangeModal] = useState(false);
  const [openTransferDepartmentModal, setOpenTransferDepartmentModal] =
    useState(false);
  const [openPreDischargeModal, setOpenPreDischargeModal] = useState(false);
  const [modifyAdmissionTimeModal, setModifyAdmissionTimeModal] =
    useState(false);
  const [openAppointmentModal, setOpenAppointmentModal] = useState(false);

  const handlePrintWristband = async () => {
    const sessionId = getSessionId();
    if (!sessionId) {
      message.warning("请先登录");
      return;
    }
    if (!bed?.patient_id || !bed?.visit_id) {
      message.error("患者信息不完整，无法打印腕带");
      return;
    }
    const session = await fetchSessionInfo();
    if (!session?.dept_id) {
      message.error("获取当前科室失败，无法打印腕带");
      return;
    }
    const url =
      `doc/work2/${sessionId}?org_id=${session.org_id}` +
      `&dept_id=${session.dept_id}` +
      `&user_id=${session.user_id}` +
      `&patient_id=${bed.patient_id}` +
      `&visit_id=${bed.visit_id}` +
      `&doc_type=${encodeURIComponent("其它文书")}` +
      `&doc_name=${encodeURIComponent("腕带码")}` +
      `&doc_tag=${encodeURIComponent("腕带码")}` +
      `&auto_create=1&rebuild=1`;
    await print(url);
  };

  const handlePrintVisitingCard = async () => {
    const sessionId = getSessionId();
    if (!sessionId) {
      message.warning("请先登录");
      return;
    }
    if (!bed?.patient_id || !bed?.visit_id) {
      message.error("患者信息不完整，无法打印探视卡");
      return;
    }
    const session = await fetchSessionInfo();
    if (!session?.dept_id) {
      message.error("获取当前科室失败，无法打印探视卡");
      return;
    }
    const url =
      `doc/work2/${sessionId}?org_id=${session.org_id}` +
      `&dept_id=${session.dept_id}` +
      `&user_id=${session.user_id}` +
      `&patient_id=${bed.patient_id}` +
      `&visit_id=${bed.visit_id}` +
      `&doc_type=${encodeURIComponent("其它文书")}` +
      `&doc_name=${encodeURIComponent("探视卡")}` +
      `&doc_tag=${encodeURIComponent("探视卡")}` +
      `&auto_create=1&rebuild=1`;
    await print(url);
  };

  const getActionMenuItems = (): MenuProps["items"] => {
    if (isEmpty || bed?.is_unassigned) return [];
    return [
      {
        key: "changeBed",
        label: "转床",
        onClick: () => setOpenBedChangeModal(true),
      },
      {
        key: "transferDept",
        label: "转科",
        onClick: () => setOpenTransferDepartmentModal(true),
      },
      {
        key: "discharge",
        label: "出院",
        onClick: () => setOpenPreDischargeModal(true),
      },
      {
        key: "updateAdmissionTime",
        label: "修改入科时间",
        onClick: () => setModifyAdmissionTimeModal(true),
      },
    ];
  };

  const actionMenuItems = getActionMenuItems();
  const hasActionMenu = actionMenuItems && actionMenuItems.length > 0;

  const getTagColor = (bgColor: string): string => {
    const colorMap: Record<string, string> = {
      "bg-primary": "#6366f1",
      "bg-info": "#3b82f6",
      "bg-success": "#22c55e",
      "bg-warning": "#f59e0b",
      "bg-danger": "#ef4444",
      "bg-secondary": "#6b7280",
    };
    return colorMap[bgColor] || "#6b7280";
  };

  return (
    <div
      className={`relative w-74 min-h-[290px] h-full flex-1 flex flex-col border-2 rounded-lg overflow-hidden cursor-pointer 
         transition-all duration-200 hover:shadow-lg
         ${
           bed?.is_unassigned
             ? "border-orange-300 bg-orange-50"
             : isEmpty
               ? "border-green-300 bg-green-50"
               : "border-blue-500 bg-blue-50"
         }`}
      onClick={() => onClick?.(bed)}
    >
      <div
        className={`flex items-center justify-between px-2 py-1 shrink-0 ${
          bed?.is_unassigned
            ? "bg-orange-100"
            : isEmpty
              ? "bg-green-100"
              : "bg-blue-100"
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={` text-[14px] font-bold ${statusConfig.color}`}>
            {bed?.is_unassigned ? "待分配" : (bed?.bed_no ?? "--")}床
          </span>
          {insuranceTag ? (
            <Tag
              color={insuranceTag.color}
              className="m-0! shrink-0 !text-[10px] !leading-4 !px-1.5 !py-0 !rounded-sm"
              title={insuranceTag.text}
            >
              {insuranceTag.text}
            </Tag>
          ) : null}
          {medicareDistrictTag ? (
            <Tag
              color={medicareDistrictTag.color}
              className="m-0! shrink-0 !text-[10px] !leading-4 !px-1.5 !py-0 !rounded-sm"
            >
              {medicareDistrictTag.text}
            </Tag>
          ) : null}
        </div>
        {hasActionMenu && (
          <Dropdown menu={{ items: actionMenuItems }} trigger={["click"]}>
            <button
              onClick={(e) => e.stopPropagation()}
              className={`flex items-center justify-center w-10 h-10 rounded hover:bg-black/5 transition-colors text-sm ${statusConfig.color}`}
              style={{ background: "transparent", border: "none" }}
            >
              操作
            </button>
          </Dropdown>
        )}
      </div>

      {isEmpty ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <span className="text-green-600 text-lg ">空床</span>
        </div>
      ) : (
        <div className="flex-1 flex flex-col p-2 space-y-2">
          <div className="flex flex-wrap text-[13px] leading-[20px]">
            <div className="flex w-1/2 min-w-0 pr-1">
              <span className="font-medium text-gray-800 whitespace-nowrap">
                姓名：
              </span>
              <span
                className="text-gray-600 truncate min-w-0 flex-1"
                title={bed?.patient_name || ""}
              >
                {bed?.patient_name || ""}
              </span>
            </div>
            <div className="flex w-1/2 min-w-0">
              <span className="font-medium text-gray-800 whitespace-nowrap">
                性别：
              </span>
              <span className="text-gray-600 truncate">
                {bed?.patient_gender || ""}
              </span>
            </div>
            <div className="flex w-1/2 min-w-0 pr-1">
              <span className="font-medium text-gray-800 whitespace-nowrap">
                年龄：
              </span>
              <span className="text-gray-600 truncate">{bed?.age_full}</span>
            </div>
            <div className="flex w-1/2 min-w-0">
              <span className="font-medium text-gray-800 whitespace-nowrap">
                住院号：
              </span>
              <span
                className="text-gray-600 truncate min-w-0 flex-1"
                title={bed?.visit_no || ""}
              >
                {bed?.visit_no || ""}
              </span>
            </div>
            <div className="flex w-full min-w-0">
              <span className="font-medium text-gray-800 whitespace-nowrap">
                科室：
              </span>
              <span
                className="text-gray-600 truncate min-w-0 flex-1"
                title={bed?.dept_name || ""}
              >
                {bed?.dept_name || ""}
              </span>
            </div>
            <div className="flex w-full min-w-0">
              <span className="font-medium text-gray-700 whitespace-nowrap">
                诊断：
              </span>
              <span
                className="text-gray-600 truncate min-w-0 flex-1"
                title={bed?.diag_info || ""}
              >
                {bed?.diag_info
                  ? bed.diag_info.length > 8
                    ? `${bed.diag_info.substring(0, 18)}`
                    : bed.diag_info
                  : ""}
              </span>
            </div>
            <div className="flex w-1/2 min-w-0 pr-1">
              <span className="whitespace-nowrap">主管医生：</span>
              <span
                className="text-gray-600 truncate min-w-0 flex-1"
                title={bed?.doctor_name || ""}
              >
                {bed?.doctor_name || ""}
              </span>
            </div>
            <div className="flex w-1/2 min-w-0">
              <span className="whitespace-nowrap">责任护士：</span>
              <span
                className="text-gray-600 truncate min-w-0 flex-1"
                title={bed?.nurse_name || ""}
              >
                {bed?.nurse_name || ""}
              </span>
            </div>
            <div className="flex w-1/2 min-w-0 pr-1">
              <span className="font-medium text-gray-800 whitespace-nowrap">
                病情：
              </span>
              <span
                className="text-gray-600 truncate min-w-0 flex-1"
                title={bed?.health_level || ""}
              >
                {bed?.health_level || ""}
              </span>
            </div>
            <div className="flex w-1/2 min-w-0">
              <span className="font-medium text-gray-800 whitespace-nowrap">
                护理等级：
              </span>
              <span
                className="text-gray-600 truncate min-w-0 flex-1"
                title={bed?.care_level_name || ""}
              >
                {bed?.care_level_name || ""}
              </span>
            </div>
            <div className="flex w-1/2 min-w-0 pr-1">
              <span className="font-medium text-gray-800 whitespace-nowrap">
                担保金：
              </span>
              <span className="text-gray-600 truncate min-w-0 flex-1">
                {formatMoney(bed?.guarantee_amount)}
              </span>
            </div>
            <div className="flex w-1/2 min-w-0">
              <span className="font-medium text-gray-800 whitespace-nowrap">
                预交金：
              </span>
              <span className="text-gray-600 truncate min-w-0 flex-1">
                {formatMoney(bed?.prepay_amount)}
              </span>
            </div>
            <div className="flex w-1/2 min-w-0 pr-1">
              <span className="font-medium text-gray-800 whitespace-nowrap">
                已扣费：
              </span>
              <span className="text-gray-600 truncate min-w-0 flex-1">
                {formatMoney(bed?.charge_amount)}
              </span>
            </div>
            <div className="flex w-1/2 min-w-0 pr-1">
              <span className="font-medium text-gray-800 whitespace-nowrap">
                累计费用：
              </span>
              <span className="text-gray-600 truncate min-w-0 flex-1">
                {formatMoney(bed?.total_amount)}
              </span>
            </div>
            <div className="flex w-1/2 min-w-0">
              <span className="font-medium text-gray-800 whitespace-nowrap">
                可用余额：
              </span>
              <span className="text-gray-600 truncate min-w-0 flex-1">
                {formatMoney(bed?.available_amount)}
              </span>
            </div>
            {/* <div className="flex w-full min-w-0">
              <span className="font-medium text-gray-800 whitespace-nowrap">
                入院时间：
              </span>
              <span
                className="text-gray-600 truncate min-w-0 flex-1"
                title={formatDateTime(bed?.reg_time)}
              >
                {formatDateTime(bed?.reg_time)}
              </span>
            </div> */}
            {isArrears ? (
              <div className="flex w-full min-w-0 items-center">
                <span className="font-medium text-gray-800 whitespace-nowrap">
                  标识：
                </span>
                <Tag
                  color="red"
                  className="m-0! shrink-0 !text-[10px] !leading-4 !px-1.5 !py-0 !rounded-sm"
                >
                  欠
                </Tag>
              </div>
            ) : null}
            <div className="flex w-full min-w-0">
              <span className="font-medium text-gray-800 whitespace-nowrap">
                入科时间：
              </span>
              <span
                className="text-gray-600 truncate min-w-0 flex-1"
                title={formatDateTime(bed?.admission_time)}
              >
                {formatDateTime(bed?.admission_time)}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap">
            {bed?.isolation_tags?.length > 0 && (
              <div className="flex items-center ml-[2px] flex-wrap gap-1">
                {bed.isolation_tags.map((item: any, index: number) => {
                  const color = getTagColor(item.bg_color);
                  const text = item.tag_content?.substring(0, 1) || "?";
                  return (
                    <div
                      key={index}
                      className="
            w-6 h-6 
            rounded-full 
            flex items-center justify-center 
            text-xs font-bold 
            bg-white/95 
            box-border
            transition-transform hover:scale-110 
            cursor-default
          "
                      style={{
                        border: `2px solid ${color}`,
                        color: color,
                      }}
                      title={item.tag_title}
                    >
                      {text}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {bed?.is_unassigned ? (
            <div className="flex gap-1 mt-auto pt-2">
              <button
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-xs py-1.5 rounded border-0 outline-none transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenBedChangeModal(true);
                }}
              >
                分配床位
              </button>
            </div>
          ) : null}

          {(isOccupied || bed?.is_unassigned) && (
            <div
              className={`flex gap-1 ${bed?.is_unassigned ? "" : "mt-auto pt-2"}`}
            >
              <button
                className="flex-1 bg-purple-400 hover:bg-purple-500 text-white text-xs py-1.5 rounded border-0 outline-none transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrintWristband();
                }}
              >
                腕带
              </button>
              <button
                className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white text-xs py-1.5 rounded border-0 outline-none transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrintVisitingCard();
                }}
              >
                探视卡
              </button>
            </div>
          )}
        </div>
      )}

      <ChangeBedModal
        open={openBedChangeModal}
        onCancel={() => setOpenBedChangeModal(false)}
        bed={bed}
        onSuccess={() => onSuccess?.(bed)}
      />

      <TransferDeptModal
        open={openTransferDepartmentModal}
        onCancel={() => setOpenTransferDepartmentModal(false)}
        bed={bed}
        onSuccess={() => onSuccess?.(bed)}
      />

      <PreDischarge
        open={openPreDischargeModal}
        onCancel={() => setOpenPreDischargeModal(false)}
        bed={bed}
        onSuccess={() => onSuccess?.(bed)}
      />

      <EmergencyAdmitDept
        open={openAppointmentModal}
        onCancel={() => setOpenAppointmentModal(false)}
        bed={bed}
        onSuccess={() => onSuccess?.(bed)}
      />

      <UpdateAdmissionTimeModal
        open={modifyAdmissionTimeModal}
        onCancel={() => setModifyAdmissionTimeModal(false)}
        bed={bed}
        onSuccess={() => onSuccess?.(bed)}
      />
    </div>
  );
}
