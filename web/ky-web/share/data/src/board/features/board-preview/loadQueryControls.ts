type Controls = typeof import("../../../metric/features/query-controls/index");

export function loadControls(_attempt: number): Promise<Controls> {
  return import("../../../metric/features/query-controls/index");
}
