// @ts-check
// ESLint flat config for Next.js frontend.
// Rules adapted from suplAI-backend eslint.config.js.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';
import { defineConfig, globalIgnores } from 'eslint/config';
import importPlugin from 'eslint-plugin-import';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import tseslint from 'typescript-eslint';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = defineConfig(
  // Next.js recommended configs
  ...nextVitals,
  ...nextTs,
  // Override default ignores
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'node_modules/',
    'coverage/',
  ]),
  // Airbnb base + import plugin (via compat for ESLint 9)
  ...compat.extends(
    'airbnb-base',
    'plugin:import/recommended',
    'plugin:import/typescript',
  ),
  // typescript-eslint recommended
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      import: importPlugin,
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    settings: {
      'import/resolver': {
        typescript: true,
        node: true,
      },
    },
    rules: {
      // --- Import rules (from backend) ---
      'import/extensions': ['warn', 'never', { json: 'always' }],
      'import/no-extraneous-dependencies': [
        'error',
        {
          devDependencies: [
            '**/*.test.ts',
            '**/*.test.tsx',
            '**/*.spec.ts',
            '**/*.spec.tsx',
          ],
          packageDir: __dirname,
        },
      ],
      'import/order': [
        'error',
        { groups: [['builtin', 'external']], 'newlines-between': 'never' },
      ],
      'import/prefer-default-export': 'off',

      // --- Style rules (from backend) ---
      'max-len': [
        'error',
        { code: 100, ignoreStrings: true, ignoreComments: true, ignoreUrls: true },
      ],
      'semi': ['error', 'always'],
      'comma-dangle': ['error', 'always-multiline'],
      'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0 }],
      'no-console': 'error',
      'space-before-blocks': 'error',

      // --- TypeScript rules (from backend) ---
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        { allowExpressions: true },
      ],
      '@typescript-eslint/no-shadow': 'error',
      '@typescript-eslint/no-loss-of-precision': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // --- React / Next.js specific adjustments ---
      // Allow JSX in .tsx files
      'react/jsx-filename-extension': 'off',
      // Next.js handles <a> inside <Link>, no need for href on <a>
      'jsx-a11y/anchor-is-valid': 'off',
    },
  },
  // shadcn/ui auto-generated components — relax strict rules
  {
    files: ['src/components/ui/**/*.tsx', 'src/hooks/**/*.ts'],
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-shadow': 'off',
      'no-shadow': 'off',
      'no-param-reassign': 'off',
      'no-use-before-define': 'off',
      'max-len': 'off',
      'import/order': 'off',
    },
  },
  // Test file overrides (from backend)
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
    rules: {
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
);

export default eslintConfig;
