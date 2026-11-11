import { useMemo, useState } from "react";
import { Button, Select, Space } from "antd";
import { usePreview } from "../context";
import { objectParams } from "../model";
import { seriesDates, dateBounds } from "../dates";
import { useRead } from "../hooks/useRead";
import { trendOption, yearsOption } from "../chartOptions";
import Feedback from "./Feedback";
import Chart from "./Chart";

export default function Trend({ metricId }: { metricId: number }) {
  const { service, detailQuery: query } = usePreview();
  const [frequency, setFrequency] = useState("Y"),
    [count, setCount] = useState(12);
  const dates = seriesDates(query.date, frequency, count),
    year = Number(dateBounds(query.date).start.slice(0, 4));
  const read = useRead(
    `trend:${JSON.stringify([metricId, query, dates])}`,
    (signal) =>
      service.values(
        {
          metric_id: metricId,
          ...objectParams(query),
          date_list: dates,
          goal_value: true,
        },
        signal,
      ),
  );
  const yearly = useRead(
    `years:${JSON.stringify([metricId, query.unitId, query.entityId, year])}`,
    (signal) =>
      service.values(
        {
          metric_id: metricId,
          ...objectParams(query),
          date_list: Array.from(
            { length: 48 },
            (_, index) =>
              `${year - Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}`,
          ),
        },
        signal,
      ),
  );
  const line = useMemo(() => {
    const map = new Map(
      read.data?.value_list?.map((value) => [value.date_name, value]),
    );
    return trendOption(
      dates.map((date) => map.get(date) ?? { date_name: date }),
    );
  }, [read.data, dates.join(",")]);
  const bar = useMemo(
    () => yearsOption(yearly.data?.value_list ?? [], year),
    [yearly.data, year],
  );
  return (
    <section className="mp-section mp-trends">
      <div className="mp-section-title">四年月趋势图</div>
      <Feedback read={yearly} />
      {yearly.data && (
        <Chart label="指标近四年月度对比" option={bar} height={200} />
      )}
      <div className="mp-section-title">
        自定义趋势图 (
        {
          (
            {
              Y: "年",
              H: "半年",
              Q: "季度",
              M: "月",
              W: "周",
              D: "日",
            } as Record<string, string>
          )[frequency]
        }
        )
      </div>
      <div className="mp-chart-controls">
        <Space>
          <Button size="small">周期数</Button>
          <Select
            aria-label="趋势周期数"
            style={{ width: 100 }}
            size="small"
            value={count}
            onChange={setCount}
            options={[6, 12, 24, 36, 48, 60].map((value) => ({
              value,
              label: String(value),
            }))}
          />
        </Space>
        <Space>
          {[
            ["年", "Y"],
            ["半年", "H"],
            ["季度", "Q"],
            ["月", "M"],
            ["周", "W"],
            ["日", "D"],
          ].map(([label, value]) => (
            <Button
              key={value}
              size="small"
              type={frequency === value ? "primary" : "default"}
              onClick={() => setFrequency(value)}
            >
              {label}
            </Button>
          ))}
        </Space>
      </div>
      <Feedback read={read} />
      {read.data && <Chart label="指标周期趋势" option={line} height={200} />}
    </section>
  );
}
