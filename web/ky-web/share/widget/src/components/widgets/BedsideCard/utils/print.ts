import { message } from "antd";
import axios from "axios";
import { request } from "comm/request";

async function fetchPdfBlob(url: string) {
  const blob = await request.get<Blob>(url, {
    responseType: "blob",
    timeout: 120000,
  });
  return blob instanceof Blob
    ? blob
    : new Blob([blob], { type: "application/pdf" });
}

function resolvePrintPdfUrl(url: string) {
  if (/^https?:\/\//i.test(url)) return url;
  const path = url.startsWith("/") ? url : `/api/${url}`;
  return new URL(path, window.location.origin).href;
}

/** 静默打印：GET 生成 PDF 后，把该 GET 的绝对 url 交给本机 7890 */
export async function print(url: string) {
  try {
    await fetchPdfBlob(url);
    const res = await axios.post("http://localhost:7890/print", {
      pdf: resolvePrintPdfUrl(url),
    });
    if (res.data.Code === "0") {
      message.success("打印成功!");
    }
  } catch (error) {
    console.log("error: ", error);
    message.error("打印失败");
    throw error;
  }
}
