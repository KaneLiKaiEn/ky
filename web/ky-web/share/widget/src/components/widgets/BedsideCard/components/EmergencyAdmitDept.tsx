import {
  assignBed,
  createPatient,
  createPatientNo,
  createVisit,
  getSourceListApi,
} from "../api";
import { fetchSessionInfo } from "../utils/session";
import { DatePicker, Form, Input, Modal, Select, message } from "antd";
import dayjs from "dayjs";
import { DeptSelect } from "./DeptSelect";
import { useEffect, useState } from "react";

interface EmergencyAdmitDeptProps {
  open: boolean;
  onCancel: () => void;
  bed: any;
  onSuccess: () => void;
}
export function EmergencyAdmitDept({
  open,
  onCancel,
  bed,
  onSuccess,
}: EmergencyAdmitDeptProps) {
  const [form] = Form.useForm();
  const handleOk = async () => {
    const values = await form.getFieldsValue();
    const session = await fetchSessionInfo();
    if (!session?.org_id || !session?.dept_id) {
      message.error("获取当前会话信息失败，请重试");
      return;
    }

    const res = await createPatient({
      patient_name: values.patient_name,
      patient_gender: values.patient_gender,
      birth_date: dayjs(values.birth_date).format("YYYY-MM-DD"),
    });
    if (res.code !== 0) {
      message.error(res.message + res.hint);
      return;
    }
    const patient_id = res.patient_id;
    //  生成patient_no
    const res1 = await createPatientNo({
      org_id: Number(session.org_id),
      patient_id,
      visit_type: "I",
    });
    if (res1.code !== 0) {
      message.error(res1.message + res1.hint);
      return;
    }
    const patient_no = res1.patient_no;
    // 创建就诊记录
    const res2 = await createVisit({
      org_id: Number(session.org_id),
      dept_id: values.dept_id, // 入院科室
      patient_id,
      patient_no,
      visit_no: values.visit_no,
      visit_type: "I",
      ip_row: {
        admission_time: dayjs(values.admission_time).format(
          "YYYY-MM-DD HH:mm:ss",
        ),
        reg_time: dayjs(values.admission_time).format("YYYY-MM-DD HH:mm:ss"),
        ward_id: session.dept_id,
        admission_tag: "[紧急入科]",
        admission_type: values.admission_type,
      },
    });
    if (res2.code !== 0) {
      message.error(res2.message + res2.hint);
      return;
    }
    // 获取visit_id
    const visit_id = res2.visit_id;

    //  安排床位
    const res4 = await assignBed({
      visit_id,
      bed_id: bed.bed_id,
    });
    if (res4.code !== 0) {
      message.error(res4.message + res4.hint);
      return;
    }
    message.success("预约登记成功");
    // 刷新床位列表
    form.resetFields();
    onSuccess?.();
    onCancel();
  };
  // 获取入院来源
  const [sourceOptions, setSourceOptions] = useState<any[]>([]);
  const getSourceList = async () => {
    const res = await getSourceListApi({
      dict_code: "admission.type",
      retrieve_input: "*",
    });
    if (res.code === 0) {
      setSourceOptions(res.row_list ?? []);
    }
  };
  // 预约时间默认当前时间
  useEffect(() => {
    if (open) {
      getSourceList();
      form.setFieldsValue({ admission_time: dayjs() });
    }
  }, [open]);
  return (
    <Modal
      title="预约登记"
      width={600}
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
    >
      <div className=" font-bold mb-2">当前预约的床号：{bed?.bed_no}床</div>
      <Form form={form}>
        <div className="grid grid-cols-2 gap-1 ">
          <Form.Item
            label="姓名"
            name="patient_name"
            rules={[{ required: true, message: "请输入姓名" }]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item name="visit_no" label="住院号">
            <Input placeholder="请输入住院号" />
          </Form.Item>
          <Form.Item
            name="patient_gender"
            label="性别"
            rules={[{ required: true, message: "请选择性别" }]}
          >
            <Select
              options={[
                { label: "男", value: "男" },
                { label: "女", value: "女" },
                { label: "未知", value: "未知" },
              ]}
              placeholder="请选择性别"
            />
          </Form.Item>
          <Form.Item
            name="birth_date"
            label="出生日期"
            rules={[{ required: true, message: "请选择出生日期" }]}
          >
            <DatePicker className="w-full" placeholder="请选择出生日期" />
          </Form.Item>
        </div>
        <Form.Item label="入科来源" name="admission_type">
          <Select
            options={sourceOptions.map((item) => ({
              label: item.item_name,
              value: item.item_name,
            }))}
            showSearch
            placeholder="请选择入科来源"
          />
        </Form.Item>
        <Form.Item
          label="入院科室"
          name="dept_id"
          rules={[{ required: true, message: "请选择入院科室" }]}
        >
          <DeptSelect
            placeholder="请选择入院科室"
            onChange={(val, option) => {
              console.log("选中科室:", option.label);
            }}
          />
        </Form.Item>
        <Form.Item
          label="预约时间"
          name="admission_time"
          rules={[{ required: true, message: "请选择预约时间" }]}
        >
          <DatePicker
            format="YYYY-MM-DD HH:mm"
            showTime
            className="w-full"
            placeholder="请选择预约时间"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
