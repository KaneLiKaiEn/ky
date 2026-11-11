import type { AssessResult } from "./types";

const AssessSummary = ({ assessment }: { assessment: AssessResult }) => (
  <div className="mb-3 flex justify-end px-4 py-2">
    <div
      className="inline-flex items-baseline gap-2 rounded-lg border px-4 py-2.5 shadow-sm"
      style={{ borderColor: assessment.assess_color, backgroundColor: `${assessment.assess_color}14` }}
    >
      <span className="text-sm font-medium text-gray-600">得分</span>
      <span className="text-2xl font-bold tabular-nums leading-none" style={{ color: assessment.assess_color }}>
        {assessment.assess_score}
      </span>
      <span className="text-base text-gray-500">/ {assessment.assess_total}</span>
      {assessment.assess_result ? (
        <span className="ml-1 rounded px-2 py-0.5 text-sm font-semibold text-white" style={{ backgroundColor: assessment.assess_color }}>
          {assessment.assess_result}
        </span>
      ) : null}
    </div>
  </div>
);

export default AssessSummary;
