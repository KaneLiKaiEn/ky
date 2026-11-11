import { useEffect, useMemo, useRef, useState } from "react";
import { App, DatePicker, Input, Modal, Space, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import debounce from "lodash/debounce";
import { getVisitListAPI } from "../PatientInfo/api/visit";
import type {
  VisitRow,
  VisitStatusCode,
  VisitTypeCode,
} from "../PatientInfo/types/visit";
import { formatVisitTime } from "./utils";

export interface VisitSelectModalProps {
  open: boolean;
  /** 打开时默认的患者 ID */
  initialPatientId?: number | null;
  selecting?: boolean;
  onClose: () => void;
  onSelect: (visit: VisitRow) => void | Promise<void>;
}

const VISIT_TYPE_LABEL: Record<string, string> = {
  O: "门诊",
  E: "急诊",
  I: "住院",
};

const VISIT_STATUS_LABEL: Record<string, string> = {
  VISIT: "就诊",
  OBSERVE: "留观",
  FINISH: "完成",
  ADMISSION: "入院",
  DISCHARGE: "出院",
  CANCEL: "作废",
};

const formatVisitType = (type?: VisitTypeCode) =>
  type ? (VISIT_TYPE_LABEL[type] ?? type) : "-";

const formatVisitStatus = (status?: VisitStatusCode) =>
  status ? (VISIT_STATUS_LABEL[status] ?? status) : "-";

const defaultRange = (): [Dayjs, Dayjs] => [
  dayjs().subtract(1, "month").startOf("day"),
  dayjs().endOf("day"),
];

const columns: ColumnsType<VisitRow> = [
  {
    title: "就诊ID",
    dataIndex: "visit_id",
    width: 160,
  },
  {
    title: "类型",
    dataIndex: "visit_type",
    width: 70,
    render: (v: VisitTypeCode | undefined) => formatVisitType(v),
  },
  {
    title: "就诊号",
    dataIndex: "visit_no",
    width: 120,
    ellipsis: true,
  },
  {
    title: "就诊时间",
    dataIndex: "visit_time",
    width: 160,
    render: (v: string | undefined) => formatVisitTime(v),
  },
  {
    title: "状态",
    dataIndex: "visit_status",
    width: 80,
    render: (v: VisitStatusCode | undefined) => formatVisitStatus(v),
  },
  {
    title: "科室",
    dataIndex: "dept_name",
    width: 120,
    ellipsis: true,
  },
  {
    title: "机构",
    dataIndex: "org_name",
    width: 140,
    ellipsis: true,
  },
  {
    title: "患者ID",
    dataIndex: "patient_id",
    width: 120,
  },
  {
    title: "病案号",
    dataIndex: "patient_no",
    width: 120,
    ellipsis: true,
  },
  {
    title: "诊断",
    dataIndex: "diag_info",
    ellipsis: true,
  },
];

/**
 * 选择就诊记录弹窗
 * - 头部：时间范围 + 患者 ID（边输入边检索）
 * - 表格固定表头；点击行用 visit_id 交给上层拉取 visit 服务数据
 */
const VisitSelectModal: React.FC<VisitSelectModalProps> = ({
  open,
  initialPatientId,
  selecting = false,
  onClose,
  onSelect,
}) => {
  const { message } = App.useApp();
  const [range, setRange] = useState<[Dayjs, Dayjs]>(defaultRange);
  const [patientIdInput, setPatientIdInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState<VisitRow[]>([]);
  const requestSeqRef = useRef(0);

  const fetchList = async (
    patientId: number | undefined,
    dateRange: [Dayjs, Dayjs],
  ) => {
    const seq = ++requestSeqRef.current;
    if (patientId == null) {
      setDataSource([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await getVisitListAPI({
        patient_id: patientId,
        visit_type: "*",
        visit_start: dateRange[0].format("YYYY-MM-DD"),
        visit_end: dateRange[1].format("YYYY-MM-DD"),
        column_list: "*",
      });
      if (seq !== requestSeqRef.current) return;
      const list = [...(res.visit_list ?? [])].sort((a, b) => {
        const ta = a.visit_time ? dayjs(a.visit_time).valueOf() : 0;
        const tb = b.visit_time ? dayjs(b.visit_time).valueOf() : 0;
        return tb - ta;
      });
      setDataSource(list);
    } catch {
      if (seq !== requestSeqRef.current) return;
      message.error("获取就诊记录失败");
      setDataSource([]);
    } finally {
      if (seq === requestSeqRef.current) setLoading(false);
    }
  };

  // 打开时重置条件并拉取（无数据也展示弹窗）
  useEffect(() => {
    if (!open) return;
    const nextRange = defaultRange();
    const nextPatientId =
      initialPatientId != null && initialPatientId > 0
        ? String(initialPatientId)
        : "";
    setRange(nextRange);
    setPatientIdInput(nextPatientId);
    void fetchList(
      nextPatientId ? Number(nextPatientId) : undefined,
      nextRange,
    );
    // 仅在 open / initialPatientId 变化时重置
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialPatientId]);

  const runFetch = (
    nextPatientIdInput: string,
    nextRange: [Dayjs, Dayjs],
  ) => {
    const trimmed = nextPatientIdInput.trim();
    const patientId =
      trimmed && /^\d+$/.test(trimmed) ? Number(trimmed) : undefined;
    if (trimmed && patientId == null) {
      message.warning("请输入有效的患者ID");
      return;
    }
    void fetchList(patientId, nextRange);
  };

  const runFetchRef = useRef(runFetch);
  runFetchRef.current = runFetch;

  const debouncedFetch = useMemo(
    () =>
      debounce((nextPatientIdInput: string, nextRange: [Dayjs, Dayjs]) => {
        runFetchRef.current(nextPatientIdInput, nextRange);
      }, 400),
    [],
  );

  useEffect(
    () => () => {
      debouncedFetch.cancel();
    },
    [debouncedFetch],
  );

  const handlePatientIdChange = (value: string) => {
    setPatientIdInput(value);
    debouncedFetch(value, range);
  };

  const handleRangeChange = (values: [Dayjs | null, Dayjs | null] | null) => {
    if (!values?.[0] || !values[1]) return;
    const nextRange: [Dayjs, Dayjs] = [values[0], values[1]];
    setRange(nextRange);
    debouncedFetch.cancel();
    runFetch(patientIdInput, nextRange);
  };

  const rangeText = `${range[0].format("YYYY-MM-DD")} ~ ${range[1].format("YYYY-MM-DD")}`;

  return (
    <Modal
      open={open}
      title={
        <Space size={12} wrap className="pr-8">
          <span>选择就诊记录</span>
          <span className="text-(length:--app-theme-font-sm, 13px) font-normal text-(--ant-color-text-secondary, rgba(0,0,0,0.45))">
            时间范围：{rangeText}
          </span>
        </Space>
      }
      onCancel={onClose}
      footer={null}
      width="72%"
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
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <Space size={8}>
          <span className="shrink-0 text-(--ant-color-text-secondary, rgba(0,0,0,0.45))">
            时间范围
          </span>
          <DatePicker.RangePicker
            value={range}
            allowClear={false}
            disabled={selecting}
            onChange={handleRangeChange}
          />
        </Space>
        <Space size={8}>
          <span className="shrink-0 text-(--ant-color-text-secondary, rgba(0,0,0,0.45))">
            患者ID
          </span>
          <Input
            allowClear
            placeholder="输入患者ID检索"
            value={patientIdInput}
            disabled={selecting}
            className="w-[180px]!"
            onChange={(e) => handlePatientIdChange(e.target.value)}
            onPressEnter={() => runFetch(patientIdInput, range)}
          />
        </Space>
      </div>

      <Table<VisitRow>
        size="small"
        rowKey={(row, index) =>
          String(row.visit_id ?? `${row.patient_id}-${row.visit_no}-${index}`)
        }
        loading={loading || selecting}
        columns={columns}
        dataSource={dataSource}
        pagination={false}
        sticky
        scroll={{ y: "calc(100vh - 320px)", x: 1100 }}
        locale={{ emptyText: "暂无就诊记录" }}
        onRow={(record) => ({
          className: selecting ? "cursor-wait" : "cursor-pointer",
          onClick: () => {
            if (selecting || record.visit_id == null) return;
            void onSelect(record);
          },
        })}
      />
    </Modal>
  );
};

export default VisitSelectModal;
