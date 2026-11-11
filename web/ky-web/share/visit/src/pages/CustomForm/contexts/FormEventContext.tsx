import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { elemInputEvent } from "@/api/form";
import { getEmrElemList } from "@/api/emr";
import { getFormSessionKey, isDraftEmrBinding } from "../model/formIdentity";
import type { FormProperty } from "../components/Form/types";
import { FormEventRuntime } from "../runtime/formEventRuntime";
import type { ExtraFormDocInfo } from "../runtime/elemCore";
import type { ElemEventAdapter, FireInputEventParams, RunScriptTrigger } from "../runtime/types";

export type { ElemEventAdapter, ElemEventValuePatch, FireInputEventParams, RunScriptTrigger } from "../runtime/types";

export interface FormEventContextValue {
  registerElem: (adapter: ElemEventAdapter) => () => void;
  fireInputEvent: (params: FireInputEventParams) => void;
  runScript: (script: string, trigger?: RunScriptTrigger) => void;
  extraForm: ExtraFormDocInfo | null;
  closeExtraForm: () => void;
  scopeKey: string;
  formProp: FormProperty;
  visit_id: number;
  baby_id?: number;
}

export const FormEventContext = createContext<FormEventContextValue | null>(null);
export const useFormEvent = () => useContext(FormEventContext);

export interface FormEventProviderProps {
  form_id: number;
  form_version?: number;
  emr_id?: number;
  visit_id: number;
  baby_id?: number;
  formReady: boolean;
  children: ReactNode;
}

export const FormEventProvider = ({ form_id, form_version, emr_id, visit_id, baby_id, formReady, children }: FormEventProviderProps) => {
  const scopeKey = getFormSessionKey({ form_id, form_version, emr_id, visit_id, baby_id });
  const scopeRef = useRef(scopeKey);
  scopeRef.current = scopeKey;
  const rootRef = useRef<HTMLDivElement>(null);
  const committedRuntimeRef = useRef<{ formProp: FormProperty; runtime: FormEventRuntime } | null>(null);
  const [extra, setExtra] = useState<{ scopeKey: string; doc: ExtraFormDocInfo } | null>(null);
  const runtime = useMemo(() => {
    const previous = committedRuntimeRef.current;
    const formProp = { form_id, form_version, emr_id, visit_id, baby_id };
    const preserveDraftStars = previous && isDraftEmrBinding(previous.formProp, formProp);
    return new FormEventRuntime({
      formId: form_id,
      emrId: emr_id,
      initialStarFiredKeys: preserveDraftStars ? previous.runtime.getFiredStarKeys() : undefined,
      isActive: () => scopeRef.current === scopeKey,
      root: () => rootRef.current,
      loadValues: async (emrId) => (await getEmrElemList({ emr_id: emrId })).value_list ?? [],
      request: (params) => elemInputEvent({ form_id, elem_id: params.elem_id,
        value_text: params.value_text, value_code: params.value_code ?? undefined }),
      openExtraForm: (doc) => setExtra({ scopeKey, doc }),
    });
  }, [scopeKey]);

  useEffect(() => {
    runtime.activate();
    // Commit only after rendering; StrictMode may calculate the next runtime twice.
    committedRuntimeRef.current = {
      formProp: { form_id, form_version, emr_id, visit_id, baby_id },
      runtime,
    };
    return () => runtime.dispose();
  }, [runtime]);
  useEffect(() => { runtime.setReady(formReady); }, [runtime, formReady]);

  const value = useMemo<FormEventContextValue>(() => ({
    registerElem: runtime.registerElem,
    fireInputEvent: runtime.fireInputEvent,
    runScript: runtime.runScript,
    extraForm: extra?.scopeKey === scopeKey ? extra.doc : null,
    closeExtraForm: () => setExtra(null),
    scopeKey,
    formProp: { form_id, form_version, emr_id, visit_id, baby_id },
    visit_id,
    baby_id,
  }), [runtime, extra, scopeKey, visit_id, baby_id]);

  return (
    <FormEventContext.Provider value={value}>
      <div ref={rootRef} data-custom-form-root className="min-w-0">{children}</div>
    </FormEventContext.Provider>
  );
};
