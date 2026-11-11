import assert from "node:assert/strict";
import { test } from "node:test";
import { resolve } from "node:path";
import {
  commSource,
  deferred,
  flush,
  hookHarness,
  sourceModules,
} from "./helpers.mjs";

function fixture() {
  const harness = hookHarness();
  const load = sourceModules({ overrides: { react: harness.react } });
  const { useResource } = load("comm/resource");
  return { harness, useResource, load };
}

test("late resource response cannot overwrite a newer selection", async () => {
  const { harness, useResource } = fixture();
  const old = deferred(),
    next = deferred();
  harness.render(() => useResource("old", () => old.promise));
  let state = harness.render(() => useResource("new", () => next.promise));
  assert.equal(state.data, undefined);
  assert.equal(state.loading, true);
  next.resolve("new result");
  await flush();
  const render = () =>
    harness.render(() => useResource("new", async () => "unused"));
  assert.equal(render().data, "new result");
  old.resolve("stale result");
  await flush();
  assert.equal(render().data, "new result");
});

test("same-key overlapping reloads accept only the newest response", async () => {
  const { harness, useResource } = fixture();
  let read = async () => "baseline";
  const render = () => harness.render(() => useResource("key", () => read()));
  render();
  await flush();
  const older = deferred(),
    newer = deferred();
  read = () => older.promise;
  const first = render().reloadData();
  read = () => newer.promise;
  const second = render().reloadData();
  assert.equal(render().data, "baseline");
  assert.equal(render().ready, false);
  newer.resolve("latest");
  assert.equal(await second, "latest");
  older.resolve("late");
  assert.equal(await first, undefined);
  assert.equal(render().data, "latest");
  assert.equal(render().ready, true);
});

test("null keys hide snapshots and never load or become ready", async () => {
  const { harness, useResource } = fixture();
  let calls = 0;
  const loader = async () => ++calls;
  harness.render(() => useResource("key", loader));
  await flush();
  const render = () => harness.render(() => useResource(null, loader));
  let state = render();
  assert.equal(state.data, undefined);
  assert.equal(state.loading, false);
  assert.equal(state.ready, false);
  assert.equal(await state.reloadData(), undefined);
  assert.equal(state.refresh(), undefined);
  state.mutate(() => 42);
  render();
  await flush();
  assert.equal(calls, 1);
  assert.equal(render().data, undefined);
});

test("async reloads reject, background refresh coalesces and reports errors with the snapshot", async () => {
  const { harness, useResource } = fixture();
  let calls = 0,
    fail = false;
  const loader = () => {
    calls++;
    if (fail) throw new Error("offline");
    return Promise.resolve("saved");
  };
  const render = () => harness.render(() => useResource("key", loader));
  render();
  await flush();
  fail = true;
  await assert.rejects(render().reload(), /offline/);
  assert.equal(render().data, "saved");
  assert.equal(render().ready, false);
  assert.equal(render().error, "offline");
  const before = calls;
  assert.equal(render().refresh(), undefined);
  // Two refresh events before the next render share one background read.
  const state = render();
  state.refresh();
  state.refresh();
  render();
  await flush();
  assert.equal(calls, before + 2);
  assert.equal(render().error, "offline");
  fail = false;
  const reloaded = render().reload();
  assert.equal(await reloaded, undefined);
  assert.equal(render().ready, true);
});

test("mutate invalidates in-flight responses and clears loading/errors", async () => {
  const { harness, useResource } = fixture();
  const request = deferred();
  const render = () =>
    harness.render(() => useResource("key", () => request.promise));
  render().mutate((previous) => ({ ...previous, name: "written" }));
  assert.equal(render().ready, true);
  assert.equal(render().data.name, "written");
  request.resolve({ name: "old" });
  await flush();
  assert.equal(render().data.name, "written");
});

test("unmounted and StrictMode-superseded requests cannot publish", async () => {
  const { harness, useResource } = fixture();
  const old = deferred(),
    active = deferred();
  let calls = 0;
  const render = () =>
    harness.render(() =>
      useResource("key", () => (++calls === 1 ? old.promise : active.promise)),
    );
  const state = render();
  harness.replayEffects();
  old.resolve("superseded");
  await flush();
  assert.equal(render().data, undefined);
  harness.unmount();
  active.reject(new Error("unmounted"));
  await flush();
  assert.equal(await state.reloadData(), undefined);
  assert.equal(state.refresh(), undefined);
  state.mutate(() => "ignored");
  assert.equal(calls, 2);
});

test("synchronous loader failures are captured and undefined data is not ready", async () => {
  const { harness, useResource } = fixture();
  const render = () =>
    harness.render(() =>
      useResource(
        "key",
        () => {
          throw "wire error";
        },
        {
          formatError: (error) => `custom: ${error}`,
        },
      ),
    );
  render();
  await flush();
  assert.equal(render().error, "custom: wire error");
  await assert.rejects(
    render().reloadData(),
    (error) => error === "wire error",
  );
  const undefinedFixture = fixture();
  const noData = () =>
    undefinedFixture.harness.render(() =>
      undefinedFixture.useResource("key", async () => undefined),
    );
  noData();
  await flush();
  assert.equal(noData().ready, false);
});

for (const [app, message] of [
  ["system", "操作失败，请重试"],
  ["adverse-event", "加载失败，请重试"],
]) {
  test(`${app} adapter preserves void reload, error formatting and its extra operations`, async () => {
    const { harness, load } = fixture();
    const { useResource } = load(
      resolve(
        commSource,
        `../../../remote/${app}/src/hooks/useResource.ts`,
      ),
    );
    let fail = false;
    const render = () =>
      harness.render(() =>
        useResource("key", () =>
          fail ? Promise.reject("failed") : Promise.resolve(1),
        ),
      );
    render();
    await flush();
    if (app === "adverse-event") assert.equal(render().ready, true);
    if (app === "system") {
      render().mutate(() => 2);
      assert.equal(render().data, 2);
    }
    fail = true;
    assert.equal(render().reload(), undefined);
    render();
    await flush();
    assert.equal(render().error, message);
    if (app === "adverse-event") assert.equal(render().ready, false);
  });
}
