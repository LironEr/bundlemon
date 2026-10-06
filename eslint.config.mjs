import nx from '@nx/eslint-plugin';
import jest from 'eslint-plugin-jest';
import eslintConfigPrettier from 'eslint-config-prettier';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import jsoncEslintParser from 'jsonc-eslint-parser';

export default [
  prettierRecommended,
  ...nx.configs['flat/base'],
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: [],
          depConstraints: [
            {
              sourceTag: '*',
              onlyDependOnLibsWithTags: ['*'],
            },
          ],
        },
      ],
    },
  },
  ...nx.configs['flat/typescript'],
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.*?.json',
      },
    },
    rules: {
      ...eslintConfigPrettier.rules,
      'no-extra-semi': 'off',
    },
  },
  ...nx.configs['flat/javascript'],
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          ignoreRestSiblings: true,
          argsIgnorePattern: '^_',
          // typescript-eslint v8 changed the default to 'all'; keep the pre-upgrade behavior
          caughtErrors: 'none',
        },
      ],
      // Dropped from the typescript-eslint v8 recommended set, keep enforcing it as before
      '@typescript-eslint/no-var-requires': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['**/*.js', '**/*.jsx'],
    rules: {
      'no-extra-semi': 'off',
      // Newly enabled for JS files by the typescript-eslint v8 preset; was not enforced before the upgrade
      'prefer-const': 'off',
    },
  },
  {
    files: ['**/*.json'],
    // Override or add rules here
    rules: {},
    languageOptions: {
      parser: jsoncEslintParser,
    },
  },
  {
    ...jest.configs['flat/recommended'],
    files: ['**/__tests__/**/*.spec.ts'],
    rules: {
      ...jest.configs['flat/recommended'].rules,
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      'jest/no-disabled-tests': 'off',
    },
  },
  {
    // .eslintignore patterns were gitignore-style (matched at any depth), flat config needs explicit `**/`
    ignores: ['**/.nx', '**/dist/', '**/__tests__/**/assets', '**/.vercel', 'apps/service/api/'],
  },
];
