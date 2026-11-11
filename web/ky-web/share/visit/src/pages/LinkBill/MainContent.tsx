import React, { useEffect, useRef, useState } from "react";
import { App as AntdApp, Button, Empty, Modal, Popover, Space, Switch, Tag, Typography } from "antd";
import {
  CheckCircleOutlined,
  PayCircleOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { getSessionId } from "comm/session";
import type { BillStatus, DeptRow } from "@/types/linkBill";
import {
  addAnesDrugAPI,
  chargeBill2API,
  deleteAnesDrugAPI,
  deleteBillAPI,
  getAnesDrugListAPI,
  getBillListAPI,
  getDocTagListAPI,
  getPcaDrugListAPI,
  getPcaListAPI,
  getSessionInfoAPI,
  newBillAPI,
  saveBillPropertyAPI,
} from "@/api/linkBill";
import { calcAdd, calcSub, getCurrentDateTime, normalizeLinkData } from "./utils";
import { printPreview } from "@/pages/PrintList";
import BillList from "./BillList";
import BottomAdd from "./BottomAdd";
import BottomModify from "./BottomModify";
import PrefabManage from "./PrefabManage";


export interface MainContentProps {
  visit_id?: string;
  link_value?: string;
  link_name?: string;
  link_data?: string;
  link_tag?: string;
  link_ext?: string;
  baby_id?: string | number;
  deptList?: DeptRow[];
  deptExecList?: DeptRow[];
  doctorList?: any[];
  /** 选中的计费项目列表变化时回调（供调用方生成处方单时过滤） */
  onBillIdListChange?: (list: any[]) => void;
  /** 退药成功后回调（供调用方刷新处方单/退药单列表） */
  onWithdrawSuccess?: () => void;
}

export default function MainContent({
  visit_id,
  link_value,
  link_name,
  link_data,
  link_tag,
  link_ext,
  baby_id,
  deptList = [],
  deptExecList = [],
  doctorList = [],
  onBillIdListChange,
  onWithdrawSuccess,
}: MainContentProps) {
  const { message } = AntdApp.useApp();
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [amount, setAmount] = useState<number>(0);
  const [itemType, setItemType] = useState<string>("CHARGE");
  const [itemRow, setItemRow] = useState<any[]>([]);
  const [addTimeValue, setAddTimeValue] = useState<string>("");
  const [singleItem, setSingleItem] = useState<any>({
    bill_time: "",
    bill_tag: "",
    item_id: "",
    item_type: "",
    item_name: "",
    item_no: "",
    item_spec: "",
    item_model: "",
    item_price_unit: "",
    add_quantity: "1",
    quantity_unit: "",
    usage_id: "",
    usage_name: "",
    usage_note: "once",
    dept_id: "",
    dept_name: "",
    dept_exec_id: "",
    dept_exec_name: "",
  });

  const [user1, setUser1] = useState<any>({ id: "", name: "" });
  const [user2, setUser2] = useState<any>({ id: "", name: "" });

  const [singleItemSave, setSingleItemSave] = useState<any>("");
  const [timeValue, setTimeValue] = useState<any>("");

  const [prefabBillTime, setPrefabBillTime] = useState<string>("");
  const [isShowPrefab, setIsShowPrefab] = useState(false);
  const [choosePrefabBill, setChoosePrefabBill] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [storeId] = useState<any>(1);
  const [billIdList, setBillIdList] = useState<any[]>([]);
  // 类型过滤（替代原 DOM 显隐）
  const [activeTypes, setActiveTypes] = useState<string[]>([]);
  // 提交状态过滤（submitted 已提交 / unsubmitted 未提交）
  const [submitTypes, setSubmitTypes] = useState<string[]>([]);
  // 退费状态过滤（refunded 已退费 / unrefunded 未退费）
  const [refundTypes, setRefundTypes] = useState<string[]>([]);
  // 模板弹窗 / 批量更新弹窗
  const [prefabOpen, setPrefabOpen] = useState(false);
  // 打印预览：文档标签列表
  const [docTagList, setDocTagList] = useState<any[]>([]);
  // 麻醉药品列表（row_id -> 药品），删除药品前据此判断是否存在
  const [anesDrugList, setAnesDrugList] = useState<any[]>([]);

  useEffect(() => {
    getBillList();
    getInitData();
    if (link_name == "麻醉") {
      getBillDocList();
    }
  }, []);

  // 选中项目变化时同步给调用方
  useEffect(() => {
    onBillIdListChange?.(billIdList);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [billIdList]);

  // 获取：登陆人信息
  async function getInitData() {
    const now = getCurrentDateTime();
    setAddTimeValue(now + ":00");

    try {
      const sessionRes = await getSessionInfoAPI({ session_id: getSessionId() ?? undefined });

      if (sessionRes.code === 0 && sessionRes.session_info) {
        const sessionInfo = sessionRes.session_info;
        setSessionInfo(sessionInfo);

        // TODO 一开始科室和人员的设置
        setSingleItem({
          ...singleItem,
          bill_time: now + ":00",
          dept_id: sessionInfo?.dept_id,
          dept_name: sessionInfo?.dept_name,
          dept_exec_id: sessionInfo?.dept_id,
          dept_exec_name: sessionInfo?.dept_name,
        });

        setUser1({ id: sessionInfo?.user_id, name: sessionInfo?.user_name });
        setUser2({ id: sessionInfo?.user_id, name: sessionInfo?.user_name });
      }
    } catch (err) {
      console.log(err);
    }
  }

  // 获取打印预览的文档标签列表
  async function getBillDocList() {
    try {
      const docTagRes = await getDocTagListAPI({
        doc_type: "麻醉病历",
        doc_name: "麻醉计费",
      });
      if (docTagRes?.code === 0) {
        setDocTagList(docTagRes.row_list || []);
      } else {
        setDocTagList([]);
      }
    } catch (e) {
      setDocTagList([]);
    }
  }

  // 打印预览
  const handlePrintPreview = (docTag: string) => {
    const url = `doc/visit3/${getSessionId()}?visit_id=${Number(visit_id)}&baby_id=${baby_id ?? 0}&doc_type=${encodeURIComponent("麻醉病历")}&doc_name=${encodeURIComponent("麻醉计费")}&doc_tag=${encodeURIComponent(docTag)}&link_name=${encodeURIComponent(link_name ?? "麻醉")}&link_value=${Number(link_value)}&auto_create=1&rebuild=1`;
    printPreview(url);
  };

  // 获取计费数据
  async function getBillList() {
    try {
      const res = await getBillListAPI({
        visit_id: Number(visit_id),
        link_name: link_name,
        link_value: Number(link_value),
        // TODO 
        column_list: "",
        column_item: "*",
        column_apply: "bill_id,dept_id,dept_name,user_id,user_name",
        column_exec: "bill_id,dept_id,dept_name,user_id,user_name",
      });

      if (!res || res.code !== 0 || !Array.isArray(res.row_list)) {
        console.error("获取计费列表失败:", res);
        return;
      }

      // 麻醉：同时获取麻醉药品列表，通过 link_data(row_id) 关联剂量/剂量单位
      let anesDrugMap: Record<number, any> = {};
      if (link_name === "麻醉") {
        try {
          const anesRes: any = await getAnesDrugListAPI({
            anes_id: Number(link_value),
            order_type: "麻醉",
            include_children: false,
          });
          if (anesRes?.code === 0 && Array.isArray(anesRes.row_list)) {
            setAnesDrugList(anesRes.row_list);
            anesDrugMap = anesRes.row_list.reduce((acc: any, d: any) => {
              acc[Number(d.row_id)] = d;
              return acc;
            }, {});
          }
        } catch (e) {
          // 忽略，剂量/剂量单位按空处理
        }
      }

      setAmount(0);
      const arr: any[] = [];
      if (res.row_list.length === 0) {
        setItemRow([]);
      } else {
        const totalAmount = res.row_list.reduce(
          (sum: number, item: any) => sum + Number(item.item_amount || 0),
          0,
        );
        setAmount(totalAmount);

        res.row_list.forEach((item: any, index: number) => {
          const anesDrug = anesDrugMap[Number(item?.link_data)];
          arr.push({
            bill_no: index + 1,
            bill_id: item?.bill_id,
            bill_quantity: item?.bill_quantity,
            batch_no: item?.batch_no && item?.batch_no != "-1" ? item?.batch_no : "",
            charge_no: item?.charge_no,
            item_id: item?.item_id,
            item_type: item.item_type,
            item_price: item.item_price,
            item_code: res.item_list?.[index]?.item_code,
            item_name: res.item_list?.[index]?.item_name,
            item_spec: res.item_list?.[index]?.item_spec,
            item_price_unit: item.item_price_unit,
            store_id: item?.store_id,
            store_name: item?.store_name,
            usage_id: item?.usage_id,
            usage_name: item?.usage_name,
            usage_quantity: parseFloat(item?.usage_quantity),
            usage_note: item?.usage_note,
            usage_unit: item?.usage_unit,
            item_quantity: parseFloat(item.item_quantity),
            item_quantity_unit: item.item_quantity_unit,
            item_amount: item.item_amount,
            refund_quantity: item.refund_quantity ? parseFloat(item.refund_quantity) : 0,
            dept_apply_user_id: res.apply_list?.[index]?.user_id,
            dept_apply_user: res.apply_list?.[index]?.user_name,
            dept_id: res.apply_list?.[index]?.dept_id,
            dept_name: res.apply_list?.[index]?.dept_name,
            dept_exec_user_id: res.exec_list?.[index]?.user_id,
            dept_exec_user: res.exec_list?.[index]?.user_name,
            dept_exec_id: res.exec_list?.[index]?.dept_id,
            dept_exec_name: res.exec_list?.[index]?.dept_name,
            bill_time: item?.bill_time,
            bill_tag: item?.bill_tag,
            charge_time: item?.charge_time,
            create_note: item?.create_note,
            patient_id: item?.patient_id,
            parent_id: item?.parent_id,
            child_count: 0,
            link_data: item?.link_data,
            link_data_list: normalizeLinkData(item?.link_data),
            link_tag: item?.link_tag,
            dosage_quantity: anesDrug?.dosage_quantity,
            dosage_unit: anesDrug?.dosage_unit,
          });
        });
        setItemRow(arr);
      }
      setIsLoading(true);
    } catch (error) {
      console.error("获取数据失败:", error);
    }
  }

  // 修改计费
  async function saveBillProperty(
    bill_id: number,
    quantity: string,
    bill_time?: string,
    usage_id?: any,
    usage_name?: string,
    usage_note?: string,
    bill_tag?: string,
    apply_property?: any,
    exec_property?: any,
  ) {
    const applyDept = apply_property
      ? {
        dept_id: Number(apply_property.dept_id),
        dept_name: apply_property.dept_name,
        user_id: Number(apply_property.user_id),
        user_name: apply_property.user_name,
      }
      : {};
    const execDept = exec_property
      ? {
        dept_id: Number(exec_property.dept_id),
        dept_name: exec_property.dept_name,
        user_id: Number(exec_property.user_id),
        user_name: exec_property.user_name,
      }
      : {};

    try {
      await saveBillPropertyAPI({
        bill_id: bill_id,
        bill_time: bill_time,
        bill_tag: bill_tag ? bill_tag : "[]",
        item_quantity: String(quantity),
        usage_id: Number(usage_id),
        usage_name: usage_name,
        usage_note: usage_note,
        apply_property: applyDept,
        exec_property: execDept,
      });
      message.success("保存成功");
      setSingleItemSave("");
      setTimeValue("");
      getBillList();
    } catch (e) {
      // 错误已由请求拦截器提示
    }
  }

  // 添加新数据
  async function newBill(billRow: any) {
    try {
      // 麻醉且为药品时：先新增麻醉药品，用其 row_id 作为 link_data 关联
      let linkData = String(billRow.item_id);
      if (link_name === "麻醉" && billRow.item_type === "DRUG") {
        const addRes: any = await addAnesDrugAPI({
          anes_id: Number(link_value),
          start_time: getCurrentDateTime() + ":00",
          start_tag: "",
          row_list: [
            {
              item_id: Number(billRow.item_id),
              ancestor_id: 0,
              store_id: 0,
              route_no: null,
              start_note: null,
              order_type: "麻醉",
              drug_type: "麻药",
              dosage_quantity: billRow.quantity_dosage,
              last_quantity: "0",
              usage_id: billRow.usage_id ? Number(billRow.usage_id) : null,
              usage_name: billRow.usage_name || null,
            },
          ],
        });
        if (addRes?.code === 0) {
          linkData = String(addRes.row_id);
        } else {
          message.error(addRes?.message || "新增麻醉药品失败");
          return;
        }
      }

      const res = await newBillAPI({
        visit_id: Number(visit_id),
        link_name: link_name,
        link_value: Number(link_value),
        dept_id: Number(billRow.dept_id),
        dept_name: billRow.dept_name,
        user_id: Number(user1?.id),
        user_name: user1.name,
        exec_info: {
          dept_id: Number(billRow.dept_exec_id),
          dept_name: billRow.dept_exec_name,
          user_id: Number(user2?.id),
          user_name: user2.name,
        },
        row_list: [
          {
            item_id: Number(billRow.item_id),
            item_type: billRow.item_type,
            item_price: billRow.item_price,
            item_quantity: billRow.add_quantity,
            usage_id: billRow.usage_id ? Number(billRow.usage_id) : 0,
            usage_name: billRow.usage_name,
            usage_note: billRow.usage_note,
            store_id: Number(storeId),
            bill_tag: billRow.bill_tag,
            bill_time: billRow.bill_time,
            link_data: linkData,
            link_tag: `[${String(billRow.item_type)}]`,
            item_quantity_unit: billRow.quantity_unit || "",
          },
        ],
      });
      if (res.code === 0) {
        message.success("添加成功");
        const now = getCurrentDateTime();
        setAddTimeValue(now + ":00");
      }
      getBillList();
    } catch (e) {
      // 错误已由请求拦截器提示
    }
  }

  // 提交/审核
  async function chargeBill() {
    const billChargeList = billIdList.filter((i: any) => !i.charge_time);
    const chargeBillParam: any = {
      bill_id: billChargeList.map((i: any) => i.bill_id),
    };

    try {
      await chargeBill2API(chargeBillParam);
      message.success("提交成功");
    } catch (e) {
      // 错误已由请求拦截器提示
    }

    setBillIdList([]);
    getBillList();
  }

  // 批量删除
  async function batchDeleteBill() {
    if (billIdList.length === 0) {
      message.warning("请选择项目");
      return;
    }

    if (!window.confirm("是否确认删除？")) return;

    const promises: Promise<any>[] = [];
    const deleteBillList = billIdList.filter((i: any) => !i.charge_time);

    deleteBillList.forEach((item: any) => {
      promises.push(deleteBillAPI({ bill_id: Number(item.bill_id) }));

      // 麻醉药品：删除计费项的同时，删除对应的麻醉药品记录
      if (link_name === "麻醉" && item.item_type === "DRUG") {
        const exists = anesDrugList.some(
          (d: any) => Number(d.row_id) === Number(item.link_data),
        );
        if (exists) {
          promises.push(deleteAnesDrugAPI({ row_id: Number(item.link_data) }));
        }
      }
    });


    try {
      const results = await Promise.allSettled(promises);
      const failed = results.filter((r: any) => r.status !== "fulfilled");
      if (failed.length > 0) {
        message.error("部分项目删除失败");
      } else {
        message.success("删除成功");
      }
    } finally {
      setBillIdList([]);
      getBillList();
    }
  }

  // 模板导入
  async function loadPrefabData() {
    if (choosePrefabBill.length === 0) {
      message.warning("请先选择模板");
      return;
    }

    const promises = choosePrefabBill.map((item: any) =>
      newBillAPI({
        visit_id: Number(visit_id),
        link_name: link_name,
        link_value: Number(link_value),
        dept_id: Number(singleItem.dept_id),
        dept_name: singleItem.dept_name,
        user_id: Number(user1?.id),
        user_name: user1.name,
        exec_info: {
          dept_id: Number(singleItem.dept_exec_id),
          dept_name: singleItem.dept_exec_name,
          user_id: Number(user2?.id),
          user_name: user2.name,
        },
        row_list: [
          {
            item_id: Number(item.item_id),
            item_type: item.item_type,
            item_price: item.item_price,
            item_quantity: item.item_quantity,
            usage_id: Number(item.usage_id),
            usage_name: item.usage_name,
            usage_note: item.usage_note,
            store_id: Number(storeId),
            bill_tag: item.bill_tag,
            bill_time: prefabBillTime,
            link_data: String(item.item_id),
            link_tag: `[${String(item.item_type)}]`,
            item_quantity_unit: item.quantity_unit || "",
          },
        ],
      }),
    );

    try {
      const results = await Promise.allSettled(promises);
      const failed = results.filter((r: any) => r.status !== "fulfilled");
      if (failed.length > 0) {
        message.error("部分模板导入失败");
      } else {
        message.success("已成功添加");
        getBillList();
        setPrefabOpen(false);
        setIsShowPrefab(false);
      }
    } catch (e) {
      // 错误已由请求拦截器提示
    }
  }

  // 审核按钮处理
  function handleCharge() {
    const billChargeList = billIdList.filter((i: any) => !i.charge_time);

    if (billIdList.length === 0) {
      message.warning("请选择收费项目");
      return;
    }
    if (billChargeList.length === 0) {
      message.warning("无可提交收费项目");
      return;
    }


    if (!window.confirm("是否确认提交？")) return;
    chargeBill();
  }

  const filteredItemRow = itemRow.filter((r) => {
    // 类型过滤
    if (activeTypes.length > 0 && !activeTypes.includes(r.item_type)) return false;
    // 提交状态过滤（charge_time 有值 = 已提交）
    if (submitTypes.length > 0) {
      const submitted = r.charge_time != null;
      const matched =
        (submitted && submitTypes.includes("submitted")) ||
        (!submitted && submitTypes.includes("unsubmitted"));
      if (!matched) return false;
    }
    // 退费状态过滤（仅针对已提交：剩余可退量 <= 0 为已退费，> 0 为未退费）
    if (refundTypes.length > 0) {
      const hasChargeTime = r.charge_time != null;
      const remain = calcSub(r.bill_quantity, r.refund_quantity);
      const refunded = hasChargeTime && remain <= 0;
      const unrefunded = hasChargeTime && remain > 0;
      const matched =
        (refunded && refundTypes.includes("refunded")) ||
        (unrefunded && refundTypes.includes("unrefunded"));
      if (!matched) return false;
    }
    return true;
  });

  const submittedCount = itemRow.filter((i: any) => i.charge_time != null).length;
  const unsubmittedCount = itemRow.filter((i: any) => i.charge_time == null).length;
  const totalCount = itemRow.length;

  return (
    <div className="px-2">
      {/* 头部 */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 8,
          marginBottom: 8,
          marginTop: 8,
        }}
      >
        <Typography.Text>类型:</Typography.Text>
        <Switch
          size="small"
          checked={activeTypes.includes("CHARGE")}
          onChange={(checked) =>
            setActiveTypes((prev) =>
              checked ? [...prev, "CHARGE"] : prev.filter((t) => t !== "CHARGE"),
            )
          }
        />
        <Typography.Text>收费项目</Typography.Text>
        <Switch
          size="small"
          checked={activeTypes.includes("MATERIAL")}
          onChange={(checked) =>
            setActiveTypes((prev) =>
              checked ? [...prev, "MATERIAL"] : prev.filter((t) => t !== "MATERIAL"),
            )
          }
        />
        <Typography.Text>材料</Typography.Text>
        <Switch
          size="small"
          checked={activeTypes.includes("DRUG")}
          onChange={(checked) =>
            setActiveTypes((prev) =>
              checked ? [...prev, "DRUG"] : prev.filter((t) => t !== "DRUG"),
            )
          }
        />
        <Typography.Text>药品</Typography.Text>

        <Button size="small" type="primary" danger onClick={batchDeleteBill}>
          删除
        </Button>
        <Button size="small" type="primary" onClick={handleCharge}>
          提交
        </Button>
        {
          link_name == "麻醉" && <Popover
            trigger="hover"
            content={
              docTagList.length > 0 ? (
                <Space direction="vertical" size={4}>
                  {docTagList.map((dt: any) => (
                    <Button
                      key={dt?.doc_tag}
                      size="small"
                      type="primary"
                      block
                      onClick={() => handlePrintPreview(dt?.doc_tag)}
                    >
                      {dt?.doc_tag}
                    </Button>
                  ))}
                </Space>
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="无打印数据" />
              )
            }
          >
            <Button size="small" type="primary">
              打印预览
            </Button>
          </Popover>
        }



        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16 }}>
          <span>
            <CheckCircleOutlined style={{ color: "#52c41a", marginRight: 4 }} />
            提交数({submittedCount})条
          </span>
          <span>
            <CheckCircleOutlined style={{ color: "#6c757d", marginRight: 4 }} />
            未提交数({unsubmittedCount})条
          </span>
          <span>
            <UnorderedListOutlined style={{ color: "#1677ff", marginRight: 4 }} />
            合计({totalCount})条
          </span>
          <span>
            <PayCircleOutlined style={{ color: "#ffc107", marginRight: 4 }} />
            总额({Number(amount).toFixed(2)})元
          </span>
        </div>
      </div>
      {/* 提交 / 退费状态过滤 */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 8,
          marginBottom: 8,
        }}
      >
        <Typography.Text>提交状态:</Typography.Text>
        <Switch
          size="small"
          checked={submitTypes.includes("submitted")}
          onChange={(checked) =>
            setSubmitTypes((prev) =>
              checked ? [...prev, "submitted"] : prev.filter((t) => t !== "submitted"),
            )
          }
        />
        <Typography.Text>已提交</Typography.Text>
        <Switch
          size="small"
          checked={submitTypes.includes("unsubmitted")}
          onChange={(checked) =>
            setSubmitTypes((prev) =>
              checked ? [...prev, "unsubmitted"] : prev.filter((t) => t !== "unsubmitted"),
            )
          }
        />
        <Typography.Text>未提交</Typography.Text>

        <span style={{ width: 16 }} />

        <Typography.Text>退费状态:</Typography.Text>
        <Switch
          size="small"
          checked={refundTypes.includes("unrefunded")}
          onChange={(checked) =>
            setRefundTypes((prev) =>
              checked ? [...prev, "unrefunded"] : prev.filter((t) => t !== "unrefunded"),
            )
          }
        />
        <Typography.Text>未退费</Typography.Text>
        <Switch
          size="small"
          checked={refundTypes.includes("refunded")}
          onChange={(checked) =>
            setRefundTypes((prev) =>
              checked ? [...prev, "refunded"] : prev.filter((t) => t !== "refunded"),
            )
          }
        />
        <Typography.Text>已退费</Typography.Text>
      </div>

      {/* 计费列表 */}
      <BillList
        itemRow={filteredItemRow}
        visitId={String(visit_id)}
        billIdList={billIdList}
        setBillIdList={setBillIdList}
        singleItemSave={singleItemSave}
        setSingleItemSave={setSingleItemSave}
        setTimeValue={setTimeValue}
        getBillList={getBillList}
        isLoading={isLoading}
        onWithdrawSuccess={onWithdrawSuccess}
      />

      {/* 底部 */}
      <div style={{ borderTop: "1px solid #eee", paddingTop: 8, marginTop: 8 }}>
        {singleItemSave ? (
          <BottomModify
            singleItemSave={singleItemSave}
            setSingleItemSave={setSingleItemSave}
            deptList={deptList}
            doctorList={doctorList}
            deptExecList={deptExecList}
            saveBillProperty={saveBillProperty}
            timeValue={timeValue}
          />
        ) : (
          <BottomAdd
            singleItem={singleItem}
            setSingleItem={setSingleItem}
            deptList={deptList}
            user1={user1}
            setUser1={setUser1}
            user2={user2}
            setUser2={setUser2}
            doctorList={doctorList}
            itemType={itemType as any}
            deptExecList={deptExecList}
            setItemType={setItemType}
            newBill={newBill}
            addTimeValue={addTimeValue}
            setAddTimeValue={setAddTimeValue}
            onOpenPrefab={() => {
              setIsShowPrefab(true);
              setPrefabOpen(true);
            }}
          />
        )}
      </div>

      {/* 模板 */}
      <Modal
        title="模板"
        open={prefabOpen}
        width={1200}
        onCancel={() => {
          setPrefabOpen(false);
          setIsShowPrefab(false);
          setChoosePrefabBill([]);
        }}
        onOk={loadPrefabData}
        okText="加载"
      >
        {isShowPrefab ? (
          <PrefabManage
            isShowPrefab={isShowPrefab}
            choosePrefabBill={choosePrefabBill}
            setChoosePrefabBill={setChoosePrefabBill}
            prefabBillTime={prefabBillTime}
            setPrefabBillTime={setPrefabBillTime}
            orgId={sessionInfo?.org_id}
            itemRow={itemRow}
            sessionInfo={sessionInfo}
            link_name={link_name}
          />
        ) : null}
      </Modal>
    </div>
  );
}
