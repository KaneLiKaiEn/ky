import React, { useEffect, useMemo, useState } from "react";
import { message } from "antd";
import dayjs from "dayjs";
import {
  getAllergyInfo,
  getLatestSurgeryTime,
  getPatientPropertyAPI,
  GetObserveLatest,
} from "../api";
import { fetchSessionInfo } from "../utils/session";

interface PatientDetailProps {
  patient: any; //床头卡患者详情信息
  bedNumber?: string;
}

function DetailField({
  label,
  value,
  fullWidth,
  title,
}: {
  label: string;
  value?: React.ReactNode;
  fullWidth?: boolean;
  title?: string;
}) {
  return (
    <div className={`flex min-w-0 ${fullWidth ? "w-full" : "w-1/2 pr-1"}`}>
      <span className="font-medium text-gray-800 whitespace-nowrap shrink-0">
        {label}：
      </span>
      <span
        className="text-gray-600 truncate min-w-0 flex-1"
        title={title ?? (typeof value === "string" ? value : undefined)}
      >
        {value ?? ""}
      </span>
    </div>
  );
}

const formatPlanTime = (time?: string | null): string => {
  if (!time) return "";
  const parsed = dayjs(time);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD HH:mm") : time;
};

const formatContact = (contact?: {
  contact_name?: string;
  contact_kinship?: string;
} | null): string => {
  if (!contact) return "";
  const parts = [contact.contact_name, contact.contact_kinship].filter(
    Boolean,
  );
  return parts.join(" ");
};

export default function PatientDetail({
  patient,
  bedNumber,
}: PatientDetailProps) {
  // 入院天数，如果时间为空字符串，就不显示天数
  const reg_days = patient.reg_time
    ? dayjs()
        .startOf("day")
        .diff(dayjs(patient.reg_time).startOf("day"), "day") + 1
    : "";

  const [latestVitalSigns, setLatestVitalSigns] = useState<any[]>([]);
  const getLatestVitalSigns = async () => {
    try {
      const session = await fetchSessionInfo();
      const res = await GetObserveLatest({
        visit_id: patient.visit_id,
        org_id: Number(session?.org_id),
      });
      if (res.code !== 0) {
        message.error(res.message + res.hint);
        return;
      }
      setLatestVitalSigns(res.row_list || []);
    } catch (error) {}
  };

  const vitalSignsMap = useMemo(() => {
    const map: Record<string, string> = {};
    latestVitalSigns.forEach((item) => {
      if (item.elem_name === "体温" || item.elem_name === "Temp")
        map["体温"] = `${item.observe_value}${item.elem_unit || "℃"}`;
      if (item.elem_name === "心率" || item.elem_name === "HR")
        map["心率"] = `${item.observe_value}${item.elem_unit || "次/分"}`;
      if (
        item.elem_name === "血氧" ||
        item.elem_name === "SPO2" ||
        item.elem_name === "SpO2"
      )
        map["血氧"] = `${item.observe_value}${item.elem_unit || "%"}`;
      if (item.elem_name === "脉搏")
        map["脉搏"] = `${item.observe_value}${item.elem_unit || "次/分"}`;
      if (item.elem_name === "呼吸")
        map["呼吸"] = `${item.observe_value}${item.elem_unit || "次/分"}`;
      if (item.elem_name === "血压" || item.elem_name === "NBP") {
        map["血压"] = `${item.observe_value}${item.elem_unit || "mmHg"}`;
      }
      if (item.elem_name === "血糖值" || item.elem_name === "GLU") {
        map["血糖值"] = `${item.observe_value}${item.elem_unit || "mg/dL"}`;
      }
    });
    return map;
  }, [latestVitalSigns]);

  const [allergyInfo, setAllergyInfo] = useState<string>("");
  const getAllergy = async () => {
    try {
      const res = await getAllergyInfo({
        visit_id: patient.visit_id,
      });
      if (res.code !== 0) {
        message.error(res.message + res.hint);
        return;
      }
      setAllergyInfo(res.allergy_info || "");
    } catch (error) {}
  };

  const [postOp_days, setPostOp_days] = useState<number | null>(null);
  const [planTime, setPlanTime] = useState("");
  const [planName, setPlanName] = useState("");
  const [contactText, setContactText] = useState("");
  const [contactTelno, setContactTelno] = useState("");
  const [addressText, setAddressText] = useState("");

  const getOpsList = async () => {
    try {
      const res = await getLatestSurgeryTime({
        visit_id: patient.visit_id,
      });

      if (res.code !== 0) {
        message.error(res.message + res.hint);
        setPlanTime("");
        setPlanName("");
        setPostOp_days(null);
        return;
      }

      const surgeryList: any[] = res.row_list || [];
      if (!surgeryList.length) {
        setPlanTime("");
        setPlanName("");
        setPostOp_days(null);
        return;
      }

      // 手术信息：取计划时间最新的一条
      const latestPlan = [...surgeryList].sort((a, b) => {
        const ta = dayjs(a.plan_time).valueOf();
        const tb = dayjs(b.plan_time).valueOf();
        const aValid = Number.isFinite(ta);
        const bValid = Number.isFinite(tb);
        if (aValid && bValid) return tb - ta;
        if (aValid) return -1;
        if (bValid) return 1;
        return 0;
      })[0];
      setPlanTime(formatPlanTime(latestPlan?.plan_time));
      setPlanName(latestPlan?.plan_name || "");

      // 术后天数：已结束手术，按 ops_end 最新一条
      const validSurgeries = surgeryList.filter(
        (item: any) => item.ops_end && !isNaN(new Date(item.ops_end).getTime()),
      );
      if (!validSurgeries.length) {
        setPostOp_days(null);
        return;
      }
      const latestSurgery = validSurgeries.sort((a: any, b: any) => {
        return new Date(b.ops_end).getTime() - new Date(a.ops_end).getTime();
      })[0];
      const postOpDays = Math.max(
        0,
        dayjs()
          .startOf("day")
          .diff(dayjs(latestSurgery.ops_end).startOf("day"), "day") + 1,
      );
      setPostOp_days(postOpDays);
    } catch (error) {
      console.error("获取手术列表失败:", error);
      setPlanTime("");
      setPlanName("");
      setPostOp_days(null);
    }
  };

  const getPatientProperty = async () => {
    if (!patient?.patient_id) {
      setContactText("");
      setContactTelno("");
      setAddressText("");
      return;
    }
    try {
      const res = await getPatientPropertyAPI({
        patient_id: patient.patient_id,
        column_address: "*",
        column_contact: "*",
      });
      if (res.code !== 0) {
        message.error(res.message + res.hint);
        setContactText("");
        setContactTelno("");
        setAddressText("");
        return;
      }
      const contactList = Array.isArray(res.contact_list)
        ? res.contact_list
        : [];
      const addressList = Array.isArray(res.address_list)
        ? res.address_list
        : [];
      const firstContact = contactList[0];
      setContactText(formatContact(firstContact));
      setContactTelno(firstContact?.contact_telno || "");
      const contactAddress =
        addressList.find((item: any) => item?.address_type === "联系地址") ||
        null;
      setAddressText(contactAddress?.address_full || "");
    } catch (error) {
      setContactText("");
      setContactTelno("");
      setAddressText("");
    }
  };

  useEffect(() => {
    if (!patient.visit_id) {
      return;
    }
    getLatestVitalSigns();
    getAllergy();
    getOpsList();
    getPatientProperty();
  }, [patient.visit_id, patient.patient_id]);

  const admissionTime = patient.reg_time
    ? dayjs(patient.reg_time).format("YYYY-MM-DD HH:mm")
    : "";

  return (
    <div className="w-full text-[13px] leading-[20px]">
      {patient && (
        <div className="space-y-2">
          <div className="text-[15px] font-bold text-gray-800">患者详情</div>

          <div className="flex flex-wrap gap-y-1">
            <DetailField label="床位号" value={bedNumber || ""} />
            <DetailField label="姓名" value={patient.patient_name} />
            <DetailField label="性别" value={patient.patient_gender} />
            <DetailField
              label="年龄"
              value={patient.age_year ? `${patient.age_year}岁` : ""}
            />
            <DetailField
              label="入院天数"
              value={reg_days ? `${reg_days}天` : ""}
            />
            <DetailField
              label="术后天数"
              value={postOp_days ? `${postOp_days}天` : ""}
            />
            <DetailField
              label="入院时间"
              value={admissionTime}
              fullWidth
              title={admissionTime}
            />
            <DetailField
              label="最新诊断"
              value={patient.diag_info || ""}
              fullWidth
              title={patient.diag_info || ""}
            />
            <DetailField
              label="过敏史"
              value={allergyInfo}
              fullWidth
              title={allergyInfo}
            />
            <DetailField
              label="手术时间"
              value={planTime}
              fullWidth
              title={planTime}
            />
            <DetailField
              label="手术名称"
              value={planName}
              fullWidth
              title={planName}
            />
            <DetailField
              label="联系人"
              value={contactText}
              fullWidth
              title={contactText}
            />
            <DetailField
              label="联系电话"
              value={contactTelno}
              fullWidth
              title={contactTelno}
            />
            <DetailField
              label="联系地址"
              value={addressText}
              fullWidth
              title={addressText}
            />
          </div>

          <div className="pt-1 text-[14px] font-bold text-gray-800">
            实时体征
          </div>
          <div className="flex flex-wrap gap-y-1">
            <DetailField label="体温" value={vitalSignsMap["体温"] || ""} />
            <DetailField label="呼吸" value={vitalSignsMap["呼吸"] || ""} />
            <DetailField label="血压" value={vitalSignsMap["血压"] || ""} />
            <DetailField label="血氧" value={vitalSignsMap["血氧"] || ""} />
            <DetailField label="心率" value={vitalSignsMap["心率"] || ""} />
            <DetailField label="脉搏" value={vitalSignsMap["脉搏"] || ""} />
          </div>
        </div>
      )}
    </div>
  );
}
