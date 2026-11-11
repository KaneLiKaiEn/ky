import { useEffect, useRef, useState } from "react";
import { Alert, Button, Select, Space, Spin } from "antd";
import type {
  PDFDocumentProxy,
  PDFDocumentLoadingTask,
  RenderTask,
} from "pdfjs-dist";
import { base64Blob } from "../../../utils/media";
import { errorText } from "comm/utils";
import { downloadBlob } from "../files";

const pdfAssetsPath = import.meta.env.DEV
  ? "/report-pdf-assets/"
  : "../report-pdf-assets/";
const assetBase = new URL(/* @vite-ignore */ pdfAssetsPath, import.meta.url)
  .href;
// Use .js so ordinary Nginx MIME tables serve the module worker as JavaScript.
const workerUrl = `${assetBase}pdf.worker.min.js`;

export default function PdfViewer({
  content,
  name,
}: {
  content: string;
  name: string;
}) {
  const [url, setUrl] = useState(""),
    [document, setDocument] = useState<PDFDocumentProxy>();
  const [error, setError] = useState<string>(),
    [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1),
    [zoom, setZoom] = useState<number | "fit">("fit");
  const [width, setWidth] = useState(600),
    [text, setText] = useState("");
  const container = useRef<HTMLDivElement>(null),
    canvas = useRef<HTMLCanvasElement>(null);
  const nativeFrame = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const resize = () => setWidth(Math.max(240, element.clientWidth - 24));
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    let disposed = false,
      objectUrl = "",
      task: PDFDocumentLoadingTask | undefined;
    setDocument(undefined);
    setPage(1);
    setError(undefined);
    setLoading(true);
    setUrl("");
    void (async () => {
      try {
        const blob = base64Blob(content, "application/pdf");
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
        const pdfjs = await import("pdfjs-dist");
        if (disposed) return;
        pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
        task = pdfjs.getDocument({
          url: objectUrl,
          cMapUrl: `${assetBase}cmaps/`,
          cMapPacked: true,
          standardFontDataUrl: `${assetBase}standard_fonts/`,
          wasmUrl: `${assetBase}wasm/`,
          useSystemFonts: true,
        });
        const next = await task.promise;
        if (!disposed) setDocument(next);
      } catch (err) {
        if (!disposed) {
          setError(errorText(err));
          setLoading(false);
        }
      }
    })();
    return () => {
      disposed = true;
      if (task) void task.destroy().catch(() => {});
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [content]);
  useEffect(() => {
    if (!document || !canvas.current) return;
    let disposed = false,
      task: RenderTask | undefined;
    setLoading(true);
    setError(undefined);
    setText("");
    void (async () => {
      try {
        const pdfPage = await document.getPage(page);
        if (disposed || !canvas.current) return;
        const original = pdfPage.getViewport({ scale: 1 });
        const viewport = pdfPage.getViewport({
          scale: zoom === "fit" ? width / original.width : zoom,
        });
        const ratio = Math.min(2, window.devicePixelRatio || 1),
          element = canvas.current;
        element.width = Math.floor(viewport.width * ratio);
        element.height = Math.floor(viewport.height * ratio);
        element.style.width = `${viewport.width}px`;
        element.style.height = `${viewport.height}px`;
        task = pdfPage.render({
          canvas: element,
          viewport,
          transform: ratio === 1 ? undefined : [ratio, 0, 0, ratio, 0, 0],
        });
        await task.promise;
        if (disposed) return;
        const textContent = await pdfPage.getTextContent();
        if (!disposed)
          setText(
            textContent.items
              .map((item) => ("str" in item ? item.str : ""))
              .join(" "),
          );
      } catch (err) {
        if (!disposed) setError(errorText(err));
      } finally {
        if (!disposed) setLoading(false);
      }
    })();
    return () => {
      disposed = true;
      task?.cancel();
    };
  }, [document, page, zoom, width]);
  return (
    <div className="rp-pdf">
      <Space wrap className="rp-pdf-actions">
        <Button
          disabled={!url}
          onClick={() =>
            downloadBlob(base64Blob(content, "application/pdf"), `${name}.pdf`)
          }
        >
          下载 PDF
        </Button>
        <Button
          disabled={!url}
          onClick={() => {
            nativeFrame.current?.contentWindow?.focus();
            nativeFrame.current?.contentWindow?.print();
          }}
        >
          打印 PDF
        </Button>
        <Button
          disabled={!document || page <= 1 || loading}
          onClick={() => setPage(page - 1)}
        >
          上一页
        </Button>
        <span aria-label="PDF 页码">
          第 {document ? page : 0} / {document?.numPages || 0} 页
        </span>
        <Button
          disabled={!document || page >= document.numPages || loading}
          onClick={() => setPage(page + 1)}
        >
          下一页
        </Button>
        <Select<number | "fit">
          aria-label="PDF 缩放"
          value={zoom}
          onChange={setZoom}
          options={[
            { value: "fit", label: "适应宽度" },
            ...[0.75, 1, 1.25, 1.5, 2].map((value) => ({
              value,
              label: `${value * 100}%`,
            })),
          ]}
        />
      </Space>
      {error && <Alert type="error" title="PDF 加载失败" description={error} />}
      <div ref={container} className="rp-pdf-pages">
        <Spin spinning={loading}>
          <canvas
            ref={canvas}
            role="img"
            aria-label={`${name} PDF 第 ${page} 页`}
          />
          <p className="rp-sr-only">{text}</p>
        </Spin>
      </div>
      {url && (
        <iframe
          className="rp-native-pdf"
          ref={nativeFrame}
          src={url}
          title={`${name} 原生 PDF 打印`}
        />
      )}
    </div>
  );
}
