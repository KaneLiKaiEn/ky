import assert from "node:assert/strict";
import { test } from "node:test";
import { deferred, flush, hookHarness, sourceModules } from "./helpers.mjs";

test("committed save with failed read retries only the read", async () => {
  const harness = hookHarness();
  let writes = 0,
    reads = 0,
    fail = true;
  const resource = {
    data: { value: "old" },
    loading: false,
    async reloadData() {
      reads++;
      if (fail) throw new Error("read offline");
      this.data = { value: "new" };
      return this.data;
    },
  };
  const hookLoad = sourceModules({
    overrides: {
      react: harness.react,
      "../resource": { useResource: () => resource },
      "./useEditorGuard": { useEditorGuard() {} },
    },
  });
  const { useManagementEditor } = hookLoad("./management/useManagementEditor");
  const guard = { onBusyChange() {}, onDirtyChange() {} };
  const render = () =>
    harness.render(() =>
      useManagementEditor(
        { identity: "s:1:2", isCurrent: () => true, guard },
        async () => resource.data,
        async () => {
          writes++;
        },
      ),
    );
  let editor = render();
  editor.setValue({ value: "new" });
  editor = render();
  assert.equal(await editor.save(), true);
  editor = render();
  assert.match(editor.loadError, /已保存成功/);
  assert.equal(writes, 1);
  fail = false;
  await editor.reload();
  editor = render();
  assert.equal(writes, 1);
  assert.equal(reads, 2);
  assert.equal(editor.dirty, false);
  assert.equal(editor.error, undefined);
});

test("editor saves once, unlocks synchronously and does not follow up after a session switch", async () => {
  const harness = hookHarness(),
    write = deferred();
  let reads = 0,
    writes = 0,
    current = true,
    dirty,
    busy,
    registered;
  const guard = {
    onDirtyChange(value) {
      dirty = value;
    },
    onBusyChange(value) {
      busy = value;
    },
    registerSave(value) {
      registered = value;
    },
  };
  const load = sourceModules({ overrides: { react: harness.react } });
  const { useManagementEditor } = load("./management/useManagementEditor");
  const render = () =>
    harness.render(() =>
      useManagementEditor(
        { identity: "session:1", isCurrent: () => current, guard },
        async () => {
          reads++;
          return { name: "old" };
        },
        async () => {
          writes++;
          await write.promise;
        },
      ),
    );
  render();
  await flush();
  render().setValue({ name: "new" });
  render();
  assert.equal(dirty, true);
  const saving = registered();
  assert.equal(busy, true);
  assert.equal(await render().save(), false);
  assert.equal(writes, 1);
  current = false;
  write.resolve();
  assert.equal(await saving, false);
  assert.equal(reads, 1);
  assert.equal(busy, false);
  harness.unmount();
  assert.equal(registered, null);
  assert.equal(dirty, false);
});

test("successful editor save clears dirty and busy before the next render", async () => {
  const harness = hookHarness();
  let dirty,
    busy,
    value = "old",
    writes = 0;
  const guard = {
    onDirtyChange(next) {
      dirty = next;
    },
    onBusyChange(next) {
      busy = next;
    },
    registerSave() {},
  };
  const { useManagementEditor } = sourceModules({
    overrides: { react: harness.react },
  })("./management/useManagementEditor");
  const render = () =>
    harness.render(() =>
      useManagementEditor(
        { identity: "session:1", isCurrent: () => true, guard },
        async () => ({ value }),
        async (draft) => {
          writes++;
          value = draft.value;
        },
      ),
    );
  render();
  await flush();
  render().setValue({ value: "new" });
  render();
  assert.equal(await render().save(), true);
  assert.equal(dirty, false);
  assert.equal(busy, false);
  assert.equal(writes, 1);
  assert.equal(render().value.value, "new");
  assert.equal(render().dirty, false);
});

function navigationFixture(hookName = "useWorkspaceNavigation") {
  const harness = hookHarness(),
    dialogs = [],
    actions = [],
    listeners = new Map();
  let historyGuard;
  const modal = {
    confirm(options) {
      const dialog = {
        options,
        destroyed: false,
        update(update) {
          Object.assign(options, update);
        },
        destroy() {
          dialog.destroyed = true;
        },
      };
      dialogs.push(dialog);
      return dialog;
    },
  };
  let location = { search: "?id=1&keep=kept" };
  let params = new URLSearchParams(location.search);
  const navigate = (method, ...args) => {
    actions.push([method, ...args]);
    if (typeof args[0] === "string" && args[0].startsWith("?")) {
      location = { search: args[0] };
      params = new URLSearchParams(location.search);
    }
  };
  const navigator = {
    push: (...args) => navigate("push", ...args),
    replace: (...args) => navigate("replace", ...args),
    go: (...args) => actions.push(["go", ...args]),
  };
  const originalPush = navigator.push;
  const element = (type, props) => ({ type, props });
  const load = sourceModules({
    overrides: {
      react: harness.react,
      "react/jsx-runtime": { jsx: element, jsxs: element },
      antd: {
        App: { useApp: () => ({ modal }) },
        Button: "Button",
        Space: "Space",
      },
      "react-router-dom": {
        UNSAFE_NavigationContext: { value: { navigator } },
        useLocation: () => location,
        useSearchParams: () => [
          params,
          (next, options) =>
            navigator[options?.replace ? "replace" : "push"](`?${next}`),
        ],
      },
      "comm/management": {
        useWorkspaceNavigation: (...args) =>
          load("./management/useWorkspaceNavigation").useWorkspaceNavigation(...args),
      },
      "../session": {
        registerHistoryNavigationGuard(guard) {
          historyGuard = guard;
          return () => {
            historyGuard = undefined;
          };
        },
      },
    },
    globals: {
      window: {
        history: { state: { idx: 3 } },
        addEventListener: (name, callback) => listeners.set(name, callback),
        removeEventListener: (name) => listeners.delete(name),
      },
    },
  });
  const useNavigation = load(
    hookName === "useSelectionNavigation"
      ? "../../../remote/system/src/hooks/useSelectionNavigation"
      : `./management/${hookName}`,
  )[hookName];
  const buttons = (dialog = dialogs.at(-1)) =>
    [...dialog.options.footer().props.children].filter(Boolean);
  return {
    harness,
    dialogs,
    actions,
    navigator,
    listeners,
    originalPush,
    render: (...args) => harness.render(() => useNavigation(...args)),
    params: () => params,
    historyGuard: () => historyGuard,
    buttons,
    click: (index, dialog) => buttons(dialog)[index].props.onClick(),
  };
}

test("optional navigation footer hides unregistered saves and preserves custom content", async () => {
  const f = navigationFixture(),
    options = { hideSaveWithoutHandler: true, discardContent: "自定义放弃文案" },
    guard = f.render(undefined, options);
  guard.onDirtyChange(true);
  const pending = guard.allow();
  assert.equal(f.dialogs.at(-1).options.content, options.discardContent);
  assert.deepEqual(
    f.buttons().map((button) => button.props.children),
    ["继续编辑", "放弃修改"],
  );
  f.click(0);
  assert.equal(await pending, false);
  assert.equal(guard.isDirty(), true);
  guard.registerSave(async () => true);
  const saving = guard.allow();
  assert.equal(f.buttons().at(-1).props.children, "保存并离开");
  await f.click(2);
  assert.equal(await saving, true);
  guard.registerSave(null);
  guard.onDirtyChange(true);
  const leaving = guard.allow();
  assert.equal(f.buttons().length, 2);
  f.click(1);
  assert.equal(await leaving, true);
});

test("accepted commits update URLs under locks without allowing later user navigation", async () => {
  const f = navigationFixture(),
    guard = f.render();
  guard.onBusyChange(true);
  guard.setPageBusy(true);
  guard.onBusyChange(false);
  assert.equal(guard.isBusy(), true);
  guard.commitNavigation(() => f.navigator.replace("/saved"));
  f.navigator.push("/blocked");
  await flush();
  assert.deepEqual(f.actions, [["replace", "/saved"]]);
  assert.equal(f.dialogs.length, 0);
  assert.throws(() => guard.commitNavigation(() => {
    throw new Error("failed commit");
  }), /failed commit/);
  f.navigator.push("/still-blocked");
  await flush();
  assert.equal(f.actions.length, 1);
  guard.setPageBusy(false);
  assert.equal(guard.isBusy(), false);
  f.navigator.push("/unlocked");
  assert.deepEqual(f.actions.at(-1), ["push", "/unlocked"]);
});

function selectionNavigationFixture() {
  const f = navigationFixture("useSelectionNavigation");
  const options = {
    readSelection: (params) => params.get("id"),
    sameSelection: (a, b) => a === b,
    selectionParams: (params, selection) => {
      const next = new URLSearchParams(params);
      next.set("id", selection);
      return next;
    },
    discardContent: "保留 system 自定义文案",
  };
  return { ...f, render: () => f.render(options) };
}

test("system URL changes confirm once before selection changes and never roll back with replace", async () => {
  const f = selectionNavigationFixture();
  let nav = f.render();
  assert.deepEqual(Object.keys(nav), [
    "selection", "selectionRef", "busy", "mounted", "isBusy", "onDirtyChange",
    "onBusyChange", "setPageBusy", "commit", "transition", "allowDiscard",
  ]);
  nav.onDirtyChange(true);
  f.navigator.push("?id=2&keep=kept");
  assert.equal(f.render().selection, "1");
  assert.equal(f.params().get("id"), "1");
  assert.equal(f.dialogs.at(-1).options.content, "保留 system 自定义文案");
  assert.equal(f.buttons().length, 2);
  f.click(0);
  await flush();
  assert.equal(f.render().selection, "1");
  assert.equal(f.actions.length, 0);
  f.navigator.replace("?id=2&keep=kept");
  f.click(1);
  await flush();
  nav = f.render();
  assert.equal(nav.selection, "2");
  assert.equal(nav.selectionRef.current, "2");
  assert.equal(f.params().get("id"), "2");
  assert.equal(f.dialogs.length, 2);
  assert.deepEqual(f.actions, [["replace", "?id=2&keep=kept"]]);
  nav.onDirtyChange(true);
  const first = nav.transition("3"), latest = nav.transition("4");
  assert.equal(f.dialogs.length, 3);
  f.click(1);
  await Promise.all([first, latest]);
  assert.equal(f.render().selection, "4");
  assert.equal(f.params().get("id"), "4");
  assert.equal(f.params().get("keep"), "kept");
  assert.equal(f.dialogs.length, 3);
  assert.equal(f.actions.length, 2);
});

test("system shares history and Host guards, unload protection and synchronous busy locks", async () => {
  const f = selectionNavigationFixture(),
    nav = f.render();
  nav.onDirtyChange(true);
  const history = f.historyGuard().confirm();
  f.navigator.push("/host-module");
  assert.equal(f.dialogs.length, 1);
  f.click(0);
  assert.equal(await history, false);
  await flush();
  assert.equal(f.actions.length, 0);
  nav.onBusyChange(true);
  nav.setPageBusy(true);
  nav.onBusyChange(false);
  assert.equal(nav.isBusy(), true);
  assert.equal(f.render().busy, true);
  assert.equal(await nav.allowDiscard(), false);
  assert.equal(await f.historyGuard().confirm(), false);
  await nav.transition("2");
  f.navigator.push("/blocked-host");
  f.navigator.go(-1);
  await flush();
  assert.equal(f.actions.length, 0);
  assert.equal(f.dialogs.length, 1);
  const event = { preventDefault() { this.prevented = true; } };
  f.listeners.get("beforeunload")(event);
  assert.equal(event.prevented, true);
  assert.equal(event.returnValue, "");
  nav.onDirtyChange(false);
  nav.commit("3", true);
  assert.equal(f.render().selection, "3");
  assert.equal(f.params().get("id"), "3");
  assert.equal(nav.isBusy(), true);
  nav.setPageBusy(false);
  assert.equal(nav.isBusy(), false);
  nav.onDirtyChange(true);
  const pending = nav.transition("4");
  f.harness.unmount();
  assert.equal(nav.mounted.current, false);
  assert.equal(f.historyGuard(), undefined);
  assert.equal(f.listeners.size, 0);
  f.click(1);
  await pending;
  assert.equal(f.actions.length, 1);
});

test("navigation can continue editing, discard, or save and leave without duplicate dialogs", async () => {
  const f = navigationFixture();
  let discarded = 0,
    writes = 0;
  const guard = f.render(() => discarded++);
  guard.onDirtyChange(true);
  f.navigator.push("/next");
  f.navigator.replace("/latest");
  assert.equal(f.dialogs.length, 1);
  assert.equal(f.historyGuard().isBlocked(), true);
  f.click(0);
  await flush();
  assert.equal(f.actions.length, 0);
  assert.equal(guard.isDirty(), true);
  f.navigator.go(-1);
  f.click(1);
  await flush();
  assert.equal(discarded, 1);
  assert.deepEqual(f.actions, [["go", -1]]);
  guard.onDirtyChange(true);
  guard.registerSave(async () => {
    writes++;
    return true;
  });
  f.navigator.push("/saved");
  await f.click(2);
  await flush();
  assert.equal(writes, 1);
  assert.equal(guard.isDirty(), false);
  assert.deepEqual(f.actions.at(-1), ["push", "/saved"]);
  assert.equal(f.dialogs.at(-1).destroyed, true);
  guard.onDirtyChange(true);
  f.harness.unmount();
  f.navigator.push("/after-unmount");
  assert.deepEqual(f.actions.at(-1), ["push", "/after-unmount"]);
  assert.equal(f.listeners.size, 0);
  assert.equal(f.historyGuard(), undefined);
});

test("failed saves and independent workspace/editor locks prevent navigation", async () => {
  const f = navigationFixture();
  const guard = f.render();
  guard.onBusyChange(true);
  guard.setPageBusy(true);
  guard.onBusyChange(false);
  assert.equal(await guard.allow(), false);
  assert.equal(f.render().busy, true);
  f.navigator.push("/blocked");
  await flush();
  assert.equal(f.dialogs.length, 0);
  guard.setPageBusy(false);
  guard.onDirtyChange(true);
  guard.registerSave(async () => false);
  f.navigator.push("/failed");
  await f.click(2);
  await flush();
  assert.equal(f.actions.length, 0);
  assert.equal(guard.isDirty(), true);
  const execution = guard.ensureSaved();
  await assert.rejects(f.dialogs.at(-1).options.onOk(), /配置未保存/);
  f.dialogs.at(-1).options.onCancel();
  assert.equal(await execution, false);
  guard.registerSave(async () => true);
  const next = guard.ensureSaved();
  await f.dialogs.at(-1).options.onOk();
  assert.equal(await next, true);
  assert.equal(guard.isDirty(), false);
});

test("root save-only confirmation retains native cancellation and retries failed saves", async () => {
  const f = navigationFixture(),
    guard = f.render();
  guard.onDirtyChange(true);
  const pending = guard.ensureSaved(),
    dialog = f.dialogs.at(-1);
  assert.equal(dialog.options.title, "请先保存当前配置");
  assert.equal(dialog.options.content, "保存成功后执行操作。");
  assert.equal(dialog.options.okText, "保存并继续");
  assert.equal(dialog.options.cancelText, "继续编辑");
  assert.equal(dialog.options.footer, undefined);
  await assert.rejects(dialog.options.onOk(), /配置未保存/);
  guard.registerSave(async () => {
    throw new Error("offline");
  });
  await assert.rejects(dialog.options.onOk(), /offline/);
  assert.equal(dialog.destroyed, false);
  assert.equal(guard.isDirty(), true);
  guard.registerSave(async () => true);
  await dialog.options.onOk();
  assert.equal(await pending, true);
  assert.equal(guard.isDirty(), false);
});

test("scoped navigation saves dirty entries sequentially by depth and caches guards by key", async () => {
  const f = navigationFixture("useScopedWorkspaceNavigation"),
    { guard, scope } = f.render(),
    deepest = deferred(),
    order = [],
    entries = [
      ["outer", undefined],
      ["first", 1],
      ["deepest", 2],
      ["second", 1],
    ].map(([key, depth]) => {
      const entry = scope(key, depth);
      entry.registerSave(async () => {
        order.push(key);
        return key === "deepest" ? await deepest.promise : true;
      });
      entry.onDirtyChange(true);
      return entry;
    });
  scope("clean", 3).registerSave(async () => assert.fail("clean entry saved"));
  assert.equal(f.render().scope, scope);
  assert.equal(scope("outer", 99), entries[0]);
  assert.equal(guard.isDirty(), true);
  assert.equal(f.historyGuard().isBlocked(), true);
  f.navigator.push("/saved-scopes");
  const saving = f.click(2);
  assert.deepEqual(order, ["deepest"]);
  assert.equal(f.actions.length, 0);
  deepest.resolve(true);
  await saving;
  await flush();
  assert.deepEqual(order, ["deepest", "first", "second", "outer"]);
  assert.equal(
    entries.every((entry) => !entry.isDirty()),
    true,
  );
  assert.equal(guard.isDirty(), false);
  assert.equal(f.historyGuard().isBlocked(), false);
  assert.deepEqual(f.actions, [["push", "/saved-scopes"]]);
});

test("scoped aggregate save stops on false, thrown or missing saves and retries only dirty entries", async () => {
  for (const failure of ["false", "throw", "missing"]) {
    const f = navigationFixture("useScopedWorkspaceNavigation"),
      { guard, scope } = f.render(),
      order = [],
      outer = scope("outer"),
      middle = scope("middle", 1),
      inner = scope("inner", 2);
    for (const [key, entry] of [
      ["outer", outer],
      ["inner", inner],
    ]) {
      entry.onDirtyChange(true);
      entry.registerSave(async () => {
        order.push(key);
        return true;
      });
    }
    middle.onDirtyChange(true);
    if (failure !== "missing")
      middle.registerSave(async () => {
        order.push("middle");
        if (failure === "throw") throw new Error("offline");
        return false;
      });
    const leaving = guard.allow();
    await f.click(2);
    assert.equal(await leaving, false);
    assert.deepEqual(
      order,
      failure === "missing" ? ["inner"] : ["inner", "middle"],
    );
    assert.equal(inner.isDirty(), false);
    assert.equal(middle.isDirty(), true);
    assert.equal(outer.isDirty(), true);
    assert.equal(guard.isDirty(), true);
    middle.registerSave(async () => {
      order.push("retry-middle");
      return true;
    });
    const retry = guard.allow();
    await f.click(2);
    assert.equal(await retry, true);
    assert.deepEqual(order.slice(-2), ["retry-middle", "outer"]);
  }
});

test("any scoped editor or page lock immediately blocks all scopes and history navigation", async () => {
  const f = navigationFixture("useScopedWorkspaceNavigation"),
    { guard, scope } = f.render(),
    editing = scope("editing"),
    peer = scope("peer"),
    clean = scope("clean");
  editing.onDirtyChange(true);
  for (const lock of ["onBusyChange", "setPageBusy"]) {
    peer[lock](true);
    assert.equal(editing.busy, true);
    assert.equal(clean.busy, true);
    assert.equal(f.render().guard.busy, true);
    assert.equal(await editing.allow(), false);
    assert.equal(await editing.ensureSaved(), false);
    assert.equal(await clean.allow(), false);
    assert.equal(await guard.allow(), false);
    assert.equal(await guard.ensureSaved(), false);
    assert.equal(await f.historyGuard().confirm(), false);
    f.navigator.push("/blocked");
    f.navigator.replace("/blocked");
    f.navigator.go(-1);
    await flush();
    assert.equal(f.actions.length, 0);
    assert.equal(f.dialogs.length, 0);
    peer[lock](false);
    assert.equal(editing.busy, false);
  }
  peer.onBusyChange(true);
  peer.setPageBusy(true);
  peer.onBusyChange(false);
  assert.equal(editing.busy, true);
  peer.setPageBusy(false);
  assert.equal(editing.busy, false);
  let prevented = false;
  const event = {
    preventDefault: () => {
      prevented = true;
    },
  };
  f.listeners.get("beforeunload")(event);
  assert.equal(prevented, true);
  assert.equal(event.returnValue, "");
});

test("scoped save-only confirmation offers save and continue without discarding other entries", async () => {
  const f = navigationFixture("useScopedWorkspaceNavigation"),
    { guard, scope } = f.render(),
    editing = scope("editing"),
    peer = scope("peer");
  editing.onDirtyChange(true);
  peer.onDirtyChange(true);
  editing.registerDiscard(() => assert.fail("save-only discarded"));
  editing.registerSave(async () => true);
  peer.registerSave(async () => assert.fail("peer saved"));
  const pending = editing.ensureSaved();
  assert.equal(f.dialogs.at(-1).options.title, "请先保存当前配置");
  assert.deepEqual(
    f.buttons().map((button) => button.props.children),
    ["继续编辑", "保存并继续"],
  );
  await f.click(1);
  assert.equal(await pending, true);
  assert.equal(editing.isDirty(), false);
  assert.equal(peer.isDirty(), true);
  assert.equal(guard.isDirty(), true);
});

test("scoped concurrent allow and ensureSaved reuse pending while other entries remain independent", async () => {
  const f = navigationFixture("useScopedWorkspaceNavigation"),
    { scope } = f.render(),
    editing = scope("editing"),
    peer = scope("peer"),
    write = deferred();
  let writes = 0;
  editing.onDirtyChange(true);
  peer.onDirtyChange(true);
  editing.registerSave(async () => {
    writes++;
    return await write.promise;
  });
  const first = editing.allow(),
    firstDialog = f.dialogs.at(-1);
  assert.equal(editing.allow(), first);
  assert.equal(editing.ensureSaved(), first);
  assert.equal(f.dialogs.length, 1);
  const other = peer.allow();
  assert.notEqual(other, first);
  assert.equal(f.dialogs.length, 2);
  f.click(0);
  assert.equal(await other, false);
  f.click(0, firstDialog);
  assert.equal(await first, false);
  assert.equal(editing.isDirty(), true);
  const retry = editing.ensureSaved();
  assert.notEqual(retry, first);
  assert.equal(editing.allow(), retry);
  assert.equal(f.dialogs.length, 3);
  const saving = f.click(1);
  assert.equal(editing.allow(), retry);
  write.resolve(true);
  await saving;
  assert.equal(await retry, true);
  assert.equal(writes, 1);
});

test("scoped discard calls only its own registration and root discard calls all current registrations", async () => {
  const f = navigationFixture("useScopedWorkspaceNavigation"),
    { guard, scope } = f.render(),
    editing = scope("editing"),
    peer = scope("peer"),
    discarded = [];
  editing.registerDiscard(() => discarded.push("editing"));
  peer.registerDiscard(() => assert.fail("stale discard"));
  peer.registerDiscard(() => discarded.push("peer"));
  const removed = scope("removed");
  removed.registerDiscard(() => assert.fail("removed discard"));
  removed.registerDiscard(null);
  editing.onDirtyChange(true);
  peer.onDirtyChange(true);
  const local = editing.allow();
  f.click(1);
  assert.equal(await local, true);
  assert.deepEqual(discarded, ["editing"]);
  assert.equal(editing.isDirty(), false);
  assert.equal(peer.isDirty(), true);
  assert.equal(guard.isDirty(), true);
  const leaving = guard.allow();
  f.click(1);
  assert.equal(await leaving, true);
  assert.deepEqual(discarded, ["editing", "editing", "peer"]);
  assert.equal(peer.isDirty(), false);
  assert.equal(guard.isDirty(), false);
});

test("scoped root discard invokes the latest host reset after editor discards, without resetting peers on local close", async () => {
  const f = navigationFixture("useScopedWorkspaceNavigation"), events = [];
  const { guard, scope } = f.render(() => events.push("old host"));
  const report = scope("report"), dataset = scope("dataset", 1);
  report.onDirtyChange(true);
  dataset.onDirtyChange(true);
  dataset.registerDiscard(() => events.push("dataset"));
  const closing = dataset.allow();
  f.click(1);
  assert.equal(await closing, true);
  assert.deepEqual(events, ["dataset"]);
  assert.equal(report.isDirty(), true);
  f.render(() => events.push("current host"));
  const leaving = guard.allow();
  f.click(1);
  assert.equal(await leaving, true);
  assert.deepEqual(events, ["dataset", "dataset", "current host"]);
  assert.equal(report.isDirty(), false);
  assert.equal(guard.isDirty(), false);
});

test("session changes invalidate old reads and unsubscribe on unmount", async () => {
  const harness = hookHarness(),
    listeners = new Set(),
    old = deferred(),
    next = deferred();
  let sessionId = "old";
  const requests = [];
  const load = sourceModules({
    overrides: {
      react: harness.react,
      "../session": {
        getSessionId: () => sessionId,
        onSessionIdChange(callback) {
          listeners.add(callback);
          return () => listeners.delete(callback);
        },
      },
      "../request": {
        request: {
          post(url, body) {
            requests.push({ url, body });
            return body.session_id === "old" ? old.promise : next.promise;
          },
        },
      },
    },
  });
  const { useManagementSession } = load("./management/useManagementSession");
  const render = () => harness.render(() => useManagementSession(true));
  render();
  sessionId = "next";
  listeners.forEach((callback) => callback({ sessionId }));
  assert.equal(render().data, undefined);
  next.resolve({ access_info: { org_id: 2, user_id: 7 } });
  await flush();
  assert.equal(render().data.orgId, 2);
  assert.equal(render().data.userName, "当前用户");
  old.resolve({ session_info: { org_id: 1, user_id: 3 } });
  await flush();
  assert.equal(render().data.sessionId, "next");
  assert.equal(listeners.size, 1);
  listeners.forEach((callback) => callback({ sessionId: null }));
  render();
  await flush();
  assert.match(render().error, /请先登录/);
  assert.equal(requests.length, 2);
  assert.equal(requests[0].url, "auth/GetSessionInfo");
  harness.unmount();
  assert.equal(listeners.size, 0);
});

test("management session validates organizations and optional required users", async () => {
  for (const [row, requireUser, expected] of [
    [{ org_id: 0 }, false, /登录机构/],
    [{ org_id: 1 }, true, /登录用户/],
    [{ org_id: 1 }, false, undefined],
  ]) {
    const harness = hookHarness();
    const load = sourceModules({
      overrides: {
        react: harness.react,
        "../session": {
          getSessionId: () => "session",
          onSessionIdChange: () => () => {},
        },
        "../request": {
          request: { post: async () => ({ session_info: row }) },
        },
      },
    });
    const { useManagementSession } = load("./management/useManagementSession");
    const render = () =>
      harness.render(() => useManagementSession(requireUser));
    render();
    await flush();
    if (expected) assert.match(render().error, expected);
    else {
      assert.equal(render().data.userId, 0);
      assert.equal(render().data.orgName, "机构 1");
    }
  }
});

test("editor discard restores the latest accepted baseline and clears draft errors synchronously", async () => {
  const h = hookHarness();
  let server = { name: "old" },
    fail = true,
    dirty,
    registered;
  const guard = {
    onDirtyChange(value) {
      dirty = value;
    },
    onBusyChange() {},
    registerSave() {},
    registerDiscard(value) {
      registered = value;
    },
  };
  const { useManagementEditor } = sourceModules({
    overrides: { react: h.react },
  })("./management/useManagementEditor");
  const render = () =>
    h.render(() =>
      useManagementEditor(
        { identity: "session:1", isCurrent: () => true, guard },
        async () => ({ ...server }),
        async (value) => {
          if (fail) throw new Error("write offline");
          server = { name: value.name.trim() };
        },
      ),
    );
  render();
  await flush();
  render().setValue({ name: "draft" });
  assert.equal(await render().save(), false);
  assert.match(render().error, /write offline/);
  registered();
  assert.equal(dirty, false);
  assert.equal(render().value.name, "old");
  assert.equal(render().error, undefined);
  fail = false;
  render().setValue({ name: " saved " });
  assert.equal(await render().save(), true);
  render().setValue({ name: "another draft" });
  render();
  registered();
  assert.equal(render().value.name, "saved");
  assert.equal(render().saved, false);
  assert.equal(render().dirty, false);
  h.replayEffects();
  assert.equal(typeof registered, "function");
  h.unmount();
  assert.equal(registered, null);
});

test("discard preserves committed read recovery and cannot repeat its write", async () => {
  const h = hookHarness();
  let writes = 0,
    failedRead = false;
  const guard = { onDirtyChange() {}, onBusyChange() {}, registerSave() {} };
  const { useManagementEditor } = sourceModules({
    overrides: { react: h.react },
  })("./management/useManagementEditor");
  const render = () =>
    h.render(() =>
      useManagementEditor(
        { identity: "session:1", isCurrent: () => true, guard },
        async () => {
          if (failedRead) throw new Error("read offline");
          return { name: "server" };
        },
        async () => {
          writes++;
          failedRead = true;
        },
      ),
    );
  render();
  await flush();
  render().setValue({ name: "committed" });
  assert.equal(await render().save(), true);
  render().discard();
  assert.match(render().loadError, /已保存成功/);
  assert.equal(await render().save(), true);
  assert.equal(writes, 1);
  failedRead = false;
  await render().reload();
  assert.equal(render().loadError, undefined);
  assert.equal(render().value.name, "server");
  h.unmount();
});

test("discard ignores stale identities and unregisters only its current guard", async () => {
  const h = hookHarness();
  let current = true,
    registered;
  const guard = {
    onDirtyChange() {},
    onBusyChange() {},
    registerSave() {},
    registerDiscard(value) {
      registered = value;
    },
  };
  const { useManagementEditor } = sourceModules({
    overrides: { react: h.react },
  })("./management/useManagementEditor");
  const render = () =>
    h.render(() =>
      useManagementEditor(
        { identity: "session:1", isCurrent: () => current, guard },
        async () => ({ name: "old" }),
        async () => {},
      ),
    );
  render();
  await flush();
  render().setValue({ name: "draft" });
  render();
  current = false;
  registered();
  assert.equal(render().value.name, "draft");
  h.unmount();
  assert.equal(registered, null);
});
