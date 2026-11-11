import React, { useEffect, useMemo, useRef } from "react";
import * as echarts from "echarts";
import type { PieSeriesOption } from "echarts";
import type { BillCategoryFieldItem } from "../utils/parseBillCategoryData";
import {
  formatBillAmount,
  formatNullableBillAmount,
} from "../utils/parseBillCategoryData";

export interface BillCategoryPieChartProps {
  data: { name: string; value: number }[];
  feeFields: BillCategoryFieldItem[];
  showEmptyChart?: boolean;
  className?: string;
  minHeight?: number;
}

const LEGEND_VALUE_WIDTH = 88;

const hasChartSize = (el: HTMLElement) =>
  el.clientWidth > 0 && el.clientHeight > 0;

const BillCategoryPieChart: React.FC<BillCategoryPieChartProps> = ({
  data,
  feeFields,
  showEmptyChart = false,
  className,
  minHeight = 240,
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);

  const feeValueMap = useMemo(
    () => new Map(feeFields.map((field) => [field.key, field.value])),
    [feeFields],
  );

  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;

    let cancelled = false;

    const updateChart = () => {
      if (cancelled || !hasChartSize(el)) return;

      if (!chartInstanceRef.current) {
        chartInstanceRef.current = echarts.init(el);
      }
      const chart = chartInstanceRef.current;

      if (!feeFields.length && !showEmptyChart) {
        chart.clear();
        return;
      }

      type PieDataItem = NonNullable<PieSeriesOption["data"]>[number];

      const seriesPieData: PieDataItem[] = feeFields.map((field) => {
        const amount =
          field.value != null && field.value > 0 ? field.value : 0;
        const positive = amount > 0;

        if (!positive) {
          return {
            name: field.key,
            value: 0,
            label: { show: false },
            labelLine: { show: false },
          };
        }

        return {
          name: field.key,
          value: amount,
        };
      });

      const option: echarts.EChartsOption = {
        title: showEmptyChart ? { text: "暂无数据", left: "center", top: "middle" } : undefined,
        tooltip: data.length
          ? {
              trigger: "item",
              confine: true,
              formatter: (params) => {
                const item = params as {
                  name?: string;
                  percent?: number;
                };
                const name = item.name;
                if (!name) return "";
                const amount = feeValueMap.get(name);
                if (amount == null || amount <= 0) return "";
                return [
                  name,
                  `金额：${formatBillAmount(amount)} 元`,
                  `占比：${item.percent?.toFixed(2) ?? 0}%`,
                ].join("<br/>");
              },
            }
          : undefined,
        legend: feeFields.length
          ? {
            orient: "vertical",
            right: 0,
            top: "middle",
            selectedMode: false,
            formatter: (name) => {
              const displayValue = formatNullableBillAmount(
                feeValueMap.get(name) ?? null,
              );
              return `{label|${name}：}{value|${displayValue}}`;
            },
            textStyle: {
              rich: {
                value: {
                  width: LEGEND_VALUE_WIDTH,
                  align: "right",
                },
              },
            },
          }
          : { show: false },
        series: seriesPieData.length
          ? ([
            {
              name: "费用类型",
              type: "pie",
              center: feeFields.length ? ["38%", "50%"] : ["50%", "50%"],
              stillShowZeroSum: true,
              percentPrecision: 2,
              label: {
                formatter: "{b}：{d}%",
              },
              data: seriesPieData,
            },
          ] satisfies PieSeriesOption[])
          : [],
      };

      chart.setOption(option, true);
      chart.resize();
    };

    updateChart();

    const resizeObserver = new ResizeObserver(() => {
      if (!chartInstanceRef.current) {
        updateChart();
        return;
      }
      if (hasChartSize(el)) {
        chartInstanceRef.current.resize();
      }
    });
    resizeObserver.observe(el);
    const handleWindowResize = () => {
      if (chartInstanceRef.current && hasChartSize(el)) {
        chartInstanceRef.current.resize();
      }
    };
    window.addEventListener("resize", handleWindowResize);

    return () => {
      cancelled = true;
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleWindowResize);
    };
  }, [data.length, feeFields, feeValueMap, showEmptyChart]);

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

export default BillCategoryPieChart;
