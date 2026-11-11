import React from "react";
import { Button, Checkbox, DatePicker, Input, Select, Space, Typography } from "antd";
import dayjs from "dayjs";
import { retrieveAnesBillFreq, retrieveUsageList } from "@/api/linkBill";
import RemoteSelect from "./RemoteSelect";

export interface BottomModifyProps {
  singleItemSave: any;
  setSingleItemSave: (v: any) => void;
  deptList: any[];
  doctorList: any[];
  deptExecList: any[];
  saveBillProperty: (
    bill_id: number,
    quantity: string,
    bill_time?: string,
    usage_id?: any,
    usage_name?: string,
    usage_note?: string,
    bill_tag?: string,
    apply_property?: any,
    exec_property?: any,
  ) => void;
  timeValue: string;
}

export default function BottomModify({
  singleItemSave,
  setSingleItemSave,
  deptList,
  doctorList,
  deptExecList,
  saveBillProperty,
  timeValue,
}: BottomModifyProps) {
  async function saveBillPropertyReq() {
    if (singleItemSave.item_type === "DRUG") {
      saveBillProperty(
        singleItemSave.bill_id,
        singleItemSave.item_quantity,
        singleItemSave.bill_time,
        singleItemSave.usage_id,
        singleItemSave.usage_name,
        singleItemSave.usage_note,
        singleItemSave.bill_tag,
        {
          dept_id: singleItemSave.dept_id,
          dept_name: singleItemSave.dept_name,
          user_id: singleItemSave.dept_apply_user_id,
          user_name: singleItemSave.dept_apply_user,
        },
        {
          dept_id: singleItemSave.dept_exec_id,
          dept_name: singleItemSave.dept_exec_name,
          user_id: singleItemSave.dept_exec_user_id,
          user_name: singleItemSave.dept_exec_user,
        },
      );
    } else {
      saveBillProperty(
        singleItemSave.bill_id,
        singleItemSave.item_quantity,
        singleItemSave.bill_time,
        "",
        "",
        "",
        "",
        {
          dept_id: singleItemSave.dept_id,
          dept_name: singleItemSave.dept_name,
          user_id: singleItemSave.dept_apply_user_id,
          user_name: singleItemSave.dept_apply_user,
        },
        {
          dept_id: singleItemSave.dept_exec_id,
          dept_name: singleItemSave.dept_exec_name,
          user_id: singleItemSave.dept_exec_user_id,
          user_name: singleItemSave.dept_exec_user,
        },
      );
    }
  }

  return (
    <div>
      <Space wrap style={{ marginBottom: 8 }}>
        <Select
          style={{ width: 150 }}
          value={singleItemSave?.dept_id}
          options={deptList.map((d) => ({ value: d.dept_id, label: d.dept_name }))}
          onChange={(val) => {
            const dept = deptList.find((d) => d.dept_id === val);
            setSingleItemSave((prev: any) => ({
              ...prev,
              dept_id: dept?.dept_id,
              dept_name: dept?.dept_name,
            }));
          }}
        />

        <Select
          style={{ width: 110 }}
          value={singleItemSave?.dept_apply_user_id}
          options={doctorList.map((d) => ({ value: d.doctor_id, label: d.doctor_name }))}
          onChange={(val) => {
            const doc = doctorList.find((d) => d.doctor_id === val);
            setSingleItemSave((prev: any) => ({
              ...prev,
              dept_apply_user_id: doc?.doctor_id,
              dept_apply_user: doc?.doctor_name,
            }));
          }}
        />

        <Select
          style={{ width: 150 }}
          value={singleItemSave?.dept_exec_id}
          options={deptExecList.map((d) => ({ value: d.dept_id, label: d.dept_name }))}
          onChange={(val) => {
            const dept = deptExecList.find((d) => d.dept_id === val);
            setSingleItemSave((prev: any) => ({
              ...prev,
              dept_exec_id: dept?.dept_id,
              dept_exec_name: dept?.dept_name,
            }));
          }}
        />

        <Select
          style={{ width: 110 }}
          value={singleItemSave?.dept_exec_user_id}
          options={doctorList.map((d) => ({ value: d.doctor_id, label: d.doctor_name }))}
          onChange={(val) => {
            const doc = doctorList.find((d) => d.doctor_id === val);
            setSingleItemSave((prev: any) => ({
              ...prev,
              dept_exec_user_id: doc?.doctor_id,
              dept_exec_user: doc?.doctor_name,
            }));
          }}
        />
      </Space>

      <br/>

      <Space wrap style={{ marginBottom: 8 }}>
        <Select
          style={{ width: 120 }}
          disabled
          value={singleItemSave?.item_type}
          options={[
            { value: "CHARGE", label: "收费项目" },
            { value: "MATERIAL", label: "材料" },
            { value: "DRUG", label: "药品" },
          ]}
        />

        <Input style={{ width: 200 }} disabled value={singleItemSave?.item_name} />

        {singleItemSave?.item_type === "DRUG" && (
          <RemoteSelect
            width={150}
            placeholder="用法"
            value={singleItemSave?.usage_id}
            label={singleItemSave?.usage_name}
            fetchOptions={retrieveUsageList}
            optionValue={(i) => i.usage_id}
            optionLabel={(i) => i.usage_name}
            onChange={(item) =>
              setSingleItemSave({ ...singleItemSave, usage_id: item.usage_id, usage_name: item.usage_name })
            }
          />
        )}


        <Typography.Text>数量:</Typography.Text>
        <Input
          style={{ width: 90 }}
          value={
            singleItemSave?.item_quantity ? parseFloat(singleItemSave.item_quantity) : ""
          }
          onChange={(e) => {
            // 药品 材料限制正整数,收费项目 不用限制
            const digits = e.target.value.replace(/\D/g, "");
            const normalized = digits.replace(/^0+(?=\d)/, "");
            setSingleItemSave({ ...singleItemSave, item_quantity: singleItemSave?.item_type === "CHARGE" ? e.target.value : normalized });
          }}
          addonAfter={singleItemSave?.item_quantity_unit}
        />

        {singleItemSave?.item_type === "DRUG" && (
          <Checkbox
            checked={singleItemSave?.bill_tag?.includes("[自费]")}
            onChange={(e) => {
              let tag = singleItemSave?.bill_tag || "";
              if (e.target.checked) {
                if (!tag.includes("[自费]")) tag += "[自费]";
              } else {
                tag = tag.replace("[自费]", "");
              }
              setSingleItemSave({ ...singleItemSave, bill_tag: tag });
            }}
          >
            <span style={{ color: "red" }}>自费</span>
          </Checkbox>
        )}

        <DatePicker
          showTime={{ format: "HH:mm" }}
          format="YYYY-MM-DD HH:mm"
          value={singleItemSave?.bill_time ? dayjs(singleItemSave.bill_time) : null}
          onChange={(val) => {
            const timeStr = val ? val.format("YYYY-MM-DD HH:mm") + ":00" : "";
            setSingleItemSave({ ...singleItemSave, bill_time: timeStr });
          }}
        />

        <Button type="primary" onClick={saveBillPropertyReq}>
          修改
        </Button>

        <Button onClick={() => setSingleItemSave("")}>取消</Button>
      </Space>
    </div>
  );
}
