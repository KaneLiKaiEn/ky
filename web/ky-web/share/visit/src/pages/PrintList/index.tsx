import { message } from "antd";
import axios from "axios";
import { request } from "comm/request";
import dayjs from "dayjs";
import { savePrintDoc } from "@/api/doc";
import type { SavePrintDocReq } from "@/types/doc";

function pickQueryValue(query: URLSearchParams, key: string) {
  const value = query.get(key);
  return value == null || value === "" ? undefined : value;
}

function pickQueryNumber(query: URLSearchParams, key: string) {
  const value = pickQueryValue(query, key);
  if (value == null) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

/** visit2/{session_id}/EMR|REC/{id}：id 即 emr_id 或 rec_id */
function parseVisit2Owner(
  url: string,
): Pick<SavePrintDocReq, "owner_type" | "owner_id"> | null {
  const path = url.split("?")[0]?.split("#")[0] ?? "";
  const match = path.match(/\/visit2\/([^/]+)\/(EMR|REC)\/([^/]+)\/?$/i);
  if (!match) return null;
  const owner_id = Number(decodeURIComponent(match[3]));
  if (!Number.isFinite(owner_id)) return null;
  return { owner_type: match[2].toUpperCase(), owner_id };
}

/** 从打印 GET url 解析 SavePrintDoc 参数；visit_id/doc_type/doc_name 缺一，且不是 visit2 EMR/REC，则不保存 */
function buildSavePrintDocParams(url: string): SavePrintDocReq | null {
  const queryIndex = url.indexOf("?");
  const query = new URLSearchParams(
    queryIndex >= 0 ? url.slice(queryIndex + 1) : "",
  );
  const visit_id = pickQueryNumber(query, "visit_id");
  const doc_type = pickQueryValue(query, "doc_type");
  const doc_name = pickQueryValue(query, "doc_name");
  const doc_tag = pickQueryValue(query, "doc_tag");
  const owner = parseVisit2Owner(url);
  if ((visit_id == null || !doc_type || !doc_name) && !owner) return null;
  return {
    ...owner,
    visit_id,
    doc_type,
    doc_name,
    doc_tag,
    link_name: pickQueryValue(query, "link_name"),
    link_value: pickQueryNumber(query, "link_value"),
    link_data: pickQueryValue(query, "link_data"),
    link_tag: pickQueryValue(query, "link_tag"),
    link_ext: pickQueryValue(query, "link_ext"),
    print_time: dayjs().format("YYYY-MM-DD HH:mm:ss"),
  };
}

type PrintSaveExtra = {
  doc_type?: string;
  doc_name?: string;
  doc_tag?: string;
};

/** 仅用于 SavePrintDoc：query 里没有的 doc 字段用调用方补充，不改实际打印地址 */
function withPrintSaveQuery(url: string, extra?: PrintSaveExtra) {
  if (!extra) return url;
  const queryIndex = url.indexOf("?");
  const path = queryIndex >= 0 ? url.slice(0, queryIndex) : url;
  const search = new URLSearchParams(
    queryIndex >= 0 ? url.slice(queryIndex + 1) : "",
  );
  (["doc_type", "doc_name", "doc_tag"] as const).forEach((key) => {
    const value = extra[key];
    if (value && !search.has(key)) search.set(key, value);
  });
  const qs = search.toString();
  return qs ? `${path}?${qs}` : path;
}

async function trySavePrintDoc(url: string, extra?: PrintSaveExtra) {
  const saveParams = buildSavePrintDocParams(withPrintSaveQuery(url, extra));
  if (!saveParams) {
    console.warn(
      "SavePrintDoc skipped: visit_id/doc_type/doc_name 不完整，且不是 visit2/EMR|REC",
      url,
    );
    return;
  }
  try {
    await savePrintDoc(saveParams);
  } catch (saveError) {
    console.log("savePrintDoc error: ", saveError);
  }
}

const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46]; // %PDF

function isPdfMagic(bytes: Uint8Array) {
  return (
    bytes.length >= PDF_MAGIC.length &&
    PDF_MAGIC.every((b, i) => bytes[i] === b)
  );
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** 将 /doc 的非 PDF 响应转成可读错误文案 */
function formatPrintError(text: string) {
  const trimmed = text.replace(/^\uFEFF/, "").trim();
  if (!trimmed) return "文档没有内容";
  if (/^\s*<(!DOCTYPE\s+html|html[\s>])/i.test(trimmed)) {
    return "文档没有内容";
  }
  // 例如：text/plain%!(EXTRA string=Content: Code=-99, Message=中医科没有[...]的临床文档模板(-99))
  const messageMatch = trimmed.match(/Message=([\s\S]+)/);
  if (messageMatch) {
    return messageMatch[1].replace(/\)+\s*$/, "").trim();
  }
  return trimmed;
}

function buildErrorHtml(text: string) {
  const body = escapeHtml(formatPrintError(text));
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>打印预览</title>
<style>
  body{font-family:sans-serif;padding:24px;font-size:14px;color:#333;white-space:pre-wrap;word-break:break-word;line-height:1.6}
</style></head><body>${body}</body></html>`;
}

async function blobFromUnknown(data: unknown): Promise<Blob | null> {
  if (data instanceof Blob) return data;
  if (typeof data === "string") {
    return new Blob([data], { type: "text/plain;charset=utf-8" });
  }
  return null;
}

async function fetchPdfBlob(url: string) {
  const blob = await request.get<Blob>(url, {
    responseType: "blob",
    timeout: 120000,
  });
  const raw = blob instanceof Blob ? blob : new Blob([blob as BlobPart]);
  return raw.type === "application/pdf"
    ? raw
    : new Blob([raw], { type: "application/pdf" });
}

async function fetchPreviewBlob(url: string) {
  try {
    const data = await request.get<Blob>(url, {
      responseType: "blob",
      timeout: 120000,
    });
    return data instanceof Blob ? data : new Blob([data as BlobPart]);
  } catch (error) {
    const data = (error as { response?: { data?: unknown } })?.response?.data;
    const blob = await blobFromUnknown(data);
    if (blob) return blob;
    const msg = (error as { message?: string })?.message || "打印预览失败";
    return new Blob([msg], { type: "text/plain;charset=utf-8" });
  }
}

let activePreviewCleanup: (() => void) | null = null;

function createHiddenPrintIframe() {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "none";
  iframe.setAttribute("aria-hidden", "true");
  document.body.appendChild(iframe);
  return iframe;
}

function addListener(
  target: EventTarget | null | undefined,
  type: string,
  handler: EventListener,
  unsubs: Array<() => void>,
  options?: boolean | AddEventListenerOptions,
) {
  if (!target) return;
  try {
    target.addEventListener(type, handler, options);
    unsubs.push(() => {
      try {
        target.removeEventListener(type, handler, options);
      } catch {
        // ignore
      }
    });
  } catch {
    // ignore
  }
}

/**
 * PDF iframe 常不触发 afterprint，且 print() 可能立即返回，需综合侦测对话框关闭。
 * 关闭后立刻 revoke Blob URL、移除 iframe。
 */
function startPrintAndWatchClose(
  iframe: HTMLIFrameElement,
  onClosed: () => void,
  unsubs: Array<() => void>,
) {
  let iframeWin: Window | null = null;
  try {
    iframeWin = iframe.contentWindow;
  } catch {
    iframeWin = null;
  }
  if (!iframeWin) {
    throw new Error("无法访问打印窗口");
  }

  const handleClosed: EventListener = () => onClosed();
  addListener(window, "afterprint", handleClosed, unsubs);
  addListener(iframeWin, "afterprint", handleClosed, unsubs);
  try {
    iframeWin.onafterprint = handleClosed;
    unsubs.push(() => {
      try {
        if (iframeWin) iframeWin.onafterprint = null;
      } catch {
        // ignore
      }
    });
  } catch {
    // ignore
  }

  let blurred = false;
  addListener(
    window,
    "blur",
    () => {
      blurred = true;
    },
    unsubs,
  );

  iframeWin.focus();
  const started = Date.now();
  iframeWin.print();
  // 阻塞式打印对话框：print() 返回即表示已关闭
  if (Date.now() - started > 300) {
    onClosed();
    return;
  }

  const armTimer = window.setTimeout(() => {
    const capture = true;
    addListener(window, "focus", handleClosed, unsubs, capture);
    addListener(document, "mouseover", handleClosed, unsubs, capture);
    addListener(document, "mousemove", handleClosed, unsubs, capture);
    addListener(document, "pointerdown", handleClosed, unsubs, capture);
    addListener(document, "keydown", handleClosed, unsubs, capture);
    addListener(iframeWin, "focus", handleClosed, unsubs, capture);

    const poll = window.setInterval(() => {
      if (blurred && document.hasFocus()) {
        window.clearInterval(poll);
        onClosed();
      }
    }, 250);
    unsubs.push(() => window.clearInterval(poll));
  }, 500);
  unsubs.push(() => window.clearTimeout(armTimer));
}

function printInIframe(src: string, options?: { html?: string }) {
  activePreviewCleanup?.();

  let iframe: HTMLIFrameElement | null = createHiddenPrintIframe();
  let cleaned = false;
  let heldUrl: string | null = src.startsWith("blob:") ? src : null;
  const unsubs: Array<() => void> = [];

  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    if (activePreviewCleanup === cleanup) activePreviewCleanup = null;

    unsubs.forEach((unsub) => unsub());
    unsubs.length = 0;

    if (iframe) {
      try {
        iframe.onload = null;
        iframe.src = "about:blank";
        iframe.remove();
      } catch {
        // ignore
      }
      iframe = null;
    }

    if (heldUrl) {
      URL.revokeObjectURL(heldUrl);
      heldUrl = null;
    }

    try {
      window.focus();
    } catch {
      // ignore
    }
  };
  activePreviewCleanup = cleanup;

  const fallbackTimer = window.setTimeout(cleanup, 120_000);
  unsubs.push(() => window.clearTimeout(fallbackTimer));

  const runPrint = () => {
    window.setTimeout(() => {
      try {
        if (!iframe || cleaned) return;
        startPrintAndWatchClose(iframe, cleanup, unsubs);
      } catch (error) {
        console.log("printPreview error: ", error);
        message.error("打印预览失败");
        cleanup();
      }
    }, 250);
  };

  if (options?.html) {
    try {
      const doc = iframe.contentDocument;
      if (!doc) {
        cleanup();
        message.error("打印预览失败");
        return;
      }
      doc.open();
      doc.write(options.html);
      doc.close();
      runPrint();
    } catch (error) {
      console.log("printPreview error: ", error);
      message.error("打印预览失败");
      cleanup();
    }
    return;
  }

  iframe.onload = () => runPrint();
  iframe.src = src;
}

async function printPdfInIframe(blob: Blob) {
  const pdf =
    blob.type === "application/pdf"
      ? blob
      : new Blob([blob], { type: "application/pdf" });
  const objectUrl = URL.createObjectURL(pdf);
  printInIframe(objectUrl);
}

function printErrorInIframe(text: string) {
  printInIframe("about:blank", { html: buildErrorHtml(text) });
}

/** 还原 request.get 实际请求的绝对地址，供本机 7890 拉取（不能传 blob:） */
function resolvePrintPdfUrl(url: string) {
  if (/^https?:\/\//i.test(url)) return url;
  const path = url.startsWith("/") ? url : `/api/${url}`;
  return new URL(path, window.location.origin).href;
}

/** 静默打印：GET 生成 PDF 后，把该 GET 的绝对 url 交给本机 7890 */
export async function print(url: string, saveExtra?: PrintSaveExtra) {
  try {
    await fetchPdfBlob(url);
    const res = await axios.post<{
      code?: number | string;
      Code?: number | string;
    }>("http://localhost:7890/print", { pdf: resolvePrintPdfUrl(url) });
    const code = res.data?.code ?? res.data?.Code;
    if (code === 0) {
      await trySavePrintDoc(url, saveExtra);
      message.success("打印成功!");
    }
  } catch (error) {
    console.log("error: ", error);
    message.error("打印失败");
    throw error;
  }
}

/** 打印预览：隐藏 iframe 加载 PDF/错误文案后直接调起浏览器打印对话框 */
export async function printPreview(url: string) {
  try {
    const blob = await fetchPreviewBlob(url);
    const head = new Uint8Array(await blob.slice(0, 8).arrayBuffer());
    if (isPdfMagic(head)) {
      await printPdfInIframe(blob);
      return;
    }
    printErrorInIframe(await blob.text());
  } catch (error) {
    console.log("error: ", error);
    printErrorInIframe(
      (error as { message?: string })?.message || "打印预览失败",
    );
  }
}

const printList = { print, printPreview };
export default printList;
