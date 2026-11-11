import { useEffect, useState } from "react";
import { DatePicker, Form, Modal, Select, Spin, message } from "antd";
import dayjs from "dayjs";
import {
  assignBed,
  changeBed,
  execImplement,
  getBedListApi,
  getImplementList2,
  getRoomListApi,
  getVisitProperty,
} from "../api";
import { fetchSessionInfo } from "../utils/session";

interface ChangeBedModalProps {
  open: boolean;
  onCancel: () => void;
  bed: any;
  onSuccess?: () => void;
}

function isTransferBedImplement(item: any) {
  const tag = String(item?.implement_tag ?? item?.order_tag ?? "");
  return item?.order_catalog === "转床" && /\[转床\]/.test(tag);
}

function isExecutableImplement(item: any) {
  const status = item?.implement_status;
  return status === "NEW" || status === "CHARGE";
}

export function ChangeBedModal({
  open,
  onCancel,
  bed,
  onSuccess,
}: ChangeBedModalProps) {
  const [form] = Form.useForm();
  const [roomOptions, setRoomOptions] = useState<
    { value: number; label: string }[]
  >([]);
  const [bedOptions, setBedOptions] = useState<
    { value: number; label: string }[]
  >([]);
  const [loadingBeds, setLoadingBeds] = useState(false);
  const [loadingImplement, setLoadingImplement] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [implementRecord, setImplementRecord] = useState<any | null>(null);
  const [noTransferOrder, setNoTransferOrder] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<Record<string, any> | null>(
    null,
  );

  const isAssign = Boolean(bed?.is_unassigned);

  const getRoomList = async (deptId?: number) => {
    try {
      const session = sessionInfo ?? (await fetchSessionInfo());
      const requestDeptId = deptId ?? session?.dept_id;
      if (!requestDeptId) {
        message.error("获取当前科室失败，请重试");
        return [];
      }

      const res = await getRoomListApi({
        dept_id: requestDeptId,
      });
      if (res.code === 0 && res.row_list) {
        const options = res.row_list.map((item: any) => ({
          value: item.room_id,
          label: item.room_name,
        }));
        setRoomOptions(options);
        return options;
      }
      message.error("获取房间列表失败，请重试");
      return [];
    } catch (error) {
      console.error("获取房间列表失败:", error);
      return [];
    }
  };

  const getBedList = async (roomId: number) => {
    if (!roomId) {
      setBedOptions([]);
      return;
    }
    try {
      setLoadingBeds(true);
      const session = sessionInfo ?? (await fetchSessionInfo());
      const res = await getBedListApi({
        room_id: roomId,
        dept_id: session?.dept_id,
        org_id: session?.org_id,
      });
      if (res.code === 0 && Array.isArray(res.row_list)) {
        const availableBeds = res.row_list.filter((item: any) => {
          const visitIdEmpty = !item.visit_id;
          const visitEmpty =
            !item.visit_info || JSON.stringify(item.visit_info) === "{}";
          const appointEmpty =
            !item.appoint_info || JSON.stringify(item.appoint_info) === "{}";
          return visitIdEmpty && visitEmpty && appointEmpty;
        });

        if (availableBeds.length > 0) {
          setBedOptions(
            availableBeds.map((item: any) => ({
              value: item.bed_id,
              label: item.bed_no,
            })),
          );
        } else {
          message.warning("该房间没有空床位");
          setBedOptions([]);
        }
      } else {
        message.error((res.message || "") + (res.hint || ""));
        setBedOptions([]);
      }
    } catch (error) {
      console.error("获取床位列表失败:", error);
      setBedOptions([]);
    } finally {
      setLoadingBeds(false);
    }
  };

  const loadTransferImplement = async (visitId: number) => {
    setLoadingImplement(true);
    setImplementRecord(null);
    setNoTransferOrder(false);
    try {
      const res = await getImplementList2({
        visit_id_list: [visitId],
        implement_type: "[other]",
        implement_status: "[NEW][CHARGE][EXEC][CANCEL]",
      });
      if (res.code !== 0) {
        message.error((res.message || "") + (res.hint || ""));
        setNoTransferOrder(true);
        return null;
      }
      const list = (res.row_list ?? [])
        .filter(isTransferBedImplement)
        .filter(isExecutableImplement)
        .sort(
          (a: any, b: any) =>
            dayjs(b.implement_time || b.order_time).unix() -
            dayjs(a.implement_time || a.order_time).unix(),
        );
      if (list.length === 0) {
        setNoTransferOrder(true);
        return null;
      }
      const record = {
        ...list[0],
        implement_type: list[0].implement_type || "other",
      };
      setImplementRecord(record);
      setNoTransferOrder(false);
      return record;
    } catch (error) {
      console.error("获取转床医嘱执行单失败:", error);
      setNoTransferOrder(true);
      return null;
    } finally {
      setLoadingImplement(false);
    }
  };

  const initRoomAndBed = async () => {
    const options = await getRoomList();
    if (options && options.length > 0) {
      const firstRoomId = options[0].value;
      form.setFieldsValue({
        room_id: firstRoomId,
        room_no: options[0].label,
        ...(isAssign ? { admission_time: dayjs() } : {}),
      });
      await getBedList(firstRoomId);
    }
  };

  useEffect(() => {
    if (!open) return;

    const init = async () => {
      setBedOptions([]);
      setRoomOptions([]);
      setImplementRecord(null);
      setNoTransferOrder(false);
      form.resetFields();

      const session = await fetchSessionInfo();
      setSessionInfo(session);

      if (isAssign) {
        form.setFieldsValue({ admission_time: dayjs() });
        await initRoomAndBed();
        return;
      }

      if (!bed?.visit_id) {
        setNoTransferOrder(true);
        return;
      }

      const record = await loadTransferImplement(Number(bed.visit_id));
      if (!record) return;

      form.setFieldsValue({
        exec_time: dayjs(),
      });
      await initRoomAndBed();
    };

    void init();
  }, [open, bed?.is_unassigned, bed?.visit_id]);

  const handleCancel = () => {
    form.resetFields();
    setBedOptions([]);
    setRoomOptions([]);
    setImplementRecord(null);
    setNoTransferOrder(false);
    onCancel();
  };

  const handleAssignSubmit = async (values: any) => {
    const admissionTime = (
      values.admission_time ? dayjs(values.admission_time) : dayjs()
    )
      .second(0)
      .format("YYYY-MM-DD HH:mm:ss");
    const res = await assignBed({
      visit_id: bed.visit_id,
      bed_id: values.bed_id,
      admission_time: admissionTime,
    });
    if (res.code === 0) {
      message.success("分配床位成功");
      handleCancel();
      onSuccess?.();
    } else {
      message.error((res.message || "") + (res.hint || ""));
    }
  };

  const handleTransferSubmit = async (values: any) => {
    if (!implementRecord?.implement_id) {
      message.warning("暂无转床医嘱");
      return;
    }
    const session = sessionInfo ?? (await fetchSessionInfo());
    if (!session?.user_id || !session?.dept_id) {
      message.error("获取当前登录信息失败，请重试");
      return;
    }

    const implementId = Number(implementRecord.implement_id);
    const execRes = await execImplement({
      exec_time: (values.exec_time ? dayjs(values.exec_time) : dayjs()).format(
        "YYYY-MM-DD HH:mm:ss",
      ),
      exec_dept_id: session.dept_id,
      exec_user_id: session.user_id,
      exec_user_name: session.user_name,
      implement_id: implementId,
      implement_type: implementRecord.implement_type || "other",
      auto_charge: true,
    });
    if (execRes.code !== 0) {
      message.error(
        (execRes.message || "") + (execRes.hint || "") || "执行失败",
      );
      return;
    }

    const visitRes = await getVisitProperty({
      visit_id: bed.visit_id,
      column_ip: "*",
    });
    if (visitRes.code !== 0) {
      message.error((visitRes.message || "") + (visitRes.hint || ""));
      onSuccess?.();
      handleCancel();
      return;
    }
    const ip = visitRes.ip_property;
    if (!ip?.ward_id) {
      message.warning("未获取到当前病区信息");
      onSuccess?.();
      handleCancel();
      return;
    }

    const transferRes = await changeBed({
      visit_id: bed.visit_id,
      from_ward_id: ip.ward_id,
      from_ward_name: ip.ward_name,
      from_room_id: ip.room_id,
      from_room_no: ip.room_no,
      from_bed_id: ip.bed_id ?? bed.bed_id,
      from_bed_no: ip.bed_no ?? bed.bed_no,
      to_ward_id: ip.ward_id,
      to_ward_name: ip.ward_name,
      to_room_id: values.room_id,
      to_room_no: values.room_no,
      to_bed_id: values.bed_id,
      to_bed_no: values.bed_no,
      link_name: "执行单",
      link_value: implementId,
    });
    if (transferRes.code !== 0) {
      message.error((transferRes.message || "") + (transferRes.hint || ""));
      onSuccess?.();
      handleCancel();
      return;
    }

    message.success("执行并转床成功");
    handleCancel();
    onSuccess?.();
  };

  const handleOk = async () => {
    if (!isAssign && noTransferOrder) {
      handleCancel();
      return;
    }
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      if (isAssign) {
        await handleAssignSubmit(values);
      } else {
        await handleTransferSubmit(values);
      }
    } catch (error) {
      console.error("床位操作失败:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const modalTitle = isAssign ? "分配床位" : "转床";
  const showForm = isAssign || (!noTransferOrder && !!implementRecord);

  return (
    <Modal
      title={modalTitle}
      open={open}
      onCancel={handleCancel}
      onOk={handleOk}
      confirmLoading={submitting || loadingImplement}
      okText={noTransferOrder && !isAssign ? "关闭" : "确定"}
      cancelButtonProps={
        noTransferOrder && !isAssign
          ? { style: { display: "none" } }
          : undefined
      }
      width={500}
      destroyOnHidden
    >
      <Spin spinning={loadingImplement}>
        <div className="py-2">
          <div>
            患者：<strong>{bed?.patient_name || ""}</strong>
          </div>
          <div>
            住院号：<strong>{bed?.visit_no || ""}</strong>
          </div>
          {!isAssign && (
            <div>
              当前床号：<strong>{bed?.bed_no || ""}</strong>
            </div>
          )}

          {!isAssign && noTransferOrder && (
            <div className="py-8 text-center text-(--app-theme-text-secondary) text-base">
              暂无转床医嘱
            </div>
          )}

          {!isAssign && implementRecord && (
            <div className="mb-3 rounded border border-(--app-theme-primary) bg-(--app-theme-primary-bg) px-3 py-2 text-sm">
              <div className="mb-1">
                <span className="text-gray-500">医嘱内容：</span>
                <span className="font-medium text-gray-800">
                  {implementRecord.implement_content || "-"}
                </span>
              </div>
              <div>
                <span className="text-gray-500">医嘱时间：</span>
                <span>
                  {implementRecord.order_time
                    ? dayjs(implementRecord.order_time).format(
                        "YYYY-MM-DD HH:mm",
                      )
                    : "-"}
                </span>
              </div>
              <div>
                <span className="text-gray-500">计划执行：</span>
                <span>
                  {implementRecord.implement_time
                    ? dayjs(implementRecord.implement_time).format(
                        "YYYY-MM-DD HH:mm",
                      )
                    : "-"}
                </span>
              </div>
            </div>
          )}

          {showForm && (
            <Form form={form} layout="vertical">
              <Form.Item
                label="请选择房间"
                name="room_id"
                rules={[{ required: true, message: "请选择房间" }]}
              >
                <Select
                  className="w-full"
                  placeholder="选择房间"
                  options={roomOptions}
                  showSearch
                  optionFilterProp="label"
                  filterOption={(input, option) =>
                    (option?.label as string)
                      ?.toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  onChange={(value, option) => {
                    form.setFieldsValue({
                      bed_id: undefined,
                      bed_no: undefined,
                      room_no: (option as { label?: string } | undefined)
                        ?.label,
                    });
                    getBedList(value);
                  }}
                />
              </Form.Item>
              <Form.Item name="room_no" noStyle>
                <input type="hidden" />
              </Form.Item>
              <Form.Item
                label="请选择床位"
                name="bed_id"
                rules={[{ required: true, message: "请选择床位" }]}
              >
                <Select
                  placeholder={loadingBeds ? "加载中..." : "选择床位"}
                  options={bedOptions}
                  loading={loadingBeds}
                  disabled={loadingBeds || bedOptions.length === 0}
                  onChange={(_value, option) => {
                    if (!Array.isArray(option) && option) {
                      form.setFieldsValue({ bed_no: option.label });
                    }
                  }}
                />
              </Form.Item>
              <Form.Item name="bed_no" noStyle>
                <input type="hidden" />
              </Form.Item>
              {isAssign ? (
                <Form.Item
                  label="入科时间"
                  name="admission_time"
                  rules={[{ required: true, message: "请选择入科时间" }]}
                >
                  <DatePicker
                    className="w-full"
                    showTime={{ format: "HH:mm" }}
                    format="YYYY-MM-DD HH:mm"
                    allowClear={false}
                    placeholder="请选择入科时间"
                  />
                </Form.Item>
              ) : (
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
              )}
            </Form>
          )}
        </div>
      </Spin>
    </Modal>
  );
}
