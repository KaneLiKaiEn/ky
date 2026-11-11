import { useAppTheme } from "comm/theme";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Alert, Button, Empty, Modal, Space, Spin, Tag } from "antd";
import { getBackgroundFile, getBannerDefList } from "../../../api/board";
import { useBlobUrl } from "../../../hooks/useBlobUrl";
import { useManagementStyle } from "../../../hooks/useManagementStyle";
import type { ArgValueRow } from "../../../types/references.d.ts";
import { useRead } from "../hooks/useRead";
import {
  cellGeometry,
  hasTag,
  mergeArguments,
  positiveId,
  refreshTargets,
  relatedParams,
  supportedType,
} from "../model";
import {
  checkSignal,
  createRefreshScheduler,
  type LoadQueue,
  type PreviewTarget,
} from "../runtime";
import {
  imageMime,
  loadBoard,
  loadComponent,
  resolvePictures,
  type BoardData,
} from "../service";
import ParameterForm from "./ParameterForm";
import ComponentCard, { type ComponentRun } from "./ComponentCard";
import ChartFrame, { type BoardActions } from "./ChartFrame";
import RemotePreview from "./RemotePreview";

export default function BoardView({
  boardId,
  queue,
  screen = false,
  inherited = [],
  depth = 0,
  showLinks = true,
  embedded = false,
  refreshKey,
  autoRefresh = true,
  onBusyChange,
  onNavigate,
}: {
  boardId: number;
  queue: LoadQueue;
  screen?: boolean;
  inherited?: ArgValueRow[];
  depth?: number;
  showLinks?: boolean;
  embedded?: boolean;
  refreshKey?: number;
  autoRefresh?: boolean;
  onBusyChange?: (busy: boolean) => void;
  onNavigate?: (target: PreviewTarget) => void;
}) {
  const board = useRead(`board:${boardId}`, (signal) =>
    queue.run(signal, () => loadBoard(boardId, signal)),
  );
  return board.error ? (
    <Alert
      type="error"
      showIcon
      title={board.error}
      action={<Button onClick={board.reload}>重试读取看板</Button>}
    />
  ) : board.loading || !board.data ? (
    <div className="bp-loading">
      <Spin />
    </div>
  ) : (
    <ReadyBoard
      key={boardId}
      data={board.data}
      boardId={boardId}
      queue={queue}
      screen={screen}
      inherited={inherited}
      depth={depth}
      showLinks={showLinks}
      embedded={embedded}
      refreshKey={refreshKey}
      autoRefresh={autoRefresh}
      onBusyChange={onBusyChange}
      onNavigate={onNavigate}
      reload={board.reload}
    />
  );
}
function ReadyBoard({
  data,
  boardId,
  queue,
  screen,
  inherited,
  depth,
  showLinks,
  embedded,
  refreshKey,
  autoRefresh,
  onBusyChange,
  onNavigate,
  reload,
}: {
  data: BoardData;
  boardId: number;
  queue: LoadQueue;
  screen: boolean;
  inherited: ArgValueRow[];
  depth: number;
  showLinks: boolean;
  embedded: boolean;
  refreshKey?: number;
  autoRefresh: boolean;
  onBusyChange?: (busy: boolean) => void;
  onNavigate?: (target: PreviewTarget) => void;
  reload: () => void;
}) {
  const eligible = useMemo(
    () =>
      data.components.filter(
        (row) =>
          supportedType(row.component_type) &&
          positiveId(row.board_component_id),
      ),
    [data.components],
  );
  const ids = useMemo(
    () => eligible.map((row) => row.board_component_id!),
    [eligible],
  );
  const [applied, setApplied] = useState(() =>
    mergeArguments(data.parameters, inherited),
  );
  const [runs, setRuns] = useState<Record<number, ComponentRun>>(() =>
    Object.fromEntries(ids.map((id) => [id, { args: applied, revision: 0 }])),
  );
  const [detail, setDetail] = useState<PreviewTarget & { key: number }>();
  const [locks, setLocks] = useState<Record<string, boolean>>({});
  const busy = Object.values(locks).some(Boolean);
  const setBusy = useCallback(
    (key: string, value: boolean) =>
      setLocks((old) => (old[key] === value ? old : { ...old, [key]: value })),
    [],
  );
  const childBusy = useCallback(
    (value: boolean) => setBusy("child", value),
    [setBusy],
  );
  useEffect(() => {
    onBusyChange?.(busy);
    return () => onBusyChange?.(false);
  }, [busy, onBusyChange]);
  const [notice, setNotice] = useState<string>();
  const [params, setParams] = useSearchParams();
  const requestedRelated = positiveId(params.get("related_board_id"));
  const linkedBoard =
    screen &&
    showLinks &&
    depth === 0 &&
    requestedRelated !== boardId &&
    data.links.some((link) => positiveId(link.link_value) === requestedRelated)
      ? requestedRelated
      : undefined;
  const setLinkedBoard = (id?: number) => setParams(relatedParams(params, id));
  const style = useManagementStyle();
  const latest = useRef(applied);
  latest.current = applied;
  const refresh = useCallback(
    (args: ArgValueRow[], source = 0, target = 0, only?: number[]) => {
      const targets = refreshTargets(only ?? ids, source, target);
      setRuns((previous) => {
        const next = { ...previous };
        for (const id of targets)
          next[id] = { args, revision: (previous[id]?.revision ?? 0) + 1 };
        return next;
      });
    },
    [ids],
  );
  const openTarget = (target: PreviewTarget) => {
    if (busy) return;
    if ((target.depth ?? depth + 1) > 5) {
      setNotice("明细已达到最大嵌套层数，请关闭部分明细后重试");
      return;
    }
    const next = {
      ...target,
      depth: target.depth ?? depth + 1,
      argList: mergeArguments(
        latest.current,
        target.argList,
      ) as PreviewTarget["argList"],
    };
    if (onNavigate) onNavigate(next);
    else setDetail({ ...next, key: Date.now() });
  };
  const actions: BoardActions = {
    busy,
    setBusy,
    depth,
    openTarget,
    cascade: (code, value, source, target) => {
      const args = mergeArguments(latest.current, [
        { arg_code: code, arg_value: value },
      ]);
      latest.current = args;
      setApplied(args);
      refresh(args, source, target);
    },
    openBoard: (id, args) =>
      openTarget({
        type: "BOARD",
        id,
        argList: (args ?? []) as PreviewTarget["argList"],
      }),
    openReport: (id, args) =>
      openTarget({
        type: "REPORT",
        id,
        argList: (args ?? []) as PreviewTarget["argList"],
      }),
  };
  useEffect(
    () =>
      linkedBoard || !autoRefresh
        ? undefined
        : createRefreshScheduler(
            Number(data.board.refresh_interval ?? 0),
            eligible.map((row) => ({
              id: row.board_component_id!,
              seconds: Number(row.refresh_interval ?? 0),
            })),
            (only) => refresh(latest.current, 0, 0, only),
            {
              now: () => Date.now(),
              setTimer: (fn, delay) => setTimeout(fn, delay),
              clearTimer: (id) => clearTimeout(id),
              hidden: () => document.hidden,
              listen: (fn) => {
                document.addEventListener("visibilitychange", fn);
                return () =>
                  document.removeEventListener("visibilitychange", fn);
              },
            },
          ),
    [data, refresh, linkedBoard, autoRefresh],
  );
  const inheritedKey = JSON.stringify(inherited);
  const external = useRef({ inheritedKey, refreshKey });
  useEffect(() => {
    if (busy) return;
    const previous = external.current;
    if (
      previous.inheritedKey === inheritedKey &&
      previous.refreshKey === refreshKey
    )
      return;
    external.current = { inheritedKey, refreshKey };
    const next =
      previous.inheritedKey === inheritedKey
        ? latest.current
        : mergeArguments(data.parameters, inherited);
    latest.current = next;
    setApplied(next);
    refresh(next);
  }, [inheritedKey, refreshKey, busy, data.parameters, refresh]);
  return (
    <div className={`bp-board ${screen ? "bp-board-screen" : ""}`}>
      {!linkedBoard && (
        <>
          {!embedded && (
            <div className="bp-board-heading">
              <div>
                <h2>{data.board.board_title || data.board.board_name}</h2>
                {data.board.board_desc && (
                  <span className="bp-muted">{data.board.board_desc}</span>
                )}
              </div>
              <Space wrap>
                {hasTag(data.board.board_tag, "FULLTIME") && <Clock />}
                <Button disabled={busy} onClick={reload}>
                  重新读取配置
                </Button>
              </Space>
            </div>
          )}
          {notice && (
            <Alert
              showIcon
              type="info"
              title={notice}
              closable
              onClose={() => setNotice(undefined)}
            />
          )}
          {screen && <Banner data={data} boardId={boardId} queue={queue} />}
          <ParameterForm
            disabled={busy}
            rows={data.parameters}
            applied={applied}
            queue={queue}
            onApply={(args) => {
              if (busy) return;
              const next = mergeArguments(latest.current, args);
              latest.current = next;
              setApplied(next);
              refresh(next);
            }}
          />
        </>
      )}
      {screen && showLinks && data.links.length > 0 && (
        <Space wrap className="bp-related" aria-label="相关看板">
          <Button
            disabled={busy}
            type={!linkedBoard ? "primary" : "default"}
            onClick={() => setLinkedBoard(undefined)}
          >
            {data.board.board_name}
          </Button>
          {data.links.map((link, index) => (
            <Button
              key={link.row_id ?? index}
              disabled={busy || !positiveId(link.link_value)}
              type={
                linkedBoard === Number(link.link_value) ? "primary" : "default"
              }
              onClick={() =>
                setLinkedBoard(
                  Number(link.link_value) === boardId
                    ? undefined
                    : Number(link.link_value),
                )
              }
            >
              {link.link_name || `看板 ${link.link_value}`}
            </Button>
          ))}
        </Space>
      )}
      {linkedBoard && linkedBoard !== boardId ? (
        <div className="bp-linked-view">
          <BoardView
            key={linkedBoard}
            boardId={linkedBoard}
            queue={queue}
            screen
            inherited={applied}
            depth={depth + 1}
            showLinks={false}
            refreshKey={refreshKey}
            autoRefresh={autoRefresh}
            onBusyChange={childBusy}
          />
        </div>
      ) : (
        <Canvas
          data={data}
          queue={queue}
          boardId={boardId}
          screen={screen}
          runs={runs}
          actions={actions}
          refresh={(id) => refresh(latest.current, 0, id)}
        />
      )}
      {detail && (
        <Modal
          title={
            detail.title ||
            `${detail.type === "BOARD" ? "看板" : "报表"}明细 #${detail.id}`
          }
          open
          width="94vw"
          zIndex={1500 + (detail.depth ?? depth + 1) * 100}
          style={{ ...style, top: 24 }}
          styles={{ body: { height: "78vh", overflow: "auto" } }}
          destroyOnHidden
          closable={!busy}
          mask={{ closable: !busy }}
          keyboard={!busy}
          onCancel={() => {
            if (!busy) setDetail(undefined);
          }}
          footer={null}
        >
          {detail.type === "BOARD" ? (
            <BoardView
              key={`${detail.id}:${detail.key}`}
              boardId={detail.id}
              inherited={detail.argList}
              queue={queue}
              depth={detail.depth}
              embedded={embedded}
              autoRefresh={autoRefresh}
              onBusyChange={childBusy}
            />
          ) : (
            <RemotePreview
              key={`${detail.id}:${detail.key}`}
              type="REPORT"
              id={detail.id}
              args={detail.argList}
              revision={0}
              runner={queue.run}
              depth={detail.depth!}
              onBusyChange={childBusy}
              onNavigate={openTarget}
            />
          )}
        </Modal>
      )}
    </div>
  );
}
function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <time dateTime={now.toISOString()}>
      {now.toLocaleString("zh-CN", { hour12: false })}
    </time>
  );
}
function Canvas({
  data,
  boardId,
  queue,
  screen,
  runs,
  actions,
  refresh,
}: {
  data: BoardData;
  boardId: number;
  queue: LoadQueue;
  screen: boolean;
  runs: Record<number, ComponentRun>;
  actions: BoardActions;
  refresh: (id: number) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const node = container.current!;
    const observer = new ResizeObserver(() =>
      setSize({ width: node.clientWidth, height: node.clientHeight }),
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const mobile = size.width > 0 && size.width < 640;
  const extent = Math.max(1, ...data.cells.map((cell) => cell.y + cell.h));
  const rowHeight =
    screen && !mobile
      ? Math.max(1, (size.height - 8 - extent * 8) / extent)
      : 12;
  const height =
    screen && !mobile
      ? Math.max(size.height, extent * (rowHeight + 8) + 8)
      : extent * 20 + 8;
  const components = new Map(
    data.components.map((row) => [row.board_component_id, row]),
  );
  const cells = mobile
    ? [...data.cells].sort((a, b) => a.y - b.y || a.x - b.x)
    : data.cells;
  return (
    <div
      ref={container}
      className={`bp-canvas-viewport ${mobile ? "bp-mobile" : ""}`}
    >
      <Background
        data={data}
        boardId={boardId}
        queue={queue}
        width={size.width}
        height={size.height}
        runs={runs}
      />
      {!cells.length ? (
        <Empty description="该看板尚未配置布局" />
      ) : (
        <div
          className="bp-canvas"
          style={{ height: mobile ? undefined : height }}
        >
          {cells.map((cell) => {
            const component = components.get(cell.id);
            return (
              <div
                key={cell.i}
                className="bp-cell"
                data-cell-id={cell.i}
                style={
                  mobile
                    ? { height: Math.max(240, cell.h * 20 - 8) }
                    : cellGeometry(cell, size.width, rowHeight)
                }
              >
                {component ? (
                  <ComponentCard
                    component={{ ...component, board_id: boardId }}
                    queue={queue}
                    screen={screen}
                    actions={actions}
                    run={runs[cell.id] ?? { args: [], revision: 0 }}
                    refresh={() => refresh(cell.id)}
                  />
                ) : (
                  <div className="bp-missing">
                    <Tag color={cell.id ? "warning" : undefined}>
                      {cell.id ? `组件已失效 #${cell.id}` : "未绑定组件"}
                    </Tag>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
function Background({
  data,
  boardId,
  queue,
  width,
  height,
  runs,
}: {
  data: BoardData;
  boardId: number;
  queue: LoadQueue;
  width: number;
  height: number;
  runs: Record<number, ComponentRun>;
}) {
  const id = positiveId(data.board.background_id);
  const { resolvedMode } = useAppTheme();
  const component = data.components.find(
    (row) => row.board_component_id === id,
  );
  const run = id ? runs[id] : undefined;
  const [stableSize, setStableSize] = useState({ width, height });
  useEffect(() => {
    const timer = setTimeout(() => setStableSize({ width, height }), 180);
    return () => clearTimeout(timer);
  }, [width, height]);
  const key =
    data.board.background_type === "COMPONENT"
      ? `${stableSize.width}:${stableSize.height}:${JSON.stringify(run?.args)}:${resolvedMode}`
      : "file";
  const read = useRead(
    `background:${id}:${data.board.background_type}:${key}`,
    async (signal) => {
      if (!id) return undefined;
      return queue.run(signal, async () => {
        if (data.board.background_type === "COMPONENT") {
          if (!component || component.component_type !== "CHART")
            return { notice: "背景组件不可用或本版暂未开放" };
          if (!stableSize.width || !stableSize.height) return undefined;
          return {
            result: (
              await loadComponent(
                { ...component, board_id: boardId },
                run?.args ?? [],
                stableSize.width,
                stableSize.height,
                resolvedMode,
                false,
                signal,
              )
            ).result,
          };
        }
        const response = await getBackgroundFile({ background_id: id });
        checkSignal(signal);
        const format = response.file_format ?? "";
        const mime = format.includes("/")
          ? format
          : ["mp4", "webm", "ogg"].includes(format)
            ? `video/${format}`
            : imageMime(response.file_content ?? "", format);
        return { content: response.file_content, mime };
      });
    },
    run?.revision,
  );
  const blob = useBlobUrl(read.data?.content, read.data?.mime ?? "image/png");
  return (
    <>
      {(read.error || blob.error || read.data?.notice) && (
        <div className="bp-background-notice">
          <Alert
            type="warning"
            title={read.error || blob.error || read.data?.notice}
            action={
              <Button size="small" onClick={read.reload}>
                重试背景
              </Button>
            }
          />
        </div>
      )}
      <div className="bp-background" aria-hidden>
        {read.data?.result ? (
          <ChartFrame result={read.data.result} title="看板组件背景" />
        ) : blob.url ? (
          read.data?.mime?.startsWith("video/") ? (
            <video src={blob.url} autoPlay muted loop playsInline />
          ) : (
            <img src={blob.url} alt="" />
          )
        ) : null}
      </div>
    </>
  );
}
function Banner({
  data,
  boardId,
  queue,
}: {
  data: BoardData;
  boardId: number;
  queue: LoadQueue;
}) {
  const banner = useRead(`banner:${data.board.banner_id}`, async (signal) => {
    if (!positiveId(data.board.banner_id)) return undefined;
    return queue.run(signal, async () => {
      const response = await getBannerDefList({
        banner_id: data.board.banner_id,
      });
      checkSignal(signal);
      const definitions = Object.fromEntries(
        (response.row_list ?? []).map((row) => [
          row.item_code,
          row.item_value ?? "",
        ]),
      );
      if (!Object.keys(definitions).length) return undefined;
      const title = (
        data.board.board_title ||
        data.board.banner_title ||
        data.board.board_name ||
        ""
      ).replace(
        /[&<>"']/g,
        (c) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          })[c]!,
      );
      return resolvePictures(
        {
          code: 0,
          html_content: `${definitions.PREFIX_HTML ?? ""}<div class="banner-text">${title}</div>${definitions.SUFFIX_HTML ?? ""}`,
          style_content: definitions.CLASS ?? definitions.STYLE ?? "",
          script_content: definitions.SCRIPT ?? "",
        },
        { boardId, bannerId: data.board.banner_id },
        signal,
      );
    });
  });
  return banner.error ? (
    <Alert
      type="warning"
      title={banner.error}
      action={<Button onClick={banner.reload}>重试标题栏</Button>}
    />
  ) : banner.data ? (
    <div className="bp-banner">
      <ChartFrame
        result={banner.data}
        title="看板标题栏"
        libraries={false}
        fit={false}
      />
    </div>
  ) : null;
}
