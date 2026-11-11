import { useEffect, useState } from "react";
import { DatePicker, Form, Modal, Spin, message } from "antd";
import dayjs from "dayjs";
import {
  execImplement,
  getImplementList2,
  getOrderProperty,
  getPatientDeviceList,
  getTransferDeptList,
  sendTransferDeptReqApi,
  unbindPatientDevice,
} from "../api";
import { fetchSessionInfo } from "../utils/session";

interface TransferDeptModalProps {
  open: boolean;
  onCancel: () => void;
  bed: any;
  onSuccess?: () => void;
}

function isTransferImplement(item: any) {
  const tag = String(item?.implement_tag ?? "");
  return item?.order_catalog === "转科" && tag.includes("[转科]");
}

function isExecutableImplement(item: any) {
  const status = item?.implement_status;
  return status === "NEW" || status === "CHARGE";
}

/** 执行单 link_value → 医嘱 order_id → order_property.link_value 为转科 id */
async function resolveTransferId(implement: any): Promise<number | null> {
  const orderId = Number(implement?.link_value);
  if (!orderId) return null;
  try {
    const res = await getOrderProperty({ order_id: orderId });
    if (res.code !== 0) return null;
    const transferId = Number(res.order_property?.link_value);
    return transferId || null;
  } catch {
    return null;
  }
}

export function TransferDeptModal({
  open,
  onCancel,
  bed,
  onSuccess,
}: TransferDeptModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [noTransferOrder, setNoTransferOrder] = useState(false);
  const [implementRecord, setImplementRecord] = useState<any | null>(null);
  const [transferInfo, setTransferInfo] = useState<any | null>(null);
  const [serviceIds, setServiceIds] = useState<number[]>([]);
  const [sessionInfo, setSessionInfo] = useState<Record<string, any> | null>(
    null,
  );

  const loadTransferImplement = async (visitId: number) => {
    setLoading(true);
    setImplementRecord(null);
    setTransferInfo(null);
    setNoTransferOrder(false);
    try {
      const [implRes, transferRes, deviceRes] = await Promise.all([
        getImplementList2({
          visit_id_list: [visitId],
          implement_type: "[other]",
          implement_status: "[NEW][CHARGE][EXEC][CANCEL]",
        }),
        getTransferDeptList({ visit_id: visitId }),
        getPatientDeviceList({ visit_id: visitId }),
      ]);

      if (deviceRes?.code === 0) {
        setServiceIds(
          deviceRes.row_list?.map((item: any) => item.service_id) || [],
        );
      } else {
        setServiceIds([]);
      }

      if (implRes.code !== 0) {
        message.error((implRes.message || "") + (implRes.hint || ""));
        setNoTransferOrder(true);
        return;
      }

      const transferList =
        transferRes.code === 0 ? (transferRes.transfer_list ?? []) : [];
      if (transferRes.code !== 0) {
        message.error((transferRes.message || "") + (transferRes.hint || ""));
      }

      const list = (implRes.row_list ?? [])
        .filter(isTransferImplement)
        .filter(isExecutableImplement)
        .sort(
          (a: any, b: any) =>
            dayjs(b.implement_time || b.order_time).unix() -
            dayjs(a.implement_time || a.order_time).unix(),
        );

      const enriched = await Promise.all(
        list.map(async (item: any) => {
          const transferId = await resolveTransferId(item);
          const transfer = transferId
            ? transferList.find(
                (t: any) => Number(t.transfer_id) === transferId,
              )
            : null;
          return {
            ...item,
            transfer_id: transferId,
            transfer_status: transfer?.transfer_status ?? null,
            transfer,
          };
        }),
      );

      // 可执行：NEW/CHARGE 执行单，且关联转科记录为 NEW
      const executable = enriched.find(
        (item) => item.transfer_id && item.transfer_status === "NEW",
      );

      if (!executable?.transfer_id) {
        setNoTransferOrder(true);
        return;
      }

      setImplementRecord({
        ...executable,
        implement_type: executable.implement_type || "other",
      });
      setTransferInfo(executable.transfer || null);
      setNoTransferOrder(false);
      form.setFieldsValue({ exec_time: dayjs() });
    } catch (error) {
      console.error("获取转科医嘱执行单失败:", error);
      setNoTransferOrder(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;

    form.resetFields();
    setImplementRecord(null);
    setTransferInfo(null);
    setNoTransferOrder(false);
    setServiceIds([]);

    const init = async () => {
      const session = await fetchSessionInfo();
      setSessionInfo(session);
      if (!bed?.visit_id) {
        setNoTransferOrder(true);
        return;
      }
      await loadTransferImplement(Number(bed.visit_id));
    };
    void init();
  }, [open, bed?.visit_id]);

  const handleCancel = () => {
    form.resetFields();
    setImplementRecord(null);
    setTransferInfo(null);
    setNoTransferOrder(false);
    setServiceIds([]);
    onCancel();
  };

  const endBoundDevices = async () => {
    if (serviceIds.length === 0) return;
    for (const serviceId of serviceIds) {
      const resEndDevice = await unbindPatientDevice({
        service_id: serviceId,
        visit_id: bed.visit_id,
        end_time: dayjs().format("YYYY-MM-DD HH:mm:ss"),
      });
      if (resEndDevice.code !== 0) {
        message.error(
          `结束设备[${serviceId}]失败: ${resEndDevice.message}${resEndDevice.hint ? ` - ${resEndDevice.hint}` : ""}`,
        );
      }
    }
  };

  const handleOk = async () => {
    if (noTransferOrder) {
      handleCancel();
      return;
    }

    const transferId = Number(implementRecord?.transfer_id);
    if (!implementRecord?.implement_id || !transferId) {
      message.warning("未获取到转科记录");
      return;
    }

    try {
      const values = await form.validateFields();
      const session = sessionInfo ?? (await fetchSessionInfo());
      if (!session?.user_id || !session?.dept_id) {
        message.error("获取当前登录信息失败，请重试");
        return;
      }

      setSubmitting(true);

      const execRes = await execImplement({
        exec_time: (values.exec_time
          ? dayjs(values.exec_time)
          : dayjs()
        ).format("YYYY-MM-DD HH:mm:ss"),
        exec_dept_id: session.dept_id,
        exec_user_id: session.user_id,
        exec_user_name: session.user_name,
        implement_id: implementRecord.implement_id,
        implement_type: implementRecord.implement_type || "other",
        auto_charge: true,
      });
      if (execRes.code !== 0) {
        message.error(
          (execRes.message || "") + (execRes.hint || "") || "执行失败",
        );
        return;
      }

      await endBoundDevices();

      const sendRes = await sendTransferDeptReqApi({
        transfer_id: transferId,
      });
      if (sendRes.code !== 0) {
        message.error((sendRes.message || "") + (sendRes.hint || ""));
        onSuccess?.();
        handleCancel();
        return;
      }

      message.success("执行并发送转科成功");
      handleCancel();
      onSuccess?.();
    } catch (error) {
      // 表单校验失败等
    } finally {
      setSubmitting(false);
    }
  };

  const targetDeptName =
    transferInfo?.to_dept_name ||
    transferInfo?.to_ward_name ||
    transferInfo?.recv_dept_name ||
    "-";

  return (
    <Modal
      title="转科"
      open={open}
      onCancel={handleCancel}
      onOk={handleOk}
      confirmLoading={submitting || loading}
      okText={noTransferOrder ? "关闭" : "执行并发送"}
      cancelButtonProps={
        noTransferOrder ? { style: { display: "none" } } : undefined
      }
      width={520}
      destroyOnHidden
    >
      <Spin spinning={loading}>
        <div className="py-2">
          <div>
            患者：<strong>{bed?.patient_name || "-"}</strong>
          </div>
          <div>
            住院号：<strong>{bed?.visit_no || "-"}</strong>
          </div>
          <div>
            当前科室：<strong>{bed?.dept_name || "-"}</strong>
          </div>

          {noTransferOrder && (
            <div className="py-8 text-center text-gray-500 text-base">
              暂无转科医嘱
            </div>
          )}

          {!noTransferOrder && implementRecord && (
            <>
              <div className="mb-3 rounded border border-(--app-theme-primary) bg-(--app-theme-primary-bg) px-3 py-2 text-sm">
                <div className="mb-1">
                  <span className="text-gray-500">医嘱内容：</span>
                  <span className="font-medium text-gray-800">
                    {implementRecord.implement_content || "-"}
                  </span>
                </div>
                <div className="mb-1">
                  <span className="text-gray-500">医嘱时间：</span>
                  <span>
                    {implementRecord.order_time
                      ? dayjs(implementRecord.order_time).format(
                          "YYYY-MM-DD HH:mm",
                        )
                      : "-"}
                  </span>
                </div>
                <div className="mb-1">
                  <span className="text-gray-500">计划执行：</span>
                  <span>
                    {implementRecord.implement_time
                      ? dayjs(implementRecord.implement_time).format(
                          "YYYY-MM-DD HH:mm",
                        )
                      : "-"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">转入科室：</span>
                  <span className="font-medium text-gray-800">
                    {targetDeptName}
                  </span>
                </div>
              </div>

              <Form form={form} layout="vertical">
                <Form.Item
                  label="执行时间"
                  name="exec_time"
                  rules={[{ required: true, message: "请选择执行时间" }]}
                >
                  <DatePicker
                    className="w-full"
                    showTime={{ format: "HH:mm" }}
                    format="YYYY-MM-DD HH:mm"
                    allowClear={false}
                    placeholder="请选择执行时间"
                  />
                </Form.Item>
              </Form>
            </>
          )}
        </div>
      </Spin>
    </Modal>
  );
}
