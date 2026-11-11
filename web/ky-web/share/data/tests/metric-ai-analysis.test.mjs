import assert from "node:assert/strict";
import { test } from "node:test";
import dayjs from "../node_modules/dayjs/dayjs.min.js";
import {
  sourceModules,
  hookHarness,
  deferred,
  flush,
  plain,
} from "./helpers.mjs";

const prefix = "data/metric/features/metric-preview/";
function all(node, match) {
  if (!node || typeof node !== "object") return [];
  if (Array.isArray(node)) return node.flatMap((child) => all(child, match));
  return [...(match(node) ? [node] : []), ...all(node.props?.children, match)];
}
const first = (tree, type) => all(tree, (node) => node.type === type)[0];
function text(node) {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node !== "object") return String(node);
  return Array.isArray(node)
    ? node.map(text).join("")
    : text(node.props?.children);
}
const models = [
  { item_code: " model-a ", item_value: "ignored", item_name: " 模型 A " },
  { item_code: " ", item_value: " model-b " },
  { item_name: "没有编码" },
];
function setup(dictionary = async () => ({ row_list: models })) {
  const harness = hookHarness();
  const reads = [],
    calls = [];
  const context = {
    libId: 11,
    metric: { metric_id: 7, metric_name: "门诊人次" },
    detailQuery: { unitId: 3, unitName: "内科", date: "2026-Q2" },
    service: {
      dictionary: (params, signal) => {
        reads.push({ params, signal });
        return dictionary(params, signal);
      },
    },
  };
  const load = sourceModules({
    overrides: {
      react: harness.react,
      antd: Object.fromEntries(
        ["Alert", "Button", "Select", "Spin"].map((name) => [name, name]),
      ),
      dayjs: { default: dayjs },
      "react-markdown": { default: "Markdown" },
      "remark-gfm": { default: "remarkGfm" },
      [`${prefix}context`]: { usePreview: () => context },
      "data/metric/api/ai": {
        metricStream: (params, options) => {
          const gate = deferred();
          calls.push({ params, options, ...gate });
          return gate.promise;
        },
      },
    },
  });
  const Panel = load(`${prefix}components/AiAnalysisPanel`).default;
  const render = () => harness.render(() => Panel({ metric: context.metric }));
  const ready = async () => {
    render();
    await flush();
    return render();
  };
  const click = () => first(render(), "Button").props.onClick();
  return { harness, context, reads, calls, render, ready, click };
}

test("AI models are loaded with cancellable dictionary requests, normalized and selected in server order", async () => {
  const gate = deferred();
  const state = setup(() => gate.promise);
  assert.equal(state.render(), null);
  assert.deepEqual(plain(state.reads[0].params), {
    dict_code: "ai.model",
    retrieve_input: "*",
    column_list: "*",
  });
  gate.resolve({ row_list: models });
  await flush();
  const tree = state.render(),
    select = first(tree, "Select");
  assert.deepEqual(plain(select.props.options), [
    { value: "model-a", label: "模型 A" },
    { value: "model-b", label: "model-b" },
  ]);
  assert.equal(select.props.value, "model-a");
  assert.equal(state.calls.length, 0);
  select.props.onChange("model-b");
  state.click();
  assert.equal(state.calls.length, 1);
  const call = state.calls[0];
  assert.deepEqual(plain({ ...call.params, question: undefined }), {
    metric_id: 7,
    metric_name: "门诊人次",
    lib_id: 11,
    unit_id: 3,
    unit_name: "内科",
    date_start: "2026-04-01",
    date_end: "2026-06-30",
    model_code: "model-b",
  });
  assert.match(call.params.question, /内科/);
  state.harness.unmount();
  assert.equal(call.options.signal.aborted, true);
  // Late events and rejection after unmount must not update state.
  call.options.onChunk("迟到结果");
  call.reject(new Error("aborted"));
  await flush();
});

for (const [name, dictionary] of [
  ["empty", async () => ({ row_list: [] })],
  ["missing", async () => ({})],
  [
    "invalid",
    async () => ({ row_list: [{ item_code: " ", item_value: " " }] }),
  ],
  [
    "failed",
    async () => {
      throw new Error("字典读取失败");
    },
  ],
]) {
  test(`${name} model lists hide the entire AI section and never start an analysis`, async () => {
    const state = setup(dictionary);
    assert.equal(await state.ready(), null);
    assert.equal(state.calls.length, 0);
    state.harness.unmount();
  });
}

test("unmount cancels an unfinished model read", async () => {
  const gate = deferred();
  const state = setup(() => gate.promise);
  state.render();
  state.harness.unmount();
  assert.equal(state.reads[0].signal.aborted, true);
  gate.resolve({ row_list: models });
  await flush();
});

test("analysis streams inline, locks controls and prevents duplicate submissions, then allows regeneration", async () => {
  const state = setup();
  let tree = await state.ready();
  const start = first(tree, "Button").props.onClick;
  start();
  start();
  assert.equal(state.calls.length, 1);
  tree = state.render();
  assert.equal(tree.type, "section");
  assert.equal(first(tree, "Button").props.disabled, true);
  assert.equal(first(tree, "Select").props.disabled, true);
  assert.ok(first(tree, "Spin"));
  assert.match(text(tree), /思考中/);
  const call = state.calls[0];
  assert.equal(call.params.model_code, "model-a");
  call.options.onEvent("thinking", { message: "查询数据" });
  call.options.onEvent("thinking", { content: "比较同期" });
  call.options.onChunk("## 分析\n");
  call.options.onChunk("同比 **12%**");
  tree = state.render();
  assert.equal(first(tree, "Markdown").props.children, "## 分析\n同比 **12%**");
  assert.match(text(tree), /查询数据\n比较同期/);
  assert.equal(
    all(tree, (node) => /Modal|Dialog/.test(String(node.type))).length,
    0,
  );
  call.resolve();
  await flush();
  tree = state.render();
  assert.equal(first(tree, "Button").props.disabled, false);
  assert.equal(first(tree, "Select").props.disabled, false);
  assert.equal(first(tree, "Spin"), undefined);
  state.click();
  tree = state.render();
  assert.equal(state.calls.length, 2);
  assert.equal(first(tree, "Markdown"), undefined);
  state.calls[1].resolve();
  await flush();
  assert.match(text(state.render()), /（无回复）/);
  state.harness.unmount();
});

test("failures keep partial text inline and retry replaces it with a fresh response", async () => {
  const state = setup();
  await state.ready();
  state.click();
  state.calls[0].options.onChunk("部分结果");
  state.calls[0].reject(new Error("分析失败，请重试"));
  await flush();
  let tree = state.render();
  const alert = first(tree, "Alert");
  assert.equal(alert.props.title, "分析失败，请重试");
  assert.equal(first(tree, "Markdown").props.children, "部分结果");
  alert.props.action.props.onClick();
  tree = state.render();
  assert.equal(state.calls.length, 2);
  assert.equal(first(tree, "Alert"), undefined);
  assert.equal(first(tree, "Markdown"), undefined);
  state.calls[1].options.onChunk("重试结果");
  state.calls[1].resolve();
  await flush();
  assert.equal(first(state.render(), "Markdown").props.children, "重试结果");
  state.harness.unmount();
});

for (const [name, change] of [
  [
    "metric",
    (context) => {
      context.metric = { metric_id: 8, metric_name: "手术人次" };
    },
  ],
  [
    "unit",
    (context) => {
      context.detailQuery = { ...context.detailQuery, unitId: 4 };
    },
  ],
  [
    "period",
    (context) => {
      context.detailQuery = { ...context.detailQuery, date: "2026-Q3" };
    },
  ],
  [
    "library",
    (context) => {
      context.libId = 12;
    },
  ],
]) {
  test(`changing the ${name} cancels the stream, clears output and ignores late events until another click`, async () => {
    const state = setup();
    await state.ready();
    state.click();
    const call = state.calls[0];
    call.options.onChunk("旧查询结果");
    state.render();
    change(state.context);
    let tree = state.render();
    assert.equal(call.options.signal.aborted, true);
    assert.equal(first(tree, "Markdown"), undefined);
    assert.equal(first(tree, "Spin"), undefined);
    assert.equal(state.calls.length, 1);
    state.click();
    call.options.onChunk("迟到的旧结果");
    call.options.onEvent("thinking", { content: "迟到思考" });
    call.reject(new Error("旧请求失败"));
    await flush();
    tree = state.render();
    assert.equal(first(tree, "Markdown"), undefined);
    assert.equal(first(tree, "Alert"), undefined);
    assert.equal(first(tree, "Button").props.disabled, true);
    assert.equal(state.calls.length, 2);
    state.calls[1].options.onChunk("新查询结果");
    state.calls[1].resolve();
    await flush();
    assert.equal(
      first(state.render(), "Markdown").props.children,
      "新查询结果",
    );
    state.harness.unmount();
  });
}

test("changing models clears completed output without automatically running or restoring old results", async () => {
  const state = setup();
  await state.ready();
  state.click();
  state.calls[0].options.onChunk("模型 A 的结果");
  state.calls[0].resolve();
  await flush();
  first(state.render(), "Select").props.onChange("model-b");
  assert.equal(first(state.render(), "Markdown"), undefined);
  assert.equal(state.calls.length, 1);
  first(state.render(), "Select").props.onChange("model-a");
  assert.equal(first(state.render(), "Markdown"), undefined);
  const oldDate = state.context.detailQuery.date;
  state.context.detailQuery.date = "2026-Q3";
  state.render();
  state.context.detailQuery.date = oldDate;
  assert.equal(first(state.render(), "Markdown"), undefined);
  state.harness.unmount();
});

test("the shared detail places AI after embedded content and retains custom metric eligibility", () => {
  const harness = hookHarness();
  let metric = {
    metric_id: 7,
    metric_name: "门诊人次",
    detail_type: "BOARD",
    detail_id: 1,
  };
  const context = {
    metricId: 7,
    identity: "session",
    detailQuery: { unitId: 3, date: "2026-Q2" },
    service: {},
    favorites: [],
    entityIds: [],
  };
  const load = sourceModules({
    overrides: {
      react: harness.react,
      antd: {
        Alert: "Alert",
        Button: "Button",
        Empty: "Empty",
        Table: "Table",
      },
      "@ant-design/icons": {},
      dayjs: { default: dayjs },
      [`${prefix}context`]: {
        Context: { Provider: "Provider" },
        usePreview: () => context,
      },
      [`${prefix}hooks/useRead`]: {
        useRead: (key) => ({
          data: key?.startsWith("metric:") ? metric : undefined,
        }),
      },
      ...Object.fromEntries(
        [
          "Feedback",
          "EmbeddedPreview",
          "Trend",
          "Analysis",
          "FactorDialog",
          "AiAnalysisPanel",
          "Chart",
        ].map((name) => [`${prefix}components/${name}`, { default: name }]),
      ),
    },
  });
  const Detail = load(`${prefix}components/MetricDetail`).default;
  const ready = all(Detail({}), (node) => typeof node.type === "function")[0];
  const render = () => harness.render(() => ready.type({ metric }));
  let tree = render();
  assert.ok(first(tree, "EmbeddedPreview"));
  assert.equal(
    tree.props.children.filter(Boolean).at(-1).type,
    "AiAnalysisPanel",
  );
  metric = { ...metric, value_tag: "[CUSTOM]" };
  assert.equal(first(render(), "AiAnalysisPanel"), undefined);
  context.appearance = "dashboard";
  assert.ok(first(render(), "AiAnalysisPanel"));
  harness.unmount();
});

test("the preview service forwards the AI dictionary request and cancellation signal to sys/RetrieveDict2ItemList", async () => {
  const requests = [];
  const load = sourceModules({
    overrides: {
      "comm/request": {
        request: {
          post: async (...args) => {
            requests.push(args);
            return { row_list: models };
          },
        },
      },
    },
  });
  const { createRuntime } = load(`${prefix}runtime`);
  const service = load(`${prefix}service`).createService(createRuntime());
  const controller = new AbortController();
  const params = {
    dict_code: "ai.model",
    retrieve_input: "*",
    column_list: "*",
  };
  const response = await service.dictionary(params, controller.signal);
  assert.equal(response.row_list, models);
  assert.equal(requests[0][0], "sys/RetrieveDict2ItemList");
  assert.deepEqual(plain(requests[0][1]), params);
  assert.ok(requests[0][2].signal instanceof AbortSignal);
});
