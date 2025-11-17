# import-length-order

Sort `import`/`export` statements by length, with `type-only` imports first and shorter statements prioritized.

## Rule Details

This rule automatically sorts import/export statement blocks at the top of a file, following this priority:

1. **Priority 1**: `type-only` imports/exports (`import type` or `export type`)
2. **Priority 2**: Regular imports/exports

Within the same priority level, statements are sorted by length from shortest to longest. Benefits include:

- ✅ Clear separation between type and runtime imports
- ✅ Easier to locate imports (shorter ones first)
- ✅ Follows modern TypeScript best practices
- ✅ Automatically handles specifiers sorting

## Examples

### ❌ Incorrect

```js
import { veryLongNamedImport, a } from 'module';
import type { TypeA, TypeB } from 'types';
import { b } from 'lib';
import type { Config } from './config';
```

### ✅ Correct

```js
import type { Config } from './config';
import type { TypeA, TypeB } from 'types';
import { b } from 'lib';
import { veryLongNamedImport, a } from 'module';
```

### Specifiers Sorting

Specifiers inside braces are also automatically sorted by length:

```js
// Before
import { veryLongSpecifierName, b, abc } from 'pkg';

// After
import { b, abc, veryLongSpecifierName } from 'pkg';
```

## Options

```ts
type Options = {
  groupType?: boolean;      // Group type-only imports at front (default: true)
  ignoreNames?: string[];   // Module names to ignore from sorting
  maxLines?: number;        // Max lines in import block (default: 50)
};
```

### `groupType` (default: `true`)

Controls whether `type-only` imports are grouped at the front.

```js
/* groupType: true */
import type { T } from 'types';
import { a } from 'lib';

/* groupType: false */
import { a } from 'lib';
import type { T } from 'types';
```

### `ignoreNames` (default: `[]`)

Specifies module names whose imports should keep their original order and not be sorted.

```js
/* ignoreNames: ['react', '@/utils'] */
import { VeryLongComponentName } from 'react';   // Unchanged
import { z } from 'zod';                        // Sorted
import { a } from 'lib';                        // Sorted
import { LongUtilName } from '@/utils';         // Unchanged
```

### `maxLines` (default: `50`)

Sets the maximum number of lines for an import block. Blocks exceeding this limit won't be auto-sorted.

## Configuration Examples

### ESLint Flat Config

```ts
import { importLengthOrderRule } from '@senran/eslint-config/rules';

export default [
  {
    rules: {
      'senran/import-length-order': [
        'warn',
        {
          groupType: true,
          ignoreNames: ['react', 'vue'],
          maxLines: 50,
        },
      ],
    },
  },
];
```

## When To Use This Rule

**Enable this rule if you want to:**

- Automatically organize import statements
- Separate type-only imports from runtime imports
- Quickly locate imports

**Disable this rule if:**

- Your team uses other import sorting tools
- You need custom sorting logic

## Related Rules

This rule works well with:

- [`import/order`](https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/order.md) - Sort by import path
- [`simple-import-sort`](https://github.com/lydell/eslint-plugin-simple-import-sort) - Simplified import sorting
- [`@typescript-eslint`](https://typescript-eslint.io/) - TypeScript related checks

## Fixable

This rule is fixable with ESLint's `--fix` option:

```bash
eslint --fix src/
```

## Important Notes

⚠️ **Key Points**:

1. This rule only processes continuous import/export blocks at the top of files
2. The block ends when any other statement is encountered
3. Comments and blank lines are preserved
4. Indentation format is maintained
5. Import blocks exceeding `maxLines` won't be modified

```js
// This part will be processed
import { a } from 'lib';
import { b } from 'lib2';

// Other code here
const x = 1;

// This import won't be processed
import { c } from 'lib3';
```

## Performance

Minimal performance impact:

- Only analyzes import blocks at file top
- Uses efficient string matching
- Caches computation results

## Further Reading

- [ESLint Rules Documentation](https://eslint.org/docs/rules/)
- [TypeScript import type](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-8.html#type-only-imports-exports)
