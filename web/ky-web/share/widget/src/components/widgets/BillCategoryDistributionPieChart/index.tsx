import React, { useEffect, useMemo, useState } from "react";
import { App, Empty, Spin } from "antd";
import { retrieveBillCategoryDistributionAPI } from "@/api/dataset";
import type { BillCategoryApiData } from "./constants";
import BillCategoryPieChart from "./components/BillCategoryPieChart";
import {
  hasBillCategoryStructure,
  normalizeBillCategoryApiData,
  parseBillCategoryFields,
  toChartData,
} from "./utils/parseBillCategoryData";

export interface BillCategoryDistributionPieChartProps {
  visit_id?: number;
}

/** 费用类型分布饼图（visit 小部件） */
const BillCategoryDistributionPieChart: React.FC<
  BillCategoryDistributionPieChartProps
> = ({ visit_id }) => {
  const { message } = App.useApp();
  const visitId = Number(visit_id) || 0;
  const [apiData, setApiData] = useState<BillCategoryApiData>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visitId <= 0) {
      setApiData(undefined);
      return;
    }

    let cancelled = false;

    const loadData = async () => {
      setLoading(true);
      try {
        const res = await retrieveBillCategoryDistributionAPI(visitId);
        if (cancelled) return;

        if (res.code !== 0) {
          message.error((res.message || "") + (res.hint || ""));
          setApiData(undefined);
          return;
        }

        setApiData(normalizeBillCategoryApiData(res.data));
      } catch {
        if (!cancelled) {
          message.error("获取费用分布数据失败");
          setApiData(undefined);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [message, visitId]);

  const feeFields = useMemo(
    () => parseBillCategoryFields(apiData),
    [apiData],
  );
  const chartData = useMemo(() => toChartData(feeFields), [feeFields]);
  const hasStructure = useMemo(
    () => hasBillCategoryStructure(apiData),
    [apiData],
  );

  if (visitId <= 0) {
    return (
      <div className="flex h-full items-center justify-center p-3 text-(--app-theme-text-secondary)">
        请先选择就诊患者
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden p-3">
      <Spin spinning={loading} classNames={
        { root: "!h-full min-h-0 flex-1" }
      }>
        {hasStructure ? (
          <div className="h-full min-h-[240px] w-full">
            <BillCategoryPieChart
              data={chartData}
              feeFields={feeFields}
              showEmptyChart={chartData.length === 0}
            />
          </div>
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={loading ? "加载中..." : "暂无费用数据"}
          />
        )}
      </Spin>
    </div>
  );
};

export default BillCategoryDistributionPieChart;
