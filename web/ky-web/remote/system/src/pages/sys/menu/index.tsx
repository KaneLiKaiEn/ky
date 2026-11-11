import { useEffect, useMemo, useState, type Key } from "react";
import {
  App,
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Radio,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  TreeSelect,
} from "antd";
import type { TableColumnsType } from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  MENU_TYPE,
  addMenu,
  deleteMenu,
  getMenuInfo,
  getMenuList,
  updateMenu,
  type MenuCommand,
  type MenuDTO,
  type MenuDetailDTO,
  type MenuMeta,
} from "@/api/system/menu";
import {
  OptionTag,
  STATUS_OPTIONS,
  collectTreeKeys,
  formatTime,
  toTree,
  type TreeNode,
  type TreeOption,
} from "../shared";
import "../sys-page.scss";

const MENU_TYPE_OPTIONS = [
  { label: "页面", value: MENU_TYPE.PAGE },
  { label: "目录", value: MENU_TYPE.CATALOG },
  { label: "内嵌Iframe", value: MENU_TYPE.IFRAME },
  { label: "外链跳转", value: MENU_TYPE.EXTERNAL },
];

interface SearchValues {
  menuName?: string;
  status?: number;
}

interface FormValues {
  parentId: number;
  isButton: boolean;
  menuType?: number;
  menuName: string;
  permission?: string;
  path?: string;
  routerName?: string;
  status: number;
  meta: Pick<MenuMeta, "icon" | "rank" | "showLink" | "frameSrc">;
}

interface EditState {
  menu?: MenuDetailDTO;
  parentId: number;
}

const isUrl = (value: string) => /^https?:\/\//i.test(value);

/** 与原前端 transferToStandardRouterData 一致：把表单数据转换为后端路由约定 */
function toCommand(
  values: FormValues,
  original: MenuMeta | undefined,
  parentHasChildren: boolean,
): MenuCommand {
  const meta: MenuMeta = {
    ...original,
    ...values.meta,
    title: values.menuName,
  };
  let path = values.path?.trim();
  let routerName = values.routerName?.trim();

  if (!values.isButton) {
    if (
      (values.menuType === MENU_TYPE.PAGE ||
        values.menuType === MENU_TYPE.CATALOG ||
        values.menuType === MENU_TYPE.IFRAME) &&
      path &&
      !path.startsWith("/")
    ) {
      path = `/${path}`;
    }
    if (values.menuType === MENU_TYPE.IFRAME && meta.frameSrc) {
      const src = meta.frameSrc.trim();
      meta.isFrameSrcInternal = src.startsWith("/");
      meta.frameSrc = isUrl(src) || src.startsWith("/") ? src : `http://${src}`;
    }
    if (values.menuType === MENU_TYPE.EXTERNAL && routerName) {
      routerName = isUrl(routerName) ? routerName : `http://${routerName}`;
      path = "/external";
    }
    if (!parentHasChildren) meta.showParent = true;
  }

  return {
    parentId: values.parentId ?? 0,
    menuName: values.menuName,
    permission: values.permission,
    isButton: values.isButton,
    menuType: values.isButton ? undefined : values.menuType,
    status: values.status,
    path,
    routerName,
    meta,
  };
}

const filterTree = (
  nodes: TreeNode<MenuDTO>[],
  match: (menu: MenuDTO) => boolean,
): TreeNode<MenuDTO>[] =>
  nodes.flatMap((node) => {
    const children = node.children && filterTree(node.children, match);
    if (match(node) || children?.length)
      return [{ ...node, children: children?.length ? children : undefined }];
    return [];
  });

const toParentOptions = (
  nodes: TreeNode<MenuDTO>[],
  excludeId?: number,
): TreeOption[] =>
  nodes
    .filter((node) => !node.isButton && node.id !== excludeId)
    .map((node) => ({
      value: node.id,
      title: node.menuName,
      children: node.children && toParentOptions(node.children, excludeId),
    }));

export default function MenuPage() {
  const { message } = App.useApp();
  const [searchForm] = Form.useForm<SearchValues>();
  const [editForm] = Form.useForm<FormValues>();
  const [list, setList] = useState<MenuDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<SearchValues>({});
  const [expandedKeys, setExpandedKeys] = useState<Key[]>([]);
  const [editing, setEditing] = useState<EditState>();
  const [saving, setSaving] = useState(false);

  const isButton = Form.useWatch("isButton", editForm);
  const menuType = Form.useWatch("menuType", editForm);

  const load = async () => {
    setLoading(true);
    try {
      setList((await getMenuList()) ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const tree = useMemo(() => toTree(list, "id", "parentId", "rank"), [list]);

  const visibleTree = useMemo(() => {
    const keyword = filters.menuName?.trim();
    if (!keyword && filters.status == null) return tree;
    return filterTree(
      tree,
      (menu) =>
        (!keyword || menu.menuName.includes(keyword)) &&
        (filters.status == null || menu.status === filters.status),
    );
  }, [tree, filters]);

  useEffect(() => {
    setExpandedKeys(
      filters.menuName || filters.status != null
        ? collectTreeKeys(visibleTree, "id")
        : [],
    );
  }, [visibleTree, filters]);

  const parentOptions = useMemo<TreeOption[]>(
    () => [
      {
        value: 0,
        title: "主类目",
        children: toParentOptions(tree, editing?.menu?.id),
      },
    ],
    [tree, editing],
  );

  const openEdit = async (menu: MenuDTO) => {
    const detail = await getMenuInfo(menu.id);
    setEditing({ menu: detail ?? menu, parentId: menu.parentId });
  };

  const remove = async (menu: MenuDTO) => {
    await deleteMenu(menu.id);
    message.success("删除成功");
    void load();
  };

  const submit = async () => {
    const values = await editForm.validateFields();
    const parentHasChildren = list.some(
      (menu) =>
        menu.parentId === values.parentId && menu.id !== editing?.menu?.id,
    );
    const data = toCommand(values, editing?.menu?.meta, parentHasChildren);
    setSaving(true);
    try {
      if (editing?.menu) await updateMenu(editing.menu.id, data);
      else await addMenu(data);
      message.success(editing?.menu ? "修改成功" : "新增成功");
      setEditing(undefined);
      void load();
    } finally {
      setSaving(false);
    }
  };

  const columns: TableColumnsType<TreeNode<MenuDTO>> = [
    { title: "菜单名称", dataIndex: "menuName", width: 220 },
    { title: "路由地址", dataIndex: "path", width: 220, ellipsis: true },
    { title: "路由名称", dataIndex: "routerName", width: 160, ellipsis: true },
    { title: "图标", dataIndex: "icon", width: 140, ellipsis: true },
    {
      title: "状态",
      dataIndex: "status",
      width: 90,
      render: (value) => <OptionTag options={STATUS_OPTIONS} value={value} />,
    },
    {
      title: "类型",
      dataIndex: "isButton",
      width: 80,
      render: (value: boolean) =>
        value ? <Tag color="orange">按钮</Tag> : <Tag color="blue">菜单</Tag>,
    },
    { title: "子类型", dataIndex: "menuTypeStr", width: 100 },
    { title: "排序", dataIndex: "rank", width: 70 },
    {
      title: "创建时间",
      dataIndex: "createTime",
      width: 180,
      render: formatTime,
    },
    {
      title: "操作",
      key: "actions",
      fixed: "right",
      width: 220,
      render: (_, row) => (
        <Space size={0}>
          {!row.isButton && (
            <Button
              type="link"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => setEditing({ parentId: row.id })}
            >
              新增
            </Button>
          )}
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => void openEdit(row)}
          >
            修改
          </Button>
          <Popconfirm
            title={`确认删除菜单「${row.menuName}」吗？`}
            onConfirm={() => remove(row)}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const editingMenu = editing?.menu;
  const typeName = isButton ? "按钮" : "菜单";

  return (
    <div className="sys-page">
      <Form
        form={searchForm}
        layout="inline"
        className="sys-page__search"
        onFinish={setFilters}
      >
        <Form.Item name="menuName" label="菜单名称">
          <Input placeholder="请输入菜单名称" allowClear />
        </Form.Item>
        <Form.Item name="status" label="状态">
          <Select
            placeholder="请选择"
            allowClear
            options={STATUS_OPTIONS}
            style={{ width: 140 }}
          />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
              搜索
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                searchForm.resetFields();
                setFilters({});
                void load();
              }}
            >
              重置
            </Button>
          </Space>
        </Form.Item>
      </Form>

      <div className="sys-page__panel">
        <div className="sys-page__toolbar">
          <span className="sys-page__title">菜单列表</span>
          <Space wrap>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setEditing({ parentId: 0 })}
            >
              新增菜单
            </Button>
            <Button
              onClick={() =>
                setExpandedKeys((keys) =>
                  keys.length ? [] : collectTreeKeys(visibleTree, "id"),
                )
              }
            >
              {expandedKeys.length ? "折叠全部" : "展开全部"}
            </Button>
          </Space>
        </div>
        <Table<TreeNode<MenuDTO>>
          rowKey="id"
          size="middle"
          loading={loading}
          columns={columns}
          dataSource={visibleTree}
          pagination={false}
          scroll={{ x: 1400 }}
          expandable={{
            expandedRowKeys: expandedKeys,
            onExpandedRowsChange: (keys) => setExpandedKeys([...keys]),
          }}
        />
      </div>

      <Modal
        title={editingMenu ? "修改菜单" : "新增菜单"}
        open={editing !== undefined}
        onCancel={() => setEditing(undefined)}
        onOk={() => void submit()}
        confirmLoading={saving}
        destroyOnHidden
        maskClosable={false}
        width={720}
      >
        <Form<FormValues>
          form={editForm}
          layout="vertical"
          preserve={false}
          className="sys-form__grid"
          initialValues={{
            parentId: editing?.parentId ?? 0,
            isButton: editingMenu?.isButton ?? false,
            menuType: editingMenu?.menuType ?? MENU_TYPE.PAGE,
            menuName: editingMenu?.menuName,
            permission: editingMenu?.permission,
            path: editingMenu?.path,
            routerName: editingMenu?.routerName,
            status: editingMenu?.status ?? 1,
            meta: {
              icon: editingMenu?.meta?.icon,
              rank: editingMenu?.meta?.rank ?? 0,
              showLink: editingMenu?.meta?.showLink ?? true,
              frameSrc: editingMenu?.meta?.frameSrc,
            },
          }}
        >
          <Form.Item name="parentId" label="父菜单" className="sys-form__wide">
            <TreeSelect
              treeData={parentOptions}
              treeDefaultExpandAll
              showSearch={{ treeNodeFilterProp: "title" }}
              placeholder="请选择父菜单"
            />
          </Form.Item>
          <Form.Item name="isButton" label="类型">
            <Radio.Group
              disabled={!!editingMenu}
              options={[
                { label: "菜单", value: false },
                { label: "按钮", value: true },
              ]}
            />
          </Form.Item>
          {!isButton && (
            <Form.Item name="menuType" label="菜单类型">
              <Radio.Group
                disabled={!!editingMenu}
                options={MENU_TYPE_OPTIONS}
              />
            </Form.Item>
          )}
          <Form.Item
            name="menuName"
            label={`${typeName}名称`}
            rules={[
              {
                required: true,
                whitespace: true,
                message: `请输入${typeName}名称`,
              },
              { max: 50 },
            ]}
          >
            <Input placeholder={`请输入${typeName}名称`} />
          </Form.Item>
          <Form.Item name="permission" label="权限标识" rules={[{ max: 100 }]}>
            <Input placeholder="如 system:user:list" />
          </Form.Item>
          {!isButton && (
            <>
              {(menuType === MENU_TYPE.PAGE ||
                menuType === MENU_TYPE.CATALOG ||
                menuType === MENU_TYPE.IFRAME) && (
                <Form.Item
                  name="path"
                  label="路由地址"
                  rules={[
                    {
                      required: true,
                      whitespace: true,
                      message: "请输入路由地址",
                    },
                    { max: 200 },
                  ]}
                >
                  <Input placeholder="以 / 开头，如 /system/user/index" />
                </Form.Item>
              )}
              {menuType === MENU_TYPE.PAGE && (
                <Form.Item name="routerName" label="路由名称">
                  <Input placeholder="组件名，如 SystemUser" />
                </Form.Item>
              )}
              {menuType === MENU_TYPE.IFRAME && (
                <Form.Item
                  name={["meta", "frameSrc"]}
                  label="网站地址"
                  rules={[
                    {
                      required: true,
                      whitespace: true,
                      message: "请输入网站地址",
                    },
                  ]}
                >
                  <Input placeholder="外部网站地址或内部相对地址" />
                </Form.Item>
              )}
              {menuType === MENU_TYPE.EXTERNAL && (
                <Form.Item
                  name="routerName"
                  label="网站地址"
                  rules={[
                    {
                      required: true,
                      whitespace: true,
                      message: "请输入网站地址",
                    },
                  ]}
                >
                  <Input placeholder="以 http:// 或 https:// 开头" />
                </Form.Item>
              )}
              <Form.Item name={["meta", "icon"]} label="菜单图标">
                <Input placeholder="如 ep:user" />
              </Form.Item>
              <Form.Item name={["meta", "rank"]} label="排序">
                <InputNumber min={0} max={999} style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item
                name={["meta", "showLink"]}
                label="显示"
                valuePropName="checked"
              >
                <Switch checkedChildren="显示" unCheckedChildren="隐藏" />
              </Form.Item>
            </>
          )}
          <Form.Item name="status" label="状态">
            <Radio.Group options={STATUS_OPTIONS} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
