import assert from "node:assert/strict";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import dayjs from "../node_modules/dayjs/dayjs.min.js";
import { sourceModules, hookHarness, deferred, flush } from "./helpers.mjs";

const base = resolve(dirname(fileURLToPath(import.meta.url)), "../src/metric");
const components = Object.fromEntries(
  [
    "Alert",
    "Button",
    "Empty",
    "Input",
    "Select",
    "Space",
    "Spin",
    "Switch",
    "Table",
    "Tooltip",
  ].map((name) => [name, name]),
);
function all(node, match) {
  if (!node || typeof node !== "object") return [];
  if (Array.isArray(node)) return node.flatMap((child) => all(child, match));
  return [...(match(node) ? [node] : []), ...all(node.props?.children, match)];
}
const first = (node, match) => all(node, match)[0];
const skeletons = (node) => all(node, (item) => item.type === "ValueSkeleton");
function text(node) {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node !== "object") return String(node);
  return Array.isArray(node)
    ? node.map(text).join("")
    : text(node.props?.children);
}
function setup(service = {}, overrides = {}) {
  const harness = hookHarness();
  const context = {
    identity: "session:user:org",
    libId: 10,
    query: { unitId: 1, date: "2026-09" },
    favorites: [],
    busy: false,
    service,
    selectMetric() {},
  };
  const load = sourceModules({
    base,
    overrides: {
      react: harness.react,
      antd: components,
      dayjs: { default: dayjs },
      "@ant-design/icons": {},
      "data/metric/features/metric-preview/context": {
        usePreview: () => context,
      },
      "data/metric/features/metric-preview/components/Feedback": {
        default: "Feedback",
      },
      "data/metric/features/metric-preview/components/ValueSkeleton": {
        default: "ValueSkeleton",
      },
      "data/metric/features/metric-preview/components/Chart": {
        default: "Chart",
      },
      ...overrides,
    },
  });
  return { harness, context, load };
}

test("favorite tables show named rows and value skeletons while previews keep their existing loading behavior", () => {
  let read = { rows: [], loading: true, expanded: [], loadingRows: new Set() };
  const state = setup(
    {},
    {
      "data/metric/features/metric-preview/hooks/useMetricRows": {
        useMetricRows: () => read,
      },
    },
  );
  const Table = state.load(
    "data/metric/features/metric-preview/components/MetricList",
  ).MetricTable;
  const metrics = [
    {
      metric_id: 1,
      metric_name: "配置名称",
      metric_title: "目录标题",
      child_count: 1,
    },
  ];
  const render = (variant = "favorites") =>
    state.harness.render(() =>
      Table({ metrics, query: state.context.query, variant }),
    );
  const tableOf = (tree) => first(tree, (node) => node.type === "Table").props;
  let table = tableOf(render());
  const row = table.dataSource[0];
  assert.equal(text(table.columns[0].render(null, row)), "目录标题");
  for (const title of ["指标值", "同比", "单位"])
    assert.equal(
      skeletons(
        table.columns
          .find((column) => column.title === title)
          .render(null, row),
      ).length,
      1,
    );
  assert.equal(table.loading, false);
  assert.equal(
    table.columns.some((column) => column.title === "环比"),
    false,
  );
  assert.equal(
    table.columns.find((column) => column.title === null).render(null, row)
      .type,
    "span",
    "loading rows do not mount trend readers",
  );
  assert.equal(
    table.expandable.expandIcon({ record: row }).props.disabled,
    true,
  );
  const preview = tableOf(render("preview"));
  assert.equal(preview.dataSource.length, 0);
  assert.equal(preview.loading, true);

  read = { ...read, loading: false, error: "读取失败" };
  const failed = render();
  table = tableOf(failed);
  assert.equal(table.dataSource.length, 1);
  assert.equal(skeletons(table.columns[1].render(null, row)).length, 0);
  assert.equal(
    first(failed, (node) => node.type === "Feedback").props.read.error,
    "读取失败",
  );
  state.harness.unmount();
});

test("loaded zeroes, negatives and missing values stay visible during favorite table refreshes", () => {
  const rows = [
    {
      key: "/1:0",
      metric_id: 1,
      metric_name: "数值名称",
      metric_value_fmt: "0.00",
      yoy_rate_fmt: "0%",
    },
    {
      key: "/2:1",
      metric_id: 2,
      metric_value_fmt: "-12.25",
      yoy_rate_fmt: "-8%",
    },
    { key: "/3:2", metric_id: 3 },
  ];
  const read = {
    rows,
    loading: false,
    data: { pop_value: true },
    expanded: [],
    loadingRows: new Set(),
  };
  const state = setup(
    {},
    {
      "data/metric/features/metric-preview/hooks/useMetricRows": {
        useMetricRows: () => read,
      },
    },
  );
  state.context.appearance = "dashboard";
  const Table = state.load(
    "data/metric/features/metric-preview/components/MetricList",
  ).MetricTable;
  const render = () =>
    state.harness.render(() =>
      Table({
        metrics: rows,
        query: state.context.query,
        variant: "favorites",
      }),
    );
  render();
  read.loading = true;
  read.data = undefined;
  const node = render();
  const table = first(node, (item) => item.type === "Table").props;
  assert.equal(table.dataSource, rows);
  assert.equal(table.loading, false);
  assert.equal(
    table.columns.some((column) => column.title === "环比"),
    true,
  );
  for (const row of rows) {
    const cell = table.columns[1].render(null, row);
    assert.equal(skeletons(cell).length, 0);
    const number = first(cell, (item) => item.type?.name === "FormattedNumber");
    assert.equal(number.props.value, row.metric_value_fmt);
    assert.equal(text(number.type(number.props)), row.metric_value_fmt ?? "-");
  }
  assert.equal(text(table.columns[0].render(null, rows[0])), "数值名称");
  state.harness.unmount();
});

const metrics = [{ metric_id: 1, metric_name: "主指标", child_count: 1 }];
const childDefinitions = {
  row_list: [{ metric_id: 1, child_id: 2, child_name: "子指标" }],
};
const result = (metric_id, value, date = "2026-09") => ({
  value_list: [
    {
      metric_id,
      object_id: 1,
      date_name: date,
      metric_value_fmt: value,
      yoy_rate_fmt: "0%",
    },
  ],
});
function cardHarness(service, props = {}) {
  const state = setup(service);
  const Card = state.load(
    "data/metric/features/metric-preview/components/Cards",
  ).CardGroup;
  return {
    ...state,
    render: () =>
      state.harness.render(() =>
        Card({
          catalog: { catalog_id: 100, catalog_name: "测试" },
          day: "2026-10-28",
          metrics,
          variant: "favorites",
          ...props,
        }),
      ),
  };
}
const refresh = (node) =>
  first(
    node,
    (item) => item.props?.["aria-label"] === "刷新测试",
  ).props.onClick();

test("card main and child values load independently, retain successful refreshes and reset on a new query", async () => {
  let main = deferred(),
    child = deferred();
  const state = cardHarness({
    childrenBatch: async () => childDefinitions,
    batch: ({ metric_id_list }) =>
      metric_id_list.includes(2) ? child.promise : main.promise,
  });
  let node = state.render();
  await flush();
  node = state.render();
  assert.match(text(node), /主指标/);
  assert.match(text(node), /子指标/);
  assert.equal(skeletons(node).length, 4);
  assert.equal(
    first(
      node,
      (item) =>
        item.type === "button" && item.props.className === "mp-dynamic-card",
    ).props.disabled,
    true,
  );
  main.resolve(result(1, "0.00"));
  await flush();
  node = state.render();
  assert.equal(skeletons(node).length, 2);
  assert.match(text(node), /0\.00/);
  child.resolve(result(2, "-12.25"));
  await flush();
  node = state.render();
  assert.equal(skeletons(node).length, 0);
  assert.match(text(node), /-12\.25/);

  main = deferred();
  child = deferred();
  refresh(node);
  node = state.render();
  assert.equal(skeletons(node).length, 0);
  assert.match(text(node), /0\.00/);
  assert.match(text(node), /-12\.25/);

  state.context.query = { ...state.context.query, date: "2026-10" };
  node = state.render();
  assert.equal(skeletons(node).length, 4);
  assert.doesNotMatch(text(node), /-12\.25/);
  main.resolve(result(1, "3.00", "2026-10"));
  child.resolve(result(2, "4.00", "2026-10"));
  await flush();
  node = state.render();
  assert.equal(skeletons(node).length, 0);
  assert.match(text(node), /4\.00/);
  state.harness.unmount();
});

test("card list requests show three placeholders and preserve known cards on refresh", async () => {
  let list = deferred();
  const state = cardHarness(
    {
      metrics: () => list.promise,
      batch: async () => result(1, "7.00"),
    },
    { metrics: undefined },
  );
  let node = state.render();
  assert.equal(skeletons(node).length, 6);
  assert.equal(
    all(node, (item) => item.props?.className === "mp-dynamic-card").length,
    3,
  );
  list.resolve({ row_list: [{ metric_id: 1, metric_name: "主指标" }] });
  await flush();
  state.render();
  await flush();
  node = state.render();
  assert.match(text(node), /主指标/);
  assert.match(text(node), /7\.00/);
  list = deferred();
  refresh(node);
  node = state.render();
  assert.equal(skeletons(node).length, 0);
  assert.match(text(node), /主指标/);
  assert.match(text(node), /7\.00/);
  list.resolve({ row_list: [] });
  await flush();
  node = state.render();
  assert.doesNotMatch(text(node), /主指标/);
  state.harness.unmount();
});

test("card errors end skeletons, retries restore them and successful missing values stay empty", async () => {
  let main = deferred();
  const state = cardHarness(
    { batch: () => main.promise },
    { metrics: [{ metric_id: 1, metric_name: "主指标" }] },
  );
  state.render();
  main.reject(new Error("读取失败"));
  await flush();
  let node = state.render();
  assert.equal(skeletons(node).length, 0);
  assert.match(text(node), /主指标/);
  const feedback = first(node, (item) => item.type === "Feedback");
  assert.equal(feedback.props.read.error, "读取失败");
  main = deferred();
  const retry = feedback.props.read.reload();
  node = state.render();
  assert.equal(skeletons(node).length, 2);
  main.resolve({ value_list: [] });
  await retry;
  node = state.render();
  assert.equal(skeletons(node).length, 0);
  assert.equal(
    text(first(node, (item) => item.props?.className === "mp-dynamic-number")),
    "-",
  );
  state.harness.unmount();
});

test("preview cards keep waiting for real value rows without favorite placeholders", async () => {
  const main = deferred();
  const state = cardHarness(
    { batch: () => main.promise },
    { metrics: [{ metric_id: 1, metric_name: "主指标" }], variant: "preview" },
  );
  let node = state.render();
  assert.equal(skeletons(node).length, 0);
  assert.doesNotMatch(text(node), /主指标/);
  main.resolve(result(1, "0.00"));
  await flush();
  node = state.render();
  assert.match(text(node), /主指标/);
  assert.match(text(node), /0\.00/);
  state.harness.unmount();
});
