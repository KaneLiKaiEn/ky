import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import "./responsive.scss";

export type PreviewLayout = "wide" | "compact" | "mobile";
export const previewLayout = (width: number): PreviewLayout =>
  width < 800 ? "mobile" : width < 1200 ? "compact" : "wide";

const Layout = createContext<{ mode: PreviewLayout; width: number }>({
  mode: "wide",
  width: 1200,
});
export const usePreviewLayout = () => useContext(Layout);

/** Opt in at the page boundary; dashboards and standalone embeds keep their layout. */
export function PreviewLayoutRoot({ children }: { children: ReactNode }) {
  const node = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1200);
  useLayoutEffect(() => {
    const element = node.current;
    if (!element) return;
    const measure = (next: number) => {
      if (next > 0) setWidth(next);
    };
    measure(element.getBoundingClientRect().width);
    const observer = new ResizeObserver(([entry]) =>
      measure(entry.contentRect.width),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const mode = previewLayout(width);
  return (
    <Layout.Provider value={{ mode, width }}>
      <div ref={node} className="mp-responsive-root" data-layout={mode}>
        {children}
      </div>
    </Layout.Provider>
  );
}
