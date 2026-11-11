import {
  base64Blob as sharedBase64Blob,
  fileBase64 as sharedFileBase64,
} from "comm/utils";

export const base64Blob = (content: string, mime: string): Blob =>
  sharedBase64Blob(content, mime, "文件内容不是 base64 字符串");
export const fileBase64 = (file: File): Promise<string> =>
  sharedFileBase64(file, "读取文件失败");

export function validateUpload(
  file: Pick<File, "name" | "size" | "type">,
  kind: "content" | "style",
) {
  const valid =
    kind === "content"
      ? /\.pdf$/i.test(file.name) &&
        (!file.type || file.type === "application/pdf")
      : /\.xlsx$/i.test(file.name);
  if (!valid)
    throw new Error(
      kind === "content" ? "请选择 PDF 文件" : "请选择 XLSX 样式模板",
    );
  if (kind === "content" && file.size > 10 * 1024 * 1024)
    throw new Error("PDF 文件不能超过 10 MB");
}
export function download(content: string, filename: string, mime: string) {
  const url = URL.createObjectURL(base64Blob(content, mime));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename.replace(/[\\/:*?"<>|]/g, "_");
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
