import { PreviewModal } from "../theme";
import { useState } from "react";
import { Alert, Button, Collapse, Table } from "antd";
import type { FactorRow } from "../../../types/factor.d.ts";
import { usePreview } from "../context";
import { detailTarget, previewArgs } from "../model";
import { useRead } from "../hooks/useRead";
import { DateFields } from "../../query-controls/index";
import EmbeddedPreview from "./EmbeddedPreview";
import Feedback from "./Feedback";

export default function FactorDialog({
  factor,
  close,
}: {
  factor: FactorRow;
  close: () => void;
}) {
  const { service, detailQuery: parent, busy, entityIds, host } = usePreview();
  const [date, setDate] = useState(parent.date),
    [applied, setApplied] = useState(parent.date),
    [revision, setRevision] = useState(0);
  const property = useRead(`factor:${factor.factor_id}`, (signal) =>
    service.factor({ factor_id: factor.factor_id! }, signal),
  );
  const data = useRead(
    `factor-values:${JSON.stringify([factor.factor_id, parent.unitId, parent.entityId, applied, revision])}`,
    async (signal) => {
      const entities = parent.entityId
        ? [parent.entityId]
        : ((await service.entities({ unit_id: parent.unitId }, signal)).row_list
            ?.map((row) => row.entity_id!)
            .filter(Boolean) ?? []);
      return entities.length
        ? ((
            await service.factorValues(
              {
                factor_id: factor.factor_id!,
                entity_id_list: entities,
                date_name_list: [applied],
              },
              signal,
            )
          ).row_list ?? [])
        : [];
    },
  );
  const row = property.data?.factor_property ?? factor;
  const args = [
    ...previewArgs({ ...parent, date: applied }, undefined, entityIds),
    {
      arg_code: "arg_factor_id",
      arg_type: "INT",
      arg_value: String(factor.factor_id),
    },
    {
      arg_code: "arg_factor_name",
      arg_type: "STR",
      arg_value: factor.factor_name || "",
    },
    {
      arg_code: "arg_unit_id",
      arg_type: "INT",
      arg_value: String(parent.unitId),
    },
    { arg_code: "arg_unit_name", arg_type: "STR", arg_value: parent.unitName },
  ];
  const target = detailTarget(
    row.detail_type,
    row.detail_id,
    args,
    row.detail_name,
  );
  return (
    <PreviewModal
      title={factor.factor_name}
      open
      zIndex={host ? 1500 + (host.depth + 1) * 100 : undefined}
      className="mp-modal mp-factor-modal"
      footer={null}
      width="100vw"
      style={{ top: 35, maxWidth: "100vw", paddingBottom: 0 }}
      styles={{ body: { height: "calc(100dvh - 107px)", overflow: "auto" } }}
      destroyOnHidden
      closable={!busy}
      mask={{ closable: !busy }}
      keyboard={!busy}
      onCancel={() => {
        if (!busy) close();
      }}
    >
      <div className="mp-summary">说明：{row.factor_code || "-"}</div>
      <Feedback read={property} />
      <div className="mp-factor-query">
        <DateFields disabled={busy} value={date} onChange={setDate} />
        <Button
          type="primary"
          disabled={busy}
          onClick={() => {
            setApplied(date);
            setRevision((value) => value + 1);
          }}
        >
          检索
        </Button>
      </div>
      {target && (
        <EmbeddedPreview
          key={`${JSON.stringify(target)}:${revision}`}
          target={target}
        />
      )}
      <Collapse
        defaultActiveKey={["values"]}
        items={[
          {
            key: "values",
            label: "明细数据",
            children: (
              <>
                <Feedback read={data} />
                <Table
                  size="small"
                  pagination={false}
                  scroll={{ x: "max-content", y: 400 }}
                  dataSource={data.data?.map((row, index) => ({
                    ...row,
                    key: `${row.entity_id}:${row.date_name}:${index}`,
                  }))}
                  columns={[
                    { title: "日期", dataIndex: "date_name" },
                    { title: factor.factor_name, dataIndex: "value_n" },
                  ]}
                />
              </>
            ),
          },
        ]}
      />
    </PreviewModal>
  );
}
