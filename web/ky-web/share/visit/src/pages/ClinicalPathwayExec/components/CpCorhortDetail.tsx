import { useCallback, useEffect, useState } from "react";
import { Empty, Spin, message } from "antd";
import { getCohortStepListAPI } from "@/api/cohort";
import type { ClinicalPathwayRole, CohortStepRow } from "@/types/cohort";
import CohortActionMatrix from "./CohortActionMatrix";

export interface CpCorhortDetailProps {
  cohortId: number | null;
  visitId: number | null;
  roleWorkType: ClinicalPathwayRole;
}

export default function CpCorhortDetail({
  cohortId,
  roleWorkType,
}: CpCorhortDetailProps) {
  const [loading, setLoading] = useState(false);
  const [stepList, setStepList] = useState<CohortStepRow[]>([]);

  const loadSteps = useCallback(async () => {
    if (cohortId == null) {
      setStepList([]);
      return;
    }
    setLoading(true);
    try {
      const res = await getCohortStepListAPI({ cohort_id: cohortId });
      if (res.code !== 0) {
        message.error(`${res.message ?? ""}${res.hint ?? ""}`);
        setStepList([]);
        return;
      }
      const rows = [...(res.row_list ?? [])].sort((a, b) =>
        String(a.sort_no ?? "").localeCompare(String(b.sort_no ?? ""), "zh", {
          numeric: true,
        }),
      );
      setStepList(rows);
    } catch {
      setStepList([]);
    } finally {
      setLoading(false);
    }
  }, [cohortId]);

  useEffect(() => {
    void loadSteps();
  }, [loadSteps]);

  if (cohortId == null) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center">
        <Empty description="请选择临床路径" />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden p-2">
      <Spin
        spinning={loading}
        classNames={{
          root: "flex min-h-0 flex-1 flex-col overflow-hidden [&>.ant-spin-container]:flex [&>.ant-spin-container]:min-h-0 [&>.ant-spin-container]:flex-1 [&>.ant-spin-container]:flex-col [&>.ant-spin-container]:overflow-hidden",
        }}
      >
        {stepList.length === 0 && !loading ? (
          <div className="flex h-full items-center justify-center">
            <Empty description="暂无临床路径步骤列表" />
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-hidden">
            <CohortActionMatrix
              cohortId={cohortId}
              stepList={stepList}
              roleWorkType={roleWorkType}
            />
          </div>
        )}
      </Spin>
    </div>
  );
}
