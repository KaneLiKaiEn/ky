import { Form, type FormProps, type GetRef } from "antd";
import {
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  type ReactNode,
  type Ref,
} from "react";
import "./style.scss";

export type AdaptiveFormProps<Values = any> = Omit<
  FormProps<Values>,
  "children"
> & {
  children?: ReactNode;
  labelSizing?: "content" | "group";
  ref?: Ref<GetRef<typeof Form<Values>>>;
};

const groupSelector = "[data-form-label-group]";
const widthProperty = "--data-form-label-width";

/** Measure the rendered label, including required marks, tooltips and spacing. */
function naturalWidth(label: HTMLElement) {
  const previous = label.getAttribute("style");
  Object.assign(label.style, {
    width: "max-content",
    maxWidth: "none",
    minWidth: "0",
    whiteSpace: "nowrap",
    overflowWrap: "normal",
  });
  const width = label.getBoundingClientRect().width;
  if (previous === null) label.removeAttribute("style");
  else label.setAttribute("style", previous);
  return width;
}

export function AdaptiveForm<Values = any>({
  labelSizing = "content",
  className,
  layout = "horizontal",
  ref,
  ...props
}: AdaptiveFormProps<Values>) {
  const formRef = useRef<GetRef<typeof Form<Values>>>(null);
  useImperativeHandle(ref, () => formRef.current!);

  useLayoutEffect(() => {
    const element = formRef.current?.nativeElement;
    if (!element || layout === "vertical") return;
    const root: HTMLElement = element;
    const view = root.ownerDocument.defaultView!;
    let frame = 0;
    let disposed = false;
    const assigned = new Set<HTMLElement>();
    const markedRows = new Set<HTMLElement>();
    const observed = new Set<Element>();
    const schedule = () => {
      if (!disposed && !frame)
        frame = view.requestAnimationFrame(() => {
          frame = 0;
          measure();
        });
    };
    const resize = new ResizeObserver(schedule);
    const mutations = new MutationObserver(schedule);
    const watchMutations = () =>
      mutations.observe(root, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ["class", "style", "hidden", "dir"],
      });

    function measure() {
      // Our temporary measurement styles and CSS variables must not trigger
      // another mutation pass. Never copy the labels or their form-control IDs.
      mutations.disconnect();
      const groups = new Map<
        HTMLElement,
        { width: number; limit: number; columns: HTMLElement[] }
      >();
      const targets = new Set<Element>([root]);
      const rows = new Set(
        [...root.querySelectorAll<HTMLElement>(".ant-form-item-row")].filter(
          (row) => row.closest(".ant-form, form") === root,
        ),
      );
      for (const row of markedRows) {
        if (!rows.has(row)) {
          row.removeAttribute("data-adaptive-form-row");
          markedRows.delete(row);
        }
      }
      for (const row of rows) {
        row.setAttribute("data-adaptive-form-row", "");
        markedRows.add(row);
        targets.add(row);
      }
      const visible = new Set<HTMLElement>();
      for (const column of root.querySelectorAll<HTMLElement>(
        ".ant-form-item-label",
      )) {
        if (column.closest(".ant-form, form") !== root) continue;
        const label = column.querySelector<HTMLElement>(":scope > label");
        const row = column.parentElement;
        if (!label || !row) continue;
        targets.add(label);
        targets.add(row);
        if (!label.textContent?.trim() || !column.getClientRects().length)
          continue;
        const rowWidth = row.getBoundingClientRect().width;
        if (!rowWidth) continue;
        visible.add(column);
        const group =
          labelSizing === "group"
            ? (column.closest<HTMLElement>(groupSelector) ?? root)
            : column;
        const current = groups.get(group) ?? {
          width: 0,
          limit: Infinity,
          columns: [],
        };
        current.width = Math.max(current.width, naturalWidth(label));
        current.limit = Math.min(current.limit, rowWidth * 0.4);
        current.columns.push(column);
        groups.set(group, current);
      }
      for (const { width, limit, columns } of groups.values()) {
        const value = `${Math.min(Math.ceil(width), limit)}px`;
        for (const column of columns) {
          if (column.style.getPropertyValue(widthProperty) !== value)
            column.style.setProperty(widthProperty, value);
          assigned.add(column);
        }
      }
      for (const column of assigned) {
        if (!visible.has(column)) {
          column.style.removeProperty(widthProperty);
          assigned.delete(column);
        }
      }
      for (const target of observed) {
        if (!targets.has(target)) {
          resize.unobserve(target);
          observed.delete(target);
        }
      }
      for (const target of targets) {
        if (!observed.has(target)) {
          resize.observe(target);
          observed.add(target);
        }
      }
      watchMutations();
    }

    // Theme and font variables may be inherited from outside this form.
    const ancestors = new MutationObserver(schedule);
    for (let parent = root.parentElement; parent; parent = parent.parentElement)
      ancestors.observe(parent, {
        attributes: true,
        attributeFilter: ["class", "style", "hidden", "dir"],
      });
    const fonts = root.ownerDocument.fonts;
    fonts?.addEventListener("loadingdone", schedule);
    void fonts?.ready.then(schedule);
    measure();
    return () => {
      disposed = true;
      view.cancelAnimationFrame(frame);
      mutations.disconnect();
      ancestors.disconnect();
      resize.disconnect();
      fonts?.removeEventListener("loadingdone", schedule);
      for (const column of assigned) column.style.removeProperty(widthProperty);
      for (const row of markedRows)
        row.removeAttribute("data-adaptive-form-row");
    };
  }, [labelSizing, layout, props.component]);

  return (
    <Form<Values>
      {...props}
      ref={formRef}
      layout={layout}
      className={`data-adaptive-form ${className ?? ""}`}
    />
  );
}
