import { useCallback, useEffect, useRef, useState } from "react";
import {
  Button,
  Checkbox,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  message,
} from "antd";
import { attachOrderSubListAPI } from "@/api/ordent";
import {
  getMedicatePrefabDetailAPI,
  getMedicatePrefabListAPI,
} from "@/api/medicate";
import type { PrefabRow } from "@/types/medicate";
import {
  buildAttachRowsFromPrefabDetail,
  buildChargeRowFromRetrieveItem,
  buildMaterialRowFromRetrieveItem,
  type RetrieveAttachItem,
} from "./orderAttachUtils";
import { retrieveBillItemListAPI } from "@/api/bill";
import { retrieveMaterialItemListAPI } from "@/api/material";

type RetrieveItemOption = RetrieveAttachItem & {
  item_id: number;
  item_name: string;
  display_name: string;
};

function parsePrefabId(raw: string): number | null {
  const code = raw.trim().replace(/^P\$/i, "");
  if (!code) return null;
  let value = code;
  try {
    const url = new URL(code, window.location.origin);
    const linkData = url.searchParams.get("link_data");
    if (linkData) value = linkData;
  } catch {
    // not a URL
  }
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}

interface OrderSubAttachFormProps {
  orderId: number;
  orderCatalog?: string;
  confirmLoading?: boolean;
  onConfirmLoadingChange?: (loading: boolean) => void;
  onSuccess: () => void;
}

const OrderSubAttachForm = ({
  orderId,
  orderCatalog,
  confirmLoading,
  onConfirmLoadingChange,
  onSuccess,
}: OrderSubAttachFormProps) => {
  const [form] = Form.useForm();
  const [billLoading, setBillLoading] = useState(false);
  const [materialLoading, setMaterialLoading] = useState(false);
  const [billOptions, setBillOptions] = useState<RetrieveItemOption[]>([]);
  const [materialOptions, setMaterialOptions] = useState<RetrieveItemOption[]>(
    [],
  );
  const [billOptionMap, setBillOptionMap] = useState<
    Record<number, RetrieveItemOption>
  >({});
  const [materialOptionMap, setMaterialOptionMap] = useState<
    Record<number, RetrieveItemOption>
  >({});
  const [templateList, setTemplateList] = useState<PrefabRow[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<
    number | undefined
  >(undefined);
  const [scanCode, setScanCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const scanLockRef = useRef(false);

  const formBillItemId = Form.useWatch("bill_item_id", form);
  const formMaterialItemId = Form.useWatch("material_item_id", form);

  const fetchTemplates = useCallback(async () => {
    if (!orderCatalog) {
      setTemplateList([]);
      return;
    }
    const categories = [orderCatalog, "输液器", "注射器"];
    try {
      const results = await Promise.all(
        categories.map((catLabel) =>
          getMedicatePrefabListAPI({
            prefab_type: catLabel,
            include_org: true,
            include_dept: true,
          }),
        ),
      );
      let mergedList: PrefabRow[] = [];
      results.forEach((res) => {
        if (res?.code === 0 && res?.row_list) {
          mergedList = [...mergedList, ...res.row_list];
        } else if (res?.code !== 0) {
          message.error((res?.message ?? "") + (res?.hint ?? ""));
        }
      });
      setTemplateList(mergedList);
    } catch {
      setTemplateList([]);
    }
  }, [orderCatalog]);

  useEffect(() => {
    void fetchTemplates();
  }, [fetchTemplates]);

  const submitAttach = async (
    charge_list?: Parameters<typeof attachOrderSubListAPI>[0]["charge_list"],
    material_list?: Parameters<typeof attachOrderSubListAPI>[0]["material_list"],
  ) => {
    if (!charge_list?.length && !material_list?.length) return false;

    onConfirmLoadingChange?.(true);
    try {
      const res = await attachOrderSubListAPI({
        order_id: orderId,
        charge_list: charge_list?.length ? charge_list : undefined,
        material_list: material_list?.length ? material_list : undefined,
      });
      if (res?.code === 0) {
        message.success("保存成功");
        onSuccess();
        return true;
      }
      message.error((res?.message ?? "") + (res?.hint ?? "") || "保存失败");
    } catch {
      message.error("保存失败");
    } finally {
      onConfirmLoadingChange?.(false);
    }
    return false;
  };

  const applyTemplate = async (prefabId: number) => {
    try {
      const res = await getMedicatePrefabDetailAPI({ prefab_id: prefabId });
      if (res.code === 0 && res.row_list?.length) {
        const isSelfCharge = form.getFieldValue("is_self_charge");
        const { charge_list, material_list } = buildAttachRowsFromPrefabDetail(
          res.row_list,
          !!isSelfCharge,
        );
        return submitAttach(charge_list, material_list);
      }
      message.error((res.message ?? "") + (res.hint ?? "") || "获取模板失败");
    } catch {
      message.error("获取模板失败");
    }
    return false;
  };

  const handleSelectTemplate = async (prefabId: number) => {
    setSelectedTemplateId(prefabId);
    const ok = await applyTemplate(prefabId);
    if (ok) setSelectedTemplateId(undefined);
  };

  const applyScanCode = async (raw: string) => {
    const prefabId = parsePrefabId(raw);
    if (prefabId == null) {
      message.warning("请扫描或输入模板二维码");
      return;
    }
    if (scanLockRef.current) return;
    scanLockRef.current = true;
    setScanning(true);
    try {
      await applyTemplate(prefabId);
    } finally {
      scanLockRef.current = false;
      setScanning(false);
      setScanCode("");
    }
  };

  const validateAtLeastOne = () => {
    const billItemId = form.getFieldValue("bill_item_id");
    const materialItemId = form.getFieldValue("material_item_id");
    if (!billItemId && !materialItemId) {
      return Promise.reject(new Error("请至少选择一个附加收费或附加材料项"));
    }
    return Promise.resolve();
  };

  const handleBillSearch = async (val: string) => {
    if (!val.trim()) return;
    setBillLoading(true);
    try {
      const res = await retrieveBillItemListAPI({
        retrieve_input: val,
        retrieve_limit: 10,
      });
      if (res.code === 0 && res.row_list) {
        const list = (res.row_list as RetrieveAttachItem[]).map((item) => ({
          ...item,
          item_id: item.item_id!,
          item_name: item.item_name ?? "",
          display_name: `${item.item_name ?? ""} (${item.price_latest || "-"})`,
        }));
        setBillOptions(list);
        setBillOptionMap((prev) => {
          const next = { ...prev };
          list.forEach((item) => {
            if (item.item_id != null) next[item.item_id] = item;
          });
          return next;
        });
      }
    } finally {
      setBillLoading(false);
    }
  };

  const handleMaterialSearch = async (val: string) => {
    if (!val.trim()) return;
    setMaterialLoading(true);
    try {
      const res = await retrieveMaterialItemListAPI({
        retrieve_input: val,
        retrieve_limit: 10,
      });
      if (res.code === 0 && res.row_list) {
        const list = (res.row_list as RetrieveAttachItem[]).map((item) => ({
          ...item,
          item_id: item.item_id!,
          item_name: item.item_name ?? "",
          display_name: `${item.item_name ?? ""} (${item.item_model || "-"})(${item.item_spec || "-"})(${item.item_unit || "-"})(${item.price_latest || "-"})`,
        }));
        setMaterialOptions(list);
        setMaterialOptionMap((prev) => {
          const next = { ...prev };
          list.forEach((item) => {
            if (item.item_id != null) next[item.item_id] = item;
          });
          return next;
        });
      }
    } finally {
      setMaterialLoading(false);
    }
  };

  const handleAdd = async (values: {
    bill_item_id?: number;
    bill_quantity?: number;
    material_item_id?: number;
    material_quantity?: number;
    is_self_charge?: boolean;
  }) => {
    const {
      bill_item_id,
      bill_quantity,
      material_item_id,
      material_quantity,
      is_self_charge,
    } = values;

    const charge_list = bill_item_id
      ? [
        buildChargeRowFromRetrieveItem(
          billOptionMap[bill_item_id] ?? { item_id: bill_item_id },
          bill_quantity,
          !!is_self_charge,
        ),
      ]
      : undefined;

    const material_list = material_item_id
      ? [
        buildMaterialRowFromRetrieveItem(
          materialOptionMap[material_item_id] ?? {
            item_id: material_item_id,
          },
          material_quantity,
          !!is_self_charge,
        ),
      ]
      : undefined;

    const ok = await submitAttach(charge_list, material_list);
    if (ok) {
      form.resetFields();
      setBillOptions([]);
      setMaterialOptions([]);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <Form
        form={form}
        layout="inline"
        onFinish={handleAdd}
        initialValues={{
          bill_quantity: 1,
          material_quantity: 1,
          is_self_charge: false,
        }}
      >
        <Form.Item
          label="附加收费"
          name="bill_item_id"
          rules={[{ validator: validateAtLeastOne }]}
        >
          <Select
            showSearch={{
              filterOption: false,
              onSearch: handleBillSearch,
            }}
            allowClear
            placeholder="搜索并选择收费项目"
            loading={billLoading}
            options={billOptions}
            fieldNames={{ label: "display_name", value: "item_id" }}
            onChange={() =>
              form.validateFields(["bill_item_id", "material_item_id"])
            }
            style={{ minWidth: 220 }}
          />
        </Form.Item>
        <Form.Item name="bill_quantity">
          <InputNumber
            min={1}
            style={{ width: 120 }}
            suffix={
              billOptions.find((item) => item.item_id === formBillItemId)
                ?.item_unit || "单位"
            }
          />
        </Form.Item>
        <Form.Item
          label="附加材料"
          name="material_item_id"
          rules={[{ validator: validateAtLeastOne }]}
        >
          <Select
            showSearch={{
              filterOption: false,
              onSearch: handleMaterialSearch,
            }}
            allowClear
            placeholder="搜索并选择材料项目"
            loading={materialLoading}
            options={materialOptions}
            fieldNames={{ label: "display_name", value: "item_id" }}
            onChange={() =>
              form.validateFields(["bill_item_id", "material_item_id"])
            }
            style={{ minWidth: 220 }}
          />
        </Form.Item>
        <Form.Item name="material_quantity">
          <InputNumber
            min={1}
            style={{ width: 120 }}
            suffix={
              materialOptions.find(
                (item) => item.item_id === formMaterialItemId,
              )?.item_unit || "单位"
            }
          />
        </Form.Item>
        <Form.Item name="is_self_charge" valuePropName="checked">
          <Checkbox>自费</Checkbox>
        </Form.Item>
      </Form>
      <div className="flex flex-wrap items-center gap-2">
        <div className="w-40">
          <Space.Compact className="w-full">
            <Space.Addon>模板</Space.Addon>
            <Input
              value={scanCode}
              disabled={scanning || confirmLoading}
              placeholder="扫码"
              allowClear
              onChange={(e) => setScanCode(e.target.value)}
              onPressEnter={() => void applyScanCode(scanCode)}
            />
          </Space.Compact>
        </div>
        {templateList.length > 0 && (
          <Select
            placeholder="请选择模板"
            value={selectedTemplateId}
            onChange={handleSelectTemplate}
            options={templateList
              .filter((t) => t.prefab_id != null && t.prefab_name)
              .map((t) => ({
                label: t.prefab_name,
                value: t.prefab_id,
              }))}
            className="w-40"
            disabled={confirmLoading}
          />
        )}
        <Button
          type="primary"
          loading={confirmLoading}
          onClick={() => form.submit()}
        >
          确认
        </Button>
      </div>
    </div>
  );
};

export default OrderSubAttachForm;
