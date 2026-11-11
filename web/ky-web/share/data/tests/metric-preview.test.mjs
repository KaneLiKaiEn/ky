import assert from "node:assert/strict";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import dayjs from "../node_modules/dayjs/dayjs.min.js";
import {
  sourceModules,
  plain,
  deferred,
  flush,
  hookHarness,
} from "./helpers.mjs";

const base = resolve(dirname(fileURLToPath(import.meta.url)), "../src/metric");
const load = sourceModules({
  base,
  globals: { DOMException },
  overrides: { dayjs: { default: dayjs } },
});
const model = load("data/metric/features/metric-preview/model"),
  dates = load("data/metric/features/metric-preview/dates");
const { createRuntime, autoRefresh } = load(
  "data/metric/features/metric-preview/runtime",
);
const { defaultFilters } = load("data/metric/features/metric-preview/types");
const { treemapOption } = load(
  "data/metric/features/metric-preview/chartOptions",
);

test("embedded custom details inherit all board arguments and explicit drill values win", () => {
  const inherited = [
    { arg_code: "query", arg_type: "STR", arg_value: "保留" },
    { arg_code: "arg_unit", arg_type: "UNIT", arg_value: "1" },
  ];
  const next = model.mergePreviewArguments(inherited, [
    { arg_code: "arg_unit", arg_type: "INT", arg_value: "2" },
  ]);
  assert.deepEqual(plain(next), [
    { arg_code: "query", arg_type: "STR", arg_value: "保留" },
    { arg_code: "arg_unit", arg_type: "INT", arg_value: "2" },
  ]);
  assert.equal(inherited[1].arg_value, "1");
});

test("board metric arguments prefer explicit aliases and unique PERIOD before DATE without hiding invalid input", async () => {
  const { embeddedArguments, embeddedQuery } = load(
    "data/metric/features/metric-preview/embeddedQuery",
  );
  const arg = (arg_code, arg_value, arg_type = "STR") => ({
    arg_code,
    arg_value,
    arg_type,
  });
  const args = [
    arg("arg_unit", "2"),
    arg("unit_id", "9"),
    arg("arg_period", "2026-Q2"),
    arg("arg_date", "2026-01"),
    arg("arg_entity", "3"),
  ];
  assert.deepEqual(plain(embeddedArguments(args)), {
    unitId: 2,
    entityId: 3,
    date: "2026-Q2",
  });
  assert.equal(
    embeddedArguments([
      arg("period", "2026-H2", "PERIOD"),
      arg("day", "2026-10-01", "DATE"),
    ]).date,
    "2026-H2",
  );
  assert.throws(() => embeddedArguments([arg("arg_unit", "0")]), /ID/);
  assert.throws(() => embeddedArguments([arg("arg_period", "bad")]), /日期/);
  assert.throws(
    () =>
      embeddedArguments([
        arg("a", "2026-01", "PERIOD"),
        arg("b", "2026-02", "PERIOD"),
      ]),
    /无法确定/,
  );
  let defaults = 0,
    roots = 0;
  const service = {
    defaults: async () => {
      defaults++;
      return { date_name: "2026-09" };
    },
    units: async () => {
      roots++;
      return { row_list: [{ unit_id: 4, unit_name: "默认医院" }] };
    },
    unit: async ({ unit_id }) => ({
      unit_property: { unit_name: `医院${unit_id}` },
    }),
  };
  const signal = new AbortController().signal;
  assert.equal((await embeddedQuery(service, 1, args, signal)).unitId, 2);
  assert.equal(defaults, 0);
  assert.deepEqual(plain(await embeddedQuery(service, 1, [], signal)), {
    unitId: 4,
    unitName: "默认医院",
    date: "2026-09",
  });
  assert.equal(defaults, 1);
  assert.equal(roots, 1);
  await assert.rejects(
    embeddedQuery(service, 1, [arg("arg_unit", "-1")], signal),
    /ID/,
  );
  assert.equal(defaults, 1);
  const values = model.metricRows(
    [{ metric_id: 2 }, { metric_id: 1 }],
    [
      {
        metric_id: 1,
        object_id: 4,
        date_name: "2026-09",
        metric_value_fmt: "0",
      },
      {
        metric_id: 2,
        object_id: 4,
        date_name: "2026-09",
        metric_value_fmt: "12",
      },
    ],
    { unitId: 4, date: "2026-09" },
  );
  assert.deepEqual(plain(values.map((r) => r.metric_value_fmt)), ["12", "0"]);
});

test("child treemap uses raw values for area and tooltips and handles all-zero data", () => {
  const option = treemapOption([
    {
      metric_name: "门诊人次",
      metric_value: "1234.5",
      metric_value_fmt: "1,234.50",
    },
    { metric_name: "急诊人次", metric_value: "0", metric_value_fmt: "0.00" },
  ]);
  assert.equal(option.series[0].type, "treemap");
  assert.deepEqual(plain(option.series[0].data), [
    { name: "门诊人次", value: 1234.5 },
    { name: "急诊人次", value: 0 },
  ]);
  assert.equal(
    option.tooltip.formatter({ name: "门诊人次", value: 1234.5 }),
    "门诊人次: 1234.5",
  );
  const empty = treemapOption([
    { metric_name: "门诊人次", metric_value: "0" },
    { metric_name: "急诊人次", metric_value: "0.00" },
  ]);
  assert.equal(empty.title.text, "暂无数据");
  assert.deepEqual(plain(empty.series), []);
});

test("metric analysis request uses the selected metric, unit and period bounds", () => {
  assert.deepEqual(
    plain(
      model.metricAnalysisParams(
        { metric_id: 7, metric_name: "门诊人次" },
        { unitId: 3, unitName: "内科", date: "2026-Q2" },
        11,
        "configured-model",
      ),
    ),
    {
      metric_id: 7,
      metric_name: "门诊人次",
      lib_id: 11,
      unit_id: 3,
      unit_name: "内科",
      date_start: "2026-04-01",
      date_end: "2026-06-30",
      model_code: "configured-model",
      question:
        "你是一名资深医院运营管理顾问，熟悉公立医院绩效考核、DRG/DIP支付改革、平衡计分卡、本量利分析、标杆管理、数据包络分析等工具，长期为医院院长、书记、总会计师和运营管理部门提供决策支持。请查询并分析「内科」（unit_id=3）在2026-Q2（2026-04-01至2026-06-30）的「门诊人次」（metric_id=7）。分析方法：首先获取该项指标的值以及同比、环比、目标等，可以根据分析需要获取指标趋势，也可以根据需要获取「内科」（unit_id=3）的子单元该指标的值进行多维度分析。输出建议：先对指标值进行总体评价，如果发现问题，就深入分析问题，找到导致该问题的主要原因，最后提出改进建议。输出只依据本次查询到的数据，缺少的数据直接说明，不要编造。",
    },
  );
  const unspecified = model.metricAnalysisParams(
    { metric_id: 1 },
    { unitId: 2, unitName: "全院", date: "2024" },
  );
  assert.equal(unspecified.lib_id, 0);
  assert.equal("model_code" in unspecified, false);
  assert.equal(unspecified.metric_name, undefined);
  assert.equal(unspecified.date_start, "2024-01-01");
  assert.equal(unspecified.date_end, "2024-12-31");
  assert.equal("exclude_lib_list" in unspecified, false);
  assert.match(unspecified.question, /当前指标/);
  assert.match(unspecified.question, /全院/);
  assert.match(unspecified.question, /2024-01-01至2024-12-31/);
});

test("date periods include leap days, year transitions and cross-year weeks", () => {
  assert.deepEqual(plain(dates.dateBounds("2024-02")), {
    start: "2024-02-01",
    end: "2024-02-29",
  });
  assert.deepEqual(plain(dates.dateBounds("2026-H2")), {
    start: "2026-07-01",
    end: "2026-12-31",
  });
  assert.deepEqual(plain(dates.dateBounds("2026-Q4")), {
    start: "2026-10-01",
    end: "2026-12-31",
  });
  assert.equal(dates.dateBounds("2026-01~03").end, "2026-03-31");
  assert.equal(dates.dateBounds("2026-12-28~01-03").end, "2027-01-03");
  assert.equal(dates.dateBounds("2023-12-28~02-29").end, "2024-02-29");
  assert.throws(() => dates.dateBounds("2026-09-10~09-01"), /结束日期/);
  assert.throws(() => dates.dateBounds("2026-02-29"), /日期/);
  assert.throws(() => dates.dateBounds("2026-H3"), /周期/);
  assert.throws(() => dates.dateBounds("2026-11~02"), /结束日期/);
  assert.equal(dates.defaultDate("MONTH", dayjs("2027-01-01")), "2026-12");
  assert.equal(
    dates.defaultDate("DAYS", dayjs("2027-01-01")),
    "2026-01-01~2026-12-31",
  );
  assert.equal(dates.defaultDate("QUARTER", dayjs("2027-01-01")), "2026-Q4");
  assert.equal(
    dates.previousWeek(dayjs("2027-01-01")),
    "2026-12-21~2026-12-27",
  );
  assert.equal(
    dates.groupDate("今天", "2026-09", dayjs("2026-10-26")),
    "2026-10-26",
  );
  assert.deepEqual(plain(dates.seriesDates("2024-03-01", "D", 2)), [
    "2024-02-29",
    "2024-03-01",
  ]);
  assert.deepEqual(plain(dates.seriesDates("2026-Q1", "Q", 2)), [
    "2025-Q4",
    "2026-Q1",
  ]);
  assert.deepEqual(plain(dates.seriesDates("2026", "M", 2)), [
    "2026-11",
    "2026-12",
  ]);
  assert.deepEqual(plain(dates.seriesDates("2026-01~03", "M", 2)), [
    "2026-02",
    "2026-03",
  ]);
  assert.ok(
    dates.periodOptions(2026).find((option) => option.value === "week").children
      .length >= 52,
  );
});

test("navigation preserves host context and separates card dates from query dates", () => {
  const params = new URLSearchParams(
    "moduleId=42&theme=dark&lib_id=5&catalog_id=0&metric_id=7&unit_id=2&date_name=2026-09&detail_date=2026-10-26",
  );
  const selected = model.selection(params);
  assert.equal(selected.catalogId, 0);
  assert.equal(selected.detailDate, "2026-10-26");
  const next = model.updateParams(params, {
    metric_id: 8,
    detail_date: undefined,
  });
  assert.equal(next.get("theme"), "dark");
  assert.equal(next.get("moduleId"), "42");
  assert.equal(next.get("detail_date"), null);
  assert.equal(params.get("metric_id"), "7");
  assert.throws(
    () => model.selection(new URLSearchParams("lib_id=1.5")),
    /整数/,
  );
  assert.throws(
    () => model.selection(new URLSearchParams("unit_id=-2")),
    /整数/,
  );
  assert.deepEqual(plain(model.moduleConfig('{"lib_id":5,"type":"dynamic"}')), {
    lib_id: 5,
    type: "dynamic",
  });
  assert.throws(() => model.moduleConfig("[]"), /JSON 对象/);
  assert.throws(() => model.moduleConfig("broken"), /JSON 对象/);
});

test("metric values keep zeroes and bind by metric, object and date without overwriting row identities", () => {
  const query = { unitId: 10, unitName: "测试", date: "2026-09" };
  const rows = model.metricRows(
    [
      { metric_id: 1, metric_name: "同名" },
      { metric_id: 2, metric_name: "同名" },
      { metric_id: 1 },
    ],
    [
      {
        metric_id: 1,
        object_id: 10,
        date_name: "2026-09",
        metric_value: "0",
        metric_value_fmt: "0.00",
      },
      {
        metric_id: 2,
        object_id: 10,
        date_name: "2026-09",
        metric_value: "-3",
        metric_value_fmt: "-3.00",
      },
      {
        metric_id: 1,
        object_id: 11,
        date_name: "2026-09",
        metric_value: "999",
      },
      {
        metric_id: 1,
        object_id: 10,
        date_name: "2025-09",
        metric_value: "888",
      },
    ],
    query,
  );
  assert.equal(rows[0].metric_value, "0");
  assert.equal(rows[1].metric_value, "-3");
  assert.equal(new Set(rows.map((row) => row.key)).size, 3);
  const child = model.metricRows([{ metric_id: 1 }], [], query, rows[0].key);
  const updated = model.replaceChildren(rows, rows[0].key, child);
  assert.equal(model.flatten(updated).length, 4);
  assert.equal(rows[0].children, undefined);
  assert.equal(model.display(0), "0");
  assert.equal(model.display(""), "-");
});

test("list names use legacy nonempty value fallback and preserve duplicate shortcut titles", () => {
  const query = { unitId: 10, date: "2026-09" };
  const metrics = [
    { metric_id: 1, metric_name: "列表原名", metric_title: "目录标题甲" },
    { metric_id: 1, metric_name: "列表原名", metric_title: "目录标题乙" },
    { metric_id: 2, metric_name: "列表备用名称" },
  ];
  const values = [
    {
      metric_id: 1,
      object_id: 10,
      date_name: query.date,
      metric_name: "",
      metric_title: "",
      metric_value: "0",
    },
    {
      metric_id: 2,
      object_id: 10,
      date_name: query.date,
      metric_name: "数值返回名称",
      metric_value: "5",
    },
  ];
  const rows = model.metricRows(metrics, values, query);
  assert.deepEqual(
    plain(rows.map((row) => [row.metric_name, row.metric_title])),
    [
      ["列表原名", "目录标题甲"],
      ["列表原名", "目录标题乙"],
      ["数值返回名称", undefined],
    ].map((row) => row.map((value) => value ?? null)),
  );
  assert.equal(rows[0].metric_value, "0");
  assert.notEqual(rows[0].key, rows[1].key);
  const titled = model.metricRows(
    metrics,
    [{ ...values[0], metric_title: "数值返回标题" }],
    query,
  );
  assert.equal(titled[0].metric_title, "数值返回标题");
});

test("value refresh retains resolved names and ignores global metric metadata, including expanded aliases", async () => {
  const harness = hookHarness(),
    first = deferred(),
    refresh = deferred(),
    requests = [];
  const service = {
    batch: (params) => {
      requests.push(params);
      if (requests.length === 1) return first.promise;
      if (requests.length === 2) return refresh.promise;
      return Promise.resolve({
        value_list: [
          {
            metric_id: 2,
            object_id: 10,
            date_name: "2026-09",
            metric_name: "全局子指标名",
            metric_value: "5",
          },
        ],
      });
    },
    children: async () => ({
      row_list: [
        {
          child_id: 2,
          child_name: "配置的子项名称",
          child_title: "旧列表未采用的子项标题",
          child_count: 0,
        },
      ],
    }),
  };
  const { useMetricRows } = sourceModules({
    base,
    overrides: {
      dayjs: { default: dayjs },
      react: harness.react,
      "data/metric/features/metric-preview/context": {
        usePreview: () => ({ service }),
      },
    },
  })("data/metric/features/metric-preview/hooks/useMetricRows");
  const metrics = [
    {
      metric_id: 1,
      metric_name: "列表名称",
      metric_title: "目录自定义标题",
      child_count: 1,
    },
  ];
  const query = { unitId: 10, date: "2026-09" };
  let revision = 0;
  const render = () =>
    harness.render(() => useMetricRows(metrics, query, revision));
  let read = render();
  assert.equal(read.rows.length, 0, "首次等待数值时不展示另一套临时名称");
  first.resolve({
    metric_list: [
      { metric_id: 1, metric_name: "全局名称", metric_title: "全局标题" },
    ],
    value_list: [
      {
        metric_id: 1,
        object_id: 10,
        date_name: query.date,
        metric_name: "数值名称",
        metric_value: "0",
      },
    ],
  });
  await flush();
  read = render();
  assert.equal(read.rows[0].metric_title, "目录自定义标题");
  assert.equal(read.rows[0].metric_name, "数值名称");
  revision++;
  read = render();
  assert.equal(
    read.rows[0].metric_title,
    "目录自定义标题",
    "刷新期间保留已经显示的名称",
  );
  assert.equal(read.rows[0].metric_name, "数值名称");
  refresh.resolve({
    metric_list: [{ metric_id: 1, metric_title: "另一个全局标题" }],
    value_list: [
      {
        metric_id: 1,
        object_id: 10,
        date_name: query.date,
        metric_name: "数值名称",
        metric_value: "10",
      },
    ],
  });
  await flush();
  read = render();
  assert.equal(read.rows[0].metric_title, "目录自定义标题");
  assert.equal(read.rows[0].metric_value, "10");
  await read.expand(true, read.rows[0]);
  read = render();
  assert.equal(model.metricName(read.rows[0].children[0]), "配置的子项名称");
  assert.ok(requests.every((params) => !("column_list" in params)));
  harness.unmount();
});

test("middle-table refresh keeps its metric list and only advances the value/trend revision", async () => {
  const harness = hookHarness();
  let listReads = 0;
  const metrics = [
    { metric_id: 1, metric_name: "原名", metric_title: "目录别名" },
  ];
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
  const component = sourceModules({
    base,
    overrides: {
      dayjs: { default: dayjs },
      react: harness.react,
      antd: components,
      "@ant-design/icons": {},
      "data/metric/features/metric-preview/components/ValueSkeleton": {
        default: "ValueSkeleton",
      },
      "data/metric/features/metric-preview/components/Chart": {
        default: "Chart",
      },
      "data/metric/features/metric-preview/components/Feedback": {
        default: "Feedback",
      },
      "data/metric/features/metric-preview/context": {
        usePreview: () => ({
          libId: 10,
          catalogId: 100,
          session: { userId: 9 },
          query: { unitId: 10, date: "2026-09" },
          service: {
            metrics: async () => {
              listReads++;
              return { row_list: metrics };
            },
          },
        }),
      },
    },
  })("data/metric/features/metric-preview/components/MetricList").default;
  const find = (node, match) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node))
      return node.map((child) => find(child, match)).find(Boolean);
    return match(node) ? node : find(node.props?.children, match);
  };
  const render = () => harness.render(component);
  let node = render();
  await flush();
  node = render();
  assert.equal(listReads, 1);
  for (let revision = 1; revision <= 3; revision++) {
    find(
      node,
      (item) => item.props?.["aria-label"] === "刷新指标",
    ).props.onClick();
    node = render();
    await flush();
    node = render();
    assert.equal(listReads, 1, "旧版刷新按钮不会重新请求 GetMetricList");
    const table = find(node, (item) => item.type?.name === "MetricTable");
    assert.equal(table.props.revision, revision);
    assert.equal(table.props.metrics, metrics);
  }
  harness.unmount();
});

test("preview arguments and detail targets use the current talk fields", () => {
  const args = model.previewArgs(
    { unitId: 10, entityId: 20, unitName: "单元", date: "2026-Q1" },
    7,
  );
  assert.equal(
    args.find((row) => row.arg_code === "arg_end").arg_value,
    "2026-03-31",
  );
  assert.equal(
    args.find((row) => row.arg_code === "arg_entity").arg_value,
    "20",
  );
  assert.equal(model.detailTarget("TABLE", 3, args).type, "REPORT");
  assert.equal(model.detailTarget("BOARD", 4, args).id, 4);
  assert.equal(model.detailTarget("", 4, args), undefined);
  assert.equal(model.filterParams(defaultFilters).filter_finish, "");
  assert.equal(
    model.filterParams({ ...defaultFilters, finish: "-1" }).filter_finish,
    "-1",
  );
});

test("API wrappers send talk snake_case bodies and cancellation through comm/request", async () => {
  const calls = [],
    signal = new AbortController().signal;
  const api = sourceModules({
    base,
    overrides: {
      "comm/request": {
        request: {
          post: async (url, body, config) => {
            calls.push({ url, body, config });
            return { code: 0 };
          },
        },
      },
    },
  });
  const metric = api("@/api/metric"),
    factor = api("@/api/factor"),
    sys = api("@/api/sys");
  await sys.getCatalogList(model.catalogParams(10, 7), signal);
  await metric.getArgDefault({ user_id: 9 }, signal);
  await metric.getMetricValueList(
    { metric_id: 1, entity_id_list: [2], date_list: ["2026-09"] },
    signal,
  );
  await metric.getMetricValueList2(
    { metric_id_list: [1, 2], unit_id_list: [3], date_name: "2026-09" },
    signal,
  );
  await factor.getUnitBackground(
    {
      unit_id: 3,
      work_type: "metric",
      theme_name: "default",
      inherit_parent: true,
    },
    signal,
  );
  assert.deepEqual(
    calls.map((call) => call.url),
    [
      "sys/GetCatalogList",
      "metric/GetArgDefault",
      "metric/GetMetricValueList",
      "metric/GetMetricValueList2",
      "factor/GetUnitBackground",
    ],
  );
  assert.deepEqual(plain(calls[0].body), {
    catalog_type: "metric.10",
    org_id: 7,
    parent_id: 0,
    include_descendant: true,
    include_invalid: false,
    include_self: false,
  });
  assert.deepEqual(plain(calls[1].body), { user_id: 9 });
  assert.deepEqual(plain(calls[2].body), {
    metric_id: 1,
    entity_id_list: [2],
    date_list: ["2026-09"],
  });
  assert.ok(calls.every((call) => call.config.signal === signal));
});

test("workspace catalogs keep the mounted legacy sys endpoint and scope for both display modes", async () => {
  const calls = [];
  const api = sourceModules({
    base,
    globals: { DOMException },
    overrides: {
      "comm/request": {
        request: {
          post: async (url, body, config) => {
            calls.push({ url, body, config });
            if (url !== "sys/GetCatalogList")
              throw new Error(`目录接口被替换：${url}`);
            return { code: 0, catalog_list: [{ catalog_id: 3 }] };
          },
        },
      },
    },
  });
  const { createService } = api("data/metric/features/metric-preview/service");
  const controller = new AbortController();
  const service = createService(createRuntime(2));
  for (const libId of [10, 20]) {
    const response = await service.catalogs(
      model.catalogParams(libId, 7),
      controller.signal,
    );
    assert.equal(response.catalog_list[0].catalog_id, 3);
  }
  assert.deepEqual(
    calls.map((call) => [call.url, call.body.catalog_type, call.body.org_id]),
    [
      ["sys/GetCatalogList", "metric.10", 7],
      ["sys/GetCatalogList", "metric.20", 7],
    ],
  );
  assert.ok(calls.every((call) => call.config.signal instanceof AbortSignal));
});

test("rapid collapse and re-expansion keeps the current child request and loading state", async () => {
  const harness = hookHarness(),
    first = deferred(),
    second = deferred();
  let childReads = 0;
  const service = {
    batch: async () => ({
      value_list: [
        {
          metric_id: 1,
          object_id: 10,
          date_name: "2026-09",
          metric_value: "0",
        },
      ],
    }),
    children: () => (++childReads === 1 ? first.promise : second.promise),
  };
  const { useMetricRows } = sourceModules({
    base,
    overrides: {
      dayjs: { default: dayjs },
      react: harness.react,
      "data/metric/features/metric-preview/context": {
        usePreview: () => ({ service }),
      },
    },
  })("data/metric/features/metric-preview/hooks/useMetricRows");
  const metrics = [{ metric_id: 1, child_count: 1 }],
    query = { unitId: 10, date: "2026-09" };
  const render = () => harness.render(() => useMetricRows(metrics, query));
  let read = render();
  await flush();
  read = render();
  const root = read.rows[0];
  const abandoned = read.expand(true, root);
  await read.expand(false, root);
  const current = read.expand(true, root);
  first.resolve({ row_list: [{ child_id: 99, child_name: "旧结果" }] });
  await abandoned;
  read = render();
  assert.equal(read.loadingRows.has(root.key), true);
  assert.equal(read.rows[0].children.length, 0);
  second.resolve({ row_list: [{ child_id: 1, child_name: "重复 ID 子项" }] });
  await current;
  read = render();
  assert.equal(read.loadingRows.size, 0);
  assert.equal(read.rows[0].children[0].metric_id, 1);
  assert.notEqual(read.rows[0].children[0].key, root.key);
  harness.unmount();
});

test("goal gauges distinguish unmet targets from no target, and scatter uses yoy rates", () => {
  const { gaugeOptions, scatterOption } = load(
    "data/metric/features/metric-preview/chartOptions",
  );
  const rows = [
    {
      goal_finish: "0",
      metric_value: "10",
      yoy_value: "1000",
      yoy_rate: "0.2",
      yoy_rate_fmt: "20%",
    },
    { goal_finish: "1", metric_value: "0", yoy_rate: "0", yoy_rate_fmt: "0%" },
    {
      goal_finish: "",
      metric_value: "-3",
      yoy_rate: "-0.2",
      yoy_rate_fmt: "-20%",
    },
  ];
  const gauges = gaugeOptions(rows);
  for (const name of [
    "未达标",
    "无目标",
    "达标",
    "同比上涨",
    "同比持平",
    "同比下降",
  ])
    assert.equal(
      gauges.find((gauge) => gauge.name === name).option.series[0].data[0]
        .value,
      1,
    );
  assert.deepEqual(
    plain(scatterOption(rows, "指标").series[0].data[0].value),
    [10, 0.2],
  );
});

test("group/entity joins use business numbers and codes; filtered results retain server order", () => {
  const { groupEntities, mergeEntities } = load(
    "data/metric/features/metric-preview/analysisModel",
  );
  const groups = groupEntities(
    [
      { group_no: 1, group_code: "A", group_name: "同名" },
      { group_no: 2, group_code: "B", group_name: "同名" },
    ],
    [
      { entity_id: 101, entity_no: 1, entity_code: "A" },
      { entity_id: 202, entity_no: 2, entity_code: "B" },
    ],
  );
  assert.deepEqual(plain(groups.map((row) => row.entity_id)), [101, 202]);
  const values = [
    { object_id: 202, metric_value: "0" },
    { object_id: 101, metric_value: "5" },
  ];
  assert.deepEqual(
    plain(
      mergeEntities(groups, values, defaultFilters, true).map(
        (row) => row.object_id,
      ),
    ),
    [202, 101],
  );
  assert.equal(
    mergeEntities(groups, [], { ...defaultFilters, showNull: true }, true)
      .length,
    2,
  );
  assert.equal(
    mergeEntities(
      groups,
      [],
      { ...defaultFilters, showNull: true, top: 3 },
      true,
    ).length,
    0,
  );
});

test("catalog building retains missing-parent roots and terminates cycles", () => {
  const tree = model.catalogTree([
    { catalog_id: 1, parent_id: 2 },
    { catalog_id: 2, parent_id: 1 },
    { catalog_id: 3, parent_id: 999 },
    { catalog_id: 4, parent_id: 3 },
  ]);
  assert.equal(tree.length, 3);
  assert.equal(tree.find((row) => row.key === 3).children[0].key, 4);
});

test("workspace queue deduplicates readers, cancels abandoned tasks and never exceeds two reads", async () => {
  const runtime = createRuntime(2),
    controllers = Array.from({ length: 5 }, () => new AbortController());
  const gates = [deferred(), deferred(), deferred()];
  let active = 0,
    peak = 0,
    count = 0;
  const loader = (index) => async () => {
    count++;
    peak = Math.max(peak, ++active);
    await gates[index].promise;
    active--;
    return index;
  };
  const a = runtime.read("a", loader(0), controllers[0].signal);
  const b = runtime.read("a", loader(0), controllers[1].signal);
  const c = runtime.read("c", loader(1), controllers[2].signal);
  const d = runtime.read("d", loader(2), controllers[3].signal);
  const rejected = assert.rejects(a, (error) => error.name === "AbortError");
  controllers[0].abort();
  const abandoned = assert.rejects(d, (error) => error.name === "AbortError");
  controllers[3].abort();
  await flush();
  assert.equal(count, 2);
  assert.equal(peak, 2);
  gates[0].resolve();
  gates[1].resolve();
  assert.equal(await b, 0);
  assert.equal(await c, 1);
  await rejected;
  await abandoned;
  assert.equal(count, 2);
});

test("read hook rejects stale responses, survives StrictMode cleanup and keeps confirmed favorites after a failed read", async () => {
  const harness = hookHarness();
  const { useRead } = sourceModules({
    base,
    overrides: { react: harness.react },
  })("data/metric/features/metric-preview/hooks/useRead");
  const old = deferred(),
    next = deferred();
  let key = "old",
    loader = () => old.promise;
  let read = harness.render(() => useRead(key, loader));
  harness.replayEffects();
  key = "next";
  loader = () => next.promise;
  read = harness.render(() => useRead(key, loader));
  old.resolve("old value");
  next.resolve({ row_list: [1] });
  await flush();
  read = harness.render(() => useRead(key, loader));
  assert.deepEqual(plain(read.data), { row_list: [1] });
  read.mutate(() => ({ row_list: [1, 2] }));
  loader = async () => {
    throw new Error("读取失败");
  };
  read = harness.render(() => useRead(key, loader));
  await assert.rejects(read.reload(), /读取失败/);
  read = harness.render(() => useRead(key, loader));
  assert.deepEqual(plain(read.data.row_list), [1, 2]);
  const late = deferred();
  loader = () => late.promise;
  harness.render(() => useRead(key, loader)).reload();
  harness.unmount();
  late.resolve("unmounted");
  await flush();
});

test("refresh scheduler pauses while hidden, avoids overlapping reads and stops cleanly", async () => {
  let hidden = false,
    callback,
    listener,
    timerCount = 0;
  const gate = deferred();
  let runs = 0;
  const stop = autoRefresh(
    async () => {
      runs++;
      await gate.promise;
    },
    60000,
    {
      hidden: () => hidden,
      listen: (fn) => {
        listener = fn;
        return () => {
          listener = undefined;
        };
      },
      timer: (fn) => {
        timerCount++;
        callback = fn;
        return timerCount;
      },
      clear: () => {
        callback = undefined;
      },
    },
  );
  const tick = callback;
  const pending = tick();
  await flush();
  assert.equal(runs, 1);
  assert.equal(timerCount, 1);
  hidden = true;
  listener();
  gate.resolve();
  await pending;
  assert.equal(callback, undefined);
  hidden = false;
  listener();
  assert.equal(timerCount, 2);
  stop();
  assert.equal(listener, undefined);
  assert.equal(callback, undefined);
});

test("Excel export preserves formatted zeroes and child indentation", async () => {
  const { excelBlob } = load("data/metric/features/metric-preview/files");
  const blob = await excelBlob([
    {
      key: "a",
      object_name: "根",
      metric_value_fmt: "0.00",
      children: [
        {
          key: "a/b",
          object_name: "子",
          metric_value_fmt: "-2.00",
          yoy_rate_fmt: "-10%",
        },
      ],
    },
  ]);
  const { Workbook } = (await import("../node_modules/exceljs/excel.js"))
    .default;
  const workbook = new Workbook();
  await workbook.xlsx.load(Buffer.from(await blob.arrayBuffer()));
  const sheet = workbook.worksheets[0];
  assert.equal(sheet.getCell("B2").value, "0.00");
  assert.equal(sheet.getCell("B3").value, "-2.00");
  assert.equal(sheet.getCell("A3").alignment.indent, 1);
  assert.equal(sheet.getRow(3).outlineLevel, 1);
});

test("inactive federated previews do not mount their readers", () => {
  for (const [module, id] of [
    ["board", "boardId"],
    ["report", "reportId"],
  ]) {
    const preview = sourceModules({
      base: resolve(base, `../../${module}/src`),
    })(`data/${module}/preview`).default;
    assert.equal(preview({ [id]: 21, active: false }), null);
  }
});

test("embedded report forwards drill parameters and operation locks without changing parent navigation", () => {
  const reportBase = resolve(base, "../report"),
    harness = hookHarness(),
    navigations = [],
    locks = [],
    errors = [];
  const embedded = sourceModules({
    base: reportBase,
    overrides: {
      "data/theme/index": { useDataThemeStyle: () => ({}) },
      react: harness.react,
      antd: {
        theme: { useToken: () => ({ token: {} }) },
        App: {
          useApp: () => ({ message: { error: (value) => errors.push(value) } }),
        },
      },
      "comm/management": {
        useManagementSession: () => ({ data: { sessionId: "test", orgId: 1 } }),
      },
      "data/report/features/report-preview/components/ReportView": {
        default: "report-view",
      },
      "data/report/features/report-preview/style.scss": {},
    },
  })("data/report/features/report-preview/Embedded").default;
  const node = harness.render(() =>
    embedded({
      reportId: 101,
      argList: [{ arg_code: "arg_unit", arg_type: "INT", arg_value: "0" }],
      onNavigate: (target) => navigations.push(target),
      onBusyChange: (value) => locks.push(value),
    }),
  );
  const props = node.props.children.props;
  assert.equal(props.initial.arg_unit, "0");
  props.onLock("embedded", true);
  props.onLock("embedded", false);
  assert.deepEqual(locks, [true, false]);
  props.onLink(
    { ln: "REPORT", lv: "102", la: "arg_unit={object_id}&arg_date=2026-09" },
    { object_id: 0 },
    {},
  );
  assert.equal(navigations[0].type, "REPORT");
  assert.equal(navigations[0].id, 102);
  assert.equal(
    navigations[0].argList.find((arg) => arg.arg_code === "arg_unit").arg_value,
    "0",
  );
  props.onLink({ ln: "BOARD", lv: "21", la: "arg_unit=1" }, {}, {});
  assert.equal(navigations[1].type, "BOARD");
  props.onLink({ ln: "REPORT", lv: "invalid" }, {}, {});
  assert.equal(navigations.length, 2);
  assert.equal(errors.length, 1);
});
