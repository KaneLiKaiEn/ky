import { useEffect, useRef, useState } from "react";
import { Button, Select, Spin } from "antd";
import { getEmployeeProperty, retrieveEmployeeList } from "@/api/hr";
import { getStudentProperty, retrieveStudentList } from "@/api/teach";
import { useResource } from "@/hooks/useResource";
import { assertResult, resultRows } from "@/utils/result";
import { parseId } from "../navigation";

export default function PersonSelect({
  orgId,
  kind,
  value,
  onChange,
  disabled,
  id,
}: {
  orgId: number;
  kind: "employee" | "student";
  value?: number;
  onChange?: (value?: number) => void;
  disabled?: boolean;
  id?: string;
}) {
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const known = useResource(
    value ? `${kind}:${orgId}:${value}` : null,
    async () => {
      if (kind === "employee") {
        const res = assertResult(
          await getEmployeeProperty({ employee_id: value, column_list: "*" }),
        );
        return res.employee_property?.employee_name || String(value);
      }
      const res = assertResult(
        await getStudentProperty({ student_id: value, column_list: "*" }),
      );
      return res.student_property?.student_name || String(value);
    },
  );
  const rows = useResource(`${kind}-search:${orgId}:${query}`, async () => {
    const params = {
      org_id: orgId,
      retrieve_input: query || "*",
      retrieve_limit: 100,
      column_list: "*",
    };
    if (kind === "employee") {
      const res = assertResult(await retrieveEmployeeList(params));
      return resultRows(res.employee_list)
        .map((row) => ({
          value: parseId(row.employee_id)!,
          label: `${row.employee_name || "未命名"}（${row.employee_no || row.employee_id}）`,
        }))
        .filter((row) => row.value);
    }
    const res = assertResult(await retrieveStudentList(params));
    return resultRows(res.student_list)
      .map((row) => ({
        value: parseId(row.student_id)!,
        label: `${row.student_name || "未命名"}（${row.student_no || row.student_id}）`,
      }))
      .filter((row) => row.value);
  });
  const options = [...(rows.data ?? [])];
  if (value && !options.some((row) => row.value === value))
    options.push({ value, label: known.data || String(value) });
  return (
    <Select
      id={id}
      aria-label={kind === "employee" ? "关联员工" : "关联学生"}
      allowClear
      showSearch
      filterOption={false}
      placeholder={
        kind === "employee" ? "搜索员工姓名或工号" : "搜索学生姓名或学号"
      }
      value={value || undefined}
      options={options}
      loading={rows.loading || known.loading}
      disabled={disabled}
      searchValue={search}
      onSearch={(text) => {
        setSearch(text);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setQuery(text), 300);
      }}
      onChange={(next) => {
        clearTimeout(timer.current);
        onChange?.(next);
        setSearch("");
        setQuery("");
      }}
      status={known.error ? "error" : undefined}
      notFoundContent={
        rows.loading ? (
          <Spin size="small" />
        ) : rows.error ? (
          <Button type="link" onClick={rows.reload}>
            加载失败，重试
          </Button>
        ) : (
          "暂无匹配结果"
        )
      }
      popupRender={(menu) => (
        <>
          {menu}
          {known.error && (
            <Button type="link" onClick={known.reload}>
              关联信息加载失败，重试
            </Button>
          )}
        </>
      )}
    />
  );
}
