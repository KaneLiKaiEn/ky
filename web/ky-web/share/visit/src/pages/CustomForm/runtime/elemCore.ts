export interface ElemCoreAdapter {
  getLatestVal: () => string;
  getValueCode?: () => string;
  set: (value: string) => void;
  setRenderHtml?: (html: string) => void;
  getScore?: () => number;
}

export interface ExtraFormDocInfo {
  doc_type: string;
  doc_name: string;
  doc_tag: string;
}

export interface ElemCoreCurrentValue {
  value?: string | null;
  valueCode?: string | null;
  elemTotalScore?: number | null;
}

export interface StoredElemValue {
  elem_id?: number;
  value_text?: string;
  value_code?: string;
  value_score?: number;
}

export interface ElemCoreOptions {
  loadValues: (emrId: number) => Promise<StoredElemValue[]>;
  root?: () => HTMLElement | null;
  isActive?: () => boolean;
}

/** Each script invocation owns its trigger snapshot and fromDB usage. */
export class ElemCore {
  private elements = new Map<string, ElemCoreAdapter>();
  private valueCode = "";
  private currentValueData: ElemCoreCurrentValue[] | null = null;
  private fromDBUsed = new Set<string>();
  private emrId: number | null = null;
  private openFormFn: () => void = () => undefined;
  private setExtraFormClientDocInfo: ((info: ExtraFormDocInfo) => void) | null = null;

  constructor(private options: ElemCoreOptions) {}

  private get active(): boolean { return this.options.isActive?.() ?? true; }

  get(_id: number | string) {
    const adapter = this.active ? this.elements.get(String(_id)) : undefined;
    return {
      value: adapter?.getLatestVal() ?? "",
      valueCode: adapter?.getValueCode?.() ?? this.valueCode,
      score: adapter?.getScore?.() ?? 0,
    };
  }

  async fromDB(_id: number | string) {
    const id = String(_id);
    const empty = { value: null, valueCode: null, score: null };
    if (!this.active || this.fromDBUsed.has(id)) return empty;
    this.fromDBUsed.add(id);
    const current = this.currentValueData?.[0];
    const fallback = {
      value: current?.value ?? null,
      valueCode: current?.valueCode ?? null,
      score: current?.elemTotalScore ?? null,
    };
    if (this.emrId == null) return fallback;
    try {
      const values = await this.options.loadValues(this.emrId);
      if (!this.active) return empty;
      if (values.length === 0) return fallback;
      const value = values.find((item) => String(item.elem_id) === id);
      return value ? {
        value: value.value_text ?? null,
        valueCode: value.value_code ?? null,
        score: value.value_score ?? null,
      } : empty;
    } catch {
      return this.active ? fallback : empty;
    }
  }

  set(_id: number | string, value: unknown): void {
    if (this.active) this.elements.get(String(_id))?.set(String(value ?? ""));
  }

  render(_id: number | string, value: unknown): void {
    if (!this.active) return;
    const html = String(value ?? "");
    this.set(_id, html);
    this.elements.get(String(_id))?.setRenderHtml?.(html);
  }

  private find(attribute: string, value: string): HTMLElement | null {
    if (!this.active || typeof document === "undefined") return null;
    const root = this.options.root?.();
    if (this.options.root && !root) return null;
    const scope = root ?? document;
    return [...scope.querySelectorAll<HTMLElement>(`[${attribute}]`)].find((element) =>
      element.getAttribute(attribute) === value &&
      (!root || element.closest("[data-custom-form-root]") === root),
    ) ?? null;
  }

  private visibility(element: HTMLElement | null) {
    return {
      // The spelling is part of the stored script protocol.
      elment: element,
      hide: () => { if (this.active && element) element.style.display = "none"; },
      show: () => { if (this.active && element) element.style.display = "block"; },
    };
  }

  section(id: number | string) {
    return this.visibility(this.find("data-section-id", `app-builderclient-section-${id}`));
  }

  elemWrapper(id: number | string) {
    return this.visibility(this.find("data-section-item-elem-id", String(id)));
  }

  init(
    emrId: number | null | undefined,
    currentValueData: ElemCoreCurrentValue[] | null,
    _allElemIds: number[],
    data: Map<string, ElemCoreAdapter>,
    curValueCode: string,
    openFormFn: () => void,
    setExtraFormClientDocInfo: (info: ExtraFormDocInfo) => void,
  ): void {
    this.elements = new Map(data);
    this.valueCode = curValueCode;
    this.currentValueData = currentValueData?.map((value) => ({ ...value })) ?? null;
    this.emrId = emrId ?? null;
    this.openFormFn = openFormFn;
    this.setExtraFormClientDocInfo = setExtraFormClientDocInfo;
    this.fromDBUsed.clear();
  }

  openForm(data: Partial<ExtraFormDocInfo>): void {
    if (!this.active) return;
    this.openFormFn();
    this.setExtraFormClientDocInfo?.({
      doc_type: data.doc_type ?? "",
      doc_name: data.doc_name ?? "",
      doc_tag: data.doc_tag ?? "",
    });
  }
}
