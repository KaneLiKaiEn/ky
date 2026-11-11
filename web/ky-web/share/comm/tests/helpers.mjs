import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";

export const commSource = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../src",
);

/** Resolve test imports to the same sources exposed by federation. No remote server is needed. */
export function sourceModules({
  base = commSource,
  overrides = {},
  globals = {},
} = {}) {
  const cache = new Map();
  const requireLocal = createRequire(resolve(base, "test-loader.cjs"));
  function load(name, from = base) {
    if (name in overrides) return overrides[name];
    let path = ["comm/resource", "comm/management", "comm/utils", "comm/theme"].includes(name)
      ? resolve(commSource, name.slice(5))
      : name.startsWith("@/")
        ? resolve(base, name.slice(2))
        : name.startsWith(".")
          ? resolve(from, name)
          : name;
    if (!path.startsWith("/")) return requireLocal(name);
    if (path in overrides) return overrides[path];
    const alias = `@/${path.slice(base.length + 1)}`;
    if (path.startsWith(`${base}/`) && alias in overrides)
      return overrides[alias];
    if (!existsSync(path) || !statSync(path).isFile())
      path =
        [".ts", ".tsx", "/index.ts", "/index.tsx"]
          .map((extension) => path + extension)
          .find(existsSync) ?? path;
    if (path in overrides) return overrides[path];
    if (cache.has(path)) return cache.get(path).exports;
    const module = { exports: {} };
    cache.set(path, module);
    const code = ts.transpileModule(readFileSync(path, "utf8"), {
      fileName: path,
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        jsx: ts.JsxEmit.ReactJSX,
      },
    }).outputText;
    vm.runInNewContext(
      code,
      {
        module,
        exports: module.exports,
        require: (dependency) => load(dependency, dirname(path)),
        Error,
        Date,
        Set,
        Map,
        URL,
        URLSearchParams,
        Blob,
        Uint8Array,
        TextDecoder,
        AbortController,
        atob,
        btoa,
        structuredClone,
        setTimeout,
        clearTimeout,
        window: { location: { origin: "https://example.test" } },
        ...globals,
      },
      { filename: path },
    );
    return module.exports;
  }
  return load;
}

/** Deterministic state/effect scheduling, including cleanup and StrictMode effect replay. */
export function hookHarness() {
  let index = 0,
    pending = [],
    changed = false,
    mounted = true;
  const slots = [];
  function effect(callback, deps) {
    const i = index++,
      previous = slots[i];
    if (!previous || deps.some((dep, n) => !Object.is(dep, previous.deps[n]))) {
      pending.push(() => {
        previous?.cleanup?.();
        slots[i] = { deps, effect: callback, cleanup: callback() };
      });
    }
  }
  const react = {
    useRef(initial) {
      return (slots[index++] ??= { current: initial });
    },
    useState(initial) {
      const i = index++;
      if (!(i in slots))
        slots[i] = typeof initial === "function" ? initial() : initial;
      return [
        slots[i],
        (next) => {
          if (!mounted) throw new Error("state updated after unmount");
          const value = typeof next === "function" ? next(slots[i]) : next;
          if (!Object.is(value, slots[i])) {
            slots[i] = value;
            changed = true;
          }
        },
      ];
    },
    useEffect: effect,
    useLayoutEffect: effect,
    useContext: (context) => context.value,
    useMemo(create, deps) {
      const i = index++;
      if (!slots[i] || deps.some((dep, n) => !Object.is(dep, slots[i].deps[n])))
        slots[i] = { deps, value: create() };
      return slots[i].value;
    },
    useCallback(callback, deps) {
      const i = index++;
      if (!slots[i] || deps.some((dep, n) => !Object.is(dep, slots[i].deps[n])))
        slots[i] = { deps, callback };
      return slots[i].callback;
    },
  };
  return {
    react,
    render(fn) {
      let result,
        rounds = 0;
      do {
        changed = false;
        index = 0;
        pending = [];
        result = fn();
        pending.forEach((commit) => commit());
        if (++rounds > 20) throw new Error("unstable hook");
      } while (changed);
      return result;
    },
    replayEffects() {
      const effects = slots.filter((slot) => slot?.effect);
      effects.forEach((slot) => slot.cleanup?.());
      effects.forEach((slot) => {
        slot.cleanup = slot.effect();
      });
    },
    unmount() {
      mounted = false;
      slots.forEach((slot) => slot?.cleanup?.());
    },
  };
}

export const flush = () => new Promise(setImmediate);
export const plain = (value) => JSON.parse(JSON.stringify(value));
export function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
