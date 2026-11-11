import assert from "node:assert/strict";
import { test } from "node:test";
import { createRequire } from "node:module";
import { createElement as h, createContext, useContext } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { sourceModules } from "./helpers.mjs";

const require = createRequire(import.meta.url);
const antd = require("antd");
const modals = [];
const load = sourceModules({
  overrides: {
    antd: {
      ...antd,
      // Portals need a browser; retain real ConfigProvider and token derivation.
      Modal: ({ children, ...props }) => {
        modals.push(props);
        return h("section", null, children);
      },
    },
  },
});
const {
  PreviewThemeProvider,
  PreviewModal,
  usePreviewTheme,
  usePreviewStyle,
  previewChartPalette,
} = load("data/metric/features/metric-preview/theme");
const { readableOption } = load(
  "data/metric/features/metric-preview/components/Chart",
);
const { AppThemeProvider, useAppTheme } = load("comm/theme");
const Business = createContext(undefined);

function capture(hostTheme, appearance = "dashboard", mode = "light") {
  const seen = {};
  const business = { metricId: 1001, busy: true };
  function Probe({ name }) {
    seen[name] = {
      ...usePreviewTheme(),
      mode: useAppTheme().resolvedMode,
      business: useContext(Business),
      compatibleStyle: usePreviewStyle(),
    };
    return null;
  }
  modals.length = 0;
  renderToStaticMarkup(
    h(
      AppThemeProvider,
      { mode, primaryColor: hostTheme.token?.colorPrimary, theme: hostTheme },
      h(
        Business.Provider,
        { value: business },
        h(Probe, { name: "host" }),
        h(
          PreviewThemeProvider,
          { appearance },
          h(Probe, { name: "canvas" }),
          h(
            PreviewModal,
            {
              open: true,
              width: 800,
              style: { top: 35 },
              className: "factor",
              zIndex: 3200,
            },
            h(Probe, { name: "dialog" }),
            h(
              PreviewThemeProvider,
              { appearance: "dashboard" },
              h(PreviewModal, { open: true }, h(Probe, { name: "nested" })),
            ),
          ),
        ),
      ),
    ),
  );
  return { seen, business, modal: modals[0] };
}

for (const [mode, algorithm] of [
  ["light", antd.theme.defaultAlgorithm],
  ["dark", antd.theme.darkAlgorithm],
]) {
  for (const primary of ["#1677ff", "#389e0d", "#d46b08"]) {
    test(`${mode} host ${primary}: dark canvas and nested host dialogs share the brand and preserve business state`, () => {
      const { seen, business, modal } = capture(
        {
          algorithm,
          token: {
            colorPrimary: primary,
            borderRadius: 6,
            zIndexPopupBase: 3000,
          },
        },
        "dashboard",
        mode,
      );
      assert.equal(seen.host.mode, mode);
      assert.equal(seen.canvas.mode, "dark");
      assert.equal(seen.canvas.appearance, "dashboard");
      assert.equal(seen.canvas.token.colorBgContainer, "#141414");
      assert.equal(
        seen.canvas.style["--mp-primary"],
        seen.canvas.token.colorPrimary,
      );
      assert.equal(seen.canvas.token.colorLink, seen.canvas.token.colorPrimary);
      assert.equal(
        seen.canvas.style["--mp-link"],
        seen.canvas.token.colorPrimaryText,
      );
      assert.equal(
        seen.canvas.style["--mp-selected"],
        seen.canvas.token.controlItemBgActive,
      );
      assert.deepEqual(seen.canvas.compatibleStyle, seen.canvas.style);
      for (const name of ["dialog", "nested"]) {
        assert.equal(seen[name].mode, mode);
        assert.equal(seen[name].appearance, "default");
        assert.equal(
          seen[name].token.colorBgContainer,
          seen.host.token.colorBgContainer,
        );
        assert.equal(
          seen[name].token.colorPrimary,
          seen.host.token.colorPrimary,
        );
        assert.equal(
          seen[name].style["--mp-warning-text"],
          seen.host.token.colorText,
        );
        assert.equal(
          seen[name].style["--mp-warning-bg"],
          seen.host.token.colorWarningBg,
        );
        assert.equal(seen[name].business, business);
        assert.equal(seen[name].token.zIndexPopupBase, 3000);
      }
      assert.equal(modal.style["--app-theme-text"], seen.host.token.colorText);
      assert.equal(modal.style["--mw-text"], seen.host.token.colorText);
      assert.equal(modal.style.top, 35);
      assert.equal(modal.style["--mp-text"], seen.host.token.colorText);
      assert.equal(modal.zIndex, 3200);
      assert.equal(modal.width, 800);
      assert.ok(modal.className.includes("factor"));
    });
  }
}

test("ordinary and embedded previews use actual tokens even for a non-black dark base", () => {
  const { seen } = capture(
    {
      algorithm: antd.theme.darkAlgorithm,
      token: { colorBgBase: "#0c1220", colorPrimary: "#389e0d" },
    },
    "default",
    "dark",
  );
  assert.equal(seen.canvas.mode, "dark");
  assert.equal(seen.dialog.mode, "dark");
  assert.equal(seen.canvas.style["--mp-bg"], seen.host.token.colorBgContainer);
  assert.equal(
    seen.canvas.style["--mp-toolbar"],
    seen.host.token.colorFillSecondary,
  );
  assert.equal(
    seen.canvas.style["--mp-value"],
    seen.host.token.colorPrimaryText,
  );
  assert.equal(seen.canvas.chart.text, seen.host.token.colorText);
  assert.equal(seen.canvas.chart.background, seen.host.token.colorBgContainer);
  assert.equal(seen.canvas.chart.palette, undefined);
});

test("chart presentation follows its surface while custom series colors, gradients and business markings survive", () => {
  const { seen } = capture({ algorithm: antd.theme.defaultAlgorithm });
  const option = {
    color: ["#112233"],
    tooltip: { trigger: "axis", formatter: "{b}" },
    xAxis: [{ type: "category", axisLabel: { formatter: "{value}月" } }],
    yAxis: { type: "value" },
    series: [
      {
        type: "line",
        color: "#654321",
        areaStyle: { color: { colorStops: [{ offset: 0, color: "#abcdef" }] } },
        markLine: { lineStyle: { color: "green" } },
      },
    ],
  };
  const before = structuredClone(option);
  for (const scope of [seen.canvas, seen.dialog]) {
    const shown = readableOption(option, scope.chart);
    assert.equal(shown.textStyle.color, scope.chart.text);
    assert.equal(shown.xAxis[0].axisLabel.color, scope.chart.text);
    assert.equal(shown.yAxis.splitLine.lineStyle.color, scope.chart.grid);
    assert.equal(shown.tooltip.backgroundColor, scope.chart.tooltipBackground);
    assert.equal(shown.tooltip.formatter, "{b}");
    assert.deepEqual(Array.from(shown.color), ["#112233"]);
    assert.equal(shown.series[0].color, "#654321");
    assert.deepEqual(shown.series[0].areaStyle, option.series[0].areaStyle);
    assert.deepEqual(shown.series[0].markLine, option.series[0].markLine);
  }
  assert.equal(
    readableOption({}, seen.canvas.chart).color,
    previewChartPalette,
  );
  assert.equal(readableOption({}, seen.dialog.chart).color, undefined);
  assert.deepEqual(option, before);
});
