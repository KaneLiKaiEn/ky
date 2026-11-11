import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import { mkdir } from "node:fs/promises";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "../../../host/node_modules/@tailwindcss/vite/dist/index.mjs";
import { chromium } from "playwright-core";

const screenshots = resolve(tmpdir(), "web2-theme-checks");
await mkdir(screenshots, { recursive: true });

const here = fileURLToPath(new URL("./theme", import.meta.url));
const root = resolve(here, "../../../..");
const server = await createServer({
  configFile: false,
  root: here,
  plugins: [react(), tailwind()],
  resolve: {
    alias: {
      "comm/theme": resolve(root, "share/comm/src/theme.ts"),
      "comm/session": resolve(root, "share/comm/src/session.ts"),
      "comm/request": resolve(root, "share/data/tests/forms/request.ts"),
      "@/api/auth": resolve(root, "remote/login/src/api/auth.ts"),
    },
    dedupe: ["react", "react-dom", "antd", "react-router-dom"],
  },
  server: { host: "127.0.0.1", port: 0, fs: { allow: [root] } },
});
let browser, appServer;
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
  const page = await browser.newPage({
    viewport: { width: 1280, height: 1000 },
    colorScheme: "light",
  });
  page.setDefaultTimeout(15000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const origin = server.resolvedUrls.local[0];
  await page.goto(origin);
  await page.getByTestId("host").waitFor();
  const mode = () => page.getByTestId("host").getAttribute("data-mode");
  assert.equal(await mode(), "light");
  await page.emulateMedia({ colorScheme: "dark" });
  await page.waitForFunction(
    () => document.documentElement.dataset.theme === "dark",
  );
  assert.equal(await mode(), "dark");
  for (const appearance of ["light", "dark"]) {
    await page.getByLabel("明暗模式").selectOption(appearance);
    for (const primary of ["#1677ff", "#389e0d", "#d46b08"]) {
      await page.getByLabel("品牌色").selectOption(primary);
      const host = await page.getByTestId("host").evaluate((node) => ({
        mode: node.dataset.mode,
        primary: node.dataset.primary,
        bg: node.dataset.bg,
        variable: getComputedStyle(node).getPropertyValue("--mw-primary"),
        appVariable: getComputedStyle(node).getPropertyValue(
          "--app-theme-primary",
        ),
        root: document.documentElement.style.getPropertyValue(
          "--app-theme-primary",
        ),
      }));
      assert.equal(host.mode, appearance);
      assert.equal(host.variable, host.primary);
      assert.equal(host.appVariable, host.primary);
      assert.equal(host.root, host.primary);
      assert.equal(
        await page.getByTestId("dashboard").getAttribute("data-mode"),
        "dark",
      );
      await page
        .getByRole("button", { name: "打开宿主弹窗", exact: true })
        .click();
      await page.getByTestId("host-modal").waitFor();
      assert.equal(
        await page.getByTestId("host-modal").getAttribute("data-mode"),
        appearance,
      );
      assert.equal(
        await page.getByTestId("host-modal").getAttribute("data-bg"),
        host.bg,
      );
      assert.equal(
        await page
          .getByTestId("host-modal")
          .evaluate((n) =>
            getComputedStyle(n).getPropertyValue("--mw-primary"),
          ),
        host.primary,
      );
      await page
        .getByRole("button", { name: "打开嵌套宿主弹窗", exact: true })
        .click();
      await page.getByTestId("nested-modal").waitFor();
      assert.equal(
        await page.getByTestId("nested-modal").getAttribute("data-mode"),
        appearance,
      );
      assert.equal(
        await page.getByTestId("nested-modal").getAttribute("data-bg"),
        host.bg,
      );
      await page
        .getByRole("dialog", { name: "嵌套宿主弹窗", exact: true })
        .getByRole("button", { name: "Close", exact: true })
        .click();
      await page
        .getByRole("dialog", { name: "宿主弹窗", exact: true })
        .getByRole("button", { name: "Close", exact: true })
        .click();
    }
    const signed = page.locator(".receive-row-signed > td");
    await page.mouse.move(0, 0);
    assert.equal(
      await signed.evaluate((n) => getComputedStyle(n).backgroundColor),
      await signed.evaluate((n) => {
        const probe = document.createElement("i");
        probe.style.color = getComputedStyle(n).getPropertyValue(
          "--app-theme-success-bg",
        );
        n.append(probe);
        const color = getComputedStyle(probe).color;
        probe.remove();
        return color;
      }),
    );
    await signed.hover();
    await page.waitForFunction(() => {
      const cell = document.querySelector(".receive-row-signed > td");
      const expected = document.createElement("i");
      expected.style.color = getComputedStyle(cell).getPropertyValue(
        "--app-theme-success-bg-hover",
      );
      cell.append(expected);
      const matches =
        getComputedStyle(cell).backgroundColor ===
        getComputedStyle(expected).color;
      expected.remove();
      return matches;
    });
  }
  await page.getByRole("button", { name: "打开局部弹窗", exact: true }).click();
  await page.getByTestId("local-modal").waitFor();
  const localBackground = await page
    .getByTestId("local")
    .getAttribute("data-bg");
  assert.equal(
    await page.getByTestId("local-modal").getAttribute("data-bg"),
    localBackground,
  );
  assert.equal(
    await page
      .getByTestId("local-modal")
      .evaluate((n) => getComputedStyle(n).getPropertyValue("--mw-surface")),
    localBackground,
  );
  await page
    .getByRole("dialog", { name: "局部弹窗", exact: true })
    .getByRole("button", { name: "Close", exact: true })
    .click();
  await page.getByRole("button", { name: "打开局部抽屉", exact: true }).click();
  await page.getByTestId("local-drawer").waitFor();
  assert.equal(
    await page
      .getByTestId("local-drawer")
      .evaluate((n) => getComputedStyle(n).getPropertyValue("--mw-surface")),
    localBackground,
  );
  await page
    .getByRole("dialog", { name: "局部抽屉", exact: true })
    .getByRole("button", { name: "Close", exact: true })
    .click();
  const shell = () =>
    page.evaluate(() => {
      const s = getComputedStyle(document.body);
      return [s.margin, s.overflow, s.fontFamily, s.backgroundColor, s.color];
    });
  const before = await shell();
  await page.getByRole("button", { name: "加载子应用样式" }).click();
  await page.waitForFunction(
    () =>
      document.querySelector('[data-testid="loaded"]').textContent === "true",
  );
  assert.deepEqual(await shell(), before);
  assert.equal(
    await page
      .getByTestId("visit")
      .locator(".inline-flex")
      .evaluate((n) => getComputedStyle(n).display),
    "inline-flex",
  );
  assert.equal(
    await page.getByTestId("visit").getByRole("button").isDisabled(),
    true,
  );
  assert.notEqual(
    await page
      .getByTestId("host-disabled")
      .evaluate((n) => getComputedStyle(n).color),
    await page.getByTestId("host").evaluate((n) => getComputedStyle(n).color),
  );
  await page.screenshot({
    path: resolve(screenshots, "theme-desktop.png"),
    fullPage: true,
  });
  assert.ok(
    await page
      .getByTestId("visit")
      .locator("svg")
      .first()
      .evaluate((node) => node.getBoundingClientRect().width > 0),
  );
  await page.setViewportSize({ width: 375, height: 320 });
  await page.goto(origin + "?login=1");
  await page.locator(".login-page").waitFor();
  assert.equal(
    await page.locator(".login-page").getAttribute("data-theme"),
    "dark",
  );
  assert.ok(
    await page.locator(".login-page").evaluate((node) => {
      const overflowing = node.scrollHeight > node.clientHeight;
      node.scrollTop = node.scrollHeight;
      return (
        overflowing &&
        node.scrollTop > 0 &&
        getComputedStyle(node).overflowY === "auto"
      );
    }),
    "short login screens must allow the form to scroll",
  );
  await page.locator(".login-page__submit-btn").scrollIntoViewIfNeeded();
  const submit = await page.locator(".login-page__submit-btn").boundingBox();
  assert.ok(submit.y >= 0 && submit.y + submit.height <= 320);
  await page.screenshot({
    path: resolve(screenshots, "theme-login.png"),
    fullPage: true,
  });
  appServer = await createServer({
    configFile: resolve(root, "remote/board/tests/preview/vite.config.ts"),
    server: { port: 4297, strictPort: true },
  });
  await appServer.listen();
  const boardOrigin = appServer.resolvedUrls.local[0];
  await page.setViewportSize({ width: 1280, height: 900 });
  for (const base of ["#000", "#000000", "#0c1220"]) {
    await page.goto(
      boardOrigin +
        "board/board-preview?board_id=23&theme=dark&theme_test=1&base=" +
        encodeURIComponent(base),
    );
    await page.waitForFunction(() => {
      const requests = JSON.parse(
        document.documentElement.dataset.previewThemes || "[]",
      );
      return [501, 502].every((id) =>
        requests.some((request) => request.id === id),
      );
    });
    let requests = await page.evaluate(() =>
      JSON.parse(document.documentElement.dataset.previewThemes),
    );
    assert.ok(
      requests.every((request) => request.mode === "dark"),
      `background and component use explicit dark mode for ${base}`,
    );
    const beforeCount = requests.length;
    await page.getByLabel("看板明暗模式").selectOption("light");
    await page.waitForFunction((beforeCount) => {
      const requests = JSON.parse(
        document.documentElement.dataset.previewThemes || "[]",
      ).slice(beforeCount);
      return [501, 502].every((id) =>
        requests.some(
          (request) => request.id === id && request.mode === "light",
        ),
      );
    }, beforeCount);
    requests = await page.evaluate(() =>
      JSON.parse(document.documentElement.dataset.previewThemes),
    );
    assert.ok(
      requests.slice(beforeCount).every((request) => request.mode === "light"),
      "mode changes invalidate both request keys",
    );
  }
  await page.screenshot({
    path: resolve(screenshots, "theme-board.png"),
    fullPage: true,
  });
  assert.deepEqual(errors, []);
  console.log(
    "Theme browser checks passed: system updates, 6 brand/mode combinations, scopes, portals, signed rows, utility loading, visit, mobile login and board request modes/cache invalidation for 3 dark bases.",
  );
} finally {
  await browser?.close();
  await appServer?.close();
  await server.close();
}
