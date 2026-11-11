import { useState } from "react";
import { Alert, Button, Modal, Pagination, Select, Space, Spin } from "antd";
import {
  countBoardComponentVarValue,
  getBoardComponentVarList,
} from "../../../api/board";
import type { ArgValueRow } from "../../../types/references.d.ts";
import { useManagementStyle } from "../../../hooks/useManagementStyle";
import { useRead } from "../hooks/useRead";
import { checkSignal, type LoadQueue } from "../runtime";
import { readVariable } from "../service";
export default function RawData({
  componentId,
  args,
  queue,
  close,
  depth = 0,
}: {
  componentId: number;
  args: ArgValueRow[];
  queue: LoadQueue;
  close: () => void;
  depth?: number;
}) {
  const [code, setCode] = useState<string>(),
    [page, setPage] = useState(1);
  const variables = useRead(`vars:${componentId}`, (signal) =>
    queue.run(signal, async () => {
      const response = await getBoardComponentVarList({
        board_component_id: componentId,
      });
      checkSignal(signal);
      return response.row_list ?? [];
    }),
  );
  const selected =
    variables.data?.find((row) => row.var_code === code) ?? variables.data?.[0];
  const result = useRead(
    `${selected?.var_code}:${page}:${JSON.stringify(args)}`,
    (signal) =>
      queue.run(signal, async () => {
        if (!selected?.var_code) return undefined;
        const count =
          selected.var_type === "JSON"
            ? (
                await countBoardComponentVarValue({
                  board_component_id: componentId,
                  var_code: selected.var_code,
                  arg_list: args,
                })
              ).row_count
            : undefined;
        checkSignal(signal);
        return {
          value: await readVariable(
            componentId,
            selected.var_code,
            args,
            signal,
            selected.var_type === "JSON" ? page : undefined,
          ),
          count,
        };
      }),
  );
  const style = useManagementStyle();
  return (
    <Modal
      title="原始变量数据"
      open
      width="min(1000px, 94vw)"
      zIndex={1560 + depth * 100}
      style={style}
      onCancel={close}
      footer={null}
      destroyOnHidden
    >
      <Space orientation="vertical" style={{ width: "100%" }}>
        <Select
          aria-label="选择变量"
          style={{ minWidth: 240 }}
          loading={variables.loading}
          value={selected?.var_code}
          placeholder="暂无变量"
          options={variables.data
            ?.filter((row) => row.var_code)
            .map((row) => ({
              value: row.var_code,
              label: row.var_name || row.var_code,
            }))}
          onChange={(value) => {
            setCode(value);
            setPage(1);
          }}
        />
        {(variables.error || result.error) && (
          <Alert
            type="error"
            showIcon
            title={variables.error || result.error}
            action={
              <Button
                type="link"
                size="small"
                onClick={variables.error ? variables.reload : result.reload}
              >
                重试
              </Button>
            }
          />
        )}
        <Spin spinning={variables.loading || result.loading}>
          <pre className="bp-raw">
            {result.data
              ? JSON.stringify(result.data.value, null, 2)
              : "暂无变量数据"}
          </pre>
        </Spin>
        {result.data?.count !== undefined && (
          <Pagination
            current={page}
            pageSize={50}
            total={Number(result.data.count)}
            showSizeChanger={false}
            onChange={setPage}
          />
        )}
      </Space>
    </Modal>
  );
}
