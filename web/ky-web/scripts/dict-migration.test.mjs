import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  sourceModules,
  hookHarness,
  deferred,
  flush,
  plain,
} from "../share/comm/tests/helpers.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ts = createRequire(resolve(root, "host/package.json"))("typescript");
const dayjs = createRequire(resolve(root, "remote/nurse-station/package.json"))("dayjs");
const oldEndpoint = /^\/?sys\/(RetrieveDictData|GetDictItem2?|SaveDict|NewDictItem|DeleteDictItem|GetDictItemProperty|SaveDictItemProperty)$/;

function walk(node, visit) {
  visit(node);
  ts.forEachChild(node, (child) => walk(child, visit));
}

function sources(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = resolve(directory, entry.name);
    if (entry.isDirectory()) return sources(file);
    return /\.(?:ts|tsx|js|jsx)$/.test(file) ? [file] : [];
  });
}

test("production sources and the AI mock contain no legacy dictionary endpoints", () => {
  const packages = ["host", ...["remote", "share"].flatMap((dir) =>
    readdirSync(resolve(root, dir), { withFileTypes: true })
      .filter((entry) => entry.isDirectory()).map((entry) => `${dir}/${entry.name}`))];
  const files = packages.flatMap((pkg) => {
    const source = resolve(root, pkg, "src");
    return existsSync(source) ? sources(source) : [];
  });
  files.push(resolve(root, "remote/metric/tests/browser/mock.ts"));
  const legacy = [];
  for (const file of files) {
    const source = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);
    walk(source, (node) => {
      if (ts.isStringLiteralLike(node) && oldEndpoint.test(node.text)) {
        legacy.push(`${file}:${source.getLineAndCharacterOfPosition(node.getStart()).line + 1}`);
      }
    });
  }
  assert.deepEqual(legacy, []);
});

const wrappers = [
  ...["host", "share/data", ...[
    "medical-record", "quality-control", "system", "treat", "metric", "teach",
    "anes", "ops", "charge", "drug", "doctor-station",
  ].map((name) => `remote/${name}`)].map((pkg) => [
    pkg, pkg === "share/data" ? "metric/api/sys" : "api/sys", "retrieveDict2ItemList",
  ]),
  ...["api/sys", "api/allergy", "api/linkBill", "pages/PatientInfo/api/sys", "pages/CareRecord/api/index"]
    .map((file) => ["share/visit", file, "retrieveDict2ItemList"]),
  ...["DeptRoom", "MedOrder", ...[
    "OrderExeMed", "DailyCare", "DischargeGuide", "TransferBed", "TransferDept", "TransferWard",
  ].map((name) => `NurseStation/pages/${name}`)]
    .map((module) => ["remote/nurse-station", `modules/${module}/api/index`, "retrieveDict2ItemList"]),
  ["share/widget", "components/widgets/BedsideCard/api/index", "getSourceListApi"],
  ["remote/icu-system", "modules/holistic-nursing/pages/bed-manage/BedsideCard/api/index", "getSourceListApi"],
  ["remote/icu-system", "modules/holistic-nursing/pages/bed-manage/BedsideCard/api/index", "getDeviceTypeListApi"],
  ["remote/icu-system", "modules/holistic-nursing/pages/bed-manage/PendingOut/api/index", "retrieveDict2ItemList"],
];

for (const [pkg, file, name] of wrappers) {
  test(`${pkg}/${file} forwards dict2 selectors, search, limits and results`, async () => {
    const calls = [];
    const response = { code: 0, row_list: [{ dict_id: 23, item_code: "A", item_name: "项目" }] };
    const load = sourceModules({
      base: resolve(root, pkg, "src"),
      overrides: { "comm/request": { request: { post: async (...args) => {
        calls.push(args);
        return response;
      } } } },
    });
    const params = {
      org_id: 42, dict_code: "usage.site", retrieve_input: "肺", retrieve_limit: 0,
      column_list: "item_code,item_name",
    };
    assert.equal(await load(`@/${file}`)[name](params), response);
    assert.equal(calls.length, 1);
    assert.equal(calls[0][0].replace(/^\//, ""), "sys/RetrieveDict2ItemList");
    assert.deepEqual(plain(calls[0][1]), params);
    const empty = { ...params, retrieve_input: "*", retrieve_limit: 10 };
    await load(`@/${file}`)[name](empty);
    assert.deepEqual(plain(calls[1][1]), empty);
  });
}

test("new anaesthesia records request anes.type by code with valid item columns", async () => {
  const calls = [];
  const load = sourceModules({
    base: resolve(root, "remote/anes/src"),
    overrides: {
      "comm/session": { getSessionId: () => "session" },
      "comm/request": { request: { post: async (...args) => { calls.push(args); return { code: 0 }; } } },
    },
  });
  await load("@/api/newAnes").getAnesTypeListAPI({ org_id: 42 });
  assert.deepEqual(plain(calls[0]), ["sys/RetrieveDict2ItemList", {
    org_id: 42, dict_code: "anes.type", retrieve_input: "*", column_list: "row_id,item_code,item_name",
  }]);
});

for (const [pkg, file, name, dictCode] of [
  ["remote/drug", "modules/DrugManagement/components/countryDictionary", "loadCountryDictionary", "GB/T 2659-2000"],
  ["remote/teach", "pages/StudentManagement/languageDictionary", "loadLanguageDictionary", "GB/T 4880.1-2005"],
]) {
  function loader(post) {
    return sourceModules({ base: resolve(root, pkg, "src"), overrides: { "comm/request": { request: { post } } } })(`@/${file}`)[name];
  }

  test(`${dictCode} gets its code system from the header and items from that dict_id`, async () => {
    const calls = [], rows = [{ item_code: "156", item_name: "中国" }];
    const load = loader(async (...args) => {
      calls.push(args);
      return args[0] === "sys/GetDict2Property"
        ? { code: 0, dict_property: { dict_id: 71, dict_code_system: "urn:standard" } }
        : { code: 0, row_list: rows };
    });
    const result = await load();
    assert.equal(result.rows, rows);
    assert.equal(result.codeSystem, "urn:standard");
    assert.deepEqual(plain(calls[0]), ["sys/GetDict2Property", {
      dict_code: dictCode, column_list: "dict_id,dict_code_system",
    }]);
    assert.equal(calls[1][0], "sys/RetrieveDict2ItemList");
    assert.equal(calls[1][1].dict_id, 71);
    assert.equal(calls[1][1].retrieve_input, "*");
    assert.equal(calls[1][1].retrieve_limit, 0);
    assert.equal(calls[1][1].dict_code, undefined);
  });

  test(`${dictCode} rejects missing headers and failed items without a legacy fallback`, async () => {
    for (const header of [{ code: 0 }, { code: 0, dict_property: {} }, { code: 7, message: "字典不存在" }]) {
      let calls = 0;
      await assert.rejects(loader(async () => { calls++; return header; })());
      assert.equal(calls, 1);
    }
    await assert.rejects(loader(async (url) => url === "sys/GetDict2Property"
      ? { code: 0, dict_property: { dict_id: 71 } }
      : { code: 9, message: "读取失败" })(), /读取失败/);
    assert.deepEqual(plain(await loader(async (url) => url === "sys/GetDict2Property"
      ? { code: 0, dict_property: { dict_id: 71 } }
      : { code: 0 })()), { rows: [], codeSystem: "" });
  });
}

test("country selection preserves the header code system for default, change and clear", async () => {
  const harness = hookHarness(), changes = [];
  const base = resolve(root, "remote/drug/src");
  const dictionary = { rows: [
    { item_code: "156", item_name: "中国" }, { item_code: "840", item_name: "美国" },
  ], codeSystem: "urn:countries" };
  const load = sourceModules({ base, overrides: {
    react: harness.react, antd: { Select: "Select" },
    [resolve(base, "modules/DrugManagement/components/countryDictionary.ts")]: {
      loadCountryDictionary: async () => dictionary,
    },
  } });
  const Component = load("@/modules/DrugManagement/components/AddressOnlyOne").default;
  let props = { onChange: (value) => { changes.push(plain(value)); props = {
    ...props, countryName: value.country_name, countryCode: value.country_code,
  }; } };
  const render = () => harness.render(() => Component(props));
  render();
  await flush();
  render();
  assert.deepEqual(changes[0], { country_name: "中国", country_code: "156", country_code_system: "urn:countries" });
  const select = render();
  select.props.onChange("840", select.props.options.find((option) => option.value === "840"));
  assert.deepEqual(changes.at(-1), { country_name: "美国", country_code: "840", country_code_system: "urn:countries" });
  render().props.onChange(undefined);
  assert.deepEqual(changes.at(-1), changes[0]);
  harness.unmount();
});

test("patient DictSelect keeps public dictName, saved values and lazy loading", async () => {
  const harness = hookHarness(), seen = [], names = [];
  const base = resolve(root, "share/visit/src");
  let ensured = 0;
  const load = sourceModules({ base, overrides: {
    react: harness.react, antd: { Select: "Select" },
    [resolve(base, "pages/PatientInfo/stores/useDictStore.ts")]: { useDict: (...args) => {
      seen.push(plain(args));
      return { rows: [{ item_code: "01", item_name: "居民身份证" }], loaded: false, ensure: async () => { ensured++; } };
    } },
  } });
  const Component = load("@/pages/PatientInfo/components/DictSelect").default;
  const render = () => harness.render(() => Component({
    dictName: "CV02.01.101", value: "旧证件", valueLabel: "已保存证件", onNameChange: (value) => names.push(value),
  }));
  const select = render();
  assert.deepEqual(seen[0], ["CV02.01.101", { eager: false }]);
  assert.equal(ensured, 0);
  assert.deepEqual(plain(select.props.options), [
    { label: "居民身份证", value: "居民身份证", name: "居民身份证" },
    { label: "已保存证件", value: "旧证件", name: "已保存证件" },
  ]);
  select.props.onOpenChange(true);
  await flush();
  assert.equal(ensured, 1);
  render().props.onChange("居民身份证", select.props.options[0]);
  assert.deepEqual(names, ["居民身份证"]);
  harness.unmount();
});

test("care dictionary requests retain inflight deduplication and cached rows", async () => {
  const gate = deferred(), calls = [], updates = [];
  const load = sourceModules({ base: resolve(root, "share/visit/src"), overrides: {
    "comm/request": { request: { post: (...args) => { calls.push(args); return gate.promise; } } },
  } });
  const { ensureDictData } = load("@/pages/CareRecord/utils/dict-data");
  ensureDictData("oxygen.method", [], (rows) => updates.push(rows));
  ensureDictData("oxygen.method", [], (rows) => updates.push(rows));
  assert.deepEqual(plain(calls), [["sys/RetrieveDict2ItemList", { dict_code: "oxygen.method", retrieve_input: "*" }]]);
  const rows = [{ item_name: "鼻导管" }];
  gate.resolve({ code: 0, row_list: rows });
  await flush();
  assert.deepEqual(updates, [rows, rows]);
  ensureDictData("oxygen.method", rows, () => assert.fail("unchanged rows should be retained"));
  assert.equal(calls.length, 1);
});

test("shared billing frequency uses anes_bill_freq as the dict2 code", async () => {
  const calls = [];
  const load = sourceModules({ base: resolve(root, "share/visit/src"), overrides: {
    "comm/request": { request: { post: async (...args) => { calls.push(args); return { code: 0 }; } } },
  } });
  assert.deepEqual(plain(await load("@/api/linkBill").retrieveAnesBillFreq()), []);
  assert.deepEqual(plain(calls), [["sys/RetrieveDict2ItemList", { dict_code: "anes_bill_freq", retrieve_input: "*" }]]);
});

test("quality-control ordering accepts dict2 values and keeps unmatched documents stable", () => {
  const load = sourceModules({ base: resolve(root, "remote/quality-control/src") });
  const { buildMedicalRecordOrder, sortMedicalRecords } = load("@/utils/medicalRecordOrder");
  const order = buildMedicalRecordOrder([
    { dict_id: 7, item_name: "入院记录", item_value: "2" },
    { dict_id: 7, item_name: "病程记录", item_value: "1" },
    { item_name: "无效", item_value: "bad" },
  ]);
  const docs = [{ doc_name: "未配置A" }, { doc_name: "入院记录" }, { doc_name: "未配置B" }, { doc_name: "病程记录" }];
  assert.deepEqual(plain(sortMedicalRecords(docs, order)), [docs[3], docs[1], docs[0], docs[2]]);
  assert.equal(docs[0].doc_name, "未配置A");
});

function findSelect(node, placeholder) {
  if (!node || typeof node !== "object") return undefined;
  if (Array.isArray(node)) return node.map((child) => findSelect(child, placeholder)).find(Boolean);
  if (node.type === "Select" && node.props.placeholder === placeholder) return node;
  return findSelect(node.props?.children, placeholder);
}

for (const file of [
  "modules/MedOrder/components/ExecImplement",
  "modules/NurseStation/pages/OrderExeMed/components/ExecImplement",
  "modules/NurseStation/pages/DailyCare/components/mainCard/pendingOrderTabs/ImplementModal/ExecImplement",
  "modules/NurseStation/pages/DischargeGuide/components/ProcessCard/ExecImplementModal",
  "modules/NurseStation/pages/TransferDept/components/TransferExecForm",
  "modules/NurseStation/pages/TransferBed/components/TransferBedExecForm",
  "modules/NurseStation/pages/TransferWard/components/TransferWardExecForm",
]) {
  test(`${file} shows and selects dict2 usage-site item names`, async () => {
    const harness = hookHarness(), calls = [];
    const rows = [{ item_code: "L", item_name: "左侧" }];
    const form = {
      resetFields() {}, setFieldsValue() {}, setFieldValue() {},
      getFieldValue() {}, getFieldsValue: () => ({}), validateFields: async () => ({}),
    };
    const Form = Object.assign(() => null, { Item: "FormItem", useForm: () => [form], useWatch() {} });
    const load = sourceModules({ base: resolve(root, "remote/nurse-station/src"), overrides: {
      react: { ...harness.react, forwardRef: (render) => (props) => render(props, null), useImperativeHandle() {} },
      antd: {
        Form, Modal: "Modal", DatePicker: "DatePicker", Select: "Select", Input: "Input",
        message: { success() {}, error() {}, warning() {} },
      },
      ahooks: { useDebounceFn: (fn) => ({ run: fn }) },
      dayjs: { default: dayjs },
      "comm/request": { request: { post: async (...args) => {
        calls.push(args);
        return { code: 0, row_list: rows };
      } } },
    } });
    const Component = load(`@/${file}`).default;
    const props = {
      open: false, sessionInfo: {}, implementSelectList: [], implementRecord: {}, onClose() {}, onSuccess() {},
    };
    const render = () => harness.render(() => Component(props));
    await findSelect(render(), "请输入部位搜索").props.showSearch.onSearch("左");
    const select = findSelect(render(), "请输入部位搜索");
    assert.deepEqual(plain(select.props.options), rows);
    assert.deepEqual(plain(select.props.fieldNames), { label: "item_name", value: "item_name" });
    assert.ok(calls.some(([url, params]) => url === "sys/RetrieveDict2ItemList"
      && params.dict_code === "usage.site" && params.retrieve_input === "左" && params.retrieve_limit === 10));
    await select.props.showSearch.onSearch("");
    assert.deepEqual(plain(findSelect(render(), "请输入部位搜索").props.options), []);
    harness.unmount();
  });
}
