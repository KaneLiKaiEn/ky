import React, { useCallback, useEffect, useMemo, useState } from "react";
import { App, Button, Spin, Switch } from "antd";
import type { Layout } from "react-grid-layout";
import { getSessionId } from "comm/session";
import { getSessionInfo } from "@/api/auth";
import { getWidgetList } from "@/api/federation";
import { readString, writeString } from "@/api/file";
import Grid from "@/components/Grid";
import {
  DEFAULT_WIDGETS,
  GRID_COLS,
  parseWidgetSnapshot,
  toLayoutItems,
  type WidgetDefinition,
} from "@/components/widgets/registry";
import type { WidgetRow } from "@/types/federation";
import WidgetDrawer from "./WidgetDrawer";

export interface WidgetFileLink {
  link_app: string;
  link_name: string;
  link_data?: string;
}

interface WidgetCanvasProps {
  fileLink: WidgetFileLink;
  params?: Record<string, any>;
  enableDefaultLayout?: boolean;
}

const DEFAULT_LAYOUT_LINK_DATA = "0";

const isEmptyContent = (raw?: string) => {
  const text = raw?.trim() ?? "";
  return text === "" || text === "[]";
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const mergeLayoutIntoWidgets = (
  widgets: WidgetDefinition[],
  layout: Layout,
): WidgetDefinition[] => {
  const itemMap = new Map(layout.map((item) => [item.i, item]));
  return widgets.map((widget) => {
    const item = itemMap.get(widget.code);
    if (!item) return widget;
    return {
      ...widget,
      defaultLayout: {
        ...widget.defaultLayout,
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
      },
    };
  });
};

const nextBottomY = (layout: Layout): number =>
  layout.reduce((max, item) => Math.max(max, item.y + item.h), 0);

const sizeFromRow = (row: WidgetRow): { w: number; h: number } => ({
  w: clamp(Number(row.widget_width) || 12, 1, GRID_COLS),
  h: clamp(Number(row.widget_height) || 4, 1, 50),
});

const WidgetCanvas: React.FC<WidgetCanvasProps> = ({
  fileLink,
  params,
  enableDefaultLayout = false,
}) => {
  const { link_app, link_name, link_data } = fileLink;
  const { message } = App.useApp();
  const [userId, setUserId] = useState<number>();
  const [widgets, setWidgets] = useState<WidgetDefinition[]>(DEFAULT_WIDGETS);
  const [layout, setLayout] = useState<Layout>(() =>
    toLayoutItems(DEFAULT_WIDGETS),
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingDefault, setSavingDefault] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [catalog, setCatalog] = useState<WidgetRow[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [layoutMode, setLayoutMode] = useState(false);

  const addedCodes = useMemo(
    () => new Set(widgets.map((widget) => widget.code)),
    [widgets],
  );

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setWidgets(DEFAULT_WIDGETS);
      setLayout(toLayoutItems(DEFAULT_WIDGETS));
      try {
        const sessionRes = await getSessionInfo({
          session_id: getSessionId() ?? undefined,
        });
        const id = sessionRes.session_info?.user_id;
        if (!id) return;
        if (!cancelled) setUserId(id);

        try {
          const fileRes = await readString({
            link_app,
            link_name,
            link_value: id,
            ...(link_data !== undefined ? { link_data } : {}),
          });
          let content = fileRes.file_content;
          if (
            enableDefaultLayout &&
            link_data !== DEFAULT_LAYOUT_LINK_DATA &&
            isEmptyContent(content)
          ) {
            const defaultRes = await readString({
              link_app,
              link_name,
              link_value: id,
              link_data: DEFAULT_LAYOUT_LINK_DATA,
            });
            content = defaultRes.file_content;
          }
          const parsed = parseWidgetSnapshot(content);
          if (!cancelled && parsed) {
            setWidgets(parsed);
            setLayout(toLayoutItems(parsed));
          }
        } catch {
          // 未保存过或读取失败时沿用默认布局
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [enableDefaultLayout, link_app, link_data, link_name]);

  const handleLayoutChange = useCallback((next: Layout) => {
    setLayout(next);
  }, []);

  const handleOpenDrawer = useCallback(async () => {
    setLayoutMode(true);
    setDrawerOpen(true);
    setCatalogLoading(true);
    try {
      const res = await getWidgetList({ widget_type: link_name });
      setCatalog(res.row_list ?? []);
    } catch {
      setCatalog([]);
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  const handleAddWidget = useCallback(
    (row: WidgetRow) => {
      const code = row.widget_code;
      if (!code) return;
      if (addedCodes.has(code)) {
        message.info("已在工作台中");
        return;
      }

      const { w, h } = sizeFromRow(row);
      const defaultLayout = {
        x: 0,
        y: nextBottomY(layout),
        w,
        h,
        minW: 3,
        minH: 2,
      };
      const nextWidget: WidgetDefinition = {
        code,
        name: row.widget_name || code,
        defaultLayout,
      };

      setWidgets((prev) => [...prev, nextWidget]);
      setLayout((prev) => [...prev, { i: code, ...defaultLayout }]);
    },
    [addedCodes, layout, message],
  );

  const handleRemoveWidget = useCallback((code: string) => {
    setWidgets((prev) => prev.filter((widget) => widget.code !== code));
    setLayout((prev) => prev.filter((item) => item.i !== code));
  }, []);

  const handleClearLayout = useCallback(() => {
    setWidgets([]);
    setLayout([]);
  }, []);

  const handleSave = useCallback(async () => {
    if (!userId) {
      message.error("无法获取当前用户");
      return;
    }
    setSaving(true);
    try {
      const snapshot = mergeLayoutIntoWidgets(widgets, layout);
      await writeString({
        link_app,
        link_name,
        link_value: userId,
        ...(link_data !== undefined ? { link_data } : {}),
        file_content: JSON.stringify(snapshot),
      });
      setWidgets(snapshot);
      message.success("保存成功");
    } catch {
      // 错误由 comm/request 统一提示
    } finally {
      setSaving(false);
    }
  }, [layout, link_app, link_data, link_name, message, userId, widgets]);

  const handleSaveDefault = useCallback(async () => {
    if (!userId) {
      message.error("无法获取当前用户");
      return;
    }
    setSavingDefault(true);
    try {
      const snapshot = mergeLayoutIntoWidgets(widgets, layout);
      await writeString({
        link_app,
        link_name,
        link_value: userId,
        link_data: DEFAULT_LAYOUT_LINK_DATA,
        file_content: JSON.stringify(snapshot),
      });
      setWidgets(snapshot);
      message.success("缺省布局保存成功");
    } catch {
      // 错误由 comm/request 统一提示
    } finally {
      setSavingDefault(false);
    }
  }, [layout, link_app, link_name, message, userId, widgets]);

  return (
    <div className="h-full min-h-0 overflow-auto">
      <div className="flex min-h-full flex-col">
        <div className="flex-1">
          {loading ? (
            <div className="flex justify-center py-20">
              <Spin />
            </div>
          ) : (
            <Grid
              widgets={widgets}
              layout={layout}
              params={params}
              layoutMode={layoutMode}
              onLayoutChange={handleLayoutChange}
            />
          )}
        </div>
        <div className="flex shrink-0 justify-center py-2">
          <div className="flex items-center gap-2 rounded-lg bg-(--app-theme-bg-elevated) p-2 shadow-lg ring-1 ring-(--app-theme-border)">
            <Button
              loading={saving}
              type="primary"
              size="small"
              onClick={() => void handleSave()}
            >
              保存{enableDefaultLayout ? "患者" : "工作台"}布局
              {/* TODO: 换种实用性更好的做法 */}
            </Button>
            {enableDefaultLayout && (
              <Button
                loading={savingDefault}
                type="primary"
                size="small"
                onClick={() => void handleSaveDefault()}
              >
                保存缺省布局
              </Button>
            )}
            <Button
              type="primary"
              size="small"
              onClick={() => void handleOpenDrawer()}
            >
              编辑小组件
            </Button>
            <Switch
              size="small"
              checked={layoutMode}
              onChange={setLayoutMode}
              checkedChildren="布局模式"
              unCheckedChildren="布局模式"
            />
          </div>
        </div>
      </div>

      <WidgetDrawer
        open={drawerOpen}
        loading={catalogLoading}
        catalog={catalog}
        addedCodes={addedCodes}
        onClose={() => setDrawerOpen(false)}
        onAdd={handleAddWidget}
        onRemove={handleRemoveWidget}
        onClear={handleClearLayout}
      />
    </div>
  );
};

export default WidgetCanvas;
