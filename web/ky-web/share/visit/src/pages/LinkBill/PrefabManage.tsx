import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Checkbox,
  DatePicker,
  Empty,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Spin,
  Table,
  Tree,
  Typography,
  message,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  deleteCatalogAPI,
  deletePrefabAPI,
  getCatalogListAPI,
  getCatalogPropertyAPI,
  getPrefabDetailAPI,
  getPrefabListAPI,
  newCatalogAPI,
  newPrefabAPI,
  retrieveChargeListAPI,
  retrieveDrugListAPI,
  retrieveMaterialListAPI,
  retrieveAnesBillFreq,
  retrieveUsageList,
  saveCatalogPropertyAPI,
  savePrefabDetailAPI,
  savePrefabPropertyAPI,
} from "@/api/linkBill";
import { itemTypeOptions, getCurrentDateTime } from "./utils";
import RemoteSelect from "./RemoteSelect";

export interface PrefabManageProps {
  isShowPrefab: boolean;
  choosePrefabBill: any[];
  setChoosePrefabBill: (v: any[]) => void;
  prefabBillTime: string;
  setPrefabBillTime: (v: string) => void;
  orgId?: number;
  /** 当前计费列表（用于“存为模板”） */
  itemRow?: any[];
  /** 当前登录人信息（新增模板用） */
  sessionInfo?: any;
  link_name?: string;
}

// const CATALOG_TYPE = "PREFAB.BILL.ANES";

/** 模板标识选项 */
const PREFAB_TAG_LIST = [
  { id: "001", name: "科室共享" },
  { id: "002", name: "机构共享" },
];

/** 构建类别树 */
function buildTree(list: any[], parentId = 0): any[] {
  return list
    .filter((n) => Number(n.parent_id) === parentId)
    .map((n) => {
      const children = buildTree(list, Number(n.catalog_id));
      return {
        key: n.catalog_id,
        catalog_id: n.catalog_id,
        catalog_name: n.catalog_name,
        children: children.length ? children : undefined,
      };
    });
}

/** 收集所有节点 key（用于默认展开） */
function collectKeys(nodes: any[]): (string | number)[] {
  return nodes.flatMap((n) => [n.catalog_id, ...collectKeys(n.children || [])]);
}

/** 新增 / 替换项目的公共表单 */
function ItemForm({
  form,
  setForm,
}: {
  form: any;
  setForm: (v: any) => void;
}) {
  // 项目检索：按类型选择不同接口
  const fetchItemList = async (search = "") => {
    const params = { retrieve_input: search || "*", retrieve_limit: 10 };
    let res: any;
    if (form.item_type === "CHARGE") res = await retrieveChargeListAPI(params);
    else if (form.item_type === "MATERIAL") res = await retrieveMaterialListAPI(params);
    else res = await retrieveDrugListAPI(params);
    return res?.row_list || [];
  };

  return (
    <div>
      <Space wrap style={{ marginBottom: 12 }}>
        <Select
          style={{ width: 120 }}
          value={form.item_type || undefined}
          placeholder="类型"
          options={itemTypeOptions.map((o) => ({ value: o.value, label: o.name }))}
          onChange={(v) =>
            setForm({
              ...form,
              item_type: v,
              item_id: "",
              item_name: "",
              item_note: "",
              item_spec: "",
              usage_id: "",
              usage_name: "",
              usage_note: "",
            })
          }
        />

        <RemoteSelect
          width={220}
          placeholder="项目"
          value={form.item_id || undefined}
          label={form.item_name || undefined}
          fetchOptions={fetchItemList}
          optionValue={(i) => i.item_id}
          optionLabel={(i) => i.item_name}
          onChange={(item) =>
            setForm({
              ...form,
              item_id: item.item_id,
              item_name: item.item_name,
              item_note: item.item_note,
              item_spec: item.item_spec,
              usage_unit: item.item_unit || item.quantity_unit || "",
              price_latest: item.price_latest,
              item_code: item.item_code,
            })
          }
        />

        <span>数量：</span>
        <Input
          style={{ width: 80 }}
          value={form.item_quantity}
          onChange={(e) => setForm({ ...form, item_quantity: e.target.value })}
        />
      </Space>

      {form.item_type === "DRUG" && (
        <Space wrap>
          <span>用法：</span>
          <RemoteSelect
            width={150}
            placeholder="用法"
            value={form.usage_id || undefined}
            label={form.usage_name || undefined}
            fetchOptions={(search) => retrieveUsageList(search)}
            optionValue={(i) => i.usage_id}
            optionLabel={(i) => i.usage_name}
            onChange={(item) =>
              setForm({ ...form, usage_id: item.usage_id, usage_name: item.usage_name })
            }
          />
          
        </Space>
      )}
    </div>
  );
}

/**
 * 模板管理组件（完整迁移版）。
 * 已迁移：类别树（新增/编辑/删除）、模板列表（新增/重命名/删除）、
 *         模板内容（选择/新增/替换/删除/修改数量/保存/计费时间）。
 */
export default function PrefabManage({
  isShowPrefab,
  choosePrefabBill,
  setChoosePrefabBill,
  prefabBillTime,
  setPrefabBillTime,
  orgId,
  itemRow = [],
  sessionInfo,
  link_name,
}: PrefabManageProps) {
  console.log(link_name)
  let CATALOG_TYPE = `PREFAB.BILL.${link_name}`
  // 类别
  const [catalogList, setCatalogList] = useState<any[]>([]);
  const [catalogId, setCatalogId] = useState<string | number>("");
  const [expandedKeys, setExpandedKeys] = useState<(string | number)[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);

  // 模板
  const [prefabList, setPrefabList] = useState<any[]>([]);
  const [prefabId, setPrefabId] = useState<string | number>("");
  const [prefabLoading, setPrefabLoading] = useState(false);
  const [includeDept, setIncludeDept] = useState(true);
  const [includeOrg, setIncludeOrg] = useState(false);

  // 模板内容
  const [contentList, setContentList] = useState<any[]>([]);

  // 类别弹窗
  const [addCatalogOpen, setAddCatalogOpen] = useState(false);
  const [editCatalogOpen, setEditCatalogOpen] = useState(false);
  const [newCatalogRow, setNewCatalogRow] = useState<any>({
    parent_id: 0,
    catalog_no: "",
    catalog_name: "",
    catalog_note: "",
  });
  const [catalogRowProperty, setCatalogRowProperty] = useState<any>({});

  // 模板弹窗（新增 / 重命名）
  const [addPrefabOpen, setAddPrefabOpen] = useState(false);
  const [renamePrefabOpen, setRenamePrefabOpen] = useState(false);
  const [renamePrefabId, setRenamePrefabId] = useState<string | number>("");
  const [renamePrefabName, setRenamePrefabName] = useState("");
  const [newPrefabInfo, setNewPrefabInfo] = useState<any>({
    prefab_name: "",
    prefab_tag: "[科室共享]",
    prefab_note: "",
  });

  // 内容弹窗（新增 / 替换）
  const [addDetailOpen, setAddDetailOpen] = useState(false);
  const [replaceDetailOpen, setReplaceDetailOpen] = useState(false);
  const [newDetail, setNewDetail] = useState<any>({});
  const [chooseDetail, setChooseDetail] = useState<any>({});

  const initNewDetail = {
    item_type: "",
    item_id: "",
    item_name: "",
    item_spec: "",
    item_unit: "",
    item_quantity: "",
    item_note: "",
    usage_id: "",
    usage_name: "",
    usage_note: "",
  };

  // ---------- 类别 ----------
  async function loadCatalog() {
    setCatalogLoading(true);
    try {
      const res = await getCatalogListAPI({
        parent_id: 0,
        catalog_type: CATALOG_TYPE,
        include_invalid: false,
        include_descendant: true,
        include_self: false,
      });
      const catalogs = res?.catalog_list || [];
      setCatalogList(catalogs);
      setExpandedKeys(collectKeys(buildTree(catalogs)));
    } catch {
      setCatalogList([]);
    } finally {
      setCatalogLoading(false);
    }
  }

  function openAddCatalog(parentId: number) {
    setNewCatalogRow({
      parent_id: parentId,
      catalog_no: "",
      catalog_name: "",
      catalog_note: "",
    });
    setAddCatalogOpen(true);
  }

  async function doAddCatalog() {
    if (!newCatalogRow.catalog_name?.trim()) {
      message.warning("名称不能为空");
      return;
    }
    try {
      await newCatalogAPI({
        parent_id: Number(newCatalogRow.parent_id),
        org_id: Number(orgId),
        dept_id: Number(newCatalogRow.dept_id || 0),
        group_id: Number(newCatalogRow.group_id || 0),
        catalog_type: CATALOG_TYPE,
        catalog_no: newCatalogRow.catalog_no,
        catalog_name: newCatalogRow.catalog_name,
        catalog_tag: "",
        catalog_note: newCatalogRow.catalog_note,
        icon_system: "",
        icon_name: "",
      });
      message.success("添加成功");
      setAddCatalogOpen(false);
      loadCatalog();
    } catch {
      // 错误已由请求拦截器提示
    }
  }

  async function openEditCatalog(catalogIdNum: number) {
    try {
      const res = await getCatalogPropertyAPI({ catalog_id: catalogIdNum });
      setCatalogRowProperty(res?.catalog_property || {});
      setEditCatalogOpen(true);
    } catch {
      setCatalogRowProperty({});
      setEditCatalogOpen(true);
    }
  }

  async function doSaveCatalog() {
    const p = catalogRowProperty;
    try {
      await saveCatalogPropertyAPI({
        catalog_id: Number(p.catalog_id),
        catalog_property: {
          org_id: Number(p.org_id),
          dept_id: Number(p.dept_id || 0),
          group_id: Number(p.group_id || 0),
          unit_id: Number(p.unit_id || 0),
          user_id: Number(p.user_id || 0),
          parent_id: Number(p.parent_id || 0),
          catalog_type: p.catalog_type,
          catalog_no: p.catalog_no,
          catalog_code: p.catalog_code,
          catalog_level: Number(p.catalog_level || 0),
          catalog_name: p.catalog_name,
          catalog_tag: p.catalog_tag,
          catalog_note: p.catalog_note,
          icon_system: p.icon_system,
          icon_name: p.icon_name,
          sort_no: p.sort_no,
        },
      });
      message.success("修改成功");
      setEditCatalogOpen(false);
      loadCatalog();
    } catch {
      // 错误已由请求拦截器提示
    }
  }

  async function doDeleteCatalog(catalogIdNum: number) {
    try {
      await deleteCatalogAPI({ catalog_id: catalogIdNum, delete_note: "" });
      message.success("删除成功");
      if (catalogId == catalogIdNum) setCatalogId("");
      loadCatalog();
    } catch {
      // 错误已由请求拦截器提示
    }
  }

  // ---------- 模板列表 ----------
  async function loadPrefabList() {
    if (!catalogId || !orgId) {
      setPrefabList([]);
      return;
    }
    setPrefabLoading(true);
    try {
      const res = await getPrefabListAPI({
        org_id: Number(orgId),
        catalog_type: CATALOG_TYPE,
        catalog_id: Number(catalogId),
        include_dept: includeDept,
        include_org: includeOrg,
      });
      setPrefabList(res?.row_list || []);
    } catch {
      setPrefabList([]);
    } finally {
      setPrefabLoading(false);
    }
  }

  function openAddPrefab() {
    if (itemRow.length <= 0) {
      message.warning("请先添加物品");
      return;
    }
    if (!catalogId) {
      message.warning("请先选择类别！");
      return;
    }
    setNewPrefabInfo({ prefab_name: "", prefab_tag: "[科室共享]", prefab_note: "" });
    setAddPrefabOpen(true);
  }

  async function doAddPrefab() {
    if (!newPrefabInfo.prefab_name?.trim()) {
      message.warning("模板名称不能为空");
      return;
    }
    try {
      await newPrefabAPI({
        catalog_id: Number(catalogId),
        catalog_type: CATALOG_TYPE,
        org_id: Number(orgId),
        dept_id: Number(sessionInfo?.dept_id),
        user_id: Number(sessionInfo?.user_id),
        user_name: sessionInfo?.user_name,
        prefab_name: newPrefabInfo.prefab_name,
        prefab_tag: newPrefabInfo.prefab_tag,
        prefab_note: newPrefabInfo.prefab_note,
        row_list: itemRow
          .filter((i: any) => Number(i.item_quantity) > 0)
          .map((item: any) => ({
            item_type: item.item_type,
            item_id: Number(item.item_id),
            item_name: item.item_name,
            item_spec: item.item_spec || null,
            item_unit: item.item_unit,
            item_quantity: String(item.item_quantity),
            store_id: Number(item.store_id),
            store_name: item.store_name,
            usage_id: Number(item.usage_id),
            usage_name: item.usage_name,
            usage_note: item.usage_note,
          })),
      });
      message.success("存为模板成功");
      setAddPrefabOpen(false);
      loadPrefabList();
    } catch {
      // 错误已由请求拦截器提示
    }
  }

  async function doRenamePrefab() {
    try {
      await savePrefabPropertyAPI({
        prefab_id: Number(renamePrefabId),
        prefab_property: { prefab_name: renamePrefabName },
      });
      message.success("保存成功");
      setRenamePrefabOpen(false);
      loadPrefabList();
    } catch {
      // 错误已由请求拦截器提示
    }
  }

  async function doDeletePrefab(prefabIdNum: number) {
    try {
      await deletePrefabAPI({ prefab_id: prefabIdNum, delete_note: "" });
      message.success("删除成功");
      if (prefabId == prefabIdNum) setPrefabId("");
      loadPrefabList();
    } catch {
      // 错误已由请求拦截器提示
    }
  }

  // ---------- 模板内容 ----------
  async function loadPrefabDetail(id: string | number) {
    setPrefabId(id);
    setPrefabBillTime(getCurrentDateTime() + ":00");
    try {
      const res = await getPrefabDetailAPI({ prefab_id: Number(id) });
      const list = res?.row_list || [];
      setContentList(list);
      setChoosePrefabBill(list);
    } catch {
      setContentList([]);
      setChoosePrefabBill([]);
    }
  }

  async function doSavePrefabDetail() {
    try {
      await savePrefabDetailAPI({
        prefab_id: Number(prefabId),
        delete_row: 0,
        row_list: contentList.map((item: any) => ({
          item_type: item.item_type,
          item_id: Number(item.item_id),
          item_name: item.item_name,
          item_spec: item.item_spec,
          item_unit: item.item_unit,
          item_quantity: String(item.item_quantity),
          item_note: item.item_note,
          usage_id: Number(item.usage_id),
          usage_name: item.usage_name,
          usage_note: item.usage_note,
        })),
      });
      message.success("保存成功");
      loadPrefabDetail(prefabId);
    } catch {
      // 错误已由请求拦截器提示
    }
  }

  function doAddDetail() {
    setContentList([...contentList, { ...newDetail, row_id: `temp_${Date.now()}` }]);
    setNewDetail(initNewDetail);
    setAddDetailOpen(false);
  }

  async function doReplaceDetail() {
    const idx = contentList.findIndex((item: any) => item.row_id === chooseDetail.row_id);
    if (idx < 0) {
      setReplaceDetailOpen(false);
      return;
    }
    const copy = [...contentList];
    copy[idx] = chooseDetail;

    try {
      await savePrefabDetailAPI({
        prefab_id: Number(prefabId),
        row_list: copy.map((item: any) => ({
          item_type: item.item_type,
          item_id: Number(item.item_id),
          item_name: item.item_name,
          item_spec: item.item_spec,
          item_unit: item.item_unit,
          item_quantity: String(item.item_quantity),
          item_note: item.item_note,
          usage_id: Number(item.usage_id),
          usage_name: item.usage_name,
          usage_note: item.usage_note,
        })),
      });
      message.success("修改成功");
      setReplaceDetailOpen(false);
      loadPrefabDetail(prefabId);
    } catch {
      // 错误已由请求拦截器提示
    }
  }

  function updateDetailQuantity(index: number, value: string) {
    const copy = [...contentList];
    copy[index].item_quantity = value;
    setContentList(copy);

    const chosenIdx = choosePrefabBill.findIndex(
      (item: any) => item.row_id === copy[index].row_id,
    );
    if (chosenIdx !== -1) {
      const updated = [...choosePrefabBill];
      updated[chosenIdx].item_quantity = value;
      setChoosePrefabBill(updated);
    }
  }

  function removeDetail(index: number) {
    const copy = [...contentList];
    copy.splice(index, 1);
    setContentList(copy);
  }

  // ---------- 初始化 ----------
  useEffect(() => {
    if (isShowPrefab) loadCatalog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isShowPrefab]);

  useEffect(() => {
    if (catalogId) loadPrefabList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalogId, includeDept, includeOrg]);

  const treeData = useMemo(() => buildTree(catalogList), [catalogList]);

  const contentColumns = [
    { title: "项目名称", dataIndex: "item_name" },
    {
      title: "替换项目",
      width: 100,
      render: (_: any, item: any) => (
        <Button
          size="small"
          onClick={() => {
            setChooseDetail({ ...item, item_quantity: parseFloat(item.item_quantity) });
            setReplaceDetailOpen(true);
          }}
        >
          选择
        </Button>
      ),
    },
    {
      title: "用法",
      dataIndex: "usage_name",
      width: 100,
      render: (v: any) => v || "-",
    },
    {
      title: "规格",
      dataIndex: "item_spec",
      width: 100,
      render: (v: any) => v || "-",
    },
    {
      title: "数量",
      width: 120,
      render: (_: any, item: any, index: number) => (
        <Space.Compact>
          <Input
            size="small"
            style={{ width: 60 }}
            value={item.item_quantity ? parseFloat(item.item_quantity) : ""}
            onChange={(e) => updateDetailQuantity(index, e.target.value)}
          />
          <span style={{ padding: "0 8px" }}>{item.usage_unit || item.item_unit || "-"}</span>
        </Space.Compact>
      ),
    },
    {
      title: "",
      width: 50,
      render: (_: any, _item: any, index: number) => (
        <Popconfirm title="是否确认删除该项？" onConfirm={() => removeDetail(index)}>
          <Button type="text" size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", gap: 12, minHeight: 360 }}>
      {/* 类别 */}
      <div style={{ width: 250, borderRight: "1px solid #eee", paddingRight: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography.Text strong style={{ fontSize: 13 }}>类别</Typography.Text>
          <Button
            type="text"
            size="small"
            icon={<PlusOutlined style={{ fontSize: 12 }} />}
            style={{ color: "#52c41a", fontSize: 12, padding: "0 4px" }}
            onClick={() => openAddCatalog(0)}
          >
            新增
          </Button>
        </div>
        <div style={{ marginTop: 8, maxHeight: 340, overflow: "auto" }}>
          {catalogLoading ? (
            <Spin />
          ) : treeData.length > 0 ? (
            <Tree
              treeData={treeData}
              selectedKeys={catalogId ? [catalogId] : []}
              expandedKeys={expandedKeys}
              onExpand={(keys) => setExpandedKeys(keys as (string | number)[])}
              onSelect={(keys) => {
                if (keys.length > 0) setCatalogId(keys[0] as number);
              }}
              titleRender={(node: any) => (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
                  <span>{node.catalog_name}</span>
                  <Button
                    type="text"
                    size="small"
                    icon={<PlusOutlined style={{ fontSize: 12 }} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      openAddCatalog(Number(node.catalog_id));
                    }}
                  />
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined style={{ fontSize: 12 }} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditCatalog(Number(node.catalog_id));
                    }}
                  />
                  <Popconfirm
                    title="确定删除？"
                    onConfirm={() => doDeleteCatalog(Number(node.catalog_id))}
                  >
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined style={{ fontSize: 12 }} />}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Popconfirm>
                </span>
              )}
            />
          ) : (
            <Empty description="请先添加类别" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </div>
      </div>

      {/* 模板列表 */}
      <div style={{ width: 200, borderRight: "1px solid #eee", paddingRight: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography.Text strong style={{ fontSize: 13 }}>模板列表</Typography.Text>
          <Button
            type="text"
            size="small"
            icon={<PlusOutlined style={{ fontSize: 12 }} />}
            style={{ color: "#52c41a", fontSize: 12, padding: "0 4px" }}
            onClick={openAddPrefab}
          >
            新增
          </Button>
        </div>
        <div style={{ marginTop: 8, maxHeight: 340, overflow: "auto" }}>
          {prefabLoading ? (
            <Spin />
          ) : prefabList.length > 0 ? (
            prefabList.map((item: any) => (
              <div
                key={item.prefab_id}
                onClick={() => loadPrefabDetail(item.prefab_id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "4px 8px",
                  cursor: "pointer",
                  background: prefabId === item.prefab_id ? "#e6f4ff" : undefined,
                }}
              >
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>
                  {item.prefab_name}
                </span>
                <span>
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined style={{ fontSize: 12 }} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      setRenamePrefabId(item.prefab_id);
                      setRenamePrefabName(item.prefab_name);
                      setRenamePrefabOpen(true);
                    }}
                  />
                  <Popconfirm
                    title="确定删除？"
                    onConfirm={() => doDeletePrefab(Number(item.prefab_id))}
                  >
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined style={{ fontSize: 12 }} />}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Popconfirm>
                </span>
              </div>
            ))
          ) : (
            <Empty description="暂无模板" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </div>
        <div style={{ marginTop: 8 }}>
          <Checkbox checked={includeDept} onChange={(e) => setIncludeDept(e.target.checked)}>
            科室共享
          </Checkbox>
          <Checkbox checked={includeOrg} onChange={(e) => setIncludeOrg(e.target.checked)}>
            机构共享
          </Checkbox>
        </div>
      </div>

      {/* 模板内容 */}
      <div style={{ flex: 1 }}>
        {prefabId ? (
          <>
            <div style={{ marginBottom: 8 }}>
              <Button
                type="text"
                size="small"
                icon={<PlusOutlined style={{ fontSize: 12 }} />}
                style={{ color: "#52c41a", fontSize: 12, padding: "0 4px" }}
                onClick={() => {
                  setNewDetail(initNewDetail);
                  setAddDetailOpen(true);
                }}
              >
                新增内容
              </Button>
            </div>
            <Table
              rowKey="row_id"
              size="small"
              dataSource={contentList}
              columns={contentColumns}
              pagination={false}
              rowSelection={{
                selectedRowKeys: choosePrefabBill.map((i) => i.row_id),
                onChange: (_keys, rows) => setChoosePrefabBill(rows),
              }}
            />
            <div
              style={{
                marginTop: 12,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {contentList.length > 0 && (
                <>
                  <span>计费时间：</span>
                  <DatePicker
                    showTime={{ format: "HH:mm" }}
                    format="YYYY-MM-DD HH:mm"
                    value={prefabBillTime ? dayjs(prefabBillTime) : null}
                    onChange={(val) =>
                      setPrefabBillTime(
                        val ? val.format("YYYY-MM-DD HH:mm") + ":00" : "",
                      )
                    }
                  />
                </>
              )}
              <Button
                type="primary"
                style={{ marginLeft: "auto" }}
                onClick={doSavePrefabDetail}
              >
                保存
              </Button>
            </div>
          </>
        ) : (
          <Empty description="请选择模板" />
        )}
      </div>

      {/* 新增类别 */}
      <Modal
        title="新增类别"
        open={addCatalogOpen}
        width={560}
        onCancel={() => setAddCatalogOpen(false)}
        onOk={doAddCatalog}
        okText="添加"
      >
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <span>编号：</span>
            <Input
              value={newCatalogRow.catalog_no}
              onChange={(e) => setNewCatalogRow({ ...newCatalogRow, catalog_no: e.target.value })}
            />
          </div>
          <div>
            <span>名称：</span>
            <Input
              value={newCatalogRow.catalog_name}
              onChange={(e) =>
                setNewCatalogRow({ ...newCatalogRow, catalog_name: e.target.value })
              }
            />
          </div>
          <div>
            <span>备注：</span>
            <Input
              value={newCatalogRow.catalog_note}
              onChange={(e) =>
                setNewCatalogRow({ ...newCatalogRow, catalog_note: e.target.value })
              }
            />
          </div>
        </div>
      </Modal>

      {/* 修改类别 */}
      <Modal
        title="修改类别"
        open={editCatalogOpen}
        width={560}
        onCancel={() => setEditCatalogOpen(false)}
        onOk={doSaveCatalog}
        okText="修改"
      >
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <span>编号：</span>
            <Input
              value={catalogRowProperty.catalog_no}
              onChange={(e) =>
                setCatalogRowProperty({ ...catalogRowProperty, catalog_no: e.target.value })
              }
            />
          </div>
          <div>
            <span>名称：</span>
            <Input
              value={catalogRowProperty.catalog_name}
              onChange={(e) =>
                setCatalogRowProperty({ ...catalogRowProperty, catalog_name: e.target.value })
              }
            />
          </div>
          <div>
            <span>备注：</span>
            <Input
              value={catalogRowProperty.catalog_note}
              onChange={(e) =>
                setCatalogRowProperty({ ...catalogRowProperty, catalog_note: e.target.value })
              }
            />
          </div>
          <div>
            <span>排序号：</span>
            <Input
              value={catalogRowProperty.sort_no}
              onChange={(e) =>
                setCatalogRowProperty({ ...catalogRowProperty, sort_no: e.target.value })
              }
            />
          </div>
          <div>
            <span>修改层级：</span>
            <Select
              style={{ width: "100%" }}
              value={catalogRowProperty.parent_id}
              options={treeData.map((n) => ({ value: n.catalog_id, label: n.catalog_name }))}
              onChange={(v) => setCatalogRowProperty({ ...catalogRowProperty, parent_id: v })}
            />
          </div>
        </div>
      </Modal>

      {/* 新增模板 */}
      <Modal
        title="添加模板"
        open={addPrefabOpen}
        width={560}
        onCancel={() => setAddPrefabOpen(false)}
        onOk={doAddPrefab}
        okText="添加"
      >
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <span>模板名称：</span>
            <Input
              value={newPrefabInfo.prefab_name}
              onChange={(e) =>
                setNewPrefabInfo({ ...newPrefabInfo, prefab_name: e.target.value })
              }
            />
          </div>
          <div>
            <span>模板标识：</span>
            <Space>
              {PREFAB_TAG_LIST.map((tag) => (
                <Checkbox
                  key={tag.id}
                  checked={newPrefabInfo.prefab_tag?.includes(tag.name)}
                  onChange={(e) => {
                    let t = newPrefabInfo.prefab_tag || "";
                    if (e.target.checked) {
                      if (!t.includes(`[${tag.name}]`)) t += `[${tag.name}]`;
                    } else {
                      t = t.replace(`[${tag.name}]`, "");
                    }
                    setNewPrefabInfo({ ...newPrefabInfo, prefab_tag: t });
                  }}
                >
                  {tag.name}
                </Checkbox>
              ))}
            </Space>
          </div>
        </div>
      </Modal>

      {/* 重命名模板 */}
      <Modal
        title="重命名模板"
        open={renamePrefabOpen}
        width={420}
        onCancel={() => setRenamePrefabOpen(false)}
        onOk={doRenamePrefab}
        okText="保存"
      >
        <Input
          value={renamePrefabName}
          onChange={(e) => setRenamePrefabName(e.target.value)}
        />
      </Modal>

      {/* 新增内容 */}
      <Modal
        title="新增项目"
        open={addDetailOpen}
        width={680}
        onCancel={() => setAddDetailOpen(false)}
        onOk={doAddDetail}
        okText="添加"
      >
        <ItemForm form={newDetail} setForm={setNewDetail} />
      </Modal>

      {/* 替换项目 */}
      <Modal
        title="替换项目"
        open={replaceDetailOpen}
        width={680}
        onCancel={() => setReplaceDetailOpen(false)}
        onOk={doReplaceDetail}
        okText="替换"
      >
        <ItemForm form={chooseDetail} setForm={setChooseDetail} />
      </Modal>
    </div>
  );
}
