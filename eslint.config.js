import js from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist',
      'coverage',
      'node_modules',
      'playwright-report',
      '.husky',
      'public/mockServiceWorker.js',
      'e2e',
    ],
  },

  // Base config for all TS/TSX
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommendedTypeChecked],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      'import/resolver': {
        typescript: { project: ['tsconfig.app.json', 'tsconfig.node.json'] },
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y,
      import: importPlugin,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,

      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // Golden rule #3 — no `any`, prefer unknown + narrowing.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],

      // Golden rule #4 — no raw console.* (logger only). Overridden in logger/.
      'no-console': 'error',

      // Golden rule #7 — no cross-feature deep imports; only via the feature barrel.
      // Golden rule #5 — no import.meta.env outside src/config (handled below + by config override).
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/*/*'],
              message:
                'Import features only via their public barrel: @/features/<name>. Deep imports are forbidden (CLAUDE.md §3.7).',
            },
            {
              group: ['../*/features/*', '../../features/*/*'],
              message: 'Use the @/features/<name> barrel, not relative cross-feature paths.',
            },
          ],
        },
      ],
    },
  },

  // Golden rule #2 — UI library (@mui/*, @emotion/*) only inside shared/ui and the theme.
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/shared/ui/**', 'src/shared/theme/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@mui/*', '@emotion/*'],
              message:
                'Do not import the UI library directly. Use wrappers from @/shared/ui (CLAUDE.md §3.2).',
            },
            {
              group: ['@/features/*/*'],
              message: 'Import features only via their public barrel: @/features/<name>.',
            },
          ],
        },
      ],
    },
  },

  // Logger is the one place console is allowed.
  {
    files: ['src/shared/logger/**/*.{ts,tsx}'],
    rules: { 'no-console': 'off' },
  },

  // Provider modules intentionally co-locate a provider component + its hook/constants.
  {
    files: [
      'src/shared/theme/ThemeProvider.tsx',
      'src/shared/feature-flags/FeatureFlagProvider.tsx',
    ],
    rules: { 'react-refresh/only-export-components': 'off' },
  },

  // Tests and config may use devDependencies / node globals freely.
  {
    files: ['**/*.{test,spec}.{ts,tsx}', 'src/test/**', '**/*.config.{ts,js}'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-restricted-imports': 'off',
    },
  },
);
