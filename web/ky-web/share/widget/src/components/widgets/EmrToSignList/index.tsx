import React, { useCallback, useEffect, useMemo, useState } from "react";
import { App, Button, Empty, Modal, Table, Tooltip } from "antd";
import type { ColumnsType, TableRowSelection } from "antd/es/table/interface";
import { ReloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import EmrContent from "visit/emrContent";
import { getSessionId, onSessionIdChange } from "comm/session";
import { getSessionInfo } from "@/api/auth";
import {
  getEmrStakeholderToSignListAPI,
  signEmrStakeholderAPI,
} from "@/api/emr";
import { getParamValue } from "@/api/sys";
import { getVisitProperty2API } from "@/api/visit";
import type { EmrToSignListItem } from "@/types/emr";

const formatDateTime = (value?: string): string => {
  if (!value) return "-";
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD HH:mm") : value;
};

/** 待签名病历列表 widget */
const EmrToSignList: React.FC = () => {
  const { message } = App.useApp();
  const [rows, setRows] = useState<EmrToSignListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [signing, setSigning] = useState(false);
  const [batchSigning, setBatchSigning] = useState(false);
  const [showCheckbox, setShowCheckbox] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
  const [viewEmrId, setViewEmrId] = useState<number | null>(null);

  const loadParam = useCallback(async () => {
    try {
      const res = await getParamValue({ item_code: "emr_sign_ca" });
      const value =
        res.item_value_int ??
        (res.item_value != null && res.item_value !== ""
          ? Number(res.item_value)
          : undefined);
      const caEnabled = value === 1;
      setShowCheckbox(!caEnabled);
    } catch {
      setShowCheckbox(true);
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      const sessionRes = await getSessionInfo({
        session_id: getSessionId() ?? undefined,
      });
      const userId = sessionRes.session_info?.user_id;
      if (!userId) {
        setRows([]);
        return;
      }

      const res = await getEmrStakeholderToSignListAPI({});
      const signRowList: EmrToSignListItem[] =
        res.code === 0 ? (res.row_list ?? []) : [];

      const merged: EmrToSignListItem[] = [];
      const seen = new Set<number>();
      for (const row of signRowList) {
        const emrId = row.emr_id;
        if (emrId == null || emrId <= 0 || seen.has(emrId)) continue;
        seen.add(emrId);
        merged.push(row);
      }

      const visitIdList = [
        ...new Set(
          merged
            .map((row) => row.visit_id)
            .filter((id): id is number => id != null && id > 0),
        ),
      ];

      const visitInfoById = new Map<number, string>();
      if (visitIdList.length > 0) {
        try {
          const propertyRes = await getVisitProperty2API({
            visit_id_list: visitIdList,
            column_visit: "*",
          });
          if (propertyRes.code === 0) {
            for (const visit of propertyRes.visit_list ?? []) {
              if (visit.visit_id != null && visit.visit_id > 0) {
                visitInfoById.set(visit.visit_id, visit.visit_info ?? "");
              }
            }
          }
        } catch {
          // 属性接口失败时仍展示待签名列表，患者信息留空或沿用接口原值
        }
      }

      const rowsWithVisitInfo = merged.map((row) => ({
        ...row,
        visit_info:
          (row.visit_id != null
            ? visitInfoById.get(row.visit_id)
            : undefined) ??
          row.visit_info ??
          "",
      }));

      setRows(rowsWithVisitInfo);
      setSelectedRowKeys((prev) =>
        prev.filter((key) => merged.some((row) => row.emr_id === key)),
      );
    } catch {
      setRows([]);
      setSelectedRowKeys([]);
      message.error("加载待签名病历失败");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [message]);

  useEffect(() => {
    void loadParam();
  }, [loadParam]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    return onSessionIdChange((payload) => {
      // 监听 sessionId 变化（主体切换病区）：按新 session.dept_id 重拉待签名病历
      setSelectedRowKeys([]);
      setViewEmrId(null);
      if (payload.action === "set" && payload.sessionId) {
        setLoading(true);
        void loadData();
      } else {
        setRows([]);
      }
    });
  }, [loadData]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    void loadData();
  }, [loadData]);

  const signEmrList = useCallback(
    async (emrIdList: number[], mode: "all" | "batch") => {
      if (!emrIdList.length) {
        message.warning("没有可签名的病历");
        return;
      }
      const setLoadingState = mode === "all" ? setSigning : setBatchSigning;
      setLoadingState(true);
      try {
        const res = await signEmrStakeholderAPI({ emr_id_list: emrIdList });
        if (res.code !== 0) {
          message.error(`${res.message || ""}${res.hint || ""}`);
          return;
        }
        message.success(mode === "all" ? "一键全签成功" : "批量签名成功");
        setSelectedRowKeys([]);
        setRefreshing(true);
        await loadData();
      } catch {
        message.error(mode === "all" ? "一键全签失败" : "批量签名失败");
      } finally {
        setLoadingState(false);
      }
    },
    [loadData, message],
  );

  const handleSignAll = useCallback(() => {
    const emrIdList = rows
      .map((row) => row.emr_id)
      .filter((id): id is number => id != null && id > 0);
    void signEmrList(emrIdList, "all");
  }, [rows, signEmrList]);

  const handleBatchSign = useCallback(() => {
    void signEmrList(selectedRowKeys, "batch");
  }, [selectedRowKeys, signEmrList]);

  const columns: ColumnsType<EmrToSignListItem> = useMemo(
    () => [
      {
        title: "患者信息",
        dataIndex: "visit_info",
        key: "visit_info",
        ellipsis: true,
        render: (value?: string) => value || "-",
      },
      {
        title: "病历标题",
        dataIndex: "emr_title",
        key: "emr_title",
        ellipsis: true,
      },
      {
        title: "病历时间",
        dataIndex: "emr_time",
        key: "emr_time",
        width: 120,
        render: (value?: string) => formatDateTime(value),
      },
      {
        title: "病历用户",
        dataIndex: "user_name_list",
        key: "user_name_list",
        width: 140,
        ellipsis: true,
        render: (value?: string) => value?.trim() || "-",
      },
      {
        title: "操作",
        key: "action",
        width: 72,
        fixed: "right",
        render: (_, record) =>
          record.emr_id ? (
            <Button
              type="link"
              size="small"
              className="px-0!"
              onClick={() => setViewEmrId(record.emr_id!)}
            >
              查看
            </Button>
          ) : null,
      },
    ],
    [],
  );

  const rowSelection = useMemo<
    TableRowSelection<EmrToSignListItem> | undefined
  >(
    () =>
      showCheckbox
        ? {
            selectedRowKeys,
            onChange: (keys) => {
              setSelectedRowKeys(keys.map(Number).filter((id) => id > 0));
            },
          }
        : undefined,
    [selectedRowKeys, showCheckbox],
  );

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden p-3">
      <div className="mb-2 flex shrink-0 items-center justify-between gap-2 border-b border-(--app-theme-border) pb-2">
        <span className="text-xs text-(--app-theme-text-secondary)">
          待签名 {rows.length} 份
        </span>
        <div className="ml-auto flex items-center gap-2">
          {showCheckbox && selectedRowKeys.length > 0 ? (
            <Button
              type="primary"
              size="small"
              loading={batchSigning}
              onClick={handleBatchSign}
            >
              批量签名
            </Button>
          ) : null}
          {showCheckbox ? (
            <Button
              type="primary"
              size="small"
              loading={signing}
              disabled={rows.length === 0}
              onClick={handleSignAll}
            >
              一键全签
            </Button>
          ) : null}
          <Tooltip title="刷新列表">
            <Button
              type="text"
              size="small"
              icon={<ReloadOutlined spin={refreshing} />}
              onClick={handleRefresh}
            />
          </Tooltip>
        </div>
      </div>

      <div className="min-h-0 min-w-0 flex-1 overflow-hidden [&_.ant-table-tbody>tr>td]:text-xs [&_.ant-table-thead>tr>th]:text-xs">
        <Table<EmrToSignListItem>
          size="small"
          rowKey="emr_id"
          columns={columns}
          dataSource={rows}
          loading={loading || refreshing}
          pagination={false}
          rowSelection={rowSelection}
          scroll={{ x: "max-content", y: "100%" }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="暂无待签名病历"
              >
                <Button
                  size="small"
                  icon={<ReloadOutlined />}
                  onClick={handleRefresh}
                >
                  重新加载
                </Button>
              </Empty>
            ),
          }}
        />
      </div>

      <Modal
        title="病历内容"
        open={viewEmrId != null}
        width="90vw"
        footer={null}
        centered={false}
        style={{ top: 24 }}
        destroyOnHidden
        onCancel={() => setViewEmrId(null)}
      >
        {viewEmrId != null ? (
          <div className="h-[85vh] overflow-hidden">
            <EmrContent
              key={viewEmrId}
              emr_id={viewEmrId}
              onCommitted={() => {
                setViewEmrId(null);
                void loadData();
              }}
            />
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default EmrToSignList;
