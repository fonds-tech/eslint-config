# @fonds/eslint-config

<div align='left'>
<b>English</b> | <a href="./README.md">简体中文</a>
<br>
</div>

A flat ESLint configuration maintained by the Fonds Tech team, published as `@fonds/eslint-config`, covering TypeScript, Vue, React, Svelte, Astro, UnoCSS, and formatter
integrations with a composable factory.

## Project Overview

`@fonds/eslint-config` exposes a factory function named `fonds()` plus a full set of typed helpers. The goal is to offer a batteries-included ESLint flat config that:

> 📚 Looking for more details? Check [`docs/`](./docs/index.md) for structured guides.

- Detects framework needs (Vue, React, Svelte, Astro) and TypeScript automatically when possible.
- Uses `FlatConfigComposer` to merge internal defaults with user overrides and extra configs.
- Ships a CLI that scaffolds `eslint.config.ts`, `package.json` scripts, and VS Code settings.

## Feature Highlights

- **Composable factory** – call `fonds(options, ...userConfigs)` to layer presets, overrides, and typed configs.
- **Auto plugin renaming** – refreshes plugin keys (`@typescript-eslint` → `ts`, etc.) for human-readable rule references.
- **Editor-aware behavior** – disables expensive fixers (e.g., `unused-imports/no-unused-imports`) when running in IDEs.
- **Multi-format support** – optional `formatters` block enables Prettier/dprint for CSS, Markdown, Astro, etc.
- **Extensive ecosystem coverage** – includes integrations for pnpm catalog, UnoCSS, Astro, Markdown code fencing, TOML/YAML/JSONC.
- **Interactive CLI** – `npx @fonds/eslint-config` asks about framework + extras and migrates configs safely.

## Installation

```bash
# Install the config
pnpm add -D @fonds/eslint-config

# Install core peer dependencies (eslint plus essential plugins)
pnpm add -D eslint eslint-plugin-antfu eslint-plugin-import-lite eslint-plugin-unused-imports eslint-plugin-unicorn

# Add framework-specific peers when needed (examples)
pnpm add -D typescript @typescript-eslint/parser @typescript-eslint/eslint-plugin
pnpm add -D vue eslint-plugin-vue eslint-processor-vue-blocks
pnpm add -D @eslint-react/eslint-plugin eslint-plugin-react-hooks eslint-plugin-react-refresh
```

> Check `peerDependencies` in `package.json` for the full list, especially when enabling Astro, Svelte, UnoCSS, or formatters.

## Quick Start

```ts
// eslint.config.ts
import fonds from "@fonds/eslint-config"

export default fonds(
  {
    typescript: {
      tsconfigPath: "./tsconfig.json", // Allow TypeScript-aware linting on project files.
    },
    vue: {
      sfcBlocks: true, // Create virtual files so <script setup> and style blocks get linted.
    },
    react: false, // Disable frameworks you do not use to skip unnecessary peers.
    formatters: {
      markdown: "prettier", // Delegate Markdown formatting to Prettier through eslint-plugin-format.
    },
    lessOpinionated: true, // Toggle off some highly opinionated stylistic picks from this preset.
  },
  {
    files: ["src/**/*.ts"],
    rules: {
      "ts/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
      "import/order": "off", // Example override that applies after the core config is composed.
    },
  },
)
```

### Custom formatter options

Setting `formatters: true` auto-enables every supported formatter. To override Prettier settings without losing that convenience, pass an object and provide `prettierOptions`—any
language toggle you omit keeps its default autodetected value:

```ts
const config = {
  formatters: {
    prettierOptions: {
      printWidth: 180,
      arrowParens: "always",
      proseWrap: "always",
      trailingComma: "all",
    },
  },
}
```

With this snippet, `format/prettier` keeps formatting CSS/HTML/Markdown/etc. while respecting the custom wrapping rules.

- Pass global options in the first argument (no `files` allowed there).
- Provide extra flat-config objects afterward to target specific globs or add plugins.

## Configuration Options

| Option                                          | Default              | Notes                                                                                                 |
| ----------------------------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------- |
| `typescript`                                    | auto-detect          | Set `true` or object to configure parser, type-aware files, `tsconfigPath`, or erasable-only rules.   |
| `jsx` / `react` / `nextjs` / `solid` / `svelte` | `false`              | Enable per-framework JSX or component lint rules once matching peers are installed.                   |
| `vue`                                           | auto-detect Vue deps | Accepts `OptionsVue`; toggles Vue 2/3 rules, SFC block processing, and optional a11y plugin.          |
| `astro`                                         | `false`              | Requires `eslint-plugin-astro`; pair with `formatters.astro` for Prettier support.                    |
| `unocss`                                        | `false`              | Enables UnoCSS attributify + strict mode toggles via `OptionsUnoCSS`.                                 |
| `formatters`                                    | `false`              | Activates external formatting through `eslint-plugin-format`; choose Prettier or dprint per language. |
| `pnpm`                                          | `false`              | Experimental pnpm catalog/glob awareness for monorepos.                                               |
| `autoRenamePlugins`                             | `true`               | Keeps plugin names short once configs are composed.                                                   |
| `lessOpinionated`                               | `false`              | Disables select stylistic rules such as `antfu/if-newline`.                                           |
| `isInEditor`                                    | auto                 | Force-enable or disable IDE-specific safe mode.                                                       |

See `src/types.ts` for every option interface if you need deeper customization.

## CLI Usage

Run the interactive helper anywhere you want to adopt the config:

```bash
npx @fonds/eslint-config
```

Key flags:

- `--yes, -y` – skip prompts and accept defaults.
- `--template <vue|react|svelte|astro>` – preset framework integrations.
- `--extra <formatter|perfectionist|unocss>` – add optional utilities.

The CLI updates `package.json` scripts, creates or patches `eslint.config.ts`, and can optionally tweak `.vscode/settings.json` for best-in-class editor support. It aborts when
`eslint.config.js` already exists to avoid conflicts.

## Scripts & Development

The `package.json` scripts power local development:

- `pnpm build` – generate type definitions via `tsx scripts/typegen.ts` then compile with `tsdown`.
- `pnpm dev` / `pnpm watch` – run `tsdown --watch` for rapid iteration.
- `pnpm test` – execute Vitest to ensure config utilities work as expected.
- `pnpm lint` – lint repository sources (self-hosted config).
- `pnpm gen` – refresh type and version metadata.
- `pnpm docs:dev` – run the VitePress docs locally.
- `pnpm docs:build` – build the static documentation site.

## Acknowledgements

This project builds upon the excellent work in [@antfu/eslint-config](https://github.com/antfu/eslint-config) and extends it with Fonds Tech–specific conventions. Huge thanks to
the upstream maintainers.

## License & Maintainers

- License: [MIT](LICENSE)
- Maintainers: [fonds-tech](https://github.com/fonds-tech)
