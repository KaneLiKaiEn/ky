import { useMemo, type CSSProperties } from "react";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Dropdown,
  Empty,
  Form,
  Modal,
  Row,
  Spin,
  Table,
} from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import type { EmrRow } from "@/types/emr";
import EmrFormDialog from "./components/EmrFormDialog";
import EmrMatrixCell from "./components/EmrMatrixCell";
import MatrixCell from "./components/MatrixCell";
import TimeArea from "./components/TimeArea";
import useNursingMatrix from "./hooks/useNursingMatrix";
import type { CellValue, NursingMatrixProps, NursingRow } from "./types";
import "./index.css";

export type { NursingMatrixProps, NursingPage } from "./types";

const isGroup = (row: NursingRow) => row.type === "group";

export default function NuringListTable({
  visit_id,
  page,
  className,
}: NursingMatrixProps) {
  const visitId = Number(visit_id);
  const validVisitId = Number.isFinite(visitId) && visitId > 0 ? visitId : 0;
  const matrix = useNursingMatrix(validVisitId, page);

  const dataSource = useMemo(() => {
    const data: NursingRow[] = [];
    let lastGroup: string | undefined;
    matrix.rows.forEach((row) => {
      if (row.group !== lastGroup) {
        data.push({
          key: `group-${row.group}`,
          type: "group",
          label: row.group,
          dictNote: row.dictNote,
          values: {},
        });
        lastGroup = row.group;
      }
      data.push(row);
    });
    return data;
  }, [matrix.rows]);

  const columns = useMemo(() => {
    const timeColumns = matrix.times.map((time, index) => ({
      title: (
        <Dropdown
          trigger={["hover"]}
          menu={{
            items: [
              { key: "add", label: "新增" },
              { key: "copy", label: "复制" },
              { key: "paste", label: "粘贴" },
              { key: "delete", label: "删除" },
            ],
            onClick: ({ key }) =>
              matrix.handleHeaderAction(
                key as "add" | "copy" | "paste" | "delete",
                time,
              ),
          }}
        >
          <div className="cursor-pointer">{dayjs(time).format("HH:mm")}</div>
        </Dropdown>
      ),
      dataIndex: time,
      width: 100,
      align: "center" as const,
      className: "col-time",
      onHeaderCell: () => ({
        className:
          matrix.sourceTime === time
            ? "col-time-header is-source"
            : "col-time-header",
      }),
      onCell: (record: NursingRow) => {
        if (isGroup(record)) {
          return index === 0
            ? { colSpan: matrix.times.length }
            : { colSpan: 0 };
        }
        const current = record.values[time]?.[1];
        const numVal = Number(current);
        const min = record.elemProperty?.value_min;
        const max = record.elemProperty?.value_max;
        const hasRange = min && max && !(min === "0.00" && max === "0.00");
        const outOfRange =
          !!numVal &&
          !Number.isNaN(numVal) &&
          !!hasRange &&
          (numVal > Number(max) || numVal < Number(min));
        return {
          className: outOfRange ? "edit-cell is-out-of-range" : "edit-cell",
        };
      },
      render: (_value: unknown, row: NursingRow) => {
        if (isGroup(row)) return null;
        if (page === "护理评估" || row.type?.includes("EVALUEATE_EMR")) {
          return (
            <EmrMatrixCell
              row={row}
              time={time}
              value={row.values[time]}
              onOpen={matrix.openEmr}
              onDelete={matrix.deleteCell}
            />
          );
        }
        return (
          <MatrixCell
            row={row}
            time={time}
            value={row.values[time] as CellValue | undefined}
            copyInfoRef={matrix.copyInfoRef}
            onChange={matrix.updateCell}
            onDelete={matrix.deleteCell}
            onPaste={matrix.pasteCell}
          />
        );
      },
    }));

    return [
      {
        title: `${page.slice(2)}项目`,
        dataIndex: "label",
        fixed: "left" as const,
        width: 160,
        onCell: (record: NursingRow) => ({
          colSpan: 1,
          className: isGroup(record) ? undefined : "item-cell",
          style: record.dictNote
            ? ({ "--row-bg": record.dictNote } as CSSProperties)
            : undefined,
        }),
        render: (_value: unknown, row: NursingRow) =>
          isGroup(row) ? (
            <div>{row.label}</div>
          ) : (
            <div className="flex items-center justify-between gap-2 ps-2">
              <span>{row.label}</span>
              <span className="text-xs text-gray-500">{row.unit}</span>
            </div>
          ),
      },
      ...timeColumns,
    ];
  }, [matrix, page]);

  if (!validVisitId) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center">
        <Empty description="请先选择患者" />
      </div>
    );
  }

  return (
    <div
      className={className ?? "flex h-full min-h-0 flex-col overflow-hidden"}
    >
      <Spin
        spinning={matrix.loading}
        tip="加载中..."
        wrapperClassName="flex h-full min-h-0 flex-col [&_.ant-spin-container]:flex [&_.ant-spin-container]:h-full [&_.ant-spin-container]:min-h-0 [&_.ant-spin-container]:flex-col"
      >
        <Card
          className="nursing-matrix-table flex h-full min-h-0 flex-col"
          title={
            <div className="flex items-center gap-3">
              <div className="shrink-0 font-medium">{page}</div>
              <div className="flex flex-1 justify-center">
                <TimeArea
                  date={matrix.date}
                  shift={matrix.shift}
                  onDateChange={matrix.setDate}
                  onShiftChange={matrix.setShift}
                />
              </div>
              <Button
                size="small"
                type="primary"
                icon={<ReloadOutlined />}
                onClick={() => void matrix.refresh(true)}
              >
                刷新
              </Button>
            </div>
          }
        >
          <Table
            size="small"
            bordered
            pagination={false}
            rowKey="key"
            columns={columns}
            dataSource={dataSource}
            rowClassName={(record) => (isGroup(record) ? "group-row" : "")}
            onRow={(record) => ({
              style: record.dictNote
                ? ({ "--row-bg": record.dictNote } as CSSProperties)
                : undefined,
            })}
            scroll={{
              x: "max-content",
              y:
                page === "护理评估"
                  ? "calc(100vh - 280px)"
                  : "calc(100vh - 240px)",
            }}
          />
          {page === "护理评估" && matrix.nursingTip ? (
            <div className="mt-2 text-sky-600">{matrix.nursingTip}</div>
          ) : null}
        </Card>
      </Spin>

      <Modal
        title="添加新时间点"
        open={matrix.timeOpen}
        okText="添加"
        cancelText="取消"
        onCancel={() => matrix.setTimeOpen(false)}
        onOk={() => void matrix.confirmAddTime()}
      >
        <Form form={matrix.timeForm} layout="vertical">
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="care_time"
                label="时间点"
                rules={[{ required: true, message: "时间点不能为空" }]}
              >
                <DatePicker showTime className="w-full" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {page === "护理评估" ? (
        <EmrFormDialog
          open={matrix.emrDialog.open}
          visitId={validVisitId}
          emrId={matrix.emrDialog.emrId}
          docName={matrix.emrDialog.docName}
          emrTime={matrix.emrDialog.emrTime}
          patient={matrix.emrDialog.patient}
          elemOptions={matrix.emrDialog.elemOptions}
          history={matrix.records as EmrRow[]}
          onClose={() =>
            matrix.setEmrDialog((prev) => ({ ...prev, open: false, emrId: 0 }))
          }
          onEmrChange={(emrId) =>
            matrix.setEmrDialog((prev) => ({ ...prev, emrId }))
          }
          onChanged={() => void matrix.refresh(false)}
        />
      ) : null}
    </div>
  );
}
