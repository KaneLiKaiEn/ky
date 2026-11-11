import React, { useCallback, useMemo, useRef } from "react";
import {
  GridLayout,
  useContainerWidth,
  useResponsiveLayout,
  type Layout,
} from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import WidgetCard from "@/components/WidgetCard";
import {
  BREAKPOINTS,
  COLS,
  GRID_COLS,
  widgetComponents,
  type WidgetDefinition,
} from "@/components/widgets/registry";

interface GridProps {
  widgets: WidgetDefinition[];
  layout: Layout;
  params?: Record<string, any>;
  layoutMode: boolean;
  onLayoutChange: (layout: Layout) => void;
}

const Grid: React.FC<GridProps> = ({
  widgets,
  layout,
  params,
  layoutMode,
  onLayoutChange,
}) => {
  const { width, containerRef, mounted } = useContainerWidth({
    measureBeforeMount: true,
  });

  const lgLayouts = useMemo(() => ({ lg: layout }), [layout]);
  const { layout: activeLayout, cols } = useResponsiveLayout({
    width,
    breakpoints: BREAKPOINTS,
    cols: COLS,
    layouts: lgLayouts,
  });

  const layoutModeRef = useRef(layoutMode);
  layoutModeRef.current = layoutMode;

  const handleLayoutChange = useCallback(
    (next: Layout) => {
      if (layoutModeRef.current) {
        onLayoutChange(next);
      }
    },
    [onLayoutChange],
  );

  const items = useMemo(
    () =>
      widgets.map((widget) => {
        const Body = widgetComponents[widget.code];
        const { x, y, w, h, minW, minH } = widget.defaultLayout;
        return (
          <WidgetCard
            key={widget.code}
            name={widget.name}
            data-grid={{ i: widget.code, x, y, w, h, minW, minH }}
          >
            {Body ? <Body {...params} /> : null}
          </WidgetCard>
        );
      }),
    [widgets],
  );

  const resolvedCols = layoutMode ? GRID_COLS : cols;
  const resolvedLayout = layoutMode ? layout : activeLayout;

  return (
    <div
      ref={containerRef}
      className={layoutMode ? undefined : "widget-grid--readonly"}
    >
      {mounted && width > 0 && (
        <GridLayout
          width={width}
          layout={resolvedLayout}
          gridConfig={{ cols: resolvedCols, rowHeight: 60, margin: [8, 8] }}
          dragConfig={{ handle: ".grid-item__handle", enabled: layoutMode }}
          resizeConfig={{
            enabled: layoutMode,
            handles: layoutMode ? ["se"] : [],
          }}
          onLayoutChange={handleLayoutChange}
        >
          {items}
        </GridLayout>
      )}
    </div>
  );
};

export default Grid;
