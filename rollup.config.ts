import dts from "rollup-plugin-dts";
import typescript from "@rollup/plugin-typescript";
import { createRequire, builtinModules } from "node:module";

const require = createRequire(import.meta.url);
const pkg = require("./package.json") as {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

const externalDeps = new Set<string>([
  ...builtinModules,
  ...builtinModules.map(m => `node:${m}`),
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.devDependencies ?? {}),
  ...Object.keys(pkg.optionalDependencies ?? {}),
  ...Object.keys(pkg.peerDependencies ?? {}),
]);

const external = Array.from(externalDeps);

export default [
  {
    // 主构建：输出 CJS 版本 JS
    input: "src/index.ts",
    output: {
      file: "dist/index.js",
      format: "esm",
      exports: "named",
    },
    external,
    plugins: [typescript()],
  },
  {
    // 声明构建：Rollup 专门生成 dist/index.d.ts
    input: "src/index.ts",
    output: {
      file: "dist/index.d.ts",
      format: "esm",
      exports: "named",
    },
    external,
    plugins: [dts()],
  },
];
