import React, { useCallback, useEffect, useMemo, useState } from "react";
import { App, Button, Empty, Input, Skeleton, Tag, Tooltip } from "antd";
import {
  FileTextOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { getSessionId, setActiveId } from "comm/session";
import { getSessionInfo } from "@/api/auth";
import {
  getAllergyInfo2API,
  getClinicPropertyAPI,
  getIpListAPI,
  getVisitPropertyAPI,
} from "@/api/visit";
import type { PatientItem, PatientTag } from "@/types/visit";
import "./index.scss";

/** 在院天数：当前日期 - 入院日期（入院当天算第 1 天） */
const calcInHospitalDays = (admissionTime?: string): number => {
  if (!admissionTime) return 0;
  const admissionDate = dayjs(admissionTime);
  if (!admissionDate.isValid()) return 0;
  return Math.max(
    1,
    dayjs().startOf("day").diff(admissionDate.startOf("day"), "day") + 1,
  );
};

/** 解析住院天数标签 */
const getHospitalDaysTag = (days: number): PatientTag => {
  if (days === 1) {
    return { label: "今日入", color: "volcano" };
  }
  if (days === 2) {
    return { label: "昨日入", color: "success" };
  }
  return { label: `住院 ${days} 天`, color: "purple" };
};

/** 解析过敏标签 */
const parseAllergyTags = (allergyInfo?: string): PatientTag[] => {
  if (!allergyInfo?.trim()) return [];
  return allergyInfo
    .split(/[,，、;；]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((label) => ({
      label,
      color: label === "未发现" ? "default" : "volcano",
    }));
};

const MyPatientWidget: React.FC = () => {
  const { message } = App.useApp();
  const [patients, setPatients] = useState<PatientItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [keyword, setKeyword] = useState("");

  const loadData = useCallback(async () => {
    try {
      const sessionRes = await getSessionInfo({
        session_id: getSessionId() ?? undefined,
      });
      const session = sessionRes.session_info;
      const userId = session?.user_id;
      if (!userId) {
        setPatients([]);
        return;
      }

      // 拉取在院患者就诊列表（scope: mine）
      const listRes = await getIpListAPI({
        org_id: session.org_id,
        dept_id: session.dept_id,
        user_id: userId,
        column_visit: "*",
        column_ip: "*",
      });

      const visits = (listRes.visit_list ?? []).filter(
        (v) => v.visit_id != null && v.visit_id > 0,
      );

      if (visits.length === 0) {
        setPatients([]);
        return;
      }

      // 并行拉取每个就诊项的详细数据
      const detailPromises = visits.map(async (visit): Promise<PatientItem | null> => {
        const visitId = visit.visit_id!;
        try {
          const [propRes, clinicRes] = await Promise.all([
            getVisitPropertyAPI({
              visit_id: visitId,
              column_visit: "*",
              column_ip: "*",
              column_patient: "*",
              column_status: "*",
              column_predischarge: "*",
            }).catch(() => null),
            getClinicPropertyAPI({ visit_id: visitId }).catch(() => null),
          ]);

          const vProp = propRes?.visit_property ?? visit;
          const ipProp = propRes?.ip_property;
          const pProp = propRes?.patient_property;
          const predischarge = propRes?.predischarge_property;
          const clinic = clinicRes?.clinic_property;

          const patientId = vProp?.patient_id ?? pProp?.patient_id ?? 0;

          // 若有 patient_id，拉取过敏信息
          let allergyInfo: string | undefined;
          if (patientId > 0) {
            try {
              const allergyRes = await getAllergyInfo2API({
                patient_id_list: [patientId],
                allergy_type: "*",
              });
              allergyInfo = allergyRes?.allergy_info?.[0];
            } catch {
              // 忽略过敏请求失败
            }
          }

          const admissionTime = ipProp?.admission_time || vProp?.visit_time || "";
          const days = calcInHospitalDays(admissionTime);

          // 组织状态标签
          const tags: PatientTag[] = [];
          if (predischarge?.discharge_time?.trim()) {
            tags.push({ label: "预出院", color: "orange" });
          }
          tags.push(...parseAllergyTags(allergyInfo));

          // 诊断信息
          const diagList: string[] = [];
          if (clinic?.diag_full?.trim()) {
            diagList.push(clinic.diag_full.trim());
          } else if (clinic?.diag_main?.trim()) {
            diagList.push(clinic.diag_main.trim());
          } else if (vProp?.diag_info?.trim()) {
            diagList.push(vProp.diag_info.trim());
          }

          const ageStr =
            pProp?.age_full || (pProp?.age_year ? `${pProp.age_year}岁` : "");

          return {
            visit_id: visitId,
            patient_id: patientId,
            bed_no: ipProp?.bed_no || "-",
            patient_name: pProp?.patient_name || vProp?.visit_no || `就诊 #${visitId}`,
            patient_no: vProp?.patient_no || "",
            patient_gender: pProp?.patient_gender || "",
            patient_age: pProp?.age_year || 0,
            age_full: ageStr,
            hospital_days: days,
            hospital_days_tag: days > 0 ? getHospitalDaysTag(days) : undefined,
            diag_list: diagList,
            tag_list: tags,
            admission_time: admissionTime,
            dept_name: vProp?.dept_name || ipProp?.dept_name || "",
            ward_name: ipProp?.ward_name || "",
            doctor_name: ipProp?.doctor_name || "",
          };
        } catch {
          return null;
        }
      });

      const results = await Promise.all(detailPromises);
      const validPatients = results.filter(
        (item): item is PatientItem => item !== null,
      );
      setPatients(validPatients);
    } catch {
      setPatients([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    void loadData();
  }, [loadData]);

  // 过滤后的患者列表
  const filteredPatients = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return patients;
    return patients.filter((p) => {
      const name = p.patient_name.toLowerCase();
      const bed = p.bed_no.toLowerCase();
      const diag = p.diag_list.join(" ").toLowerCase();
      const doc = (p.doctor_name ?? "").toLowerCase();
      const pno = p.patient_no.toLowerCase();
      return (
        name.includes(kw) ||
        bed.includes(kw) ||
        diag.includes(kw) ||
        doc.includes(kw) ||
        pno.includes(kw)
      );
    });
  }, [patients, keyword]);

  // 统计信息
  const stats = useMemo(() => {
    const total = patients.length;
    const todayNew = patients.filter((p) => p.hospital_days === 1).length;
    const predischarge = patients.filter((p) =>
      p.tag_list.some((t) => t.label === "预出院"),
    ).length;
    return { total, todayNew, predischarge };
  }, [patients]);

  return (
    <div className="my-patient-widget">
      {/* 顶部微工具栏 */}
      <div className="my-patient-widget__toolbar">
        <div className="my-patient-widget__toolbar-stats">
          <span className="my-patient-widget__toolbar-badge">
            在院 {stats.total} 人
          </span>
          {stats.todayNew > 0 && (
            <span className="my-patient-widget__toolbar-badge my-patient-widget__toolbar-badge--sub">
              今日新入 {stats.todayNew}
            </span>
          )}
          {stats.predischarge > 0 && (
            <span className="my-patient-widget__toolbar-badge my-patient-widget__toolbar-badge--sub">
              预出院 {stats.predischarge}
            </span>
          )}
        </div>

        <div className="my-patient-widget__toolbar-actions">
          <Input
            size="small"
            prefix={
              <SearchOutlined style={{ color: "var(--app-theme-text-secondary)" }} />
            }
            placeholder="搜索姓名 / 床号 / 诊断..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            allowClear
          />
          <Tooltip title="刷新患者列表">
            <Button
              type="text"
              size="small"
              icon={<ReloadOutlined spin={refreshing} />}
              onClick={handleRefresh}
            />
          </Tooltip>
        </div>
      </div>

      {/* 患者列表区 */}
      <div className="my-patient-widget__list">
        {loading ? (
          Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="my-patient-widget__skeleton-card">
              <Skeleton
                active
                avatar={false}
                title={{ width: "40%" }}
                paragraph={{ rows: 1, width: "80%" }}
              />
            </div>
          ))
        ) : filteredPatients.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center py-8">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={keyword ? "未搜索到匹配的患者" : "暂无在院患者"}
            >
              {keyword ? (
                <Button size="small" onClick={() => setKeyword("")}>
                  清空搜索词
                </Button>
              ) : (
                <Button size="small" icon={<ReloadOutlined />} onClick={handleRefresh}>
                  重新加载
                </Button>
              )}
            </Empty>
          </div>
        ) : (
          filteredPatients.map((patient) => {
            const diagText = patient.diag_list.length
              ? patient.diag_list.join("、")
              : "暂无主要诊断记录";

            const daysTag = patient.hospital_days_tag;

            return (
              <div
                key={patient.visit_id}
                className="my-patient-widget__card"
              >
                <div className="my-patient-widget__card-header">
                  <div className="my-patient-widget__card-main">
                    <span className="my-patient-widget__card-bed">
                      {patient.bed_no}
                    </span>
                    <span className="my-patient-widget__card-name">
                      {patient.patient_name}
                    </span>
                  </div>

                  <div className="my-patient-widget__card-meta">
                    {daysTag && (
                      <span
                        className={`my-patient-widget__card-days my-patient-widget__card-days--${daysTag.color}`}
                      >
                        {daysTag.label}
                      </span>
                    )}
                  </div>
                </div>

                {((patient.patient_gender || patient.age_full) ||
                  patient.tag_list.length > 0) && (
                  <div className="my-patient-widget__card-details">
                    {(patient.patient_gender || patient.age_full) && (
                      <span className="my-patient-widget__card-info">
                        {[patient.patient_gender, patient.age_full]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    )}
                    <div className="my-patient-widget__card-tags">
                      {patient.tag_list.map((tag, tIdx) => (
                        <Tag
                          key={tIdx}
                          color={tag.color}
                          className="m-0! px-1! text-[11px]! leading-[16px]!"
                        >
                          {tag.label}
                        </Tag>
                      ))}
                    </div>
                  </div>
                )}

                <div className="my-patient-widget__card-body">
                  <div className="my-patient-widget__card-diag" title={diagText}>
                    <FileTextOutlined className="my-patient-widget__card-diag-icon" />
                    <span>{diagText}</span>
                  </div>
                  {patient.doctor_name && (
                    <span className="my-patient-widget__card-doctor">
                      责任医生：{patient.doctor_name}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MyPatientWidget;
