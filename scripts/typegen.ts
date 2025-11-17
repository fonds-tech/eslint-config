import fs from "node:fs/promises";
import { Linter } from "eslint";
import { flatConfigsToRulesDTS } from "eslint-typegen/core";
import {
  jsx,
  vue,
  node,
  test,
  toml,
  yaml,
  jsdoc,
  jsonc,
  react,
  solid,
  nextjs,
  regexp,
  svelte,
  unocss,
  combine,
  imports,
  unicorn,
  comments,
  markdown,
  stylistic,
  formatters,
  javascript,
  typescript,
  perfectionist,
  sortPackageJson,
} from "../src";

const configs = await combine(
  { plugins: { "": { rules: Object.fromEntries(new Linter({ configType: "eslintrc" }).getRules()) } } },
  comments(),
  formatters(),
  imports(),
  javascript(),
  jsx({ a11y: true }),
  jsdoc(),
  jsonc(),
  markdown(),
  node(),
  perfectionist(),
  nextjs(),
  react(),
  solid(),
  sortPackageJson(),
  stylistic(),
  svelte(),
  test(),
  toml(),
  regexp(),
  typescript(),
  unicorn(),
  unocss(),
  vue(),
  yaml(),
);

const names = configs.map(i => i.name).filter(Boolean);

let dts = await flatConfigsToRulesDTS(configs, { includeAugmentation: false });

dts += `
export type ConfigNames = ${names.map(name => `'${name}'`).join(" | ")}
`;

await fs.writeFile("src/types/typegen.d.ts", dts);
