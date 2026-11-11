import assert from "node:assert/strict";
import { test } from "node:test";
import { createRequire } from "node:module";
import { sourceModules } from "./helpers.mjs";
const require = createRequire(import.meta.url);
const axios = require("axios");

function setup() {
  const messages = [], clears = [], redirects = [];
  const load = sourceModules({ overrides: { "./session": { getSessionId: () => "current", clearSessionId: () => clears.push(true) } }, globals: { window: { location: { pathname: "/home", replace: (url) => redirects.push(url) } } } });
  const { request, setMessageApi } = load("./request");
  setMessageApi({ error: (message) => messages.push(message) });
  const adapter = (data) => async (config) => ({ data, config, status: 200, statusText: "OK", headers: {} });
  const unauthorized = async (config) => { throw new axios.AxiosError("unauthorized", "ERR_BAD_REQUEST", config, {}, { status: 401, data: { message: "已失效" } }); };
  return { request, adapter, unauthorized, messages, clears, redirects };
}

test("local business and HTTP errors never clear a later session or show global messages", async () => {
  const t = setup();
  await assert.rejects(t.request.post("test", {}, { errorMode: "local", adapter: t.adapter({ code: -1, message: "获取会话信息失败" }) }));
  await assert.rejects(t.request.post("test", {}, { errorMode: "local", adapter: t.unauthorized }));
  assert.deepEqual(t.messages, []); assert.deepEqual(t.clears, []); assert.deepEqual(t.redirects, []);
});

test("raw business responses and explicit default session headers are preserved", async () => {
  const t = setup();
  const response = await t.request.post("test", {}, { rawResponse: true, errorMode: "local", headers: { "xmhis-session-id": "xmhis.session.default" }, adapter: async (config) => {
    assert.equal(config.headers.get("xmhis-session-id"), "xmhis.session.default");
    return { config, data: { code: 2, message: "提示", session_id: "new" }, status: 200, headers: {} };
  } });
  assert.equal(response.code, 2); assert.deepEqual(t.messages, []);
});

test("default business/HTTP error side effects remain and cancellation is silent", async () => {
  const t = setup();
  await assert.rejects(t.request.post("test", {}, { adapter: t.adapter({ code: -1, message: "获取会话信息失败" }) }));
  await assert.rejects(t.request.post("test", {}, { adapter: t.unauthorized }));
  assert.equal(t.clears.length, 2); assert.deepEqual(t.redirects, ["/login", "/login"]); assert.equal(t.messages.length, 2);
  const controller = new AbortController(); controller.abort();
  await assert.rejects(t.request.post("test", {}, { signal: controller.signal, adapter: t.adapter({ code: 0 }) }));
  assert.equal(t.messages.length, 2); assert.equal(t.clears.length, 2);
});
