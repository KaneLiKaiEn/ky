import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Button, Checkbox, Divider, Select, Tag, message } from "antd";
import PatientDetail from "./components/PatientDetail";
import BedCard from "./components/BedCard";
import {
  getAccountListAPI,
  getBedListAPI,
  getBillAccount2API,
  getCareList2API,
  getIpList,
  getOrderBaseLatest2API,
  getRoomListApi,
  getRoomProperty2Api,
  getVisitProperty2,
} from "./api";
import { onSessionIdChange } from "comm/session";
import { clearSessionInfoCache, fetchSessionInfo } from "./utils/session";
import "./index.scss";

const EMPTY_VISIT_PROPERTY = {
  code: 0,
  ip_list: [],
  visit_list: [],
  patient_list: [],
};

const parseAmount = (value?: string | number | null): number => {
  if (value == null || value === "") return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
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

function buildPatientIPMap(visitPropertyRes: any) {
  const patientIPMap = new Map<number, Record<string, any>>();
  if (visitPropertyRes?.code !== 0) return patientIPMap;
  const ipList = Array.isArray(visitPropertyRes.ip_list)
    ? visitPropertyRes.ip_list
    : [];
  const visitListData = Array.isArray(visitPropertyRes.visit_list)
    ? visitPropertyRes.visit_list
    : [];
  ipList.forEach((ipItem: any) => {
    const visitId = ipItem?.visit_id;
    if (!visitId) return;
    const visitItem =
      visitListData.find((v: any) => v.visit_id === visitId) || {};
    const flatInfo = {
      visit_type: visitItem.visit_type,
      visit_no: visitItem.visit_no,
      visit_serial: visitItem.visit_serial,
      visit_time: visitItem.visit_time,
      visit_tag: visitItem.visit_tag,
      visit_status: visitItem.visit_status,
      visit_info: visitItem.visit_info,
      diag_info: visitItem.diag_info,
      dept_id: visitItem.dept_id,
      dept_name: visitItem.dept_name,
      patient_no: visitItem.patient_no,
      patient_id: visitItem.patient_id,
      patient_name: visitItem.patient_name,
      patient_gender: visitItem.patient_gender,
      age_full: visitItem.age_full,
      admission_time: ipItem.admission_time,
      admission_type: ipItem.admission_type,
      admission_dept_name: ipItem.admission_dept_name,
      admission_ward_name: ipItem.admission_ward_name,
      ward_id: ipItem.ward_id,
      ward_name: ipItem.ward_name,
      reg_time: ipItem.reg_time,
      room_id: ipItem.room_id,
      room_no: ipItem.room_no,
      bed_id: ipItem.bed_id,
      bed_no: ipItem.bed_no,
      bed_service: ipItem.bed_service,
      doctor_id: ipItem.doctor_id,
      doctor_name: ipItem.doctor_name,
      doctor_level: ipItem.doctor_level,
      nurse_id: ipItem.nurse_id,
      nurse_name: ipItem.nurse_name,
      nurse_level: ipItem.nurse_level,
      discharge_time: ipItem.discharge_time,
      sort_no: ipItem.sort_no,
    };
    const filteredInfo = Object.fromEntries(
      Object.entries(flatInfo).filter(([, v]) => v != null && v !== ""),
    );
    patientIPMap.set(visitId, filteredInfo);
  });
  return patientIPMap;
}

export interface BedsideCardProps {
  className?: string;
}

export default function BedsideCard({ className }: BedsideCardProps) {
  const [selectedBed, setSelectedBed] = useState<any | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  // 床位数据状态（仅 GetBedList 返回的真实床位）
  const [bedList, setBedList] = useState<any[]>([]);
  const [unassignedList, setUnassignedList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  // 未传房间时按 room_id 分组展示
  const [groupByRoom, setGroupByRoom] = useState(true);

  // 房间选择状态
  const [selectedRoomId, setSelectedRoomId] = useState<number | undefined>(
    undefined,
  );
  const [roomOptions, setRoomOptions] = useState<
    { value: number; label: string }[]
  >([]);

  // 筛选状态
  const [checkboxStates, setCheckboxStates] = useState({
    occupied: true,
    empty: true,
    unassigned: true,
  });

  const [session, setSession] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    fetchSessionInfo().then(setSession);
  }, []);

  useEffect(() => {
    return onSessionIdChange((payload) => {
      // 监听 sessionId 变化（主体切换病区）：旧 session.dept_id 失效，清空后按新会话重拉
      clearSessionInfoCache();
      setSelectedBed(null);
      setDetailVisible(false);
      setSelectedRoomId(undefined);
      setRoomOptions([]);
      setBedList([]);
      setUnassignedList([]);
      if (payload.action === "set" && payload.sessionId) {
        fetchSessionInfo().then(setSession);
      } else {
        setSession(null);
      }
    });
  }, []);

  // 获取床位列表。未选房间时不传 room_id，按当前科室拉取全部床位
  const getPatientsCards = useCallback(
    async (roomId?: number) => {
      try {
        setLoading(true);
        const currentSession = session ?? (await fetchSessionInfo());
        if (!currentSession?.dept_id) {
          message.error("获取当前科室失败，请重试");
          setBedList([]);
          setUnassignedList([]);
          return;
        }

        const params: Record<string, any> = {
          dept_id: currentSession.dept_id,
          org_id: Number(currentSession.org_id),
        };
        if (roomId) {
          params.room_id = roomId;
        }

        const ipParams: Record<string, any> = {
          column_ip: "*",
          column_visit: "*",
          only_preadmission: true,
        };
        if (currentSession.work_type === "NURSE") {
          ipParams.ward_id = currentSession.dept_id;
        } else {
          ipParams.dept_id = currentSession.dept_id;
        }

        const [res, ipRes] = await Promise.all([
          getBedListAPI(params),
          getIpList({ ...ipParams }),
        ]);
        if (res.code !== 0) {
          message.error(res.message + res.hint || "获取床位列表失败");
          setBedList([]);
          setUnassignedList([]);
          return;
        }

        setUnassignedList([]);

        // 提取 visit_id：按床位去重，一张床只对应一张床头卡
        const rawBedList = Array.isArray(res.row_list) ? res.row_list : [];
        const seenBedKeys = new Set<string>();
        const visitList = rawBedList.filter((bed: any) => {
          const key =
            bed?.bed_id != null && bed?.bed_id !== ""
              ? `id:${bed.bed_id}`
              : `no:${bed?.bed_no ?? ""}`;
          if (seenBedKeys.has(key)) return false;
          seenBedKeys.add(key);
          return true;
        });
        const visitIds = visitList
          .map((item: any) => item?.visit_id)
          .filter((id: any): id is number => id != null && id !== undefined);

        // only_preadmission 返回的就是待分配患者，接口有几条就展示几条
        const unassignedPatients =
          ipRes?.code === 0
            ? (() => {
                const visitRows = Array.isArray(ipRes.visit_list)
                  ? ipRes.visit_list
                  : [];
                const ipRows = Array.isArray(ipRes.ip_list)
                  ? ipRes.ip_list
                  : [];
                if (visitRows.length > 0) {
                  return visitRows.map((visit: any) => {
                    const ip =
                      ipRows.find(
                        (item: any) => item.visit_id === visit.visit_id,
                      ) || {};
                    const { visit_id: _ipVisitId, ...ipRest } = ip;
                    return { ...visit, ...ipRest };
                  });
                }
                return ipRows;
              })()
            : [];
        const unassignedVisitIds = unassignedPatients
          .map((item: any) => item?.visit_id)
          .filter((id: any): id is number => id != null && id !== undefined);
        const allVisitIds = Array.from(
          new Set([...visitIds, ...unassignedVisitIds]),
        );

        const visitPropertyRes =
          allVisitIds.length > 0
            ? await getVisitProperty2({
                visit_id_list: allVisitIds,
                column_ip: "*",
                column_visit: "*",
                column_patient: "*",
                column_status: "*",
              })
            : EMPTY_VISIT_PROPERTY;

        const patientList =
          visitPropertyRes?.code === 0 &&
          Array.isArray(visitPropertyRes.patient_list)
            ? visitPropertyRes.patient_list
            : [];
        const patientMap = new Map<any, any>(
          patientList.map((p: any) => [p.visit_id, p]),
        );
        const patientIPMap = buildPatientIPMap(visitPropertyRes);
        const statusMap = new Map<any, any>(
          (Array.isArray(visitPropertyRes?.status_list)
            ? visitPropertyRes.status_list
            : []
          ).map((item: any) => [item.visit_id, item]),
        );

        // 账户 / 费用 / 病情 / 护理等级：护理等级取 GetOrderBaseLatest2.order_name
        let accountByVisitId = new Map<number, any>();
        let billByVisitId = new Map<
          number,
          { bill_amount?: string; charge_amount?: string }
        >();
        let careByVisitId = new Map<number, any>();
        let careLevelByVisitId = new Map<number, any>();
        if (allVisitIds.length > 0) {
          const [accountRes, billRes, careRes, careLevelRes] =
            await Promise.all([
              getAccountListAPI({
                visit_id_list: allVisitIds,
                include_prepay: true,
                include_guarantee: true,
              }).catch(() => null),
              getBillAccount2API({
                visit_id_list: allVisitIds,
                bill_type: "*",
              }).catch(() => null),
              getCareList2API({
                visit_id_list: allVisitIds,
              }).catch(() => null),
              getOrderBaseLatest2API({
                visit_id_list: allVisitIds,
                item_type: "护理等级",
              }).catch(() => null),
            ]);
          accountByVisitId = indexByVisitId(accountRes?.row_list);
          billByVisitId = new Map(
            allVisitIds.map((visitId, idx) => [
              visitId,
              {
                bill_amount: billRes?.bill_amount?.[idx],
                charge_amount: billRes?.charge_amount?.[idx],
              },
            ]),
          );
          careByVisitId = indexByVisitId(careRes?.row_list);
          careLevelByVisitId = indexByVisitId(careLevelRes?.row_list);
        }

        const buildFeeFields = (visitId: number | null | undefined) => {
          if (visitId == null) {
            return {
              guarantee_amount: 0,
              prepay_amount: 0,
              total_amount: 0,
              bill_amount: 0,
              charge_amount: 0,
              available_amount: 0,
            };
          }
          const accountRow = accountByVisitId.get(visitId);
          const billRow = billByVisitId.get(visitId);
          const billAmount = parseAmount(billRow?.bill_amount);
          const chargeAmount = parseAmount(billRow?.charge_amount);
          const prepayAmount = parseAmount(accountRow?.prepay_amount);
          const guaranteeAmount = parseAmount(accountRow?.guarantee_amount);
          // 总充值预交金 = 预交金余额 + 已扣费
          const rechargeAmount = prepayAmount + chargeAmount;
          // 可用余额 = (总充值预交金 + 担保金) - 已扣费
          const availableAmount = rechargeAmount + guaranteeAmount - chargeAmount;
          return {
            guarantee_amount: guaranteeAmount,
            prepay_amount: prepayAmount,
            total_amount: billAmount + chargeAmount,
            bill_amount: billAmount,
            charge_amount: chargeAmount,
            available_amount: availableAmount,
          };
        };

        const buildCareFields = (visitId: number | null | undefined) => {
          if (visitId == null) {
            return {
              health_level: "",
              care_level: null as number | string | null,
              care_level_name: "",
            };
          }
          const careRow = careByVisitId.get(visitId);
          const careLevelRow = careLevelByVisitId.get(visitId);
          const orderName =
            typeof careLevelRow?.order_name === "string"
              ? careLevelRow.order_name.trim()
              : "";
          return {
            health_level: careRow?.health_level ?? "",
            care_level: careRow?.care_level ?? null,
            care_level_name: orderName,
          };
        };

        const mergedPatients = visitList.map((bed: any) => {
          const visitId = bed.visit_id;
          const patient = patientMap.get(visitId);
          const flatIpInfo = patientIPMap.get(visitId) || {};
          // 房间、床位以床位列表为准。有患者时住院信息里的 room_id 可能为空，不能覆盖
          const {
            room_id: _ipRoomId,
            room_no: _ipRoomNo,
            room_name: _ipRoomName,
            bed_id: _ipBedId,
            bed_no: _ipBedNo,
            ...ipRest
          } = flatIpInfo;
          const {
            room_id: _patientRoomId,
            room_no: _patientRoomNo,
            room_name: _patientRoomName,
            bed_id: _patientBedId,
            bed_no: _patientBedNo,
            health_level: _patientHealthLevel,
            ...patientRest
          } = patient || {};

          return {
            bed_name: bed.bed_name,
            visit_info: bed.visit_info,
            appoint_info: bed.appoint_info,
            visit_tag: bed.visit_tag,
            visit_id: visitId || null,
            patient_id: patient?.patient_id || null,
            patient_name: patient?.patient_name || null,
            has_visit_id: !!visitId,
            is_empty: !visitId,
            isolation_tags: bed.isolation_tags || [],
            ...patientRest,
            ...ipRest,
            ...buildFeeFields(visitId),
            ...buildCareFields(visitId),
            bed_id: bed.bed_id,
            bed_no: bed.bed_no,
            room_id: bed.room_id,
            room_no: bed.room_no,
            status_info: statusMap.get(visitId) || null,
          };
        });

        const sortedPatients = mergedPatients.sort((a: any, b: any) => {
          return String(a?.bed_no).localeCompare(String(b?.bed_no), undefined, {
            numeric: true,
            sensitivity: "base",
          });
        });

        let patientsToShow = sortedPatients;
        if (!roomId) {
          const roomIdList = Array.from(
            new Set(
              sortedPatients
                .map((bed: any) => Number(bed.room_id))
                .filter((id: number) => Number.isFinite(id) && id > 0),
            ),
          );
          const roomPropertyMap = new Map<number, any>();
          if (roomIdList.length > 0) {
            try {
              const roomRes = await getRoomProperty2Api({
                room_id_list: roomIdList,
              });
              const roomRows = Array.isArray(roomRes?.row_list)
                ? roomRes.row_list
                : Array.isArray(roomRes?.room_list)
                  ? roomRes.room_list
                  : [];
              if (roomRes?.code === 0) {
                roomRows.forEach((room: any) => {
                  const id = Number(room?.room_id);
                  if (Number.isFinite(id) && id > 0) {
                    roomPropertyMap.set(id, room);
                  }
                });
              }
            } catch {
              // 房间名称失败时仍按房间分组展示床位
            }
          }
          patientsToShow = sortedPatients.map((bed: any) => {
            const room = roomPropertyMap.get(Number(bed.room_id));
            return {
              ...bed,
              room_name: room?.room_name || bed.room_name || "",
              room_sort_no: room?.sort_no ?? "",
            };
          });
        }

        const unassignedCards = unassignedPatients.map((ipItem: any) => {
          const visitId = ipItem.visit_id;
          const patient = patientMap.get(visitId);
          const flatIpInfo = patientIPMap.get(visitId) || {};
          const {
            health_level: _patientHealthLevel,
            ...patientRest
          } = patient || {};

          return {
            visit_id: visitId,
            ...flatIpInfo,
            ...patientRest,
            ...buildFeeFields(visitId),
            ...buildCareFields(visitId),
            isolation_tags: [],
            visit_info: ipItem,
            appoint_info: null,
            bed_id: `unassigned_${visitId}`,
            bed_no: "待分配",
            is_unassigned: true,
            status_info: statusMap.get(visitId) || null,
          };
        });

        setBedList(patientsToShow);
        setUnassignedList(unassignedCards);
        setGroupByRoom(!roomId);
      } catch (error) {
        setBedList([]);
        setUnassignedList([]);
      } finally {
        setLoading(false);
      }
    },
    [session?.dept_id, session?.work_type],
  );

  // 房间可选：选中按房间过滤，清空则不传 room_id 拉全部床位
  const handleRoomChange = (value: number | undefined) => {
    setSelectedRoomId(value);
    getPatientsCards(value);
  };

  // 获取房间列表
  const getRoomList = async () => {
    try {
      const currentSession = session ?? (await fetchSessionInfo());
      if (!currentSession?.dept_id) return;

      const res = await getRoomListApi({
        dept_id: currentSession.dept_id,
      });
      if (res.code === 0) {
        const options = res.row_list.map((item: any) => ({
          value: item.room_id,
          label: item.room_name,
        }));
        setRoomOptions(options);
        // 默认选中第一个房间并加载床位；无房间时拉全部并按房间分组
        if (options.length > 0) {
          const firstRoomId = options[0].value;
          setSelectedRoomId(firstRoomId);
          getPatientsCards(firstRoomId);
        } else {
          setSelectedRoomId(undefined);
          getPatientsCards();
        }
      } else {
        message.error(res.message + res.hint);
      }
    } catch (error) {}
  };
  // 进入页面拉取房间列表，并默认选中第一项
  useEffect(() => {
    if (session?.dept_id) {
      getRoomList();
    }
  }, [session]);

  // 点击床位显示详情
  const handleBedClick = (bed: any) => {
    setSelectedBed(bed);
    const hasData = bed?.visit_id || bed?.patient_name;
    setDetailVisible(!!hasData);
  };

  // 更新床头卡后刷新（未选房间时同样按科室重拉）
  const updateBedCard = () => {
    getPatientsCards(selectedRoomId);
  };

  // 监听床位列表变化，同步更新选中的床位
  useEffect(() => {
    if (selectedBed && (bedList.length > 0 || unassignedList.length > 0)) {
      const updatedBed =
        bedList.find((bed) => bed.bed_id === selectedBed.bed_id) ||
        unassignedList.find((bed) => bed.bed_id === selectedBed.bed_id);
      if (updatedBed) {
        setSelectedBed(updatedBed);
      }
    }
  }, [bedList, unassignedList, selectedBed]);

  // 计算床位统计
  const calculateBedStats = (beds: any[]) => {
    const stats = {
      total: beds.length,
      occupied: 0,
      empty: 0,
      unassigned: 0,
    };

    beds.forEach((bed) => {
      if (bed?.is_unassigned) {
        stats.unassigned += 1;
      } else if (bed?.visit_id) {
        // 根据 visit_id 判断占用
        stats.occupied += 1;
      } else {
        stats.empty += 1;
      }
    });

    return stats;
  };
  const bedStats = useMemo(() => {
    const stats = calculateBedStats(bedList);
    stats.unassigned = unassignedList.length;
    return stats;
  }, [bedList, unassignedList]);

  // 筛选相关（修改后的逻辑）
  const handleCheckboxChange = (
    key: keyof typeof checkboxStates,
    checked: boolean,
  ) => {
    setCheckboxStates((prev) => ({ ...prev, [key]: checked }));
  };

  const handleSelectAll = (checked: boolean) => {
    setCheckboxStates({
      occupied: checked,
      empty: checked,
      unassigned: checked,
    });
  };

  const getBedStatus = (bed: any) => {
    if (bed?.is_unassigned) return "unassigned";
    if (bed?.visit_id) return "occupied"; // 根据 visit_id 判断占用
    return "empty";
  };

  const filterBeds = (beds: any[]) => {
    return beds.filter((bed) => {
      const status = getBedStatus(bed);
      switch (status) {
        case "occupied":
          return checkboxStates.occupied;
        case "empty":
          return checkboxStates.empty;
        case "unassigned":
          return checkboxStates.unassigned;
        default:
          return true;
      }
    });
  };

  const filteredBeds = useMemo(
    () => filterBeds(bedList),
    [bedList, checkboxStates],
  );
  const filteredUnassigned = useMemo(
    () => (checkboxStates.unassigned ? unassignedList : []),
    [unassignedList, checkboxStates.unassigned],
  );

  const roomGroups = useMemo(() => {
    if (!groupByRoom) return [];
    const groups = new Map<
      string,
      { key: string; roomName: string; sortNo: string; beds: any[] }
    >();
    filteredBeds.forEach((bed) => {
      const roomId = Number(bed?.room_id);
      const key =
        Number.isFinite(roomId) && roomId > 0 ? String(roomId) : "__none__";
      let group = groups.get(key);
      if (!group) {
        group = {
          key,
          roomName:
            bed?.room_name ||
            bed?.room_no ||
            (key === "__none__" ? "未分房间" : `房间${key}`),
          sortNo: bed?.room_sort_no || "",
          beds: [],
        };
        groups.set(key, group);
      }
      group.beds.push(bed);
    });
    return Array.from(groups.values()).sort((a, b) => {
      const sortCmp = String(a.sortNo).localeCompare(
        String(b.sortNo),
        undefined,
        {
          numeric: true,
          sensitivity: "base",
        },
      );
      if (a.sortNo || b.sortNo) {
        if (!a.sortNo) return 1;
        if (!b.sortNo) return -1;
        if (sortCmp !== 0) return sortCmp;
      }
      return a.roomName.localeCompare(b.roomName, "zh");
    });
  }, [filteredBeds, groupByRoom]);

  const handleRefresh = () => {
    getPatientsCards(selectedRoomId);
  };

  return (
    <div
      className={["bedside-card-widget", className].filter(Boolean).join(" ")}
      style={{
        contain: "layout style",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        padding: "5px 10px 0 5px",
      }}
    >
      {/* 固定顶部区域 - 房间选择 */}
      <div className="flex-shrink-0 p-2 pb-0">
        <div className="flex items-center gap-4 mb-4">
          <span>房间:</span>
          <Select
            placeholder="全部房间"
            options={roomOptions}
            value={selectedRoomId}
            onChange={handleRoomChange}
            allowClear
            style={{ width: 220 }}
            showSearch
            optionFilterProp="label"
            getPopupContainer={() =>
              document.getElementById("home-root") || document.body
            }
          />
          <Button type="primary" onClick={handleRefresh}>
            刷新
          </Button>
        </div>
      </div>

      {/* 固定顶部区域 - 统计和筛选 */}
      <div className="flex-shrink-0 px-2">
        <div className="flex justify-between items-center mb-4 bg-blue-50 border-l-4 border-blue-500 px-4 py-2 rounded-[10px]">
          <div className="flex items-center gap-6">
            {/* 床位统计 */}
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-blue-600">
                {bedStats.occupied + bedStats.empty}
              </span>
              <span className="text-gray-600">显示床位</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-blue-600">
                {bedStats.occupied}
              </span>
              <span className="text-gray-600">已占用</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-blue-500">
                {bedStats.unassigned}
              </span>
              <span className="text-gray-600">待分配</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-blue-500">
                {bedStats.empty}
              </span>
              <span className="text-gray-600">空床</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-gray-600 text-sm">筛选：</span>
            <div className="flex gap-3 items-center flex-wrap">
              <Checkbox
                checked={checkboxStates.occupied}
                onChange={(e) =>
                  handleCheckboxChange("occupied", e.target.checked)
                }
              >
                占用{" "}
                <span className="text-xs text-gray-500">
                  ({bedStats.occupied})
                </span>
              </Checkbox>
              <Checkbox
                checked={checkboxStates.unassigned}
                onChange={(e) =>
                  handleCheckboxChange("unassigned", e.target.checked)
                }
              >
                待分配{" "}
                <span className="text-xs text-gray-500">
                  ({bedStats.unassigned})
                </span>
              </Checkbox>
              <Checkbox
                checked={checkboxStates.empty}
                onChange={(e) =>
                  handleCheckboxChange("empty", e.target.checked)
                }
              >
                空床{" "}
                <span className="text-xs text-gray-500">
                  ({bedStats.empty})
                </span>
              </Checkbox>
              <Divider type="vertical" />
              <Checkbox
                checked={Object.values(checkboxStates).every((v) => v)}
                onChange={(e) => handleSelectAll(e.target.checked)}
              >
                全选
              </Checkbox>
            </div>
          </div>
        </div>
      </div>
      {/* 可滚动区域 - 床位列表 + 右侧面板 */}
      <div
        id="home-root"
        className="flex-1 overflow-y-auto px-2 min-w-0"
        style={{ scrollbarGutter: "stable" }}
      >
        <div className="flex gap-4">
          {/* 左侧床位列表：弹性占据 */}
          <div
            className="flex-1 min-w-[300px] flex flex-wrap gap-2 items-stretch"
            style={{ alignContent: "flex-start" }}
          >
            {filteredBeds.length === 0 && filteredUnassigned.length === 0 ? (
              <div className="w-full text-center text-gray-400 py-8">
                暂无符合条件的床位
              </div>
            ) : (
              <>
                {groupByRoom
                  ? roomGroups.map((group) => (
                      <div key={group.key} className="w-full mb-3">
                        <div className="mb-2">
                          <Tag color="processing" style={{ fontSize: 16 }}>
                            {group.roomName}
                          </Tag>
                        </div>
                        <div
                          className="flex flex-wrap gap-2 items-stretch"
                          style={{ alignContent: "flex-start" }}
                        >
                          {group.beds.map((bed) => (
                            <div
                              key={bed.bed_id}
                              className="w-74 min-h-[290px] flex-shrink-0 flex flex-col"
                              style={{ contain: "layout style" }}
                            >
                              <BedCard
                                bed={bed}
                                onClick={() => handleBedClick(bed)}
                                onSuccess={updateBedCard}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  : filteredBeds.map((bed) => (
                      <div
                        key={bed.bed_id}
                        className="w-74 min-h-[290px] flex-shrink-0 flex flex-col"
                        style={{ contain: "layout style" }}
                      >
                        <BedCard
                          bed={bed}
                          onClick={() => handleBedClick(bed)}
                          onSuccess={updateBedCard}
                        />
                      </div>
                    ))}
                {filteredUnassigned.length > 0 && (
                  <>
                    <div className="w-full flex items-center gap-2 my-2 px-1">
                      <div className="flex-1 h-px bg-red-200"></div>
                      <span className="text-lg font-bold text-orange-500 whitespace-nowrap">
                        未分配病人：
                      </span>
                      <div className="flex-1 h-px bg-red-200"></div>
                    </div>
                    {filteredUnassigned.map((bed) => (
                      <div
                        key={bed.bed_id}
                        className="w-74 min-h-[290px] flex-shrink-0 flex flex-col"
                        style={{ contain: "layout style" }}
                      >
                        <BedCard
                          onSuccess={updateBedCard}
                          bed={bed}
                          onClick={() => handleBedClick(bed)}
                        />
                      </div>
                    ))}
                  </>
                )}
              </>
            )}
          </div>

          {/* 右侧详情面板：固定在右侧，不随滚动 */}
          <div className="w-[280px] min-w-[240px] flex-shrink-0 pl-2">
            {selectedBed && detailVisible ? (
              <div className="bg-white rounded-lg shadow-lg p-4 max-h-full overflow-y-auto sticky top-0">
                <PatientDetail
                  patient={selectedBed}
                  bedNumber={
                    selectedBed?.is_unassigned ? "待分配" : selectedBed?.bed_no
                  }
                />
              </div>
            ) : (
              <div className="text-gray-400 text-sm p-4 bg-gray-50 rounded-lg min-h-[100px]">
                点击床位查看患者详情
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
