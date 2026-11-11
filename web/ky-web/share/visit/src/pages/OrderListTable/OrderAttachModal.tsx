import { useCallback, useEffect, useRef, useState } from "react";
import { DeleteOutlined } from "@ant-design/icons";
import {
  App,
  Button,
  Col,
  Divider,
  Modal,
  Popconfirm,
  Row,
  Table,
  Tag,
  Tooltip,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  attachOrderSubListAPI,
  detachOrderSubListAPI,
  getOrderPropertyAPI,
  getOrderSubListAPI,
} from "@/api/ordent";
import type {
  OrderRow,
  OrderSubChargeRow,
  OrderSubMaterialRow,
} from "@/types/ordent";
import OrderAttatch, {
  type OrderAttatchHandle,
} from "../OrderAttatch";
import { buildAttachSubListsFromSelectedItems } from "./orderAttachUtils";
import OrderSubAttachForm from "./OrderSubAttachForm";

interface OrderAttachModalProps {
  open: boolean;
  orderRow: OrderRow | null;
  onCancel: () => void;
  onRowUpdated: (
    orderId: number,
    patch: Pick<OrderRow, "charge_count" | "material_count">,
  ) => void;
}

function formatDecimalValue(value?: string | number | null): string {
  if (value == null || value === "") return "-";
  const n = parseFloat(String(value));
  return Number.isFinite(n) ? String(n) : String(value);
}

const buildSubColumns = (
  kind: "charge" | "material",
  onDelete: (
    row: OrderSubChargeRow | OrderSubMaterialRow,
    kind: "charge" | "material",
  ) => void,
  deletingId: number | null,
): ColumnsType<OrderSubChargeRow | OrderSubMaterialRow> => [
    { title: "项目", dataIndex: "item_name", ellipsis: true },
    { title: "规格", dataIndex: "item_spec" },
    {
      title: "单价",
      dataIndex: "price_value",
      width: 60,
      align: "right",
      render: (value?: string) => formatDecimalValue(value),
    },
    {
      title: "数量",
      dataIndex: "item_quantity",
      width: 60,
      align: "right",
      render: (value?: string) => formatDecimalValue(value),
    },
    {
      title: "金额",
      dataIndex: "amount_value",
      width: 60,
      align: "right",
      render: (value?: string) => formatDecimalValue(value),
    },
    {
      title: "自费",
      dataIndex: "order_tag",
      width: 60,
      align: "center",
      render: (tag?: string) =>
        tag?.includes("[自费]") ? (
          <Tag color="error" className="m-0!">
            是
          </Tag>
        ) : (
          <Tag className="m-0!">否</Tag>
        ),
    },
    {
      title: "操作",
      key: "actions",
      width: 60,
      align: "center",
      render: (_value, row) => (
        <Popconfirm
          title="确定删除该附加项？"
          onConfirm={() => onDelete(row, kind)}
          okButtonProps={{ loading: deletingId === row.sub_id }}
        >
          <Tooltip title="删除">
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              className="px-0!"
              aria-label="删除"
              loading={deletingId === row.sub_id}
            />
          </Tooltip>
        </Popconfirm>
      ),
    },
  ];

const OrderAttachModal = ({
  open,
  orderRow,
  onCancel,
  onRowUpdated,
}: OrderAttachModalProps) => {
  const { message } = App.useApp();
  const orderId = orderRow?.order_id;

  const orderAttatchRef = useRef<OrderAttatchHandle>(null);
  const [loading, setLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [packageConfirmLoading, setPackageConfirmLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [chargeList, setChargeList] = useState<OrderSubChargeRow[]>([]);
  const [materialList, setMaterialList] = useState<OrderSubMaterialRow[]>([]);

  const refreshOrderCounts = useCallback(async () => {
    if (orderId == null) return;
    const res = await getOrderPropertyAPI({ order_id: orderId });
    if (res.code === 0 && res.order_property) {
      onRowUpdated(orderId, {
        charge_count: res.order_property.charge_count,
        material_count: res.order_property.material_count,
      });
    }
  }, [orderId, onRowUpdated]);

  const reloadSubList = useCallback(async () => {
    if (orderId == null) return;
    setLoading(true);
    try {
      const res = await getOrderSubListAPI({
        order_id: orderId,
        column_charge: "*",
        column_material: "*",
      });
      if (res.code === 0) {
        setChargeList(res.charge_list ?? []);
        setMaterialList(res.material_list ?? []);
      } else {
        message.error(res.message || res.hint || "获取附加明细失败");
      }
    } catch {
      message.error("获取附加明细失败");
    } finally {
      setLoading(false);
    }
  }, [orderId, message]);

  useEffect(() => {
    if (!open || orderId == null) return;
    void reloadSubList();
  }, [open, orderId, reloadSubList]);

  const handleDelete = async (
    row: OrderSubChargeRow | OrderSubMaterialRow,
    kind: "charge" | "material",
  ) => {
    if (orderId == null || row.sub_id == null) return;
    setDeletingId(row.sub_id);
    try {
      const res = await detachOrderSubListAPI(
        kind === "charge"
          ? { order_id: orderId, charge_id_list: [row.sub_id] }
          : { order_id: orderId, material_id_list: [row.sub_id] },
      );
      if (res.code === 0) {
        message.success("删除成功");
        await reloadSubList();
        await refreshOrderCounts();
      } else {
        message.error(res.message || res.hint || "删除失败");
      }
    } catch {
      message.error("删除失败");
    } finally {
      setDeletingId(null);
    }
  };

  const handleAttachSuccess = async () => {
    await reloadSubList();
    await refreshOrderCounts();
  };

  const handlePackageConfirm = async () => {
    if (orderId == null) return;
    const items = orderAttatchRef.current?.getSelectedItems() ?? [];
    if (items.length === 0) {
      message.warning("请先选择附加项目");
      return;
    }

    const { charge_list, material_list } =
      buildAttachSubListsFromSelectedItems(items);

    setPackageConfirmLoading(true);
    try {
      const res = await attachOrderSubListAPI({
        order_id: orderId,
        charge_list: charge_list.length > 0 ? charge_list : undefined,
        material_list: material_list.length > 0 ? material_list : undefined,
      });
      if (res.code === 0) {
        message.success("保存成功");
        await handleAttachSuccess();
      } else {
        message.error(res.message || res.hint || "保存失败");
      }
    } catch {
      message.error("保存失败");
    } finally {
      setPackageConfirmLoading(false);
    }
  };

  const chargeColumns = buildSubColumns("charge", handleDelete, deletingId);
  const materialColumns = buildSubColumns("material", handleDelete, deletingId);

  return (
    <Modal
      title="附加材料和计费"
      open={open}
      width={"95%"}
      destroyOnHidden
      footer={null}
      onCancel={onCancel}
      centered={false}
      style={{ top: 24 }}
    >
      <Row gutter={12} className="min-h-60">
        <Col span={12}>
          <div className="mb-1 font-medium">附加收费</div>
          <Table
            size="small"
            rowKey={(row) => String(row.sub_id ?? row.item_id)}
            loading={loading}
            dataSource={chargeList}
            columns={chargeColumns}
            pagination={false}
            scroll={{ y: 200 }}
          />
        </Col>
        <Col span={12}>
          <div className="mb-1 font-medium">附加材料</div>
          <Table
            size="small"
            rowKey={(row) => String(row.sub_id ?? row.item_id)}
            loading={loading}
            dataSource={materialList}
            columns={materialColumns}
            pagination={false}
            scroll={{ y: 200 }}
          />
        </Col>
      </Row>

      {orderId != null ? (
        <div className="border-t border-(--ant-color-border-secondary) pt-4">
          <OrderSubAttachForm
            orderId={orderId}
            orderCatalog={orderRow?.order_catalog}
            confirmLoading={confirmLoading}
            onConfirmLoadingChange={setConfirmLoading}
            onSuccess={() => void handleAttachSuccess()}
          />
        </div>
      ) : null}

      {orderRow?.order_catalog != null && orderRow.exec_dept_id != null ? (
        <div>
          <Divider className="my-2!">套餐</Divider>
          <OrderAttatch
            ref={orderAttatchRef}
            orderCatalog={orderRow.order_catalog}
            execDeptId={orderRow.exec_dept_id}
          >
              <OrderAttatch.Content />
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <OrderAttatch.Toolbar />
                <Button
                  type="primary"
                  loading={packageConfirmLoading}
                  onClick={() => void handlePackageConfirm()}
                >
                  确认
                </Button>
              </div>
          </OrderAttatch>
        </div>
      ) : null}
    </Modal>
  );
};

export default OrderAttachModal;
