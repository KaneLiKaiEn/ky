import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import { chromium } from "playwright-core";

const here = fileURLToPath(new URL("./forms", import.meta.url));
const server = await createServer({
  configFile: false,
  root: here,
  plugins: [react()],
  resolve: {
    alias: {
      "comm/request": resolve(here, "request.ts"),
      "comm/utils": resolve(here, "../../../comm/src/utils.ts"),
      "comm/theme": resolve(here, "../../../comm/src/theme.ts"),
    },
    dedupe: ["react", "react-dom", "antd"],
  },
  server: {
    host: "127.0.0.1",
    port: 0,
    fs: { allow: [resolve(here, "../../../..")] },
  },
});
let browser, page;
try {
  await server.listen();
  browser = await chromium.launch({
    headless: true,
    executablePath:
      process.env.CHROME_PATH ||
      (process.platform === "darwin"
        ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
        : chromium.executablePath()),
  });
  page = await browser.newPage({ viewport: { width: 1200, height: 1100 } });
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on("pageerror", (error) => {
    errors.push(error.message);
    console.error(error.message);
  });
  await page.goto(server.resolvedUrls.local[0]);
  const labels = (testid) =>
    page.getByTestId(testid).locator(".ant-form-item-label:visible");
  const widths = (locator) =>
    locator.evaluateAll((nodes) =>
      nodes.map((n) => n.getBoundingClientRect().width),
    );
  const equal = (values) => Math.max(...values) - Math.min(...values) < 1;
  async function settled() {
    await page.evaluate(
      () =>
        new Promise((r) =>
          requestAnimationFrame(() => requestAnimationFrame(r)),
        ),
    );
  }
  await labels("group-a").first().waitFor();
  await settled();
  const groupA = page
    .getByTestId("group-a")
    .locator(
      ":scope > .ant-form-item > .ant-form-item-row > .ant-form-item-label:visible",
    );
  const initial = await widths(groupA);
  assert.ok(equal(initial), `group and full-width rows align: ${initial}`);
  const smaller = (await widths(labels("group-b")))[0];
  assert.ok(
    smaller < 96 && smaller < initial[0],
    "short groups do not inherit another group's width",
  );
  assert.ok(
    (await widths(labels("nested")))[0] < initial[0],
    "nearest nested group is independent",
  );
  await page.getByRole("button", { name: "切换最长字段" }).click();
  await page.waitForFunction(
    (initialWidth) =>
      document
        .querySelector('[data-testid="group-a"] .ant-form-item-label')
        .getBoundingClientRect().width < initialWidth,
    initial[0],
  );
  const shrunk = (await widths(groupA))[0];
  await page.getByRole("button", { name: "切换动态字段" }).click();
  await page.waitForFunction(
    (previous) =>
      document
        .querySelector('[data-testid="group-a"] .ant-form-item-label')
        .getBoundingClientRect().width > previous,
    shrunk,
  );
  const beforeFont = (await widths(labels("group-b")))[0];
  await page.getByRole("button", { name: "切换字号" }).click();
  await page.waitForFunction(
    (previous) =>
      document
        .querySelector('[data-testid="group-b"] .ant-form-item-label')
        .getBoundingClientRect().width > previous,
    beforeFont,
  );
  await page.getByRole("button", { name: "切换字号" }).click();
  await settled();
  const beforeFamily = (await widths(labels("font-family")))[0];
  await page.getByRole("button", { name: "切换字体" }).click();
  await page.waitForFunction(
    (previous) =>
      document
        .querySelector('[data-testid="font-family"] .ant-form-item-label')
        .getBoundingClientRect().width < previous,
    beforeFamily,
  );
  await page.getByRole("button", { name: "切换字体" }).click();
  await settled();
  const content = await widths(labels("content"));
  assert.ok(content[0] < content[1] && content[0] < 96);
  const marks = await widths(labels("marks"));
  assert.ok(
    marks[1] > marks[0] + 15,
    "required marks and tooltip icons contribute to the natural width",
  );
  assert.ok(
    await page
      .getByTestId("isolation")
      .locator(":scope > .ant-form-item .ant-form-item-label")
      .evaluate((node) => node.getBoundingClientRect().width < 96),
    "nested forms do not affect parent label measurements",
  );
  assert.ok(
    await page
      .getByTestId("native-form")
      .locator(".ant-form-item-row")
      .evaluate((node) => !node.hasAttribute("data-adaptive-form-row")),
    "nested native forms keep their own layout",
  );
  for (const testid of ["report", "board"]) {
    const values = await widths(labels(testid));
    assert.equal(values.length, 2, `${testid}: no blank button label`);
    assert.ok(
      values[0] < values[1],
      `${testid}: parameters size independently`,
    );
    const tops = await page
      .getByTestId(testid)
      .locator(".ant-form-item-control-input")
      .evaluateAll((nodes) => nodes.map((n) => n.getBoundingClientRect().top));
    assert.ok(equal(tops), `${testid}: query button aligns with inputs`);
  }
  const long = await page.getByTestId("long").evaluate((root) => {
    const columns = [...root.querySelectorAll(".ant-form-item-label")];
    const label = columns[0].querySelector("label");
    return {
      widths: columns.map((n) => n.getBoundingClientRect().width),
      row: columns[0].parentElement.getBoundingClientRect().width,
      height: label.getBoundingClientRect().height,
      overflow: root.scrollWidth > root.clientWidth,
    };
  });
  assert.ok(
    equal(long.widths) &&
      long.widths[0] <= long.row * 0.4 + 1 &&
      long.height > 32 &&
      !long.overflow,
    JSON.stringify(long),
  );
  assert.ok(
    equal(await widths(labels("embedded"))),
    "embedded dataset labels align without metric workspace CSS",
  );
  await page.getByRole("button", { name: "保存", exact: true }).click();
  await page.getByText("请输入名称", { exact: true }).waitFor();
  await page
    .getByRole("textbox", { name: "名称", exact: true })
    .first()
    .fill("已填写");
  await page.getByRole("button", { name: "保存", exact: true }).click();
  await page.waitForFunction(
    () =>
      document.querySelector('[data-testid="submitted"]').textContent === "1",
  );
  for (let i = 0; i < 2; i++) {
    await page.getByRole("button", { name: "打开弹窗" }).click();
    const modalLabels = page
      .getByRole("dialog")
      .locator(".ant-form-item-label");
    await modalLabels.first().waitFor();
    await settled();
    assert.ok(equal(await widths(modalLabels)), "reopened modal labels align");
    await page
      .getByRole("dialog")
      .getByRole("button", { name: /Cancel|取\s*消/ })
      .click();
    await page.getByRole("dialog").waitFor({ state: "hidden" });
  }
  await page.setViewportSize({ width: 420, height: 1000 });
  await settled();
  assert.ok(
    equal(await widths(groupA)),
    "single-column layout retains group alignment",
  );
  assert.ok(
    await groupA.evaluateAll((nodes) =>
      nodes.every(
        (n) =>
          n.getBoundingClientRect().width <=
          n.parentElement.getBoundingClientRect().width * 0.4 + 1,
      ),
    ),
  );
  assert.deepEqual(errors, []);
  console.log(
    "Adaptive form browser checks passed: groups, dynamic fields, fonts, wrapping, validation, preview parameters and reopened modals.",
  );
} catch (error) {
  console.error(
    await page
      ?.locator("body")
      .innerText({ timeout: 2000 })
      .catch(() => "No rendered body"),
  );
  await page
    ?.screenshot({
      path: resolve(tmpdir(), "web2-adaptive-form-failure.png"),
      fullPage: true,
      timeout: 3000,
    })
    .catch(() => {});
  throw error;
} finally {
  await browser?.close();
  await server.close();
}
