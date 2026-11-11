import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo } from "react";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Form, Input, Select, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import type {
  PatientContactData,
  PatientContactRow,
} from "../../PatientInfo/types/patient";
import DictSelect from "../components/DictSelect";
import { DICT } from "../constants";
import { useDict } from "../stores/useDictStore";
import type { ContactFormValue } from "../types";
import { contactToForm, toContactData } from "../utils";

interface ContactTabProps {
  contacts: PatientContactRow[];
  patientId?: number | null;
  saving?: boolean;
  /** 为 false 时隐藏本页保存按钮，由外层扩展信息统一保存 */
  showSave?: boolean;
  onSave: (list: PatientContactData[]) => Promise<boolean>;
}

export interface ContactTabHandle {
  /** 读取联系人表单当前值，供左侧基本信息保存使用 */
  collectContacts: () => Promise<PatientContactData[]>;
}

const hasContactContent = (item?: ContactFormValue) =>
  !!(
    item?.contact_name ||
    item?.contact_telno ||
    item?.contact_kinship ||
    item?.contact_idno ||
    item?.contact_org ||
    item?.contact_address
  );

const emptyContact = (): ContactFormValue => ({
  contact_name: "",
  contact_telno: "",
  contact_kinship: "",
  contact_idno_system: undefined,
  contact_idno: "",
  contact_org: "",
  contact_address: "",
});

const ContactTab = forwardRef<ContactTabHandle, ContactTabProps>(
  ({ contacts, patientId, saving, showSave = true, onSave }, ref) => {
  const [form] = Form.useForm<{ contacts: ContactFormValue[] }>();
  const {
    rows: kinshipRows,
    loading: kinshipLoading,
    loaded: kinshipLoaded,
    ensure: ensureKinship,
  } = useDict(DICT.KINSHIP, { eager: false });

  const kinshipOptions = useMemo(() => {
    const map = new Map<string, { label: string; value: string }>();
    kinshipRows.forEach((item) => {
      const name = item.item_name?.trim();
      if (!name) return;
      map.set(name, { label: name, value: name });
    });
    return Array.from(map.values());
  }, [kinshipRows]);

  useEffect(() => {
    const list = contacts.length
      ? contacts.map((item) => contactToForm(item))
      : [emptyContact()];
    // 把数组写进表单，Form.List name="contacts" 就会去监听这个数组字段的变化， fields 就是这些数组元素
    form.setFieldsValue({ contacts: list });
  }, [contacts, form]);

  const collectContacts = useCallback(async () => {
    const draft = form.getFieldsValue().contacts ?? [];
    // 只有空占位行时不校验，避免没填联系人时挡住基本信息保存
    if (!draft.some(hasContactContent)) return [];
    const values = await form.validateFields();
    return (values.contacts ?? [])
      .filter(hasContactContent)
      .map((item) => toContactData(item, patientId));
  }, [form, patientId]);

  useImperativeHandle(ref, () => ({ collectContacts }), [collectContacts]);

  const handleSave = async () => {
    const list = await collectContacts();
    await onSave(list);
  };

  return (
    <Form form={form} disabled={saving} className="min-w-0">
      <Form.List name="contacts">
        {(fields, { add, remove }) => {
          const columns: ColumnsType<(typeof fields)[number]> = [
            {
              title: "姓名",
              key: "contact_name",
              width: 110,
              render: (_, field) => (
                <div>
                  <Form.Item name={[field.name, "contact_id"]} hidden>
                    <Input />
                  </Form.Item>
                  <Form.Item
                    name={[field.name, "contact_name"]}
                    className="mb-0!"
                  >
                    <Input allowClear placeholder="姓名" />
                  </Form.Item>
                </div>
              ),
            },
            {
              title: (
                <span>
                  电话{" "}
                  <span className="text-(--ant-color-error, #ff4d4f)">*</span>
                </span>
              ),
              key: "contact_telno",
              width: 160,
              render: (_, field) => (
                <Form.Item
                  name={[field.name, "contact_telno"]}
                  className="mb-0!"
                  rules={[{ required: true, message: "请输入电话" }]}
                >
                  <Input allowClear placeholder="电话" />
                </Form.Item>
              ),
            },
            {
              title: "关系",
              key: "contact_kinship",
              width: 140,
              render: (_, field) => (
                <Form.Item
                  name={[field.name, "contact_kinship"]}
                  className="mb-0!"
                >
                  <Select
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    placeholder="关系"
                    className="w-full"
                    loading={kinshipLoading}
                    options={kinshipOptions}
                    onOpenChange={(open) => {
                      if (open && !kinshipLoaded) void ensureKinship();
                    }}
                  />
                </Form.Item>
              ),
            },
            {
              title: "证件类型",
              key: "contact_idno_system",
              width: 120,
              render: (_, field) => (
                <Form.Item
                  name={[field.name, "contact_idno_system"]}
                  className="mb-0!"
                >
                  <DictSelect
                    dictName={DICT.IDNO_SYSTEM}
                    placeholder="证件类型"
                    className="w-full"
                  />
                </Form.Item>
              ),
            },
            {
              title: "证件号",
              key: "contact_idno",
              width: 150,
              render: (_, field) => (
                <Form.Item
                  name={[field.name, "contact_idno"]}
                  className="mb-0!"
                >
                  <Input allowClear placeholder="证件号" />
                </Form.Item>
              ),
            },
            {
              title: "工作单位",
              key: "contact_org",
              width: 140,
              render: (_, field) => (
                <Form.Item name={[field.name, "contact_org"]} className="mb-0!">
                  <Input allowClear placeholder="工作单位" />
                </Form.Item>
              ),
            },
            {
              title: "联系地址",
              key: "contact_address",
              width: 180,
              render: (_, field) => (
                <Form.Item
                  name={[field.name, "contact_address"]}
                  className="mb-0!"
                >
                  <Input allowClear placeholder="联系地址" className="w-full" />
                </Form.Item>
              ),
            },
            {
              title: "",
              key: "action",
              width: 48,
              align: "center",
              fixed: "right",
              render: (_, field) => (
                <Button
                  type="text"
                  danger
                  shape="circle"
                  icon={<MinusCircleOutlined />}
                  disabled={fields.length <= 1}
                  onClick={() => remove(field.name)}
                />
              ),
            },
          ];

          return (
            <div className="flex min-w-0 flex-col gap-2">
              <Table
                size="small"
                pagination={false}
                rowKey="key"
                dataSource={fields}
                columns={columns}
                tableLayout="fixed"
                scroll={{ x: "max-content" }}
                className="min-w-0 [&_.ant-table-content]:overflow-x-auto! [&_.ant-table-content]:overscroll-x-contain"
              />
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                className="w-fit border-(--ant-color-success, #52c41a)! text-(--ant-color-success, #52c41a)!"
                onClick={() => add(emptyContact())}
              >
                添加联系人
              </Button>
            </div>
          );
        }}
      </Form.List>

      {showSave ? (
        <div className="mt-3">
          <Button
            type="primary"
            loading={saving}
            onClick={() => void handleSave()}
          >
            保存
          </Button>
        </div>
      ) : null}
    </Form>
  );
},
);

export default ContactTab;
