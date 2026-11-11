import { useCallback, useState } from "react";
import { Empty, Spin } from "antd";
import type { ClinicalPathwayRole } from "@/types/cohort";
import CpCohortList from "./components/CpCohortList";
import CpCorhortDetail from "./components/CpCorhortDetail";

export interface ClinicalPathwayExecProps {
  visit_id?: number | null;
  /** 操作角色：DOCTOR 可操作医疗/患者/变异；NURSE 可操作护理/患者/变异 */
  work_type: ClinicalPathwayRole;
}

export default function ClinicalPathwayExec({
  visit_id,
  work_type,
}: ClinicalPathwayExecProps) {
  const [selectedCohortId, setSelectedCohortId] = useState<number | null>(null);
  const [cohortLoading, setCohortLoading] = useState(false);
  const [cohortEmpty, setCohortEmpty] = useState(true);

  const handleSelect = useCallback((cohortId: number | null) => {
    setSelectedCohortId(cohortId);
  }, []);

  const handleCohortStatusChange = useCallback(
    (status: { loading: boolean; empty: boolean }) => {
      setCohortLoading(status.loading);
      setCohortEmpty(status.empty);
    },
    [],
  );

  const validVisitId =
    visit_id != null && Number.isFinite(visit_id) && visit_id > 0
      ? visit_id
      : null;

  if (validVisitId == null) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center bg-(--app-theme-bg-container)">
        <Empty description="请先选择患者" />
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-(--app-theme-bg-container)">
      {/* 始终挂载列表以拉取数据；无队列时整页空态 */}
      <div
        className={
          cohortEmpty
            ? "pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0"
            : "flex h-full min-h-0 flex-col"
        }
      >
        <div className="w-full shrink-0 overflow-hidden border-b border-(--app-theme-border)">
          <CpCohortList
            visitId={validVisitId}
            selectedCohortId={selectedCohortId}
            onSelect={handleSelect}
            onStatusChange={handleCohortStatusChange}
          />
        </div>
        <div className="min-h-0 w-full flex-1 overflow-hidden">
          <CpCorhortDetail
            cohortId={selectedCohortId}
            visitId={validVisitId}
            roleWorkType={work_type}
          />
        </div>
      </div>

      {cohortEmpty ? (
        <div className="flex h-full min-h-0 flex-1 items-center justify-center">
          {cohortLoading ? <Spin /> : <Empty description="暂无临床路径" />}
        </div>
      ) : null}
    </div>
  );
}
