import { useEffect, useRef } from "react";
import { useAssessForm } from "../contexts/AssessFormContext";

interface UseElemScoreOptions {
  scoreKey?: string;
  eligible: boolean;
  hasScores: boolean;
  score: number;
  onScoreChange?: (score: number | null) => void;
}

export const useElemScore = ({
  scoreKey,
  eligible,
  hasScores,
  score,
  onScoreChange,
}: UseElemScoreOptions) => {
  const assessForm = useAssessForm();
  const isAssessForm = assessForm?.isAssessForm ?? false;
  const reportElemScore = assessForm?.reportElemScore;
  const removeElemScore = assessForm?.removeElemScore;
  const registered = isAssessForm && eligible && Boolean(scoreKey);
  const displayedScore = isAssessForm && hasScores && eligible ? score : null;
  const onScoreChangeRef = useRef(onScoreChange);
  onScoreChangeRef.current = onScoreChange;

  // 表格每次渲染会创建新的回调，只在分数变化时回写，避免值更新反馈循环。
  useEffect(() => {
    onScoreChangeRef.current?.(displayedScore);
  }, [displayedScore, scoreKey]);

  useEffect(() => {
    if (registered && scoreKey) reportElemScore?.(scoreKey, score);
  }, [registered, scoreKey, score, reportElemScore]);

  useEffect(() => {
    if (!registered || !scoreKey) return;
    return () => removeElemScore?.(scoreKey);
  }, [registered, scoreKey, removeElemScore]);

  return { isAssessForm, displayedScore };
};
