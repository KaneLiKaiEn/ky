import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { checkProjects, upgradeProjects } from "./mf-deps.mjs";

const VITE = "@module-federation/vite";
const RUNTIME = "@module-federation/runtime";
const baseline = { [VITE]: "1.20.7", [RUNTIME]: "2.8.2" };
const modulePaths = ["host", "share/comm", "remote/business"];

function writeJson(file, value) {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function editJson(root, relativePath, edit) {
  const file = path.join(root, relativePath);
  const value = JSON.parse(readFileSync(file, "utf8"));
  edit(value);
  writeJson(file, value);
}

function addProject(root, relativePath) {
  const manifest = {
    name: relativePath.replaceAll("/", "-"),
    private: true,
    version: "1.0.0",
    dependencies:
      relativePath === "host" ? { [RUNTIME]: baseline[RUNTIME] } : {},
    devDependencies: { [VITE]: baseline[VITE] },
  };
  writeJson(path.join(root, relativePath, "package.json"), manifest);
  writeJson(path.join(root, relativePath, "package-lock.json"), {
    name: manifest.name,
    version: manifest.version,
    lockfileVersion: 3,
    requires: true,
    packages: {
      "": manifest,
      [`node_modules/${VITE}`]: {
        version: baseline[VITE],
        dependencies: { [RUNTIME]: baseline[RUNTIME] },
      },
      [`node_modules/${RUNTIME}`]: { version: baseline[RUNTIME] },
    },
  });
}

function fixture(t) {
  const root = mkdtempSync(path.join(tmpdir(), "mf-deps-test-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  writeJson(path.join(root, "mf-versions.json"), baseline);
  for (const relativePath of modulePaths) addProject(root, relativePath);
  return root;
}

async function expectInvalid(root, modulePath) {
  const result = await checkProjects(root);
  assert.ok(
    result.errors.length > 0,
    "Invalid repository must fail the dependency check",
  );
  if (modulePath) {
    assert.ok(
      result.errors.some((error) => error.includes(modulePath)),
      `Diagnostics must identify ${modulePath}: ${result.errors.join("\n")}`,
    );
  }
  return result;
}

test("a complete compatible repository passes without installing dependencies", async (t) => {
  const root = fixture(t);
  // Existing non-project directories must not require a package manifest.
  mkdirSync(path.join(root, "share/data"));
  mkdirSync(path.join(root, "share/misc"));
  const result = await checkProjects(root);
  assert.deepEqual(result.errors, []);
  assert.equal(result.projects.length, 3);
});

test("new modules are automatically checked without changing a project allowlist", async (t) => {
  const root = fixture(t);
  addProject(root, "remote/new-module");
  assert.equal((await checkProjects(root)).projects.length, 4);
  editJson(root, "remote/new-module/package.json", (pkg) => {
    pkg.devDependencies[VITE] = "1.20.1";
  });
  await expectInvalid(root, "remote/new-module");
});

test("a caret range is rejected even when its lockfile currently resolves the baseline", async (t) => {
  const root = fixture(t);
  for (const file of ["package.json", "package-lock.json"]) {
    editJson(root, `share/comm/${file}`, (value) => {
      (file === "package.json" ? value : value.packages[""]).devDependencies[
        VITE
      ] = "^1.20.7";
    });
  }
  await expectInvalid(root, "share/comm");
});

test("a stale lockfile root declaration cannot pass with correct resolved versions", async (t) => {
  const root = fixture(t);
  editJson(root, "remote/business/package-lock.json", (lock) => {
    lock.packages[""].devDependencies[VITE] = "1.20.1";
  });
  await expectInvalid(root, "remote/business");
});

test("a nested older runtime is detected even when top-level packages match", async (t) => {
  const root = fixture(t);
  editJson(root, "remote/business/package-lock.json", (lock) => {
    lock.packages[`node_modules/another-plugin/node_modules/${RUNTIME}`] = {
      version: "2.8.1",
    };
  });
  await expectInvalid(root, "remote/business");
});

test("the plugin runtime requirement must agree with the configured runtime pair", async (t) => {
  const root = fixture(t);
  editJson(root, "share/comm/package-lock.json", (lock) => {
    lock.packages[`node_modules/${VITE}`].dependencies[RUNTIME] = "2.8.1";
  });
  await expectInvalid(root, "share/comm");
});

test("Host explicit runtime declaration is checked against the baseline", async (t) => {
  const root = fixture(t);
  editJson(root, "host/package.json", (pkg) => {
    pkg.dependencies[RUNTIME] = "2.8.1";
  });
  editJson(root, "host/package-lock.json", (lock) => {
    lock.packages[""].dependencies[RUNTIME] = "2.8.1";
  });
  await expectInvalid(root, "host");
});

test("Host cannot silently lose its explicit runtime dependency", async (t) => {
  const root = fixture(t);
  editJson(
    root,
    "host/package.json",
    (pkg) => delete pkg.dependencies[RUNTIME],
  );
  editJson(
    root,
    "host/package-lock.json",
    (lock) => delete lock.packages[""].dependencies[RUNTIME],
  );
  await expectInvalid(root, "host");
});

test("a project missing its lockfile fails with the affected project in diagnostics", async (t) => {
  const root = fixture(t);
  rmSync(path.join(root, "share/comm/package-lock.json"));
  await expectInvalid(root, "share/comm");
});

test("a project cannot pass after both plugin declaration and locked plugin are removed", async (t) => {
  const root = fixture(t);
  editJson(
    root,
    "remote/business/package.json",
    (pkg) => delete pkg.devDependencies[VITE],
  );
  editJson(root, "remote/business/package-lock.json", (lock) => {
    delete lock.packages[""].devDependencies[VITE];
    delete lock.packages[`node_modules/${VITE}`];
  });
  await expectInvalid(root, "remote/business");
});

test("lockfile missing a resolved MF dependency fails instead of checking only declarations", async (t) => {
  const root = fixture(t);
  editJson(root, "share/comm/package-lock.json", (lock) => {
    delete lock.packages[`node_modules/${RUNTIME}`];
  });
  await expectInvalid(root, "share/comm");
});

test("a nested plugin cannot substitute for the missing direct plugin in the lockfile", async (t) => {
  const root = fixture(t);
  editJson(root, "remote/business/package-lock.json", (lock) => {
    lock.packages[`node_modules/another-plugin/node_modules/${VITE}`] =
      lock.packages[`node_modules/${VITE}`];
    delete lock.packages[`node_modules/${VITE}`];
  });
  await expectInvalid(root, "remote/business");
});

test("an empty repository cannot report a successful zero-project check", async (t) => {
  const root = fixture(t);
  for (const directory of ["host", "share", "remote"]) {
    rmSync(path.join(root, directory), { recursive: true });
  }
  await expectInvalid(root);
});

test("source-bearing modules missing a manifest are not silently skipped", async (t) => {
  const root = fixture(t);
  mkdirSync(path.join(root, "remote/incomplete/src"), { recursive: true });
  writeFileSync(
    path.join(root, "remote/incomplete/src/main.ts"),
    "export {};\n",
  );
  await expectInvalid(root, "remote/incomplete");
});

test("a baseline with a version range fails before giving a false compatible result", async (t) => {
  const root = fixture(t);
  editJson(root, "mf-versions.json", (value) => {
    value[VITE] = "^1.20.7";
  });
  await expectInvalid(root);
});

test("installed checking requires local packages even if npm reports matching versions elsewhere", async (t) => {
  const root = fixture(t);
  const result = await checkProjects(root, {
    installed: true,
    runNpm: () => ({
      status: 0,
      stdout: JSON.stringify({
        dependencies: {
          [VITE]: { version: baseline[VITE] },
          [RUNTIME]: { version: baseline[RUNTIME] },
        },
      }),
      stderr: "",
    }),
  });
  assert.ok(
    result.errors.length > 0,
    "Missing local node_modules must not pass installed verification",
  );
});

test("installed checking detects a nested stale runtime reported by npm", async (t) => {
  const root = fixture(t);
  for (const relativePath of modulePaths) {
    writeJson(
      path.join(root, relativePath, "node_modules", VITE, "package.json"),
      {
        name: VITE,
        version: baseline[VITE],
        dependencies: { [RUNTIME]: baseline[RUNTIME] },
      },
    );
    writeJson(
      path.join(root, relativePath, "node_modules", RUNTIME, "package.json"),
      {
        name: RUNTIME,
        version: baseline[RUNTIME],
      },
    );
  }
  const result = await checkProjects(root, {
    installed: true,
    runNpm: () => ({
      status: 0,
      stdout: JSON.stringify({
        dependencies: {
          [VITE]: { version: baseline[VITE] },
          [RUNTIME]: { version: baseline[RUNTIME] },
          "another-plugin": {
            dependencies: { [RUNTIME]: { version: "2.8.1" } },
          },
        },
      }),
      stderr: "",
    }),
  });
  assert.ok(
    result.errors.length > 0,
    "Nested installed runtime drift must fail verification",
  );
  assert.match(result.errors.join("\n"), /2\.8\.1/);
});

test("an incompatible published plugin/runtime pair is rejected before any project is rewritten", (t) => {
  const root = fixture(t);
  editJson(root, "share/comm/package.json", (pkg) => {
    pkg.devDependencies[VITE] = "1.20.1";
  });
  const original = readFileSync(
    path.join(root, "share/comm/package.json"),
    "utf8",
  );
  let installs = 0;
  const runNpm = (args) => {
    if (args[0] === "install") installs += 1;
    assert.equal(args[0], "view");
    return {
      status: 0,
      stdout: JSON.stringify({
        version: baseline[VITE],
        dependencies: { [RUNTIME]: "2.8.1" },
      }),
      stderr: "",
    };
  };
  assert.throws(() => upgradeProjects(root, { runNpm }));
  assert.equal(installs, 0);
  assert.equal(
    readFileSync(path.join(root, "share/comm/package.json"), "utf8"),
    original,
  );
});

test("a failed first installation restores original manifest and lockfile bytes and leaves other modules untouched", (t) => {
  const root = fixture(t);
  const originalFiles = new Map();
  for (const relativePath of modulePaths) {
    editJson(root, `${relativePath}/package.json`, (pkg) => {
      pkg.devDependencies[VITE] = "1.20.1";
      if (pkg.dependencies[RUNTIME]) pkg.dependencies[RUNTIME] = "2.8.1";
      pkg.dependencies["unrelated-business-dependency"] = "^3.2.1";
    });
    editJson(root, `${relativePath}/package-lock.json`, (lock) => {
      lock.packages[""].devDependencies[VITE] = "1.20.1";
      if (lock.packages[""].dependencies[RUNTIME])
        lock.packages[""].dependencies[RUNTIME] = "2.8.1";
      lock.packages[`node_modules/${VITE}`].version = "1.20.1";
      lock.packages[`node_modules/${VITE}`].dependencies[RUNTIME] = "2.8.1";
      lock.packages[`node_modules/${RUNTIME}`].version = "2.8.1";
    });
    for (const name of ["package.json", "package-lock.json"]) {
      const file = path.join(root, relativePath, name);
      originalFiles.set(file, readFileSync(file, "utf8"));
    }
  }
  let installs = 0;
  const runNpm = (args, { cwd }) => {
    if (args[0] === "view") {
      return {
        status: 0,
        stdout: JSON.stringify({
          version: baseline[VITE],
          dependencies: { [RUNTIME]: baseline[RUNTIME] },
        }),
        stderr: "",
      };
    }
    assert.equal(
      args[0],
      "install",
      `Unexpected npm command: ${args.join(" ")}`,
    );
    installs += 1;
    // npm may have written a partial lockfile before failing.
    writeFileSync(
      path.join(cwd, "package-lock.json"),
      '{"partiallyWritten": true}\n',
    );
    return {
      status: 1,
      stdout: "",
      stderr: "Simulated npm installation failure",
    };
  };
  assert.throws(() => upgradeProjects(root, { runNpm }));
  assert.equal(
    installs,
    1,
    "The upgrade must stop after the first failed installation",
  );
  for (const [file, original] of originalFiles) {
    assert.equal(
      readFileSync(file, "utf8"),
      original,
      `File must remain unchanged after failure: ${file}`,
    );
  }
});

test("an interrupted upgrade can be rerun to converge all modules while preserving unrelated dependencies", async (t) => {
  const root = fixture(t);
  for (const relativePath of modulePaths) {
    editJson(root, `${relativePath}/package.json`, (pkg) => {
      pkg.devDependencies[VITE] = "1.20.1";
      if (pkg.dependencies[RUNTIME]) pkg.dependencies[RUNTIME] = "2.8.1";
      pkg.dependencies["business-library"] = "^4.2.0";
    });
  }
  const commFile = path.join(root, "share/comm/package.json");
  const remoteFile = path.join(root, "remote/business/package.json");
  const originalComm = readFileSync(commFile, "utf8");
  const originalRemote = readFileSync(remoteFile, "utf8");
  let failOnce = true;
  const runNpm = (args, { cwd }) => {
    if (args[0] === "view") {
      return {
        status: 0,
        stderr: "",
        stdout: JSON.stringify({
          version: baseline[VITE],
          dependencies: { [RUNTIME]: baseline[RUNTIME] },
        }),
      };
    }
    if (args[0] === "ls") {
      return {
        status: 0,
        stderr: "",
        stdout: JSON.stringify({
          dependencies: {
            [VITE]: { version: baseline[VITE] },
            [RUNTIME]: { version: baseline[RUNTIME] },
          },
        }),
      };
    }
    assert.equal(args[0], "install");
    if (cwd === path.join(root, "share/comm") && failOnce) {
      failOnce = false;
      return { status: 1, stdout: "", stderr: "Temporary npm failure" };
    }
    const manifest = JSON.parse(
      readFileSync(path.join(cwd, "package.json"), "utf8"),
    );
    editJson(cwd, "package-lock.json", (lock) => {
      lock.packages[""] = manifest;
      lock.packages[`node_modules/${VITE}`] = {
        version: baseline[VITE],
        dependencies: { [RUNTIME]: baseline[RUNTIME] },
      };
      lock.packages[`node_modules/${RUNTIME}`] = { version: baseline[RUNTIME] };
    });
    writeJson(path.join(cwd, "node_modules", VITE, "package.json"), {
      name: VITE,
      version: baseline[VITE],
      dependencies: { [RUNTIME]: baseline[RUNTIME] },
    });
    writeJson(path.join(cwd, "node_modules", RUNTIME, "package.json"), {
      name: RUNTIME,
      version: baseline[RUNTIME],
    });
    return { status: 0, stdout: "", stderr: "" };
  };
  assert.throws(() => upgradeProjects(root, { runNpm }), /share\/comm/);
  assert.equal(
    JSON.parse(readFileSync(path.join(root, "host/package.json"), "utf8"))
      .devDependencies[VITE],
    baseline[VITE],
  );
  assert.equal(
    readFileSync(commFile, "utf8"),
    originalComm,
    "Failed project must be restored",
  );
  assert.equal(
    readFileSync(remoteFile, "utf8"),
    originalRemote,
    "Unvisited project must not be rewritten",
  );

  upgradeProjects(root, { runNpm });
  assert.deepEqual(
    (await checkProjects(root, { installed: true, runNpm })).errors,
    [],
  );
  for (const relativePath of modulePaths) {
    const pkg = JSON.parse(
      readFileSync(path.join(root, relativePath, "package.json"), "utf8"),
    );
    assert.equal(pkg.dependencies["business-library"], "^4.2.0");
  }
});
