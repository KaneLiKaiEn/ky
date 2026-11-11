import * as api from "../../api/report";
import { getDatasetArgOption } from "../../api/dataset";
import { id, text } from "comm/utils";
import type { Ticket } from "./runtime";
import {
  canvasRows,
  columnsFrom,
  dataRows,
  decodeJson,
  defaultsFor,
  isOption,
  pivotResult,
  success,
  type Metadata,
  type Result,
  type Snapshot,
  type Values,
  type Option,
} from "./model";

function optionsFrom(data: unknown): Option[] {
  const list = decodeJson(data);
  if (
    !Array.isArray(list) ||
    list.some(
      (item) => !item || typeof item !== "object" || item.item_code == null,
    )
  )
    throw new Error("参数选项格式错误");
  return list.map((item) => ({
    item_code: text(item.item_code),
    item_name: text(item.item_name ?? item.item_code),
  }));
}
export async function metadata(
  reportId: number,
  overrides: Values,
  ticket: Ticket,
): Promise<Metadata> {
  const property = success(
    await ticket.run(() =>
      api.getReportProperty({ report_id: reportId }, ticket.signal),
    ),
  ).report_property;
  ticket.check();
  if (!property || !id(property.report_id))
    throw new Error("报表不存在或无权访问");
  if (
    !["TABLE", "PIVOT", "FORM", "CANVAS", "CONTENT"].includes(
      property.report_type || "",
    )
  )
    throw new Error("暂不支持此报表类型");
  const rows =
    success(
      await ticket.run(() =>
        api.getReportArgList2({ report_id: reportId }, ticket.signal),
      ),
    ).row_list ?? [];
  ticket.check();
  const codes = new Set<string>();
  for (const row of rows) {
    if (!row.arg_code || codes.has(row.arg_code))
      throw new Error("报表参数代码缺失或重复");
    codes.add(row.arg_code);
  }
  const args = [];
  // Options are loaded in order; never fan out one request per argument.
  for (const row of rows) {
    ticket.check();
    const argument = { ...row, options: undefined as Option[] | undefined };
    if (isOption(row)) {
      if (!id(row.arg_id))
        throw new Error(`参数 ${row.arg_name || row.arg_code} 缺少有效编号`);
      const response = success(
        await ticket.run(() =>
          getDatasetArgOption({ arg_id: row.arg_id! }, ticket.signal),
        ),
      );
      ticket.check();
      argument.options = optionsFrom(response.data);
    }
    args.push(argument);
  }
  let columns: Metadata["columns"] = [];
  if (["TABLE", "CANVAS"].includes(property.report_type || "")) {
    ticket.check();
    columns = columnsFrom(
      success(
        await ticket.run(() =>
          api.buildReportColumn(
            { report_id: reportId, return_format: "react-data-grid" },
            ticket.signal,
          ),
        ),
      ).data,
      property.column_freeze,
    );
    ticket.check();
  }
  return { property, args, columns, defaults: defaultsFor(args, overrides) };
}
export async function countRows(
  reportId: number,
  snapshot: Snapshot,
  ticket: Ticket,
) {
  const response = await ticket.run(() =>
    api.countReportData(
      { report_id: reportId, arg_list: snapshot.args },
      ticket.signal,
    ),
  );
  ticket.check();
  if (
    typeof response.code !== "number" ||
    response.code < 0 ||
    !Number.isSafeInteger(response.row_count) ||
    response.row_count! < 0
  )
    throw new Error(response.message || "报表计数返回失败");
  return response.row_count!;
}
async function tableRows(
  reportId: number,
  snapshot: Snapshot,
  total: number,
  ticket: Ticket,
) {
  const rows: Result["rows"] = [];
  if (total === 0) return rows;
  const size = snapshot.size === "all" ? 1000 : snapshot.size;
  let page = snapshot.size === "all" ? 1 : snapshot.page;
  do {
    ticket.check();
    const response = success(
      await ticket.run(() =>
        api.retrieveReportData(
          {
            report_id: reportId,
            arg_list: snapshot.args,
            return_format: "row",
            page_no: page,
            page_size: size,
          },
          ticket.signal,
        ),
      ),
    );
    ticket.check();
    const batch = dataRows(response.data);
    rows.push(...batch);
    if (snapshot.size !== "all" || batch.length < size) break;
    page++;
  } while (rows.length < total);
  return rows;
}
export async function query(
  meta: Metadata,
  snapshot: Snapshot,
  ticket: Ticket,
): Promise<Result> {
  const reportId = meta.property.report_id!;
  const params = { report_id: reportId, arg_list: snapshot.args };
  switch (meta.property.report_type) {
    case "TABLE": {
      const total = await countRows(reportId, snapshot, ticket);
      return {
        rows: await tableRows(reportId, snapshot, total, ticket),
        columns: meta.columns,
        cells: [],
        total,
      };
    }
    case "PIVOT":
    case "FORM": {
      const response = success(
        await ticket.run(() => api.retrieveReportData(params, ticket.signal)),
      );
      ticket.check();
      const result = pivotResult(response.data);
      return { ...result, cells: [], total: result.rows.length };
    }
    case "CANVAS": {
      const response = success(
        await ticket.run(() => api.retrieveReportCell(params, ticket.signal)),
      );
      ticket.check();
      const cells = response.cell_list ?? [],
        rows = canvasRows(cells, meta.columns);
      return { rows, columns: meta.columns, cells, total: rows.length };
    }
    case "CONTENT": {
      const response = success(
        await ticket.run(() => api.getReportContent(params, ticket.signal)),
      );
      ticket.check();
      if (
        response.report_format?.toLowerCase() !== "pdf" ||
        !response.report_content
      )
        throw new Error("未配置 PDF 内容或文件格式不受支持");
      return {
        rows: [],
        columns: [],
        cells: [],
        total: 0,
        pdf: response.report_content,
      };
    }
    default:
      throw new Error("暂不支持此报表类型");
  }
}
export async function allRows(
  meta: Metadata,
  snapshot: Snapshot,
  result: Result,
  ticket: Ticket,
) {
  if (meta.property.report_type !== "TABLE" || snapshot.size === "all")
    return result.rows;
  const complete = { ...snapshot, page: 1, size: "all" as const };
  const total = await countRows(meta.property.report_id!, complete, ticket);
  return tableRows(meta.property.report_id!, complete, total, ticket);
}
