import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'
import tseslint from 'typescript-eslint'

/**
 * Shared ESLint flat config for the whole monorepo. Each project runs
 * `eslint .` from its own directory; ESLint walks up to find this file.
 * apps/mobile has its own `eslint.config.js` that layers eslint-config-expo
 * on top of this baseline.
 *
 * typescript-eslint's *recommended* (not *recommended-type-checked*) rules
 * are used deliberately so linting never needs a full type build — that keeps
 * `nx affected -t lint` fast in CI.
 */
export default tseslint.config(
  // Build output, generated code, and vendored files — never linted.
  {
    ignores: [
      '**/dist/**',
      '**/out-tsc/**',
      '**/.output/**',
      '**/.nx/**',
      '**/.expo/**',
      '**/storybook-static/**',
      '**/node_modules/**',
      'convex/_generated/**',
      'apps/web/src/routeTree.gen.ts',
      'apps/web/worker-configuration.d.ts',
    ],
  },

  // JavaScript + TypeScript recommended baselines for every source file.
  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['**/*.{ts,tsx,mts,cts,js,mjs,cjs,jsx}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      // Allow intentionally-unused identifiers when prefixed with `_`.
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },

  // React layer — applies wherever JSX/TSX lives (web app, storybook, and the
  // React packages). Headless packages have no JSX and are unaffected.
  {
    files: ['**/*.{jsx,tsx}'],
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: 'detect' } },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      // React 19's automatic JSX runtime — no need for React in scope.
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
      // TypeScript already enforces prop typing.
      'react/prop-types': 'off',
      // Apostrophes/quotes in copy are readable as-is; escaping them hurts
      // more than it helps.
      'react/no-unescaped-entities': 'off',
    },
  },

  // Storybook `render` functions are components in disguise (lowercase name),
  // so the rules-of-hooks heuristic misfires on the hooks they legitimately
  // call. Relax it for story files only.
  {
    files: ['**/*.stories.{ts,tsx}'],
    rules: {
      'react-hooks/rules-of-hooks': 'off',
    },
  },

  // Must stay last: disables stylistic rules that would fight Prettier.
  prettier,
)
