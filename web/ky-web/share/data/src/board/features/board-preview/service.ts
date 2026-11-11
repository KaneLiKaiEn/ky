import * as api from "../../api/board";
import { readFile } from "../../api/references";
import type { ArgValueRow } from "../../types/references.d.ts";
import type {
  BoardComponentRow,
  BuildBoardComponentRes,
  BoardComponentColThresholdRow,
} from "../../types/board.d.ts";
import { checkSignal } from "./runtime";
import {
  dataRows,
  decodeJson,
  parsePreviewLayout,
  positiveId,
  nativeType,
  componentBindings,
} from "./model";

export async function loadBoard(boardId: number, signal: AbortSignal) {
  checkSignal(signal);
  const property = await api.getBoardProperty({ board_id: boardId });
  checkSignal(signal);
  if (!property.board_property)
    throw new Error("未取得看板属性，请确认看板存在且已授权");
  const layout = await api.getBoardLayout({ board_id: boardId });
  checkSignal(signal);
  const cells = parsePreviewLayout(layout.layout_content ?? "");
  const components = await api.getBoardComponentList({ board_id: boardId });
  checkSignal(signal);
  const args = await api.getBoardArgList({ board_id: boardId });
  checkSignal(signal);
  const links = await api.getBoardLinkList({ board_id: boardId });
  checkSignal(signal);
  return {
    board: property.board_property,
    cells,
    components: components.row_list ?? [],
    parameters: args.row_list ?? [],
    links: links.row_list ?? [],
  };
}
export type BoardData = Awaited<ReturnType<typeof loadBoard>>;
export function variableValue(result: {
  var_type?: string;
  var_value?: string;
  data?: unknown;
}) {
  return result.var_type && result.var_type !== "JSON"
    ? (result.var_value ?? "")
    : decodeJson(result.data);
}
export async function readVariable(
  componentId: number,
  code: string,
  args: ArgValueRow[],
  signal: AbortSignal,
  page?: number,
) {
  checkSignal(signal);
  const result = await api.getBoardComponentVarValue({
    board_component_id: componentId,
    var_code: code,
    arg_list: args,
    ...(page ? { page_no: page, page_size: 50 } : {}),
  });
  checkSignal(signal);
  return variableValue(result);
}
export function imageMime(content: string, format?: string) {
  if (format?.startsWith("image/")) return format;
  const names: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    svg: "image/svg+xml",
    webp: "image/webp",
  };
  if (format && names[format]) return names[format];
  if (content.startsWith("/9j/")) return "image/jpeg";
  if (content.startsWith("R0lG")) return "image/gif";
  if (content.startsWith("PHN2Zy") || content.startsWith("PD94bW"))
    return "image/svg+xml";
  return "image/png";
}
/** Data URLs keep authenticated media out of frame scripts and need no lifetime beyond the frame. */
export async function resolvePictures(
  result: BuildBoardComponentRes,
  owner: { boardId: number; bannerId?: number },
  signal: AbortSignal,
) {
  let html = result.html_content ?? "",
    style = result.style_content ?? "",
    script = result.script_content ?? "";
  const slots = [
    ...new Set(`${html}${style}${script}`.match(/\{image-[1-4]\}/g) ?? []),
  ];
  for (const slot of slots) {
    checkSignal(signal);
    const response = owner.bannerId
      ? await api.getBannerFile({
          banner_id: owner.bannerId,
          file_name: slot.slice(1, -1),
        })
      : await readFile({
          link_app: "board",
          link_name: "board",
          link_value: owner.boardId,
          link_data: slot.slice(1, -1),
          include_property: true,
        });
    checkSignal(signal);
    const content = response.file_content ?? "";
    const format =
      "file_format" in response
        ? String(response.file_format ?? "")
        : "property_list" in response
          ? response.property_list?.find((p) => p.key === "file_format")?.value
          : "";
    const url = content
      ? `data:${imageMime(content, format)};base64,${content}`
      : "";
    html = html.split(slot).join(url);
    style = style.split(slot).join(url);
    script = script.split(slot).join(url);
  }
  return { html_content: html, style_content: style, script_content: script };
}
export async function loadComponent(
  component: BoardComponentRow,
  args: ArgValueRow[],
  width: number,
  height: number,
  themeName: string,
  decoration: boolean,
  signal: AbortSignal,
) {
  checkSignal(signal);
  if (!nativeType(component.component_type))
    throw new Error("本版不加载该组件类型");
  const id = positiveId(component.board_component_id);
  if (!id) throw new Error("组件实例 ID 无效");
  const built = await api.buildBoardComponent({
    board_component_id: id,
    arg_list: args,
    theme_name: themeName,
    container_width: String(Math.max(1, Math.round(width))),
    container_height: String(Math.max(1, Math.round(height))),
    container_unit: "px",
    use_decoration: decoration,
  });
  checkSignal(signal);
  const result = await resolvePictures(
    built,
    { boardId: component.board_id! },
    signal,
  );
  if (component.component_type === "CHART") return { result };
  const columns =
    (await api.getBoardComponentColList({ board_component_id: id })).row_list ??
    [];
  checkSignal(signal);
  if (component.component_type === "FORM") {
    const fields = [];
    for (const col of columns) {
      if (!col.col_code) continue;
      fields.push({
        column: col,
        value: await readVariable(id, col.col_code, args, signal),
      });
    }
    return { result, fields };
  }
  const value = await readVariable(id, "data", args, signal);
  const rows = dataRows(value);
  const thresholds =
    (await api.getBoardComponentColThresholdList({ board_component_id: id }))
      .row_list ?? [];
  checkSignal(signal);
  const groups: Record<string, BoardComponentColThresholdRow[]> = {};
  for (const row of thresholds)
    if (row.col_code) (groups[row.col_code] ??= []).push(row);
  return { result, columns, rows, thresholds: groups };
}
export type ComponentData = Awaited<ReturnType<typeof loadComponent>>;
export async function loadBindings(
  component: BoardComponentRow,
  signal: AbortSignal,
) {
  const id = positiveId(component.board_component_id);
  if (!id) throw new Error("组件实例 ID 无效");
  checkSignal(signal);
  const result = await api.getBoardComponentExtList({ board_component_id: id });
  checkSignal(signal);
  return componentBindings(
    component.component_type as "METRIC" | "REPORT",
    result.row_list ?? [],
  );
}
