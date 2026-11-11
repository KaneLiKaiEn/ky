import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { App, Button, Empty, Input, Table, Tag, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import { ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { getSessionId, onSessionIdChange } from "comm/session";
import { getSessionInfo } from "@/api/auth";
import { getAccountListAPI } from "@/api/account";
import { getBillAccount2API } from "@/api/bill";
import {
  getAllergyInfo2API,
  getClinicProperty2API,
  getIpListAPI,
  getPredischargeListAPI,
  getVisitProperty2API,
} from "@/api/visit";
import type { PatientItem, PatientTag } from "@/types/visit";
import "./index.scss";

const TABLE_HEADER_FALLBACK = 39;

const parseAmount = (value?: string | number | null): number => {
  if (value == null || value === "") return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
};

const formatMoney = (value?: number): string => {
  if (value == null || !Number.isFinite(value)) return "-";
  return value.toFixed(2);
};

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
  return { label: `${days} 天`, color: "purple" };
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

const indexByVisitId = <T extends { visit_id?: number }>(
  list?: T[],
): Map<number, T> => {
  const map = new Map<number, T>();
  for (const item of list ?? []) {
    if (item.visit_id != null && item.visit_id > 0) {
      map.set(item.visit_id, item);
    }
  }
  return map;
};

const formatAdmissionTime = (time?: string): string => {
  if (!time) return "-";
  const parsed = dayjs(time);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD HH:mm") : time;
};

const DeptPatientWidget: React.FC = () => {
  const { message } = App.useApp();
  const [patients, setPatients] = useState<PatientItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [listFilter, setListFilter] = useState<
    "all" | "todayNew" | "predischarge" | "arrears"
  >("all");
  const [workType, setWorkType] = useState("");
  const tableWrapRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(200);

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

      const nextWorkType = (session.work_type ?? "").toUpperCase();
      setWorkType(nextWorkType);
      const listParams = {
        org_id: session.org_id,
        column_visit: "*",
        column_ip: "*",
        ...(nextWorkType === "NURSE"
          ? { ward_id: session.dept_id }
          : { dept_id: session.dept_id }),
        exclude_preadmission: true,
      };

      const listRes = await getIpListAPI(listParams);

      const visits = (listRes.visit_list ?? []).filter(
        (v) => v.visit_id != null && v.visit_id > 0,
      );

      if (visits.length === 0) {
        setPatients([]);
        return;
      }

      const visitIdList = visits.map((v) => v.visit_id!);

      const [propRes, clinicRes] = await Promise.all([
        getVisitProperty2API({
          visit_id_list: visitIdList,
          column_visit: "*",
          column_ip: "*",
          column_patient: "*",
          column_status: "*",
        }).catch(() => null),
        getClinicProperty2API({
          visit_id_list: visitIdList,
        }).catch(() => null),
      ]);

      const visitById = indexByVisitId(propRes?.visit_list);
      const ipByVisitId = indexByVisitId([
        ...(listRes.ip_list ?? []),
        ...(propRes?.ip_list ?? []),
      ]);
      const patientByVisitId = indexByVisitId(propRes?.patient_list);
      const clinicByVisitId = indexByVisitId(clinicRes?.row_list);
      const visitFallbackById = indexByVisitId(visits);

      const predischargeVisitIds = new Set<number>();
      if (session.dept_id) {
        try {
          const predischargeRes = await getPredischargeListAPI({
            ...(nextWorkType === "NURSE"
              ? { ward_id: session.dept_id }
              : { dept_id: session.dept_id }),
            column_list: "*",
          });
          for (const row of predischargeRes?.row_list ?? []) {
            if (row.visit_id != null && row.visit_id > 0) {
              predischargeVisitIds.add(row.visit_id);
            }
          }
        } catch {
          // 忽略预出院列表失败
        }
      }

      const patientIdList = [
        ...new Set(
          visitIdList
            .map((visitId) => {
              const vProp =
                visitById.get(visitId) ?? visitFallbackById.get(visitId);
              const pProp = patientByVisitId.get(visitId);
              return vProp?.patient_id ?? pProp?.patient_id ?? 0;
            })
            .filter((id): id is number => id > 0),
        ),
      ];

      let allergyByPatientId = new Map<number, string | undefined>();
      if (patientIdList.length > 0) {
        try {
          const allergyRes = await getAllergyInfo2API({
            patient_id_list: patientIdList,
            allergy_type: "*",
          });
          allergyByPatientId = new Map(
            patientIdList.map((id, idx) => [
              id,
              allergyRes?.allergy_info?.[idx],
            ]),
          );
        } catch {
          // 忽略过敏请求失败
        }
      }

      const [accountRes, billRes] = await Promise.all([
        getAccountListAPI({
          visit_id_list: visitIdList,
          include_prepay: true,
          include_guarantee: true,
        }).catch(() => null),
        getBillAccount2API({
          visit_id_list: visitIdList,
          bill_type: "*",
        }).catch(() => null),
      ]);

      const accountByVisitId = indexByVisitId(accountRes?.row_list);
      const billByVisitId = new Map(
        visitIdList.map((visitId, idx) => [
          visitId,
          {
            bill_amount: billRes?.bill_amount?.[idx],
            charge_amount: billRes?.charge_amount?.[idx],
          },
        ]),
      );

      const validPatients: PatientItem[] = visitIdList.map((visitId) => {
        const vProp = visitById.get(visitId) ?? visitFallbackById.get(visitId);
        const ipProp = ipByVisitId.get(visitId);
        const pProp = patientByVisitId.get(visitId);
        const clinic = clinicByVisitId.get(visitId);
        const patientId = vProp?.patient_id ?? pProp?.patient_id ?? 0;
        const allergyInfo = allergyByPatientId.get(patientId);
        const accountRow = accountByVisitId.get(visitId);
        const billRow = billByVisitId.get(visitId);

        const admissionTime = ipProp?.admission_time || vProp?.visit_time || "";
        const days = calcInHospitalDays(admissionTime);

        const isPredischarge = predischargeVisitIds.has(visitId);
        const allergyTags = parseAllergyTags(allergyInfo);

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

        const billAmount = parseAmount(billRow?.bill_amount);
        const chargeAmount = parseAmount(billRow?.charge_amount);
        const prepayAmount = parseAmount(accountRow?.prepay_amount);
        const guaranteeAmount = parseAmount(accountRow?.guarantee_amount);

        return {
          visit_id: visitId,
          // 住院号取自 getIpListAPI.visit_list
          visit_no: visitFallbackById.get(visitId)?.visit_no || "",
          patient_id: patientId,
          bed_no: ipProp?.bed_no || "-",
          patient_name:
            pProp?.patient_name || vProp?.visit_no || `就诊 #${visitId}`,
          patient_no: vProp?.patient_no || "",
          patient_gender: pProp?.patient_gender || "",
          patient_age: pProp?.age_year || 0,
          age_full: ageStr,
          hospital_days: days,
          hospital_days_tag: days > 0 ? getHospitalDaysTag(days) : undefined,
          is_predischarge: isPredischarge,
          diag_list: diagList,
          tag_list: allergyTags,
          admission_time: admissionTime,
          dept_name: vProp?.dept_name || ipProp?.dept_name || "",
          ward_name: ipProp?.ward_name || "",
          doctor_name: ipProp?.doctor_name || "",
          nurse_name: ipProp?.nurse_name || "",
          guarantee_amount: guaranteeAmount,
          prepay_amount: prepayAmount,
          total_amount: billAmount + chargeAmount,
          bill_amount: billAmount,
          is_arrears: prepayAmount + guaranteeAmount < 0,
        };
      });

      setPatients(validPatients);
    } catch {
      setPatients([]);
      message.error("加载在院患者失败");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [message]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    return onSessionIdChange((payload) => {
      // 监听 sessionId 变化（主体切换病区）：按新 session.dept_id 重拉在院患者
      setKeyword("");
      setListFilter("all");
      if (payload.action === "set" && payload.sessionId) {
        setLoading(true);
        void loadData();
      } else {
        setPatients([]);
      }
    });
  }, [loadData]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    void loadData();
  }, [loadData]);

  const filteredPatients = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return patients.filter((p) => {
      if (listFilter === "todayNew" && p.hospital_days !== 1) return false;
      if (listFilter === "predischarge" && !p.is_predischarge) return false;
      if (listFilter === "arrears" && !p.is_arrears) return false;
      if (!kw) return true;
      const name = p.patient_name.toLowerCase();
      const bed = p.bed_no.toLowerCase();
      const diag = p.diag_list.join(" ").toLowerCase();
      const doc = (p.doctor_name ?? "").toLowerCase();
      const nurse = (p.nurse_name ?? "").toLowerCase();
      const pno = p.patient_no.toLowerCase();
      return (
        name.includes(kw) ||
        bed.includes(kw) ||
        diag.includes(kw) ||
        doc.includes(kw) ||
        nurse.includes(kw) ||
        pno.includes(kw)
      );
    });
  }, [patients, keyword, listFilter]);

  const stats = useMemo(() => {
    const total = patients.length;
    const todayNew = patients.filter((p) => p.hospital_days === 1).length;
    const predischarge = patients.filter((p) => p.is_predischarge).length;
    const arrears = patients.filter((p) => p.is_arrears).length;
    return { total, todayNew, predischarge, arrears };
  }, [patients]);

  const columns: ColumnsType<PatientItem> = useMemo(
    () => [
      {
        title: "床号",
        dataIndex: "bed_no",
        key: "bed_no",
        width: 72,
        fixed: "left",
        render: (bedNo: string) => (
          <span className="my-patient-widget__bed">{bedNo}</span>
        ),
      },
      {
        title: "姓名",
        dataIndex: "patient_name",
        key: "patient_name",
        width: 100,
        ellipsis: true,
      },
      {
        title: "住院号",
        dataIndex: "visit_no",
        key: "visit_no",
        width: 100,
        ellipsis: true,
        render: (visitNo: string) => visitNo || "-",
      },
      {
        title: "性别",
        dataIndex: "patient_gender",
        key: "patient_gender",
        width: 64,
        ellipsis: true,
        render: (gender?: string) => gender || "-",
      },
      {
        title: "年龄",
        dataIndex: "age_full",
        key: "age_full",
        width: 70,
        ellipsis: true,
        render: (age?: string) => age || "-",
      },
      {
        title: "入院时间",
        dataIndex: "admission_time",
        key: "admission_time",
        width: 130,
        render: (time?: string) => formatAdmissionTime(time),
      },
      {
        title: "住院天数",
        key: "hospital_days",
        width: 80,
        render: (_, record) => {
          const daysTag = record.hospital_days_tag;
          if (!daysTag) return "-";
          return <Tag color={daysTag.color}>{daysTag.label}</Tag>;
        },
      },
      {
        title: "预出院",
        key: "predischarge",
        width: 80,
        render: (_, record) =>
          record.is_predischarge ? <Tag color="orange">预出院</Tag> : "",
      },
      {
        title: "过敏史",
        dataIndex: "tag_list",
        key: "tag_list",
        width: 140,
        render: (tags: PatientTag[]) =>
          tags.length > 0 ? (
            <div className="my-patient-widget__tags">
              {tags.map((tag, idx) => (
                <Tag key={`${tag.label}-${idx}`} color={tag.color}>
                  {tag.label}
                </Tag>
              ))}
            </div>
          ) : (
            "-"
          ),
      },
      {
        title: "诊断",
        key: "diag",
        width: 200,
        ellipsis: true,
        render: (_, record) =>
          record.diag_list.length
            ? record.diag_list.join("、")
            : "暂无主要诊断记录",
      },
      {
        title: "担保金额",
        dataIndex: "guarantee_amount",
        key: "guarantee_amount",
        align: "right",
        width: 100,

        render: (value?: number) => formatMoney(value),
      },
      {
        title: "预交金余额",
        dataIndex: "prepay_amount",
        key: "prepay_amount",
        width: 100,
        align: "right",
        render: (value?: number) => formatMoney(value),
      },
      {
        title: "累计费用",
        dataIndex: "total_amount",
        key: "total_amount",
        align: "right",
        width: 100,

        render: (value?: number) => formatMoney(value),
      },
      {
        title: "待扣金额",
        dataIndex: "bill_amount",
        key: "bill_amount",
        align: "right",
        width: 100,
        render: (value?: number) => formatMoney(value),
      },
      {
        title: "标识",
        key: "arrears",
        width: 64,
        render: (_, record) =>
          record.is_arrears ? <Tag color="red">欠</Tag> : "",
      },

      ...(workType === "DOCTOR"
        ? [
            {
              title: "病区",
              dataIndex: "ward_name",
              key: "ward_name",
              width: 100,
              ellipsis: true,
              render: (name?: string) => name || "-",
            } as const,
          ]
        : workType === "NURSE"
          ? [
              {
                title: "科室",
                dataIndex: "dept_name",
                key: "dept_name",
                width: 100,
                ellipsis: true,
                render: (name?: string) => name || "-",
              } as const,
            ]
          : [
              {
                title: "科室",
                dataIndex: "dept_name",
                key: "dept_name",
                width: 100,
                ellipsis: true,
                render: (name?: string) => name || "-",
              } as const,
              {
                title: "病区",
                dataIndex: "ward_name",
                key: "ward_name",
                width: 100,
                ellipsis: true,
                render: (name?: string) => name || "-",
              } as const,
            ]),
      {
        title: "责任医生",
        dataIndex: "doctor_name",
        key: "doctor_name",
        width: 100,
        ellipsis: true,
        render: (name?: string) => name || "-",
      },
      {
        title: "责任护士",
        dataIndex: "nurse_name",
        key: "nurse_name",
        width: 100,
        ellipsis: true,
        render: (name?: string) => name || "-",
      },
    ],
    [workType],
  );

  // 与 MyPatientWidget 列表区一致：占满看板剩余高度，按容器实测高度设置表格纵轴滚动
  useLayoutEffect(() => {
    const el = tableWrapRef.current;
    if (!el) return;

    const update = () => {
      const header =
        (el.querySelector(".ant-table-header") as HTMLElement | null) ??
        (el.querySelector(".ant-table-thead") as HTMLElement | null);
      const headerH = header?.offsetHeight || TABLE_HEADER_FALLBACK;
      const next = Math.max(el.clientHeight - headerH, 80);
      setScrollY((prev) => (prev === next ? prev : next));
    };

    const ro = new ResizeObserver(update);
    ro.observe(el);
    update();
    return () => ro.disconnect();
  }, [loading, filteredPatients.length]);

  return (
    <div className="my-patient-widget p-2">
      <div className="my-patient-widget__toolbar">
        <div className="my-patient-widget__toolbar-stats">
          <span
            className={`my-patient-widget__toolbar-badge my-patient-widget__toolbar-badge--clickable${
              listFilter === "all"
                ? " my-patient-widget__toolbar-badge--active"
                : " my-patient-widget__toolbar-badge--sub"
            }`}
            role="button"
            tabIndex={0}
            onClick={() => setListFilter("all")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setListFilter("all");
              }
            }}
          >
            在院 {stats.total} 人
          </span>
          {stats.todayNew > 0 && (
            <span
              className={`my-patient-widget__toolbar-badge my-patient-widget__toolbar-badge--clickable${
                listFilter === "todayNew"
                  ? " my-patient-widget__toolbar-badge--active"
                  : " my-patient-widget__toolbar-badge--sub"
              }`}
              role="button"
              tabIndex={0}
              onClick={() =>
                setListFilter((prev) => (prev === "todayNew" ? "all" : "todayNew"))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setListFilter((prev) =>
                    prev === "todayNew" ? "all" : "todayNew",
                  );
                }
              }}
            >
              今日新入 {stats.todayNew}
            </span>
          )}
          {stats.predischarge > 0 && (
            <span
              className={`my-patient-widget__toolbar-badge my-patient-widget__toolbar-badge--clickable${
                listFilter === "predischarge"
                  ? " my-patient-widget__toolbar-badge--active"
                  : " my-patient-widget__toolbar-badge--sub"
              }`}
              role="button"
              tabIndex={0}
              onClick={() =>
                setListFilter((prev) =>
                  prev === "predischarge" ? "all" : "predischarge",
                )
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setListFilter((prev) =>
                    prev === "predischarge" ? "all" : "predischarge",
                  );
                }
              }}
            >
              预出院 {stats.predischarge}
            </span>
          )}
          {stats.arrears > 0 && (
            <span
              className={`my-patient-widget__toolbar-badge my-patient-widget__toolbar-badge--clickable${
                listFilter === "arrears"
                  ? " my-patient-widget__toolbar-badge--active"
                  : " my-patient-widget__toolbar-badge--sub"
              }`}
              role="button"
              tabIndex={0}
              onClick={() =>
                setListFilter((prev) => (prev === "arrears" ? "all" : "arrears"))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setListFilter((prev) =>
                    prev === "arrears" ? "all" : "arrears",
                  );
                }
              }}
            >
              欠费 {stats.arrears}
            </span>
          )}
        </div>

        <div className="my-patient-widget__toolbar-actions">
          <Input
            size="small"
            prefix={
              <SearchOutlined
                style={{ color: "var(--app-theme-text-secondary)" }}
              />
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

      <div ref={tableWrapRef} className="my-patient-widget__table-wrap">
        <Table<PatientItem>
          size="small"
          rowKey="visit_id"
          columns={columns}
          dataSource={filteredPatients}
          loading={loading || refreshing}
          pagination={false}
          scroll={{ x: 1640, y: scrollY }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  keyword
                    ? listFilter === "todayNew"
                      ? "今日新入中未搜索到匹配的患者"
                      : listFilter === "predischarge"
                        ? "预出院中未搜索到匹配的患者"
                        : listFilter === "arrears"
                          ? "欠费患者中未搜索到匹配的患者"
                          : "未搜索到匹配的患者"
                    : listFilter === "todayNew"
                      ? "暂无今日新入患者"
                      : listFilter === "predischarge"
                        ? "暂无预出院患者"
                        : listFilter === "arrears"
                          ? "暂无欠费患者"
                          : "暂无在院患者"
                }
              >
                {keyword || listFilter !== "all" ? (
                  <Button
                    size="small"
                    onClick={() => {
                      setKeyword("");
                      setListFilter("all");
                    }}
                  >
                    查看全部在院患者
                  </Button>
                ) : (
                  <Button
                    size="small"
                    icon={<ReloadOutlined />}
                    onClick={handleRefresh}
                  >
                    重新加载
                  </Button>
                )}
              </Empty>
            ),
          }}
        />
      </div>
    </div>
  );
};

export default DeptPatientWidget;
