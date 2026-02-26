// @ts-check
// Equivalente a .eslintrc.js (mismas reglas y overrides).
// Diferencias: airbnb-typescript/base no incluido (incompatible con typescript-eslint v8);
// @typescript-eslint/space-before-blocks no existe en v8, se usa solo space-before-blocks.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';
import { defineConfig } from 'eslint/config';
import importPlugin from 'eslint-plugin-import';
import noOnlyTests from 'eslint-plugin-no-only-tests';
import tseslint from 'typescript-eslint';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: __dirname });

export default defineConfig(
  {
    ignores: [
      'node_modules/',
      'jspm_packages/',
      'lib/',
      '.serverless/',
      '.webpack/',
      'coverage/',
      'swagger/',
      'scripts/**/*.js',
      'mocha.hooks.js',
      'dist/',
    ],
  },
  // airbnb-typescript/base no incluido: incompatible con typescript-eslint v8 en flat config (regla brace-style)
  ...compat.extends('airbnb-base', 'plugin:import/recommended', 'plugin:import/typescript'),
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    plugins: {
      import: importPlugin,
      'no-only-tests': noOnlyTests,
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
      globals: {
        describe: 'readonly',
        it: 'readonly',
        before: 'readonly',
        after: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
      },
    },
    settings: {
      'import/resolver': {
        typescript: true,
        node: true,
      },
    },
    rules: {
      'import/extensions': ['warn', 'never', { json: 'always' }],
      'import/no-extraneous-dependencies': [
        'error',
        {
          devDependencies: [
            'src/**/*.test.ts',
            'src/**/*.test.utils.ts',
            'src/**/*-factory.ts',
            'src/commons/tests/**/*.ts',
            'tests/**/*.ts',
          ],
          packageDir: __dirname,
        },
      ],
      'import/order': [
        'error',
        { groups: [['builtin', 'external']], 'newlines-between': 'never' },
      ],
      'import/prefer-default-export': 'off',
      'max-len': [
        'error',
        { code: 100, ignoreStrings: true, ignoreComments: true, ignoreUrls: true },
      ],
      'semi': ['error', 'always'],
      'comma-dangle': ['error', 'always-multiline'],
      'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0 }],
      'no-console': 'error',
      'space-before-blocks': 'error',
      // @typescript-eslint/space-before-blocks: en .eslintrc sí; en typescript-eslint v8 no existe (solo space-before-blocks)
      'no-only-tests/no-only-tests': 'error',
      'no-loss-of-precision': 'off',
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
    },
  },
  {
    files: ['**/handlers/**/index.test.ts'],
    rules: {
      'global-require': 'off',
    },
  },
  {
    files: ['**/*.test.ts', '**/*.test.utils.ts'],
    rules: {
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['**/serverless.ts'],
    rules: {
      'import/no-import-module-exports': 'off',
      'no-template-curly-in-string': 'off',
    },
  },
  {
    files: ['src/utils/logger.ts'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['src/types/supabase.ts'],
    rules: {
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
  {
    files: ['src/commons/integrations/sii/types/get-dte-deatiles-response.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
);
