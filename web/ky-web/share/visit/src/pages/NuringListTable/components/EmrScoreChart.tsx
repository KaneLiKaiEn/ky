import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import dayjs from "dayjs";
import type { ElemOptionRow } from "@/types/elem";
import type { EmrRow } from "@/types/emr";

const themeColor = (name: string, fallback: string) => {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
};

/** 把配置里的颜色（含 var(--xxx)）解析成画布能用的颜色 */
const resolveCssColor = (color: string | undefined, fallback: string) => {
  if (!color) return fallback;
  const probe = document.createElement("span");
  probe.style.color = color;
  document.body.appendChild(probe);
  const resolved = getComputedStyle(probe).color;
  probe.remove();
  return resolved && resolved !== "rgba(0, 0, 0, 0)" ? resolved : fallback;
};

interface EmrScoreChartProps {
  emrList: EmrRow[];
  elemOptions?: ElemOptionRow[];
}

export default function EmrScoreChart({
  emrList,
  elemOptions = [],
}: EmrScoreChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    const element = chartRef.current;
    if (!element) return;
    const chart = echarts.init(element);
    chartInstance.current = chart;
    const observer = new ResizeObserver(() => {
      chart.resize();
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
      chart.dispose();
      chartInstance.current = null;
    };
  }, []);

  useEffect(() => {
    const chart = chartInstance.current;
    if (!chart) return;

    const sorted = [...emrList].sort((a, b) =>
      (a.emr_time ?? "").localeCompare(b.emr_time ?? ""),
    );
    const xData = sorted.map((item) =>
      item.emr_time ? dayjs(item.emr_time).format("MM-DD HH:mm") : "",
    );
    const yData = sorted.map((item) =>
      item.assess_score != null ? item.assess_score : null,
    );
    const sortedOptions = [...elemOptions]
      .filter((option) => option.option_score != null)
      .sort((a, b) => (a.option_score ?? 0) - (b.option_score ?? 0));

    const scoreValues = [
      ...yData.filter((value): value is number => value != null),
      ...sortedOptions.map((option) => option.option_score as number),
    ];
    const yMin = 0;
    const yMax = scoreValues.length ? Math.max(...scoreValues) : 1;

    const markAreaData = sortedOptions.map((option, index) => {
      const score = option.option_score as number;
      const prevScore =
        index > 0 ? (sortedOptions[index - 1].option_score as number) : null;
      const low = prevScore != null && index > 0 ? prevScore : yMin;
      const high = score != null ? score : yMax;
      const color = resolveCssColor(
        option.option_note,
        themeColor("--app-theme-primary", "#1677ff"),
      );
      return [
        {
          yAxis: low,
          itemStyle: { color, opacity: 0.12 },
          label: {
            show: true,
            position: "insideLeft" as const,
            formatter: option.option_text ?? "",
            color: themeColor("--app-theme-text-white", "#fff"),
            fontSize: 11,
            padding: [2, 6],
            borderRadius: 2,
            backgroundColor: color,
            verticalAlign: "middle" as const,
          },
        },
        { yAxis: high },
      ];
    });

    const lineColor = themeColor("--app-theme-primary", "#1677ff");
    const splitColor = themeColor("--app-theme-border", "#e8e8e8");

    chart.setOption({
      tooltip: {
        trigger: "axis",
        formatter: (
          params: {
            dataIndex: number;
            axisValue: string;
            value: number | null;
          }[],
        ) => {
          const point = params[0];
          const score = point?.value != null ? point.value : "-";
          return `${point?.axisValue ?? ""}<br/>分值: ${score}`;
        },
      },
      grid: {
        left: "8%",
        right: "4%",
        bottom: "22%",
        top: "12%",
      },
      xAxis: {
        type: "category",
        data: xData,
        axisLabel: {
          rotate: 30,
          fontSize: 10,
          interval: 0,
        },
      },
      yAxis: {
        type: "value",
        name: "分值",
        nameTextStyle: { fontSize: 11 },
        min: yMin,
        max: yMax,
        minInterval: 1,
        splitLine: {
          show: true,
          lineStyle: { type: "dashed", color: splitColor },
        },
      },
      dataZoom: [
        { type: "inside", start: 0, end: 50 },
        { start: 0, end: 100 },
      ],
      series: [
        {
          name: "评估分值",
          type: "line",
          data: yData,
          smooth: true,
          symbol: "circle",
          symbolSize: 7,
          lineStyle: { width: 2 },
          label: {
            show: true,
            position: "top",
            fontSize: 11,
          },
          itemStyle: { color: lineColor },
          markArea: {
            silent: true,
            data: markAreaData,
          },
        },
      ],
    });
    chart.resize();
  }, [emrList, elemOptions]);

  return <div ref={chartRef} className="h-full w-full" />;
}
