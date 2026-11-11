import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { build } from "esbuild";
import { chromium } from "playwright-core";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../../../../", import.meta.url));
const temporary = await mkdtemp(resolve(tmpdir(), "web2-data-federation-"));
const fixtureDir = resolve(temporary, "fixtures");
await build({
  entryPoints: [
    "board/tests/preview/mock.ts",
    "metric/tests/browser/mock.ts",
    "report/tests/browser/mock.ts",
  ].map((path) => resolve(root, "remote", path)),
  bundle: true,
  platform: "node",
  format: "esm",
  loader: { ".jpg": "dataurl" },
  outdir: fixtureDir,
  outbase: resolve(root, "remote"),
  logLevel: "warning",
});
const contentTypes = {
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".wasm": "application/wasm",
  ".html": "text/html",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};
globalThis.window = {
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent() {},
  location: new URL("http://localhost/"),
};
globalThis.document = { documentElement: { dataset: {} } };
globalThis.location = new URL("http://localhost/");
let app,
  hostTheme,
  fixture,
  blocked = [],
  requested = [];
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    requested.push(url.pathname);
    if (url.pathname.startsWith("/api/")) {
      let raw = "";
      for await (const chunk of req) raw += chunk;
      const data = raw ? JSON.parse(raw) : {};
      const operation = url.pathname.slice(5);
      let result;
      if (app === "host" && operation === "sys/GetParamValue") {
        result = {
          code: 0,
          item_value: data.item_code === "theme_color" ? hostTheme : "",
        };
      } else if (app === "host" && operation === "federation/GetMyModuleList") {
        const rows = [
          ["metric", "metric-preview", 101, "指标主题测试"],
          ["board", "board-preview", 102, "看板主题测试"],
          ["report", "report-preview", 103, "报表主题测试"],
        ].map(([app_code, entry_code, module_id, module_name]) => ({
          app_code,
          entry_code,
          module_id,
          module_name,
          valid_status: "1",
          parent_id: 0,
        }));
        result = {
          code: 0,
          row_list: rows.filter(
            (row) => !data.app_code || row.app_code === data.app_code,
          ),
        };
      } else if (
        app === "host" &&
        operation.startsWith("federation/") &&
        operation !== "federation/GetModuleProperty"
      ) {
        result = { code: 0, row_list: [] };
      } else {
        result = await fixture.request.post(operation, data);
      }
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify(result));
      return;
    }
    const mount = url.pathname.split("/")[1];
    const known = [
      "metric",
      "board",
      "report",
      "data",
      "comm",
      "widget",
      "visit",
      "login",
    ];
    if (
      app !== "host" &&
      ["metric", "board", "report"].includes(mount) &&
      mount !== app
    ) {
      blocked.push(url.pathname);
      res.writeHead(503);
      res.end("Peer business application is offline");
      return;
    }
    const dir = ["data", "comm", "widget", "visit"].includes(mount)
      ? `share/${mount}`
      : app === "host"
        ? known.includes(mount)
          ? `remote/${mount}`
          : "host"
        : `remote/${app}`;
    const asset = known.includes(mount)
      ? url.pathname.slice(mount.length + 2)
      : url.pathname.slice(1);
    let path = resolve(root, dir, "dist", asset);
    if (!(await stat(path).catch(() => null))?.isFile())
      path = resolve(
        root,
        app === "host"
          ? "host/dist/index.html"
          : `remote/${app}/dist/index.html`,
      );
    res.writeHead(200, {
      "content-type": contentTypes[extname(path)] || "application/octet-stream",
      "cache-control": "no-store",
    });
    res.end(await readFile(path));
  } catch (error) {
    res.writeHead(500, { "content-type": "application/json" });
    res.end(JSON.stringify({ code: 500, message: error.message }));
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
const results = [];
try {
  browser = await chromium.launch({
    headless: true,
    executablePath:
      process.env.CHROME_PATH ||
      (process.platform === "darwin"
        ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
        : chromium.executablePath()),
    args: ["--no-sandbox"],
  });
  for (const scenario of [
    {
      app: "metric",
      path: "/metric-preview?lib_id=10&catalog_id=100",
      expected: "门急诊人次",
    },
    {
      app: "metric",
      path: "/metric-dashboard?moduleId=42&metric_id=1001",
      expected: "医院指标看板",
    },
    {
      app: "board",
      path: "/board-preview?board_id=21",
      expected: "门诊运营总览",
    },
    {
      app: "report",
      path: "/report-preview?report_id=101",
      expected: "门诊业务日报",
    },
  ]) {
    if (process.env.HOST_THEME_ONLY) continue;
    app = scenario.app;
    requested = [];
    blocked = [];
    globalThis.location = new URL(scenario.path, origin);
    window.location = globalThis.location;
    fixture = await import(
      pathToFileURL(
        resolve(
          fixtureDir,
          `${app}/tests/${app === "board" ? "preview" : "browser"}/mock.js`,
        ),
      ).href + `?case=${app}`
    );
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1100 },
    });
    await context.addInitScript(() => {
      if (window === window.top)
        sessionStorage.setItem("session_id", "federation-smoke");
    });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    await page.goto(origin + scenario.path, {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    await page
      .getByText(scenario.expected, { exact: false })
      .first()
      .waitFor({ timeout: 15000 });
    if (scenario.path.startsWith("/metric-dashboard")) {
      assert.equal(
        await page
          .locator(".mp-query-fields .ant-select")
          .first()
          .evaluate((node) => getComputedStyle(node).backgroundColor),
        "rgb(20, 20, 20)",
        "the federated dashboard must derive dark control tokens",
      );
      await page.getByRole("button", { name: "检索单元", exact: true }).click();
      const dialog = page.locator(".mp-modal .ant-modal-container");
      await dialog.waitFor();
      assert.equal(
        await dialog.evaluate((node) => getComputedStyle(node).backgroundColor),
        "rgb(255, 255, 255)",
        "query-controls and metric-preview must share the original host theme",
      );
      await page.getByRole("button", { name: "Close", exact: true }).click();
    }
    if (app === "board") {
      await page
        .getByText("门急诊人次(人次)", { exact: false })
        .first()
        .waitFor();
      await page.getByText("门诊报表", { exact: true }).first().waitFor();
      await page.waitForFunction(
        () => [...document.querySelectorAll("iframe")].length > 0,
      );
      const chartFrame = page
        .frames()
        .find((frame) => frame !== page.mainFrame());
      await chartFrame.locator("canvas").first().waitFor({ timeout: 15000 });
      assert.ok(
        requested.some((path) => path.startsWith("/data/assets/echarts.min-")),
        "chart runtime must be served by data",
      );
    }
    if (app === "report") {
      await page
        .getByRole("button", { name: "看板", exact: true })
        .first()
        .click();
      await page
        .locator(".rp-drill-board")
        .getByText("运行概况", { exact: true })
        .waitFor({ timeout: 15000 });
      await page.goto(origin + "/report-preview?report_id=103", {
        waitUntil: "networkidle",
      });
      await page
        .getByText("Report Preview PDF", { exact: false })
        .first()
        .waitFor({ timeout: 15000 });
      assert.ok(
        requested.some(
          (path) => path === "/data/report-pdf-assets/pdf.worker.min.js",
        ),
        "PDF worker must be served by data",
      );
      await page.goto(
        origin + "/report-management?catalog_id=1&report_id=101",
        { waitUntil: "networkidle" },
      );
      await page
        .getByRole("button", { name: "编辑数据集", exact: true })
        .click();
      await page
        .getByRole("dialog")
        .filter({ hasText: "编辑数据集" })
        .waitFor({ timeout: 15000 });
      await page.getByRole("tab", { name: "参数", exact: true }).click();
      await page
        .getByRole("dialog")
        .filter({ hasText: "编辑数据集" })
        .getByRole("button", { name: /^关\s*闭$/ })
        .click();
    }
    const body = await page.locator("body").innerText();
    const item = {
      app,
      success: true,
      errors,
      blocked,
      dataLoaded: requested.includes("/data/data.js"),
      commLoaded: requested.includes("/comm/comm.js"),
      body: body.slice(-200),
    };
    if (process.env.SMOKE_SCREENSHOTS)
      await page.screenshot({
        path: resolve(process.env.SMOKE_SCREENSHOTS, `${app}.png`),
        fullPage: true,
      });
    results.push(item);
    console.log(JSON.stringify(item));
    await context.close();
  }
  // Exercise production Host + remotes in one document. The backend is mocked;
  // React/AntD, theme contexts, styles and federation modules are real build assets.
  app = "host";
  const fixtures = {};
  for (const name of ["metric", "board", "report"]) {
    fixtures[name] = await import(
      pathToFileURL(
        resolve(
          fixtureDir,
          `${name}/tests/${name === "board" ? "preview" : "browser"}/mock.js`,
        ),
      ).href + "?host"
    );
  }
  for (const primary of ["#1677ff", "#389e0d", "#d46b08"]) {
    hostTheme = primary;
    requested = [];
    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      colorScheme: "light",
    });
    await context.route("**/*", (route) => {
      const url = new URL(route.request().url());
      // Keep this test entirely local, including the optional launcher and SSE.
      return url.origin !== origin || url.pathname.startsWith("/sse/")
        ? route.fulfill({ status: 200, contentType: "text/plain", body: "" })
        : route.continue();
    });
    await context.addInitScript(() => {
      if (window === window.top) sessionStorage.setItem("session_id", "host-theme-smoke");
    });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const rootState = () =>
      page.evaluate(() => {
        const root = document.documentElement;
        const body = getComputedStyle(document.body);
        return {
          mode: root.dataset.theme,
          scheme: root.style.colorScheme,
          primary: root.style.getPropertyValue("--app-theme-primary"),
          background: root.style.getPropertyValue("--app-theme-bg-container"),
          shell: [
            body.margin,
            body.overflow,
            body.fontFamily,
            body.backgroundColor,
            body.color,
          ],
        };
      });
    fixture = fixtures.metric;
    globalThis.location = new URL(
      "/metric/metric-preview?moduleId=101&lib_id=10&catalog_id=100",
      origin,
    );
    window.location = globalThis.location;
    await page.goto(globalThis.location.href, { waitUntil: "networkidle" });
    await page.getByText("门急诊人次", { exact: false }).first().waitFor();
    await page.waitForFunction(
      (primary) =>
        document.documentElement.style.getPropertyValue(
          "--app-theme-primary",
        ) === primary,
      primary,
    );
    for (const mode of ["light", "dark"]) {
      await page.emulateMedia({ colorScheme: mode });
      await page.waitForFunction(
        (mode) => document.documentElement.dataset.theme === mode,
        mode,
      );
      const before = await rootState();
      for (const scenario of [
        {
          name: "board",
          path: "/board/board-preview?moduleId=102&board_id=21",
          expected: "门诊运营总览",
        },
        {
          name: "report",
          path: "/report/report-preview?moduleId=103&report_id=101",
          expected: "门诊业务日报",
        },
        {
          name: "metric",
          path: "/metric/metric-preview?moduleId=101&lib_id=10&catalog_id=100",
          expected: "门急诊人次",
        },
      ]) {
        fixture = fixtures[scenario.name];
        globalThis.location = new URL(scenario.path, origin);
        window.location = globalThis.location;
        await page.evaluate((path) => {
          history.pushState({}, "", path);
          window.dispatchEvent(new PopStateEvent("popstate"));
        }, scenario.path);
        await page
          .locator(
            {
              board: ".bp-workspace",
              report: ".rp-workspace",
              metric: ".mp-workspace",
            }[scenario.name],
          )
          .waitFor()
          .catch(async (error) => {
            console.error(
              JSON.stringify({
                scenario,
                errors,
                body: (await page.locator("body").innerText()).slice(-1500),
              }),
            );
            throw error;
          });
        await page
          .getByText(scenario.expected, { exact: false })
          .first()
          .waitFor();
        assert.deepEqual(
          await rootState(),
          before,
          `${scenario.name} must not mutate the Host root in ${mode}`,
        );
        if (scenario.name === "report") {
          await page.setViewportSize({ width: 500, height: 700 });
          await page
            .locator(".rp-mobile-toggle")
            .click()
            .catch(async (error) => {
              console.error(
                JSON.stringify({
                  scenario,
                  errors,
                  url: page.url(),
                  body: (await page.locator("body").innerText()).slice(-2500),
                }),
              );
              await page.screenshot({
                path: resolve(tmpdir(), "web2-host-theme-failure.png"),
              });
              throw error;
            });
          const drawer = page.getByRole("dialog", {
            name: "我的报表",
            exact: true,
          });
          await drawer.waitFor();
          assert.equal(
            await drawer.evaluate((node) =>
              getComputedStyle(node).getPropertyValue("--rp-surface"),
            ),
            before.background,
          );
          await drawer.locator(".ant-drawer-close").click();
          await page.setViewportSize({ width: 1280, height: 900 });
          await page
            .getByRole("button", { name: "看板", exact: true })
            .first()
            .click();
          const modal = page.getByRole("dialog", {
            name: "关联预览",
            exact: true,
          });
          await modal.waitFor();
          assert.equal(
            await modal.evaluate((node) =>
              getComputedStyle(node).getPropertyValue("--rp-surface"),
            ),
            before.background,
          );
          await modal.locator(".ant-modal-close").click();
        }
      }
    }
    assert.deepEqual(errors, []);
    console.log(
      JSON.stringify({
        app: "host",
        primary,
        modes: ["light", "dark"],
        success: true,
        switches: 6,
      }),
    );
    await context.close();
  }
} finally {
  await browser?.close();
  await new Promise((r) => server.close(r));
  await rm(temporary, { recursive: true, force: true });
}
if (
  results.some(
    (r) =>
      !r.success ||
      !r.dataLoaded ||
      !r.commLoaded ||
      r.blocked.length ||
      r.errors.length,
  )
)
  process.exitCode = 1;
