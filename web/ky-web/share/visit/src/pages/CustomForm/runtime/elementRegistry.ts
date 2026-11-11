import type { FormEventFireRow } from "@/types/form";
import { getAdapterKey, type ElemEventAdapter, type ElemEventValuePatch } from "./types";

export class ElementRegistry {
  private adapters = new Map<string, ElemEventAdapter>();
  private pendingPatches = new Map<string, ElemEventValuePatch>();

  register(adapter: ElemEventAdapter): ElemEventAdapter | undefined {
    const adapterKey = getAdapterKey(adapter.elem_id, adapter.row_no, adapter.section_id);
    const previous = this.adapters.get(adapterKey);
    this.adapters.set(adapterKey, adapter);
    const key = getAdapterKey(adapter.elem_id, adapter.row_no);
    const fallbackKey = getAdapterKey(adapter.elem_id);
    const pending = this.pendingPatches.get(key) ?? this.pendingPatches.get(fallbackKey);
    if (pending) {
      this.pendingPatches.delete(key);
      this.pendingPatches.delete(fallbackKey);
      this.apply(adapter, pending);
    }
    return previous;
  }

  unregister(adapter: ElemEventAdapter): boolean {
    const key = getAdapterKey(adapter.elem_id, adapter.row_no, adapter.section_id);
    if (this.adapters.get(key) !== adapter) return false;
    this.adapters.delete(key);
    return true;
  }

  has(adapter: ElemEventAdapter): boolean {
    return this.adapters.get(getAdapterKey(adapter.elem_id, adapter.row_no, adapter.section_id)) === adapter;
  }

  values(): ElemEventAdapter[] {
    return [...this.adapters.values()];
  }

  resolve(elemId: number, rowNo?: number, sectionId?: number): ElemEventAdapter | undefined {
    if (sectionId != null) {
      const exact = this.adapters.get(getAdapterKey(elemId, rowNo, sectionId));
      if (exact) return exact;
    }
    const matches = this.values().filter((adapter) => adapter.elem_id === elemId);
    // Responses and legacy scripts identify a target by elem_id only. Prefer the
    // triggering row, then preserve the previous last-registered fallback.
    const sameRow = matches.filter((adapter) => (adapter.row_no ?? 0) === (rowNo ?? 0));
    return sameRow[sameRow.length - 1] ?? matches[matches.length - 1];
  }

  applyPatches(rows: FormEventFireRow[] | undefined, rowNo?: number, sectionId?: number): void {
    for (const row of rows ?? []) {
      if (row.elem_id == null) continue;
      const patch = { value_text: row.value_text ?? "", value_code: row.value_code };
      const adapter = this.resolve(row.elem_id, rowNo, sectionId);
      if (adapter) this.apply(adapter, patch);
      else this.pendingPatches.set(getAdapterKey(row.elem_id, rowNo), patch);
    }
  }

  private apply(adapter: ElemEventAdapter, patch: ElemEventValuePatch): void {
    adapter.set(patch);
    if (patch.value_text) adapter.setRenderHtml(patch.value_text);
  }

  clear(): void {
    this.adapters.clear();
    this.pendingPatches.clear();
  }
}
