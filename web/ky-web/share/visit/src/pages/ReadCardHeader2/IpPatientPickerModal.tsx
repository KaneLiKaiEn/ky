import { useCallback, useEffect, useMemo, useState } from "react";
import { App, DatePicker, Modal, Select, Spin, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import debounce from "lodash/debounce";
import { retrieveDeptList } from "@/api/org";
import { getPatientProperty2 } from "@/api/visit";
import { getSettleList3 } from "@/api/settle";
import type { DeptRow } from "@/types/org";
import type { SettleList3Row } from "@/types/settle";
import type { VisitPatientRow } from "@/types/visit";
import { useSessionInfo } from "../PrepayDeposit/hooks/useSessionInfo";
import {
  fetchDischargeList,
  fetchInPatientList,
} from "../InPatientList/fetch";
import type { VisitIpRow, VisitRow } from "../InPatientList/type";
import { getDefaultDischargeDateRange } from "./constants";
import type {
  IpPatientListRow,
  IpPatientStatus,
  VisitDateRange,
} from "./types";

export interface IpPatientPickerModalProps {
  open: boolean;
  status: IpPatientStatus;
  selecting?: boolean;
  onClose: () => void;
  onSelect: (row: IpPatientListRow) => void | Promise<void>;
}

const dash = (value?: string) => value || "-";

type SettleFilter = "settled" | "unsettled" | "all";

interface IpPatientPickerRow extends IpPatientListRow {
  settled: boolean;
}

const settleFilterOptions: { value: SettleFilter; label: string }[] = [
  { value: "settled", label: "已结算" },
  { value: "unsettled", label: "未结算" },
  { value: "all", label: "全部" },
];

/** 同一条结算记录：标签含出院结算，且状态为 BILL */
function isDischargeSettled(row: SettleList3Row): boolean {
  return (
    (row.settle_tag ?? "").includes("出院结算") && row.settle_status === "BILL"
  );
}

function settledVisitIdSet(list: SettleList3Row[]): Set<number> {
  const ids = new Set<number>();
  for (const row of list) {
    if (row.visit_id != null && isDischargeSettled(row)) {
      ids.add(row.visit_id);
    }
  }
  return ids;
}

function mapIpPatientRows(
  visitList: VisitRow[],
  ipList: VisitIpRow[],
  patientList: VisitPatientRow[],
  settledVisitIds: ReadonlySet<number>,
): IpPatientPickerRow[] {
  const ipMap = new Map<number, VisitIpRow>();
  for (const ip of ipList) {
    if (ip.visit_id != null) ipMap.set(ip.visit_id, ip);
  }

  const patientMap = new Map<number, VisitPatientRow>();
  for (const patient of patientList) {
    if (patient.visit_id != null) patientMap.set(patient.visit_id, patient);
  }

  return visitList.flatMap((visit) => {
    if (visit.visit_id == null) return [];
    const ip = ipMap.get(visit.visit_id);
    const patient = patientMap.get(visit.visit_id);
    return [
      {
        visit_id: visit.visit_id,
        patient_id: visit.patient_id ?? patient?.patient_id,
        patient_name: visit.visit_info || patient?.patient_name,
        dept_name: visit.dept_name || ip?.admission_dept_name,
        doctor_name: ip?.doctor_name,
        nurse_name: ip?.nurse_name,
        admission_dept_name: ip?.admission_dept_name,
        bed_name: ip?.bed_no,
        room_no: ip?.room_no,
        diag_name: visit.diag_info,
        settled: settledVisitIds.has(visit.visit_id),
      },
    ];
  });
}

const columns: ColumnsType<IpPatientPickerRow> = [
  {
    title: "患者",
    dataIndex: "patient_name",
    key: "patient_name",
    width: 140,
    ellipsis: true,
    render: (value?: string) => dash(value),
  },
  {
    title: "病房",
    dataIndex: "room_no",
    key: "room_no",
    width: 100,
    ellipsis: true,
    render: (value?: string) => dash(value),
  },
  {
    title: "床号",
    dataIndex: "bed_name",
    key: "bed_name",
    width: 80,
    ellipsis: true,
    render: (value?: string) => dash(value),
  },
  {
    title: "诊断",
    dataIndex: "diag_name",
    key: "diag_name",
    width: 160,
    ellipsis: true,
    render: (value?: string) => dash(value),
  },
  {
    title: "医生",
    dataIndex: "doctor_name",
    key: "doctor_name",
    width: 160,
    ellipsis: true,
    render: (value: string | undefined, record) =>
      [record.admission_dept_name, value].filter(Boolean).join("-") || "-",
  },
  {
    title: "护士",
    dataIndex: "nurse_name",
    key: "nurse_name",
    width: 100,
    ellipsis: true,
    render: (value?: string) => dash(value),
  },
];

/**
 * 在院 / 出院病人选择弹窗：结算状态、科室筛选、出院日期范围 + 表格。
 */
const IpPatientPickerModal: React.FC<IpPatientPickerModalProps> = ({
  open,
  status,
  selecting = false,
  onClose,
  onSelect,
}) => {
  const { message } = App.useApp();
  const { orgId, loading: sessionLoading } = useSessionInfo();

  const [deptId, setDeptId] = useState(0);
  const [deptOptions, setDeptOptions] = useState<DeptRow[]>([]);
  const [deptFetching, setDeptFetching] = useState(false);
  const [dateRange, setDateRange] = useState<VisitDateRange>(
    getDefaultDischargeDateRange,
  );
  const [loading, setLoading] = useState(false);
  const [settleFilter, setSettleFilter] = useState<SettleFilter>("all");
  const [rows, setRows] = useState<IpPatientPickerRow[]>([]);

  const rangeValue = useMemo<[Dayjs, Dayjs]>(
    () => [dayjs(dateRange[0]), dayjs(dateRange[1])],
    [dateRange],
  );

  const visibleRows = useMemo(() => {
    if (settleFilter === "all") return rows;
    const settled = settleFilter === "settled";
    return rows.filter((row) => row.settled === settled);
  }, [rows, settleFilter]);

  const fetchList = useCallback(async () => {
    if (!open || sessionLoading) return;

    setLoading(true);
    try {
      const columnParams = { column_visit: "*", column_ip: "*" };
      const deptParams = deptId > 0 ? { dept_id: deptId } : {};
      const res =
        status === "in"
          ? await fetchInPatientList({
              org_id: orgId,
              ...deptParams,
              ...columnParams,
            })
          : await fetchDischargeList({
              ...deptParams,
              visit_start: dateRange[0],
              visit_end: dateRange[1],
              ...columnParams,
            });

      const visitList = res.visit_list ?? [];
      const ipList = res.ip_list ?? [];
      const visitIds = visitList
        .map((item) => item.visit_id)
        .filter((id): id is number => id != null);

      let patientList: VisitPatientRow[] = [];
      let settleList: SettleList3Row[] = [];
      if (visitIds.length > 0) {
        try {
          const patientRes = await getPatientProperty2({
            visit_id_list: visitIds,
          });
          patientList = patientRes.patient_list ?? [];
        } catch {
          // 姓名失败时仍展示就诊/住院信息
        }
        try {
          const settle = await getSettleList3({
            visit_id_list: visitIds,
            org_id: orgId ?? 0,
            settle_tag: "[出院结算]",
            column_list: "*",
          });
          settleList = settle.settle_list ?? [];
        } catch {
          // 结算状态失败时按未结算展示
        }
      }

      setRows(
        mapIpPatientRows(
          visitList,
          ipList,
          patientList,
          settledVisitIdSet(settleList),
        ),
      );
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [dateRange, deptId, message, open, orgId, sessionLoading, status]);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  const searchDept = useMemo(
    () =>
      debounce((keyword: string, currentDeptId: number) => {
        void (async () => {
          setDeptFetching(true);
          try {
            const res = await retrieveDeptList({
              retrieve_input: keyword.trim() || "*",
              retrieve_limit: 20,
            });
            setDeptOptions((prev) => {
              const list = res.dept_list ?? [];
              const current = prev.find((item) => item.dept_id === currentDeptId);
              if (current && !list.some((item) => item.dept_id === currentDeptId)) {
                return [current, ...list];
              }
              return list;
            });
          } catch {
            setDeptOptions([]);
          } finally {
            setDeptFetching(false);
          }
        })();
      }, 300),
    [],
  );

  useEffect(
    () => () => {
      searchDept.cancel();
    },
    [searchDept],
  );

  const handleDeptSearch = useCallback(
    (keyword: string) => {
      searchDept(keyword, deptId);
    },
    [deptId, searchDept],
  );

  const handleDeptChange = (nextDeptId: number) => {
    setDeptId(nextDeptId);
  };

  const handleRangeChange = (values: [Dayjs | null, Dayjs | null] | null) => {
    if (!values?.[0] || !values[1]) return;
    setDateRange([
      values[0].format("YYYY-MM-DD"),
      values[1].format("YYYY-MM-DD"),
    ]);
  };

  const busy = loading || sessionLoading || selecting;

  return (
    <Modal
      open={open}
      title={status === "in" ? "在院病人" : "出院病人"}
      onCancel={onClose}
      footer={null}
      width="80%"
      styles={{
        body: {
          maxHeight: "calc(100vh - 160px)",
          overflow: "hidden",
        },
      }}
      destroyOnHidden
      centered
      mask={{ closable: !selecting }}
      closable={!selecting}
    >
      <div className="mb-2 flex min-w-0 flex-wrap items-center gap-2">
        <span className="me-auto">
          {deptId > 0
            ? deptOptions.find((item) => item.dept_id === deptId)?.dept_name
            : "全部"}
          {status === "in" ? "在院人数" : "出院人数"}：{visibleRows.length}
        </span>
        <Select
          size="small"
          className="w-[110px]"
          value={settleFilter}
          options={settleFilterOptions}
          onChange={setSettleFilter}
        />
        <Select
          size="small"
          showSearch
          allowClear
          filterOption={false}
          placeholder="全部科室"
          className="w-[180px]"
          loading={deptFetching}
          notFoundContent={deptFetching ? <Spin size="small" /> : null}
          value={deptId || undefined}
          onSearch={handleDeptSearch}
          onFocus={() => handleDeptSearch("")}
          onClear={() => handleDeptChange(0)}
          onChange={(next) => handleDeptChange(Number(next) || 0)}
          options={deptOptions.map((item) => ({
            value: Number(item.dept_id),
            label: item.dept_name || `科室${item.dept_id}`,
          }))}
        />
        {status === "out" ? (
          <DatePicker.RangePicker
            size="small"
            allowClear={false}
            value={rangeValue}
            onChange={handleRangeChange}
          />
        ) : null}
      </div>
      <Table<IpPatientPickerRow>
        size="small"
        rowKey={(row, index) => String(row.visit_id ?? `row-${index}`)}
        loading={busy}
        columns={columns}
        dataSource={visibleRows}
        pagination={false}
        scroll={{ y: "calc(100vh - 280px)" }}
        locale={{ emptyText: "暂无数据" }}
        onRow={(record) => ({
          className: selecting ? "cursor-wait" : "cursor-pointer",
          onClick: () => {
            if (selecting) return;
            void onSelect(record);
          },
        })}
      />
    </Modal>
  );
};

export default IpPatientPickerModal;
