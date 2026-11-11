#!/usr/bin/env node
import {
  existsSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, posix, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const VITE = "@module-federation/vite";
const RUNTIME = "@module-federation/runtime";
const MANAGED = [VITE, RUNTIME];
const SECTIONS = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
];
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const EXACT_VERSION =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[\da-zA-Z.-]+)?(?:\+[\da-zA-Z.-]+)?$/;

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const declares = (manifest, name) =>
  SECTIONS.some((section) => Object.hasOwn(manifest[section] ?? {}, name));
const packageAt = (key, name) =>
  key === `node_modules/${name}` || key.endsWith(`/node_modules/${name}`);

export function loadBaseline(root = ROOT) {
  const baseline = readJson(join(root, "mf-versions.json"));
  if (
    !baseline ||
    typeof baseline !== "object" ||
    Array.isArray(baseline) ||
    Object.keys(baseline).length !== MANAGED.length ||
    MANAGED.some(
      (name) =>
        typeof baseline[name] !== "string" ||
        !EXACT_VERSION.test(baseline[name]),
    )
  ) {
    throw new Error(
      "mf-versions.json 必须且只能声明 vite、runtime 两个包的精确版本。",
    );
  }
  return baseline;
}

export function discoverProjects(root = ROOT) {
  const paths = ["host"];
  if (!existsSync(join(root, "host/package.json")))
    throw new Error("缺少 host/package.json，拒绝不完整扫描。");
  for (const group of ["share", "remote"]) {
    const found = [];
    for (const entry of readdirSync(join(root, group), {
      withFileTypes: true,
    }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (
        entry.name.startsWith(".") ||
        entry.name === "node_modules" ||
        entry.name === "dist"
      )
        continue;
      const relativePath = `${group}/${entry.name}`;
      const dir = join(root, relativePath);
      if (entry.isSymbolicLink())
        throw new Error(
          `${relativePath}: 不支持符号链接项目，请使用真实项目目录。`,
        );
      if (!entry.isDirectory()) continue;
      if (existsSync(join(dir, "package.json"))) {
        found.push(relativePath);
      } else if (
        [
          "package-lock.json",
          "src",
          "vite.config.ts",
          "vite.config.js",
          "vite.config.mjs",
        ].some((name) => existsSync(join(dir, name)))
      ) {
        throw new Error(`${relativePath}: 存在项目文件但缺少 package.json。`);
      }
    }
    if (found.length === 0)
      throw new Error(`${group}: 未发现任何项目，拒绝空扫描。`);
    paths.push(...found);
  }
  return paths.map((relativePath) => {
    const dir = join(root, relativePath);
    return { dir, relativePath, manifest: readJson(join(dir, "package.json")) };
  });
}

export function npmCommand(args, { cwd, inheritOutput = false }) {
  // Use npm's current CLI when launched by npm run; no shell interpolation.
  const npmCli = process.env.npm_execpath;
  return spawnSync(
    npmCli ? process.execPath : "npm",
    npmCli ? [npmCli, ...args] : args,
    {
      cwd,
      env: process.env,
      encoding: "utf8",
      stdio: inheritOutput ? "inherit" : "pipe",
      maxBuffer: 32 * 1024 * 1024,
    },
  );
}

function resolveLockedDependency(packages, fromKey, name) {
  let current = fromKey;
  while (true) {
    const key = posix.join(current, "node_modules", name);
    if (Object.hasOwn(packages, key)) return packages[key];
    if (!current || current === ".") return undefined;
    current = posix.dirname(current);
  }
}

export function checkProject(
  project,
  baseline,
  { installed = false, runNpm = npmCommand } = {},
) {
  const errors = [];
  const report = (message) =>
    errors.push(`${project.relativePath}: ${message}`);
  try {
    const manifest = readJson(join(project.dir, "package.json"));
    if (!declares(manifest, VITE)) report(`缺少 ${VITE} 直接依赖。`);
    if (project.relativePath === "host" && !declares(manifest, RUNTIME)) {
      report(`Host 源码直接导入 ${RUNTIME}，必须显式声明该依赖。`);
    }
    for (const section of SECTIONS) {
      for (const name of MANAGED) {
        const actual = manifest[section]?.[name];
        if (actual !== undefined && actual !== baseline[name]) {
          report(
            `${section}.${name} 应为 ${baseline[name]}，实际为 ${actual}。`,
          );
        }
      }
    }
    const lock = readJson(join(project.dir, "package-lock.json"));
    if (![2, 3].includes(lock.lockfileVersion) || !lock.packages?.[""]) {
      report("需要包含 packages 根条目的 npm lockfileVersion 2 或 3 锁文件。");
      return errors;
    }
    for (const section of SECTIONS) {
      for (const name of MANAGED) {
        if (manifest[section]?.[name] !== lock.packages[""][section]?.[name]) {
          report(
            `package-lock.json 根声明 ${section}.${name} 与 package.json 不一致。`,
          );
        }
      }
    }
    for (const name of MANAGED) {
      if (
        declares(manifest, name) &&
        !Object.hasOwn(lock.packages, `node_modules/${name}`)
      ) {
        report(`package-lock.json 缺少直接依赖 ${name} 的顶层解析条目。`);
      }
      const entries = Object.entries(lock.packages).filter(([key]) =>
        packageAt(key, name),
      );
      if (entries.length === 0)
        report(`package-lock.json 缺少 ${name} 解析条目。`);
      for (const [key, item] of entries) {
        if (item.version !== baseline[name])
          report(
            `${key} 锁定 ${item.version ?? "未知版本"}，应为 ${baseline[name]}。`,
          );
        if (name === VITE) {
          if (item.dependencies?.[RUNTIME] !== baseline[RUNTIME]) {
            report(
              `${key} 要求 runtime ${item.dependencies?.[RUNTIME] ?? "未知"}，与基线 ${baseline[RUNTIME]} 不配套。`,
            );
          }
          if (
            resolveLockedDependency(lock.packages, key, RUNTIME)?.version !==
            baseline[RUNTIME]
          ) {
            report(
              `${key} 无法在锁文件中解析到 runtime ${baseline[RUNTIME]}。`,
            );
          }
        }
        if (installed) {
          const installedPath = join(project.dir, key, "package.json");
          if (!existsSync(installedPath))
            report(`${key} 尚未安装，请在该模块执行 npm ci。`);
          else if (readJson(installedPath).version !== baseline[name])
            report(`${key} 已安装版本与基线 ${baseline[name]} 不一致。`);
        }
      }
    }
    if (installed && existsSync(join(project.dir, "node_modules"))) {
      const result = runNpm(["ls", ...MANAGED, "--all", "--json"], {
        cwd: project.dir,
      });
      if (result.error || result.status !== 0)
        report("npm ls 检测到安装树缺失或无效依赖，请修复后重试。");
      if (result.stdout?.trim()) {
        const tree = JSON.parse(result.stdout);
        const visit = (node) => {
          for (const [name, dependency] of Object.entries(
            node.dependencies ?? {},
          )) {
            if (
              MANAGED.includes(name) &&
              dependency.version !== baseline[name]
            ) {
              report(
                `安装树中的 ${name}@${dependency.version ?? "未知"} 与基线 ${baseline[name]} 不一致。`,
              );
            }
            visit(dependency);
          }
        };
        visit(tree);
      }
    }
  } catch (error) {
    report(error.message);
  }
  return errors;
}

export function checkProjects(root = ROOT, options = {}) {
  try {
    const baseline = loadBaseline(root);
    const projects = discoverProjects(root);
    return {
      baseline,
      projects,
      errors: projects.flatMap((project) =>
        checkProject(project, baseline, options),
      ),
    };
  } catch (error) {
    return { baseline: null, projects: [], errors: [error.message] };
  }
}

function verifyTargetPair(root, projects, baseline, runNpm) {
  let metadata;
  for (const project of projects) {
    const path = join(project.dir, "node_modules", VITE, "package.json");
    if (existsSync(path)) {
      const candidate = readJson(path);
      if (candidate.name === VITE && candidate.version === baseline[VITE]) {
        metadata = candidate;
        break;
      }
    }
  }
  if (!metadata) {
    const result = runNpm(
      [
        "view",
        `${VITE}@${baseline[VITE]}`,
        "version",
        "dependencies",
        "--json",
      ],
      { cwd: root },
    );
    if (result.error || result.status !== 0)
      throw new Error(
        `无法读取目标插件元数据：${result.error?.message ?? result.stderr?.trim() ?? "npm view 失败"}`,
      );
    metadata = JSON.parse(result.stdout);
  }
  if (
    metadata.version !== baseline[VITE] ||
    metadata.dependencies?.[RUNTIME] !== baseline[RUNTIME]
  ) {
    throw new Error(
      `目标 vite ${baseline[VITE]} 要求 runtime ${metadata.dependencies?.[RUNTIME] ?? "未知"}，与基线 ${baseline[RUNTIME]} 不配套。请设置插件明确依赖的精确 runtime 版本。`,
    );
  }
}

export function upgradeProjects(root = ROOT, { runNpm = npmCommand } = {}) {
  const baseline = loadBaseline(root);
  const projects = discoverProjects(root);
  for (const project of projects) {
    if (!declares(project.manifest, VITE))
      throw new Error(
        `${project.relativePath}: 缺少 ${VITE}，请先声明依赖，升级未开始。`,
      );
    if (
      project.relativePath === "host" &&
      !declares(project.manifest, RUNTIME)
    ) {
      throw new Error(
        `host: 源码直接导入 ${RUNTIME}，请先声明依赖，升级未开始。`,
      );
    }
  }
  verifyTargetPair(root, projects, baseline, runNpm);
  console.log(
    `MF 配对已确认：vite ${baseline[VITE]} / runtime ${baseline[RUNTIME]}；共 ${projects.length} 个模块。`,
  );
  console.log(
    "安装使用 --ignore-scripts。若原生构建工具需要安装脚本，请按项目要求单独恢复。",
  );
  for (const [index, project] of projects.entries()) {
    const manifestPath = join(project.dir, "package.json");
    const lockPath = join(project.dir, "package-lock.json");
    const originalManifest = readFileSync(manifestPath);
    const originalLock = existsSync(lockPath) ? readFileSync(lockPath) : null;
    const manifest = JSON.parse(originalManifest.toString("utf8"));
    let changed = false;
    for (const section of SECTIONS) {
      for (const name of MANAGED) {
        if (
          Object.hasOwn(manifest[section] ?? {}, name) &&
          manifest[section][name] !== baseline[name]
        ) {
          manifest[section][name] = baseline[name];
          changed = true;
        }
      }
    }
    console.log(`[${index + 1}/${projects.length}] ${project.relativePath}`);
    try {
      if (changed)
        writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
      const result = runNpm(
        [
          "install",
          "--include=dev",
          "--ignore-scripts",
          "--no-audit",
          "--no-fund",
        ],
        { cwd: project.dir, inheritOutput: true },
      );
      if (result.error || result.status !== 0)
        throw new Error(
          result.error?.message ?? `npm install 退出码 ${result.status}`,
        );
      const errors = checkProject(project, baseline, {
        installed: true,
        runNpm,
      });
      if (errors.length) throw new Error(errors.join("\n"));
    } catch (error) {
      writeFileSync(manifestPath, originalManifest);
      if (originalLock === null) rmSync(lockPath, { force: true });
      else writeFileSync(lockPath, originalLock);
      throw new Error(
        `${project.relativePath} 升级失败；已恢复该模块 package.json/lock，先前成功模块保留。node_modules 可能已改变，修复原因后重跑 mf:upgrade。\n${error.message}`,
      );
    }
  }
  return { baseline, projects };
}

function main(args) {
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    console.log(
      "用法：\n  npm run mf:check                  检查所有模块声明和锁文件\n  npm run mf:check -- --installed   额外检查实际安装树\n  npm run mf:upgrade                按 mf-versions.json 更新并安装所有模块\n\n自动发现 host、share/*、remote/*；仅更新已有 MF 依赖。\n升级跳过安装脚本，原生工具如需初始化请按项目要求单独恢复。",
    );
    return;
  }
  const [command, ...flags] = args;
  if (
    !["check", "upgrade"].includes(command) ||
    flags.some((flag) => command !== "check" || flag !== "--installed")
  ) {
    throw new Error("未知命令或参数，请使用 --help 查看用法。");
  }
  if (command === "upgrade") {
    const { projects } = upgradeProjects();
    console.log(
      `MF 升级完成：${projects.length} 个模块通过声明、锁文件和安装树检查。`,
    );
  } else {
    const { projects, errors } = checkProjects(ROOT, {
      installed: flags.includes("--installed"),
    });
    if (errors.length)
      throw new Error(
        `MF 检查未通过：\n${errors.map((error) => `- ${error}`).join("\n")}`,
      );
    console.log(
      `MF 检查通过：${projects.length} 个模块${flags.includes("--installed") ? "（含安装树）" : ""}。`,
    );
  }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
