import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getDocAssessResult } from "@/api/doc";
import type { AssessResult, FormProperty, InitialAssess } from "../components/Form/types";
import { useFormEvent } from "../contexts/FormEventContext";
import type { AssessFormContextValue } from "../contexts/AssessFormContext";
import { getFormLoadError, type AssessDocInfo } from "../model/formDefinition";
import { getFormSessionKey, isDraftEmrBinding } from "../model/formIdentity";

export type AssessResultInfo = Omit<AssessResult,
  "assess_system" | "assess_method" | "assess_total" | "assess_score">;

const DEFAULT_RESULT: AssessResultInfo = {
  assess_result: "", assess_color: "#1677ff", assess_next: null,
  assess_tag: "", assess_note: "",
};
const RESULT_DEBOUNCE_MS = 300;

const pickProblemFields = (source: InitialAssess): Partial<AssessResultInfo> => {
  const fields: Partial<AssessResultInfo> = {};
  const type = source.problem_type?.trim();
  const id = Number(source.problem_id) || 0;
  const name = source.problem_name?.trim();
  if (type) fields.problem_type = type;
  if (id) fields.problem_id = id;
  if (name) fields.problem_name = name;
  return fields;
};

const fromInitialAssess = (snapshot: InitialAssess): AssessResultInfo => ({
  assess_result: snapshot.assess_result ?? "",
  assess_color: snapshot.assess_color || DEFAULT_RESULT.assess_color,
  assess_next: null,
  assess_tag: snapshot.assess_tag ?? "",
  assess_note: snapshot.assess_note ?? "",
  ...pickProblemFields(snapshot),
});

interface AssessmentState {
  sessionKey: string;
  formProp: FormProperty;
  scores: Map<string, number>;
  score: number;
  result: AssessResultInfo;
  hydrated: boolean;
  hasReportedScore: boolean;
  snapshotReusable: boolean;
  error: string | null;
}

interface UseAssessmentOptions {
  formProp: FormProperty;
  docInfo: AssessDocInfo | null;
  formReady: boolean;
  initialAssess?: InitialAssess;
}

export const useAssessment = ({
  formProp, docInfo, formReady, initialAssess,
}: UseAssessmentOptions) => {
  const sessionKey = getFormSessionKey(formProp);
  const [state, setState] = useState<AssessmentState>(() => ({
    sessionKey, formProp: { ...formProp }, scores: new Map(), score: 0,
    result: DEFAULT_RESULT, hydrated: false, hasReportedScore: false,
    snapshotReusable: true, error: null,
  }));
  let current = state;
  // Reset before committing children so their score effects populate the new session.
  if (state.sessionKey !== sessionKey) {
    const preserveDraft = isDraftEmrBinding(state.formProp, formProp);
    current = {
      sessionKey, formProp: { ...formProp },
      scores: preserveDraft ? state.scores : new Map(),
      score: preserveDraft ? state.score : 0,
      result: preserveDraft ? state.result : DEFAULT_RESULT,
      hydrated: false,
      hasReportedScore: preserveDraft ? state.hasReportedScore : false,
      snapshotReusable: preserveDraft ? state.snapshotReusable : true,
      error: null,
    };
    setState(current);
  }
  const stateRef = useRef(current);
  stateRef.current = current;

  const formEvent = useFormEvent();
  const runScriptRef = useRef(formEvent?.runScript);
  runScriptRef.current = formEvent?.runScript;

  const reportElemScore = useCallback((key: string, score: number) => {
    const value = Number.isFinite(score) ? score : 0;
    setState((previous) => {
      if (previous.sessionKey !== sessionKey || previous.scores.get(key) === value) return previous;
      const scores = new Map(previous.scores);
      scores.set(key, value);
      return {
        ...previous, scores, hasReportedScore: true,
        score: Array.from(scores.values()).reduce((sum, item) => sum + item, 0),
      };
    });
  }, [sessionKey]);

  const removeElemScore = useCallback((key: string) => {
    setState((previous) => {
      if (previous.sessionKey !== sessionKey || !previous.scores.has(key)) return previous;
      const scores = new Map(previous.scores);
      scores.delete(key);
      return { ...previous, scores, score: Array.from(scores.values()).reduce((sum, item) => sum + item, 0) };
    });
  }, [sessionKey]);

  useEffect(() => {
    if (!docInfo) return;
    setState((previous) => {
      if (previous.sessionKey !== sessionKey || previous.hydrated) return previous;
      return {
        ...previous, hydrated: true,
        result: initialAssess ? fromInitialAssess(initialAssess) : previous.result,
      };
    });
  }, [docInfo, sessionKey, initialAssess]);

  const score = current.score;
  const scoreCount = current.scores.size;
  useEffect(() => {
    if (!docInfo || !formReady) return;
    let cancelled = false;
    const load = async () => {
      try {
        const res = await getDocAssessResult({
          doc_type: docInfo.doc_type, doc_name: docInfo.doc_name,
          doc_tag: docInfo.doc_tag, assess_score: score,
        });
        if (cancelled) return;
        if (res.code !== 0) throw new Error(res.message || "评估结果加载失败");
        const result: AssessResultInfo = {
          assess_result: res.assess_result ?? "",
          assess_color: res.assess_color || DEFAULT_RESULT.assess_color,
          assess_next: Number(res.assess_next) || null,
          assess_tag: res.assess_tag ?? "", assess_note: res.assess_note ?? "",
          ...pickProblemFields(res),
        };
        setState((previous) => previous.sessionKey === sessionKey
          ? { ...previous, result, snapshotReusable: false, error: null } : previous);
        const script = res.script_content?.trim();
        if (script) runScriptRef.current?.(script);
      } catch (error) {
        if (cancelled) return;
        setState((previous) => previous.sessionKey === sessionKey ? {
          ...previous, result: DEFAULT_RESULT,
          snapshotReusable: false,
          error: getFormLoadError(error, "评估结果加载失败"),
        } : previous);
      }
    };
    const timer = window.setTimeout(() => {
      if (cancelled) return;
      const initialScore = Number(initialAssess?.assess_score) || 0;
      const latest = stateRef.current;
      if (latest.sessionKey !== sessionKey) return;
      // Reuse the snapshot only while it is still the displayed result. Once
      // a changed score has produced a result, returning to the initial score
      // must calculate that result again. Empty scores are loading only before
      // an element has reported; deleting the last scoring element is an edit.
      if (initialAssess && latest.snapshotReusable &&
        (!latest.hasReportedScore || score === initialScore)) return;
      void load();
    }, RESULT_DEBOUNCE_MS);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [docInfo, formReady, score, scoreCount, sessionKey, initialAssess]);

  const isAssessForm = docInfo !== null;
  const contextValue = useMemo<AssessFormContextValue>(() => ({
    isAssessForm, assessTotal: docInfo?.assess_total,
    reportElemScore, removeElemScore,
  }), [isAssessForm, docInfo?.assess_total, reportElemScore, removeElemScore]);
  const assessment = useMemo<AssessResult>(() => ({
    assess_system: docInfo?.assess_system ?? "",
    assess_method: docInfo?.assess_method ?? "",
    assess_total: docInfo?.assess_total ?? 0,
    assess_score: score,
    ...(isAssessForm ? current.result : DEFAULT_RESULT),
  }), [docInfo, isAssessForm, score, current.result]);

  return { contextValue, assessment, error: isAssessForm ? current.error : null };
};
