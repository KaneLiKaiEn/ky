import { useSaveShortcut } from "@/hooks/useSaveShortcut";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  App,
  Button,
  Divider,
  Form,
  Input,
  Select,
  Space,
  Typography,
} from "antd";
import { ReloadOutlined, SaveOutlined } from "@ant-design/icons";
import { newDept, saveDeptProperty } from "@/api/org";
import type { DeptRow } from "@/types/org";
import type { DepartmentReferences } from "../references";
import { departmentOptions } from "../model";
import { assertResultWithHint as assertResult, errorText } from "@/utils/result";
import { parseId } from "@/utils/selection";
import { useResource } from "@/hooks/useResource";
import {
  descendantIds,
  propertyChanged,
  propertyDto,
  propertyValues,
  type PropertyValues,
} from "../dto";

export interface PropertyFormProps {
  orgId: number;
  department: DeptRow;
  departments: DeptRow[];
  reference: DepartmentReferences;
  disabled?: boolean;
  onSaved: (row: DeptRow) => void;
  onDirtyChange: (value: boolean) => void;
  onBusyChange: (value: boolean) => void;
}

export default function PropertyForm(props: PropertyFormProps) {
  const { orgId, department, departments, reference, disabled = false } = props;
  const { message } = App.useApp();
  const [form] = Form.useForm<PropertyValues>();
  const branchesResource = useResource(`property-branches:${orgId}`, () =>
    reference.branches(),
  );
  const tagsResource = useResource(`property-tags:${orgId}`, () =>
    reference.dictionary("dept.tag"),
  );
  const branches = branchesResource.data ?? [];
  const tags = tagsResource.data ?? [];
  const referenceLoading = branchesResource.loading || tagsResource.loading;
  const referenceError = [
    branchesResource.error && `院区：${branchesResource.error}`,
    tagsResource.error && `科室标签：${tagsResource.error}`,
  ]
    .filter(Boolean)
    .join("；");
  const [saveError, setSaveError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [creationUncertain, setCreationUncertain] = useState(false);
  const busy = useRef(false);
  const mounted = useRef(false);
  const generation = useRef(0);
  const departmentSnapshot = JSON.stringify(department);
  const originalValues = useRef(propertyValues(department));
  const callbacks = useRef(props);
  callbacks.current = props;

  const reportDirty = useCallback((value: boolean) => {
    setDirty(value);
    callbacks.current.onDirtyChange(value);
  }, []);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      callbacks.current.onDirtyChange(false);
      callbacks.current.onBusyChange(false);
    };
  }, []);

  useEffect(() => {
    generation.current += 1;
    originalValues.current = propertyValues(department);
    form.resetFields();
    form.setFieldsValue(originalValues.current);
    setSaveError(undefined);
    setCreationUncertain(false);
    reportDirty(false);
  }, [departmentSnapshot, orgId, form, reportDirty]);

  const excludedParents = useMemo(
    () => descendantIds(departments, department.dept_id),
    [departments, department.dept_id],
  );
  const parentOptions = useMemo(() => {
    const available = departments.filter((row) => {
      const id = parseId(row.dept_id);
      return id !== null && !excludedParents.has(id);
    });
    const options = [
      { value: 0, label: "根科室", searchText: "根科室" },
      ...departmentOptions(available),
    ];
    const parentId = parseId(department.parent_id);
    if (parentId && !options.some((option) => option.value === parentId))
      options.push({
        value: parentId,
        label: department.parent_name || String(parentId),
        searchText: `${department.parent_name ?? ""} ${parentId}`,
      });
    return options.map((option) => ({
      ...option,
      disabled: excludedParents.has(option.value),
    }));
  }, [
    departments,
    department.parent_id,
    department.parent_name,
    excludedParents,
  ]);

  const branchOptions = useMemo(() => {
    const options = branches.flatMap((row) => {
      const id = parseId(row.branch_id);
      return id
        ? [
            {
              value: id,
              label: row.branch_name || String(id),
              searchText: `${row.branch_name ?? ""} ${row.kb_code ?? ""} ${id}`,
            },
          ]
        : [];
    });
    const currentId = parseId(department.branch_id);
    if (currentId && !options.some((option) => option.value === currentId))
      options.push({
        value: currentId,
        label: department.branch_name || String(currentId),
        searchText: `${department.branch_name ?? ""} ${currentId}`,
      });
    return options;
  }, [branches, department.branch_id, department.branch_name]);

  const selectedTags =
    Form.useWatch("dept_tag", form) ?? originalValues.current.dept_tag;
  const tagOptions = useMemo(() => {
    const options = tags.flatMap((row) =>
      row.item_name
        ? [
            {
              value: row.item_name,
              label: row.item_name,
              searchText: `${row.item_name} ${row.kb_code ?? ""}`,
            },
          ]
        : [],
    );
    for (const tag of selectedTags)
      if (!options.some((option) => option.value === tag))
        options.push({ value: tag, label: tag, searchText: tag });
    return options.filter(
      (option, index) =>
        options.findIndex((item) => item.value === option.value) === index,
    );
  }, [tags, selectedTags]);

  const reset = () => {
    form.resetFields();
    form.setFieldsValue(originalValues.current);
    if (!creationUncertain) setSaveError(undefined);
    reportDirty(false);
  };

  const save = async (values: PropertyValues) => {
    if (busy.current || creationUncertain || callbacks.current.disabled) return;
    busy.current = true;
    const currentGeneration = generation.current;
    setSaving(true);
    setSaveError(undefined);
    callbacks.current.onBusyChange(true);
    try {
      const property = propertyDto(
        department,
        values,
        orgId,
        departments,
        branches,
      );
      let id = property.dept_id!;
      if (id === 0) {
        const result = assertResult(await newDept({ ...property, dept_id: 0 }));
        const createdId = parseId(result.dept_id);
        if (createdId === null) {
          if (mounted.current && currentGeneration === generation.current)
            setCreationUncertain(true);
          throw new Error(
            "接口未返回有效科室 ID，请刷新确认是否已创建，避免重复新增",
          );
        }
        id = createdId;
      } else {
        assertResult(
          await saveDeptProperty({ dept_id: id, dept_property: property }),
        );
      }
      if (!mounted.current || currentGeneration !== generation.current) return;
      const saved = { ...property, dept_id: id };
      originalValues.current = propertyValues(saved);
      form.setFieldsValue(originalValues.current);
      reportDirty(false);
      message.success(
        department.dept_id === 0 ? "科室已创建" : "科室属性已保存",
      );
      callbacks.current.onSaved(saved);
    } catch (error) {
      if (mounted.current && currentGeneration === generation.current)
        setSaveError(errorText(error));
    } finally {
      busy.current = false;
      if (mounted.current) {
        setSaving(false);
        callbacks.current.onBusyChange(false);
      }
    }
  };

  const filterOption = (input: string, option?: { searchText?: string }) =>
    (option?.searchText ?? "")
      .toLowerCase()
      .includes(input.trim().toLowerCase());

  useSaveShortcut(() => form.submit(), !disabled && !saving && !creationUncertain);

  return (
    <Form<PropertyValues>
      form={form}
      layout="horizontal"
      colon={false}
      labelAlign="right"
      labelCol={{ flex: "88px" }}
      wrapperCol={{ flex: "auto" }}
      className="department-form"
      initialValues={originalValues.current}
      disabled={disabled || saving || disabled}
      onValuesChange={(_, values) =>
        reportDirty(propertyChanged(values, originalValues.current))
      }
      onFinish={save}
      scrollToFirstError
    >
      {saveError && (
        <Alert
          className="department-panel__feedback"
          showIcon
          type="error"
          title="保存未完成"
          description={saveError}
        />
      )}
      {referenceError && (
        <Alert
          className="department-panel__feedback"
          type="warning"
          showIcon
          title="部分选项加载失败"
          description={referenceError}
          action={
            <Button
              size="small"
              loading={referenceLoading}
              disabled={disabled || saving}
              onClick={() => {
                branchesResource.reload();
                tagsResource.reload();
              }}
            >
              重试
            </Button>
          }
        />
      )}
      <Divider titlePlacement="left">基本信息</Divider>
      <div className="department-form__grid">
        <Form.Item
          label="科室名称"
          name="dept_name"
          rules={[
            { required: true, whitespace: true, message: "请填写科室名称" },
          ]}
        >
          <Input placeholder="请输入科室名称" autoComplete="off" />
        </Form.Item>
        <Form.Item label="名称缩写" name="dept_name_abbr">
          <Input placeholder="请输入名称缩写" autoComplete="off" />
        </Form.Item>
        <Form.Item label="科室编码" name="dept_no">
          <Input placeholder="请输入科室编码" autoComplete="off" />
        </Form.Item>
        <Form.Item label="所属院区" name="branch_id">
          <Select
            allowClear
            showSearch
            filterOption={filterOption}
            options={branchOptions}
            loading={referenceLoading}
            disabled={disabled || saving || referenceLoading}
            placeholder="请选择院区"
          />
        </Form.Item>
        <Form.Item
          label="父级科室"
          name="parent_id"
          rules={[
            {
              validator: (_, value: unknown) => {
                const id = parseId(value, true);
                if (id === null)
                  return Promise.reject(new Error("请选择父级科室"));
                return excludedParents.has(id)
                  ? Promise.reject(new Error("不能选择当前科室或其下级科室"))
                  : Promise.resolve();
              },
            },
          ]}
        >
          <Select
            showSearch
            filterOption={filterOption}
            options={parentOptions}
            placeholder="请选择父级科室"
          />
        </Form.Item>
        <Form.Item label="科室标签" name="dept_tag">
          <Select
            mode="multiple"
            allowClear
            showSearch
            filterOption={filterOption}
            options={tagOptions}
            loading={referenceLoading}
            disabled={disabled || saving || referenceLoading}
            placeholder="请选择科室标签"
            popupRender={(menu) => (
              <>
                <Space
                  className="department-form__tag-actions"
                  style={{ padding: "4px 8px" }}
                >
                  <Button
                    type="link"
                    size="small"
                    disabled={disabled || saving}
                    onClick={() => {
                      form.setFieldValue(
                        "dept_tag",
                        tagOptions.map((option) => option.value),
                      );
                      reportDirty(
                        propertyChanged(
                          form.getFieldsValue(),
                          originalValues.current,
                        ),
                      );
                    }}
                  >
                    选择全部
                  </Button>
                  <Button
                    type="link"
                    size="small"
                    disabled={disabled || saving}
                    onClick={() => {
                      form.setFieldValue("dept_tag", []);
                      reportDirty(
                        propertyChanged(
                          form.getFieldsValue(),
                          originalValues.current,
                        ),
                      );
                    }}
                  >
                    清空
                  </Button>
                </Space>
                {menu}
              </>
            )}
          />
        </Form.Item>
      </div>
      <Divider titlePlacement="left">联系与展示</Divider>
      <div className="department-form__grid">
        <Form.Item label="科室电话" name="dept_telno">
          <Input placeholder="请输入联系电话" />
        </Form.Item>
        <Form.Item label="科室位置" name="dept_location">
          <Input placeholder="请输入科室位置" />
        </Form.Item>
        <Form.Item label="显示排序" name="sort_no">
          <Input placeholder="请输入排序值" />
        </Form.Item>
        <Form.Item
          label="科室描述"
          name="dept_name_legend"
          className="department-form__wide"
        >
          <Input.TextArea
            rows={3}
            autoSize={{ minRows: 3, maxRows: 6 }}
            placeholder="请输入科室描述"
          />
        </Form.Item>
      </div>
      <div className="department-form__actions">
        <Space>
          <Button
            type="primary"
            htmlType="submit"
            icon={<SaveOutlined />}
            loading={saving}
            disabled={disabled || saving || creationUncertain}
          >
            保存
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={reset}
            disabled={disabled || saving || (!dirty && !saveError)}
          >
            重置
          </Button>
          <Typography.Text type="secondary">Alt + Enter 保存</Typography.Text>
        </Space>
      </div>
    </Form>
  );
}
