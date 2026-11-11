import type { EChartsOption } from "echarts";
import type {
  MetricValue,
  GetMetricTrendListRes,
} from "../../types/metric.d.ts";
import { display, numberValue } from "./model";

export function sparkOption(
  data: GetMetricTrendListRes,
  years?: string[],
  transparent = false,
): EChartsOption {
  const dates = years ?? data.date_list ?? [],
    color = data.chart_color || "rgb(13,202,240)";
  return {
    animation: false,
    grid: { left: 2, right: 2, top: 2, bottom: 2 },
    tooltip: { trigger: "axis" },
    xAxis: { type: "category", show: false, data: dates },
    yAxis: { type: "value", show: false },
    series: [
      {
        type: data.chart_type === "bar" ? "bar" : "line",
        data: dates.map(
          (date) =>
            numberValue(
              data.value_list?.[(data.date_list ?? []).indexOf(date)],
            ) ?? null,
        ),
        color,
        symbol: "circle",
        symbolSize: 4,
        lineStyle: { width: 2 },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color },
              {
                offset: 1,
                color: transparent ? "rgba(0,0,0,0)" : "rgba(255,255,255,0.3)",
              },
            ],
          },
        },
      },
    ],
  };
}
export function trendOption(values: MetricValue[]): EChartsOption {
  return {
    grid: { left: 100, top: 40, right: 40, bottom: 40 },
    tooltip: { trigger: "axis" },
    xAxis: { type: "category", data: values.map((row) => row.date_name || "") },
    yAxis: { type: "value" },
    series: [
      {
        type: "line",
        data: values.map((row) => ({
          value: numberValue(row.metric_value) ?? null,
          label: {
            formatter: `${display(row.metric_value_fmt)}${row.metric_value_abbr || ""}${row.metric_value_unit || ""}`,
          },
        })),
        symbol: "circle",
        symbolSize: 6,
        label: { show: true, position: "top", fontSize: 12, color: "#333" },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 1, color: "rgb(0,221,255)" },
              { offset: 0, color: "rgb(77,119,255)" },
            ],
          },
        },
        markLine: { data: [{ name: "平均值", type: "average" }] },
      },
    ],
  };
}
export function yearsOption(
  values: MetricValue[],
  year: number,
): EChartsOption {
  const years = [year - 3, year - 2, year - 1, year];
  const map = new Map(
    values.map((value) => [value.date_name, numberValue(value.metric_value)]),
  );
  return {
    grid: { left: 100, top: 40, right: 40, bottom: 40 },
    tooltip: { trigger: "axis" },
    legend: { data: years.map(String) },
    xAxis: {
      type: "category",
      data: Array.from({ length: 12 }, (_, index) =>
        String(index + 1).padStart(2, "0"),
      ),
    },
    yAxis: { type: "value" },
    series: years.map((number) => ({
      name: String(number),
      type: "bar",
      data: Array.from(
        { length: 12 },
        (_, index) =>
          map.get(`${number}-${String(index + 1).padStart(2, "0")}`) ?? null,
      ),
    })),
  };
}
export function treemapOption(rows: MetricValue[]): EChartsOption {
  const data = rows.map((row) => ({
    name: row.metric_name,
    value: numberValue(row.metric_value) ?? 0,
  }));
  if (data.every((item) => item.value === 0)) {
    return {
      title: {
        text: "暂无数据",
        left: "center",
        top: "middle",
        textStyle: { fontSize: 16, color: "#999" },
      },
      series: [],
    };
  }
  return {
    tooltip: {
      trigger: "item",
      confine: true,
      formatter: (params) => {
        const item = Array.isArray(params) ? params[0] : params;
        return `${item.name}: ${item.value}`;
      },
    },
    series: [
      {
        type: "treemap",
        id: "echarts-package-size",
        animationDurationUpdate: 1000,
        roam: false,
        nodeClick: undefined,
        data,
        universalTransition: true,
        label: { show: true },
        breadcrumb: { show: false },
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
      },
    ],
  };
}
export function gaugeOptions(
  rows: MetricValue[],
): { name: string; option: EChartsOption }[] {
  const goal = (value: string) =>
    rows.filter((row) => row.goal_finish === value).length;
  const change = (sign: number) =>
    rows.filter((row) => {
      const value = numberValue(row.yoy_rate);
      return value !== undefined && Math.sign(value) === sign;
    }).length;
  const red = ["rgb(255,191,0)", "#c23531"],
    blue = ["rgb(0,221,255)", "rgb(77,119,255)"],
    green = ["#11c7ae", "rgb(128,255,165)"];
  return [
    { name: "未达标", count: goal("0"), colors: red },
    {
      name: "无目标",
      count: rows.filter((row) => !row.goal_finish).length,
      colors: blue,
    },
    { name: "达标", count: goal("1"), colors: green },
    { name: "同比上涨", count: change(1), colors: red },
    { name: "同比持平", count: change(0), colors: blue },
    { name: "同比下降", count: change(-1), colors: green },
  ].map(({ name, count, colors }) => ({
    name,
    option: {
      series: [
        {
          type: "gauge",
          min: 0,
          max: Math.max(1, rows.length),
          itemStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 1,
              y2: 0,
              colorStops: [
                { offset: 0, color: colors[0] },
                { offset: 1, color: colors[1] },
              ],
            },
          },
          progress: { show: true, width: 12 },
          axisLine: { lineStyle: { width: 12 } },
          axisTick: { show: true, distance: 4 },
          splitLine: {
            length: 12,
            distance: 4,
            lineStyle: { width: 2, color: "#999" },
          },
          axisLabel: { distance: 16, color: "#999" },
          title: { show: true },
          detail: {
            valueAnimation: true,
            color: colors[0],
            offsetCenter: [0, "70%"],
          },
          data: [{ value: count, name }],
        },
      ],
    },
  }));
}
export function scatterOption(
  rows: MetricValue[],
  name: string,
  xSplit = "average",
  ySplit = "0",
): EChartsOption {
  const data = rows.filter(
    (row) =>
      !["+999%", "-999%"].includes(row.yoy_rate_fmt || "") &&
      numberValue(row.metric_value) !== undefined &&
      numberValue(row.yoy_rate) !== undefined,
  );
  return {
    grid: { left: 40, top: 40, right: 60, bottom: 60 },
    tooltip: { trigger: "item" },
    xAxis: { name, type: "value" },
    yAxis: { name: "同比", type: "value" },
    dataZoom: [{}, { orient: "vertical" }],
    series: [
      {
        type: "scatter",
        data: data.map((row) => ({
          name: row.object_name,
          value: [Number(row.metric_value), Number(row.yoy_rate)],
          label: {
            formatter: `${row.object_name}：${display(row.metric_value_fmt)}，${display(row.yoy_rate_fmt)}`,
          },
        })),
        label: { show: true, position: "top" },
        markLine: {
          lineStyle: { color: "green" },
          data: [
            xSplit === "0"
              ? { xAxis: 0 }
              : {
                  type: xSplit === "median" ? "median" : "average",
                  valueIndex: 0,
                },
            ySplit === "0"
              ? { yAxis: 0 }
              : {
                  type: ySplit === "median" ? "median" : "average",
                  valueIndex: 1,
                },
          ],
        },
      },
    ],
  };
}
