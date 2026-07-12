import expoConfig from 'eslint-config-expo/flat.js'

/**
 * Mobile ESLint config. `expo lint` (the app's `lint` script) discovers this
 * file.
 *
 * eslint-config-expo is a complete flat-config preset that already bundles the
 * same typescript-eslint + react + react-hooks baselines as the repo root
 * (`../../eslint.config.mjs`), tuned for React Native. Concatenating the root
 * on top throws "Cannot redefine plugin" because both presets register those
 * plugin namespaces with different instances, so instead we layer Expo's
 * preset and re-apply the one repo-wide convention we care about: allowing
 * `_`-prefixed identifiers to be unused.
 */
export default [
  ...expoConfig,
  {
    ignores: ['.expo/**', 'expo-env.d.ts'],
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      // Match the repo baseline: apostrophes in copy read fine unescaped.
      'react/no-unescaped-entities': 'off',
    },
  },
]
