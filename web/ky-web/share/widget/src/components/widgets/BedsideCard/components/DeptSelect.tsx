import { getAllDeptListApi, getIpList } from "../api";
import { fetchSessionInfo } from "../utils/session";
import { Button, Form, Modal, Select, message } from "antd";
import { useEffect, useState, useMemo } from "react";
import { pinyin } from "pinyin-pro";

export interface DeptOption {
  label: string | React.ReactNode;
  value: number;
}

export interface DeptSelectProps {
  value?: number;
  onChange?: (value: number, option: DeptOption) => void;
  onBlur?: () => void;
  placeholder?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  autoSelectFirst?: boolean; // 是否自动选中第一条
}

export function DeptSelect({
  value,
  onChange,
  onBlur,
  placeholder = "请选择科室",
  style,
  disabled = false,
  autoSelectFirst = true, //  默认开启自动选中
}: DeptSelectProps) {
  const [deptOptions, setDeptOptions] = useState<DeptOption[]>([]); //  仅当前病区科室
  const [allDeptOptions, setAllDeptOptions] = useState<DeptOption[]>([]); //  全院科室
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  // 合并列表
  const mergedOptions = useMemo(() => {
    const map = new Map<number, DeptOption>();
    [...deptOptions, ...allDeptOptions].forEach((item) => {
      if (!map.has(item.value)) {
        map.set(item.value, { label: item.label, value: item.value });
      }
    });
    return Array.from(map.values());
  }, [deptOptions, allDeptOptions]);

  const fetchDeptList = async () => {
    setLoading(true);
    try {
      const session = await fetchSessionInfo();
      if (!session?.dept_id) return;

      const params: Record<string, any> = {};
      const isNurse = session.work_type === "NURSE";
      params[isNurse ? "ward_id" : "dept_id"] = session.dept_id;

      const res = await getIpList(params);
      if (res.code !== 0) {
        message.error(res.message + res.hint);
        return;
      }

      const { ip_list = [], visit_list = [] } = res || {};
      const mergedMap = new Map();
      [...ip_list, ...visit_list].forEach((item: any) => {
        const key = item.visit_id;
        mergedMap.set(key, { ...(mergedMap.get(key) || {}), ...item });
      });
      const mergedList = Array.from(mergedMap.values());
      const currentWardId = session.dept_id;

      const options: DeptOption[] = [];
      const deptIds = new Set<number>();

      mergedList
        .filter((item: any) => item.ward_id === currentWardId)
        .forEach((item: any) => {
          if (!deptIds.has(item.dept_id) && item.dept_name) {
            deptIds.add(item.dept_id);
            options.push({ label: item.dept_name, value: item.dept_id });
          }
        });

      setDeptOptions(options);

      //  自动选中第一条
      if (
        autoSelectFirst &&
        options.length > 0 &&
        (value === undefined || value === null) &&
        onChange
      ) {
        const firstOption = options[0];
        onChange(firstOption.value, firstOption);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const fetchAllDeptList = async () => {
    const session = await fetchSessionInfo();
    if (!session?.org_id) return;

    const res = await getAllDeptListApi({
      org_id: Number(session.org_id),
      tag_list: "[住院]",
    });
    if (res.code !== 0) {
      message.error(res.message + res.hint);
      return;
    }
    const list = (res.dept_list || []).map((item: any) => ({
      label: item.dept_name,
      value: item.dept_id,
    }));
    setAllDeptOptions(list);
  };

  //  打开弹窗时：正确设置表单值
  const handleOpenModal = () => {
    setModalOpen(true);
    if (allDeptOptions.length === 0) fetchAllDeptList();

    if (value !== undefined && value !== null) {
      // 从合并列表中查找对应 option，确保能显示正确的 label
      const selectedOption = mergedOptions.find((opt) => opt.value === value);
      if (selectedOption) {
        form.setFieldsValue({
          dept_id: {
            value: selectedOption.value,
            label: selectedOption.label,
          },
        });
      }
    }
  };

  //  弹窗确认时
  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (values.dept_id) {
        const deptId =
          typeof values.dept_id === "object" && values.dept_id !== null
            ? values.dept_id.value
            : values.dept_id;

        const selectedOption = allDeptOptions.find(
          (opt) => opt.value === deptId,
        );
        if (selectedOption && onChange) {
          onChange(deptId, selectedOption);
        }
      }
      setModalOpen(false);
    } catch (error) {}
  };

  // 过滤函数（兼容 Antd 类型），支持拼音首字母搜索
  const filterOption = (input: string, option?: any) => {
    const label = option?.label;
    if (typeof label !== "string") {
      return false;
    }
    const inputLower = input.toLowerCase().trim();

    // 原文匹配
    if (label.toLowerCase().includes(inputLower)) {
      return true;
    }

    // 全拼匹配（移除空格后匹配）
    const fullPinyin = pinyin(label, {
      toneType: "none",
      nonZh: "removed",
    })
      .toLowerCase()
      .replace(/\s/g, "");
    if (fullPinyin.includes(inputLower.replace(/\s/g, ""))) {
      return true;
    }

    // 首字母匹配（移除空格后匹配）
    const firstLetters = pinyin(label, {
      pattern: "first",
      toneType: "none",
      nonZh: "removed",
    })
      .toLowerCase()
      .replace(/\s/g, "");
    if (firstLetters.includes(inputLower.replace(/\s/g, ""))) {
      return true;
    }

    return false;
  };

  const dropdownRender = (menu: React.ReactNode) => (
    <div>
      <div style={{ maxHeight: "300px", overflowY: "auto" }}>{menu}</div>
      <div
        style={{
          padding: "8px 12px",
          borderTop: "1px solid #f0f0f0",
          background: "#fff",
        }}
      >
        <Button
          type="primary"
          block
          size="small"
          onClick={handleOpenModal}
          disabled={disabled}
        >
          更多科室
        </Button>
      </div>
    </div>
  );

  // 将外部 number 类型的 value 转换为 labelInValue 格式
  const selectValue = useMemo(() => {
    if (value === undefined || value === null) return undefined;
    // 即使选中的是全院科室，也能通过 mergedOptions 找到对应的 label 正确显示
    const found = mergedOptions.find((opt) => opt.value === value);
    return found ? { value: found.value, label: found.label } : undefined;
  }, [value, mergedOptions]);

  useEffect(() => {
    fetchDeptList();
  }, []);

  return (
    <>
      {/*  下拉菜单仅展示当前病区科室 */}
      <Select
        labelInValue
        value={selectValue}
        onChange={(val: { value: number; label: React.ReactNode }) => {
          const option = deptOptions.find((opt) => opt.value === val.value) ||
            allDeptOptions.find((opt) => opt.value === val.value) || {
              label: val.label,
              value: val.value,
            };
          onChange?.(val.value, option as DeptOption);
        }}
        onBlur={onBlur}
        placeholder={placeholder}
        style={style}
        showSearch
        loading={loading}
        filterOption={filterOption}
        options={deptOptions} //  关键：只传当前病区列表
        dropdownRender={dropdownRender}
        allowClear
        disabled={disabled}
        fieldNames={{ label: "label", value: "value" }}
        dropdownMatchSelectWidth={false}
      />

      <Modal
        title="选择科室"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleModalOk}
        okText="确定"
        cancelText="取消"
        destroyOnHidden={true}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="科室名称"
            name="dept_id"
            rules={[{ required: true, message: "请选择科室" }]}
          >
            {/*  弹窗内展示全院科室，必须添加 labelInValue */}
            <Select
              labelInValue //  关键：启用 labelInValue 模式，确保显示科室名称
              options={allDeptOptions}
              showSearch
              placeholder="搜索或选择全院科室"
              filterOption={filterOption}
              fieldNames={{ label: "label", value: "value" }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
