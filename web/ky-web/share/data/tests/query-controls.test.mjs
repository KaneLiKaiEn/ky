import assert from "node:assert/strict";
import dayjs from "dayjs";
import { test } from "node:test";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  sourceModules,
  hookHarness,
  flush,
  deferred,
  plain,
} from "./helpers.mjs";

const base = resolve(dirname(fileURLToPath(import.meta.url)), "../src/metric");
const antd = Object.fromEntries(
  ["Button", "Select", "TreeSelect", "Modal", "Cascader", "Alert"].map(
    (name) => [name, name],
  ),
);
antd.Space = { Compact: "Compact" };
function elements(node) {
  if (!node || typeof node !== "object") return [];
  if (Array.isArray(node)) return node.flatMap(elements);
  return [node, ...elements(node.props?.children)];
}
const field = (tree, label) =>
  elements(tree).find((node) => node.props?.["aria-label"] === label);
const type = (tree, name) => elements(tree).find((node) => node.type === name);
function setup(globals = {}) {
  const h = hookHarness();
  const load = sourceModules({
    base,
    globals,
    overrides: {
      react: h.react,
      antd,
      "data/metric/features/metric-preview/theme": { PreviewModal: "Modal" },
      dayjs: {
        default: (value) =>
          dayjs(value === undefined ? "2026-10-27T12:00:00" : value),
      },
      "@ant-design/icons": {},
      "data/metric/features/query-controls/style.scss": {},
      "data/metric/features/metric-preview/components/LegacyIcon": {
        default: "Icon",
      },
    },
  });
  return { h, load };
}

test("shared time controls preserve empty and invalid values, synchronize external values, and only emit user changes", () => {
  const { h, load } = setup();
  const Dates = load("data/metric/features/query-controls/DateFields").default;
  let value = "",
    calls = [];
  const render = () =>
    h.render(() =>
      Dates({
        value,
        onChange: (next) => {
          calls.push(next);
          value = next;
        },
        allowClear: true,
      }),
    );
  let tree = render();
  assert.equal(field(tree, "查询年份").props.value, undefined);
  assert.deepEqual(calls, []);
  value = "broken";
  tree = render();
  assert.ok(elements(tree).some((node) => node.props?.role === "alert"));
  assert.deepEqual(calls, []);
  value = "2024-Q2";
  tree = render();
  field(tree, "查询年份").props.onChange(2025);
  assert.deepEqual(calls, ["2025-Q2"]);
  tree = render();
  field(tree, "查询时段").props.onChange(["2025-H2"]);
  tree = render();
  assert.equal(value, "2025-H2");
  field(tree, "清除时间").props.onClick();
  assert.equal(value, "");
  h.unmount();
});

test("time controls validate leap days and backwards ranges, support cross-year custom dates and reset custom mode on external changes", () => {
  const { h, load } = setup();
  const Dates = load("data/metric/features/query-controls/DateFields").default;
  let value = "2024-02-29~2024-03-01",
    calls = [];
  const render = () =>
    h.render(() =>
      Dates({
        value,
        onChange: (next) => {
          calls.push(next);
          value = next;
        },
      }),
    );
  let tree = render();
  field(tree, "自选年份").props.onChange(2025);
  tree = render();
  assert.deepEqual(calls, []);
  assert.ok(elements(tree).some((node) => node.props?.role === "alert"));
  value = "2025-12-29~2026-01-04";
  tree = render();
  // Explicitly choose custom mode even though the range is a calendar week.
  field(tree, "查询年份").props.onChange(0);
  tree = render();
  field(tree, "结束日期").props.onChange(["01", "05"]);
  assert.equal(value, "2025-12-29~2026-01-05");
  value = "2026-09";
  tree = render();
  assert.equal(field(tree, "查询时段").props.value[0], "2026-09");
  assert.equal(field(tree, "自选年份"), undefined);
  value = "2026-03-20~2026-03-25";
  tree = render();
  const before = calls.length;
  field(tree, "结束日期").props.onChange(["03", "01"]);
  tree = render();
  assert.equal(calls.length, before);
  assert.ok(elements(tree).some((node) => node.props?.role === "alert"));
  h.unmount();
});

test("single-day PERIOD ranges display the same preset without changing the backend value", () => {
  const { h, load } = setup();
  const Dates = load("data/metric/features/query-controls/DateFields").default;
  const yesterday = "2026-10-26";
  const value = `${yesterday}~${yesterday}`,
    calls = [];
  const tree = h.render(() =>
    Dates({ value, onChange: (next) => calls.push(next) }),
  );
  assert.equal(field(tree, "查询时段").props.value[0], yesterday);
  assert.deepEqual(calls, []);
  h.unmount();
});

test("unit controls reuse supplied roots, merge lazy children, resolve missing names, clear and cancel readers on unmount", async () => {
  const { h, load } = setup();
  const Unit = load("data/metric/features/query-controls/UnitSelect").default;
  let rootCalls = 0,
    value = 9,
    received = [];
  const childWait = deferred();
  let childSignal;
  const source = {
    roots: async () => {
      rootCalls++;
      return [];
    },
    detail: async (id) => ({
      unit_id: id,
      unit_name: "已选科室",
      child_count: 0,
    }),
    children: async (_id, signal) => {
      childSignal = signal;
      return childWait.promise;
    },
    search: async () => [],
  };
  const roots = [{ unit_id: 1, unit_name: "医院", child_count: 1 }];
  const render = () =>
    h.render(() => {
      const inner = Unit({
        value,
        source,
        roots,
        allowClear: true,
        onChange: (id, row) => {
          received.push([id, row]);
          value = id;
        },
      });
      return inner.type(inner.props);
    });
  render();
  await flush();
  let tree = render();
  assert.equal(rootCalls, 0);
  assert.equal(field(tree, "绩效单元").props.treeData.length, 2);
  assert.ok(
    JSON.stringify(field(tree, "绩效单元").props.treeData).includes("已选科室"),
  );
  const pending = field(tree, "绩效单元").props.loadData({ value: 1 });
  childWait.resolve([
    { unit_id: 2, unit_name: "子科室", parent_id: 99, child_count: 0 },
  ]);
  await pending;
  tree = render();
  assert.equal(
    field(tree, "绩效单元").props.treeData.find((node) => node.value === 2).pId,
    1,
  );
  field(tree, "绩效单元").props.onChange(2);
  assert.equal(received[0][1].unit_name, "子科室");
  tree = render();
  field(tree, "绩效单元").props.onChange(undefined);
  assert.equal(value, undefined);
  h.unmount();
  assert.equal(childSignal.aborted, true);
});

test("unit search confirms explicitly, ignores stale responses and cancels without changing the value", async () => {
  const timers = new Map();
  let nextTimer = 0;
  const { h, load } = setup({
    setTimeout: (fn) => {
      timers.set(++nextTimer, fn);
      return nextTimer;
    },
    clearTimeout: (id) => timers.delete(id),
  });
  const Unit = load("data/metric/features/query-controls/UnitSelect").default;
  const waits = new Map(),
    signals = new Map();
  const source = {
    roots: async () => [],
    detail: async () => undefined,
    children: async () => [],
    search: (key, signal) => {
      const wait = deferred();
      waits.set(key, wait);
      signals.set(key, signal);
      return wait.promise;
    },
  };
  const received = [];
  const render = () =>
    h.render(() => {
      const inner = Unit({
        source,
        roots: [],
        onChange: (...args) => received.push(args),
      });
      return inner.type(inner.props);
    });
  const tick = () => {
    const jobs = [...timers.values()];
    timers.clear();
    jobs.forEach((fn) => fn());
  };
  let tree = render();
  field(tree, "检索单元").props.onClick();
  tree = render();
  waits.get("*").resolve([{ unit_id: 1, unit_name: "医院" }]);
  await flush();
  tree = render();
  field(tree, "检索单元关键词").props.onChange(1);
  tree = render();
  type(tree, "Modal").props.onCancel();
  tree = render();
  assert.deepEqual(received, []);
  field(tree, "检索单元").props.onClick();
  tree = render();
  field(tree, "检索单元关键词").props.onSearch("旧");
  tree = render();
  tick();
  tree = render();
  field(tree, "检索单元关键词").props.onSearch("新");
  tree = render();
  tick();
  tree = render();
  assert.equal(signals.get("旧").aborted, true);
  waits.get("新").resolve([{ unit_id: 3, unit_name: "新科室" }]);
  await flush();
  tree = render();
  waits.get("旧").resolve([{ unit_id: 2, unit_name: "旧科室" }]);
  await flush();
  tree = render();
  assert.equal(field(tree, "检索单元关键词").props.options[0].value, 3);
  field(tree, "检索单元关键词").props.onChange(3);
  // Ant Design emits an empty search after selecting an option.
  field(tree, "检索单元关键词").props.onSearch("");
  tree = render();
  type(tree, "Modal").props.onOk();
  assert.equal(received[0][0], 3);
  h.unmount();
});

test("failed unit roots and children can be retried without clearing the controlled value", async () => {
  const { h, load } = setup();
  const Unit = load("data/metric/features/query-controls/UnitSelect").default;
  let rootCalls = 0,
    childCalls = 0;
  const source = {
    roots: async () => {
      if (++rootCalls === 1) throw new Error("根节点失败");
      return [{ unit_id: 1, unit_name: "医院" }];
    },
    detail: async () => undefined,
    search: async () => [],
    children: async () => {
      if (++childCalls === 1) throw new Error("子节点失败");
      return [{ unit_id: 2, unit_name: "科室" }];
    },
  };
  const render = () =>
    h.render(() => {
      const inner = Unit({ source, value: 1, valueName: "医院" });
      return inner.type(inner.props);
    });
  render();
  await flush();
  let tree = render();
  const retry = () =>
    elements(tree)
      .find(
        (node) => node.type === "Button" && node.props.children === "重试单元",
      )
      .props.onClick();
  retry();
  await flush();
  tree = render();
  assert.equal(rootCalls, 2);
  await assert.rejects(
    field(tree, "绩效单元").props.loadData({ value: 1 }),
    /子节点/,
  );
  tree = render();
  retry();
  await flush();
  tree = render();
  assert.equal(childCalls, 2);
  assert.equal(field(tree, "绩效单元").props.value, 1);
  assert.equal(field(tree, "绩效单元").props.treeData.length, 2);
  h.unmount();
});
