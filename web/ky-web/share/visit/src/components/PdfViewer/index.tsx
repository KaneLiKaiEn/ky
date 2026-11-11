import React, { useEffect, useRef, useState } from "react";
import { Empty, Spin } from "antd";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import type { PDFDocumentProxy } from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import "./index.scss";

GlobalWorkerOptions.workerSrc = pdfWorker;

export interface PdfViewerProps {
  /** PDF 的 Object URL 或远程地址 */
  src: string | null;
  className?: string;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ src, className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.replaceChildren();

    if (!src) {
      setLoading(false);
      setError(false);
      return;
    }

    let cancelled = false;
    let pdfDoc: PDFDocumentProxy | null = null;

    setLoading(true);
    setError(false);

    const render = async () => {
      try {
        const loadingTask = getDocument(src);
        pdfDoc = await loadingTask.promise;
        if (cancelled) return;

        for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum += 1) {
          const page = await pdfDoc.getPage(pageNum);
          if (cancelled) return;

          const viewportWidth = container.clientWidth || 800;
          const unscaled = page.getViewport({ scale: 1 });
          const scale = viewportWidth / unscaled.width;
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement("canvas");
          canvas.className = "pdf-viewer__page";
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          container.appendChild(canvas);

          const context = canvas.getContext("2d");
          if (!context) continue;

          await page.render({
            canvas,
            canvasContext: context,
            viewport,
          }).promise;
          if (cancelled) return;
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void render();

    return () => {
      cancelled = true;
      void pdfDoc?.destroy();
      container.replaceChildren();
    };
  }, [src]);

  const rootClass = ["pdf-viewer", className].filter(Boolean).join(" ");
  const showEmpty = !src || error;

  return (
    <div className={rootClass}>
      {loading && (
        <div className="pdf-viewer__loading">
          <Spin description="加载中..." />
        </div>
      )}
      {showEmpty && !loading && (
        <div className="pdf-viewer__empty">
          <Empty description={error ? "文档加载失败" : "暂无文档"} />
        </div>
      )}
      <div
        ref={containerRef}
        className="pdf-viewer__pages"
        style={{
          display: showEmpty ? "none" : "flex",
          visibility: loading ? "hidden" : "visible",
        }}
      />
    </div>
  );
};

export default PdfViewer;
