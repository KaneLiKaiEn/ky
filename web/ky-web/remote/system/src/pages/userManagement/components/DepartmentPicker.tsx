import { useMemo } from "react";
import { Button, Select, TreeSelect, Typography } from "antd";
import { getDeptProperty } from "@/api/org";
import type { UserDeptRow } from "@/types/user";
import { departmentTree, type References } from "../references";
import { useResource } from "@/hooks/useResource";
import { assertResult } from "@/utils/result";

interface Props {
  orgId: number;
  reference: References;
  value?: UserDeptRow;
  onChange?: (value: UserDeptRow | undefined) => void;
  disabled?: boolean;
  id?: string;
}

export default function DepartmentPicker({
  orgId,
  reference,
  value,
  onChange,
  disabled,
  id,
}: Props) {
  const types = useResource(`types:${orgId}`, () =>
    reference.dictionary("dept.type"),
  );
  const owned = useResource(
    value?.dept_id && !value.dept_type
      ? `dept-property:${value.dept_id}`
      : null,
    async () => {
      const res = assertResult(
        await getDeptProperty({ dept_id: value!.dept_id, column_list: "*" }),
      );
      if (!res.dept_property?.dept_type)
        throw new Error("无法获取所属科室的类型");
      return res.dept_property;
    },
  );
  const deptType = value?.dept_type || owned.data?.dept_type;
  const departments = useResource(
    deptType ? `dept:${orgId}:${deptType}` : null,
    () => reference.departments(deptType!),
  );
  const options = useMemo(() => {
    const values = [
      ...new Set(
        (types.data ?? [])
          .map((row) => row.item_name)
          .filter((name): name is string => Boolean(name)),
      ),
    ];
    if (deptType && !values.includes(deptType)) values.push(deptType);
    return values.map((name) => ({ label: name, value: name }));
  }, [types.data, deptType]);
  const tree = useMemo(() => {
    const nodes = departmentTree(departments.data ?? []);
    if (
      value?.dept_id &&
      !departments.data?.some((row) => row.dept_id === value.dept_id)
    ) {
      nodes.push({
        value: value.dept_id,
        title: value.dept_name || String(value.dept_id),
      });
    }
    return nodes;
  }, [departments.data, value?.dept_id, value?.dept_name]);
  const error = types.error || owned.error || departments.error;
  return (
    <div>
      <div className="user-dept-picker">
        <Select
          id={id}
          aria-label="科室类型"
          placeholder="科室类型"
          allowClear
          showSearch
          optionFilterProp="label"
          value={deptType}
          options={options}
          loading={types.loading || owned.loading}
          disabled={disabled}
          onChange={(type) =>
            onChange?.(type ? { org_id: orgId, dept_type: type } : undefined)
          }
        />
        <TreeSelect
          aria-label="科室名称"
          placeholder="请选择科室"
          showSearch
          allowClear
          treeNodeFilterProp="title"
          value={value?.dept_id}
          treeData={tree}
          loading={departments.loading}
          disabled={disabled || !deptType}
          onChange={(deptId) => {
            const dept = departments.data?.find(
              (row) => row.dept_id === deptId,
            );
            onChange?.({
              org_id: orgId,
              dept_type: deptType,
              dept_id: dept?.dept_id,
              dept_name: dept?.dept_name,
            });
          }}
        />
      </div>
      {error && (
        <Typography.Text type="danger">
          {error}{" "}
          <Button
            type="link"
            size="small"
            onClick={() => {
              if (types.error) types.reload();
              if (owned.error) owned.reload();
              if (departments.error) departments.reload();
            }}
          >
            重试
          </Button>
        </Typography.Text>
      )}
    </div>
  );
}
