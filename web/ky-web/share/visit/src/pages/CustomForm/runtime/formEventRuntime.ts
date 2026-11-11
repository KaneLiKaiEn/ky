import type { ElemInputEventRes } from "@/types/form";
import type { ExtraFormDocInfo, ElemCoreOptions } from "./elemCore";
import { ElementRegistry } from "./elementRegistry";
import { EventScheduler } from "./eventScheduler";
import { runFormScript } from "./scriptRunner";
import { getAdapterKey, type ElemEventAdapter, type FireInputEventParams, type RunScriptTrigger } from "./types";

interface FormEventRuntimeOptions extends ElemCoreOptions {
  formId: number;
  emrId?: number;
  request: (params: FireInputEventParams) => Promise<ElemInputEventRes>;
  openExtraForm: (doc: ExtraFormDocInfo) => void;
  debounceMs?: number;
  initialStarFiredKeys?: readonly string[];
}

export class FormEventRuntime {
  private registry = new ElementRegistry();
  private starFired = new Set<string>();
  private ready = false;
  private disposed = false;
  private epoch = 0;
  private scheduler: EventScheduler<FireInputEventParams>;

  constructor(private options: FormEventRuntimeOptions) {
    this.starFired = new Set(options.initialStarFiredKeys);
    this.scheduler = this.createScheduler();
  }

  getFiredStarKeys(): readonly string[] {
    return [...this.starFired];
  }

  private createScheduler() {
    return new EventScheduler<FireInputEventParams>(async (params, isCurrent) => {
      try {
        const response = await this.options.request(params);
        if (!this.active || !isCurrent() || response.code !== 0) return;
        this.registry.applyPatches(response.row_list, params.row_no, params.section_id);
        this.runScript(response.script_list?.[0] ?? "", {
          elemId: params.elem_id, sectionId: params.section_id, rowNo: params.row_no, valueCode: params.value_code,
        }, isCurrent);
      } catch {
        // The shared request interceptor handles API error messages.
      }
    }, this.options.debounceMs);
  }

  private get active() { return !this.disposed && this.options.isActive?.() !== false; }

  registerElem = (adapter: ElemEventAdapter): (() => void) => {
    if (this.options.isActive?.() === false) return () => undefined;
    const key = getAdapterKey(adapter.elem_id, adapter.row_no, adapter.section_id);
    const previous = this.registry.register(adapter);
    if (previous && previous !== adapter) {
      this.scheduler.invalidate(key);
      this.starFired.delete(key);
    }
    this.maybeFireStar(adapter);
    return () => {
      if (!this.registry.unregister(adapter)) return;
      this.scheduler.invalidate(key);
      this.starFired.delete(key);
    };
  };

  fireInputEvent = (params: FireInputEventParams): void => {
    if (!this.active || !this.options.formId) return;
    this.scheduler.schedule(getAdapterKey(params.elem_id, params.row_no, params.section_id), params, !!params.debounce);
  };

  runScript = (script: string, trigger?: RunScriptTrigger, isCurrent?: () => boolean): void => {
    const epoch = this.epoch;
    const scriptIsActive = () => this.active && this.epoch === epoch && (!isCurrent || isCurrent());
    runFormScript(script, {
      ...this.options,
      registry: this.registry,
      isActive: scriptIsActive,
      openExtraForm: (doc) => { if (scriptIsActive()) this.options.openExtraForm(doc); },
    }, trigger);
  };

  private maybeFireStar(adapter: ElemEventAdapter): void {
    if (!this.ready || !adapter.isEventTrigger || !this.active) return;
    const key = getAdapterKey(adapter.elem_id, adapter.row_no, adapter.section_id);
    if (this.starFired.has(key)) return;
    this.starFired.add(key);
    this.fireInputEvent({ elem_id: adapter.elem_id, section_id: adapter.section_id,
      value_text: "*", value_code: null, row_no: adapter.row_no });
  }

  setReady(ready: boolean): void {
    this.ready = ready;
    if (ready) this.registry.values().forEach((adapter) => this.maybeFireStar(adapter));
  }

  activate(): void {
    if (!this.disposed) return;
    this.disposed = false;
    this.scheduler = this.createScheduler();
  }

  dispose(): void {
    this.disposed = true;
    this.epoch++;
    this.scheduler.dispose();
    this.registry.clear();
    this.starFired.clear();
  }
}
