import {
  createContext,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import type { ReactNode, Ref } from "react";
import {
  Modal,
  Checkbox,
  Spin,
  message,
  Empty,
  Row,
  Col,
  Input,
  Button,
  Space,
  Select,
  Dropdown,
} from "antd";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { getSessionId } from "comm/session";
import { getSessionInfo } from "@/api/auth";
import { print, printPreview } from "@/pages/PrintList";
import {
  getBillCategoryItemListAPI,
  getMaterialCategoryItemListAPI,
  getPrefabListAPI,
  newPrefabAPI,
  deletePrefabAPI,
  getPrefabDetailAPI,
  savePrefabDetailAPI,
  savePrefabPropertyAPI,
} from "./api";

export type OrderAttatchItem = {
  item_id: any;
  item_name?: string;
  item_spec?: string;
  item_quantity: number;
  _categoryType: string;
  [key: string]: any;
};

export type OrderAttatchHandle = {
  getSelectedItems: () => OrderAttatchItem[];
};

export type OrderAttatchProps = {
  /** 第一列收费分类名称，如输液/注射 */
  orderCatalog?: string;
  /** 执行科室，拉项目列表用 */
  execDeptId?: string | number;
  /** 是否显示打印二维码，默认 true */
  showPrintQr?: boolean;
  /**
   * 弹窗场景传入：把 OrderAttatch.Toolbar 和取消/确定一起放进 Modal footer。
   * 页面嵌入不传 children，工具栏显示在内容下方。
   */
  children?: ReactNode;
  ref?: Ref<OrderAttatchHandle>;
};

type OrderAttatchContextValue = {
  toolbar: ReactNode;
  content: ReactNode;
};

const OrderAttatchContext = createContext<OrderAttatchContextValue | null>(
  null,
);

function useOrderAttatchContext() {
  const ctx = useContext(OrderAttatchContext);
  if (!ctx) {
    throw new Error("OrderAttatch.Toolbar / Content 需要放在 OrderAttatch 内");
  }
  return ctx;
}

export function OrderAttatchToolbar() {
  return useOrderAttatchContext().toolbar;
}

export function OrderAttatchContent() {
  return useOrderAttatchContext().content;
}

/** 医嘱附加项目面板。本身不是弹窗，可嵌在 Modal 或页面中。 */
function OrderAttatch({
  orderCatalog,
  execDeptId,
  showPrintQr = true,
  children,
  ref,
}: OrderAttatchProps) {
  const [loading, setLoading] = useState(false);
  const [itemsMap, setItemsMap] = useState<Record<string, any[]>>({});
  const [selectedIds, setSelectedIds] = useState<Record<string, any[]>>({});
  const [quantities, setQuantities] = useState<
    Record<string, Record<string, number>>
  >({});

  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveIncludeOrg, setSaveIncludeOrg] = useState(false);
  const [saveIncludeDept, setSaveIncludeDept] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingPrefabId, setEditingPrefabId] = useState<string | null>(null);

  const [templateList, setTemplateList] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<
    string | undefined
  >(undefined);

  const [includeOrg, setIncludeOrg] = useState(false);
  const [includeDept, setIncludeDept] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [printLoading, setPrintLoading] = useState(false);

  const CATEGORIES = useMemo(
    () => [
      {
        key: "infusion",
        label: orderCatalog,
        api: getBillCategoryItemListAPI,
        itemType: "CHARGE",
        saveType: "费用",
        params: {
          category_name: orderCatalog,
          dept_id: execDeptId,
          include_org: true,
        },
      },
      {
        key: "infusionSet",
        label: "输液器",
        api: getMaterialCategoryItemListAPI,
        itemType: "MATERIAL",
        saveType: "输液器",
        params: {
          category_name: "输液器",
          dept_id: execDeptId,
          include_org: true,
        },
      },
      {
        key: "syringe",
        label: "注射器",
        api: getMaterialCategoryItemListAPI,
        itemType: "MATERIAL",
        saveType: "注射器",
        params: {
          category_name: "注射器",
          dept_id: execDeptId,
          include_org: true,
        },
      },
    ],
    [orderCatalog, execDeptId],
  );

  const getSelectedItems = (): OrderAttatchItem[] => {
    const result: OrderAttatchItem[] = [];
    CATEGORIES.forEach((cat) => {
      const ids = selectedIds[cat.key] || [];
      const items = itemsMap[cat.key] || [];
      ids.forEach((id) => {
        const item = items.find((i) => i.item_id === id);
        if (item) {
          result.push({
            ...item,
            _categoryType: cat.itemType,
            item_quantity: quantities[cat.key]?.[id] || 1,
          });
        }
      });
    });
    return result;
  };

  useImperativeHandle(
    ref,
    () => ({
      getSelectedItems,
    }),
    [CATEGORIES, selectedIds, itemsMap, quantities],
  );

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const results = await Promise.all(
        CATEGORIES.map((cat) => cat.api(cat.params)),
      );
      const newItemsMap: Record<string, any[]> = {};
      results.forEach((res: any, index: number) => {
        const key = CATEGORIES[index].key;
        newItemsMap[key] = res?.code === 0 && res?.row_list ? res.row_list : [];
      });
      setItemsMap(newItemsMap);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleLoad = async () => {
    setLoading(true);
    try {
      const results = await Promise.all(
        CATEGORIES.map((cat) =>
          getPrefabListAPI({
            prefab_type: cat.label,
            include_org: includeOrg,
            include_dept: includeDept,
          }),
        ),
      );
      let mergedList: any[] = [];
      results.forEach((res: any, index: number) => {
        if (res?.code === 0 && res?.row_list) {
          const list = res.row_list.map((item: any) => ({
            ...item,
            prefab_type: item.prefab_type || CATEGORIES[index].label,
          }));
          mergedList = [...mergedList, ...list];
        }
      });
      setTemplateList(mergedList);
      if (mergedList.length > 0) {
        message.success(`成功加载 ${mergedList.length} 个模板`);
      } else {
        message.info("未找到相关模板");
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionInfo = async () => {
    const sessionId = getSessionId();
    if (!sessionId) return;
    try {
      const res = await getSessionInfo({ session_id: sessionId });
      if (res?.code === 0) {
        setSessionInfo(res.session_info);
      }
    } catch {}
  };

  useEffect(() => {
    fetchAllData();
    handleLoad();
    fetchSessionInfo();
    setSelectedIds({ infusion: [], infusionSet: [], syringe: [] });
    setQuantities({});
    setSelectedTemplateId(undefined);
  }, [orderCatalog, execDeptId]);

  const buildPrintUrl = (prefabId: string) => {
    const sessionId = getSessionId();
    const orgId =
      localStorage.getItem("SITE_AUTH_CA_ORG_ID") || sessionInfo?.org_id;
    return (
      `doc/work2/${sessionId}?org_id=${orgId}` +
      `&dept_id=${sessionInfo?.dept_id}` +
      `&user_id=${sessionInfo?.user_id}` +
      `&link_data=${prefabId}` +
      `&doc_type=${encodeURIComponent("计费模板")}` +
      `&doc_name=${encodeURIComponent("药品")}` +
      `&doc_tag=${encodeURIComponent("药品")}` +
      `&auto_create=1&rebuild=1`
    );
  };

  const ensurePrintReady = () => {
    if (!selectedTemplateId) {
      message.warning("请先选中模板");
      return false;
    }
    if (!getSessionId()) {
      message.warning("请先登录");
      return false;
    }
    if (!sessionInfo) {
      message.warning("会话信息未就绪，请稍后重试");
      return false;
    }
    return true;
  };

  const handlePrint = async () => {
    if (!ensurePrintReady() || !selectedTemplateId) return;
    setPrintLoading(true);
    try {
      await print(buildPrintUrl(selectedTemplateId));
    } finally {
      setPrintLoading(false);
    }
  };

  const handlePrintPreview = () => {
    if (!ensurePrintReady() || !selectedTemplateId) return;
    void printPreview(buildPrintUrl(selectedTemplateId));
  };

  const handleChange = (key: string, checkedValues: any[]) => {
    setSelectedIds((prev) => ({ ...prev, [key]: checkedValues }));
  };

  const handleTemplateChange = async (prefabId: string) => {
    setSelectedTemplateId(prefabId);
    setLoading(true);
    const template = templateList.find((t) => t.prefab_id === prefabId);
    const targetCat = CATEGORIES.find((c) => c.label === template?.prefab_type);
    const targetKey = targetCat?.key;

    try {
      const res = await getPrefabDetailAPI({ prefab_id: prefabId });
      if (res.code === 0 && res.row_list) {
        const details: any[] = res.row_list;
        const newSelectedIds: Record<string, any[]> = { ...selectedIds };
        const newQuantities: Record<string, Record<string, number>> = {
          ...quantities,
        };

        if (targetKey === CATEGORIES[0].key) {
          CATEGORIES.forEach((cat) => {
            newSelectedIds[cat.key] = [];
            newQuantities[cat.key] = {};
          });
        } else if (targetKey) {
          newSelectedIds[targetKey] = [];
          newQuantities[targetKey] = {};
        }

        details.forEach((detail) => {
          let catKey = "";
          if (detail.item_type === "费用") catKey = "infusion";
          else if (detail.item_type === "输液器") catKey = "infusionSet";
          else if (detail.item_type === "注射器") catKey = "syringe";

          if (catKey) {
            if (!newSelectedIds[catKey]) newSelectedIds[catKey] = [];
            if (!newQuantities[catKey]) newQuantities[catKey] = {};
            newSelectedIds[catKey].push(detail.item_id);
            newQuantities[catKey][detail.item_id] = Number(
              detail.item_quantity,
            );
          }
        });

        setSelectedIds(newSelectedIds);
        setQuantities(newQuantities);
        message.success("模板加载成功");
      } else {
        message.error(res.message || "获取模板详情失败");
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePrefab = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    Modal.confirm({
      title: "确认删除该模板？",
      onOk: async () => {
        try {
          const res = await deletePrefabAPI({ prefab_id: id });
          if (res.code === 0) {
            message.success("删除成功");
            if (selectedTemplateId === id) setSelectedTemplateId(undefined);
            handleLoad();
          } else {
            message.error(res.message || "删除失败");
          }
        } catch {}
      },
    });
  };

  const handleQuantityChange = (
    key: string,
    itemId: string,
    val: number | null,
  ) => {
    setQuantities((prev) => ({
      ...prev,
      [key]: { ...prev[key], [itemId]: val || 1 },
    }));
  };

  const renderCategoryContent = (key: string) => {
    const items = itemsMap[key] || [];
    if (items.length === 0) {
      return (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据" />
      );
    }

    return (
      <Checkbox.Group
        value={selectedIds[key] || []}
        onChange={(vals) => handleChange(key, vals)}
        style={{ width: "100%" }}
      >
        <Row>
          {items.map((item) => (
            <Col span={24} key={item.item_id} className="mb-1.5">
              <div className="flex items-center justify-between">
                <Checkbox value={item.item_id}>
                  {`${item.item_name}${
                    item.item_spec ? ` (${item.item_spec})` : ""
                  }`}
                </Checkbox>
                {(selectedIds[key] || []).includes(item.item_id) && (
                  <Input
                    size="small"
                    value={quantities[key]?.[item.item_id] || 1}
                    onChange={(e) =>
                      handleQuantityChange(
                        key,
                        item.item_id,
                        Number(e.target.value),
                      )
                    }
                    style={{ width: 80 }}
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
              </div>
            </Col>
          ))}
        </Row>
      </Checkbox.Group>
    );
  };

  const handleSave = () => {
    const hasSelectedItems = CATEGORIES.some((cat) => {
      const ids = selectedIds[cat.key];
      return ids && ids.length > 0;
    });
    if (!hasSelectedItems) {
      message.warning("请先选择要保存的项目");
      return;
    }
    setSaveName("");
    setSaveIncludeOrg(false);
    setSaveIncludeDept(false);
    setIsEditMode(false);
    setEditingPrefabId(null);
    setSaveModalVisible(true);
  };

  const handleEditPrefab = (e: React.MouseEvent, template: any) => {
    e.stopPropagation();
    setSaveName(template.prefab_name);
    setSaveIncludeOrg(template.prefab_tag?.includes("[机构共享]") || false);
    setSaveIncludeDept(template.prefab_tag?.includes("[科室共享]") || false);
    setIsEditMode(true);
    setEditingPrefabId(template.prefab_id);
    setSaveModalVisible(true);
  };

  const handleSaveTemplateOk = async () => {
    if (!saveName.trim()) {
      message.warning("请输入模板名称");
      return;
    }

    try {
      let prefab_tag = "";
      if (saveIncludeOrg) prefab_tag += "[机构共享]";
      if (saveIncludeDept) prefab_tag += "[科室共享]";

      if (isEditMode && editingPrefabId) {
        const res = await savePrefabPropertyAPI({
          prefab_id: editingPrefabId,
          prefab_property: { prefab_name: saveName, prefab_tag },
        });
        if (res.code === 0) {
          message.success("修改成功");
          handleLoad();
        } else {
          message.error(res.message || "修改失败");
        }
      } else {
        const res = await newPrefabAPI({
          prefab_name: saveName,
          prefab_type: CATEGORIES[0].label,
          prefab_tag,
        });

        if (res.code === 0) {
          const prefabId = res.prefab_id;
          const row_list: any[] = [];
          CATEGORIES.forEach((cat) => {
            const ids = selectedIds[cat.key] || [];
            const items = itemsMap[cat.key] || [];
            ids.forEach((id) => {
              const item = items.find((i) => i.item_id === id);
              if (item) {
                row_list.push({
                  item_id: item.item_id,
                  item_name: item.item_name,
                  item_quantity: String(quantities[cat.key]?.[id] || 1),
                  item_type: cat.saveType,
                });
              }
            });
          });

          if (row_list.length > 0) {
            const saveDetailRes = await savePrefabDetailAPI({
              prefab_id: prefabId,
              row_list,
            });
            if (saveDetailRes.code === 0) {
              message.success("模板保存成功");
              handleLoad();
            } else {
              message.error(saveDetailRes.message || "保存模板详情失败");
            }
          } else {
            message.success("模板保存成功 (无明细)");
            handleLoad();
          }
        } else {
          message.error(res.message || "保存失败");
        }
      }
    } catch {}

    setSaveModalVisible(false);
  };

  const toolbar = (
    <Space wrap>
      <Button type="primary" onClick={handleSave}>
        存为模板
      </Button>
      <Button onClick={handleLoad}>加载模板</Button>
      <Checkbox
        checked={includeOrg}
        onChange={(e) => setIncludeOrg(e.target.checked)}
      >
        机构共享
      </Checkbox>
      <Checkbox
        checked={includeDept}
        onChange={(e) => setIncludeDept(e.target.checked)}
      >
        科室共享
      </Checkbox>
      {templateList.length > 0 && (
        <Select
          placeholder="请选择模板"
          value={selectedTemplateId}
          onChange={(val) => handleTemplateChange(val)}
          options={templateList.map((t) => ({
            label: (
              <div className="flex items-center justify-between gap-2">
                <span>{t.prefab_name}</span>
                <Space>
                  <EditOutlined
                    className="cursor-pointer text-blue-500"
                    onClick={(e) => handleEditPrefab(e, t)}
                    style={{ fontSize: 12 }}
                  />
                  <DeleteOutlined
                    className="cursor-pointer text-red-500"
                    onClick={(e) => handleDeletePrefab(e, t.prefab_id)}
                    style={{ fontSize: 12 }}
                  />
                </Space>
              </div>
            ),
            value: t.prefab_id,
          }))}
          style={{ width: 260 }}
        />
      )}
      {showPrintQr && (
        <Dropdown
          trigger={["click"]}
          disabled={printLoading}
          menu={{
            items: [
              { key: "print", label: "打印" },
              { key: "preview", label: "打印预览" },
            ],
            onClick: ({ key }) => {
              if (key === "print") void handlePrint();
              else handlePrintPreview();
            },
          }}
        >
          <Button
            type="primary"
            title="选中模板后打印二维码"
            loading={printLoading}
          >
            打印二维码
          </Button>
        </Dropdown>
      )}
    </Space>
  );

  const content = (
    <Spin spinning={loading}>
      <Row gutter={24}>
        {CATEGORIES.map((cat) => (
          <Col span={8} key={cat.key}>
            <div className="mb-2 border-b border-(--app-theme-border) pb-2 text-center">
              {cat.label}
            </div>
            <div className="max-h-[500px] overflow-y-auto px-2">
              {renderCategoryContent(cat.key)}
            </div>
          </Col>
        ))}
      </Row>
    </Spin>
  );

  return (
    <OrderAttatchContext.Provider value={{ toolbar, content }}>
      <Modal
        title={
          isEditMode
            ? `编辑模板 - ${CATEGORIES[0]?.label}`
            : `保存模板 - ${CATEGORIES[0]?.label}`
        }
        open={saveModalVisible}
        onOk={handleSaveTemplateOk}
        onCancel={() => setSaveModalVisible(false)}
        destroyOnHidden
      >
        <div className="mb-2">请输入模板名称:</div>
        <Input
          value={saveName}
          onChange={(e) => setSaveName(e.target.value)}
          placeholder="模板名称"
        />
        <div className="mt-2">
          <Checkbox
            checked={saveIncludeOrg}
            onChange={(e) => setSaveIncludeOrg(e.target.checked)}
          >
            机构共享
          </Checkbox>
          <Checkbox
            checked={saveIncludeDept}
            onChange={(e) => setSaveIncludeDept(e.target.checked)}
          >
            科室共享
          </Checkbox>
        </div>
      </Modal>
      {children ?? (
        <>
          {content}
          <div className="mt-4">{toolbar}</div>
        </>
      )}
    </OrderAttatchContext.Provider>
  );
}

const OrderAttatchExport = Object.assign(OrderAttatch, {
  Toolbar: OrderAttatchToolbar,
  Content: OrderAttatchContent,
});

export default OrderAttatchExport;
