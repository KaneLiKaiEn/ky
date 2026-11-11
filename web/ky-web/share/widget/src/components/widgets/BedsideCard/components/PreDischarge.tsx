import { useEffect, useState } from "react";
import { DatePicker, Form, Modal, Spin, message } from "antd";
import dayjs, { Dayjs } from "dayjs";
import {
  dischargeAction,
  execImplement,
  getImplementList2,
  getPatientDeviceList,
  getVisitProperty,
  unbindPatientDevice,
} from "../api";
import { fetchSessionInfo } from "../utils/session";

interface PreDischargeProps {
  open: boolean;
  onCancel: () => void;
  bed: any;
  onSuccess?: () => void;
}

/** 合并预出院日期 + 时间 → Dayjs */
function buildPredischargeDateTime(
  dischargeDate?: string,
  dischargeTime?: string,
): Dayjs | null {
  const date = dischargeDate?.trim();
  const time = dischargeTime?.trim();
  if (!date || !time) return null;

  const timeAsFull = dayjs(time);
  if (
    timeAsFull.isValid() &&
    (time.includes("-") || time.includes("/")) &&
    time.length > 10
  ) {
    return timeAsFull.second(0);
  }

  const formats = ["HH:mm:ss", "HH:mm"];
  for (const format of formats) {
    const t = dayjs(time, format, true);
    if (t.isValid()) {
      const d = dayjs(date, "YYYY-MM-DD", true).isValid()
        ? dayjs(date, "YYYY-MM-DD")
        : dayjs(date);
      if (!d.isValid()) return null;
      return d.hour(t.hour()).minute(t.minute()).second(0);
    }
  }

  const combined = dayjs(`${date} ${time}`);
  return combined.isValid() ? combined.second(0) : null;
}

function toApiDischargeTime(value: Dayjs) {
  return value.second(0).format("YYYY-MM-DD HH:mm:ss");
}

function formatDateTime(value?: string | Dayjs | null) {
  if (!value) return "-";
  const d = dayjs(value);
  return d.isValid() ? d.format("YYYY-MM-DD HH:mm") : "-";
}

export function PreDischarge({
  open,
  onCancel,
  bed,
  onSuccess,
}: PreDischargeProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [noPredischarge, setNoPredischarge] = useState(false);
  const [predischargeInfo, setPredischargeInfo] = useState<any | null>(null);
  const [serviceIds, setServiceIds] = useState<number[]>([]);
  const [sessionInfo, setSessionInfo] = useState<Record<string, any> | null>(
    null,
  );

  const loadPredischargeInfo = async (visitId: number) => {
    setLoading(true);
    setNoPredischarge(false);
    setPredischargeInfo(null);
    try {
      const [propertyRes, deviceRes] = await Promise.all([
        getVisitProperty({
          visit_id: visitId,
          column_ip: "*",
          column_patient: "*",
          column_predischarge: "*",
        }),
        getPatientDeviceList({ visit_id: visitId }),
      ]);

      if (deviceRes?.code === 0) {
        setServiceIds(
          deviceRes.row_list?.map((item: any) => item.service_id) || [],
        );
      } else {
        setServiceIds([]);
      }

      if (propertyRes.code !== 0) {
        message.error((propertyRes.message || "") + (propertyRes.hint || ""));
        setNoPredischarge(true);
        return;
      }

      const ipProperty = propertyRes.ip_property;
      const visitProperty = propertyRes.visit_property;
      const patientProperty = propertyRes.patient_property;
      const predischargeProperty = propertyRes.predischarge_property;

      const ipTime =
        ipProperty?.discharge_time == null
          ? ""
          : String(ipProperty.discharge_time).trim();
      if (ipTime) {
        message.warning("该患者已出院");
        setNoPredischarge(true);
        return;
      }

      const preDt = buildPredischargeDateTime(
        predischargeProperty?.discharge_date,
        predischargeProperty?.discharge_time,
      );
      if (!preDt) {
        setNoPredischarge(true);
        return;
      }

      setPredischargeInfo({
        ...ipProperty,
        ...visitProperty,
        ...patientProperty,
        predischarge_date: predischargeProperty?.discharge_date,
        predischarge_time: predischargeProperty?.discharge_time,
        discharge_type: predischargeProperty?.discharge_type,
        discharge_tag: predischargeProperty?.discharge_tag,
        predischarge_display: formatDateTime(preDt),
      });
      setNoPredischarge(false);
      form.setFieldsValue({ discharge_time: preDt });
    } catch (error) {
      console.error("获取预出院信息失败:", error);
      setNoPredischarge(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;

    form.resetFields();
    setPredischargeInfo(null);
    setNoPredischarge(false);
    setServiceIds([]);

    const init = async () => {
      const session = await fetchSessionInfo();
      setSessionInfo(session);
      if (!bed?.visit_id) {
        setNoPredischarge(true);
        return;
      }
      await loadPredischargeInfo(Number(bed.visit_id));
    };
    void init();
  }, [open, bed?.visit_id]);

  const handleCancel = () => {
    form.resetFields();
    setPredischargeInfo(null);
    setNoPredischarge(false);
    setServiceIds([]);
    onCancel();
  };

  const fetchDischargeImplement = async () => {
    const visitId = Number(bed.visit_id);
    const res = await getImplementList2({
      visit_id: visitId,
      visit_id_list: [visitId],
      implement_type: "[other]",
    });
    if (res.code !== 0) {
      message.error((res.message || "") + (res.hint || ""));
      return { ok: false as const, implement: null };
    }
    const row = (res.row_list ?? []).find(
      (item: any) => item.order_catalog === "出院",
    );
    return {
      ok: true as const,
      implement: row
        ? { ...row, implement_type: row.implement_type || "other" }
        : null,
    };
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

  const execDischargeImplement = async (implement: any) => {
    const session = sessionInfo ?? (await fetchSessionInfo());
    if (!session?.user_id || !session?.dept_id) {
      message.error("获取当前登录信息失败，请重试");
      return false;
    }
    const res = await execImplement({
      exec_time: dayjs().format("YYYY-MM-DD HH:mm:ss"),
      exec_dept_id: session.dept_id,
      exec_user_id: session.user_id,
      exec_user_name: session.user_name,
      implement_id: implement.implement_id,
      implement_type: implement.implement_type || "other",
      auto_charge: true,
    });
    if (res.code !== 0) {
      message.error(
        (res.message || "") + (res.hint || "") || "执行出院医嘱失败",
      );
      return false;
    }
    return true;
  };

  const handleOk = async () => {
    if (noPredischarge) {
      handleCancel();
      return;
    }

    try {
      const values = await form.validateFields();
      const dischargeTime = values.discharge_time
        ? toApiDischargeTime(dayjs(values.discharge_time))
        : "";
      if (!dischargeTime) {
        message.warning("请选择出院时间");
        return;
      }

      setSubmitting(true);

      const { ok, implement } = await fetchDischargeImplement();
      if (!ok) return;

      if (implement?.implement_id) {
        const execOk = await execDischargeImplement(implement);
        if (!execOk) return;
      }

      await endBoundDevices();

      const res = await dischargeAction({
        visit_id: bed.visit_id,
        discharge_time: dischargeTime,
      });
      if (res.code !== 0) {
        message.error((res.message || "") + (res.hint || ""));
        return;
      }

      message.success("确认出院成功");
      handleCancel();
      onSuccess?.();
    } catch (error) {
      // 表单校验失败等
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="确认出院"
      open={open}
      onCancel={handleCancel}
      onOk={handleOk}
      confirmLoading={submitting || loading}
      okText={noPredischarge ? "关闭" : "确定"}
      cancelButtonProps={
        noPredischarge ? { style: { display: "none" } } : undefined
      }
      width={520}
      destroyOnHidden
    >
      <Spin spinning={loading}>
        <div className="py-2">
          <div>
            患者：
            <strong>
              {predischargeInfo?.patient_name || bed?.patient_name || "-"}
            </strong>
          </div>
          <div>
            住院号：
            <strong>
              {predischargeInfo?.visit_no || bed?.visit_no || "-"}
            </strong>
          </div>
          <div className="mb-2">
            床号：
            <strong>{predischargeInfo?.bed_no || bed?.bed_no || "-"}</strong>
          </div>

          {noPredischarge && (
            <div className="py-8 text-center text-gray-500 text-base">
              预出院暂未下达，无法办理出院
            </div>
          )}

          {!noPredischarge && predischargeInfo && (
            <>
              <div className="mb-3 rounded border border-blue-100 bg-blue-50 px-3 py-2 text-sm space-y-1">
                <div>
                  <span className="text-gray-500">预出院时间：</span>
                  <span className="font-medium text-gray-800">
                    {predischargeInfo.predischarge_display || "-"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">离院方式：</span>
                  <span>{predischargeInfo.discharge_type || "-"}</span>
                </div>
                <div>
                  <span className="text-gray-500">标识：</span>
                  <span>
                    {predischargeInfo.discharge_tag?.replace(/[\[\]]/g, "") ||
                      "-"}
                  </span>
                </div>
              </div>

              <Form form={form} layout="vertical">
                <Form.Item
                  label="出院时间"
                  name="discharge_time"
                  rules={[{ required: true, message: "请选择出院时间" }]}
                >
                  <DatePicker
                    className="w-full"
                    showTime={{ format: "HH:mm" }}
                    format="YYYY-MM-DD HH:mm"
                    allowClear={false}
                    placeholder="请选择出院时间"
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
