import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import type { ObserveRow } from "@/types/care";
import { formatObserveTime } from "../utils/format";

interface VitalSignLineChartProps {
  data: ObserveRow[];
  className?: string;
  minHeight?: number;
}

const VitalSignLineChart: React.FC<VitalSignLineChartProps> = ({
  data,
  className,
  minHeight = 48,
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstanceRef.current) {
      chartInstanceRef.current = echarts.init(chartRef.current);
    }
    const chart = chartInstanceRef.current;
    chart.resize();

    if (!data.length) {
      chart.clear();
      return;
    }

    const times = data.map((row) => formatObserveTime(row.observe_time ?? "") ?? "");
    const values = data.map((row) => Number.parseFloat(row.observe_value ?? "0"));

    const option: echarts.EChartsOption = {
      grid: { left: 4, right: 4, top: 12, bottom: 4, containLabel: false },
      tooltip: {
        show: true,
        trigger: "axis",
        confine: true,
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        textStyle: { fontSize: 12, color: "#333" },
        extraCssText: "box-shadow: 0 2px 10px rgba(0,0,0,0.1); border: none;",
      },
      xAxis: { type: "category", show: false, data: times },
      yAxis: {
        type: "value",
        show: false,
        min: (value) => value.min - (value.max - value.min) * 0.5,
        max: (value) => value.max + (value.max - value.min) * 0.5,
      },
      series: [
        {
          data: values,
          type: "line",
          smooth: 0.4,
          showSymbol: true,
          symbol: "circle",
          symbolSize: 5,
          showAllSymbol: true,
          itemStyle: {
            color: "#ff4d4f",
            borderColor: "#fff",
            borderWidth: 2,
          },
          emphasis: { scale: 1.4 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "rgba(255, 77, 79, 0.2)" },
              { offset: 1, color: "rgba(255, 77, 79, 0)" },
            ]),
          },
          lineStyle: { color: "#ff4d4f", width: 2 },
        },
      ],
    };

    chart.setOption(option, true);

    const resizeObserver = new ResizeObserver(() => chart.resize());
    resizeObserver.observe(chartRef.current);
    const handleWindowResize = () => chart.resize();
    window.addEventListener("resize", handleWindowResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleWindowResize);
    };
  }, [data]);

  useEffect(
    () => () => {
      chartInstanceRef.current?.dispose();
      chartInstanceRef.current = null;
    },
    [],
  );

  return (
    <div
      ref={chartRef}
      className={className}
      style={{ width: "100%", height: "100%", minHeight }}
    />
  );
};

export default VitalSignLineChart;
