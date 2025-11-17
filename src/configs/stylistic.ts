import type { OptionsOverrides, StylisticConfig, TypedFlatConfigItem } from '../types'
import { pluginFonds } from '../plugins'
import { interopDefault } from '../utils'

export const StylisticConfigDefaults: StylisticConfig = {
  indent: 2,
  jsx: true,
  quotes: 'single',
  semi: false,
}

export interface StylisticOptions extends StylisticConfig, OptionsOverrides {
  lessOpinionated?: boolean
}

export async function stylistic(
  options: StylisticOptions = {},
): Promise<TypedFlatConfigItem[]> {
  const {
    indent,
    jsx,
    lessOpinionated = false,
    overrides = {},
    quotes,
    semi,
  } = {
    ...StylisticConfigDefaults,
    ...options,
  }

  const pluginStylistic = await interopDefault(import('@stylistic/eslint-plugin'))

  const config = pluginStylistic.configs.customize({
    indent,
    jsx,
    pluginName: 'style',
    quotes,
    semi,
  }) as TypedFlatConfigItem

  return [
    {
      name: 'fonds/stylistic/rules',
      plugins: {
        antfu: pluginFonds,
        style: pluginStylistic,
      },
      rules: {
        ...config.rules,

        'antfu/consistent-chaining': 'error',
        'antfu/consistent-list-newline': 'error',

        ...(lessOpinionated
          ? {
              curly: ['error', 'all'],
            }
          : {
              'antfu/curly': 'error',
              'antfu/if-newline': 'error',
              'antfu/top-level-function': 'error',
            }
        ),

        'style/generator-star-spacing': ['error', { after: true, before: false }],
        'style/yield-star-spacing': ['error', { after: true, before: false }],

        ...overrides,
      },
    },
  ]
}
