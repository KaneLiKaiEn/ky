import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button, Empty, Spin, Tooltip, message } from "antd";
import { ZoomInOutlined, ZoomOutOutlined } from "@ant-design/icons";
import { getBptChartListAPI } from "./api";
import {
  CHART_STACK_GAP_PX,
  CHART_ZOOM_MAX,
  CHART_ZOOM_MIN,
  CHART_ZOOM_STEP,
  decodeChartBytes,
} from "./utils";

function getSvgNaturalSize(svg: SVGSVGElement): { w: number; h: number } {
  const viewBox = svg.viewBox?.baseVal;
  if (viewBox && viewBox.width > 0 && viewBox.height > 0) {
    return { w: viewBox.width, h: viewBox.height };
  }
  const wAttr = svg.getAttribute("width");
  const hAttr = svg.getAttribute("height");
  const w = wAttr && !String(wAttr).endsWith("%") ? parseFloat(wAttr) : NaN;
  const h = hAttr && !String(hAttr).endsWith("%") ? parseFloat(hAttr) : NaN;
  if (w > 0 && h > 0) return { w, h };
  try {
    const box = svg.getBBox();
    if (box.width > 0 && box.height > 0) return { w: box.width, h: box.height };
  } catch {
    /* not rendered yet */
  }
  return { w: svg.clientWidth, h: svg.clientHeight };
}

export interface TemperatureSheetChartProps {
  visitId: number;
  /** 当前周次，0 = 入院第一周；showAll 时忽略 */
  page: number;
  /** 全部：请求 page_list 为 0..(totalPages-1) */
  showAll?: boolean;
  /** 总周数；showAll 时用于限定请求页码（含出院日截断后的页数） */
  totalPages?: number;
  /** 仅体温单：铺满剩余宽高，缩放整张单 */
  fill?: boolean;
  /** 左右分栏：面板宽度即缩放结果（714px = 100%），图表恰好铺满面板宽度 */
  fitWidth?: boolean;
  /** 受控缩放比例；fitWidth 模式下父组件据此调整面板宽度 */
  zoom?: number;
  /** 缩放比例变更回调（受控时必填） */
  onZoomChange?: (zoom: number) => void;
  className?: string;
  /** 变更后递增以强制重新拉取图表 */
  refreshKey?: number;
}

export interface TemperatureSheetChartHandle {
  refresh: () => void;
}

const TemperatureSheetChart = forwardRef<
  TemperatureSheetChartHandle,
  TemperatureSheetChartProps
>(function TemperatureSheetChart(
  {
    visitId,
    page,
    showAll = false,
    totalPages = 1,
    fill = false,
    fitWidth = false,
    zoom,
    onZoomChange,
    className,
    refreshKey = 0,
  },
  ref,
) {
  const [chartSvgList, setChartSvgList] = useState<string[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [innerZoom, setInnerZoom] = useState(1);
  const chartZoom = zoom ?? innerZoom;
  const updateZoom = (next: number) => {
    if (zoom != null) {
      onZoomChange?.(next);
    } else {
      setInnerZoom(next);
    }
  };
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
  const [viewportSize, setViewportSize] = useState({ w: 0, h: 0 });
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const fetchBptChartList = useCallback(async () => {
    if (!visitId) return;
    setChartLoading(true);
    try {
      const pageList = showAll
        ? Array.from({ length: Math.max(1, totalPages) }, (_, i) => i)
        : [page];
      const res = await getBptChartListAPI({
        visit_id: visitId,
        chart_format: "SVG",
        page_list: pageList,
      });
      if (res?.code === 0) {
        const list = (res.chart_list || [])
          .map(decodeChartBytes)
          .filter(Boolean);
        setChartSvgList(list);
      } else {
        message.error(
          `${res?.message || "获取体温单图表失败"}${res?.hint ? `（${res.hint}）` : ""}`,
        );
      }
    } catch {
      message.error("获取体温单图表失败");
    } finally {
      setChartLoading(false);
    }
  }, [visitId, page, showAll, totalPages]);

  useImperativeHandle(ref, () => ({ refresh: fetchBptChartList }), [
    fetchBptChartList,
  ]);

  useEffect(() => {
    fetchBptChartList();
  }, [fetchBptChartList, refreshKey]);

  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el || chartSvgList.length === 0) {
      setNaturalSize({ w: 0, h: 0 });
      return;
    }
    const svgs = Array.from(el.querySelectorAll("svg"));
    if (svgs.length === 0) return;
    let maxW = 0;
    let totalH = 0;
    svgs.forEach((svg, index) => {
      const { w, h } = getSvgNaturalSize(svg);
      svg.setAttribute("width", String(w));
      svg.setAttribute("height", String(h));
      svg.style.width = `${w}px`;
      svg.style.height = `${h}px`;
      maxW = Math.max(maxW, w);
      totalH += h;
      if (index > 0) totalH += CHART_STACK_GAP_PX;
    });
    if (maxW > 0 && totalH > 0) setNaturalSize({ w: maxW, h: totalH });
  }, [chartSvgList]);

  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const update = () => {
      setViewportSize({ w: el.clientWidth, h: el.clientHeight });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [chartLoading, fill, chartSvgList.length]);

  const fitScale = useMemo(() => {
    if (naturalSize.w <= 0 || naturalSize.h <= 0) return 1;
    if (viewportSize.w <= 0 || viewportSize.h <= 0) return 1;
    if (fill) {
      return Math.min(
        viewportSize.w / naturalSize.w,
        viewportSize.h / naturalSize.h,
      );
    }
    if (fitWidth) {
      return viewportSize.w / naturalSize.w;
    }
    return 1;
  }, [fill, fitWidth, naturalSize, viewportSize]);

  /** fitWidth：面板宽度已体现缩放比例（宽度 = 636 × zoom），不再重复乘 chartZoom */
  const totalScale = fitWidth ? fitScale : fitScale * chartZoom;
  const sizerW = naturalSize.w * totalScale;
  const sizerH = naturalSize.h * totalScale;
  /** 图表实际宽度未超过容器时不显示横向滚动条 */
  const showXScroll = sizerW > viewportSize.w + 1;
  const showYScroll = sizerH > viewportSize.h + 1;

  const handleZoomIn = () => {
    updateZoom(
      Math.min(
        CHART_ZOOM_MAX,
        Number((chartZoom + CHART_ZOOM_STEP).toFixed(1)),
      ),
    );
  };

  const handleZoomOut = () => {
    updateZoom(
      Math.max(
        CHART_ZOOM_MIN,
        Number((chartZoom - CHART_ZOOM_STEP).toFixed(1)),
      ),
    );
  };

  const handleZoomReset = () => {
    updateZoom(1);
  };

  return (
    <div
      className={`flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden ${className ?? ""}`}
    >
      <div className="mb-1 flex shrink-0 items-center justify-end gap-1">
        <Tooltip title="缩小">
          <Button
            size="small"
            icon={<ZoomOutOutlined />}
            disabled={chartZoom <= CHART_ZOOM_MIN}
            onClick={handleZoomOut}
          />
        </Tooltip>
        <span className="min-w-12 text-center text-sm tabular-nums">
          {Math.round(chartZoom * 100)}%
        </span>
        <Tooltip title="放大">
          <Button
            size="small"
            icon={<ZoomInOutlined />}
            disabled={chartZoom >= CHART_ZOOM_MAX}
            onClick={handleZoomIn}
          />
        </Tooltip>
        <Button
          size="small"
          disabled={chartZoom === 1}
          onClick={handleZoomReset}
        >
          重置
        </Button>
      </div>
      <div ref={viewportRef} className="relative min-h-0 min-w-0 flex-1">
        <div
          className="absolute inset-0"
          style={{
            overflowX: showXScroll ? "auto" : "hidden",
            overflowY: showYScroll ? "auto" : "hidden",
          }}
        >
          {chartLoading ? (
            <div className="flex h-full items-center justify-center">
              <Spin />
            </div>
          ) : chartSvgList.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <Empty description="暂无体温单图表" />
            </div>
          ) : (
            <div
              style={{
                width: showXScroll
                  ? sizerW
                  : fill || fitWidth
                    ? viewportSize.w || "100%"
                    : sizerW || 0,
                height: showYScroll
                  ? sizerH
                  : fill
                    ? viewportSize.h || "100%"
                    : sizerH || 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: sizerW > 0 ? sizerW : "max-content",
                  height: sizerH > 0 ? sizerH : "max-content",
                  overflow: sizerW > 0 ? "hidden" : "visible",
                }}
              >
                <div
                  ref={contentRef}
                  className="flex w-max flex-col"
                  style={{
                    gap: CHART_STACK_GAP_PX,
                    transform: `scale(${totalScale})`,
                    transformOrigin: "top left",
                  }}
                >
                  {chartSvgList.map((svg, index) => (
                    <div
                      key={index}
                      className="[&_svg]:block [&_svg]:max-w-none"
                      dangerouslySetInnerHTML={{ __html: svg }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default TemperatureSheetChart;
