import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import type { EChartsOption } from "echarts";
import type { EChartsType } from "echarts/core";
import { usePreviewTheme } from "../theme";
export interface ChartHandle {
  image: () => string | undefined;
}
const Chart = forwardRef<
  ChartHandle,
  { option: EChartsOption; height?: number; label: string }
>(({ option, height = 250, label }, ref) => {
  const { chart: colors } = usePreviewTheme();
  const shownOption = useMemo(
    () => readableOption(option, colors),
    [option, colors],
  );
  const node = useRef<HTMLDivElement>(null),
    chart = useRef<EChartsType | undefined>(undefined);
  const latest = useRef(shownOption),
    [error, setError] = useState<string>();
  latest.current = shownOption;
  useImperativeHandle(
    ref,
    () => ({
      image: () =>
        chart.current?.getDataURL({
          type: "png",
          pixelRatio: 2,
          backgroundColor: colors.background,
        }),
    }),
    [colors.background],
  );
  useEffect(() => {
    let alive = true,
      frame: number | undefined;
    const observer = new ResizeObserver(() => {
      if (frame != null) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        chart.current?.resize();
      });
    });
    if (node.current) observer.observe(node.current);
    void import("../chartsRuntime")
      .then((runtime) => {
        if (!alive || !node.current) return;
        const instance = runtime.init(node.current);
        chart.current = instance;
        instance.setOption(latest.current, { notMerge: true });
      })
      .catch((error) => {
        if (alive) setError(String(error));
      });
    return () => {
      alive = false;
      observer.disconnect();
      if (frame != null) cancelAnimationFrame(frame);
      chart.current?.dispose();
      chart.current = undefined;
    };
  }, []);
  useEffect(() => {
    chart.current?.setOption(shownOption, { notMerge: true });
  }, [shownOption]);
  return (
    <div
      className="mp-chart"
      ref={node}
      role="img"
      aria-label={label}
      style={{ height }}
    >
      {error && <span role="alert">{error}</span>}
    </div>
  );
});
export default Chart;

export function readableOption(
  option: EChartsOption,
  colors: ReturnType<typeof usePreviewTheme>["chart"],
): EChartsOption {
  const record = (value: unknown) =>
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  const each = (
    value: unknown,
    paint: (item: Record<string, unknown>) => Record<string, unknown>,
  ) =>
    Array.isArray(value)
      ? value.map((item) => paint(record(item)))
      : value
        ? paint(record(value))
        : value;
  const axis = (item: Record<string, unknown>) => ({
    ...item,
    axisLabel: { ...record(item.axisLabel), color: colors.text },
    nameTextStyle: { ...record(item.nameTextStyle), color: colors.text },
    axisLine: {
      ...record(item.axisLine),
      lineStyle: {
        ...record(record(item.axisLine).lineStyle),
        color: colors.axis,
      },
    },
    splitLine: {
      ...record(item.splitLine),
      lineStyle: {
        ...record(record(item.splitLine).lineStyle),
        color: colors.grid,
      },
    },
  });
  return {
    ...(colors.palette ? { color: colors.palette } : {}),
    ...option,
    textStyle: { ...option.textStyle, color: colors.text },
    tooltip: each(option.tooltip, (item) => ({
      ...item,
      backgroundColor: colors.tooltipBackground,
      borderColor: colors.axis,
      textStyle: { ...record(item.textStyle), color: colors.text },
    })),
    xAxis: each(option.xAxis, axis),
    yAxis: each(option.yAxis, axis),
    legend: each(option.legend, (item) => ({
      ...item,
      textStyle: { ...record(item.textStyle), color: colors.text },
    })),
    series: each(option.series, (item) => ({
      ...item,
      label: { ...record(item.label), color: colors.text },
    })),
  } as EChartsOption;
}
