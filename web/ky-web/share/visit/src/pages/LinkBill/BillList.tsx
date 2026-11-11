import React, { useState } from "react";
import { Button, Empty, Input, InputNumber, Modal, Space, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { getSessionId } from "comm/session";
import {
  getApplyDetailDispenseListAPI,
  getBillApplyAPI,
  getSessionInfoAPI,
  newApplyWithdrawAPI,
  refundBillAPI,
} from "@/api/linkBill";
import { message } from "antd";
import { calcSub, extractName, formatRemainQuantity, itemTypeToChinese } from "./utils";

const { TextArea } = Input;

/** 数字格式化：保留两位小数 */
const formatQty = (text: string | number | null | undefined) => {
  if (text == null || text === "") return "";
  const qty = Number(text);
  if (!Number.isFinite(qty)) return String(text);
  return qty.toFixed(2);
};

export interface BillListProps {
  itemRow: any[];
  visitId: string;
  billIdList: any[];
  setBillIdList: React.Dispatch<React.SetStateAction<any[]>>;
  singleItemSave: any;
  setSingleItemSave: (item: any) => void;
  setTimeValue: (v: any) => void;
  getBillList: () => void;
  isLoading: boolean;
  /** 退药成功后回调（供父组件刷新处方单/退药单列表） */
  onWithdrawSuccess?: () => void;
}

export default function BillList({
  itemRow,
  visitId,
  billIdList,
  setBillIdList,
  setSingleItemSave,
  setTimeValue,
  getBillList,
  isLoading,
  onWithdrawSuccess,
}: BillListProps) {
  // 退药弹窗相关状态
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawItem, setWithdrawItem] = useState<any>(null);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [dispenseList, setDispenseList] = useState<any[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [withdrawQtyMap, setWithdrawQtyMap] = useState<Record<string, number | null>>({});
  const [withdrawNote, setWithdrawNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectedRows = dispenseList.filter((row) => selectedRowKeys.includes(row.row_key));

  // 双击进入编辑模式
  function getBillPropertyReq(item: any) {
    setSingleItemSave(item);
    setTimeValue(item.bill_time);
  }

  // 获取会话信息
  async function getSessionInfo() {
    const sid = getSessionId();
    if (!sid) return;
    try {
      const res = await getSessionInfoAPI({ session_id: sid });
      if (res.code === 0) {
        setSessionInfo(res.session_info);
      }
    } catch {
      // 忽略
    }
  }

  // 打开退药弹窗：获取摆药记录
  async function handleOpenWithdraw(item: any) {
    setWithdrawItem(item);
    setWithdrawOpen(false);
    setDetailLoading(true);
    setSelectedRowKeys([]);
    setWithdrawQtyMap({});
    setWithdrawNote("");
    getSessionInfo();
    try {
      const res = await getApplyDetailDispenseListAPI({ bill_id: Number(item.bill_id) });
      if (res.code !== 0) {
        message.error(res.message || "获取摆药记录失败");
        setDispenseList([]);
        return;
      }
      if (!res.row_list || res.row_list.length === 0) {
        message.warning("该计费项目暂无摆药记录");
        setDispenseList([]);
        return;
      }
      setWithdrawOpen(true);
      const rowList = res.row_list ?? [];
      const merged = rowList.map((dispense: any, index: number) => ({
        ...item,
        ...dispense,
        item_name: dispense.item_name || item.item_name,
        item_spec: dispense.item_spec || item.item_spec,
        item_unit: dispense.item_unit || item.item_quantity_unit || item.item_unit,
        factory_name: dispense.factory_name || item.factory_name,
        batch_no: dispense.batch_no || item.batch_no,
        visit_id: dispense.visit_id ?? Number(visitId),
        patient_id: dispense.patient_id ?? item.patient_id,
        visit_info: dispense.visit_info || item.visit_info || "",
        row_key: String(dispense.dispense_id ?? `d-${index}`),
      }));
      setDispenseList(merged);
    } catch {
      setDispenseList([]);
    } finally {
      setDetailLoading(false);
    }
  }

  function handleClose() {
    setWithdrawOpen(false);
    setWithdrawItem(null);
    setDispenseList([]);
    setSelectedRowKeys([]);
    setWithdrawQtyMap({});
    setWithdrawNote("");
  }

  function handleSelectionChange(keys: React.Key[], rows: any[]) {
    setSelectedRowKeys(keys);
    setWithdrawQtyMap((prev) => {
      const next: Record<string, number | null> = {};
      rows.forEach((row) => {
        const key = String(row.row_key);
        if (prev[key] !== undefined) {
          next[key] = prev[key];
        } else {
          const qty = Number(row.dispense_quantity);
          next[key] = Number.isFinite(qty) ? qty : null;
        }
      });
      return next;
    });
  }

  function handleWithdrawQtyChange(rowKey: string, value: number | null) {
    setWithdrawQtyMap((prev) => ({ ...prev, [rowKey]: value }));
  }

  async function handleApplyWithdraw() {
    if (!withdrawItem) {
      message.warning("请先选择计费项目");
      return;
    }
    if (!sessionInfo) {
      message.warning("会话信息未就绪，请稍后重试");
      return;
    }
    if (!selectedRows.length) {
      message.warning("请勾选需要退药的明细");
      return;
    }
    const invalid = selectedRows.some((row) => {
      const qty = withdrawQtyMap[String(row.row_key)];
      return qty == null || !Number.isFinite(Number(qty)) || Number(qty) <= 0;
    });
    if (invalid) {
      message.warning("请填写有效的退药数量");
      return;
    }
    if (!withdrawNote.trim()) {
      message.warning("请填写退药原因");
      return;
    }
    const missingDispense = selectedRows.some((row) => row.dispense_id == null);
    if (missingDispense) {
      message.warning("明细缺少 dispense_id，无法申请退药");
      return;
    }
    const applyId = selectedRows[0]?.apply_id ?? dispenseList[0]?.apply_id;
    if (applyId == null) {
      message.warning("缺少 apply_id，无法申请退药");
      return;
    }

    setSubmitting(true);
    try {
      const res = await newApplyWithdrawAPI({
        apply_id: Number(applyId),
        org_id: Number(sessionInfo.org_id),
        withdraw_time: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        withdraw_note: withdrawNote.trim(),
        user_id: Number(sessionInfo.user_id),
        user_name: sessionInfo.user_name ?? "",
        dept_id: Number(sessionInfo.dept_id),
        dept_name: sessionInfo.dept_name ?? "",
        store_id: Number(withdrawItem.store_id),
        store_name: withdrawItem.store_name ?? "",
        row_list: selectedRows.map((row) => ({
          dispense_id: Number(row.dispense_id),
          detail_id: Number(row.detail_id),
          visit_id: Number(row.visit_id),
          patient_id: Number(row.patient_id),
          baby_id: 0,
          withdraw_quantity: String(withdrawQtyMap[String(row.row_key)] ?? ""),
        })),
      });
      if (res.code !== 0) {
        message.error(res.message);
        return;
      }
      message.success("申请退药成功");
      // 这边要去通知父组件刷新列表
      onWithdrawSuccess?.();
      handleClose();
    } catch {
      // 错误已由请求拦截器提示
    } finally {
      setSubmitting(false);
    }
  }

  // 退费
  async function doRefund(item: any) {
    try {
      const applyRes = await getBillApplyAPI({ bill_id: Number(item.bill_id) });
      const hasActiveApply = (applyRes?.apply_list ?? []).some(
        (a) => a?.apply_status !== "CANCEL",
      );
      if (hasActiveApply) {
        message.warning("已生成处方，不允许退费");
        return;
      }

      await refundBillAPI({
        bill_id: Number(item.bill_id),
        refund_quantity: String(calcSub(item.bill_quantity, item.refund_quantity).toFixed(4)),
      });
      message.success("退费成功");
      getBillList();
    } catch (e) {
      // 错误已由请求拦截器提示
    }
  }

  const columns: ColumnsType<any> = [
    { title: "编号", dataIndex: "bill_no", width: 40 },
    {
      title: "状态",
      width: 60,
      render: (_, item) =>
        item.charge_time ? <span style={{ color: "red" }}>已提交</span> : "未提交",
    },
    { title: "类型", width: 70, render: (_, item) => itemTypeToChinese(item.item_type) },
    { title: "项目代码", dataIndex: "item_code", width: 90, ellipsis: true },
    {
      title: "名称",
      dataIndex: "item_name",
      width: 160,
      onCell: () => ({ style: { whiteSpace: "normal", wordBreak: "break-word" } }),
    },
    { title: "用法", dataIndex: "usage_name", width: 90, onCell: () => ({ style: { whiteSpace: "normal", wordBreak: "break-word" } }) },
    { title: "规格", dataIndex: "item_spec", width: 90, onCell: () => ({ style: { whiteSpace: "normal", wordBreak: "break-word" } }) },
    { title: "频次", dataIndex: "usage_note", width: 70, render: (v: any) => v || "-" },
    { title: "剂量", dataIndex: "dosage_quantity", width: 70, render: (v: any) => (v != null && v !== "" ? parseFloat(v) : "-") },
    { title: "剂量单位", dataIndex: "dosage_unit", width: 70, render: (v: any) => v || "-" },
    {
      title: "自费",
      width: 45,
      render: (_, item) => (item.bill_tag?.includes("自费") ? <Tag color="red">是</Tag> : "-"),
    },
    {
      title: "价格",
      width: 80,
      render: (_, item) =>
        item.item_price
          ? item.item_type === "DRUG"
            ? `${parseFloat(item.item_price)}/${item.item_price_unit || ""}`
            : parseFloat(item.item_price)
          : "-",
    },
    {
      title: "数量",
      width: 45,
      render: (_, item) => (item.item_quantity ? parseFloat(item.item_quantity) : "-"),
    },
    { title: "单位", dataIndex: "item_quantity_unit", width: 45 },
    {
      title: "退费",
      width: 110,
      render: (_, item) =>
        item.link_tag?.includes("临时") ? (
          "-"
        ) : (
          <div>
          <Button
            size="small"
            type={item.charge_time && calcSub(item.bill_quantity, item.refund_quantity) > 0 ? "primary" : "default"}
            disabled={!item.charge_time || calcSub(item.bill_quantity, item.refund_quantity) <= 0}
            onClick={() => {
              if (window.confirm("是否确认退费？")) doRefund(item);
            }}
          >
            退费
          </Button>
          {
          item.item_type === "DRUG" &&
          <Button
            style={{ marginLeft: 8 }}
            size="small"
            type="primary"
            onClick={() => handleOpenWithdraw(item)}
          >
            退药
          </Button>
          }
          
          </div>
        ),
    },
    {
      title: "金额",
      width: 80,
      render: (_, item) => (item.item_amount ? Number(item.item_amount).toFixed(2) : "-"),
    },
    { title: "残余量", width: 80, render: (_, item) => formatRemainQuantity(item) },
    { title: "执行单号", dataIndex: "charge_no", width: 70, ellipsis: true },
    {
      title: "申请人（科室）",
      width: 130,
      render: (_, item) => (
        <span style={{ whiteSpace: "normal", wordBreak: "break-word" }}>
          {`${item.dept_apply_user || ""}${item.dept_name ? `(${item.dept_name})` : "-"}`}
        </span>
      ),
    },
    {
      title: "执行人（科室）",
      width: 130,
      render: (_, item) => (
        <span style={{ whiteSpace: "normal", wordBreak: "break-word" }}>
          {`${item.dept_exec_user || ""}${item.dept_exec_name ? `(${item.dept_exec_name})` : "-"}`}
        </span>
      ),
    },
    {
      title: "计费时间",
      width: 110,
      render: (_, item) => item.bill_time?.slice(5, 16),
    },
    {
      title: "提交时间",
      width: 110,
      render: (_, item) => item.charge_time?.slice(5, 16) || "-",
    },
    {
      title: "提交人",
      width: 80,
      render: (_, item) => (item.create_note ? extractName(item.create_note) : "-"),
    },
  ];

  const detailColumns: ColumnsType<any> = [
    { title: "药品名称", dataIndex: "item_name", key: "item_name" },
    { title: "药品规格", dataIndex: "item_spec", key: "item_spec" },
    {
      title: "配药数量",
      dataIndex: "dispense_quantity",
      key: "dispense_quantity",
      render: (text, record) => {
        const qty = formatQty(text);
        if (!qty) return "";
        return `${qty}${record.item_unit || ""}`;
      },
    },
    {
      title: "退药数量",
      dataIndex: "withdraw_quantity",
      key: "withdraw_quantity",
      render: (text, record) => {
        const qty = formatQty(text);
        if (!qty) return "";
        return `${qty}${record.item_unit || ""}`;
      },
    },
    {
      title: "状态",
      key: "withdraw_status",
      width: 100,
      render: (_, record) => {
        const dispenseQty = Number(record.dispense_quantity);
        const withdrawQty = Number(record.withdraw_quantity);
        if (!Number.isFinite(dispenseQty) || !Number.isFinite(withdrawQty)) {
          return null;
        }
        if (dispenseQty === withdrawQty) {
          return <Tag color="red">已退完</Tag>;
        }
        if (dispenseQty > withdrawQty && withdrawQty !== 0) {
          return <Tag color="orange">部分退</Tag>;
        }
        return <Tag color="blue">未退</Tag>;
      },
    },
    { title: "追溯码", dataIndex: "trace_no", key: "trace_no" },
    { title: "批次号", dataIndex: "batch_no", key: "batch_no" },
    { title: "厂家", dataIndex: "factory_name", key: "factory_name" },
    { title: "患者信息", dataIndex: "visit_info", key: "visit_info" },
    { title: "就诊号", dataIndex: "visit_id", key: "visit_id" },
  ];

  return (
    <>
      <style>{`
        .link-bill-table .ant-table-cell {
          padding: 4px 8px !important;
          font-size: 12px;
        }
        .link-bill-table .ant-table-cell .ant-btn {
          font-size: 12px;
        }
        .link-bill-table .ant-table-cell .ant-select {
          font-size: 12px;
        }
        .ant-table-body {
          height: 50vh;
        }
      `}</style>
      <Table
        className="link-bill-table"
        rowKey="bill_id"
        size="small"
        loading={!isLoading}
        dataSource={itemRow}
        columns={columns}
        scroll={{ x: 1800, y: "50%" }}
        pagination={false}
        rowSelection={{
          selectedRowKeys: billIdList.map((i: any) => i.bill_id),
          onChange: (_keys, rows) => setBillIdList(rows),
          getCheckboxProps: (record) => ({
            disabled: record.link_tag?.includes("临时"),
          }),
        }}
        onRow={(record) => ({
          onDoubleClick: () => {
            if (record.link_tag?.includes("临时")) return;
            if (record?.bill_tag?.includes("[自动]")) {
              message.warning("该药品为自动生成账单，不可编辑，需删除后重新获取重新同步");
            } else {
              getBillPropertyReq(record);
            }
          },
        })}
        locale={{ emptyText: "暂无物品，请添加物品" }}
      />

      {/* 退药弹窗 */}
      <Modal
        title="申请退药"
        open={withdrawOpen}
        onCancel={handleClose}
        width="98vw"
        destroyOnHidden
        styles={{
          body: {
            height: "60vh",
            maxHeight: "75vh",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            paddingBottom: 8,
          },
        }}
        footer={[
          <Button key="cancel" onClick={handleClose}>
            取消
          </Button>,
          <Button
            key="apply"
            type="primary"
            loading={submitting}
            onClick={handleApplyWithdraw}
          >
            申请退药
          </Button>,
        ]}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            minHeight: 0,
            flex: 1,
          }}
        >
          {/* 摆药单详情 */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              flex: 3,
              overflow: "hidden",
            }}
          >
            <span style={{ fontWeight: "bold", marginBottom: 8, flexShrink: 0 }}>
              摆药单详情
            </span>
            <div style={{ minHeight: 0, flex: 1, overflow: "hidden" }}>
              <Table
                size="small"
                scroll={{ y: 240 }}
                dataSource={dispenseList}
                columns={detailColumns}
                loading={detailLoading}
                rowKey="row_key"
                pagination={false}
                rowSelection={{
                  selectedRowKeys,
                  onChange: handleSelectionChange,
                }}
              />
            </div>
          </div>

          {/* 退药选择 */}
          <div
            style={{
              marginTop: 8,
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              flex: 2,
              overflow: "hidden",
              borderTop: "1px solid #f0f0f0",
              paddingTop: 8,
            }}
          >
            <span style={{ fontWeight: "bold", marginBottom: 8, flexShrink: 0 }}>
              退药选择
            </span>
            <div style={{ minHeight: 0, flex: 1, overflow: "auto", paddingRight: 4 }}>
              {!selectedRows.length ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="请勾选上方药品"
                />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {selectedRows.map((row) => {
                    const key = String(row.row_key);
                    const unit = row.item_unit || "";
                    return (
                      <div
                        key={key}
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <Space.Compact size="small" style={{ minWidth: 140, flex: 1 }}>
                          <Input
                            size="small"
                            readOnly
                            value="药品名称"
                            style={{ width: 72, pointerEvents: "none" }}
                          />
                          <Input
                            size="small"
                            readOnly
                            value={row.item_name ?? ""}
                            style={{ flex: 1 }}
                          />
                        </Space.Compact>
                        <Space.Compact size="small">
                          <Input
                            size="small"
                            readOnly
                            value="药品数量"
                            style={{ width: 72, pointerEvents: "none" }}
                          />
                          <Input
                            size="small"
                            readOnly
                            value={formatQty(row.dispense_quantity)}
                            style={{ width: 88 }}
                          />
                          {unit ? (
                            <Input
                              size="small"
                              readOnly
                              value={unit}
                              style={{ width: 48, pointerEvents: "none" }}
                            />
                          ) : null}
                        </Space.Compact>
                        <Space.Compact size="small">
                          <Input
                            size="small"
                            readOnly
                            value="退药数量"
                            style={{ width: 72, pointerEvents: "none" }}
                          />
                          <InputNumber
                            size="small"
                            min={0}
                            max={
                              Number.isFinite(Number(row.dispense_quantity))
                                ? Number(row.dispense_quantity)
                                : undefined
                            }
                            value={withdrawQtyMap[key]}
                            onChange={(val) => handleWithdrawQtyChange(key, val)}
                            style={{ width: 100 }}
                          />
                          {unit ? (
                            <Input
                              size="small"
                              readOnly
                              value={unit}
                              style={{ width: 48, pointerEvents: "none" }}
                            />
                          ) : null}
                        </Space.Compact>
                      </div>
                    );
                  })}
                  <div style={{ marginTop: 4 }}>
                    <div style={{ marginBottom: 4, fontSize: 14 }}>退药原因</div>
                    <TextArea
                      value={withdrawNote}
                      onChange={(e) => setWithdrawNote(e.target.value)}
                      placeholder="请输入退药原因"
                      autoSize={{ minRows: 2, maxRows: 4 }}
                      maxLength={200}
                      showCount
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}

