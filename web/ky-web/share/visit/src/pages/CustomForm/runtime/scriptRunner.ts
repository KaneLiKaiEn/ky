import { ElemCore, type ElemCoreAdapter, type ElemCoreOptions, type ExtraFormDocInfo } from "./elemCore";
import type { ElementRegistry } from "./elementRegistry";
import type { RunScriptTrigger } from "./types";

interface ScriptRunnerOptions extends ElemCoreOptions {
  emrId?: number;
  registry: ElementRegistry;
  openExtraForm: (doc: ExtraFormDocInfo) => void;
}

export const runFormScript = (script: string, options: ScriptRunnerOptions, trigger?: RunScriptTrigger) => {
  if (!script.trim() || options.isActive?.() === false) return;
  const adapterMap = new Map<string, ElemCoreAdapter>();
  options.registry.values().forEach((registered) => {
    const adapter = options.registry.resolve(registered.elem_id, trigger?.rowNo, trigger?.sectionId);
    if (!adapter) return;
    const isActive = () => options.isActive?.() !== false && options.registry.has(adapter);
    adapterMap.set(String(adapter.elem_id), {
      getLatestVal: () => isActive() ? adapter.getLatestVal() : "",
      getValueCode: () => isActive() ? adapter.getValueCode() : "",
      getScore: () => isActive() ? adapter.getScore() : 0,
      set: (value) => { if (isActive()) adapter.set({ value_text: value, value_code: value }); },
      setRenderHtml: (html) => { if (isActive()) adapter.setRenderHtml(html); },
    });
  });
  const source = trigger?.elemId == null ? undefined :
    options.registry.resolve(trigger.elemId, trigger.rowNo, trigger.sectionId);
  const core = new ElemCore(options);
  core.init(options.emrId, [{
    value: source?.getLatestVal(), valueCode: trigger?.valueCode, elemTotalScore: source?.getScore(),
  }], [...adapterMap.keys()].map(Number), adapterMap, trigger?.valueCode ?? "", () => undefined, options.openExtraForm);
  try {
    const fn = new Function(script.trim())();
    if (typeof fn === "function") {
      Promise.resolve(fn(core)).catch((error) => console.warn("执行自定义脚本失败", error));
    }
  } catch (error) {
    console.warn("执行自定义脚本失败", error);
  }
};
