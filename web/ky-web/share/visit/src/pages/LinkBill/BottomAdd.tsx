import React, { useEffect, useState } from "react";
import { Button, Checkbox, DatePicker, Input, Select, Space, Typography } from "antd";
import dayjs from "dayjs";
import { message } from "antd";
import type { BillItemType } from "@/types/linkBill";
import {
  getOperaDrugRepertory,
  getStockListAPI,
  retrieveAnesBillFreq,
  retrieveChargeListAPI,
  retrieveDrugListAPI,
  retrieveMaterialListAPI,
  retrieveUsageList,
  retrieveUserListAPI,
} from "@/api/linkBill";
import { itemTypeOptions } from "./utils";
import RemoteSelect from "./RemoteSelect";

export interface BottomAddProps {
  singleItem: any;
  setSingleItem: (v: any) => void;
  deptList: any[];
  user1: any;
  setUser1: (v: any) => void;
  user2: any;
  setUser2: (v: any) => void;
  doctorList: any[];
  itemType: BillItemType;
  deptExecList: any[];
  setItemType: (v: BillItemType) => void;
  newBill: (row: any) => void;
  addTimeValue: string;
  setAddTimeValue: (v: string) => void;
  onOpenPrefab: () => void;
}

export default function BottomAdd({
  singleItem,
  setSingleItem,
  deptList,
  user1,
  setUser1,
  user2,
  setUser2,
  doctorList,
  itemType,
  deptExecList,
  setItemType,
  newBill,
  addTimeValue,
  setAddTimeValue,
  onOpenPrefab,
}: BottomAddProps) {
  const [stockInfo, setStockInfo] = useState<{ stock_quantity: string; stock_unit: string }>({
    stock_quantity: "",
    stock_unit: "",
  });
  const [isLoadStock, setIsLoadStock] = useState(false);
  // 默认用法（「手术用」/「局麻」），用于在未选择用法时作为回退默认值
  const [defaultUseObj, setDefaultUseObj] = useState<{ usage_id: any; usage_name: string }>({
    usage_id: "",
    usage_name: "",
  });
  // 药房下拉及当前选中的药房（默认「住院药房」）
  const [storeList, setStoreList] = useState<any[]>([]);
  const [storeId, setStoreId] = useState<number | undefined>();
  // 频次下拉
  const [freqList, setFreqList] = useState<any[]>([]);


  function resetItemFields() {
    setSingleItem({
      ...singleItem,
      bill_time: "",
      bill_tag: "",
      item_id: "",
      item_type: "",
      item_name: "",
      item_no: "",
      item_spec: "",
      item_model: "",
      add_quantity: "1",
      quantity_unit: "",
      usage_id: defaultUseObj.usage_id,
      usage_name: defaultUseObj.usage_name,
      usage_note: "",
    });
  }

  // 进入页面即请求用法下拉项，若存在「手术用」或「局麻」则默认选中
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await retrieveUsageList("*");
        const target = list.find(
          (item: any) => item?.usage_name === "手术用" || item?.usage_name === "局麻",
        );
        if (!cancelled && target) {
          setDefaultUseObj({
            usage_id: target.usage_id,
            usage_name: target.usage_name,
          });
          setSingleItem((prev: any) => ({
            ...prev,
            usage_id: target.usage_id,
            usage_name: target.usage_name,
          }));
        }
      } catch (e) {
        // 错误已由请求拦截器统一提示
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 进入页面即请求药房列表，默认选中「住院药房」
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getStockListAPI();
        if (res?.code !== 0) {
          message.error(res?.message || "获取药房列表失败");
          return;
        }
        const list = res.row_list || [];
        if (cancelled) return;
        setStoreList(list);
        const target = list.find((item) => item.store_name === "住院药房" || item.store_name === "门诊药房") ?? list[0];
        if (target) setStoreId(target.store_id);
      } catch (e) {
        // 错误已由请求拦截器统一提示
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 进入页面即请求频次字典（anes_bill_freq）
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await retrieveAnesBillFreq();
        if (!cancelled) setFreqList(list);
      } catch (e) {
        // 错误已由请求拦截器统一提示
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleAdd() {
    if (singleItem.dept_id === "" || singleItem.dept_exec_id === "") {
      message.warning("请选择申请科室与执行科室");
    } else if (singleItem.item_id === "") {
      message.warning("请选择项目");
    } else if (singleItem.add_quantity === "") {
      message.warning("数量不能为空");
    } else {
      newBill(singleItem);
      resetItemFields();
    }
  }

  return (
    <div>
      {/* 申请科室 / 申请人 / 执行科室 / 执行人 */}
      <Space wrap style={{ marginBottom: 8 }}>
        <Typography.Text>申请科室:</Typography.Text>
        <Select
          style={{ width: 150 }}
          placeholder="选择申请科室"
          value={singleItem.dept_id || undefined}
          options={deptList.map((d) => ({ value: d.dept_id, label: d.dept_name }))}
          onChange={(val) => {
            const dept = deptList.find((d) => d.dept_id === val);
            setSingleItem((prev: any) => ({
              ...prev,
              dept_id: dept?.dept_id,
              dept_name: dept?.dept_name,
            }));
          }}
        />

        <Typography.Text>申请人:</Typography.Text>
        <Select
          style={{ width: 110 }}
          placeholder="选择申请人"
          value={user1.id || undefined}
          options={doctorList.map((d) => ({ value: d.doctor_id, label: d.doctor_name }))}
          onChange={(val, opt: any) =>
            setUser1({ ...user1, id: val, name: opt?.label })
          }
        />

        <Typography.Text>执行科室:</Typography.Text>
        <Select
          style={{ width: 150 }}
          placeholder="选择执行科室"
          value={singleItem.dept_exec_id || undefined}
          options={(itemType === "DRUG" ? deptExecList : deptList).map((d) => ({
            value: d.dept_id,
            label: d.dept_name,
          }))}
          onChange={(val) => {
            const dept = deptExecList.find((d) => d.dept_id === val);
            setSingleItem((prev: any) => ({
              ...prev,
              dept_exec_id: dept?.dept_id,
              dept_exec_name: dept?.dept_name,
            }));
          }}
        />

        <Typography.Text>执行人:</Typography.Text>
        <Select
          style={{ width: 110 }}
          placeholder="选择执行人"
          value={user2.id || undefined}
          options={doctorList.map((d) => ({ value: d.doctor_id, label: d.doctor_name }))}
          onChange={(val, opt: any) => setUser2({ ...user2, id: val, name: opt?.label })}
        />

      </Space>

      <br/>

      {/* 检索项目 */}
      <Space wrap style={{ marginBottom: 8 }}>
        <Select
          style={{ width: 120 }}
          value={itemType}
          options={itemTypeOptions.map((i) => ({ value: i.value, label: i.name }))}
          onChange={(val: BillItemType) => {
            setItemType(val);
            if (val === "DRUG") {
              const drugDept =
                deptExecList.find((d: any) => d.dept_name?.includes("药房")) || deptExecList[0];
              setSingleItem({
                ...singleItem,
                bill_tag: "",
                item_id: "",
                item_type: "",
                item_name: "",
                item_no: "",
                item_spec: "",
                item_model: "",
                add_quantity: "1",
                quantity_unit: "",
                usage_id: defaultUseObj.usage_id,
                usage_name: defaultUseObj.usage_name,
                usage_note: "once",
                dept_exec_id: drugDept?.dept_id,
                dept_exec_name: drugDept?.dept_name,
              });
            } else {
              setSingleItem({
                ...singleItem,
                bill_tag: "",
                item_id: "",
                item_type: "",
                item_name: "",
                item_no: "",
                item_spec: "",
                item_model: "",
                add_quantity: "1",
                quantity_unit: "",
                usage_id: defaultUseObj.usage_id,
                usage_name: defaultUseObj.usage_name,
                usage_note: "",
                dept_exec_id: deptExecList[0]?.dept_id,
                dept_exec_name: deptExecList[0]?.dept_name,
              });
            }
          }}
        />

        {itemType === "DRUG" && (
          <div>
            <Typography.Text>药房:</Typography.Text>
            <Select
              style={{ width: 150 }}
              placeholder="请选择药房"
              value={storeId}
              options={storeList.map((s) => ({ value: s.store_id, label: s.store_name }))}
              onChange={(v) => setStoreId(v)}
            />
          </div>
        )}

        <RemoteSelect
          key={itemType}
          width={220}
          placeholder={singleItem.item_name || "点击检索项目"}
          value={singleItem.item_id}
          label={singleItem.item_name}
          fetchOptions={async (s) => {
            const query = (s || "").trim() === "" ? "*" : s;
            let res: any;
            if (itemType === "DRUG") {
              res = await retrieveDrugListAPI({ retrieve_input: query, retrieve_limit: 50, store_id: storeId });
            } else if (itemType === "MATERIAL") {
              res = await retrieveMaterialListAPI({ retrieve_input: query, retrieve_limit: 50 });
            } else if (itemType === "CHARGE") {
              res = await retrieveChargeListAPI({ retrieve_input: query, retrieve_limit: 50 });
            } else {
              return [];
            }
            return res?.row_list || [];
          }}
          optionValue={(i) => i.item_id}
          optionLabel={(i) => `${i.item_name} ${itemType == 'MATERIAL' ?(i.item_note|| "") :(itemType == 'CHARGE'?(i.item_desc || ""): (i.item_spec || "")) } ${i.price_latest ? parseFloat(i.price_latest) : '-'}`}
          onChange={(item) => {
            setSingleItem((prev: any) => ({
              ...prev,
              item_id: item.item_id,
              item_type: itemType,
              item_name: item.item_name,
              item_no: item.item_no,
              item_spec: item?.item_spec ? item?.item_spec : item?.item_note,
              item_model: item?.item_model,
              store_id: item?.store_id,
              store_name: item?.store_name,
              usage_id: item?.usage_id || defaultUseObj.usage_id,
              usage_name: item?.usage_name || defaultUseObj.usage_name,
              quantity_unit: item?.quantity_unit || "-",
              quantity_dosage: String(parseFloat(item?.quantity_dosage)),
              dosage_unit: item?.dosage_unit,
            }));
          }}
        />

        {itemType === "DRUG" && (
          <div>
            <Typography.Text>用法:</Typography.Text>
            <RemoteSelect
              width={150}
              placeholder="用法"
              value={singleItem.usage_id}
              label={singleItem.usage_name}
              fetchOptions={(s) =>
                retrieveUsageList(s).then((r) => r || [])
              }
              optionValue={(i) => i.usage_id}
              optionLabel={(i) => i.usage_name}
              onChange={(item) =>
                setSingleItem({ ...singleItem, usage_id: item.usage_id || defaultUseObj.usage_id, usage_name: item.usage_name || defaultUseObj.usage_name })
              }
            />
          </div>
        )}

        {itemType === "DRUG" && (
          <div>
            <Typography.Text>频次:</Typography.Text>
            <Select
              style={{ width: 120 }}
              placeholder="频次"
              value={singleItem.usage_note || undefined}
              options={freqList.map((f) => ({ value: f.item_name, label: f.item_name }))}
              onChange={(val) =>
                setSingleItem((prev: any) => ({ ...prev, usage_note: val }))
              }
            />
          </div>
        )}
        {itemType === "DRUG" && <Typography.Text>剂量:</Typography.Text>}
        {itemType === "DRUG" && (
          <Input
            style={{ width: 90 }}
            placeholder="剂量"
            value={singleItem.quantity_dosage}
            onChange={(e) =>
              setSingleItem((prev: any) => ({ ...prev, quantity_dosage: e.target.value }))
            }
            addonAfter={singleItem.dosage_unit}
          />
        )}

        <Typography.Text>数量:</Typography.Text>
        <Input
          style={{ width: 90 }}
          placeholder="数量"
          value={singleItem.add_quantity}
          onChange={(e) => {
            // 药品 材料限制正整数,收费项目 不用限制
            const digits = e.target.value.replace(/\D/g, "");
            const normalized = digits.replace(/^0+(?=\d)/, "");
            setSingleItem({ ...singleItem, add_quantity: itemType === "CHARGE" ? e.target.value : normalized});
          }}
          addonAfter={singleItem.quantity_unit}
        />

        {itemType === "DRUG" && (
          <Checkbox
            checked={singleItem.bill_tag?.includes("[自费]")}
            onChange={(e) => {
              let tag = singleItem.bill_tag || "";
              if (e.target.checked) {
                if (!tag.includes("[自费]")) tag += "[自费]";
              } else {
                tag = tag.replace("[自费]", "");
              }
              setSingleItem({ ...singleItem, bill_tag: tag });
            }}
          >
            <span style={{ color: "red" }}>自费</span>
          </Checkbox>
        )}

        <DatePicker
          showTime={{ format: "HH:mm" }}
          format="YYYY-MM-DD HH:mm"
          value={addTimeValue ? dayjs(addTimeValue) : null}
          onChange={(val) => {
            const timeStr = val ? val.format("YYYY-MM-DD HH:mm") + ":00" : "";
            setAddTimeValue(timeStr);
            setSingleItem((prev: any) => ({ ...prev, bill_time: timeStr }));
          }}
        />

        <Button type="primary" onClick={handleAdd}>
          添加
        </Button>

        <Button onClick={onOpenPrefab}>模板</Button>
      </Space>
    </div>
  );
}
