import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { commSource, hookHarness, sourceModules } from "./helpers.mjs";

const require = createRequire(import.meta.url);
const antd = require("antd");
const load = sourceModules();
const {
  AppThemeProvider,
  AppThemeScope,
  AppThemeModeProvider,
  useAppTheme,
  useAppThemeStyle,
  appThemeVars,
} = load("comm/theme");

for (const mode of ["light", "dark"]) {
  for (const primaryColor of ["#1677ff", "#389e0d", "#d46b08"]) {
    test(`${mode} provider derives CSS and AntD from the same brand`, () => {
      let seen;
      function Probe() {
        seen = {
          ...useAppTheme(),
          style: useAppThemeStyle(),
          token: antd.theme.useToken().token,
        };
        return null;
      }
      renderToStaticMarkup(
        h(AppThemeProvider, { mode, primaryColor }, h(Probe)),
      );
      assert.equal(seen.resolvedMode, mode);
      assert.equal(seen.style["--app-theme-primary"], seen.token.colorPrimary);
      assert.equal(
        seen.style["--app-theme-text-disabled"],
        seen.token.colorTextDisabled,
      );
      assert.equal(
        seen.style["--app-theme-success-bg-hover"],
        seen.token.colorSuccessBgHover,
      );
      assert.equal(seen.token.borderRadius, 6);
      const expected = antd.theme.getDesignToken({
        algorithm:
          mode === "dark"
            ? antd.theme.darkAlgorithm
            : antd.theme.defaultAlgorithm,
        token: { colorPrimary: primaryColor },
      });
      assert.equal(seen.token.colorPrimary, expected.colorPrimary);
    });
  }
}

test("a local theme changes its surface without changing siblings or the host mode", () => {
  const seen = {};
  function Probe({ name }) {
    seen[name] = { ...useAppTheme(), style: useAppThemeStyle() };
    return null;
  }
  const markup = renderToStaticMarkup(
    h(
      AppThemeProvider,
      { mode: "light", primaryColor: "#1677ff" },
      h(Probe, { name: "before" }),
      h(
        AppThemeScope,
        {
          mode: "dark",
          theme: { token: { colorPrimary: "#389e0d", colorBgBase: "#0c1220" } },
          style: { height: 123 },
        },
        h(Probe, { name: "local" }),
      ),
      h(Probe, { name: "after" }),
    ),
  );
  assert.deepEqual(seen.before, seen.after);
  assert.equal(seen.local.resolvedMode, "dark");
  assert.notEqual(
    seen.local.style["--app-theme-bg-container"],
    seen.before.style["--app-theme-bg-container"],
  );
  assert.notEqual(
    seen.local.style["--app-theme-primary"],
    seen.before.style["--app-theme-primary"],
  );
  assert.match(markup, /data-theme="dark"/);
  assert.match(markup, /height:123px/);
  assert.match(markup, /color-scheme:dark/);
});

test("legacy SSR has a stable light fallback and an explicit mode wins", () => {
  const seen = [];
  function Probe() {
    seen.push(useAppTheme().resolvedMode);
    return null;
  }
  renderToStaticMarkup(h(Probe));
  renderToStaticMarkup(h(AppThemeModeProvider, { mode: "dark" }, h(Probe)));
  assert.deepEqual(seen, ["light", "dark"]);
});

test("system preference subscription observes changes and releases its listener", () => {
  let matches = false,
    listener,
    subscriptions = 0,
    snapshot,
    serverSnapshot,
    subscribe;
  const media = {
    get matches() {
      return matches;
    },
    addEventListener(type, fn) {
      assert.equal(type, "change");
      listener = fn;
      subscriptions++;
    },
    removeEventListener(type, fn) {
      assert.equal(fn, listener);
      listener = undefined;
      subscriptions--;
    },
  };
  const fixture = sourceModules({
    overrides: {
      react: {
        useSyncExternalStore(s, read, server) {
          subscribe = s;
          snapshot = read;
          serverSnapshot = server;
          return read();
        },
      },
    },
    globals: { window: { matchMedia: () => media } },
  });
  const { useSystemDarkMode } = fixture(
    resolve(commSource, "usePrefersDarkMode.ts"),
  );
  assert.equal(useSystemDarkMode(true), false);
  let notified = 0;
  const stop = subscribe(() => notified++);
  matches = true;
  listener();
  assert.equal(notified, 1);
  assert.equal(snapshot(), true);
  assert.equal(serverSnapshot(), false);
  stop();
  assert.equal(subscriptions, 0);
  assert.equal(useSystemDarkMode(false), false);
  subscribe(() => notified++)();
  assert.equal(subscriptions, 0);
});

test("document root follows token/mode updates and restores previous values on unmount", () => {
  const harness = hookHarness();
  const values = new Map([["--app-theme-primary", "original"]]);
  const attrs = new Map([["data-theme", "original"]]);
  const root = {
    style: {
      colorScheme: "normal",
      getPropertyValue: (key) => values.get(key) ?? "",
      setProperty: (key, value) => values.set(key, value),
      removeProperty: (key) => values.delete(key),
    },
    getAttribute: (key) => attrs.get(key) ?? null,
    setAttribute: (key, value) => attrs.set(key, value),
    removeAttribute: (key) => attrs.delete(key),
  };
  let mode = "light",
    token = antd.theme.getDesignToken();
  const fixture = sourceModules({
    overrides: {
      react: harness.react,
      antd: { theme: { useToken: () => ({ token }) } },
      [resolve(commSource, "AppThemeProvider")]: {
        useAppTheme: () => ({ resolvedMode: mode }),
      },
    },
    globals: { document: { documentElement: root } },
  });
  const { AppThemeRoot } = fixture(resolve(commSource, "AppThemeRoot.tsx"));
  harness.render(() => AppThemeRoot({ children: null }));
  assert.equal(attrs.get("data-theme"), "light");
  mode = "dark";
  token = antd.theme.getDesignToken({
    algorithm: antd.theme.darkAlgorithm,
    token: { colorPrimary: "#389e0d" },
  });
  harness.render(() => AppThemeRoot({ children: null }));
  assert.equal(attrs.get("data-theme"), "dark");
  assert.equal(root.style.colorScheme, "dark");
  assert.equal(
    values.get("--app-theme-primary"),
    appThemeVars(token)["--app-theme-primary"],
  );
  harness.unmount();
  assert.deepEqual([...values], [["--app-theme-primary", "original"]]);
  assert.equal(attrs.get("data-theme"), "original");
  assert.equal(root.style.colorScheme, "normal");
});
